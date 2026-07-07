"""Portfolio management, analytics, and backtesting service."""
import datetime as dt
import hashlib
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

from fastapi import HTTPException

from features.common.dataframe_ops import aggregate_portfolio
from features.common.utils import now_iso, kst_date, read_json, write_json

ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = ROOT / "data"
PORTFOLIO_PATH = DATA_DIR / "portfolio.json"
PORTFOLIO_PRESETS_PATH = DATA_DIR / "portfolio-presets.json"
PORTFOLIO_PRICE_CACHE_DIR = DATA_DIR / "portfolio-price-cache"
BACKTESTS_DIR = DATA_DIR / "portfolio-backtests"



def _float_value(value, default=0.0):
    try:
        if value in {None, ""}:
            return default
        return float(str(value).replace(",", "").strip())
    except Exception:
        return default


def _coerce_float(value, default=None):
    try:
        if value is None or value == "":
            return default
        return float(value)
    except Exception:
        return default


# ---------------------------------------------------------------------------
# Symbol and market inference
# ---------------------------------------------------------------------------

def portfolio_symbol(ticker: str, market: str = "") -> str:
    raw = str(ticker or "").strip().upper()
    market = str(market or "").strip().upper()
    if not raw:
        return ""
    if re.fullmatch(r"\d{6}", raw):
        return f"{raw}.KQ" if market == "KQ" else f"{raw}.KS"
    return raw.replace(".", "-")


def portfolio_symbol_candidates(ticker: str, market: str = "") -> list:
    raw = str(ticker or "").strip().upper()
    market = str(market or "").strip().upper()
    if not raw:
        return []
    if re.fullmatch(r"\d{6}", raw):
        primary = f"{raw}.KQ" if market == "KQ" else f"{raw}.KS"
        candidates = [primary, f"{raw}.KS", f"{raw}.KQ"]
    else:
        candidates = [raw.replace(".", "-")]
    seen = set()
    return [item for item in candidates if not (item in seen or seen.add(item))]


def infer_portfolio_market(symbol: str, info=None) -> str:
    symbol = str(symbol or "").upper()
    exchange = str((info or {}).get("exchange") or (info or {}).get("fullExchangeName") or "").upper()
    if symbol.endswith((".KS", ".KQ")) or "KOREA" in exchange or "KOSDAQ" in exchange or "KSC" in exchange:
        return "KR"
    if "NYSE" in exchange or "NASDAQ" in exchange or "NMS" in exchange or "AMEX" in exchange or "PCX" in exchange:
        return "US"
    return "KR" if re.match(r"^\d{6}", symbol) else "US"


ETF_SECTOR_MAP: dict[str, str] = {
    # 주식
    "SPY": "주식(ETF)", "IVV": "주식(ETF)", "VOO": "주식(ETF)", "VTI": "주식(ETF)", "SPYM": "주식(ETF)",
    "DIA": "주식(ETF)", "IWM": "주식(ETF)", "IWB": "주식(ETF)", "MDY": "주식(ETF)",
    "QQQ": "주식(ETF)", "QQQM": "주식(ETF)",
    "SOXX": "주식(ETF)", "SMH": "주식(ETF)", "FTEC": "주식(ETF)", "VGT": "주식(ETF)",
    "ARKK": "주식(ETF)", "ARKG": "주식(ETF)", "ARKW": "주식(ETF)",
    "442580": "주식(ETF)",  # PLUS Global HBM
    "XLK": "주식(ETF)", "XLF": "주식(ETF)", "XLE": "주식(ETF)", "XLV": "주식(ETF)",
    "XLI": "주식(ETF)", "XLY": "주식(ETF)", "XLP": "주식(ETF)",
    "XLU": "주식(ETF)", "XLC": "주식(ETF)", "XLB": "주식(ETF)",
    "EEM": "주식(ETF)", "VWO": "주식(ETF)", "EFA": "주식(ETF)", "VEA": "주식(ETF)",
    "EWJ": "주식(ETF)", "FXI": "주식(ETF)", "KWEB": "주식(ETF)", "EWY": "주식(ETF)", "EWG": "주식(ETF)",
    "VPL": "주식(ETF)",
    # 레버리지/인버스
    "TQQQ": "레버리지/인버스(ETF)", "SQQQ": "레버리지/인버스(ETF)",
    "UPRO": "레버리지/인버스(ETF)", "SPXS": "레버리지/인버스(ETF)",
    "SOXL": "레버리지/인버스(ETF)", "SOXS": "레버리지/인버스(ETF)",
    "LABU": "레버리지/인버스(ETF)", "FNGU": "레버리지/인버스(ETF)",
    "UCO": "레버리지/인버스(ETF)",
    # 채권
    "TLT": "채권(ETF)", "IEF": "채권(ETF)", "SHY": "채권(ETF)", "SGOV": "채권(ETF)",
    "BND": "채권(ETF)", "AGG": "채권(ETF)", "LQD": "채권(ETF)",
    "HYG": "채권(ETF)", "JNK": "채권(ETF)", "TIP": "채권(ETF)", "VTIP": "채권(ETF)",
    # 금/원자재
    "GLD": "금/원자재(ETF)", "IAU": "금/원자재(ETF)", "IAUM": "금/원자재(ETF)", "GDX": "금/원자재(ETF)",
    "SLV": "금/원자재(ETF)", "PPLT": "금/원자재(ETF)",
    "USO": "금/원자재(ETF)", "DBA": "금/원자재(ETF)", "DBB": "금/원자재(ETF)",
    # 배당
    "SCHD": "배당(ETF)", "VYM": "배당(ETF)", "DVY": "배당(ETF)",
    "JEPI": "배당(ETF)", "JEPQ": "배당(ETF)",
    "161510": "배당(ETF)",  # PLUS High Dividend ETF
    # 부동산
    "XLRE": "부동산(ETF)", "VNQ": "부동산(ETF)", "IYR": "부동산(ETF)",
    # 통화
    "UUP": "통화(ETF)",
}

_ETF_NAME_KEYWORDS: list[tuple[str, str]] = [
    # 배당
    ("Dividend", "배당(ETF)"), ("Income", "배당(ETF)"), ("배당", "배당(ETF)"), ("고배당", "배당(ETF)"),
    # 채권
    ("Treasury", "채권(ETF)"), ("Bond", "채권(ETF)"), ("Fixed Income", "채권(ETF)"),
    ("채권", "채권(ETF)"), ("국채", "채권(ETF)"),
    # 금/원자재
    ("Gold", "금/원자재(ETF)"), ("Silver", "금/원자재(ETF)"), ("Metal", "금/원자재(ETF)"),
    ("Commodity", "금/원자재(ETF)"), ("Oil", "금/원자재(ETF)"), ("Crude", "금/원자재(ETF)"),
    # 부동산
    ("Real Estate", "부동산(ETF)"), ("REIT", "부동산(ETF)"),
    # 레버리지/인버스
    ("Leveraged", "레버리지/인버스(ETF)"), ("Ultra", "레버리지/인버스(ETF)"),
    ("Inverse", "레버리지/인버스(ETF)"), ("Bear", "레버리지/인버스(ETF)"),
]


def _etf_sector(info: dict, symbol: str) -> str:
    """Return a broad sector label for ETFs; fall back to equity sector for stocks."""
    symbol_upper = str(symbol or "").upper().split(".")[0]
    # Check explicit map first — covers Korean numeric ETFs that yfinance may misclassify
    mapped = ETF_SECTOR_MAP.get(symbol_upper)
    if mapped:
        return mapped
    asset_class = infer_portfolio_asset_class(info, symbol)
    if asset_class == "ETF":
        fund_name = str(info.get("shortName") or info.get("longName") or "").strip()
        if fund_name:
            for kw, label in _ETF_NAME_KEYWORDS:
                if kw.lower() in fund_name.lower():
                    return label
        return "주식(ETF)"
    return str(info.get("sector") or "Unclassified")


def infer_portfolio_asset_class(info=None, symbol: str = "") -> str:
    info = info or {}
    quote_type = str(info.get("quoteType") or info.get("typeDisp") or "").upper()
    name = str(info.get("shortName") or info.get("longName") or "").upper()
    symbol = str(symbol or "").upper()
    if "ETF" in quote_type or "ETF" in name or "ETN" in name:
        return "ETF"
    if "MUTUAL" in quote_type or "FUND" in quote_type:
        return "Fund"
    if "CRYPTO" in quote_type or "-USD" in symbol:
        return "Crypto"
    if "FUTURE" in quote_type:
        return "Futures"
    if "INDEX" in quote_type:
        return "Index"
    if quote_type == "EQUITY" or symbol:
        return "Equity"
    return "Unknown"


