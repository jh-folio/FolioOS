"""Watchlist keyword management, company resolution, overview, and notes."""
import datetime as dt
import re
from pathlib import Path

from features.common.utils import normalize, read_json, write_json, now_iso
from features.common.taxonomy import normalize_tag
from features.common.company_lookup import (
    company_public,
    company_matches_query,
    company_universe,
    normalize_company_entry,
    sec_company_lookup,
)
from features.common.dataframe_ops import top_records

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data"
NOTES_DIR = DATA_DIR / "notes"
SP500_CONSTITUENTS_PATH = ROOT / "config" / "sp500_constituents.json"

TRADINGVIEW_QUERY_SYMBOLS = {
    "GEV": "NYSE:GEV",
    "HWM": "NYSE:HWM",
    "SPCX": "NASDAQ:SPCX",
    "SPY": "AMEX:SPY",
    "QQQ": "NASDAQ:QQQ",
    "DIA": "AMEX:DIA",
    "IWM": "AMEX:IWM",
    "S&P 500": "FOREXCOM:SPXUSD",
    "SP500": "FOREXCOM:SPXUSD",
    "SNP500": "FOREXCOM:SPXUSD",
    "NASDAQ": "FOREXCOM:NSXUSD",
    "NASDAQ 100": "FOREXCOM:NSXUSD",
    "DOW": "FOREXCOM:DJI",
    "DOW JONES": "FOREXCOM:DJI",
    "RUSSELL": "TVC:RUT",
    "RUSSELL 2000": "AMEX:IWM",
    "DXY": "AMEX:UUP",
    "DOLLAR INDEX": "AMEX:UUP",
    "US 10Y": "NASDAQ:TLT",
    "US 10Y YIELD": "NASDAQ:TLT",
    "US10Y": "NASDAQ:TLT",
    "WTI": "AMEX:USO",
    "WTI CRUDE": "AMEX:USO",
    "KOSPI": "INDEX:KSIC",
    "코스피": "INDEX:KSIC",
    "USD/KRW": "FX_IDC:USDKRW",
    "USDKRW": "FX_IDC:USDKRW",
}

WATCHLIST_THEME_TERMS = {"AI", "EV", "ETF", "IPO", "M&A", "MA", "FX", "US", "KR", "GDP", "CPI", "PCE", "FOMC"}


def _is_watchlist_theme_query(value: str) -> bool:
    token = normalize(value).strip().lstrip("$").upper()
    return token in WATCHLIST_THEME_TERMS


def get_notes():
    return read_json(NOTES_DIR / "notes.json", [])


def add_note(note):
    note = note or {}
    notes = get_notes()
    row = {
        "id": str(int(dt.datetime.now().timestamp() * 1000)),
        "createdAt": now_iso(),
        "company": note.get("company", ""),
        "title": note.get("title", "투자 메모"),
        "body": note.get("body", ""),
        "tags": note.get("tags", []),
    }
    notes.insert(0, row)
    write_json(NOTES_DIR / "notes.json", notes)
    return row


def get_watchlist():
    return read_json(DATA_DIR / "watchlist.json", [])


def watchlist_company_from_index(token: str):
    token_norm = normalize(token).strip().lower().lstrip("$")
    if not token_norm:
        return None
    try:
        from features.common.research_library.indexing.service import load_index
        idx = load_index()
    except Exception:
        idx = {"documents": []}
    for doc in idx.get("documents", []):
        for company in doc.get("companies", []):
            ticker = str(company.get("ticker") or "").strip().lower()
            name = normalize(company.get("name", "")).strip()
            if token_norm == ticker or token_norm == name.lower():
                return company_public(normalize_company_entry(company))
    return None


