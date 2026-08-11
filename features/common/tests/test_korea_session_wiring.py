"""규칙 경로와 Agent 경로가 **같은** 한국장 수치 정책을 쓴다.

예전에는 같은 파일을 두 구현이 서로 다른 규칙으로 다뤘다. `builder`에는 60분 TTL이
있었고 `agent_mode`는 `ttl_seconds`를 인자로 받아 한 번도 쓰지 않았다. Sites는 Agent
경로를 쓰므로, 개장 한 시간 전에 받은 금요일 종가가 08-10 수치로 영구히 굳었다.
"""
from __future__ import annotations

import pytest

from features.common.market_data import korea_session, session_cache

DENIED = {
    "ok": True,
    "provider": "yfinance",
    "indices": {"KOSPI": {"asOfDate": "2026-08-07", "close": 6258.77}},
}
GOOD = {
    "ok": True,
    "provider": "yfinance",
    "indices": {"KOSPI": {"asOfDate": "2026-08-10", "close": 6299.66, "changePct": 0.65}},
}


@pytest.fixture(autouse=True)
def isolated_cache(tmp_path, monkeypatch):
    monkeypatch.setattr(session_cache, "CACHE_DIR", tmp_path / "market-session-cache")


def _both_paths():
    """두 경로의 진입점. 이름이 달라도 같은 정책을 거쳐야 한다."""
    from features.agent_mode.service import cached_korea_market_data as agent_path
    from features.daily_briefing.builder import cached_korea_market_data as rules_path

    return {"rules": rules_path, "agent": agent_path}


@pytest.mark.parametrize("path_name", ["rules", "agent"])
def test_neither_path_returns_another_sessions_numbers(path_name, monkeypatch):
    monkeypatch.setattr(korea_session, "fetch_korea_market_data", lambda _date: DENIED)

    result = _both_paths()[path_name]("2026-08-10")

    assert result is None, "직전 세션 값을 그 세션 수치로 돌려주지 않는다"


@pytest.mark.parametrize("path_name", ["rules", "agent"])
def test_neither_path_caches_a_mismatched_fetch(path_name, monkeypatch):
    monkeypatch.setattr(korea_session, "fetch_korea_market_data", lambda _date: DENIED)

    _both_paths()[path_name]("2026-08-10")

    assert not session_cache.cache_path("korea-market", "kr", "2026-08-10", "closed").exists()


@pytest.mark.parametrize("path_name", ["rules", "agent"])
def test_both_paths_share_one_cache_entry(path_name, monkeypatch):
    """한쪽이 받아 둔 값을 다른 쪽이 그대로 쓴다. 캐시가 두 벌이면 규칙도 두 벌이 된다."""
    calls = []

    def fetcher(date):
        calls.append(date)
        return GOOD

    monkeypatch.setattr(korea_session, "fetch_korea_market_data", fetcher)
    paths = _both_paths()

    first = paths["rules"]("2026-08-10")
    second = paths["agent"]("2026-08-10")

    assert first == second == GOOD
    assert calls == ["2026-08-10"]


def test_the_session_state_comes_from_the_windows():
    """장중 값과 마감 종가는 다른 캐시 항목이다."""
    assert korea_session.session_state({"krSessionPhase": "intraday"}) == session_cache.INTRADAY
    assert korea_session.session_state({"krSessionPhase": "closed"}) == session_cache.CLOSED
    assert korea_session.session_state({"krSessionPhase": "pre_open"}) == session_cache.CLOSED
    assert korea_session.session_state(None) == session_cache.CLOSED


def test_the_agent_cache_helper_now_honours_its_ttl(tmp_path, monkeypatch):
    """`ttl_seconds`를 받고 쓰지 않던 것이 사고의 절반이었다."""
    from features.agent_mode import service

    calls = []

    def fetcher():
        calls.append(1)
        return {"ok": True, "value": len(calls)}

    path = tmp_path / "market-snapshot.json"
    service._cache_json(path, 1200, fetcher)
    service._cache_json(path, 1200, fetcher)
    assert calls == [1], "신선한 캐시는 다시 받지 않는다"

    # 나이를 지나면 다시 받는다.
    service._cache_json(path, 0, fetcher)
    assert len(calls) == 2


def test_an_undated_cache_entry_is_refetched(tmp_path):
    """나이를 알 수 없으면 신선하다고 볼 근거가 없다."""
    from features.agent_mode import service
    from features.common.utils import write_json

    path = tmp_path / "market-snapshot.json"
    write_json(path, {"snapshot": {"ok": True, "stale": True}})

    calls = []
    result = service._cache_json(path, 1200, lambda: calls.append(1) or {"ok": True, "fresh": True})

    assert calls == [1]
    assert result == {"ok": True, "fresh": True}