def resolve_portfolio_ticker(ticker: str, market: str = "") -> dict:
    raw = str(ticker or "").strip().upper()
    if not raw:
        return {"ok": False, "ticker": "", "error": "missing ticker"}
    fallback_symbol = portfolio_symbol(raw, market)
    try:
        import yfinance as yf
        for symbol in portfolio_symbol_candidates(raw, market):
            stock = yf.Ticker(symbol)
            info = {}
            fast = {}
            try:
                fast = getattr(stock, "fast_info", {}) or {}
            except Exception:
                fast = {}
            try:
                info = stock.get_info() or {}
            except Exception:
                info = {}
            name = str(info.get("shortName") or info.get("longName") or info.get("displayName") or "").strip()
            currency = str(info.get("currency") or ("KRW" if symbol.endswith((".KS", ".KQ")) else "USD")).upper()
            price = None
            previous = None
            for field in ("last_price", "lastPrice", "currentPrice", "regularMarketPrice"):
                try:
                    value = getattr(fast, field) if hasattr(fast, field) else fast.get(field) if isinstance(fast, dict) else None
                except Exception:
                    value = None
                if value is None:
                    value = info.get(field)
                try:
                    if value is not None:
                        price = float(value)
                        break
                except Exception:
                    pass
            for field in ("previous_close", "previousClose", "regularMarketPreviousClose"):
                try:
                    value = getattr(fast, field) if hasattr(fast, field) else fast.get(field) if isinstance(fast, dict) else None
                except Exception:
                    value = None
                if value is None:
                    value = info.get(field)
                try:
                    if value is not None:
                        previous = float(value)
                        break
                except Exception:
                    pass
            if name or price is not None or info.get("quoteType"):
                return {
                    "ok": True,
                    "ticker": raw,
                    "symbol": symbol,
                    "name": name or raw,
                    "market": infer_portfolio_market(symbol, info),
                    "currency": currency,
                    "assetClass": infer_portfolio_asset_class(info, symbol),
                    "sector": _etf_sector(info, symbol),
                    "industry": str(info.get("industry") or ""),
                    "country": str(info.get("country") or ""),
                    "exchange": str(info.get("exchange") or info.get("fullExchangeName") or ""),
                    "quoteType": str(info.get("quoteType") or ""),
                    "price": price,
                    "previousClose": previous,
                }
    except Exception as exc:
        return {
            "ok": False,
            "ticker": raw,
            "symbol": fallback_symbol,
            "name": raw,
            "market": "KR" if re.fullmatch(r"\d{6}", raw) else "US",
            "currency": "KRW" if re.fullmatch(r"\d{6}", raw) else "USD",
            "assetClass": "Unknown",
            "sector": "Unclassified",
            "error": str(exc),
        }
    return {
        "ok": False,
        "ticker": raw,
        "symbol": fallback_symbol,
        "name": raw,
        "market": "KR" if re.fullmatch(r"\d{6}", raw) else "US",
        "currency": "KRW" if re.fullmatch(r"\d{6}", raw) else "USD",
        "assetClass": "Unknown",
        "sector": "Unclassified",
        "error": "no ticker match",
    }


def _portfolio_suggestion_from_quote(quote: dict, fallback_query: str = ""):
    quote = quote or {}
    symbol = str(quote.get("symbol") or quote.get("ticker") or "").strip().upper()
    if not symbol:
        return None
    name = str(
        quote.get("shortname") or quote.get("shortName") or quote.get("longname") or quote.get("longName") or quote.get("name") or symbol
    ).strip()
    info = {
        "quoteType": quote.get("quoteType") or quote.get("typeDisp") or "",
        "exchange": quote.get("exchange") or quote.get("exchDisp") or "",
        "fullExchangeName": quote.get("exchDisp") or quote.get("exchange") or "",
        "shortName": name,
        "currency": quote.get("currency") or ("KRW" if symbol.endswith((".KS", ".KQ")) else "USD"),
        "sector": quote.get("sector") or "",
        "industry": quote.get("industry") or "",
    }
    return {
        "ok": True,
        "ticker": symbol.split(".")[0] if symbol.endswith((".KS", ".KQ")) else symbol.replace("-", "."),
        "symbol": symbol,
        "name": name or symbol,
        "market": infer_portfolio_market(symbol, info),
        "currency": str(info.get("currency") or "").upper() or ("KRW" if symbol.endswith((".KS", ".KQ")) else "USD"),
        "assetClass": infer_portfolio_asset_class(info, symbol),
        "sector": str(info.get("sector") or "Unclassified"),
        "industry": str(info.get("industry") or ""),
        "exchange": str(info.get("exchange") or ""),
        "quoteType": str(info.get("quoteType") or ""),
    }


def search_portfolio_tickers(query: str, limit: int = 8) -> dict:
    raw = str(query or "").strip()
    if not raw:
        return {"ok": True, "query": "", "items": [], "errors": []}
    limit = max(1, min(int(limit or 8), 12))
    items = []
    seen = set()
    errors = []

    def add(item):
        if not item:
            return
        symbol = str(item.get("symbol") or item.get("ticker") or "").upper()
        if not symbol or symbol in seen:
            return
        seen.add(symbol)
        items.append(item)

    exact_lookup = bool(re.fullmatch(r"\d{6}", raw) or "." in raw or len(raw) >= 3)
    if exact_lookup:
        exact = resolve_portfolio_ticker(raw)
        if exact.get("ok"):
            add(exact)

    try:
        import yfinance as yf
        search_cls = getattr(yf, "Search", None)
        if search_cls:
            result = search_cls(raw, max_results=limit)
            for quote in (getattr(result, "quotes", None) or []):
                add(_portfolio_suggestion_from_quote(quote, raw))
    except Exception as exc:
        errors.append(f"yfinance search: {exc}")

    if len(items) < limit:
        params = urllib.parse.urlencode({
            "q": raw,
            "quotesCount": limit,
            "newsCount": 0,
            "enableFuzzyQuery": "true",
            "quotesQueryId": "tss_match_phrase_query",
        })
        for host in ("query2.finance.yahoo.com", "query1.finance.yahoo.com"):
            try:
                url = f"https://{host}/v1/finance/search?{params}"
                req = urllib.request.Request(url, headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36",
                    "Accept": "application/json,text/plain,*/*",
                    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
                })
                with urllib.request.urlopen(req, timeout=6) as response:
                    payload = json.loads(response.read().decode("utf-8", errors="ignore"))
                for quote in payload.get("quotes") or []:
                    add(_portfolio_suggestion_from_quote(quote, raw))
                if len(items) >= limit:
                    break
            except Exception as exc:
                errors.append(f"{host}: {exc}")

    return {"ok": True, "query": raw, "items": items[:limit], "errors": errors[:3]}


# ---------------------------------------------------------------------------
# Portfolio CRUD
# ---------------------------------------------------------------------------

def normalize_portfolio_position(row, resolve: bool = False):
    row = row or {}
    ticker = str(row.get("ticker") or row.get("symbol") or "").strip().upper()
    quantity = _float_value(row.get("quantity"), 0.0)
    average_price = _float_value(row.get("averagePrice"), 0.0)
    target_weight = _coerce_float(row.get("targetWeight"))
    if target_weight is None:
        target_weight = _coerce_float(row.get("targetWeightPct"))
        if target_weight is not None:
            target_weight = target_weight / 100.0
    if target_weight is not None and target_weight > 1:
        target_weight = target_weight / 100.0
    if target_weight is not None:
        target_weight = max(0.0, min(1.0, target_weight))
    resolved = row.get("resolved") if isinstance(row.get("resolved"), dict) else {}
    if resolve and ticker:
        resolved = resolve_portfolio_ticker(ticker, row.get("market") or resolved.get("market") or "")
    name = str(row.get("name") or resolved.get("name") or ticker).strip()
    symbol = str(row.get("symbol") or resolved.get("symbol") or portfolio_symbol(ticker, resolved.get("market", ""))).strip().upper()
    market = str(row.get("market") or resolved.get("market") or infer_portfolio_market(symbol, resolved)).strip().upper()
    currency = str(row.get("currency") or resolved.get("currency") or ("KRW" if market == "KR" else "USD")).strip().upper()
    asset_class = str(row.get("assetClass") or resolved.get("assetClass") or infer_portfolio_asset_class(resolved, symbol)).strip()
    sector = str(row.get("sector") or resolved.get("sector") or "Unclassified").strip()
    normalized_resolved = {
        "ok": bool(resolved.get("ok")),
        "ticker": ticker,
        "symbol": symbol,
        "name": name or ticker,
        "market": market,
        "currency": currency,
        "assetClass": asset_class or "Unknown",
        "sector": sector or "Unclassified",
        "industry": str(row.get("industry") or resolved.get("industry") or ""),
        "country": str(row.get("country") or resolved.get("country") or ""),
        "exchange": str(row.get("exchange") or resolved.get("exchange") or ""),
        "quoteType": str(row.get("quoteType") or resolved.get("quoteType") or ""),
    }
    return {
        "id": str(row.get("id") or hashlib.sha256(f"{ticker}:{quantity}:{average_price}".encode("utf-8")).hexdigest()[:12]),
        "ticker": ticker,
        "symbol": symbol,
        "name": name or ticker,
        "market": market,
        "quantity": quantity,
        "averagePrice": average_price,
        "targetWeight": target_weight,
        "currency": currency,
        "assetClass": normalized_resolved["assetClass"],
        "sector": normalized_resolved["sector"],
        "industry": normalized_resolved["industry"],
        "country": normalized_resolved["country"],
        "exchange": normalized_resolved["exchange"],
        "quoteType": normalized_resolved["quoteType"],
        "resolved": normalized_resolved,
    }


