"""Dashboard current-market widget settings.

This module stores widget configuration only. It never stores widget output,
quotes, chart data, briefing evidence, or market-memory evidence.
"""
from __future__ import annotations

from copy import deepcopy
from pathlib import Path
import re

from features.common.utils import read_json, write_json


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data"
SETTINGS_PATH = DATA_DIR / "market-widget-settings.json"

ALLOWED_TYPES = {
    "market_overview",
    "advanced_chart",
    "symbol_overview",
    "ticker_tape",
    "ticker_tag",
    "ticker",
    "single_ticker",
    "forex_cross_rates",
    "stock_heatmap",
    "economic_calendar",
}
ALLOWED_SIZES = {"wide", "medium", "compact"}
ALLOWED_THEMES = {"auto", "light", "dark"}
SYMBOL_RE = re.compile(r"^[A-Z0-9_:.!/-]{1,40}$")

EMBED_SAFE_SYMBOL_REPLACEMENTS = {
    # These work on TradingView.com but can be restricted in external embeds.
    # Use liquid ETF proxies for dashboard widgets so the card renders reliably.
    "TVC:RUT": "AMEX:IWM",
    "TVC:DXY": "AMEX:UUP",
    "TVC:US10Y": "NASDAQ:TLT",
    "NYMEX:CL1!": "AMEX:USO",
}
REMOVED_DEFAULT_WIDGET_IDS = {"focus-rut", "focus-dxy", "focus-us10y", "focus-wti"}
LEGACY_DEFAULT_WIDGET_ID_SETS = [
    {"market-overview-default", "focus-spx"},
]

MARKET_OVERVIEW_PRESETS = {
    "global_core": {
        "title": "Global Markets",
        "tabs": [
            {
                "title": "US Indices",
                "symbols": [
                    {"s": "FOREXCOM:SPXUSD", "d": "S&P 500"},
                    {"s": "FOREXCOM:NSXUSD", "d": "Nasdaq 100"},
                    {"s": "FOREXCOM:DJI", "d": "Dow 30"},
                ],
            },
            {
                "title": "Korea / Asia",
                "symbols": [
                    {"s": "INDEX:KSIC", "d": "KOSPI"},
                    {"s": "INDEX:NKY", "d": "Nikkei 225"},
                    {"s": "INDEX:HSI", "d": "Hang Seng"},
                ],
            },
            {
                "title": "FX / Rates",
                "symbols": [
                    {"s": "FX_IDC:USDKRW", "d": "USD/KRW"},
                ],
            },
            {
                "title": "Commodities",
                "symbols": [
                    {"s": "TVC:GOLD", "d": "Gold"},
                    {"s": "TVC:SILVER", "d": "Silver"},
                ],
            },
        ],
    }
}

DEFAULT_SETTINGS = {
    "version": 1,
    "dashboard": {
        "widgets": [
            {
                "id": "market-overview-default",
                "type": "market_overview",
                "title": "Global Markets",
                "size": "wide",
                "columns": 8,
                "preset": "global_core",
                "theme": "auto",
            },
            {
                "id": "focus-nvda",
                "type": "advanced_chart",
                "title": "NVIDIA",
                "size": "wide",
                "columns": 4,
                "symbol": "NASDAQ:NVDA",
                "interval": "D",
                "theme": "auto",
            },
            {
                "id": "economic-calendar-default",
                "type": "economic_calendar",
                "title": "Economic Calendar",
                "size": "wide",
                "columns": 12,
                "theme": "auto",
            },
        ]
    },
}


