from __future__ import annotations

import datetime as dt
import json
import sqlite3
from pathlib import Path

from features.market_calendar.adapters.dividends import estimated_dividend_events
from features.market_calendar.adapters.earnings import estimated_earnings_events
from features.market_calendar.adapters.exchange import official_holiday_events
from features.market_calendar.adapters.fed import official_fomc_events
from features.market_calendar.adapters.filings import local_filing_events
from features.market_calendar.adapters.fred import fetch_fred_macro_events
from features.market_calendar.schema import normalize_event
from features.portfolio.service import get_portfolio


def ensure_calendar_table(connection: sqlite3.Connection) -> None:
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS market_calendar_events (
            id TEXT PRIMARY KEY, kind TEXT NOT NULL, title TEXT NOT NULL, market TEXT NOT NULL,
            country TEXT NOT NULL, tickers_json TEXT NOT NULL, starts_at TEXT NOT NULL, ends_at TEXT NOT NULL,
            timezone TEXT NOT NULL, all_day INTEGER NOT NULL, status TEXT NOT NULL, importance INTEGER NOT NULL,
            source TEXT NOT NULL, source_url TEXT NOT NULL, as_of TEXT NOT NULL, fetched_at TEXT NOT NULL,
            provider TEXT NOT NULL, parser_version TEXT NOT NULL,
            cancelled INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT ''
        )
        """
    )
    columns = {row[1] for row in connection.execute("PRAGMA table_info(market_calendar_events)").fetchall()}
    if "cancelled" not in columns:
        connection.execute("ALTER TABLE market_calendar_events ADD COLUMN cancelled INTEGER NOT NULL DEFAULT 0")
    if "updated_at" not in columns:
        connection.execute("ALTER TABLE market_calendar_events ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''")
    connection.execute("CREATE INDEX IF NOT EXISTS idx_market_calendar_time ON market_calendar_events(starts_at, kind)")
    connection.execute("CREATE INDEX IF NOT EXISTS idx_market_calendar_market ON market_calendar_events(market, starts_at)")


def upsert_events(db_path: Path, events: list[dict]) -> int:
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with sqlite3.connect(str(db_path)) as conn:
        ensure_calendar_table(conn)
        for value in events:
            try:
                row = normalize_event(value)
            except (TypeError, ValueError):
                continue
            conn.execute(
                """INSERT INTO market_calendar_events
                   (id,kind,title,market,country,tickers_json,starts_at,ends_at,timezone,all_day,status,importance,source,source_url,as_of,fetched_at,provider,parser_version,cancelled,updated_at)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                   ON CONFLICT(id) DO UPDATE SET title=excluded.title,market=excluded.market,country=excluded.country,
                   tickers_json=excluded.tickers_json,starts_at=excluded.starts_at,ends_at=excluded.ends_at,
                   timezone=excluded.timezone,all_day=excluded.all_day,status=excluded.status,importance=excluded.importance,
                   source=excluded.source,source_url=excluded.source_url,as_of=excluded.as_of,fetched_at=excluded.fetched_at,
                   provider=excluded.provider,parser_version=excluded.parser_version,cancelled=excluded.cancelled,
                   updated_at=excluded.updated_at""",
                (row["id"], row["kind"], row["title"], row["market"], row["country"], json.dumps(row["tickers"], ensure_ascii=False), row["startsAt"], row["endsAt"], row["timezone"], int(row["allDay"]), row["status"], row["importance"], row["source"], row["sourceUrl"], row["asOf"], row["fetchedAt"], row["provider"], row["parserVersion"], int(row["cancelled"]), row["updatedAt"]),
            )
            count += 1
        conn.commit()
    return count


def list_events(db_path: Path, *, start: str = "", end: str = "", market: str = "", kinds: list[str] | None = None, tickers: list[str] | None = None, limit: int = 200) -> dict:
    if not Path(db_path).exists():
        return {"events": [], "count": 0}
    clauses = ["1=1"]
    params = []
    if start:
        clauses.append("starts_at>=?")
        params.append(start)
    if end:
        clauses.append("starts_at<=?")
        params.append(end)
    if market:
        clauses.append("market=?")
        params.append(market.upper())
    kinds = [kind for kind in kinds or [] if kind]
    if kinds:
        clauses.append(f"kind IN ({','.join('?' for _ in kinds)})")
        params.extend(kinds)
    with sqlite3.connect(str(db_path)) as conn:
        conn.row_factory = sqlite3.Row
        ensure_calendar_table(conn)
        rows = conn.execute(f"SELECT * FROM market_calendar_events WHERE {' AND '.join(clauses)} ORDER BY starts_at LIMIT ?", (*params, max(1, min(int(limit), 500)))).fetchall()
    events = []
    wanted = {ticker.upper() for ticker in tickers or []}
    for row in rows:
        row_tickers = json.loads(row["tickers_json"] or "[]")
        if wanted and not wanted.intersection(row_tickers):
            continue
        events.append({
            "id": row["id"], "kind": row["kind"], "title": row["title"], "market": row["market"], "country": row["country"],
            "tickers": row_tickers, "startsAt": row["starts_at"], "endsAt": row["ends_at"], "timezone": row["timezone"], "allDay": bool(row["all_day"]),
            "status": row["status"], "importance": row["importance"], "source": row["source"], "sourceUrl": row["source_url"],
            "asOf": row["as_of"], "fetchedAt": row["fetched_at"], "provider": row["provider"], "parserVersion": row["parser_version"],
            "cancelled": bool(row["cancelled"]), "updatedAt": row["updated_at"],
        })
    return {"events": events, "count": len(events)}


def _calendar_target_tickers(data_dir: Path) -> list[str]:
    """Portfolio positions plus resolved watchlist symbols, deduplicated."""
    portfolio = get_portfolio(data_dir)
    tickers = {str(row.get("symbol") or row.get("ticker") or "").upper() for row in portfolio.get("positions") or [] if row.get("symbol") or row.get("ticker")}
    try:
        from features.dashboard.schema import native_symbol
        from features.watchlist_notes.service import get_watchlist, sec_ticker_for_name, tradingview_symbol_for_query

        for item in get_watchlist(data_dir):
            symbol = native_symbol(tradingview_symbol_for_query(item)) or sec_ticker_for_name(item)
            if symbol and not symbol.startswith("^"):
                tickers.add(symbol)
    except Exception:
        pass
    return sorted(t for t in tickers if t)


def refresh_calendar(data_dir: Path, *, include_estimates: bool = True) -> dict:
    data_dir = Path(data_dir)
    research_db = data_dir / "research-index.sqlite3"
    memory_db = data_dir / "market-memory.sqlite3"
    tickers = _calendar_target_tickers(data_dir)
    events = local_filing_events(research_db)
    providers: dict[str, int | str] = {"official_filing": len(events)}

    today = dt.date.today()
    years = sorted({today.year, (today + dt.timedelta(days=90)).year})
    holidays = official_holiday_events(years)
    fomc = official_fomc_events(years)
    events.extend(holidays)
    events.extend(fomc)
    providers.update({"official_holidays": len(holidays), "official_fomc": len(fomc)})

    from features.llm_settings.client import fred_api_key

    key = fred_api_key()
    if key:
        macro = fetch_fred_macro_events(key, start=today.isoformat(), end=(today + dt.timedelta(days=60)).isoformat())
        events.extend(macro)
        providers["fred_macro"] = len(macro)
    else:
        providers["fred_macro"] = "fred_key_required"

    if include_estimates and tickers:
        earnings = estimated_earnings_events(tickers)
        dividends = estimated_dividend_events(tickers)
        events.extend(earnings)
        events.extend(dividends)
        providers.update({"yfinance_earnings": len(earnings), "yfinance_dividends": len(dividends)})
    count = upsert_events(memory_db, events)
    return {"ok": True, "stored": count, "providers": providers, "agentCalled": False}