def get_portfolio():
    data = read_json(PORTFOLIO_PATH, {"positions": [], "cash": []})
    if isinstance(data, list):
        data = {"positions": data, "cash": []}
    positions = [normalize_portfolio_position(row) for row in data.get("positions", []) if isinstance(row, dict)]
    cash = []
    for row in data.get("cash", []) if isinstance(data.get("cash", []), list) else []:
        currency = str((row or {}).get("currency") or "").strip().upper()
        amount = _float_value((row or {}).get("amount"), 0.0)
        if currency and amount:
            cash.append({"currency": currency, "amount": amount})
    return {"positions": positions, "cash": cash}


def save_portfolio(body):
    data = body if isinstance(body, dict) else {}
    positions = [normalize_portfolio_position(row, resolve=True) for row in data.get("positions", []) if isinstance(row, dict)]
    positions = [row for row in positions if row.get("ticker") and row.get("quantity") > 0]
    cash = []
    for row in data.get("cash", []) if isinstance(data.get("cash", []), list) else []:
        currency = str((row or {}).get("currency") or "").strip().upper()
        amount = _float_value((row or {}).get("amount"), 0.0)
        if currency and amount:
            cash.append({"currency": currency, "amount": amount})
    payload = {"positions": positions, "cash": cash, "updatedAt": now_iso()}
    write_json(PORTFOLIO_PATH, payload)
    return payload


# ---------------------------------------------------------------------------
# Price fetching
# ---------------------------------------------------------------------------

def _pick_quote_value(fast, info, *names):
    for name in names:
        value = None
        try:
            if hasattr(fast, name):
                value = getattr(fast, name)
            elif isinstance(fast, dict):
                value = fast.get(name)
        except Exception:
            value = None
        if value is None and isinstance(info, dict):
            value = info.get(name)
        number = _coerce_float(value)
        if number is not None:
            return number
    return None


def _quote_from_yahoo_chart(symbol: str):
    try:
        from urllib.request import Request, urlopen
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?range=10d&interval=1d"
        request = Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urlopen(request, timeout=8) as response:
            payload = json.loads(response.read().decode("utf-8"))
        result = (((payload or {}).get("chart") or {}).get("result") or [None])[0] or {}
        meta = result.get("meta") or {}
        quote = (((result.get("indicators") or {}).get("quote") or [None])[0] or {})
        closes = [value for value in (quote.get("close") or []) if value is not None]
        price = _coerce_float(meta.get("regularMarketPrice")) or (_coerce_float(closes[-1]) if closes else None)
        previous = _coerce_float(meta.get("chartPreviousClose"))
        if previous is None and len(closes) >= 2:
            previous = _coerce_float(closes[-2])
        if price is None:
            return None
        return {
            "price": price,
            "previousClose": previous,
            "currency": str(meta.get("currency") or ("KRW" if symbol.endswith((".KS", ".KQ")) else "USD")).upper(),
            "exchange": str(meta.get("exchangeName") or ""),
        }
    except Exception:
        return None


def fetch_portfolio_quote(position):
    base_symbol = str(position.get("symbol") or portfolio_symbol(position.get("ticker", ""), position.get("market", ""))).strip().upper()
    candidates = []
    if base_symbol:
        candidates.append(base_symbol)
    candidates.extend(portfolio_symbol_candidates(position.get("ticker", ""), position.get("market", "")))
    seen = set()
    candidates = [item for item in candidates if item and not (item in seen or seen.add(item))]
    if not candidates:
        return {"ok": False, "symbol": "", "error": "missing ticker"}
    errors = []
    try:
        import yfinance as yf
    except Exception as exc:
        yf = None
        errors.append(str(exc))
    for symbol in candidates:
        info = {}
        price = None
        previous = None
        currency = position.get("currency") or ("KRW" if symbol.endswith((".KS", ".KQ")) else "USD")
        if yf:
            try:
                stock = yf.Ticker(symbol)
                try:
                    fast = getattr(stock, "fast_info", {}) or {}
                except Exception:
                    fast = {}
                try:
                    info = stock.get_info() or {}
                except Exception as exc:
                    errors.append(f"{symbol} info: {exc}")
                    info = {}
                price = _pick_quote_value(
                    fast, info,
                    "last_price", "lastPrice", "currentPrice", "regularMarketPrice", "navPrice", "open", "previousClose",
                )
                previous = _pick_quote_value(fast, info, "previous_close", "previousClose", "regularMarketPreviousClose")
                currency = str(info.get("currency") or currency).upper()
                if price is None:
                    try:
                        hist = stock.history(period="1mo", interval="1d", auto_adjust=False, actions=False)
                        if not hist.empty:
                            close_col = "Close" if "Close" in hist else "Adj Close" if "Adj Close" in hist else None
                            if close_col:
                                closes = hist[close_col].dropna()
                                if len(closes):
                                    price = float(closes.iloc[-1])
                                    if previous is None and len(closes) >= 2:
                                        previous = float(closes.iloc[-2])
                    except Exception as exc:
                        errors.append(f"{symbol} history: {exc}")
            except Exception as exc:
                errors.append(f"{symbol}: {exc}")
        if price is None:
            chart = _quote_from_yahoo_chart(symbol)
            if chart:
                price = chart.get("price")
                previous = previous if previous is not None else chart.get("previousClose")
                currency = chart.get("currency") or currency
                if chart.get("exchange") and not info.get("exchange"):
                    info["exchange"] = chart.get("exchange")
        if price is None:
            continue
        return {
            "ok": True,
            "symbol": symbol,
            "price": price,
            "previousClose": previous,
            "currency": str(currency or "").upper(),
            "name": str(info.get("shortName") or info.get("longName") or position.get("name") or position.get("ticker") or ""),
            "market": infer_portfolio_market(symbol, info),
            "assetClass": infer_portfolio_asset_class(info or position.get("resolved") or {}, symbol),
            "sector": _etf_sector(info, symbol),
            "industry": str(info.get("industry") or position.get("industry") or ""),
        }
    return {"ok": False, "symbol": candidates[0], "error": "; ".join(errors[-3:]) or "no price data"}


def _portfolio_fx_to_usd(currency: str):
    currency = str(currency or "USD").upper()
    if currency == "USD":
        return 1.0, "USD"
    cache_path = DATA_DIR / "portfolio-fx-cache.json"
    cache = read_json(cache_path, {})
    today = kst_date()
    cached = cache.get(currency) if isinstance(cache, dict) else None
    if isinstance(cached, dict) and cached.get("date") == today and _coerce_float(cached.get("rateToUsd")):
        return float(cached["rateToUsd"]), cached.get("source", "cache")

    rate_to_usd = None
    source = ""
    if currency != "KRW":
        direct_symbol = f"{currency}USD=X"
        direct = _quote_from_yahoo_chart(direct_symbol)
        if direct and _coerce_float(direct.get("price")):
            rate_to_usd = float(direct["price"])
            source = direct_symbol
    if rate_to_usd is None:
        inverse_symbol = "KRW=X" if currency == "KRW" else f"{currency}=X"
        inverse = _quote_from_yahoo_chart(inverse_symbol)
        inverse_price = _coerce_float((inverse or {}).get("price"))
        if inverse_price:
            rate_to_usd = 1.0 / inverse_price
            source = inverse_symbol
    if rate_to_usd:
        cache[currency] = {"date": today, "rateToUsd": rate_to_usd, "source": source, "updatedAt": now_iso()}
        write_json(cache_path, cache)
        return rate_to_usd, source
    return None, "unavailable"


def _portfolio_group(rows, key, value_key="marketValueUsd", cost_key="costUsd", pnl_key="pnlUsd"):
    groups = {}
    total = sum(_float_value(row.get(value_key), 0.0) for row in rows if row.get(value_key) is not None)
    for row in rows:
        value = _float_value(row.get(value_key), 0.0)
        if value <= 0:
            continue
        label = str(row.get(key) or "Unclassified").strip() or "Unclassified"
        item = groups.setdefault(label, {"label": label, "marketValue": 0.0, "cost": 0.0, "pnl": 0.0, "positions": 0, "baseCurrency": "USD"})
        item["marketValue"] += value
        item["cost"] += _float_value(row.get(cost_key), 0.0)
        item["pnl"] += _float_value(row.get(pnl_key), 0.0)
        item["positions"] += 1
    output = []
    for item in groups.values():
        item["weight"] = item["marketValue"] / total if total else None
        item["pnlPct"] = item["pnl"] / item["cost"] if item["cost"] else None
        output.append(item)
    return sorted(output, key=lambda item: item.get("marketValue") or 0, reverse=True)


