# Current Market Dashboard and Watchlist Widgets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a TradingView-powered current-market widget board on the dashboard and a compact watchlist page whose entries open company detail modals with TradingView widgets and Folio OS-collected news.

**Architecture:** Add a small `features/market_widgets` backend service for persisted dashboard widget settings, keep widget output data out of reports, and isolate TradingView embed rendering in `public/tradingview-widgets.js`. Reuse watchlist search/filtering logic for a focused detail API, while `public/app.js` owns UI state, modal behavior, and calls into the widget renderer.

**Tech Stack:** Python 3 + FastAPI, JSON-per-settings file, vanilla JavaScript, TradingView embeddable widgets, existing pytest static/unit tests, `node --check`.

---

## File Structure

Create:

- `features/market_widgets/__init__.py`: package marker.
- `features/market_widgets/service.py`: default widget catalog, settings validation, read/write `data/market-widget-settings.json`.
- `features/market_widgets/README.md`: feature boundary and current-market-only rule.
- `features/market_widgets/tests/test_service.py`: backend tests.
- `features/frontend_ui/tests/test_market_widgets_ui.py`: static UI contract tests.
- `public/tradingview-widgets.js`: TradingView widget renderer and config builder.

Modify:

- `app.py`: import market widget service and watchlist detail helper; add thin API routes.
- `features/watchlist_notes/service.py`: add focused `watchlist_detail()` and `tradingview_symbol_for_company()` helpers.
- `features/watchlist_notes/README.md`: document compact watchlist + modal detail.
- `features/investment_review/README.md`: document dashboard widget board replacing primary Market Tape UI.
- `features/frontend_ui/README.md`: document TradingView renderer and modal behavior.
- `public/index.html`: include `tradingview-widgets.js`, add watchlist modal root, keep `#watchlistNews` hidden/unused as compatibility.
- `public/app.js`: render dashboard widget board, load/save widget settings, compact watchlist cards, open/close modal.
- `public/styles.css`: widget board, fallback tape, compact watchlist, modal/drawer, stable widget heights.
- `roadmap/BRIEFING_IMPLEMENTATION_PLAN.md`: mark Step 6 progress.
- `AGENTS.md` and `CLAUDE.md`: sync status text.

Do not modify:

- `data/briefings/*.json`
- `data/briefings/*.visuals.json*`
- `data/market-memory.sqlite3`
- any user data except `data/market-widget-settings.json` through explicit settings API calls.

---

### Task 1: Market Widget Settings Backend

**Files:**

- Create: `features/market_widgets/__init__.py`
- Create: `features/market_widgets/service.py`
- Create: `features/market_widgets/tests/test_service.py`
- Create: `features/market_widgets/README.md`

- [ ] **Step 1: Write failing tests for default settings and validation**

Create `features/market_widgets/tests/test_service.py`:

```python
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
    assert [row["type"] for row in widgets[:2]] == ["market_overview", "advanced_chart"]
    assert widgets[0]["preset"] == "global_core"
    assert widgets[1]["symbol"] == "FOREXCOM:SPXUSD"
    assert payload["warnings"] == []


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


def test_catalog_excludes_tradingview_news_widgets():
    catalog = service.market_widget_catalog()
    types = {row["type"] for row in catalog["widgets"]}
    assert "top_stories" not in types
    assert {"market_overview", "advanced_chart", "ticker_tape"}.issubset(types)
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```powershell
py -3 -m pytest features\market_widgets\tests\test_service.py -q
```

Expected: FAIL because `features.market_widgets` does not exist.

- [ ] **Step 3: Implement market widget settings service**

Create `features/market_widgets/__init__.py`:

```python
"""Current-market dashboard widget settings."""
```

Create `features/market_widgets/service.py`:

```python
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
    "ticker_tape",
    "forex_cross_rates",
    "stock_heatmap",
    "economic_calendar",
}
ALLOWED_SIZES = {"wide", "medium", "compact"}
ALLOWED_THEMES = {"auto", "light", "dark"}
SYMBOL_RE = re.compile(r"^[A-Z0-9_:.!/-]{1,40}$")

