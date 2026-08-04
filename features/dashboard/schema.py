from __future__ import annotations

import re

VALID_MODES = {"cockpit", "legacy"}
VALID_CALENDAR_VIEWS = {"week", "month"}
VALID_CALENDAR_KINDS = {"all", "earnings", "macro", "central_bank", "holiday", "filing", "dividend"}
VALID_CALENDAR_MARKETS = {"all", "US", "KR"}
VALID_CHART_RANGES = {"1m", "3m", "6m", "1y", "5y"}
VALID_CHART_STYLES = {"candle", "line"}


def normalize_dashboard_settings(value: dict | None) -> dict:
    value = value or {}
    mode = str(value.get("dashboardMode") or "cockpit").strip().lower()
    calendar_view = str(value.get("calendarView") or "week").strip().lower()
    calendar_kind = str(value.get("calendarKind") or "all").strip().lower()
    calendar_market = str(value.get("calendarMarket") or "all").strip()
    chart_range = str(value.get("chartRange") or "3m").strip().lower()
    chart_style = str(value.get("chartStyle") or "line").strip().lower()
    chart_symbol = str(value.get("chartSymbol") or "").strip().upper()[:20]
    return {
        "schemaVersion": 1,
        "dashboardMode": mode if mode in VALID_MODES else "cockpit",
        "calendarView": calendar_view if calendar_view in VALID_CALENDAR_VIEWS else "week",
        "calendarKind": calendar_kind if calendar_kind in VALID_CALENDAR_KINDS else "all",
        "calendarMarket": calendar_market if calendar_market in VALID_CALENDAR_MARKETS else "all",
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
