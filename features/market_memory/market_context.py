from __future__ import annotations

import datetime as dt
from typing import Any
from zoneinfo import ZoneInfo

from features.llm_settings.client import bok_api_key, fred_api_key

try:
    KST = ZoneInfo("Asia/Seoul")
except Exception:
    KST = dt.timezone(dt.timedelta(hours=9))

US_MARKET_SYMBOLS: dict[str, tuple[str, str]] = {
    "sp500": ("S&P 500", "^GSPC"),
    "nasdaq": ("Nasdaq Composite", "^IXIC"),
    "dow": ("Dow Jones", "^DJI"),
    "vix": ("VIX", "^VIX"),
    "us10y_proxy": ("US 10Y Yield Proxy", "^TNX"),
    "dollar_index": ("US Dollar Index", "DX-Y.NYB"),
    "wti": ("WTI Crude", "CL=F"),
}

KR_MARKET_SYMBOLS: dict[str, tuple[str, str]] = {
    "kospi": ("KOSPI", "^KS11"),
    "kosdaq": ("KOSDAQ", "^KQ11"),
    "usdkrw": ("USD/KRW", "USDKRW=X"),
    "ewy": ("MSCI Korea ETF", "EWY"),
}

FRED_SERIES = ["FEDFUNDS", "DGS10", "DGS2", "T10Y2Y", "UNRATE", "CPIAUCSL"]
BOK_SERIES = ["722Y001", "731Y003", "301Y013", "732Y004"]


def _now() -> str:
    return dt.datetime.now(tz=KST).isoformat()


def _safe_float(value: Any) -> float | None:
    try:
        if value is None or value != value:
            return None
        return round(float(value), 4)
    except Exception:
        return None


def _compact_market_item(raw: dict, default_source: str = "") -> dict:
    return {
        "id": str(raw.get("id") or raw.get("symbol") or "").strip(),
        "label": str(raw.get("label") or raw.get("name") or raw.get("id") or "").strip(),
        "symbol": str(raw.get("symbol") or raw.get("ticker") or "").strip(),
        "value": _safe_float(raw.get("value") if raw.get("value") is not None else raw.get("close")),
        "changePct1d": _safe_float(raw.get("changePct1d") if raw.get("changePct1d") is not None else raw.get("changePct")),
        "changePct5d": _safe_float(raw.get("changePct5d")),
        "source": str(raw.get("source") or default_source).strip(),
        "asOf": str(raw.get("asOf") or raw.get("asOfDate") or "").strip()[:24],
        "freshness": str(raw.get("freshness") or raw.get("status") or "latest_available").strip(),
    }


def normalize_market_tape(tape: dict | None) -> dict:
    if not isinstance(tape, dict):
        return {
            "status": "unavailable",
            "asOf": _now(),
            "markets": {"us": [], "kr": []},
            "dataGaps": ["marketTape unavailable"],
        }
    markets = tape.get("markets") if isinstance(tape.get("markets"), dict) else {}
    normalized = {
        "status": str(tape.get("status") or "partial").strip(),
        "asOf": str(tape.get("asOf") or _now()).strip(),
        "markets": {"us": [], "kr": []},
        "dataGaps": [str(item) for item in (tape.get("dataGaps") or tape.get("warnings") or []) if str(item).strip()][:12],
    }
    for market in ("us", "kr"):
        rows = markets.get(market) if isinstance(markets.get(market), list) else []
        normalized["markets"][market] = [
            item for raw in rows[:12] if (item := _compact_market_item(raw, "yfinance")).get("label")
        ]
    if not normalized["markets"]["us"] and not normalized["markets"]["kr"] and normalized["status"] != "unavailable":
        normalized["status"] = "unavailable"
        normalized["dataGaps"].append("no market rows")
    return normalized


def _latest_yfinance_item(yf, item_id: str, label: str, symbol: str) -> dict | None:
    hist = yf.Ticker(symbol).history(period="10d", interval="1d", auto_adjust=False)
    if hist is None or hist.empty or "Close" not in hist:
        return None
    rows = []
    for index, close in zip(hist.index, hist["Close"].tolist()):
        value = _safe_float(close)
        if value is None:
            continue
        rows.append((str(index)[:10], value))
    if not rows:
        return None
    as_of, close = rows[-1]
    prev = rows[-2][1] if len(rows) >= 2 else None
    five = rows[-6][1] if len(rows) >= 6 else None
    return {
        "id": item_id,
        "label": label,
        "symbol": symbol,
        "value": close,
        "changePct1d": round((close / prev - 1.0) * 100.0, 4) if prev else None,
        "changePct5d": round((close / five - 1.0) * 100.0, 4) if five else None,
        "source": "yfinance",
        "asOf": as_of,
        "freshness": "latest_available",
    }


def fetch_market_tape() -> dict:
    try:
        import yfinance as yf
    except Exception as exc:
        return normalize_market_tape({"status": "unavailable", "dataGaps": [f"yfinance unavailable: {exc}"]})
    data_gaps: list[str] = []
    markets = {"us": [], "kr": []}
    for market, symbols in (("us", US_MARKET_SYMBOLS), ("kr", KR_MARKET_SYMBOLS)):
        for item_id, (label, symbol) in symbols.items():
            try:
                item = _latest_yfinance_item(yf, item_id, label, symbol)
            except Exception as exc:
                data_gaps.append(f"{symbol}: {exc}")
                continue
            if item:
                markets[market].append(item)
    status = "available" if markets["us"] and markets["kr"] else "partial" if markets["us"] or markets["kr"] else "unavailable"
    return normalize_market_tape({"status": status, "asOf": _now(), "markets": markets, "dataGaps": data_gaps})