MARKET_OVERVIEW_PRESETS = {
    "global_core": {
        "title": "Global Markets",
        "tabs": [
            {
                "title": "US Indices",
                "symbols": [
                    {"s": "FOREXCOM:SPXUSD", "d": "S&P 500"},
                    {"s": "NASDAQ:IXIC", "d": "Nasdaq Composite"},
                    {"s": "DJ:DJI", "d": "Dow Jones"},
                    {"s": "TVC:RUT", "d": "Russell 2000"},
                ],
            },
            {
                "title": "Korea / Asia",
                "symbols": [
                    {"s": "KRX:KOSPI", "d": "KOSPI"},
                    {"s": "KRX:KOSDAQ", "d": "KOSDAQ"},
                    {"s": "KRX:KOSPI200", "d": "KOSPI 200"},
                ],
            },
            {
                "title": "FX / Rates",
                "symbols": [
                    {"s": "FX_IDC:USDKRW", "d": "USD/KRW"},
                    {"s": "TVC:DXY", "d": "Dollar Index"},
                    {"s": "TVC:US10Y", "d": "US 10Y Yield"},
                ],
            },
            {
                "title": "Commodities",
                "symbols": [
                    {"s": "TVC:GOLD", "d": "Gold"},
                    {"s": "NYMEX:CL1!", "d": "WTI Crude"},
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
                "preset": "global_core",
                "theme": "auto",
            },
            {
                "id": "focus-spx",
                "type": "advanced_chart",
                "title": "S&P 500",
                "size": "wide",
                "symbol": "FOREXCOM:SPXUSD",
                "interval": "D",
                "theme": "auto",
            },
        ]
    },
}


def market_widget_catalog() -> dict:
    return {
        "widgets": [
            {"type": "market_overview", "label": "Market Overview", "sizes": ["wide"]},
            {"type": "advanced_chart", "label": "Advanced Chart", "sizes": ["wide", "medium"]},
            {"type": "ticker_tape", "label": "Ticker Tape", "sizes": ["compact"]},
            {"type": "forex_cross_rates", "label": "Forex Cross Rates", "sizes": ["medium", "wide"]},
            {"type": "stock_heatmap", "label": "Stock Heatmap", "sizes": ["wide"]},
            {"type": "economic_calendar", "label": "Economic Calendar", "sizes": ["wide"]},
        ],
        "presets": deepcopy(MARKET_OVERVIEW_PRESETS),
    }


def _clean_id(value, fallback):
    text = str(value or "").strip()
    text = re.sub(r"[^A-Za-z0-9_.-]+", "-", text).strip("-")
    return text[:64] or fallback


def _clean_symbol(value):
    text = str(value or "").strip().upper()
    return text if SYMBOL_RE.fullmatch(text) else ""


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
        size = "compact" if widget_type == "ticker_tape" else "wide"
    theme = str(raw.get("theme") or "auto").strip().lower()
    if theme not in ALLOWED_THEMES:
        theme = "auto"
    widget = {
        "id": _clean_id(raw.get("id"), f"widget-{index + 1}"),
        "type": widget_type,
        "title": str(raw.get("title") or "").strip()[:80],
        "size": size,
        "theme": theme,
    }
    if widget_type == "market_overview":
        preset = str(raw.get("preset") or "global_core").strip()
        widget["preset"] = preset if preset in MARKET_OVERVIEW_PRESETS else "global_core"
    if widget_type in {"advanced_chart", "ticker_tape", "stock_heatmap"}:
        symbol = _clean_symbol(raw.get("symbol"))
        if symbol:
            widget["symbol"] = symbol
        elif widget_type == "advanced_chart":
            widget["symbol"] = "FOREXCOM:SPXUSD"
    if widget_type == "advanced_chart":
        interval = str(raw.get("interval") or "D").strip().upper()
        widget["interval"] = interval if interval in {"1", "5", "15", "60", "D", "W", "M"} else "D"
    return widget


def normalize_market_widget_settings(payload) -> dict:
    warnings = []
    raw_widgets = (((payload or {}).get("dashboard") or {}).get("widgets") or [])
    widgets = []
    for index, raw in enumerate(raw_widgets[:12]):
        widget = _normalize_widget(raw, index, warnings)
        if widget:
            widgets.append(widget)
    if not widgets:
        widgets = deepcopy(DEFAULT_SETTINGS["dashboard"]["widgets"])
    return {
        "version": 1,
        "dashboard": {"widgets": widgets},
        "catalog": market_widget_catalog(),
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
    })
    return normalized
```

Create `features/market_widgets/README.md`:

```markdown
# Market Widgets

This feature stores current-market dashboard widget settings.

It does not store TradingView widget output, quotes, chart data, briefing evidence, visual snapshots, or market-memory evidence.

Settings live in `data/market-widget-settings.json`. If the file is missing or invalid, the app returns a safe default dashboard with a Market Overview widget and a focused S&P 500 chart.
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```powershell
py -3 -m pytest features\market_widgets\tests\test_service.py -q
```

Expected: 3 passed.

- [ ] **Step 5: Commit**

Run:

```powershell
git add features/market_widgets
git commit -m "Add market widget settings service"
```

---

### Task 2: API Routes for Widget Settings and Watchlist Detail

**Files:**

- Modify: `app.py`
- Modify: `features/watchlist_notes/service.py`
- Test: `features/market_widgets/tests/test_service.py`
- Create: `features/watchlist_notes/tests/test_watchlist_detail.py`

- [ ] **Step 1: Write failing watchlist detail tests**

Create `features/watchlist_notes/tests/test_watchlist_detail.py`:

```python
from unittest.mock import patch

from features.watchlist_notes import service


def _doc(title="NVIDIA expands AI server platform"):
    return {
        "title": title,
        "source": "Reuters",
        "date": "2026-06-24",
        "url": "https://example.test/nvda",
        "summary": "NVIDIA news",
        "sectors": ["Semiconductors"],
        "impactTags": ["AI"],
        "companies": [{"name": "NVIDIA Corporation", "ticker": "NVDA", "sector": "Semiconductors", "market": "US"}],
    }


def test_tradingview_symbol_for_us_and_kr_companies():
    assert service.tradingview_symbol_for_company({"ticker": "NVDA", "market": "US"}) == "NASDAQ:NVDA"
    assert service.tradingview_symbol_for_company({"ticker": "005930", "market": "KR"}) == "KRX:005930"
    assert service.tradingview_symbol_for_company({}) == ""


def test_watchlist_detail_returns_single_item_news_and_company_metadata():
    doc = _doc()
    with (
        patch("features.common.research_library.indexing.service.load_index", return_value={"documents": []}),
        patch("features.common.research_library.search.service.search_documents", return_value=[doc]),
    ):
        detail = service.watchlist_detail("NVIDIA", limit=5)

    assert detail["item"] == "NVIDIA"
    assert detail["company"]["ticker"] == "NVDA"
    assert detail["company"]["tradingViewSymbol"] == "NASDAQ:NVDA"
    assert detail["newsCount"] == 1
    assert detail["news"][0]["title"] == doc["title"]
    assert detail["tags"] == ["Semiconductors", "AI"]


def test_watchlist_detail_unresolved_item_keeps_local_news_without_widget_symbol():
    doc = {"title": "AI supply chain update", "source": "Local", "date": "2026-06-24", "companies": []}
    with (
        patch("features.common.research_library.indexing.service.load_index", return_value={"documents": []}),
        patch("features.common.research_library.search.service.search_documents", return_value=[doc]),
    ):
        detail = service.watchlist_detail("AI", limit=5)

    assert detail["item"] == "AI"
    assert detail["company"]["tradingViewSymbol"] == ""
    assert detail["newsCount"] == 1
```

- [ ] **Step 2: Add route contract checks to market widget tests**

Append to `features/market_widgets/tests/test_service.py`:

```python
def test_app_exposes_market_widget_and_watchlist_detail_routes():
    app_text = (service.ROOT / "app.py").read_text(encoding="utf-8")
    assert "@fastapi_app.get(\"/api/market-widgets/settings\")" in app_text
    assert "@fastapi_app.post(\"/api/market-widgets/settings\")" in app_text
    assert "@fastapi_app.get(\"/api/watchlist/detail\")" in app_text
    assert "get_market_widget_settings" in app_text
    assert "watchlist_detail" in app_text
```