def portfolio_summary():
    portfolio = get_portfolio()
    rows = []
    fx_rates = {}
    for position in portfolio["positions"]:
        quote = fetch_portfolio_quote(position)
        quantity = _float_value(position.get("quantity"), 0.0)
        avg = _float_value(position.get("averagePrice"), 0.0)
        price = quote.get("price") if quote.get("ok") else None
        currency = str(quote.get("currency") or position.get("currency") or "USD").upper()
        market_value = quantity * price if price is not None else None
        cost = quantity * avg if avg else None
        pnl = (market_value - cost) if market_value is not None and cost is not None else None
        pnl_pct = (pnl / cost) if pnl is not None and cost else None
        day_change = None
        if quote.get("previousClose") and price is not None:
            day_change = (price - quote["previousClose"]) * quantity
        fx_rate, fx_source = fx_rates.get(currency, (None, ""))
        if currency not in fx_rates:
            fx_rate, fx_source = _portfolio_fx_to_usd(currency)
            fx_rates[currency] = (fx_rate, fx_source)
        market_value_usd = market_value * fx_rate if market_value is not None and fx_rate else None
        cost_usd = cost * fx_rate if cost is not None and fx_rate else None
        pnl_usd = pnl * fx_rate if pnl is not None and fx_rate else None
        day_change_usd = day_change * fx_rate if day_change is not None and fx_rate else None
        rows.append({
            **position,
            "name": quote.get("name") or position.get("name") or position.get("ticker"),
            "symbol": quote.get("symbol") or position.get("symbol") or position.get("ticker"),
            "market": quote.get("market") or position.get("market"),
            "assetClass": quote.get("assetClass") or position.get("assetClass") or "Unknown",
            "sector": quote.get("sector") or ETF_SECTOR_MAP.get(str(position.get("ticker") or "").upper().split(".")[0]) or position.get("sector") or "Unclassified",
            "industry": quote.get("industry") or position.get("industry") or "",
            "quoteOk": bool(quote.get("ok")),
            "quoteError": quote.get("error", ""),
            "currentPrice": price,
            "marketValue": market_value,
            "cost": cost,
            "pnl": pnl,
            "pnlPct": pnl_pct,
            "dayChange": day_change,
            "quoteCurrency": currency,
            "fxToUsd": fx_rate,
            "fxSource": fx_source,
            "marketValueUsd": market_value_usd,
            "costUsd": cost_usd,
            "pnlUsd": pnl_usd,
            "dayChangeUsd": day_change_usd,
        })
    aggregated = aggregate_portfolio(rows)
    total_usd = sum(_float_value(row.get("marketValueUsd"), 0.0) for row in aggregated["rows"] if row.get("marketValueUsd") is not None)
    cost_usd = sum(_float_value(row.get("costUsd"), 0.0) for row in aggregated["rows"] if row.get("costUsd") is not None)
    pnl_usd = sum(_float_value(row.get("pnlUsd"), 0.0) for row in aggregated["rows"] if row.get("pnlUsd") is not None)
    for row in aggregated["rows"]:
        row["weight"] = (_float_value(row.get("marketValueUsd"), 0.0) / total_usd) if total_usd and row.get("marketValueUsd") is not None else None
    base_summary = {
        "currency": "USD 기준",
        "marketValue": total_usd,
        "cost": cost_usd,
        "pnl": pnl_usd,
        "pnlPct": pnl_usd / cost_usd if cost_usd else None,
        "positions": len([row for row in aggregated["rows"] if row.get("marketValueUsd") is not None]),
        "baseCurrency": "USD",
    }
    return {
        "positions": aggregated["rows"],
        "summary": [base_summary] + aggregated["summary"],
        "cash": portfolio["cash"],
        "updatedAt": now_iso(),
        "baseCurrency": "USD",
        "fxRates": {key: {"rateToUsd": value[0], "source": value[1]} for key, value in fx_rates.items()},
    }


def _portfolio_target_analysis(rows, total_value):
    items = []
    target_total = 0.0
    has_targets = False
    for row in rows:
        current = _float_value(row.get("weight"), 0.0)
        raw_target = row.get("targetWeight")
        target = _coerce_float(raw_target)
        if target is None:
            target = 0.0
        else:
            has_targets = True
        target_total += target
        diff = current - target
        items.append({
            "id": row.get("id"),
            "ticker": row.get("ticker"),
            "symbol": row.get("symbol"),
            "name": row.get("name") or row.get("ticker"),
            "currentWeight": current,
            "targetWeight": target,
            "diffWeight": diff,
            "diffAmountUsd": diff * total_value if total_value else None,
            "marketValueUsd": row.get("marketValueUsd"),
        })
    return {
        "items": sorted(items, key=lambda item: abs(item.get("diffWeight") or 0), reverse=True),
        "targetTotal": target_total,
        "targetGap": 1.0 - target_total,
        "hasTargets": has_targets,
    }


def portfolio_analytics():
    base = portfolio_summary()
    rows = base.get("positions", [])
    valid = [row for row in rows if _float_value(row.get("marketValueUsd"), 0.0) > 0]
    total_value = sum(_float_value(row.get("marketValueUsd"), 0.0) for row in valid)
    total_cost = sum(_float_value(row.get("costUsd"), 0.0) for row in valid)
    total_pnl = sum(_float_value(row.get("pnlUsd"), 0.0) for row in valid)
    ranked = sorted(valid, key=lambda row: _float_value(row.get("marketValueUsd"), 0.0), reverse=True)
    pnl_ranked = sorted(valid, key=lambda row: abs(_float_value(row.get("pnlUsd"), 0.0)), reverse=True)
    top1 = (_float_value(ranked[0].get("marketValueUsd"), 0.0) / total_value) if total_value and ranked else 0
    top3 = (sum(_float_value(row.get("marketValueUsd"), 0.0) for row in ranked[:3]) / total_value) if total_value else 0
    top5 = (sum(_float_value(row.get("marketValueUsd"), 0.0) for row in ranked[:5]) / total_value) if total_value else 0
    sector_weights = _portfolio_group(valid, "sector")
    market_weights = _portfolio_group(valid, "market")
    currency_weights = _portfolio_group(valid, "quoteCurrency")
    asset_weights = _portfolio_group(valid, "assetClass")
    target_analysis = _portfolio_target_analysis(ranked, total_value)
    comments = []
    if not valid:
        comments.append({"level": "info", "title": "평가 가능한 포지션 없음", "body": "티커, 수량, 평균단가를 입력하고 저장/평가를 누르면 현재 포트폴리오 분석이 생성됩니다."})
    else:
        comments.append({"level": "info", "title": "USD 기준 총 평가손익", "body": f"평가 가능한 {len(valid)}개 포지션 기준 총 손익은 USD {total_pnl:,.0f}이며, 원금 대비 수익률은 {(total_pnl / total_cost * 100) if total_cost else 0:.1f}%입니다. 비중과 차트는 원화/달러 자산을 모두 USD로 환산해 계산합니다."})
        if top1 >= 0.35:
            comments.append({"level": "warn", "title": "단일 종목 집중", "body": f"가장 큰 포지션인 {ranked[0].get('name') or ranked[0].get('ticker')} 비중이 USD 환산 기준 {top1 * 100:.1f}%입니다. 단일 이벤트가 포트폴리오 손익을 크게 좌우할 수 있습니다."})
        if top3 >= 0.65:
            comments.append({"level": "warn", "title": "상위 종목 집중", "body": f"상위 3개 포지션 비중이 USD 환산 기준 {top3 * 100:.1f}%입니다. 의도한 집중투자인지, 리스크 분산이 필요한지 확인할 구간입니다."})
        if sector_weights and (sector_weights[0].get("weight") or 0) >= 0.45:
            comments.append({"level": "warn", "title": "섹터 편중", "body": f"{sector_weights[0]['label']} 섹터가 USD 환산 기준 {sector_weights[0]['weight'] * 100:.1f}%로 가장 큽니다. 같은 업황 변수에 여러 종목이 동시에 반응할 수 있습니다."})
        if market_weights and (market_weights[0].get("weight") or 0) >= 0.75:
            comments.append({"level": "info", "title": "시장 노출", "body": f"{market_weights[0]['label']} 시장 노출이 USD 환산 기준 {market_weights[0]['weight'] * 100:.1f}%입니다. 환율과 해당 시장 휴장일, 금리 이벤트 영향이 커질 수 있습니다."})
        if currency_weights and (currency_weights[0].get("weight") or 0) >= 0.75:
            comments.append({"level": "info", "title": "통화 노출", "body": f"{currency_weights[0]['label']} 표시 자산이 USD 환산 기준 {currency_weights[0]['weight'] * 100:.1f}%입니다. 원화 기준 성과는 종목 수익률과 환율 변동을 분리해서 봐야 합니다."})
        if target_analysis.get("hasTargets"):
            gap = target_analysis.get("targetGap") or 0.0
            if abs(gap) >= 0.005:
                comments.append({"level": "warn", "title": "목표 비중 합계", "body": f"입력된 목표 비중 합계가 {target_analysis.get('targetTotal', 0) * 100:.1f}%입니다. 목표 비중은 100%에 가깝게 맞춰야 현재 비중과 차이를 해석하기 쉽습니다."})
            else:
                comments.append({"level": "info", "title": "목표 비중", "body": "목표 비중 합계가 100%에 가깝습니다. 아래 목표 비중 표에서 현재 비중과 목표 비중의 차이를 확인할 수 있습니다."})
        if pnl_ranked:
            top_pnl = pnl_ranked[0]
            direction = "기여" if _float_value(top_pnl.get("pnlUsd"), 0.0) >= 0 else "손실"
            comments.append({"level": "info", "title": "손익 기여도", "body": f"현재 USD 기준 손익 변동은 {top_pnl.get('name') or top_pnl.get('ticker')}의 {direction} 영향이 가장 큽니다. 포트폴리오 판단 시 비중과 손익 기여도를 함께 확인하세요."})
    base["analytics"] = {
        "baseCurrency": "USD",
        "totalMarketValue": total_value,
        "totalCost": total_cost,
        "totalPnl": total_pnl,
        "totalPnlPct": total_pnl / total_cost if total_cost else None,
        "positionWeights": ranked,
        "sectorWeights": sector_weights,
        "marketWeights": market_weights,
        "currencyWeights": currency_weights,
        "assetClassWeights": asset_weights,
        "pnlContributors": pnl_ranked,
        "targetWeights": target_analysis,
        "concentration": {"top1": top1, "top3": top3, "top5": top5, "holdings": len(valid)},
        "comments": comments,
    }
    return base


