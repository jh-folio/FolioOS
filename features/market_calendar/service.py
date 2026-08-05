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
from features.market_calendar.adapters.bok import fetch_bok_macro_events
from features.market_calendar.adapters.fred import fetch_fred_macro_events
from features.market_calendar.adapters.yf_economic import fetch_yf_economic_events
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


# 지표 발표일은 키가 있어야 들어온다. 키가 없으면 캘린더는 그냥 빈 화면이 되는데,
# 사용자는 "이번 주에 지표가 없는 것"과 "수집 자체가 안 되는 것"을 구분할 수 없다.
# 새로고침 직후의 안내 문구로만 알리면 화면을 처음 열었을 때는 알 길이 없으므로,
# 조회 응답이 항상 공백을 함께 들고 나간다.
MACRO_COVERAGE_GAPS = {
    "US": {
        "provider": "fred",
        "requires": "FRED_API_KEY",
        # 키가 없어도 화면이 비지는 않는다. yfinance 폴백이 추정 일정으로 채우므로,
        # 공백이 아니라 정확도 차이임을 알린다.
        "severity": "degraded",
        "message": "미국 지표 일정을 Yahoo Finance 추정치로 표시하고 있습니다. FRED API Key를 등록하면 공식 확정일로 바뀝니다.",
        "settingsHint": "설정 > 외부 데이터에서 FRED API Key를 등록하세요.",
        "sourceUrl": "https://fred.stlouisfed.org/docs/api/api_key.html",
    },
    "KR": {
        "provider": "bok_ecos",
        "requires": "BOK_API_KEY",
        # 한국도 yfinance가 일부 지표를 주지만 금통위 일정은 ECOS 경로에서만 나온다.
        "severity": "degraded",
        "message": "한국 금통위 일정은 한국은행 ECOS API Key를 등록해야 수집됩니다. 일부 지표는 Yahoo Finance 추정치로 표시됩니다.",
        "settingsHint": "설정 > 외부 데이터에서 BOK API Key를 등록하세요.",
        "sourceUrl": "https://ecos.bok.or.kr/api/",
    },
}


def macro_coverage_gaps(markets: list[str] | None = None) -> list[dict]:
    """Report which macro calendars cannot be collected with the current keys.

    Reported per market, so a Korean user missing only the BOK key still sees
    the US indicators they do have and learns exactly what is absent.
    """
    from features.llm_settings.client import bok_api_key, fred_api_key

    present = {"US": bool(fred_api_key()), "KR": bool(bok_api_key())}
    wanted = [m for m in (markets or ["US", "KR"]) if m in MACRO_COVERAGE_GAPS]
    gaps = []
    for market in wanted:
        if present.get(market):
            continue
        gaps.append({"market": market, "kind": "macro", **MACRO_COVERAGE_GAPS[market]})
    return gaps


def list_events(db_path: Path, *, start: str = "", end: str = "", market: str = "", kinds: list[str] | None = None, tickers: list[str] | None = None, limit: int = 200) -> dict:
    requested_markets = [market.upper()] if market else ["US", "KR"]
    gaps = macro_coverage_gaps(requested_markets)
    if not Path(db_path).exists():
        return {"events": [], "count": 0, "dataGaps": gaps}
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
    return {"events": events, "count": len(events), "dataGaps": gaps}


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

    from features.llm_settings.client import bok_api_key, fred_api_key

    key = fred_api_key()
    if key:
        macro = fetch_fred_macro_events(key, start=today.isoformat(), end=(today + dt.timedelta(days=60)).isoformat())
        events.extend(macro)
        providers["fred_macro"] = len(macro)
    else:
        providers["fred_macro"] = "fred_key_required"

    # 한국은 normalizer만 있고 수집 경로가 연결된 적이 없어 금통위·지표가 0건이었다.
    # ECOS 키가 있으면 채우고, 없으면 미국과 같은 형태의 명시적 공백으로 남긴다.
    bok_key = bok_api_key()
    if bok_key:
        kr_macro = fetch_bok_macro_events(
            bok_key, start=today.isoformat(), end=(today + dt.timedelta(days=60)).isoformat()
        )
        events.extend(kr_macro)
        providers["bok_macro"] = len(kr_macro)
    else:
        providers["bok_macro"] = "bok_key_required"

    # 일본·유럽은 FRED가 다루지 않는다. yfinance 경제 캘린더는 키 없이 이 시장을 채우는
    # 유일한 경로라 estimated로 넣는다. FRED 키가 없으면 미국까지 여기서 받아,
    # 키를 발급받지 않은 사용자도 지표 일정을 빈 화면으로 보지 않게 한다.
    overseas = fetch_yf_economic_events(
        start=today.isoformat(),
        end=(today + dt.timedelta(days=60)).isoformat(),
        include_us=not key,
    )
    events.extend(overseas)
    providers["yfinance_economic"] = len(overseas)
    if not key:
        providers["us_macro_source"] = "yfinance_fallback"

    if include_estimates and tickers:
        earnings = estimated_earnings_events(tickers)
        dividends = estimated_dividend_events(tickers)
        events.extend(earnings)
        events.extend(dividends)
        providers.update({"yfinance_earnings": len(earnings), "yfinance_dividends": len(dividends)})
    count = upsert_events(memory_db, events)
    return {"ok": True, "stored": count, "providers": providers, "dataGaps": macro_coverage_gaps(), "agentCalled": False}