- [ ] **Step 3: Run tests to verify they fail**

Run:

```powershell
py -3 -m pytest features\watchlist_notes\tests\test_watchlist_detail.py features\market_widgets\tests\test_service.py -q
```

Expected: FAIL because helpers/routes are not implemented.

- [ ] **Step 4: Implement watchlist detail helpers**

Modify `features/watchlist_notes/service.py` after `_item_matches_company()`:

```python
def tradingview_symbol_for_company(company: dict) -> str:
    ticker = str((company or {}).get("ticker") or "").strip().upper().replace(".", "-")
    if not ticker:
        return ""
    market = str((company or {}).get("market") or "").strip().upper()
    if market == "KR" or re.fullmatch(r"\d{6}", ticker):
        return f"KRX:{ticker[:6]}"
    exchange = str((company or {}).get("exchange") or "").strip().upper()
    if exchange in {"NYSE", "NASDAQ", "AMEX"}:
        return f"{exchange}:{ticker}"
    return f"NASDAQ:{ticker}"


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
        return {"item": "", "company": {"tradingViewSymbol": ""}, "tags": [], "news": [], "newsCount": 0, "latestDate": "", "warnings": ["empty watchlist item"]}
    idx = load_index()
    candidates = search_documents(idx, query=query, limit=max(limit * 3, 12), scope="news")
    hits = [h for h in candidates if any(_item_matches_company(query, c) for c in h.get("companies", []))]
    if not hits:
        hits = candidates[:limit]
    else:
        hits = hits[:limit]
    company = {}
    for hit in hits:
        for raw_company in hit.get("companies", []):
            if _item_matches_company(query, raw_company):
                company = company_public(normalize_company_entry(raw_company))
                break
        if company:
            break
    if not company:
        company = watchlist_company_from_index(query) or {"name": query, "ticker": "", "market": "", "sector": ""}
    company = dict(company)
    company["tradingViewSymbol"] = tradingview_symbol_for_company(company)
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
```

- [ ] **Step 5: Add app routes**

Modify `app.py` imports:

```python
from features.market_widgets.service import (
    get_market_widget_settings,
    save_market_widget_settings,
)
from features.watchlist_notes.service import (
    add_note,
    get_notes,
    get_watchlist,
    normalize_watchlist_keyword,
    save_watchlist,
    watchlist_detail,
    watchlist_overview,
)
```

Add routes near the dashboard/watchlist routes:

```python
@fastapi_app.get("/api/market-widgets/settings")
def api_get_market_widget_settings():
    return get_market_widget_settings()


@fastapi_app.post("/api/market-widgets/settings")
def api_save_market_widget_settings(body: dict | None = Body(default=None)):
    return save_market_widget_settings(body or {})
```

Add near existing watchlist routes:

```python
@fastapi_app.get("/api/watchlist/detail")
def api_watchlist_detail(request: Request):
    qs = query_lists(request)
    item = qs.get("item", [""])[0]
    limit = int(qs.get("limit", ["12"])[0] or 12)
    return watchlist_detail(item, limit=min(max(limit, 1), 50))
```

- [ ] **Step 6: Run tests to verify they pass**

Run:

```powershell
py -3 -m pytest features\watchlist_notes\tests\test_watchlist_detail.py features\market_widgets\tests\test_service.py -q
py -3 -m py_compile app.py features\watchlist_notes\service.py features\market_widgets\service.py
```

Expected: all tests pass and compile exits 0.

- [ ] **Step 7: Commit**

Run:

```powershell
git add app.py features/watchlist_notes/service.py features/watchlist_notes/tests/test_watchlist_detail.py features/market_widgets
git commit -m "Add market widget and watchlist detail APIs"
```

---

### Task 3: TradingView Frontend Renderer

**Files:**

- Create: `public/tradingview-widgets.js`
- Create: `public/tradingview-widgets.test.js`
- Modify: `public/index.html`

- [ ] **Step 1: Write failing renderer tests**

Create `public/tradingview-widgets.test.js`:

```javascript
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(ROOT, "public", "tradingview-widgets.js"), "utf8");

test("renderer allows only approved widget types", () => {
  assert.match(source, /const ALLOWED_WIDGET_TYPES = new Set/);
  assert.match(source, /market_overview/);
  assert.match(source, /advanced_chart/);
  assert.doesNotMatch(source, /top_stories/);
});

test("renderer builds stable height classes and fallbacks", () => {
  assert.match(source, /tv-widget-size-wide/);
  assert.match(source, /tv-widget-size-medium/);
  assert.match(source, /tv-widget-size-compact/);
  assert.match(source, /tradingview-widget-unavailable/);
});

test("renderer exposes FolioTradingViewWidgets API", () => {
  assert.match(source, /window\.FolioTradingViewWidgets/);
  assert.match(source, /renderDashboardBoard/);
  assert.match(source, /renderWatchlistDetail/);
  assert.match(source, /cleanup/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```powershell
