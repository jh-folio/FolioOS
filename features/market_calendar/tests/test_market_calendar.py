from __future__ import annotations

import sqlite3

import pytest

from features.market_calendar.schema import KINDS, normalize_event
from features.market_calendar.service import list_events, upsert_events


def event(**overrides):
    value = {
        "id": "fed-fomc-2026-09",
        "kind": "central_bank",
        "title": "FOMC decision",
        "market": "US",
        "startsAt": "2026-09-16T14:00:00-04:00",
        "timezone": "America/New_York",
        "status": "confirmed",
        "provider": "federal_reserve",
        "source": "Federal Reserve",
    }
    value.update(overrides)
    return value


def test_calendar_only_accepts_six_approved_kinds_and_valid_timezone():
    assert KINDS == {"macro", "central_bank", "holiday", "earnings", "filing", "dividend"}
    assert normalize_event(event())["startsAt"].endswith("-04:00")
    with pytest.raises(ValueError, match="calendar_kind_invalid"):
        normalize_event(event(kind="personal_research"))
    with pytest.raises(ValueError, match="calendar_timezone_invalid"):
        normalize_event(event(timezone="Mars/Olympus"))


def test_update_and_cancellation_keep_provider_identity(tmp_path):
    db = tmp_path / "market-memory.sqlite3"
    assert upsert_events(db, [event()]) == 1
    assert upsert_events(db, [event(startsAt="2026-09-16T14:30:00-04:00", cancelled=True, updatedAt="2026-09-15T12:00:00Z")]) == 1
    result = list_events(db)
    assert result["count"] == 1
    assert result["events"][0]["cancelled"] is True
    assert result["events"][0]["startsAt"].endswith("14:30:00-04:00")


def test_additive_table_migration_preserves_existing_rows(tmp_path):
    db = tmp_path / "market-memory.sqlite3"
    with sqlite3.connect(db) as conn:
        conn.execute(
            """CREATE TABLE market_calendar_events (
            id TEXT PRIMARY KEY, kind TEXT NOT NULL, title TEXT NOT NULL, market TEXT NOT NULL,
            country TEXT NOT NULL, tickers_json TEXT NOT NULL, starts_at TEXT NOT NULL, ends_at TEXT NOT NULL,
            timezone TEXT NOT NULL, all_day INTEGER NOT NULL, status TEXT NOT NULL, importance INTEGER NOT NULL,
            source TEXT NOT NULL, source_url TEXT NOT NULL, as_of TEXT NOT NULL, fetched_at TEXT NOT NULL,
            provider TEXT NOT NULL, parser_version TEXT NOT NULL)"""
        )
        conn.execute(
            "INSERT INTO market_calendar_events VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            ("old", "macro", "CPI", "US", "US", "[]", "2026-09-01T00:00:00+00:00", "", "UTC", 0, "actual", 3, "FRED", "", "", "", "fred", "0.3"),
        )
        conn.commit()
    upsert_events(db, [event()])
    with sqlite3.connect(db) as conn:
        assert conn.execute("SELECT count(*) FROM market_calendar_events").fetchone()[0] == 2
        columns = {row[1] for row in conn.execute("PRAGMA table_info(market_calendar_events)")}
    assert {"cancelled", "updated_at"} <= columns



def test_official_holidays_are_confirmed_all_day_and_kind_holiday():
    from features.market_calendar.adapters.exchange import official_holiday_events

    events = official_holiday_events([2026])
    assert len(events) == 25  # NYSE 10 + KRX 15
    assert all(event["kind"] == "holiday" for event in events)
    assert all(event["status"] == "confirmed" for event in events)
    assert all(event["allDay"] for event in events)
    assert all(event["sourceUrl"] for event in events)
    markets = {event["market"] for event in events}
    assert markets == {"US", "KR"}


def test_official_fomc_2026_has_eight_statement_events_with_et_time():
    from features.market_calendar.adapters.fed import official_fomc_events

    events = official_fomc_events([2026])
    statements = [event for event in events if "성명서" in event["title"]]
    assert len(statements) == 8
    assert all(event["kind"] == "central_bank" for event in events)
    assert all(event["status"] == "confirmed" for event in events)
    assert all(event["timezone"] == "America/New_York" for event in statements)
    assert all(event["importance"] == 3 for event in statements)


def test_fred_macro_fetch_returns_empty_without_key():
    from features.market_calendar.adapters.fred import fetch_fred_macro_events

    assert fetch_fred_macro_events("", start="2026-08-01", end="2026-09-30") == []


def test_calendar_target_tickers_include_watchlist(tmp_path, monkeypatch):
    import json

    from features.market_calendar import service as calendar_service

    (tmp_path / "portfolio.json").write_text(json.dumps({"positions": [{"ticker": "NVDA", "quantity": 1}], "cash": []}), encoding="utf-8")
    (tmp_path / "watchlist.json").write_text(json.dumps(["AAPL"]), encoding="utf-8")
    monkeypatch.setattr("features.portfolio.service.PORTFOLIO_PATH", tmp_path / "portfolio.json")
    tickers = calendar_service._calendar_target_tickers(tmp_path)
    assert "NVDA" in tickers
    assert "AAPL" in tickers


def test_estimated_events_use_listing_market_not_hardcoded_us():
    """KRX 티커가 US/ET로 저장되면 market=KR 필터에서 사라지고 US에 잘못 뜬다."""
    from features.market_calendar.adapters._ticker_market import market_for_ticker

    assert market_for_ticker("NVDA") == ("US", "America/New_York")
    assert market_for_ticker("BRK-B") == ("US", "America/New_York")
    assert market_for_ticker("005930.KS") == ("KR", "Asia/Seoul")
    assert market_for_ticker("247540.KQ") == ("KR", "Asia/Seoul")
    assert market_for_ticker("005930.ks") == ("KR", "Asia/Seoul")