def watchlist_company_from_yfinance(token: str):
    raw = str(token or "").strip().upper().lstrip("$")
    if not raw or not (
        re.fullmatch(r"[A-Z]{1,6}(?:[.-][A-Z]{1,3})?", raw)
        or re.fullmatch(r"\d{6}(?:\.(KS|KQ))?", raw)
    ):
        return None
    symbols = [raw]
    if re.fullmatch(r"\d{6}", raw):
        symbols = [f"{raw}.KS", f"{raw}.KQ"]
    try:
        import yfinance as yf
    except Exception:
        return None
    for symbol in symbols:
        try:
            info = yf.Ticker(symbol).get_info()
        except Exception:
            continue
        name = str(info.get("longName") or info.get("shortName") or "").strip()
        if not name:
            continue
        quote_type = str(info.get("quoteType") or "").upper()
        if quote_type and quote_type not in {"EQUITY", "ETF"}:
            continue
        market = "KR" if symbol.endswith((".KS", ".KQ")) else "US"
        ticker = raw.split(".", 1)[0] if market == "KR" else raw.replace(".", "-")
        return company_public(normalize_company_entry({
            "name": name,
            "ticker": ticker,
            "sector": info.get("sector") or info.get("industry") or "Unclassified",
            "market": market,
            "aliases": [raw, symbol, name],
        }))
    return None


def watchlist_company_from_universe(token: str):
    query = normalize(token).strip()
    if not query:
        return None
    for company in company_universe():
        if company_matches_query(company, query):
            return company_public(company)
    return None


def _constituent_matches_query(ticker: str, label: str, query: str) -> bool:
    ticker_norm = normalize(ticker).strip().lower()
    label_norm = normalize(label).strip().lower()
    query_norm = normalize(query).strip().lower().lstrip("$")
    if not query_norm:
        return False
    if query_norm in {ticker_norm, f"nyse:{ticker_norm}", f"nasdaq:{ticker_norm}", f"amex:{ticker_norm}"}:
        return True
    suffix_re = r"\b(incorporated|inc\.?|corp\.?|corporation|co\.?|company|ltd\.?|limited|plc|holdings?)\b"
    query_base = re.sub(suffix_re, "", query_norm).strip(" .,-")
    label_base = re.sub(suffix_re, "", label_norm).strip(" .,-")
    return bool(label_base and (query_base == label_base or label_base in query_norm or query_base in label_norm))


def watchlist_company_from_constituents(token: str):
    query = normalize(token).strip()
    if not query:
        return None
    payload = read_json(SP500_CONSTITUENTS_PATH, {})
    rows = payload.get("companies", []) if isinstance(payload, dict) else []
    for row in rows:
        ticker = str(row.get("ticker") or row.get("providerSymbol") or "").strip().upper()
        label = str(row.get("label") or row.get("name") or "").strip()
        if not ticker or not label:
            continue
        if not _constituent_matches_query(ticker, label, query):
            continue
        company = normalize_company_entry({
            "name": label,
            "ticker": ticker,
            "sector": row.get("sector") or row.get("industry") or "Unclassified",
            "market": "US",
            "aliases": [ticker, label, f"{label} Inc.", f"{label} Corporation"],
        })
        return company_public(company)
    return None


def resolve_watchlist_company(query: str, hits: list[dict] | None = None) -> dict:
    text = normalize(query).strip()
    if not text:
        return {}
    for hit in hits or []:
        for raw_company in hit.get("companies", []):
            if _item_matches_company(text, raw_company):
                return company_public(normalize_company_entry(raw_company))
    if _is_watchlist_theme_query(text):
        return {}
    return (
        watchlist_company_from_universe(text)
        or watchlist_company_from_constituents(text)
        or sec_company_lookup(text)
        or watchlist_company_from_index(text)
        or watchlist_company_from_yfinance(text)
        or {}
    )


def normalize_watchlist_keyword(value: str):
    raw = normalize(value).strip()
    if not raw:
        return None
    token = raw.lstrip("$")
    if _is_watchlist_theme_query(token):
        return raw
    token_upper = token.upper()
    looks_like_us_ticker = token == token_upper and bool(re.fullmatch(r"[A-Z]{1,6}(?:[.-][A-Z]{1,3})?", token_upper))
    looks_like_kr_ticker = bool(re.fullmatch(r"\d{6}(?:\.(KS|KQ))?", token_upper))
    looks_like_ticker = looks_like_us_ticker or looks_like_kr_ticker
    if looks_like_ticker:
        company = (
            sec_company_lookup(token)
            or watchlist_company_from_universe(token)
            or watchlist_company_from_constituents(token)
            or watchlist_company_from_index(token)
            or watchlist_company_from_yfinance(token)
        )
        if company and company.get("name"):
            return company.get("name")
    return raw