node --test public\tradingview-widgets.test.js
```

Expected: FAIL because `public/tradingview-widgets.js` does not exist.

- [ ] **Step 3: Implement renderer**

Create `public/tradingview-widgets.js`:

```javascript
(function () {
  "use strict";

  const ALLOWED_WIDGET_TYPES = new Set([
    "market_overview",
    "advanced_chart",
    "ticker_tape",
    "forex_cross_rates",
    "stock_heatmap",
    "economic_calendar",
    "symbol_info",
    "company_profile",
    "fundamental_data",
  ]);
  const SIZE_CLASSES = {
    wide: "tv-widget-size-wide",
    medium: "tv-widget-size-medium",
    compact: "tv-widget-size-compact",
  };
  const SCRIPT_BY_TYPE = {
    market_overview: "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js",
    advanced_chart: "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
    ticker_tape: "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js",
    forex_cross_rates: "https://s3.tradingview.com/external-embedding/embed-widget-forex-cross-rates.js",
    stock_heatmap: "https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js",
    economic_calendar: "https://s3.tradingview.com/external-embedding/embed-widget-events.js",
    symbol_info: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js",
    company_profile: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js",
    fundamental_data: "https://s3.tradingview.com/external-embedding/embed-widget-financials.js",
  };

  function themeValue(theme) {
    if (theme === "dark" || theme === "light") return theme;
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  }

  function widgetShell(widget) {
    const size = SIZE_CLASSES[widget.size] || SIZE_CLASSES.wide;
    const shell = document.createElement("article");
    shell.className = `tv-widget-card ${size}`;
    shell.dataset.widgetId = widget.id || "";
    shell.dataset.widgetType = widget.type || "";
    const title = document.createElement("div");
    title.className = "tv-widget-card-head";
    title.innerHTML = `<strong>${escapeHtml(widget.title || widget.type || "Market Widget")}</strong><span>TradingView</span>`;
    const body = document.createElement("div");
    body.className = "tradingview-widget-container tv-widget-body";
    shell.append(title, body);
    return { shell, body };
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;"
    }[char]));
  }

  function unavailable(container, message = "TradingView 위젯을 불러오지 못했습니다.") {
    container.innerHTML = `<div class="tradingview-widget-unavailable">${escapeHtml(message)}</div>`;
  }

  function marketOverviewConfig(widget, presets) {
    const preset = presets?.[widget.preset || "global_core"] || presets?.global_core || {};
    return {
      colorTheme: themeValue(widget.theme),
      dateRange: "12M",
      showChart: true,
      locale: "kr",
      width: "100%",
      height: "100%",
      largeChartUrl: "",
      isTransparent: true,
      showSymbolLogo: true,
      tabs: preset.tabs || [],
    };
  }

  function advancedChartConfig(widget) {
    return {
      autosize: true,
      symbol: widget.symbol || "FOREXCOM:SPXUSD",
      interval: widget.interval || "D",
      timezone: "Etc/UTC",
      theme: themeValue(widget.theme),
      style: "1",
      locale: "kr",
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      save_image: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
    };
  }

  function simpleSymbolConfig(widget) {
    return {
      symbol: widget.symbol || "NASDAQ:NVDA",
      width: "100%",
      height: "100%",
      locale: "kr",
      colorTheme: themeValue(widget.theme),
      isTransparent: true,
    };
  }

  function configFor(widget, presets) {
    if (widget.type === "market_overview") return marketOverviewConfig(widget, presets);
    if (widget.type === "advanced_chart") return advancedChartConfig(widget);
    if (widget.type === "ticker_tape") {
      return {
        symbols: [{ proName: widget.symbol || "FOREXCOM:SPXUSD", title: widget.title || "S&P 500" }],
        showSymbolLogo: true,
        colorTheme: themeValue(widget.theme),
        isTransparent: true,
        displayMode: "adaptive",
        locale: "kr",
      };
    }
    return simpleSymbolConfig(widget);
  }

  function embed(body, widget, presets) {
    if (!ALLOWED_WIDGET_TYPES.has(widget.type)) {
      unavailable(body, "허용되지 않은 위젯입니다.");
      return;
    }
    const scriptUrl = SCRIPT_BY_TYPE[widget.type];
    if (!scriptUrl) {
      unavailable(body);
      return;
    }
    body.innerHTML = "";
    const inner = document.createElement("div");
    inner.className = "tradingview-widget-container__widget";
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.textContent = JSON.stringify(configFor(widget, presets));
    script.onerror = () => unavailable(body);
    body.append(inner, script);
  }

  function cleanup(root = document) {
    root.querySelectorAll(".tv-widget-body").forEach((node) => { node.innerHTML = ""; });
  }

  function renderDashboardBoard(target, settings, options = {}) {
    if (!target) return;
    const widgets = settings?.dashboard?.widgets || [];
    const presets = settings?.catalog?.presets || {};
    target.innerHTML = "";
    if (!widgets.length) {
      target.innerHTML = `<div class="tradingview-widget-unavailable">표시할 시장 위젯이 없습니다.</div>`;
      return;
    }
    widgets.forEach((widget) => {
      const { shell, body } = widgetShell(widget);
      target.append(shell);
      embed(body, widget, presets);
    });
    if (options.fallbackHtml) {
      const fallback = document.createElement("div");
      fallback.className = "tv-widget-fallback";
      fallback.hidden = true;
      fallback.innerHTML = options.fallbackHtml;
      target.append(fallback);
    }
  }

  function renderWatchlistDetail(target, detail) {
    if (!target) return;
    const symbol = detail?.company?.tradingViewSymbol || "";
    target.innerHTML = "";
    if (!symbol) {
      target.innerHTML = `<div class="tradingview-widget-unavailable">이 항목은 TradingView 심볼을 확인하지 못했습니다.</div>`;
      return;
    }
    [
      { id: "watch-chart", type: "advanced_chart", title: "Chart", symbol, size: "wide", theme: "auto" },
      { id: "watch-info", type: "symbol_info", title: "Symbol Info", symbol, size: "medium", theme: "auto" },
    ].forEach((widget) => {
      const { shell, body } = widgetShell(widget);
      target.append(shell);
      embed(body, widget, {});
    });
  }

  window.FolioTradingViewWidgets = {
    ALLOWED_WIDGET_TYPES,
    renderDashboardBoard,
    renderWatchlistDetail,
    cleanup,
  };
})();
```

- [ ] **Step 4: Include renderer in HTML**

Modify `public/index.html` near existing script tags:

```html
<script src="tradingview-widgets.js"></script>
```

Place it before `app.js` so `public/app.js` can call `window.FolioTradingViewWidgets`.

- [ ] **Step 5: Run tests and syntax checks**

Run:

```powershell
node --test public\tradingview-widgets.test.js
node --check public\tradingview-widgets.js
```

Expected: tests pass and syntax check exits 0.

- [ ] **Step 6: Commit**

Run:

```powershell
git add public/tradingview-widgets.js public/tradingview-widgets.test.js public/index.html
git commit -m "Add TradingView widget renderer"
```

---

### Task 4: Dashboard Widget Board UI

**Files:**

- Modify: `public/app.js`
- Modify: `public/styles.css`
- Test: `features/frontend_ui/tests/test_market_widgets_ui.py`

- [ ] **Step 1: Write failing dashboard UI contract tests**

Create `features/frontend_ui/tests/test_market_widgets_ui.py`:

```python
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]