# ---------------------------------------------------------------------------
# Presets
# ---------------------------------------------------------------------------

def _slugify(value: str) -> str:
    text = re.sub(r"[^0-9A-Za-z가-힣._-]+", "-", str(value or "").strip()).strip("-")
    return text[:80] or "portfolio"


def normalize_portfolio_weight(value):
    weight = _coerce_float(value)
    if weight is None:
        return 0.0
    if weight > 1:
        weight = weight / 100.0
    return max(0.0, min(1.0, weight))


def normalize_preset_position(row, resolve: bool = False):
    row = row or {}
    ticker = str(row.get("ticker") or row.get("symbol") or "").strip().upper()
    weight = normalize_portfolio_weight(row.get("weight", row.get("targetWeight")))
    resolved = row.get("resolved") if isinstance(row.get("resolved"), dict) else {}
    if resolve and ticker:
        resolved = resolve_portfolio_ticker(ticker, row.get("market") or resolved.get("market") or "")
    symbol = str(row.get("symbol") or resolved.get("symbol") or portfolio_symbol(ticker, resolved.get("market", ""))).strip().upper()
    market = str(row.get("market") or resolved.get("market") or infer_portfolio_market(symbol, resolved)).strip().upper()
    currency = str(row.get("currency") or resolved.get("currency") or ("KRW" if market == "KR" else "USD")).strip().upper()
    return {
        "ticker": ticker,
        "symbol": symbol,
        "name": str(row.get("name") or resolved.get("name") or ticker).strip() or ticker,
        "weight": weight,
        "market": market,
        "currency": currency,
        "assetClass": str(row.get("assetClass") or resolved.get("assetClass") or infer_portfolio_asset_class(resolved, symbol)).strip() or "Unknown",
        "sector": str(row.get("sector") or resolved.get("sector") or "Unclassified").strip() or "Unclassified",
        "resolved": {
            "ok": bool(resolved.get("ok")),
            "ticker": ticker,
            "symbol": symbol,
            "name": str(row.get("name") or resolved.get("name") or ticker).strip() or ticker,
            "market": market,
            "currency": currency,
            "assetClass": str(row.get("assetClass") or resolved.get("assetClass") or infer_portfolio_asset_class(resolved, symbol)).strip() or "Unknown",
            "sector": str(row.get("sector") or resolved.get("sector") or "Unclassified").strip() or "Unclassified",
        },
    }


def _normalize_preset_weights(positions):
    total = sum(_float_value(row.get("weight"), 0.0) for row in positions)
    if total > 0:
        for row in positions:
            row["weight"] = _float_value(row.get("weight"), 0.0) / total
    return positions


def list_portfolio_presets():
    presets = read_json(PORTFOLIO_PRESETS_PATH, [])
    return presets if isinstance(presets, list) else []


def save_portfolio_preset(body):
    data = body if isinstance(body, dict) else {}
    name = str(data.get("name") or "Untitled Preset").strip() or "Untitled Preset"
    preset_id = str(data.get("id") or hashlib.sha256(f"{name}:{now_iso()}".encode("utf-8")).hexdigest()[:12])
    base_currency = str(data.get("baseCurrency") or "USD").strip().upper()
    positions = [normalize_preset_position(row, resolve=True) for row in data.get("positions", []) if isinstance(row, dict)]
    positions = _normalize_preset_weights([row for row in positions if row.get("ticker") and row.get("weight", 0) > 0])
    preset = {
        "id": preset_id,
        "name": name,
        "baseCurrency": base_currency if base_currency in {"USD", "KRW"} else "USD",
        "positions": positions,
        "weightTotal": sum(_float_value(row.get("weight"), 0.0) for row in positions),
        "updatedAt": now_iso(),
    }
    presets = [row for row in list_portfolio_presets() if row.get("id") != preset_id]
    presets.insert(0, preset)
    write_json(PORTFOLIO_PRESETS_PATH, presets)
    return preset


def delete_portfolio_preset(preset_id):
    presets = list_portfolio_presets()
    kept = [row for row in presets if row.get("id") != preset_id]
    write_json(PORTFOLIO_PRESETS_PATH, kept)
    return {"deleted": len(kept) != len(presets), "id": preset_id}


def get_portfolio_preset(preset_id):
    for preset in list_portfolio_presets():
        if preset.get("id") == preset_id:
            return preset
    return None


def preset_from_current_portfolio(name="현재 포트폴리오 목표 비중"):
    portfolio = get_portfolio()
    positions = []
    for row in portfolio.get("positions", []):
        target = row.get("targetWeight")
        if target is None:
            continue
        positions.append({
            "ticker": row.get("ticker"),
            "symbol": row.get("symbol"),
            "name": row.get("name"),
            "market": row.get("market"),
            "currency": row.get("currency"),
            "assetClass": row.get("assetClass"),
            "sector": row.get("sector"),
            "weight": target,
            "resolved": row.get("resolved") or {},
        })
    return save_portfolio_preset({"name": name, "baseCurrency": "USD", "positions": positions})


# ---------------------------------------------------------------------------
# Backtest
# ---------------------------------------------------------------------------

def _series_cache_path(symbol: str, start: str, end: str) -> Path:
    safe = re.sub(r"[^0-9A-Za-z._=-]+", "_", symbol)
    return PORTFOLIO_PRICE_CACHE_DIR / f"{safe}_{start}_{end}.json"


def _download_adjusted_close(symbol: str, start: str, end: str):
    cache_path = _series_cache_path(symbol, start, end)
    cached = read_json(cache_path)
    if isinstance(cached, dict) and cached.get("series"):
        return cached["series"], cached.get("source", "cache")
    try:
        import yfinance as yf
        hist = yf.Ticker(symbol).history(start=start, end=end, interval="1d", auto_adjust=True, actions=False)
        if hist.empty or "Close" not in hist:
            raise ValueError(f"{symbol} 가격 데이터가 비어 있습니다.")
        series = {}
        for index, value in hist["Close"].dropna().items():
            date = index.date().isoformat() if hasattr(index, "date") else str(index)[:10]
            number = _coerce_float(value)
            if number is not None and number > 0:
                series[date] = number
        if not series:
            raise ValueError(f"{symbol} 종가 데이터가 없습니다.")
        PORTFOLIO_PRICE_CACHE_DIR.mkdir(parents=True, exist_ok=True)
        write_json(cache_path, {"symbol": symbol, "start": start, "end": end, "series": series, "source": "yfinance", "updatedAt": now_iso()})
        return series, "yfinance"
    except Exception as exc:
        if isinstance(cached, dict) and cached.get("series"):
            return cached["series"], "stale-cache"
        raise ValueError(f"{symbol} 가격 데이터를 가져오지 못했습니다: {exc}") from exc


def _fx_symbol_for_currency(currency: str):
    currency = str(currency or "USD").upper()
    if currency == "USD":
        return None
    if currency == "KRW":
        return "KRW=X"
    return f"{currency}=X"


