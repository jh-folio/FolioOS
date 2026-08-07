"""추정 일정 정리는 **물어본 티커**만 건드린다.

어댑터는 티커별 예외를 삼키고 상한(30개)에서 자르므로 "이번 결과에 없다"가
"없어졌다"를 뜻하지 않는다. 그 둘을 섞으면 조회조차 안 된 종목의 멀쩡한 일정이
사라진다 — 실측으로 대상 53개 중 앞 30개만 조회돼 `GEV`가 삭제 대상이었다.
"""
from __future__ import annotations

import sqlite3

from features.market_calendar.service import ensure_calendar_table, prune_stale_estimates, upsert_events


def _rows(db):
    with sqlite3.connect(str(db)) as conn:
        return {r[0] for r in conn.execute("SELECT id FROM market_calendar_events").fetchall()}


def _seed(db, events):
    upsert_events(db, events)
    with sqlite3.connect(str(db)) as conn:
        ensure_calendar_table(conn)
    return _rows(db)


def _estimate(ticker, starts, kind="earnings"):
    return {
        "kind": kind, "title": f"{ticker} 실적 발표 예정", "tickers": [ticker], "startsAt": starts,
        "timezone": "UTC", "status": "estimated", "source": "yfinance", "provider": "yfinance", "market": "US",
    }


def test_a_ticker_that_was_never_queried_keeps_its_rows(tmp_path):
    db = tmp_path / "memory.sqlite3"
    _seed(db, [_estimate("GEV", "2026-08-20T12:00:00+00:00"), _estimate("NVDA", "2026-08-21T12:00:00+00:00")])
    # NVDA만 물어봤다. GEV는 상한 밖이라 조회조차 안 됐다.
    fresh = [_estimate("NVDA", "2026-08-28T12:00:00+00:00")]
    upsert_events(db, fresh)
    removed = prune_stale_estimates(db, fresh, {"NVDA"})
    remaining = _rows(db)
    assert removed == 1  # NVDA의 옛 날짜 행만
    with sqlite3.connect(str(db)) as conn:
        kept = [r[0] for r in conn.execute("SELECT tickers_json FROM market_calendar_events").fetchall()]
    assert any("GEV" in row for row in kept), "조회하지 않은 티커의 행이 지워졌다"
    assert len(remaining) == 2


def test_a_stale_duplicate_of_a_queried_ticker_goes(tmp_path):
    """시장 판정을 고치면 시작시각이 바뀌어 id가 새로 생기고 옛 행이 남는다."""
    db = tmp_path / "memory.sqlite3"
    old = {**_estimate("8316.T", "2026-07-31T00:00:00-04:00"), "market": "US"}
    _seed(db, [old])
    fresh = [{**_estimate("8316.T", "2026-07-31T00:00:00+09:00"), "market": "JP"}]
    upsert_events(db, fresh)
    assert len(_rows(db)) == 2
    assert prune_stale_estimates(db, fresh, {"8316.T"}) == 1
    assert len(_rows(db)) == 1


def test_nothing_queried_deletes_nothing(tmp_path):
    db = tmp_path / "memory.sqlite3"
    before = _seed(db, [_estimate("NVDA", "2026-08-21T12:00:00+00:00")])
    assert prune_stale_estimates(db, [], set()) == 0
    assert _rows(db) == before


def test_official_and_confirmed_rows_are_never_touched(tmp_path):
    db = tmp_path / "memory.sqlite3"
    official = {
        "kind": "holiday", "title": "추석", "startsAt": "2026-09-25", "allDay": True,
        "status": "confirmed", "source": "krx", "provider": "krx", "market": "KR",
    }
    confirmed_earnings = {**_estimate("NVDA", "2026-08-19T12:00:00+00:00"), "status": "actual"}
    _seed(db, [official, confirmed_earnings])
    before = _rows(db)
    assert prune_stale_estimates(db, [], {"NVDA", "AAPL"}) == 0
    assert _rows(db) == before


def test_a_similar_ticker_is_not_swept_up(tmp_path):
    """`MU`를 물었다고 `MUFG` 행을 지우면 안 된다 — LIKE 매칭의 함정."""
    db = tmp_path / "memory.sqlite3"
    _seed(db, [_estimate("MUFG", "2026-08-20T12:00:00+00:00")])
    assert prune_stale_estimates(db, [], {"MU"}) == 0
    assert len(_rows(db)) == 1