def test_dashboard_uses_market_widget_board_before_tape_fallback():
    javascript = (ROOT / "public" / "app.js").read_text(encoding="utf-8")
    styles = (ROOT / "public" / "styles.css").read_text(encoding="utf-8")

    assert "async function loadMarketWidgetSettings" in javascript
    assert "function renderMarketWidgetBoard" in javascript
    assert "window.FolioTradingViewWidgets?.renderDashboardBoard" in javascript
    assert "marketWidgetFallbackTapeHtml" in javascript
    assert "tv-widget-board" in styles
    assert "tv-widget-size-wide" in styles


def test_market_widget_settings_controls_are_present():
    javascript = (ROOT / "public" / "app.js").read_text(encoding="utf-8")

    assert "/api/market-widgets/settings" in javascript
    assert "resetMarketWidgetsBtn" in javascript
    assert "addMarketWidgetBtn" in javascript
    assert "saveMarketWidgetSettings" in javascript
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```powershell
py -3 -m pytest features\frontend_ui\tests\test_market_widgets_ui.py -q
```

Expected: FAIL because functions/styles do not exist.

- [ ] **Step 3: Add state and API helpers**

Modify the top-level `state` object in `public/app.js`:

```javascript
marketWidgets: {
  settings: null,
  loading: false,
  warnings: [],
},
```

Add helper functions near dashboard rendering helpers:

```javascript
async function loadMarketWidgetSettings() {
  state.marketWidgets.loading = true;
  try {
    const payload = await api("/api/market-widgets/settings");
    state.marketWidgets.settings = payload;
    state.marketWidgets.warnings = payload.warnings || [];
    return payload;
  } finally {
    state.marketWidgets.loading = false;
  }
}

async function saveMarketWidgetSettings(settings) {
  const payload = await api("/api/market-widgets/settings", {
    method: "POST",
    body: JSON.stringify(settings),
  });
  state.marketWidgets.settings = payload;
  state.marketWidgets.warnings = payload.warnings || [];
  renderMarketWidgetBoard(state.investmentReview || {});
  return payload;
}

function marketWidgetFallbackTapeHtml(tape) {
  if (!tape?.length) return "";
  return `<div class="rv-tape tv-widget-local-fallback">${tape.map((it) => {
    const value = (it.value === 0 || it.value) && Number.isFinite(Number(it.value))
      ? Number(it.value).toLocaleString(undefined, { maximumFractionDigits: 2 })
      : "—";
    const chg = Number(it.changePct);
    const chgStr = Number.isFinite(chg) ? `${chg > 0 ? "+" : ""}${chg.toFixed(2)}%` : "";
    const chgCls = chg > 0 ? "up" : chg < 0 ? "dn" : "";
    const sizeCls = it.size === "lg" ? "lg" : "sm";
    const fresh = it.status && it.status !== "fresh" ? `<span class="rv-tape-st">${escapeHtml(it.status)}</span>` : "";
    return `<div class="rv-tape-t ${sizeCls}"><div class="rv-tape-lab">${escapeHtml(it.label || it.symbol || "")}</div><div class="rv-tape-val">${escapeHtml(value)} <span class="${chgCls}">${chgStr}</span></div>${fresh}</div>`;
  }).join("")}</div>`;
}

function renderMarketWidgetBoard(review) {
  const tape = (review.marketTape && review.marketTape.items) || [];
  const settings = state.marketWidgets.settings;
  const fallback = marketWidgetFallbackTapeHtml(tape);
  return `<section class="market-widget-section">
    <div class="market-widget-head">
      <div>
        <h3>현재 시장 위젯</h3>
        <p class="section-subtitle">현재 시장 보조 화면입니다. 저장 브리핑과 evidence에는 반영되지 않습니다.</p>
      </div>
      <div class="market-widget-actions">
        <button id="addMarketWidgetBtn" class="filter-btn clear" type="button">위젯 추가</button>
        <button id="resetMarketWidgetsBtn" class="filter-btn clear" type="button">기본값</button>
      </div>
    </div>
    <div id="marketWidgetBoard" class="tv-widget-board">${fallback}</div>
  </section>`;
}
```

- [ ] **Step 4: Replace tape HTML in dashboard render**

In `renderInvestmentReview(review)`, keep the existing `tape` variable but replace `tapeHtml` construction with:

```javascript
const tapeHtml = renderMarketWidgetBoard(review);
```

After setting `el.innerHTML`, add:

```javascript
const board = document.getElementById("marketWidgetBoard");
if (board && state.marketWidgets.settings) {
  window.FolioTradingViewWidgets?.renderDashboardBoard(board, state.marketWidgets.settings, {
    fallbackHtml: marketWidgetFallbackTapeHtml(tape),
  });
}
```

In `loadInvestmentReview()`, after `const review = ...`, ensure settings are loaded:

```javascript
if (!state.marketWidgets.settings) {
  try { await loadMarketWidgetSettings(); } catch (_) {}
}
renderInvestmentReview(review);
```

- [ ] **Step 5: Add reset/add minimal handlers**

Add event listeners in `bindEvents()`:

```javascript
document.addEventListener("click", async (event) => {
  const reset = event.target.closest("#resetMarketWidgetsBtn");
  if (reset) {
    await saveMarketWidgetSettings({ dashboard: { widgets: [] } });
    setGlobalStatus("현재 시장 위젯을 기본값으로 되돌렸습니다.");
  }
  const add = event.target.closest("#addMarketWidgetBtn");
  if (add) {
    const settings = state.marketWidgets.settings || await loadMarketWidgetSettings();
    const widgets = [...((settings.dashboard || {}).widgets || [])];
    widgets.push({
      id: `focus-${Date.now()}`,
      type: "advanced_chart",
      title: "Nasdaq Composite",
      size: "wide",
      symbol: "NASDAQ:IXIC",
      interval: "D",
      theme: "auto",
    });
    await saveMarketWidgetSettings({ dashboard: { widgets } });
    setGlobalStatus("현재 시장 차트 위젯을 추가했습니다.");
  }
});
```

