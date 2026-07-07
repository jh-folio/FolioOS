"""Company universe, alias matching, and SEC/DART lookup utilities."""
import os
import json
import re
import urllib.request
from pathlib import Path

from features.common.utils import normalize, read_json, write_json
from features.llm_settings.client import sec_user_agent
from features.company_analysis.dart_client import dart_api_key, resolve_dart_company

ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = ROOT / "data"
CONFIG_DIR = ROOT / "config"
SEC_CACHE_DIR = DATA_DIR / "sec-cache"
SEC_TICKER_CACHE_PATH = SEC_CACHE_DIR / "company_tickers.json"
COMPANY_MASTER_PATH = CONFIG_DIR / "company_master.json"
COMPANY_ALIASES_PATH = CONFIG_DIR / "company_aliases.json"

# Module-level SEC index caches — populated lazily on first use
_SEC_TICKER_IDX = None  # ticker -> entry dict
_SEC_NAME_IDX = None    # first_distinctive_word -> entry dict

# Tokens that look like tickers but aren't company symbols
_TICKER_BLOCKLIST = frozenset({
    # Financial metrics
    "EPS", "PE", "PB", "PEG", "ROE", "ROA", "ROI", "FCF", "DCF",
    "EBIT", "EBITDA", "CAPEX", "OPEX", "YOY", "QOQ", "TTM", "LTM",
    "CAGR", "NPV", "IRR", "WACC", "NAV", "AUM", "BPS",
    # Technology abbreviations
    "AI", "ML", "NLP", "LLM", "GPU", "CPU", "API", "SDK", "IOT",
    "AR", "VR", "IT", "IS", "IP", "SWE",
    # C-suite / deal terms
    "CEO", "CFO", "COO", "CTO", "CMO", "IPO", "SPO", "SPAC", "VC",
    "ETF", "ADR", "REIT",
    # Currencies / country codes
    "USD", "EUR", "GBP", "JPY", "CNY", "KRW", "AUD", "CAD", "HKD",
    "US", "UK", "EU", "UN", "EM", "FX",
    # Regulators / institutions
    "SEC", "FTC", "DOJ", "FDA", "IMF", "FED", "ECB", "BOJ", "PBOC",
    # Quarter / period labels
    "Q1", "Q2", "Q3", "Q4", "H1", "H2", "FY", "YTD",
    # Legal suffixes
    "LLC", "LTD", "INC", "CORP", "PLC",
    # Explicitly non-ticker from existing code
    "LOSS", "GAIN", "NOTE", "FORM", "ITEM", "PAGE", "CASH", "DEBT", "RISK",
    "NYSE", "AMEX", "OTC",
})

# First words of company names too generic to match reliably
_GENERIC_NAME_WORDS = frozenset({
    "american", "national", "general", "united", "international", "first",
    "global", "new", "north", "south", "east", "west", "enterprise",
    "capital", "financial", "digital", "smart", "advanced", "integrated",
    "allied", "applied", "central", "federal", "liberty", "online",
    "universal", "western", "eastern", "pacific", "atlantic", "community",
    "state", "city", "open", "net", "data", "cloud",
})

_SEC_SUFFIX_RE = re.compile(
    r"\s*\b(inc\.?|corp\.?|incorporated|corporation|co\.?|company|ltd\.?|limited|"
    r"plc|sa|ag|nv|bv|holdings?|group|technologies|technology|systems?|services?|"
    r"solutions?|industries|resources?|properties|enterprises?|partners?|"
    r"associates?|therapeutics|pharmaceuticals?|biosciences?|bancorp|bancshares?)\b.*$",
    flags=re.I,
)

# Matches standalone 3-5 uppercase-letter sequences (potential tickers)
_TICKER_RE = re.compile(r"(?<![A-Za-z])([A-Z]{3,5})(?![A-Za-z])")

TRUSTED_SOURCES = {
    "Reuters": 10,
    "Bloomberg": 10,
    "WSJ": 10,
    "Barron's": 10,
    "Financial Times": 10,
    "CNBC": 8,
    "MarketWatch": 7,
    "한국경제": 9,
    "매일경제": 9,
    "연합인포맥스": 9,
    "User Archive": 5,
}