def save_watchlist(items):
    rows = []
    seen = set()
    for x in items:
        keyword = normalize_watchlist_keyword(str(x))
        if not keyword:
            continue
        key = keyword.lower()
        if key in seen:
            continue
        rows.append(keyword)
        seen.add(key)
    write_json(DATA_DIR / "watchlist.json", rows)
    return rows


def _item_matches_company(query: str, company: dict) -> bool:
    """Return True if the watchlist query string matches a company dict (name or ticker)."""
    q = query.lower().strip()
    name = (company.get("name") or "").lower()
    ticker = (company.get("ticker") or "").lower()
    return q in name or name in q or (ticker and q == ticker)


def tradingview_symbol_for_company(company: dict) -> str:
    ticker = str((company or {}).get("ticker") or "").strip().upper().replace(".", "-")
    if not ticker:
        return ""
    if ticker in TRADINGVIEW_QUERY_SYMBOLS:
        return TRADINGVIEW_QUERY_SYMBOLS[ticker]
    market = str((company or {}).get("market") or "").strip().upper()
    if market == "KR" or re.fullmatch(r"\d{6}", ticker):
        return f"KRX:{ticker[:6]}"
    exchange = str((company or {}).get("exchange") or "").strip().upper()
    if exchange in {"NYSE", "NASDAQ", "AMEX"}:
        return f"{exchange}:{ticker}"
    return f"NASDAQ:{ticker}"


def tradingview_symbol_for_query(query: str) -> str:
    text = normalize(query).strip()
    if not text:
        return ""
    upper = text.upper().lstrip("$")
    if _is_watchlist_theme_query(upper):
        return ""
    if upper in TRADINGVIEW_QUERY_SYMBOLS:
        return TRADINGVIEW_QUERY_SYMBOLS[upper]
    if ":" in upper and re.fullmatch(r"[A-Z0-9_]+:[A-Z0-9_.!/-]{1,32}", upper):
        return upper
    if re.fullmatch(r"\d{6}(?:\.(KS|KQ))?", upper):
        return f"KRX:{upper[:6]}"
    if re.fullmatch(r"[A-Z]{1,6}(?:[.-][A-Z]{1,3})?", upper):
        return f"NASDAQ:{upper.replace('.', '-')}"
    return ""


def _public_news_doc(doc: dict) -> dict:
    return {
        "title": doc.get("title", ""),
        "source": doc.get("source", ""),
        "date": doc.get("date", ""),
        "url": doc.get("url", ""),
        "path": doc.get("path", ""),
        "summary": doc.get("summary") or doc.get("searchSnippet") or "",
        "sectors": doc.get("sectors", []) or [],
        "impactTags": doc.get("impactTags", []) or [],
        "companies": doc.get("companies", []) or [],
    }


def watchlist_detail(item: str, limit: int = 12) -> dict:
    from collections import Counter
    from features.common.research_library.indexing.service import load_index
    from features.common.research_library.search.service import search_documents

    query = normalize(item).strip()
    warnings = []
    if not query:
        return {
            "item": "",
            "company": {"tradingViewSymbol": ""},
            "tags": [],
            "news": [],
            "newsCount": 0,
            "latestDate": "",
            "warnings": ["empty watchlist item"],
        }
    idx = load_index()
    candidates = search_documents(idx, query=query, limit=max(limit * 3, 12), scope="news")
    hits = [h for h in candidates if any(_item_matches_company(query, c) for c in h.get("companies", []))]
    if not hits:
        hits = candidates[:limit]
    else:
        hits = hits[:limit]
    company = resolve_watchlist_company(query, hits)
    if not company:
        company = {"name": query, "ticker": "", "market": "", "sector": ""}
    company = dict(company)
    symbol = tradingview_symbol_for_company(company) or tradingview_symbol_for_query(query)
    if symbol and not company.get("ticker"):
        company["ticker"] = query.upper() if re.fullmatch(r"[A-Za-z]{1,6}|\d{6}", query) else ""
    company["tradingViewSymbol"] = symbol
    tag_counts = Counter()
    for hit in hits:
        for tag in (hit.get("sectors") or []) + (hit.get("impactTags") or []):
            if tag:
                tag_counts[tag] += 1
    tags = [tag for tag, _count in tag_counts.most_common(8)]
    news = [_public_news_doc(hit) for hit in hits]
    return {
        "item": query,
        "company": company,
        "tags": tags,
        "news": news,
        "newsCount": len(news),
        "latestDate": news[0].get("date", "") if news else "",
        "warnings": warnings,
    }