def _convert_price_series(series, currency: str, base_currency: str, fx_series=None):
    currency = str(currency or "USD").upper()
    base_currency = str(base_currency or "USD").upper()
    if currency == base_currency:
        return dict(series)
    fx_series = fx_series or {}
    converted = {}
    last_fx = None
    for date in sorted(series.keys()):
        fx = _coerce_float(fx_series.get(date), None)
        if fx is not None and fx > 0:
            last_fx = fx
        if last_fx is None:
            continue
        price = _coerce_float(series.get(date), None)
        if price is None:
            continue
        if currency == "KRW" and base_currency == "USD":
            converted[date] = price / last_fx
        elif currency == "USD" and base_currency == "KRW":
            converted[date] = price * last_fx
        else:
            converted[date] = price
    return converted


def _aligned_price_rows(asset_series):
    dates = sorted(set().union(*(set(item["series"].keys()) for item in asset_series)))
    last_values = {item["symbol"]: None for item in asset_series}
    rows = []
    for date in dates:
        row = {"date": date}
        ok = False
        for item in asset_series:
            symbol = item["symbol"]
            value = _coerce_float(item["series"].get(date), None)
            if value is not None:
                last_values[symbol] = value
            row[symbol] = last_values[symbol]
            if last_values[symbol] is not None:
                ok = True
        if ok:
            rows.append(row)
    complete = [row for row in rows if all(row.get(item["symbol"]) is not None for item in asset_series)]
    return complete