COMPANIES = [
    {"name": "NVIDIA", "aliases": ["엔비디아", "NVDA", "Nvidia"], "ticker": "NVDA", "sector": "Semiconductors", "market": "US", "cik": "0001045810"},
    {"name": "Dell Technologies", "aliases": ["Dell", "DELL", "델"], "ticker": "DELL", "sector": "Hardware", "market": "US", "cik": "0001571996"},
    {"name": "Apple", "aliases": ["애플", "AAPL"], "ticker": "AAPL", "sector": "Consumer Technology", "market": "US", "cik": "0000320193"},
    {"name": "Microsoft", "aliases": ["마이크로소프트", "MSFT"], "ticker": "MSFT", "sector": "Software", "market": "US", "cik": "0000789019"},
    {"name": "Tesla", "aliases": ["테슬라", "TSLA"], "ticker": "TSLA", "sector": "EV", "market": "US", "cik": "0001318605"},
    {"name": "Amazon", "aliases": ["아마존", "AMZN"], "ticker": "AMZN", "sector": "Internet", "market": "US", "cik": "0001018724"},
    {"name": "Alphabet", "aliases": ["구글", "Google", "GOOGL", "GOOG"], "ticker": "GOOGL", "sector": "Internet", "market": "US", "cik": "0001652044"},
    {"name": "Meta", "aliases": ["메타", "META"], "ticker": "META", "sector": "Internet", "market": "US", "cik": "0001326801"},
    {"name": "AMD", "aliases": ["Advanced Micro Devices"], "ticker": "AMD", "sector": "Semiconductors", "market": "US", "cik": "0000002488"},
    {"name": "Broadcom", "aliases": ["Broadcom Inc.", "AVGO", "브로드컴"], "ticker": "AVGO", "sector": "Semiconductors", "market": "US", "cik": "0001730168"},
    {"name": "TSMC", "aliases": ["Taiwan Semiconductor", "TSM"], "ticker": "TSM", "sector": "Semiconductors", "market": "US"},
    {"name": "Uber", "aliases": ["우버", "UBER"], "ticker": "UBER", "sector": "Mobility", "market": "US", "cik": "0001543151"},
    {"name": "Samsung Electronics", "aliases": ["삼성전자", "005930", "Samsung"], "ticker": "005930", "sector": "Semiconductors", "market": "KR"},
    {"name": "Samsung Electro-Mechanics", "aliases": ["삼성전기", "009150"], "ticker": "009150", "sector": "Electronic Components", "market": "KR"},
    {"name": "SK hynix", "aliases": ["SK하이닉스", "000660", "하이닉스"], "ticker": "000660", "sector": "Semiconductors", "market": "KR"},
    {"name": "POSCO Future M", "aliases": ["포스코퓨처엠", "003670"], "ticker": "003670", "sector": "Battery", "market": "KR"},
    {"name": "Hyundai Motor", "aliases": ["현대차", "005380"], "ticker": "005380", "sector": "Automobiles", "market": "KR"},
    {"name": "Kia", "aliases": ["기아", "000270"], "ticker": "000270", "sector": "Automobiles", "market": "KR"},
    {"name": "LG Energy Solution", "aliases": ["LG에너지솔루션", "373220", "LG엔솔"], "ticker": "373220", "sector": "Battery", "market": "KR"},
]


def normalize_company_entry(row):
    row = row or {}
    name = str(row.get("name") or row.get("company") or "").strip()
    ticker = str(row.get("ticker") or row.get("symbol") or "").strip().upper()
    aliases = row.get("aliases", [])
    if isinstance(aliases, str):
        aliases = [aliases]
    aliases = [str(a).strip() for a in aliases if str(a).strip()]
    if ticker and ticker not in aliases:
        aliases.append(ticker)
    if name and name not in aliases:
        aliases.append(name)
    return {
        "name": name or ticker,
        "ticker": ticker or name,
        "sector": str(row.get("sector") or row.get("industry") or "Unclassified").strip() or "Unclassified",
        "market": str(row.get("market") or row.get("exchange") or "").strip(),
        "cik": str(row.get("cik") or row.get("cik_str") or "").strip(),
        "aliases": sorted(set(aliases), key=lambda v: (len(v), v.lower())),
    }


def company_public(row):
    out = {k: row.get(k, "") for k in ["name", "ticker", "sector", "market", "cik"]}
    if row.get("corpCode"):
        out["corpCode"] = row.get("corpCode", "")
    return out


def read_company_rows(path):
    data = read_json(path, [])
    if isinstance(data, dict):
        data = data.get("companies", [])
    if not isinstance(data, list):
        return []
    return [normalize_company_entry(row) for row in data if isinstance(row, dict)]