def market_widget_catalog(preset_overrides: dict | None = None) -> dict:
    presets = deepcopy(MARKET_OVERVIEW_PRESETS)
    for key, preset in (preset_overrides or {}).items():
        if key in presets:
            presets[key] = deepcopy(preset)
    return {
        "widgets": [
            {"type": "advanced_chart", "label": "Advanced Real-Time Chart", "sizes": ["wide", "medium"]},
            {"type": "symbol_overview", "label": "Symbol Overview", "sizes": ["wide", "medium"]},
            {"type": "market_overview", "label": "Market Overview / Global Markets", "sizes": ["wide"]},
            {"type": "ticker_tape", "label": "Ticker Tape", "sizes": ["compact"]},
            {"type": "ticker_tag", "label": "Ticker Tag", "sizes": ["compact"]},
            {"type": "ticker", "label": "Tickers", "sizes": ["compact", "wide"]},
            {"type": "single_ticker", "label": "Single Ticker", "sizes": ["compact"]},
            {"type": "forex_cross_rates", "label": "Forex Cross Rates", "sizes": ["medium", "wide"]},
            {"type": "stock_heatmap", "label": "Stock Heatmap", "sizes": ["wide"]},
            {"type": "economic_calendar", "label": "Economic Calendar", "sizes": ["wide"]},
        ],
        "presets": presets,
    }


def _clean_id(value, fallback):
    text = str(value or "").strip()
    text = re.sub(r"[^A-Za-z0-9_.-]+", "-", text).strip("-")
    return text[:64] or fallback


def _clean_symbol(value):
    text = str(value or "").strip().upper()
    text = EMBED_SAFE_SYMBOL_REPLACEMENTS.get(text, text)
    return text if SYMBOL_RE.fullmatch(text) else ""


def _clean_height(value, widget_type: str = "", size: str = ""):
    try:
        height = int(float(value))
    except (TypeError, ValueError):
        return None
    min_height = 88 if size == "compact" or widget_type in {"ticker_tape", "ticker_tag", "ticker", "single_ticker"} else 240
    return max(min_height, min(1100, height))


def _clean_symbols(value) -> list[str]:
    if isinstance(value, str):
        raw_symbols = value.split(",")
    elif isinstance(value, list):
        raw_symbols = value
    else:
        raw_symbols = []
    symbols = []
    for raw_symbol in raw_symbols[:16]:
        symbol = _clean_symbol(raw_symbol)
        if symbol and symbol not in symbols:
            symbols.append(symbol)
    return symbols


def _default_columns(widget_type: str, size: str) -> int:
    if widget_type in {"ticker_tape", "ticker_tag", "ticker", "single_ticker"} or size == "compact":
        return 12
    if widget_type == "market_overview":
        return 8
    if size == "medium":
        return 6
    return 6


def _clean_columns(value, widget_type: str, size: str) -> int:
    try:
        columns = int(float(value))
    except (TypeError, ValueError):
        columns = _default_columns(widget_type, size)
    return max(3, min(12, columns))


def _normalize_preset_overrides(payload, warnings) -> dict:
    raw_overrides = (payload or {}).get("presetOverrides") or {}
    if not isinstance(raw_overrides, dict):
        warnings.append("presetOverrides ignored: not an object")
        return {}
    raw_global = raw_overrides.get("global_core") or {}
    if not isinstance(raw_global, dict):
        return {}
    tabs = []
    for tab_index, raw_tab in enumerate((raw_global.get("tabs") or [])[:6]):
        if not isinstance(raw_tab, dict):
            continue
        symbols = []
        for raw_symbol in (raw_tab.get("symbols") or [])[:12]:
            if not isinstance(raw_symbol, dict):
                continue
            symbol = _clean_symbol(raw_symbol.get("s") or raw_symbol.get("symbol"))
            label = str(raw_symbol.get("d") or raw_symbol.get("label") or symbol).strip()[:48]
            if symbol:
                symbols.append({"s": symbol, "d": label or symbol})
        if symbols:
            title = str(raw_tab.get("title") or f"Custom {tab_index + 1}").strip()[:48]
            tabs.append({"title": title or f"Custom {tab_index + 1}", "symbols": symbols})
    if not tabs:
        return {}
    return {
        "global_core": {
            "title": str(raw_global.get("title") or "Global Markets").strip()[:64] or "Global Markets",
            "tabs": tabs,
        }
    }


