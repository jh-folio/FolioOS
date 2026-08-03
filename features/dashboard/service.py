from __future__ import annotations

import json
import time
from pathlib import Path

from features.common.change_intelligence.projection import list_change_events
from features.common.research_library.signals.service import provider_health
from features.common.utils import read_json, write_json
from features.dashboard.schema import native_symbol, normalize_dashboard_settings
from features.market_widgets.service import get_market_widget_settings
from features.portfolio.service import get_portfolio
from features.watchlist_notes.service import get_watchlist, sec_ticker_for_name, tradingview_symbol_for_query


def settings_path(data_dir: Path) -> Path:
    return Path(data_dir) / "dashboard-settings.json"


def get_dashboard_settings(data_dir: Path) -> dict:
    return normalize_dashboard_settings(read_json(settings_path(data_dir), {}))


def save_dashboard_settings(data_dir: Path, payload: dict) -> dict:
    current = read_json(settings_path(data_dir), {})
    merged = {**(current if isinstance(current, dict) else {}), **(payload or {})}
    normalized = normalize_dashboard_settings(merged)
    write_json(settings_path(data_dir), normalized)
    return normalized


def focus_symbols(data_dir: Path) -> list[dict]:
    rows = []
    legacy_settings = get_market_widget_settings(data_dir)
    widgets = ((legacy_settings.get("dashboard") or {}).get("widgets") or []) if (Path(data_dir) / "market-widget-settings.json").exists() else []
    for widget in widgets:
        if widget.get("type") not in {"advanced_chart", "symbol_overview", "ticker_tag", "single_ticker"}:
            continue
        symbol = native_symbol(widget.get("symbol"))
        if symbol and symbol not in [row["symbol"] for row in rows]:
            rows.append({"symbol": symbol, "label": widget.get("title") or symbol, "source": "legacy_setting"})
    for item in get_watchlist(data_dir):
        symbol = native_symbol(tradingview_symbol_for_query(item)) or sec_ticker_for_name(item)
        if symbol and symbol not in [row["symbol"] for row in rows]:
            rows.append({"symbol": symbol, "label": item, "source": "watchlist"})
    if not rows:
        rows = [{"symbol": "SPY", "label": "S&P 500", "source": "fallback"}, {"symbol": "^KS11", "label": "KOSPI", "source": "fallback"}]
    return rows[:12]


def _calendar_refs(db_path: Path, limit: int = 12) -> list[dict]:
    if not db_path.exists():
        return []
    import sqlite3

    with sqlite3.connect(str(db_path)) as conn:
        conn.row_factory = sqlite3.Row
        try:
            rows = conn.execute(
                "SELECT id,kind,title,market,starts_at,status,importance,provider FROM market_calendar_events "
                "WHERE starts_at>=datetime('now','-1 day') ORDER BY starts_at LIMIT ?", (limit,),
            ).fetchall()
        except sqlite3.Error:
            return []
    return [dict(row) for row in rows]


VISIBLE_CHANGE_STATUSES = ("major_change", "developing_signal", "conflicting_uncertain")


def build_cockpit_payload(data_dir: Path) -> dict:
    started = time.perf_counter()
    data_dir = Path(data_dir)
    db_path = data_dir / "market-memory.sqlite3"
    events = list_change_events(db_path, limit=24)
    changes = [row for row in events if row.get("status") in VISIBLE_CHANGE_STATUSES]
    quiet = [row for row in events if row.get("status") not in VISIBLE_CHANGE_STATUSES]
    portfolio = get_portfolio(data_dir)
    portfolio_tickers = {str(row.get("ticker") or "").upper() for row in portfolio.get("positions") or []}
    watchlist_tickers = {native_symbol(tradingview_symbol_for_query(item)) or sec_ticker_for_name(item) for item in get_watchlist(data_dir)}
    watchlist_tickers = {t for t in watchlist_tickers if t} - portfolio_tickers
    implications = []
    for event in changes:
        lineage = str(event.get("lineageId") or "").upper()
        matched_portfolio = sorted(t for t in portfolio_tickers if t and t in lineage)
        matched_watchlist = sorted(t for t in watchlist_tickers if t and t in lineage)
        if matched_portfolio or matched_watchlist:
            implications.append({
                "tickers": matched_portfolio + matched_watchlist,
                "source": "portfolio" if matched_portfolio else "watchlist",
                "status": event.get("status"), "artifactId": event.get("artifactId"), "generatedAt": event.get("generatedAt"),
            })
    payload = {
        "schemaVersion": 1, "mode": get_dashboard_settings(data_dir)["dashboardMode"],
        "changes": changes[:12], "quietChanges": quiet[:8],
        "changeCounts": {
            "majorChange": sum(1 for row in changes if row.get("status") == "major_change"),
            "developingSignal": sum(1 for row in changes if row.get("status") == "developing_signal"),
            "conflictingUncertain": sum(1 for row in changes if row.get("status") == "conflicting_uncertain"),
            "quiet": len(quiet),
        },
        "calendarRefs": _calendar_refs(db_path), "focusSymbols": focus_symbols(data_dir),
        "implications": implications[:8],
        "providerHealth": list(provider_health(data_dir).values()),
        "invalidationToken": events[0].get("invalidationToken") if events else "",
        "portfolioState": "available" if portfolio.get("positions") else "empty",
    }
    encoded = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    payload["telemetry"] = {"assemblyMs": round((time.perf_counter() - started) * 1000, 2), "payloadBytes": len(encoded), "upstreamRequests": 0}
    return payload