def ensure_company_files():
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    if not COMPANY_MASTER_PATH.exists():
        write_json(COMPANY_MASTER_PATH, {
            "description": "Company master used for local tagging. Add listed companies here when you want deterministic matching.",
            "companies": COMPANIES,
        })
    if not COMPANY_ALIASES_PATH.exists():
        write_json(COMPANY_ALIASES_PATH, {
            "description": "User corrections and aliases. Entries here override/extend company_master.json.",
            "companies": [
                {"name": "McKesson Corporation", "ticker": "MCK", "sector": "Healthcare", "market": "US", "cik": "0000927653", "aliases": ["McKesson", "NYSE:MCK", "MCK"]},
            ],
        })


def _load_sec_indexes():
    """Build ticker and name lookup indexes from SEC company_tickers.json. Downloads if not cached."""
    global _SEC_TICKER_IDX, _SEC_NAME_IDX
    if _SEC_TICKER_IDX is not None:
        return
    data = read_json(SEC_TICKER_CACHE_PATH, None)
    rows = list(_sec_company_rows(data))
    if not rows:
        try:
            SEC_CACHE_DIR.mkdir(parents=True, exist_ok=True)
            req = urllib.request.Request(
                "https://www.sec.gov/files/company_tickers.json",
                headers={"User-Agent": sec_user_agent(), "Accept-Encoding": "identity"},
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            write_json(SEC_TICKER_CACHE_PATH, data)
            rows = list(_sec_company_rows(data))
        except Exception:
            pass
    if not rows:
        _SEC_TICKER_IDX = {}
        _SEC_NAME_IDX = {}
        return
    ticker_idx = {}
    name_idx = {}
    for row in rows:
        ticker = str(row.get("ticker", "")).strip().upper()
        title = str(row.get("title", "")).strip()
        cik = str(row.get("cik_str", "") or "").strip().zfill(10)
        if not ticker or not title or len(ticker) < 2:
            continue
        entry = {"name": title, "ticker": ticker, "cik": cik, "sector": "Unclassified", "market": "US"}
        ticker_idx[ticker] = entry
        # Index first distinctive word of company name for text scanning
        clean = _SEC_SUFFIX_RE.sub("", title).strip()
        parts = clean.lower().split()
        first = parts[0] if parts else ""
        if len(first) >= 7 and first not in _GENERIC_NAME_WORDS and first.isalpha():
            if first not in name_idx:
                name_idx[first] = entry
    _SEC_TICKER_IDX = ticker_idx
    _SEC_NAME_IDX = name_idx


def _sec_company_rows(data):
    """Yield dict rows from SEC company_tickers-style payloads.

    The canonical SEC file is a dict keyed by ordinal strings, but local cache
    files can be malformed or manually edited. Invalid rows are ignored so
    startup indexing never fails on a single bad cache value.
    """
    if isinstance(data, dict):
        if any(key in data for key in ("ticker", "title", "cik_str")):
            rows = [data]
        else:
            rows = data.values()
    elif isinstance(data, list):
        rows = data
    else:
        rows = []
    for row in rows:
        if isinstance(row, dict):
            yield row


def _sec_enrich(ticker_str):
    """Return a normalized entry from SEC data for ticker_str, or None."""
    _load_sec_indexes()
    ticker = str(ticker_str or "").strip().upper()
    if not ticker or not _SEC_TICKER_IDX:
        return None
    entry = _SEC_TICKER_IDX.get(ticker)
    return normalize_company_entry(entry) if entry else None


def _find_sec_companies_in_text(text):
    """Find companies by scanning text for SEC tickers and distinctive company names."""
    _load_sec_indexes()
    if not _SEC_TICKER_IDX:
        return []
    found = []
    seen = set()
    normalized = normalize(text)

    # --- Ticker scan: count ALL_CAPS 3-5 letter sequences ---
    ticker_counts: dict = {}
    title_tickers: set = set()
    for m in _TICKER_RE.finditer(normalized):
        t = m.group(1)
        ticker_counts[t] = ticker_counts.get(t, 0) + 1
    # Title area (first 400 chars) needs only 1 occurrence
    for m in _TICKER_RE.finditer(normalized[:400]):
        title_tickers.add(m.group(1))

    for ticker, count in ticker_counts.items():
        if ticker in _TICKER_BLOCKLIST:
            continue
        if count < 2 and ticker not in title_tickers:
            continue
        entry = _SEC_TICKER_IDX.get(ticker)
        if entry:
            found.append(normalize_company_entry(entry))
            seen.add(ticker)

    # --- Name scan: match first distinctive word of company names ---
    hay = normalized.lower()
    for word, entry in _SEC_NAME_IDX.items():
        if entry.get("ticker") in seen:
            continue
        if word not in hay:
            continue
        if re.search(rf"(?<![a-z]){re.escape(word)}(?![a-z])", hay):
            found.append(normalize_company_entry(entry))
            seen.add(entry.get("ticker", word))

    return found


def company_universe():
    ensure_company_files()
    merged = {}
    for row in [*COMPANIES, *read_company_rows(COMPANY_MASTER_PATH), *read_company_rows(COMPANY_ALIASES_PATH)]:
        c = normalize_company_entry(row)
        key = c.get("ticker") or c.get("name")
        if not key:
            continue
        existing = merged.get(key, {})
        aliases = sorted(set(existing.get("aliases", []) + c.get("aliases", [])), key=lambda v: (len(v), v.lower()))
        merged_row = {**existing, **c, "aliases": aliases}
        if not c.get("cik") and existing.get("cik"):
            merged_row["cik"] = existing["cik"]
        merged[key] = merged_row
    return list(merged.values())


def detected_company_from_name(raw_name, ticker="", exchange=""):
    name = normalize(raw_name).strip(" .,-:;()[]{}")
    ticker = str(ticker or "").strip().upper().lstrip("$")
    exchange = str(exchange or "").strip().upper()
    if not ticker and re.fullmatch(r"[A-Z]{1,5}(?:\.[A-Z]{1,3})?", name):
        ticker, name = name, name
    if not name and not ticker:
        return None
    if ticker and len(ticker) <= 1:
        return None
    common_non_tickers = {"LOSS", "GAIN", "NOTE", "FORM", "ITEM", "PAGE", "CASH", "DEBT", "RISK", "NYSE", "US", "AI"}
    if ticker in common_non_tickers:
        return None
    suffix_re = r"\b(incorporated|inc\.?|corp\.?|corporation|co\.?|company|ltd\.?|limited|plc|sa|ag|holdings?|technologies|technology)\b"
    if ticker and name and not re.search(suffix_re, name, flags=re.I) and len(name) > 50:
        return None
    clean_name = re.sub(rf"\s+{suffix_re}$", "", name, flags=re.I).strip(" .,-")
    display = name if len(name) >= 3 else ticker
    sector = "Unclassified"
    market = "US" if exchange in {"NYSE", "NASDAQ", "AMEX", "NYSEARCA", "OTC"} else ""
    if re.fullmatch(r"\d{6}", ticker):
        market = "KR"
    aliases = [v for v in [name, clean_name, ticker, f"{exchange}:{ticker}" if exchange and ticker else ""] if v]
    return normalize_company_entry({"name": display, "ticker": ticker or display, "sector": sector, "market": market, "aliases": aliases})


def extract_company_patterns(text):
    raw = normalize(text)
    found = []
    patterns = [
        r"\b(?P<exchange>NYSE|NASDAQ|AMEX|NYSEARCA|OTC)\s*[:：]\s*(?P<ticker>[A-Z][A-Z0-9.\-]{0,6})\b",
        r"\((?P<exchange>NYSE|NASDAQ|AMEX|NYSEARCA|OTC)\s*[:：]\s*(?P<ticker>[A-Z][A-Z0-9.\-]{0,6})\)",
        r"\b(?P<name>[A-Z][A-Za-z&.,\- ]{2,80}?\b(?:Inc\.?|Corp\.?|Corporation|Company|Co\.?|Ltd\.?|Limited|PLC|Holdings?|Technologies|Technology))\s*\((?P<ticker>[A-Z]{1,5})\)",
        r"\b(?P<ticker>\d{6})(?:\.KS|\.KQ)\b",
    ]
    for pattern in patterns:
        for m in re.finditer(pattern, raw):
            c = detected_company_from_name(m.groupdict().get("name", ""), m.groupdict().get("ticker", ""), m.groupdict().get("exchange", ""))
            if c:
                # Enrich with SEC data when the pattern only gave us a bare ticker
                if c.get("ticker") and (not c.get("cik") or c.get("name") == c.get("ticker")):
                    sec = _sec_enrich(c.get("ticker", ""))
                    if sec:
                        c["name"] = sec.get("name") or c.get("name")
                        c["cik"] = sec.get("cik") or ""
                found.append(c)
    return found


def term_in_text(term, hay):
    token = str(term or "").lower()
    if not token:
        return False
    if re.fullmatch(r"[a-z0-9]+", token):
        return bool(re.search(rf"(?<![a-z0-9]){re.escape(token)}(?![a-z0-9])", hay))
    return token in hay


def company_terms(company):
    return [company.get("name", ""), company.get("ticker", ""), *company.get("aliases", [])]


def company_term_matches(term, hay):
    token = str(term or "").strip()
    if not token:
        return False
    lower = token.lower()
    common_words = {"apple", "meta", "alphabet", "kia", "cat", "snow", "coin", "on"}
    if lower in common_words:
        return bool(re.search(rf"(?<![a-z0-9]){re.escape(lower)}(?![a-z0-9])", hay))
    return term_in_text(token, hay)


def company_matches_query(company, query):
    hay = normalize(query).lower()
    if not hay:
        return False
    return any(company_term_matches(term, hay) or hay == str(term or "").lower() for term in company_terms(company))


def find_companies(text):
    hay = normalize(text).lower()
    found = []
    seen = set()
    # 1. company_master / hardcoded universe (highest priority — has sector, Korean market info, etc.)
    for c in company_universe():
        names = company_terms(c)
        if any(company_term_matches(n, hay) for n in names):
            key = c.get("ticker") or c.get("name")
            if key not in seen:
                found.append(company_public(c))
                seen.add(key)
    # 2. Explicit patterns (NYSE:X, Company (X), 6-digit.KS) — enriched with SEC data
    for c in extract_company_patterns(text):
        key = c.get("ticker") or c.get("name")
        if key and key not in seen:
            found.append(company_public(c))
            seen.add(key)
    # 3. SEC full list — ticker frequency scan + distinctive name scan
    for c in _find_sec_companies_in_text(text):
        key = c.get("ticker") or c.get("name")
        if key and key not in seen:
            found.append(company_public(c))
            seen.add(key)
    return found


def sec_company_lookup(query):
    token = normalize(query).strip().lower().lstrip("$")
    if not token:
        return None
    SEC_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    data = read_json(SEC_TICKER_CACHE_PATH, None)
    rows = list(_sec_company_rows(data))
    if not rows:
        try:
            req = urllib.request.Request(
                "https://www.sec.gov/files/company_tickers.json",
                headers={"User-Agent": sec_user_agent(), "Accept-Encoding": "identity"},
            )
            with urllib.request.urlopen(req, timeout=int(os.environ.get("SEC_TIMEOUT_SECONDS", "30"))) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            write_json(SEC_TICKER_CACHE_PATH, data)
            rows = list(_sec_company_rows(data))
        except Exception:
            rows = []
    if not rows:
        return None
    exact_ticker = None
    exact_name = None
    contains_name = None
    for row in rows:
        ticker = str(row.get("ticker", "")).strip()
        title = str(row.get("title", "")).strip()
        cik = str(row.get("cik_str", "")).strip().zfill(10)
        if not ticker or not title or not cik:
            continue
        title_norm = normalize(title).lower()
        ticker_norm = ticker.lower()
        candidate = {"name": title, "ticker": ticker.upper(), "sector": "Unclassified", "market": "US", "cik": cik, "aliases": [ticker.upper(), title]}
        if token == ticker_norm:
            exact_ticker = candidate
            break
        if token == title_norm:
            exact_name = candidate
        elif len(token) >= 4 and token in title_norm and contains_name is None:
            contains_name = candidate
    return normalize_company_entry(exact_ticker or exact_name or contains_name) if (exact_ticker or exact_name or contains_name) else None


def infer_requested_company(query, docs):
    dart_match = resolve_dart_company(query, DATA_DIR / "dart-cache", dart_api_key())
    if dart_match:
        return company_public(dart_match)
    sec_match = sec_company_lookup(query)
    if sec_match:
        return company_public(sec_match)
    for c in company_universe():
        if company_matches_query(c, query):
            return company_public(c)
    query_norm = normalize(query).lower()
    for d in docs:
        for c in d.get("companies", []):
            terms = [c.get("name", ""), c.get("ticker", "")]
            if any(term_in_text(term, query_norm) or query_norm == str(term or "").lower() for term in terms):
                return c
    return {"name": query, "ticker": query, "sector": "Unclassified", "market": ""}
