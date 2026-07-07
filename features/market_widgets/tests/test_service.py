from pathlib import Path
from tempfile import TemporaryDirectory

from features.market_widgets import service


def test_default_settings_include_overview_and_focus_chart():
    with TemporaryDirectory() as tmp:
        original = service.SETTINGS_PATH
        service.SETTINGS_PATH = Path(tmp) / "market-widget-settings.json"
        try:
            payload = service.get_market_widget_settings()
        finally:
            service.SETTINGS_PATH = original

    widgets = payload["dashboard"]["widgets"]
    assert payload["version"] == 1
    assert [row["type"] for row in widgets] == ["market_overview", "advanced_chart", "economic_calendar"]
    assert widgets[0]["preset"] == "global_core"
    assert widgets[1]["symbol"] == "NASDAQ:NVDA"
    assert widgets[2]["columns"] == 12
    assert [row["id"] for row in widgets] == ["market-overview-default", "focus-nvda", "economic-calendar-default"]
    assert payload["warnings"] == []


def test_legacy_default_dashboard_migrates_to_current_defaults():
    payload = service.normalize_market_widget_settings({
        "dashboard": {
            "widgets": [
                {"id": "market-overview-default", "type": "market_overview", "preset": "global_core"},
                {"id": "focus-spx", "type": "advanced_chart", "symbol": "FOREXCOM:SPXUSD"},
            ]
        }
    })

    widgets = payload["dashboard"]["widgets"]
    assert [row["id"] for row in widgets] == ["market-overview-default", "focus-nvda", "economic-calendar-default"]
    assert widgets[1]["symbol"] == "NASDAQ:NVDA"


def test_market_overview_uses_tradingview_widget_compatible_index_symbols():
    preset = service.market_widget_catalog()["presets"]["global_core"]
    symbols = {
        row["d"]: row["s"]
        for tab in preset["tabs"]
        for row in tab["symbols"]
    }

    assert symbols["S&P 500"] == "FOREXCOM:SPXUSD"
    assert symbols["Nasdaq 100"] == "FOREXCOM:NSXUSD"
    assert symbols["Dow 30"] == "FOREXCOM:DJI"
    assert "Russell 2000" not in symbols
    assert symbols["KOSPI"] == "INDEX:KSIC"
    assert "KOSDAQ" not in symbols
    assert "KOSPI 200" not in symbols


def test_save_settings_drops_unknown_widget_and_fields():
    with TemporaryDirectory() as tmp:
        original = service.SETTINGS_PATH
        service.SETTINGS_PATH = Path(tmp) / "market-widget-settings.json"
        try:
            payload = service.save_market_widget_settings({
                "dashboard": {
                    "widgets": [
                        {"id": "bad", "type": "top_stories", "symbol": "NASDAQ:NVDA"},
                        {
                            "id": "chart-1",
                            "type": "advanced_chart",
                            "title": "NVIDIA",
                            "symbol": "NASDAQ:NVDA",
                            "size": "huge",
                            "theme": "neon",
                            "unexpected": "removed",
                        },
                    ]
                }
            })
            saved = service.get_market_widget_settings()
        finally:
            service.SETTINGS_PATH = original

    assert len(payload["dashboard"]["widgets"]) == 1
    widget = payload["dashboard"]["widgets"][0]
    assert widget["id"] == "chart-1"
    assert widget["type"] == "advanced_chart"
    assert widget["size"] == "wide"
    assert widget["theme"] == "auto"
    assert "unexpected" not in widget
    assert any("top_stories" in warning for warning in payload["warnings"])
    assert saved["dashboard"]["widgets"][0]["symbol"] == "NASDAQ:NVDA"


def test_save_settings_preserves_widget_order_and_height():
    with TemporaryDirectory() as tmp:
        original = service.SETTINGS_PATH
        service.SETTINGS_PATH = Path(tmp) / "market-widget-settings.json"
        try:
            payload = service.save_market_widget_settings({
                "dashboard": {
                    "widgets": [
                            {"id": "second", "type": "advanced_chart", "symbol": "NASDAQ:MSFT", "height": 900, "columns": 11},
                            {"id": "first", "type": "advanced_chart", "symbol": "NASDAQ:AAPL", "height": 180, "columns": 2},
                    ]
                }
            })
        finally:
            service.SETTINGS_PATH = original

    widgets = payload["dashboard"]["widgets"]
    assert [row["id"] for row in widgets] == ["second", "first"]
    assert widgets[0]["height"] == 900
    assert widgets[0]["columns"] == 11
    assert widgets[1]["height"] == 240
    assert widgets[1]["columns"] == 3