def _is_rebalance_date(previous_date, current_date, frequency):
    if not previous_date:
        return True
    if frequency == "none":
        return False
    prev = dt.date.fromisoformat(previous_date)
    curr = dt.date.fromisoformat(current_date)
    if frequency == "monthly":
        return (prev.year, prev.month) != (curr.year, curr.month)
    if frequency == "quarterly":
        return (prev.year, (prev.month - 1) // 3) != (curr.year, (curr.month - 1) // 3)
    if frequency == "yearly":
        return prev.year != curr.year
    return False


def _run_weight_backtest(price_rows, weights, initial_value, rebalance_frequency):
    if not price_rows:
        return []
    symbols = list(weights.keys())
    shares = {symbol: 0.0 for symbol in symbols}
    values = []
    portfolio_value = float(initial_value or 10000)
    previous_date = ""
    for row in price_rows:
        date = row["date"]
        if _is_rebalance_date(previous_date, date, rebalance_frequency):
            for symbol in symbols:
                price = _coerce_float(row.get(symbol), None)
                shares[symbol] = (portfolio_value * weights[symbol] / price) if price else 0.0
        portfolio_value = sum(shares[symbol] * _float_value(row.get(symbol), 0.0) for symbol in symbols)
        values.append({"date": date, "value": portfolio_value})
        previous_date = date
    return values


def _daily_returns(values):
    returns = []
    previous = None
    for row in values:
        value = _coerce_float(row.get("value"), None)
        if previous and value is not None:
            returns.append({"date": row["date"], "return": (value / previous) - 1.0})
        previous = value
    return returns


def _aligned_return_pairs(values, benchmark_values):
    portfolio_returns = {row["date"]: row["return"] for row in _daily_returns(values)}
    benchmark_returns = {row["date"]: row["return"] for row in _daily_returns(benchmark_values or [])}
    pairs = []
    for date in sorted(set(portfolio_returns) & set(benchmark_returns)):
        p_return = _coerce_float(portfolio_returns.get(date))
        b_return = _coerce_float(benchmark_returns.get(date))
        if p_return is not None and b_return is not None:
            pairs.append((p_return, b_return))
    return pairs


def _mean(items):
    values = [item for item in items if item is not None]
    return sum(values) / len(values) if values else None


def _sample_variance(items):
    values = [item for item in items if item is not None]
    if len(values) < 2:
        return None
    avg = sum(values) / len(values)
    return sum((item - avg) ** 2 for item in values) / (len(values) - 1)


def _sample_covariance(left, right):
    pairs = [(a, b) for a, b in zip(left, right) if a is not None and b is not None]
    if len(pairs) < 2:
        return None
    left_avg = sum(a for a, _ in pairs) / len(pairs)
    right_avg = sum(b for _, b in pairs) / len(pairs)
    return sum((a - left_avg) * (b - right_avg) for a, b in pairs) / (len(pairs) - 1)


def _drawdown_stats(values):
    if not values:
        return {"maxDrawdown": None, "averageDrawdown": None, "maxDrawdownDays": 0}
    peak = _float_value(values[0].get("value"), 0.0)
    drawdowns = []
    current_days = 0
    max_days = 0
    max_drawdown = 0.0
    for row in values:
        value = _float_value(row.get("value"), 0.0)
        if value >= peak:
            peak = value
            current_days = 0
        else:
            current_days += 1
            max_days = max(max_days, current_days)
        drawdown = value / peak - 1.0 if peak else 0.0
        drawdowns.append(drawdown)
        max_drawdown = min(max_drawdown, drawdown)
    negative = [item for item in drawdowns if item < 0]
    return {
        "maxDrawdown": max_drawdown,
        "averageDrawdown": sum(negative) / len(negative) if negative else 0.0,
        "maxDrawdownDays": max_days,
    }


def _var_stats(returns, confidence=0.95):
    values = sorted([item for item in returns if item is not None])
    if not values:
        return {"var95": None, "cvar95": None}
    index = max(0, min(len(values) - 1, int((1 - confidence) * len(values))))
    var = values[index]
    tail = values[:index + 1]
    return {"var95": var, "cvar95": sum(tail) / len(tail) if tail else var}


def _capture_ratio(pairs, direction):
    if direction == "up":
        selected = [(p, b) for p, b in pairs if b > 0]
    else:
        selected = [(p, b) for p, b in pairs if b < 0]
    if not selected:
        return None
    p_sum = sum(p for p, _ in selected)
    b_sum = sum(b for _, b in selected)
    return p_sum / b_sum if b_sum else None


def _period_returns(values, period="year"):
    groups = {}
    for row in values:
        date = dt.date.fromisoformat(row["date"])
        key = str(date.year) if period == "year" else f"{date.year}-{date.month:02d}"
        bucket = groups.setdefault(key, {"start": None, "end": None})
        if bucket["start"] is None:
            bucket["start"] = row["value"]
        bucket["end"] = row["value"]
    return [
        {"period": key, "return": (bucket["end"] / bucket["start"] - 1.0) if bucket["start"] else None}
        for key, bucket in sorted(groups.items())
    ]


def _portfolio_metrics(values, benchmark_values=None):
    if not values:
        return {}
    start_value = _float_value(values[0].get("value"), 0.0)
    end_value = _float_value(values[-1].get("value"), 0.0)
    start_date = dt.date.fromisoformat(values[0]["date"])
    end_date = dt.date.fromisoformat(values[-1]["date"])
    days = max((end_date - start_date).days, 1)
    total_return = (end_value / start_value - 1.0) if start_value else None
    cagr = ((end_value / start_value) ** (365.25 / days) - 1.0) if start_value and end_value > 0 else None
    daily_rows = _daily_returns(values)
    returns = [row["return"] for row in daily_rows]
    avg = sum(returns) / len(returns) if returns else 0.0
    variance = sum((item - avg) ** 2 for item in returns) / (len(returns) - 1) if len(returns) > 1 else 0.0
    volatility = (variance ** 0.5) * (252 ** 0.5) if returns else None
    annualized_return = avg * 252 if returns else None
    sharpe = (avg * 252 / volatility) if volatility else None
    downside = [min(0.0, item) for item in returns]
    downside_var = sum(item ** 2 for item in downside) / len(downside) if downside else 0.0
    downside_volatility = (downside_var ** 0.5) * (252 ** 0.5) if downside_var else None
    sortino = (avg * 252 / downside_volatility) if downside_volatility else None
    drawdown = _drawdown_stats(values)
    max_drawdown = drawdown["maxDrawdown"]
    monthly = _period_returns(values, "month")
    yearly = _period_returns(values, "year")
    best_year = max((row.get("return") for row in yearly if row.get("return") is not None), default=None)
    worst_year = min((row.get("return") for row in yearly if row.get("return") is not None), default=None)
    positive_years = [row for row in yearly if row.get("return") is not None]
    positive_year_ratio = (sum(1 for row in positive_years if row.get("return") > 0) / len(positive_years)) if positive_years else None
    worst_month = min((row.get("return") for row in monthly if row.get("return") is not None), default=None)
    var_stats = _var_stats(returns)
    benchmark_total = None
    excess_return = None
    beta = None
    alpha = None
    correlation = None
    r_squared = None
    information_ratio = None
    treynor = None
    up_capture = None
    down_capture = None
    tracking_error = None
    if benchmark_values:
        b_start = _float_value(benchmark_values[0].get("value"), 0.0)
        b_end = _float_value(benchmark_values[-1].get("value"), 0.0)
        benchmark_total = b_end / b_start - 1.0 if b_start else None
        if total_return is not None and benchmark_total is not None:
            excess_return = total_return - benchmark_total
        pairs = _aligned_return_pairs(values, benchmark_values)
        if len(pairs) > 1:
            p_returns = [item[0] for item in pairs]
            b_returns = [item[1] for item in pairs]
            p_avg = sum(p_returns) / len(p_returns)
            b_avg = sum(b_returns) / len(b_returns)
            covariance = sum((p - p_avg) * (b - b_avg) for p, b in pairs) / (len(pairs) - 1)
            b_variance = sum((b - b_avg) ** 2 for b in b_returns) / (len(b_returns) - 1)
            p_variance = sum((p - p_avg) ** 2 for p in p_returns) / (len(p_returns) - 1)
            beta = covariance / b_variance if b_variance else None
            correlation = covariance / ((p_variance ** 0.5) * (b_variance ** 0.5)) if p_variance and b_variance else None
            r_squared = correlation ** 2 if correlation is not None else None
            b_annual = b_avg * 252
            alpha = (avg * 252) - (beta * b_annual) if beta is not None else None
            active_returns = [p - b for p, b in pairs]
            tracking_error = (_sample_variance(active_returns) ** 0.5) * (252 ** 0.5) if _sample_variance(active_returns) else None
            information_ratio = ((avg - b_avg) * 252 / tracking_error) if tracking_error else None
            treynor = (avg * 252 / beta) if beta else None
            up_capture = _capture_ratio(pairs, "up")
            down_capture = _capture_ratio(pairs, "down")
    calmar = (cagr / abs(max_drawdown)) if cagr is not None and max_drawdown else None
    return {
        "startValue": start_value, "endValue": end_value, "totalReturn": total_return, "cagr": cagr,
        "annualizedReturn": annualized_return, "bestYear": best_year, "worstYear": worst_year,
        "positiveYearRatio": positive_year_ratio, "worstMonth": worst_month, "volatility": volatility,
        "downsideVolatility": downside_volatility, "maxDrawdown": max_drawdown,
        "averageDrawdown": drawdown["averageDrawdown"], "maxDrawdownDays": drawdown["maxDrawdownDays"],
        "var95": var_stats["var95"], "cvar95": var_stats["cvar95"], "sharpe": sharpe, "sortino": sortino,
        "calmar": calmar, "informationRatio": information_ratio, "treynor": treynor,
        "benchmarkTotalReturn": benchmark_total, "excessReturn": excess_return, "beta": beta, "alpha": alpha,
        "correlation": correlation, "rSquared": r_squared, "trackingError": tracking_error,
        "upCapture": up_capture, "downCapture": down_capture, "days": days, "observations": len(values),
    }


def _asset_contributions(asset_series, weights, initial_value):
    items = []
    for item in asset_series:
        symbol = item["symbol"]
        series = item["series"]
        if not series:
            continue
        dates = sorted(series.keys())
        start = _float_value(series.get(dates[0]), 0.0)
        end = _float_value(series.get(dates[-1]), 0.0)
        asset_return = end / start - 1.0 if start else None
        contribution = (weights.get(symbol, 0.0) * asset_return) if asset_return is not None else None
        items.append({
            "ticker": item.get("ticker"),
            "symbol": symbol,
            "name": item.get("name"),
            "weight": weights.get(symbol, 0.0),
            "return": asset_return,
            "contribution": contribution,
            "contributionAmount": contribution * initial_value if contribution is not None else None,
        })
    return sorted(items, key=lambda row: abs(row.get("contribution") or 0.0), reverse=True)


def _asset_daily_return_rows(price_rows, symbols):
    rows = []
    previous = None
    for row in price_rows:
        if previous is None:
            previous = row
            continue
        out = {"date": row["date"]}
        ok = False
        for symbol in symbols:
            prev = _coerce_float(previous.get(symbol), None)
            curr = _coerce_float(row.get(symbol), None)
            value = (curr / prev - 1.0) if prev and curr is not None else None
            out[symbol] = value
            ok = ok or value is not None
        if ok:
            rows.append(out)
        previous = row
    return rows


def _asset_risk_contributions(asset_series, price_rows, weights, benchmark_values=None):
    symbols = [item["symbol"] for item in asset_series]
    return_rows = _asset_daily_return_rows(price_rows, symbols)
    if not return_rows:
        return []
    portfolio_returns = []
    asset_returns = {symbol: [] for symbol in symbols}
    for row in return_rows:
        total = 0.0
        ok = False
        for symbol in symbols:
            value = _coerce_float(row.get(symbol), None)
            asset_returns[symbol].append(value)
            if value is not None:
                total += weights.get(symbol, 0.0) * value
                ok = True
        portfolio_returns.append(total if ok else None)
    portfolio_variance = _sample_variance(portfolio_returns)
    portfolio_vol = (portfolio_variance ** 0.5) if portfolio_variance else None
    benchmark_returns_by_date = {row["date"]: row["return"] for row in _daily_returns(benchmark_values or [])}
    benchmark_returns = [benchmark_returns_by_date.get(row["date"]) for row in return_rows]
    benchmark_variance = _sample_variance(benchmark_returns)
    items = []
    for item in asset_series:
        symbol = item["symbol"]
        returns = asset_returns.get(symbol, [])
        asset_var = _sample_variance(returns)
        asset_vol = (asset_var ** 0.5) * (252 ** 0.5) if asset_var else None
        cov_with_portfolio = _sample_covariance(returns, portfolio_returns)
        marginal_risk = cov_with_portfolio / portfolio_vol if cov_with_portfolio is not None and portfolio_vol else None
        volatility_contribution = weights.get(symbol, 0.0) * marginal_risk * (252 ** 0.5) if marginal_risk is not None else None
        volatility_share = (volatility_contribution / (portfolio_vol * (252 ** 0.5))) if volatility_contribution is not None and portfolio_vol else None
        cov_with_benchmark = _sample_covariance(returns, benchmark_returns)
        asset_beta = cov_with_benchmark / benchmark_variance if cov_with_benchmark is not None and benchmark_variance else None
        beta_contribution = weights.get(symbol, 0.0) * asset_beta if asset_beta is not None else None
        items.append({
            "ticker": item.get("ticker"),
            "symbol": symbol,
            "name": item.get("name"),
            "weight": weights.get(symbol, 0.0),
            "assetVolatility": asset_vol,
            "volatilityContribution": volatility_contribution,
            "volatilityShare": volatility_share,
            "assetBeta": asset_beta,
            "betaContribution": beta_contribution,
        })
    return sorted(items, key=lambda row: abs(row.get("volatilityContribution") or 0.0), reverse=True)


def _rolling_metrics(values, benchmark_values=None, window=252):
    daily = _daily_returns(values)
    benchmark = {row["date"]: row["return"] for row in _daily_returns(benchmark_values or [])}
    rows = []
    for index in range(window - 1, len(daily)):
        chunk = daily[index - window + 1:index + 1]
        returns = [row["return"] for row in chunk if row.get("return") is not None]
        if not returns:
            continue
        total_return = 1.0
        for value in returns:
            total_return *= (1.0 + value)
        variance = _sample_variance(returns)
        volatility = (variance ** 0.5) * (252 ** 0.5) if variance else None
        beta = None
        b_returns = [benchmark.get(row["date"]) for row in chunk]
        b_variance = _sample_variance(b_returns)
        covariance = _sample_covariance(returns, b_returns)
        if covariance is not None and b_variance:
            beta = covariance / b_variance
        rows.append({
            "date": chunk[-1]["date"],
            "rollingReturn": total_return - 1.0,
            "rollingVolatility": volatility,
            "rollingBeta": beta,
            "window": window,
        })
    return rows


def run_portfolio_backtest(body, save_result=False):
    data = body if isinstance(body, dict) else {}
    preset = get_portfolio_preset(str(data.get("presetId") or ""))
    if not preset and isinstance(data.get("preset"), dict):
        preset = data["preset"]
    if not preset:
        raise HTTPException(status_code=404, detail="Portfolio preset not found")
    start = str(data.get("start") or "2018-01-01")[:10]
    end = str(data.get("end") or kst_date())[:10]
    if start >= end:
        raise HTTPException(status_code=400, detail="Start date must be before end date")
    base_currency = str(data.get("baseCurrency") or preset.get("baseCurrency") or "USD").upper()
    if base_currency not in {"USD", "KRW"}:
        base_currency = "USD"
    initial_value = _float_value(data.get("initialValue"), 10000.0)
    rebalance = str(data.get("rebalance") or "monthly").lower()
    if rebalance not in {"none", "monthly", "quarterly", "yearly"}:
        rebalance = "monthly"
    benchmark_ticker = str(data.get("benchmark") or ("SPY" if base_currency == "USD" else "069500.KS")).strip().upper()
    preset_id = str(preset.get("id") or "")
    should_resolve_positions = (not preset_id) or preset_id.startswith("draft-")
    positions = _normalize_preset_weights([normalize_preset_position(row, resolve=should_resolve_positions) for row in preset.get("positions", [])])
    positions = [row for row in positions if row.get("ticker") and row.get("weight") > 0]
    if not positions:
        raise HTTPException(status_code=400, detail="Preset has no weighted positions")
    fx_series = {}
    if any(row.get("currency") != base_currency for row in positions) or benchmark_ticker.endswith((".KS", ".KQ")) != (base_currency == "KRW"):
        fx_symbol = "KRW=X"
        fx_series, _ = _download_adjusted_close(fx_symbol, start, end)
    asset_series = []
    sources = []
    for row in positions:
        raw_series, source = _download_adjusted_close(row["symbol"], start, end)
        converted = _convert_price_series(raw_series, row.get("currency"), base_currency, fx_series)
        if not converted:
            raise HTTPException(status_code=400, detail=f"{row['ticker']} converted price series is empty")
        asset_series.append({**row, "series": converted})
        sources.append({"ticker": row["ticker"], "symbol": row["symbol"], "currency": row.get("currency"), "source": source})
    price_rows = _aligned_price_rows(asset_series)
    if len(price_rows) < 3:
        raise HTTPException(status_code=400, detail="Not enough overlapping price data for backtest")
    weights = {item["symbol"]: _float_value(item.get("weight"), 0.0) for item in asset_series}
    values = _run_weight_backtest(price_rows, weights, initial_value, rebalance)
    benchmark_values = []
    benchmark = None
    if benchmark_ticker:
        resolved_benchmark = resolve_portfolio_ticker(benchmark_ticker)
        benchmark_symbol = resolved_benchmark.get("symbol") or portfolio_symbol(benchmark_ticker)
        benchmark_currency = resolved_benchmark.get("currency") or ("KRW" if benchmark_symbol.endswith((".KS", ".KQ")) else "USD")
        raw_benchmark, source = _download_adjusted_close(benchmark_symbol, start, end)
        converted_benchmark = _convert_price_series(raw_benchmark, benchmark_currency, base_currency, fx_series)
        benchmark_rows = _aligned_price_rows([{"symbol": benchmark_symbol, "series": converted_benchmark}])
        benchmark_values = _run_weight_backtest(benchmark_rows, {benchmark_symbol: 1.0}, initial_value, "none")
        benchmark = {"ticker": benchmark_ticker, "symbol": benchmark_symbol, "name": resolved_benchmark.get("name") or benchmark_ticker, "source": source}
    result = {
        "id": hashlib.sha256(f"{preset.get('id')}:{start}:{end}:{rebalance}:{base_currency}:{now_iso()}".encode("utf-8")).hexdigest()[:16],
        "name": f"{preset.get('name', 'Preset')} 백테스트",
        "presetId": preset.get("id"),
        "presetName": preset.get("name"),
        "start": values[0]["date"],
        "end": values[-1]["date"],
        "requestedStart": start,
        "requestedEnd": end,
        "baseCurrency": base_currency,
        "initialValue": initial_value,
        "rebalance": rebalance,
        "benchmark": benchmark,
        "metrics": _portfolio_metrics(values, benchmark_values),
        "series": values,
        "benchmarkSeries": benchmark_values,
        "yearlyReturns": _period_returns(values, "year"),
        "monthlyReturns": _period_returns(values, "month"),
        "assetContributions": _asset_contributions(asset_series, weights, initial_value),
        "riskContributions": _asset_risk_contributions(asset_series, price_rows, weights, benchmark_values),
        "rollingMetrics": _rolling_metrics(values, benchmark_values, 252),
        "positions": [{k: v for k, v in row.items() if k != "series"} for row in asset_series],
        "sources": sources + ([{"ticker": benchmark_ticker, "symbol": benchmark.get("symbol"), "source": benchmark.get("source")}] if benchmark else []),
        "assumptions": [
            "yfinance auto_adjust=True 조정 종가를 사용합니다.",
            "배당과 분할은 조정가격에 반영된 것으로 간주합니다.",
            "수수료, 세금, 슬리피지, 체결오차는 제외합니다.",
            "KRW/USD 혼합 자산은 일자별 KRW=X 환율을 사용해 기준 통화로 환산합니다.",
            "누락된 환율은 직전 값을 사용합니다.",
        ],
        "createdAt": now_iso(),
    }
    if save_result:
        BACKTESTS_DIR.mkdir(parents=True, exist_ok=True)
        result["savedAt"] = now_iso()
        write_json(BACKTESTS_DIR / f"{result['id']}.json", result)
    return result


def save_portfolio_backtest_result(body):
    data = body if isinstance(body, dict) else {}
    result = data.get("result") if isinstance(data.get("result"), dict) else data
    if not isinstance(result, dict):
        raise HTTPException(status_code=400, detail="Backtest result is required")
    if result.get("type") == "comparison":
        if not isinstance(result.get("results"), list) or not result.get("results"):
            raise HTTPException(status_code=400, detail="Comparison result is empty")
    elif not isinstance(result.get("metrics"), dict) or not isinstance(result.get("series"), list):
        raise HTTPException(status_code=400, detail="Backtest result is incomplete")
    result = dict(result)
    result_id = str(result.get("id") or "").strip()
    if not result_id:
        basis = f"{result.get('name')}:{result.get('start')}:{result.get('end')}:{now_iso()}"
        result_id = hashlib.sha256(basis.encode("utf-8")).hexdigest()[:16]
    result["id"] = re.sub(r"[^A-Za-z0-9_-]", "", result_id)[:40] or hashlib.sha256(now_iso().encode("utf-8")).hexdigest()[:16]
    result["savedAt"] = now_iso()
    result.setdefault("createdAt", result["savedAt"])
    BACKTESTS_DIR.mkdir(parents=True, exist_ok=True)
    write_json(BACKTESTS_DIR / f"{result['id']}.json", result)
    return result


def run_portfolio_backtest_comparison(body):
    data = body if isinstance(body, dict) else {}
    preset_ids = [str(item).strip() for item in data.get("presetIds", []) if str(item).strip()]
    preset_ids = list(dict.fromkeys(preset_ids))
    draft_presets = [item for item in data.get("presets", []) if isinstance(item, dict)]
    if len(preset_ids) + len(draft_presets) < 2:
        raise HTTPException(status_code=400, detail="Select or create at least two portfolio drafts to compare")
    results = []
    errors = []
    for preset_id in preset_ids:
        try:
            payload = {**data, "presetId": preset_id}
            results.append(run_portfolio_backtest(payload, save_result=False))
        except Exception as exc:
            preset = get_portfolio_preset(preset_id) or {}
            errors.append({"presetId": preset_id, "presetName": preset.get("name") or preset_id, "error": str(exc)})
    for index, preset in enumerate(draft_presets, start=1):
        draft_name = str(preset.get("name") or f"비교 초안 {index}").strip()
        try:
            payload = {**data, "presetId": "", "preset": {**preset, "name": draft_name}}
            results.append(run_portfolio_backtest(payload, save_result=False))
        except Exception as exc:
            errors.append({"presetId": str(preset.get("id") or f"draft-{index}"), "presetName": draft_name, "error": str(exc)})
    if not results:
        raise HTTPException(status_code=400, detail="No comparable backtest result could be generated")
    first = results[0]
    return {
        "type": "comparison",
        "id": hashlib.sha256(f"compare:{','.join(preset_ids)}:{len(draft_presets)}:{data.get('start')}:{data.get('end')}:{now_iso()}".encode("utf-8")).hexdigest()[:16],
        "name": "포트폴리오 비교 백테스트",
        "presetIds": preset_ids,
        "draftCount": len(draft_presets),
        "start": first.get("start"),
        "end": first.get("end"),
        "requestedStart": first.get("requestedStart"),
        "requestedEnd": first.get("requestedEnd"),
        "baseCurrency": first.get("baseCurrency"),
        "initialValue": first.get("initialValue"),
        "rebalance": first.get("rebalance"),
        "results": results,
        "errors": errors,
        "assumptions": first.get("assumptions", []),
        "createdAt": now_iso(),
    }


def list_portfolio_backtests():
    if not BACKTESTS_DIR.exists():
        return []
    items = []
    for path in sorted(BACKTESTS_DIR.glob("*.json"), key=lambda item: item.stat().st_mtime, reverse=True):
        data = read_json(path, {})
        if isinstance(data, dict):
            items.append({
                "id": data.get("id") or path.stem,
                "name": data.get("name") or path.stem,
                "presetName": data.get("presetName", ""),
                "type": data.get("type", "single"),
                "start": data.get("start", ""),
                "end": data.get("end", ""),
                "baseCurrency": data.get("baseCurrency", ""),
                "createdAt": data.get("createdAt", ""),
                "savedAt": data.get("savedAt", ""),
                "metrics": data.get("metrics", {}),
                "resultCount": len(data.get("results", [])) if isinstance(data.get("results"), list) else 1,
            })
    return items


def get_portfolio_backtest(backtest_id):
    path = BACKTESTS_DIR / f"{backtest_id}.json"
    if not path.exists():
        return None
    return read_json(path)


def delete_portfolio_backtest(backtest_id):
    path = BACKTESTS_DIR / f"{backtest_id}.json"
    if path.exists():
        path.unlink()
        return {"deleted": True, "id": backtest_id}
    return {"deleted": False, "id": backtest_id}