If the global `document.addEventListener("click", ...)` style conflicts with existing handler style, attach the delegation to `document.body` once inside `bindEvents()`.

- [ ] **Step 6: Add CSS**

Modify `public/styles.css`:

```css
.market-widget-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 18px 0;
}

.market-widget-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.market-widget-head h3 {
  margin: 0;
  font-size: var(--fs-xl);
}

.market-widget-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tv-widget-board {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 12px;
}

.tv-widget-card {
  border: 1px solid var(--folio-line);
  border-radius: 8px;
  background: var(--folio-surface-clean);
  overflow: hidden;
}

.tv-widget-card-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--folio-line);
  color: var(--folio-ink-muted);
  font-size: var(--fs-sm);
}

.tv-widget-card-head strong {
  color: var(--folio-ink);
}

.tv-widget-size-wide { grid-column: span 12; min-height: 480px; }
.tv-widget-size-medium { grid-column: span 6; min-height: 360px; }
.tv-widget-size-compact { grid-column: span 12; min-height: 72px; }
.tv-widget-body { min-height: inherit; height: 100%; }

.tradingview-widget-unavailable {
  display: grid;
  min-height: 180px;
  place-items: center;
  padding: 20px;
  color: var(--folio-ink-muted);
  background: var(--folio-surface-muted);
}

.tv-widget-fallback[hidden] { display: none; }

@media (max-width: 900px) {
  .market-widget-head { align-items: stretch; flex-direction: column; }
  .tv-widget-board { grid-template-columns: 1fr; }
  .tv-widget-size-wide,
  .tv-widget-size-medium,
  .tv-widget-size-compact {
    grid-column: auto;
  }
  .tv-widget-size-wide { min-height: 320px; }
  .tv-widget-size-medium { min-height: 300px; }
}
```

- [ ] **Step 7: Run tests**

Run:

```powershell
py -3 -m pytest features\frontend_ui\tests\test_market_widgets_ui.py -q
node --check public\app.js
node --check public\tradingview-widgets.js
```

Expected: tests pass and JS syntax checks exit 0.

- [ ] **Step 8: Commit**

Run:

```powershell
git add public/app.js public/styles.css features/frontend_ui/tests/test_market_widgets_ui.py
git commit -m "Add dashboard market widget board"
```

---

### Task 5: Compact Watchlist Cards and Detail Modal

**Files:**

- Modify: `public/index.html`
- Modify: `public/app.js`
- Modify: `public/styles.css`
- Modify: `features/frontend_ui/tests/test_market_widgets_ui.py`

- [ ] **Step 1: Add failing watchlist UI contract tests**

Append to `features/frontend_ui/tests/test_market_widgets_ui.py`:

```python
def test_watchlist_cards_are_compact_and_open_detail_modal():
    javascript = (ROOT / "public" / "app.js").read_text(encoding="utf-8")
    html = (ROOT / "public" / "index.html").read_text(encoding="utf-8")
    styles = (ROOT / "public" / "styles.css").read_text(encoding="utf-8")

    assert "function openWatchlistDetail" in javascript
    assert "/api/watchlist/detail?item=" in javascript
    assert "watchlist-detail-modal" in html
    assert "watchlist-detail-modal" in styles
    assert "watchlist-latest" not in javascript
    assert "renderResults(data.news || [], \"#watchlistNews\")" not in javascript


def test_watchlist_modal_uses_tradingview_renderer_and_local_news():
    javascript = (ROOT / "public" / "app.js").read_text(encoding="utf-8")

    assert "window.FolioTradingViewWidgets?.renderWatchlistDetail" in javascript
    assert "renderWatchlistDetailNews" in javascript
    assert "watchlistDetailPreviousFocus" in javascript
    assert "Escape" in javascript
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```powershell
py -3 -m pytest features\frontend_ui\tests\test_market_widgets_ui.py -q
```

Expected: FAIL because modal flow is not implemented.

- [ ] **Step 3: Add modal root**

Modify `public/index.html` after the watchlist section or before `</main>`:

```html
<div id="watchlistDetailModal" class="watchlist-detail-modal" hidden>
  <div class="watchlist-detail-backdrop" data-watchlist-detail-close></div>
  <section class="watchlist-detail-panel" role="dialog" aria-modal="true" aria-labelledby="watchlistDetailTitle">
    <div class="watchlist-detail-head">
      <div>
        <p class="report-kicker">WATCHLIST DETAIL</p>
        <h2 id="watchlistDetailTitle">관심 기업</h2>
        <p id="watchlistDetailMeta" class="section-subtitle"></p>
      </div>
      <button class="icon-btn" type="button" data-watchlist-detail-close aria-label="닫기">×</button>
    </div>
    <div id="watchlistDetailBody" class="watchlist-detail-body"></div>
  </section>
</div>
```

Keep `#watchlistNews` in the DOM for compatibility, but it will be cleared and hidden by JS/CSS.

- [ ] **Step 4: Simplify watchlist cards**

Modify `loadWatchlistNews(items)`:

```javascript
async function loadWatchlistNews(items) {
  if (!items.length) {
    $("#watchlistCards").innerHTML = "";
    $("#watchlistNews").innerHTML = "";
    return;
  }
  const data = await api("/api/watchlist/overview");
  renderWatchlistCards(data.items || []);
  const news = $("#watchlistNews");
  if (news) {
    news.innerHTML = "";
    news.hidden = true;
  }
}
```

Modify `renderWatchlistCards(items)`:

