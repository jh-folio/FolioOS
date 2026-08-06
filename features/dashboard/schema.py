from __future__ import annotations

import re

from features.common.markets import MarketCode, PRODUCT_MARKETS, normalize_market_code

VALID_MODES = {"cockpit", "legacy"}
VALID_CALENDAR_VIEWS = {"week", "month"}
VALID_CALENDAR_KINDS = {"all", "earnings", "macro", "central_bank", "holiday", "filing", "dividend"}
VALID_CALENDAR_MARKETS = {"all", *(market.value for market in PRODUCT_MARKETS)}
VALID_CHART_RANGES = {"1m", "3m", "6m", "1y", "5y"}
VALID_CHART_STYLES = {"candle", "line"}


def _string_set(value: object, allowed: set[str]) -> list[str]:
    """Ordered, deduplicated subset of `allowed`. Unknown values are dropped."""
    if not isinstance(value, list):
        return []
    out: list[str] = []
    for item in value:
        token = str(item or "").strip().lower()
        if token in allowed and token not in out:
            out.append(token)
    return out


def _market_set(value: object) -> list[str]:
    if not isinstance(value, list):
        return []
    out: list[str] = []
    for item in value:
        code = normalize_market_code(str(item or "").strip())
        if code is not MarketCode.UNKNOWN and code.value not in out:
            out.append(code.value)
    return out


def normalize_dashboard_settings(value: dict | None) -> dict:
    value = value or {}
    mode = str(value.get("dashboardMode") or "cockpit").strip().lower()
    calendar_view = str(value.get("calendarView") or "week").strip().lower()
    calendar_kind = str(value.get("calendarKind") or "all").strip().lower()
    raw_calendar_market = str(value.get("calendarMarket") or "all").strip()
    normalized_calendar_market = normalize_market_code(raw_calendar_market)
    calendar_market = (
        normalized_calendar_market.value
        if raw_calendar_market.casefold() != "all" and normalized_calendar_market is not MarketCode.UNKNOWN
        else "all"
    )
    # 다중 선택. 빈 목록이 "전체"라 `all` 같은 특수값이 필요 없다. 예전 단일 설정은
    # 한 개짜리 목록으로 승격해 기존 사용자의 선택을 잃지 않는다.
    calendar_kinds = _string_set(value.get("calendarKinds"), VALID_CALENDAR_KINDS - {"all"})
    if not calendar_kinds and calendar_kind != "all":
        calendar_kinds = [calendar_kind]
    calendar_markets = _market_set(value.get("calendarMarkets"))
    if not calendar_markets and calendar_market != "all":
        calendar_markets = [calendar_market]
    chart_range = str(value.get("chartRange") or "3m").strip().lower()
    chart_style = str(value.get("chartStyle") or "line").strip().lower()
    chart_symbol = str(value.get("chartSymbol") or "").strip().upper()[:20]
    return {
        "schemaVersion": 1,
        "dashboardMode": mode if mode in VALID_MODES else "cockpit",
        "calendarView": calendar_view if calendar_view in VALID_CALENDAR_VIEWS else "week",
        "calendarKind": calendar_kind if calendar_kind in VALID_CALENDAR_KINDS else "all",
        "calendarMarket": calendar_market if calendar_market in VALID_CALENDAR_MARKETS else "all",
        "calendarKinds": calendar_kinds,
        "calendarMarkets": calendar_markets,
        "calendarWatchlistOnly": bool(value.get("calendarWatchlistOnly")),
        "chartRange": chart_range if chart_range in VALID_CHART_RANGES else "3m",
        "chartStyle": chart_style if chart_style in VALID_CHART_STYLES else "line",
        "chartSymbol": chart_symbol if re.fullmatch(r"\^?[A-Z0-9.=-]{1,20}", chart_symbol) else "",
    }


def native_symbol(value: str) -> str:
    raw = str(value or "").strip().upper()
    mapping = {
        "FOREXCOM:SPXUSD": "SPY", "AMEX:SPY": "SPY", "NASDAQ:NDX": "QQQ",
        "FOREXCOM:NSXUSD": "QQQ", "INDEX:KSIC": "^KS11", "KRX:KOSPI": "^KS11",
    }
    if raw in mapping:
        return mapping[raw]
    if ":" in raw:
        exchange, symbol = raw.split(":", 1)
        if exchange == "KRX" and re.fullmatch(r"\d{6}", symbol):
            return f"{symbol}.KS"
        if exchange in {"NASDAQ", "NYSE", "AMEX"} and re.fullmatch(r"[A-Z0-9.-]{1,20}", symbol):
            return symbol.replace(".", "-")
    return raw if re.fullmatch(r"\^?[A-Z0-9.-]{1,20}", raw) else ""