def watchlist_overview(limit_per_item: int = 5):
    from features.common.research_library.indexing.service import load_index
    from features.common.research_library.search.service import search_documents
    from collections import Counter
    idx = load_index()
    items = get_watchlist()
    cards = []
    seen_paths = set()
    combined = []
    for item in items:
        # Fix 5: 후보를 넉넉히 뽑은 뒤 companies 필드에 해당 기업이 실제 등장하는 문서만 사용
        candidates = search_documents(idx, query=item, limit=limit_per_item * 4, scope="news")
        hits = [h for h in candidates if any(_item_matches_company(item, c) for c in h.get("companies", []))]
        if not hits:
            hits = candidates[:limit_per_item]  # 인덱스에 없는 종목은 원래 결과 그대로
        else:
            hits = hits[:limit_per_item]
        resolved_company = resolve_watchlist_company(item, hits)
        resolved_company = dict(resolved_company or {})
        resolved_symbol = tradingview_symbol_for_company(resolved_company) or tradingview_symbol_for_query(
            resolved_company.get("ticker") or item
        )
        if resolved_symbol and not resolved_company.get("ticker"):
            resolved_company["ticker"] = item.upper() if re.fullmatch(r"[A-Za-z]{1,6}|\d{6}", item) else ""
        for hit in hits:
            path = hit.get("path") or hit.get("url") or hit.get("title")
            if path and path not in seen_paths:
                seen_paths.add(path)
                combined.append(hit)
        tag_counts: Counter = Counter()
        sources = []
        companies = []
        base_sector = ""
        for hit in hits:
            hit_companies = hit.get("companies", [])
            # Fix 2: 검색어 종목이 문서의 주요 기업(상위 2개)에 있을 때만 태그 수집
            is_primary = any(_item_matches_company(item, c) for c in hit_companies[:2])
            if is_primary:
                # 같은 문서에서 다른 기업에 귀속된 섹터는 제외 (오염 방지)
                # normalize_tag 적용으로 "Financial Services" vs "Financials" 같은
                # 섹터명 불일치로 인한 필터 누락 방지
                other_sectors = {
                    normalize_tag(c.get("sector")) for c in hit_companies
                    if not _item_matches_company(item, c) and c.get("sector")
                }
                for tag in hit.get("impactTags", []):
                    if tag:
                        tag_counts[tag] += 1
                for tag in hit.get("sectors", []):
                    if tag and tag not in other_sectors:
                        tag_counts[tag] += 1
            # Fix 4: is_primary 여부와 무관하게 기업 자체 섹터 수집
            if not base_sector:
                for c in hit_companies:
                    if _item_matches_company(item, c) and c.get("sector"):
                        base_sector = c["sector"]
                        break
            source = hit.get("source", "")
            if source and source not in sources:
                sources.append(source)
            for company in hit_companies:
                label = company.get("ticker") or company.get("name")
                if label and label not in companies:
                    companies.append(label)
        # Fix 3: 2회 이상 등장한 태그 우선, 미달 시 상위 4개로 fallback
        tags = [t for t, cnt in tag_counts.most_common(8) if cnt >= 2]
        if not tags:
            tags = [t for t, _ in tag_counts.most_common(4)]
        if not base_sector and resolved_company.get("sector"):
            base_sector = resolved_company["sector"]
        # Fix 4: 기업 자체 섹터가 있고 태그 목록에 없으면 맨 앞에 고정
        if base_sector and base_sector not in tags:
            tags = [base_sector] + tags
        cards.append({
            "item": item,
            "ticker": resolved_company.get("ticker", ""),
            "companyName": resolved_company.get("name") or item,
            "tradingViewSymbol": resolved_symbol,
            "count": len(hits),
            "latestDate": hits[0].get("date", "") if hits else "",
            "sources": sources[:4],
            "tags": tags,
            "companies": companies[:6],
            "latest": hits[:3],
        })
    combined = top_records(combined, ["date", "score"], 12, descending=True)
    return {"items": cards, "news": combined}