```javascript
function renderWatchlistCards(items) {
  $("#watchlistCards").innerHTML = items.length
    ? items.map((item) => `<article class="watchlist-card compact" tabindex="0" role="button" data-watchlist-detail-item="${escapeHtml(item.item)}">
        <div class="watchlist-card-top">
          <h3>${escapeHtml(item.item)}</h3>
          <span class="state-chip">${escapeHtml(item.count)}건</span>
        </div>
        <div class="meta">${escapeHtml(item.latestDate || "관련 뉴스 없음")}${item.sources?.length ? ` · ${item.sources.map(escapeHtml).join(", ")}` : ""}</div>
        ${item.tags?.length ? `<div class="tags">${item.tags.slice(0, 6).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
        <div class="memory-actions">
          <button class="filter-btn clear watchlist-detail-open" data-watchlist-item="${escapeHtml(item.item)}" type="button">상세 보기</button>
          <button class="filter-btn apply watchlist-analyze" data-watchlist-item="${escapeHtml(item.item)}" type="button">기업 분석</button>
        </div>
      </article>`).join("")
    : `<div class="result"><p>워치리스트 항목을 저장하면 항목별 카드가 표시됩니다.</p></div>`;
}
```

- [ ] **Step 5: Add modal JS**

Add top-level state:

```javascript
watchlistDetailPreviousFocus: null,
```

Add helpers near watchlist functions:

```javascript
function renderWatchlistDetailNews(news) {
  return (news || []).length
    ? `<div class="watchlist-detail-news">${news.map((doc) => `<article class="compact-item">
        ${sourceLink(doc)}
        <div class="meta">${escapeHtml(doc.source || "")} · ${escapeHtml(doc.date || "")}</div>
        ${doc.summary ? `<p>${escapeHtml(doc.summary)}</p>` : ""}
        <div class="tags">${[...(doc.sectors || []), ...(doc.impactTags || [])].slice(0, 8).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
      </article>`).join("")}</div>`
    : `<p class="section-subtitle">수집된 관련 뉴스가 없습니다.</p>`;
}

function closeWatchlistDetail() {
  const modal = $("#watchlistDetailModal");
  if (!modal) return;
  window.FolioTradingViewWidgets?.cleanup(modal);
  modal.hidden = true;
  document.body.classList.remove("modal-open");
  state.watchlistDetailPreviousFocus?.focus?.();
  state.watchlistDetailPreviousFocus = null;
}

async function openWatchlistDetail(item, trigger = null) {
  const modal = $("#watchlistDetailModal");
  const title = $("#watchlistDetailTitle");
  const meta = $("#watchlistDetailMeta");
  const body = $("#watchlistDetailBody");
  if (!modal || !body) return;
  state.watchlistDetailPreviousFocus = trigger || document.activeElement;
  modal.hidden = false;
  document.body.classList.add("modal-open");
  title.textContent = item || "관심 기업";
  meta.textContent = "불러오는 중...";
  body.innerHTML = `<div class="headline"><p>워치리스트 상세 정보를 불러오는 중입니다.</p></div>`;
  const detail = await api(`/api/watchlist/detail?item=${encodeURIComponent(item)}&limit=12`);
  const company = detail.company || {};
  title.textContent = company.name || detail.item || item;
  meta.textContent = [company.ticker, company.market, company.sector, `${detail.newsCount || 0}건`].filter(Boolean).join(" · ");
  body.innerHTML = `<div id="watchlistDetailWidgets" class="watchlist-detail-widgets"></div>
    <section class="watchlist-detail-local-news">
      <h3>수집한 뉴스</h3>
      ${renderWatchlistDetailNews(detail.news || [])}
    </section>`;
  window.FolioTradingViewWidgets?.renderWatchlistDetail($("#watchlistDetailWidgets"), detail);
  modal.querySelector("[data-watchlist-detail-close]")?.focus?.();
}
```

Modify `#watchlist` click handler:

```javascript
const detailButton = event.target.closest(".watchlist-detail-open, [data-watchlist-detail-item]");
if (detailButton && !event.target.closest("[data-watchlist-remove], .watchlist-analyze")) {
  const item = detailButton.dataset.watchlistItem || detailButton.dataset.watchlistDetailItem || "";
  await openWatchlistDetail(item, detailButton);
  return;
}
```

Add keyboard/delegated modal handlers in `bindEvents()`:

```javascript
document.addEventListener("click", (event) => {
  if (event.target.closest("[data-watchlist-detail-close]")) closeWatchlistDetail();
});
document.addEventListener("keydown", async (event) => {
  if (event.key === "Escape" && !$("#watchlistDetailModal")?.hidden) {
    closeWatchlistDetail();
  }
  if (event.key === "Enter") {
    const card = event.target.closest("[data-watchlist-detail-item]");
    if (card && document.activeElement === card) {
      await openWatchlistDetail(card.dataset.watchlistDetailItem || "", card);
    }
  }
});
```

- [ ] **Step 6: Add modal CSS**

Modify `public/styles.css`:

```css
.watchlist-card.compact {
  cursor: pointer;
}

.watchlist-card.compact:focus-visible {
  outline: 2px solid var(--folio-gold);
  outline-offset: 3px;
}

#watchlistNews[hidden] {
  display: none;
}

.watchlist-detail-modal[hidden] {
  display: none;
}

.watchlist-detail-modal {
  position: fixed;
  inset: 0;
  z-index: 80;
}

.watchlist-detail-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(11, 26, 43, 0.45);
}

.watchlist-detail-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(1100px, calc(100vw - 32px));
  max-height: calc(100vh - 48px);
  margin: 24px auto;
  border-radius: 8px;
  background: var(--folio-surface-clean);
  overflow: hidden;
  box-shadow: var(--elev-2);
}

.watchlist-detail-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--folio-line);
}

.watchlist-detail-head h2 {
  margin: 4px 0;
  font-size: var(--fs-2xl);
}

.watchlist-detail-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px 20px 22px;
  overflow: auto;
}

.watchlist-detail-widgets {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  gap: 12px;
}

.watchlist-detail-local-news h3 {
  margin: 0 0 10px;
  font-size: var(--fs-xl);
}

.watchlist-detail-news {
  display: grid;
  gap: 10px;
}

.modal-open {
  overflow: hidden;
}

@media (max-width: 760px) {
  .watchlist-detail-panel {
    width: 100vw;
    max-height: 100vh;
    min-height: 100vh;
    margin: 0;
    border-radius: 0;
  }
  .watchlist-detail-widgets {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 7: Run tests**

Run:

```powershell
py -3 -m pytest features\frontend_ui\tests\test_market_widgets_ui.py -q
node --check public\app.js
```

Expected: tests pass and syntax check exits 0.

- [ ] **Step 8: Commit**

Run:

```powershell
git add public/index.html public/app.js public/styles.css features/frontend_ui/tests/test_market_widgets_ui.py
git commit -m "Redesign watchlist detail modal"
```

---

### Task 6: Documentation and Roadmap Updates

**Files:**

- Modify: `features/market_widgets/README.md`
- Modify: `features/investment_review/README.md`
- Modify: `features/watchlist_notes/README.md`
- Modify: `features/frontend_ui/README.md`
- Modify: `roadmap/BRIEFING_IMPLEMENTATION_PLAN.md`
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update feature docs**

Add to `features/market_widgets/README.md`:

```markdown
## Dashboard Contract

The dashboard widget board replaces the primary Market Tape strip. The old `review.marketTape` remains as a local fallback if TradingView cannot load.

Allowed widgets are validated by `features/market_widgets/service.py`. TradingView widget output is never stored.
```

Add to `features/watchlist_notes/README.md`:

```markdown
## Detail Modal

The Watchlist tab does not show item news inline by default. Each item opens a detail modal with TradingView current-market widgets and Folio OS-collected local news from the research index.
```

Add to `features/investment_review/README.md`:

```markdown
> The dashboard current-market area is now a configurable TradingView widget board. `marketTape` remains available as a local fallback and quality/debug data, but it is not the primary dashboard UI.
```

Add to `features/frontend_ui/README.md`:

```markdown
- `public/tradingview-widgets.js` owns TradingView widget embedding. `public/app.js` only passes validated settings/detail payloads and handles app state.
```

- [ ] **Step 2: Update roadmap and AGENTS/CLAUDE**

In `roadmap/BRIEFING_IMPLEMENTATION_PLAN.md`, update Step 6 status from `[대기]` to `[진행]` or `[완료]` depending on implementation completion, and check completed P0-P5 items.

In `AGENTS.md` and `CLAUDE.md`, update the briefing row to mention:

```text
현재 시장 대시보드 위젯 진행/완료: TradingView widget board, Watchlist company detail modal, Market Tape fallback 유지
```

Keep both files identical.

- [ ] **Step 3: Add sync and doc tests**

Run:

```powershell
Compare-Object (Get-Content AGENTS.md) (Get-Content CLAUDE.md) | Select-Object -First 5
```

Expected: no output.

- [ ] **Step 4: Commit**

Run:

```powershell
git add features/market_widgets/README.md features/investment_review/README.md features/watchlist_notes/README.md features/frontend_ui/README.md roadmap/BRIEFING_IMPLEMENTATION_PLAN.md AGENTS.md CLAUDE.md
git commit -m "Document market widget dashboard"
```

---

### Task 7: Full Verification and Browser QA

**Files:**

- No code files unless QA reveals a bug.

- [ ] **Step 1: Run backend and frontend tests**

Run:

```powershell
py -3 -m pytest features\market_widgets\tests features\watchlist_notes\tests\test_watchlist_detail.py features\frontend_ui\tests\test_market_widgets_ui.py features\frontend_ui\tests\test_typography_and_elevation.py -q
node --test public\tradingview-widgets.test.js
node --check public\app.js
node --check public\tradingview-widgets.js
py -3 -m py_compile app.py features\market_widgets\service.py features\watchlist_notes\service.py
```

Expected: all commands exit 0.

- [ ] **Step 2: Start local server**

Use the existing app start pattern. If no server is already running:

```powershell
py -3 app.py
```

If the port is occupied, inspect the running process and reuse the existing server URL instead of killing unrelated work.

- [ ] **Step 3: Browser QA dashboard**

Open the app and verify:

- Dashboard shows `현재 시장 위젯` where Market Tape used to be.
- At least one TradingView widget renders on desktop width.
- Reset button returns default widgets.
- Add button adds a focused Nasdaq chart widget.
- If TradingView is blocked in devtools/network simulation, local Market Tape fallback remains visible or a clear unavailable state appears.
- Mobile width around 390px has no horizontal overflow.

- [ ] **Step 4: Browser QA watchlist**

Verify:

- Watchlist tab shows compact cards without inline latest news.
- `#watchlistNews` is hidden.
- Clicking a card opens modal/drawer.
- Modal shows TradingView chart/info when a symbol exists.
- Modal shows Folio OS-collected local news.
- Escape closes modal and focus returns to the card.
- Mobile drawer fills viewport and scrolls internally.

- [ ] **Step 5: Verify current-market separation**

Run:

```powershell
git status --short data\briefings data\market-memory.sqlite3
```

Expected: no changes caused by opening widgets. `data/market-widget-settings.json` may exist only if settings were saved during QA; do not commit it unless explicitly requested.

- [ ] **Step 6: Final commit if QA fixes were needed**

If QA required code changes:

```powershell
git status --short
git add app.py public/app.js public/index.html public/styles.css public/tradingview-widgets.js public/tradingview-widgets.test.js features/market_widgets features/watchlist_notes features/frontend_ui/tests/test_market_widgets_ui.py features/investment_review/README.md features/watchlist_notes/README.md features/frontend_ui/README.md roadmap/BRIEFING_IMPLEMENTATION_PLAN.md AGENTS.md CLAUDE.md
git commit -m "Fix market widget QA issues"
```

If no changes were needed, do not create an empty commit.

---

## Final Regression Checklist

- [ ] TradingView widgets are used only on dashboard and watchlist detail modal.
- [ ] Market Tape backend remains available as fallback.
- [ ] Watchlist page does not inline local news until an item is selected.
- [ ] Watchlist modal shows local Folio OS news, not TradingView Top Stories.
- [ ] External widget failure does not break dashboard or watchlist.
- [ ] No briefing JSON, visual sidecar, or market-memory DB is modified by widget viewing.
- [ ] `AGENTS.md` and `CLAUDE.md` are identical.
