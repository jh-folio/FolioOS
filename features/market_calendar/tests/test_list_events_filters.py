"""종목 일정 조회는 LIMIT이 아니라 티커로 좁힌다.

`tickers_json`이 리스트라 티커 판정을 파이썬에서 하는데, SQL LIMIT을 함께 걸면
티커와 무관한 앞쪽 일정이 LIMIT을 소진해 종목 일정이 한 건도 남지 않았다
(실측: 90일 창의 앞 20건이 전부 macro라 `ticker=AVGO&limit=20`이 항상 빈 결과).
"""
from __future__ import annotations

from features.market_calendar.service import list_events, upsert_events


def _macro(day: int) -> dict:
    return {
        "kind": "macro", "title": f"지표 {day}", "market": "US",
        "startsAt": f"2026-09-{day:02d}T12:00:00+00:00", "timezone": "UTC",
        "status": "confirmed", "provider": "fred", "source": "FRED",
    }


def _earnings(ticker: str, day: int) -> dict:
    return {
        "kind": "earnings", "title": f"{ticker} 실적 발표 예정", "tickers": [ticker], "market": "US",
        "startsAt": f"2026-09-{day:02d}T12:00:00+00:00", "timezone": "UTC",
        "status": "estimated", "provider": "yfinance", "source": "yfinance",
    }


def test_ticker_filter_reaches_events_behind_the_limit(tmp_path):
    db = tmp_path / "market-memory.sqlite3"
    upsert_events(db, [_macro(day) for day in range(1, 26)] + [_earnings("AVGO", 27)])

    result = list_events(db, tickers=["AVGO"], limit=20)

    assert result["count"] == 1
    assert result["events"][0]["tickers"] == ["AVGO"]


def test_ticker_filter_is_exact_and_still_honours_the_limit(tmp_path):
    db = tmp_path / "market-memory.sqlite3"
    upsert_events(db, [_earnings("MUFG", 3), *[_earnings("MU", day) for day in (4, 5, 6)]])

    exact = list_events(db, tickers=["mu"], limit=200)
    assert {event["startsAt"][:10] for event in exact["events"]} == {"2026-09-04", "2026-09-05", "2026-09-06"}

    capped = list_events(db, tickers=["MU"], limit=2)
    assert capped["count"] == 2


def test_untargeted_query_still_caps_rows_in_sql(tmp_path):
    db = tmp_path / "market-memory.sqlite3"
    upsert_events(db, [_macro(day) for day in range(1, 11)])

    assert list_events(db, limit=3)["count"] == 3