def _compact_macro_item(item_id: str, raw: dict, source: str) -> dict:
    return {
        "id": item_id,
        "label": str(raw.get("label") or item_id).strip(),
        "value": _safe_float(raw.get("latest")),
        "changeMoM": _safe_float(raw.get("changeMoM")),
        "changeYoY": _safe_float(raw.get("changeYoY")),
        "period": str(raw.get("latestDate") or raw.get("latestPeriod") or "").strip(),
        "source": source,
        "freshness": "latest_available",
    }


def normalize_macro_snapshot(snapshot: dict | None) -> dict:
    if not isinstance(snapshot, dict):
        return {
            "status": "unavailable",
            "asOf": _now(),
            "items": {"us": [], "kr": []},
            "providers": {"fred": {"ok": False}, "bok": {"ok": False}},
            "dataGaps": ["macroSnapshot unavailable"],
        }
    items = snapshot.get("items") if isinstance(snapshot.get("items"), dict) else {}
    providers = snapshot.get("providers") if isinstance(snapshot.get("providers"), dict) else {}
    normalized = {
        "status": str(snapshot.get("status") or "partial").strip(),
        "asOf": str(snapshot.get("asOf") or _now()).strip(),
        "items": {"us": [], "kr": []},
        "providers": {
            "fred": providers.get("fred") if isinstance(providers.get("fred"), dict) else {"ok": False},
            "bok": providers.get("bok") if isinstance(providers.get("bok"), dict) else {"ok": False},
        },
        "dataGaps": [str(item) for item in (snapshot.get("dataGaps") or snapshot.get("errors") or []) if str(item).strip()][:12],
    }
    for market in ("us", "kr"):
        rows = items.get(market) if isinstance(items.get(market), list) else []
        normalized["items"][market] = [
            {
                "id": str(raw.get("id") or "").strip(),
                "label": str(raw.get("label") or raw.get("id") or "").strip(),
                "value": _safe_float(raw.get("value")),
                "changeMoM": _safe_float(raw.get("changeMoM")),
                "changeYoY": _safe_float(raw.get("changeYoY")),
                "period": str(raw.get("period") or raw.get("latestDate") or raw.get("latestPeriod") or "").strip(),
                "source": str(raw.get("source") or "").strip(),
                "freshness": str(raw.get("freshness") or "latest_available").strip(),
            }
            for raw in rows[:12]
            if isinstance(raw, dict) and str(raw.get("label") or raw.get("id") or "").strip()
        ]
    if not normalized["items"]["us"] and not normalized["items"]["kr"] and normalized["status"] != "unavailable":
        normalized["status"] = "unavailable"
        normalized["dataGaps"].append("no macro rows")
    return normalized


def fetch_macro_snapshot() -> dict:
    data_gaps: list[str] = []
    items = {"us": [], "kr": []}
    providers = {"fred": {"ok": False}, "bok": {"ok": False}}
    try:
        from features.topic_report.macro_data import fetch_bok_data, fetch_fred_data
    except Exception as exc:
        return normalize_macro_snapshot({"status": "unavailable", "dataGaps": [f"macro fetcher unavailable: {exc}"]})

    fred_key = fred_api_key()
    if fred_key:
        fred = fetch_fred_data(FRED_SERIES, fred_key)
        providers["fred"] = {"ok": bool(fred.get("ok")), "series": list((fred.get("series") or {}).keys())}
        data_gaps.extend(str(err) for err in (fred.get("errors") or [])[:5])
        for series_id, raw in (fred.get("series") or {}).items():
            items["us"].append(_compact_macro_item(series_id, raw, "fred"))
    else:
        data_gaps.append("FRED_API_KEY not configured")

    bok_key = bok_api_key()
    if bok_key:
        bok = fetch_bok_data(BOK_SERIES, bok_key)
        providers["bok"] = {"ok": bool(bok.get("ok")), "series": list((bok.get("series") or {}).keys())}
        data_gaps.extend(str(err) for err in (bok.get("errors") or [])[:5])
        for series_id, raw in (bok.get("series") or {}).items():
            items["kr"].append(_compact_macro_item(series_id, raw, "bok"))
    else:
        data_gaps.append("BOK_API_KEY not configured")

    status = "available" if items["us"] and items["kr"] else "partial" if items["us"] or items["kr"] else "unavailable"
    return normalize_macro_snapshot({"status": status, "asOf": _now(), "items": items, "providers": providers, "dataGaps": data_gaps})


def build_market_macro_context(
    *,
    market_tape: dict | None = None,
    macro_snapshot: dict | None = None,
    fetch_live: bool = True,
) -> dict:
    return {
        "marketTape": normalize_market_tape(market_tape) if market_tape is not None else (fetch_market_tape() if fetch_live else normalize_market_tape(None)),
        "macroSnapshot": normalize_macro_snapshot(macro_snapshot) if macro_snapshot is not None else (fetch_macro_snapshot() if fetch_live else normalize_macro_snapshot(None)),
    }