def _normalize_widget(raw, index, warnings):
    if not isinstance(raw, dict):
        warnings.append(f"widget {index + 1} ignored: not an object")
        return None
    widget_type = str(raw.get("type") or "").strip().lower()
    if widget_type not in ALLOWED_TYPES:
        warnings.append(f"widget {raw.get('id') or index + 1} ignored: unsupported type {widget_type}")
        return None
    size = str(raw.get("size") or "").strip().lower()
    if size not in ALLOWED_SIZES:
        size = "compact" if widget_type in {"ticker_tape", "ticker_tag", "ticker", "single_ticker"} else "wide"
    theme = str(raw.get("theme") or "auto").strip().lower()
    if theme not in ALLOWED_THEMES:
        theme = "auto"
    widget = {
        "id": _clean_id(raw.get("id"), f"widget-{index + 1}"),
        "type": widget_type,
        "title": str(raw.get("title") or "").strip()[:80],
        "size": size,
        "theme": theme,
        "columns": _clean_columns(raw.get("columns"), widget_type, size),
    }
    height = _clean_height(raw.get("height"), widget_type, size)
    if height is not None:
        widget["height"] = height
    if widget_type == "market_overview":
        preset = str(raw.get("preset") or "global_core").strip()
        widget["preset"] = preset if preset in MARKET_OVERVIEW_PRESETS else "global_core"
    if widget_type in {
        "advanced_chart",
        "symbol_overview",
        "ticker_tape",
        "ticker_tag",
        "ticker",
        "single_ticker",
        "stock_heatmap",
    }:
        symbol = _clean_symbol(raw.get("symbol"))
        if symbol:
            widget["symbol"] = symbol
        elif widget_type in {"advanced_chart", "symbol_overview", "ticker_tag", "single_ticker"}:
            widget["symbol"] = "FOREXCOM:SPXUSD"
    if widget_type in {"ticker_tape", "ticker"}:
        symbols = _clean_symbols(raw.get("symbols")) or _clean_symbols(raw.get("symbol"))
        widget["symbols"] = symbols or ["FOREXCOM:SPXUSD"]
        widget["symbol"] = widget["symbols"][0]
    if widget_type in {"advanced_chart", "symbol_overview"}:
        interval = str(raw.get("interval") or "D").strip().upper()
        widget["interval"] = interval if interval in {"1", "5", "15", "60", "D", "W", "M"} else "D"
    if widget_type in {"advanced_chart", "symbol_overview"}:
        chart_type = str(raw.get("chartType") or "candlesticks").strip().lower()
        widget["chartType"] = chart_type if chart_type in {"line", "candlesticks", "area", "bars"} else "candlesticks"
    return widget


def normalize_market_widget_settings(payload) -> dict:
    warnings = []
    raw_widgets = (((payload or {}).get("dashboard") or {}).get("widgets") or [])
    raw_ids = {str((row or {}).get("id") or "").strip() for row in raw_widgets if isinstance(row, dict)}
    preset_overrides = _normalize_preset_overrides(payload, warnings)
    widgets = []
    for index, raw in enumerate(raw_widgets[:12]):
        widget = _normalize_widget(raw, index, warnings)
        if widget and widget.get("id") not in REMOVED_DEFAULT_WIDGET_IDS:
            widgets.append(widget)
    if not widgets or raw_ids in LEGACY_DEFAULT_WIDGET_ID_SETS:
        widgets = deepcopy(DEFAULT_SETTINGS["dashboard"]["widgets"])
    return {
        "version": 1,
        "dashboard": {"widgets": widgets},
        "presetOverrides": preset_overrides,
        "catalog": market_widget_catalog(preset_overrides),
        "warnings": warnings,
    }


def get_market_widget_settings() -> dict:
    payload = read_json(SETTINGS_PATH, None)
    if not isinstance(payload, dict):
        payload = deepcopy(DEFAULT_SETTINGS)
    return normalize_market_widget_settings(payload)


def save_market_widget_settings(payload) -> dict:
    normalized = normalize_market_widget_settings(payload)
    SETTINGS_PATH.parent.mkdir(parents=True, exist_ok=True)
    write_json(SETTINGS_PATH, {
        "version": normalized["version"],
        "dashboard": normalized["dashboard"],
        "presetOverrides": normalized["presetOverrides"],
    })
    return normalized