def test_restricted_tradingview_symbols_are_replaced_with_embed_safe_proxies():
    payload = service.normalize_market_widget_settings({
        "dashboard": {
            "widgets": [
                {"id": "rut", "type": "advanced_chart", "symbol": "TVC:RUT"},
                {"id": "dxy", "type": "advanced_chart", "symbol": "TVC:DXY"},
                {"id": "us10y", "type": "advanced_chart", "symbol": "TVC:US10Y"},
                {"id": "wti", "type": "advanced_chart", "symbol": "NYMEX:CL1!"},
            ]
        }
    })

    assert [row["symbol"] for row in payload["dashboard"]["widgets"]] == [
        "AMEX:IWM",
        "AMEX:UUP",
        "NASDAQ:TLT",
        "AMEX:USO",
    ]


def test_removed_default_macro_widgets_are_dropped_from_saved_settings():
    payload = service.normalize_market_widget_settings({
        "dashboard": {
            "widgets": [
                {"id": "market-overview-default", "type": "market_overview"},
                {"id": "focus-rut", "type": "advanced_chart", "symbol": "AMEX:IWM"},
                {"id": "focus-dxy", "type": "advanced_chart", "symbol": "AMEX:UUP"},
                {"id": "focus-us10y", "type": "advanced_chart", "symbol": "NASDAQ:TLT"},
                {"id": "focus-wti", "type": "advanced_chart", "symbol": "AMEX:USO"},
            ]
        }
    })

    assert [row["id"] for row in payload["dashboard"]["widgets"]] == ["market-overview-default"]


def test_global_market_overview_accepts_user_symbol_tabs():
    payload = service.normalize_market_widget_settings({
        "dashboard": {
            "widgets": [{"id": "market-overview-default", "type": "market_overview", "preset": "global_core"}]
        },
        "presetOverrides": {
            "global_core": {
                "title": "My Markets",
                "tabs": [
                    {
                        "title": "Watch",
                        "symbols": [
                            {"s": "NYSE:GEV", "d": "GE Vernova"},
                            {"symbol": "NASDAQ:SPCX", "label": "SPCX"},
                            {"s": "bad symbol", "d": "Bad"},
                        ],
                    }
                ],
            }
        },
    })

    preset = payload["catalog"]["presets"]["global_core"]
    assert preset["title"] == "My Markets"
    assert preset["tabs"] == [{
        "title": "Watch",
        "symbols": [
            {"s": "NYSE:GEV", "d": "GE Vernova"},
            {"s": "NASDAQ:SPCX", "d": "SPCX"},
        ],
    }]
    assert payload["presetOverrides"]["global_core"] == preset


def test_catalog_excludes_tradingview_news_widgets():
    catalog = service.market_widget_catalog()
    types = {row["type"] for row in catalog["widgets"]}
    assert "top_stories" not in types
    assert {
        "advanced_chart",
        "symbol_overview",
        "market_overview",
        "ticker_tape",
        "ticker_tag",
        "ticker",
        "single_ticker",
        "stock_heatmap",
        "economic_calendar",
    }.issubset(types)


def test_market_widget_settings_preserve_supported_widget_customization():
    normalized = service.normalize_market_widget_settings({
        "dashboard": {
            "widgets": [
                {
                    "id": "overview",
                    "type": "symbol_overview",
                    "title": "NVIDIA Overview",
                    "symbol": "NASDAQ:NVDA",
                    "chartType": "line",
                    "interval": "W",
                },
                {
                    "id": "single",
                    "type": "single_ticker",
                    "symbol": "NYSE:GEV",
                },
                {
                    "id": "tape",
                    "type": "ticker_tape",
                    "symbols": ["NASDAQ:NVDA", "NYSE:GEV", "bad symbol"],
                    "height": 90,
                },
            ]
        }
    })
    overview, single, tape = normalized["dashboard"]["widgets"]
    assert overview["type"] == "symbol_overview"
    assert overview["chartType"] == "line"
    assert overview["interval"] == "W"
    assert single["type"] == "single_ticker"
    assert single["symbol"] == "NYSE:GEV"
    assert tape["symbols"] == ["NASDAQ:NVDA", "NYSE:GEV"]
    assert tape["height"] == 90


def test_compact_market_widgets_allow_low_but_not_broken_height():
    normalized = service.normalize_market_widget_settings({
        "dashboard": {
            "widgets": [{"id": "tape", "type": "ticker_tape", "symbols": ["NASDAQ:NVDA"], "height": 40}]
        }
    })

    assert normalized["dashboard"]["widgets"][0]["height"] == 88


def test_app_exposes_market_widget_and_watchlist_detail_routes():
    app_text = (service.ROOT / "app.py").read_text(encoding="utf-8")
    assert "@fastapi_app.get(\"/api/market-widgets/settings\")" in app_text
    assert "@fastapi_app.post(\"/api/market-widgets/settings\")" in app_text
    assert "@fastapi_app.get(\"/api/watchlist/detail\")" in app_text
    assert "get_market_widget_settings" in app_text
    assert "watchlist_detail" in app_text
