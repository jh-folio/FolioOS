"""틀린 수치를 그 세션 수치로 저장하지 않는다.

실측 사고를 그대로 재현한 fixture로 검사한다. `korea-market-data-2026-08-10.json`은
08-10 08:02(개장 한 시간 전)에 만들어졌고 `ok: True`인데 대표지수 `asOfDate`가 08-07,
환율이 08-09였다. 경고에 `market_data_unavailable`까지 있었는데 그대로 저장됐고,
Agent 경로 캐시가 TTL을 무시해 영원히 재사용됐다.
"""
from __future__ import annotations

import datetime as dt

import pytest

from features.common.market_data import session_cache


DENIED_PAYLOAD = {
    # 사고 당시 저장된 것과 같은 모양. `ok`는 True다.
    "ok": True,
    "date": "2026-08-10",
    "provider": "yfinance",
    "indices": {
        "KOSPI": {"asOfDate": "2026-08-07", "close": 6258.77, "changePct": -0.597},
        "KOSDAQ": {"asOfDate": "2026-08-07", "close": 798.81},
    },
    "fx": {"USDKRW": {"asOfDate": "2026-08-09", "close": 1409.70}},
    "warnings": ["KOSPI: market_data_unavailable"],
}

GOOD_PAYLOAD = {
    "ok": True,
    "date": "2026-08-10",
    "provider": "pykrx",
    "indices": {
        "KOSPI": {"asOfDate": "2026-08-10", "close": 6299.66, "changePct": 0.65},
        "KOSDAQ": {"asOfDate": "2026-08-10", "close": 810.12},
    },
    "fx": {"USDKRW": {"asOfDate": "2026-08-10", "close": 1402.10}},
}


@pytest.fixture(autouse=True)
def isolated_cache(tmp_path, monkeypatch):
    monkeypatch.setattr(session_cache, "CACHE_DIR", tmp_path / "market-session-cache")


def test_a_previous_session_snapshot_is_not_accepted_as_this_session():
    ok, reason = session_cache.validate(DENIED_PAYLOAD, "2026-08-10")

    assert ok is False
    assert reason.startswith("as_of_mismatch:")
    assert "2026-08-07" in reason


def test_the_matching_session_passes():
    assert session_cache.validate(GOOD_PAYLOAD, "2026-08-10") == (True, "")


def test_a_payload_without_any_index_anchor_is_refused():
    ok, reason = session_cache.validate({"ok": True, "indices": {}}, "2026-08-10")

    assert (ok, reason) == (False, "no_primary_anchor")


def test_a_failed_fetch_is_never_stored():
    stored, reason = session_cache.store("korea-market", "kr", "2026-08-10", "closed", DENIED_PAYLOAD)

    assert stored is False
    assert reason.startswith("as_of_mismatch:")
    assert not session_cache.cache_path("korea-market", "kr", "2026-08-10", "closed").exists()


def test_a_failed_fetch_does_not_replace_a_valid_entry():
    """실패가 성공을 덮으면, 한 번 낡은 값이 그 세션의 확정 수치가 된다."""
    session_cache.store("korea-market", "kr", "2026-08-10", "closed", GOOD_PAYLOAD)

    payload, reason = session_cache.session_market_data(
        "korea-market", "kr", "2026-08-10", "closed", lambda _d: DENIED_PAYLOAD,
    )

    # 캐시가 이미 유효하므로 fetcher를 부르지도 않는다.
    assert payload == GOOD_PAYLOAD
    assert reason == ""
    assert session_cache.load("korea-market", "kr", "2026-08-10", "closed") == GOOD_PAYLOAD


def test_a_mismatched_fetch_returns_nothing_rather_than_a_wrong_number():
    """없으면 없다고 한다. 직전 세션 값으로 메우지 않는다."""
    payload, reason = session_cache.session_market_data(
        "korea-market", "kr", "2026-08-10", "closed", lambda _d: DENIED_PAYLOAD,
    )

    assert payload is None
    assert reason.startswith("as_of_mismatch:")


def test_a_good_fetch_is_stored_and_reused():
    calls = []

    def fetcher(date):
        calls.append(date)
        return GOOD_PAYLOAD

    first, _ = session_cache.session_market_data("korea-market", "kr", "2026-08-10", "closed", fetcher)
    second, _ = session_cache.session_market_data("korea-market", "kr", "2026-08-10", "closed", fetcher)

    assert first == second == GOOD_PAYLOAD
    assert calls == ["2026-08-10"], "확정된 마감 세션을 두 번 받을 이유가 없다"


def test_intraday_and_closed_are_different_cache_entries():
    """같은 세션이라도 장중 스냅샷과 마감 종가는 다른 값이다.

    상태를 키에서 빼면 장중에 받은 값이 그 세션의 확정 수치로 굳는다.
    """
    session_cache.store("korea-market", "kr", "2026-08-10", "intraday", GOOD_PAYLOAD)

    assert session_cache.load("korea-market", "kr", "2026-08-10", "closed") is None
    assert session_cache.load("korea-market", "kr", "2026-08-10", "intraday") == GOOD_PAYLOAD


def test_intraday_entries_expire_but_closed_ones_do_not(monkeypatch):
    session_cache.store("korea-market", "kr", "2026-08-10", "intraday", GOOD_PAYLOAD)
    session_cache.store("korea-market", "kr", "2026-08-10", "closed", GOOD_PAYLOAD)

    later = dt.datetime.now(dt.timezone.utc) + dt.timedelta(seconds=session_cache.INTRADAY_TTL_SECONDS + 60)

    class Clock(dt.datetime):
        @classmethod
        def now(cls, tz=None):
            return later

    monkeypatch.setattr(session_cache.dt, "datetime", Clock)

    assert session_cache.load("korea-market", "kr", "2026-08-10", "intraday") is None
    assert session_cache.load("korea-market", "kr", "2026-08-10", "closed") == GOOD_PAYLOAD


def test_a_fetcher_that_raises_does_not_leave_a_cache_entry():
    def boom(_date):
        raise TimeoutError("provider down")

    payload, reason = session_cache.session_market_data("korea-market", "kr", "2026-08-10", "closed", boom)

    assert payload is None
    assert reason == "fetch_error:TimeoutError"
    assert not session_cache.cache_path("korea-market", "kr", "2026-08-10", "closed").exists()


def test_an_entry_from_an_older_schema_is_ignored():
    session_cache.store("korea-market", "kr", "2026-08-10", "closed", GOOD_PAYLOAD)
    path = session_cache.cache_path("korea-market", "kr", "2026-08-10", "closed")
    import json

    row = json.loads(path.read_text(encoding="utf-8"))
    row["schemaVersion"] = session_cache.SCHEMA_VERSION - 1
    path.write_text(json.dumps(row, ensure_ascii=False), encoding="utf-8")

    assert session_cache.load("korea-market", "kr", "2026-08-10", "closed") is None
