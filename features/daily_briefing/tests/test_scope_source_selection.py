"""시장별 브리핑은 자기 세션 창의 기사만 읽는다.

예전에는 한 번 고른 문서 풀을 모든 시장이 공유했다. 창이 발행일 하나에서 나왔고 그
`sourceDates`에 미국·한국 세션이 union으로 섞여 있었기 때문이다. 그래서 한국장 브리핑이
미국 세션 기사를, 미국장 브리핑이 한국 세션 기사를 같은 풀에서 봤다.
"""
from __future__ import annotations

from features.daily_briefing.source_window import (
    scope_session_documents,
    scope_session_state,
)

WINDOWS_KR_CLOSED = {
    "krSessionPhase": "closed",
    "marketSessions": {"jp": {"phase": "closed"}, "us": {}, "europe": {}},
}
WINDOWS_KR_INTRADAY = {
    "krSessionPhase": "intraday",
    "marketSessions": {"jp": {"phase": "intraday"}, "us": {}, "europe": {}},
}


def _docs(*dates):
    return [{"date": date, "title": f"news {date}", "path": f"/{date}"} for date in dates]


def test_each_market_reads_its_own_window():
    """같은 문서 풀에서 시장마다 다른 날짜를 가져간다.

    한국 08-11 세션은 08-10~08-11, 미국 08-11 세션은 08-11~08-12(마감이 KST 다음 날
    새벽이라 하루 밀린다).
    """
    documents = _docs("2026-08-09", "2026-08-10", "2026-08-11", "2026-08-12")

    kr = scope_session_documents(documents, "kr", WINDOWS_KR_CLOSED, session_date="2026-08-11")
    us = scope_session_documents(documents, "us", WINDOWS_KR_CLOSED, session_date="2026-08-11")

    assert [row["date"] for row in kr] == ["2026-08-10", "2026-08-11"]
    assert [row["date"] for row in us] == ["2026-08-11", "2026-08-12"]


def test_a_monday_session_picks_up_the_weekend():
    """금요일 마감과 월요일 마감 사이의 기사가 월요일 세션 브리핑에 들어간다.

    예전 평일 앵커에서는 `weekend_or_holiday_news`가 False라 토·일이 `sourceDates`에
    아예 없었다 — 주말 뉴스가 어느 브리핑에도 들어가지 않았다.
    """
    documents = _docs("2026-08-07", "2026-08-08", "2026-08-09", "2026-08-10")

    rows = scope_session_documents(documents, "kr", WINDOWS_KR_CLOSED, session_date="2026-08-10")

    assert [row["date"] for row in rows] == [
        "2026-08-07", "2026-08-08", "2026-08-09", "2026-08-10",
    ]


def test_an_intraday_window_runs_to_today():
    documents = _docs("2026-08-11", "2026-08-12")

    rows = scope_session_documents(
        documents, "kr", WINDOWS_KR_INTRADAY, today="2026-08-12", session_date="2026-08-12",
    )

    assert [row["date"] for row in rows] == ["2026-08-11", "2026-08-12"]


def test_an_empty_window_returns_nothing_so_the_caller_can_fall_back():
    """빈 목록을 돌려주고 되돌아갈지는 호출부가 정한다.

    여기서 조용히 다른 날짜를 채우면 그게 지난 사고의 형태다 — 없는 것을 메우는 것.
    """
    documents = _docs("2026-01-02")

    rows = scope_session_documents(documents, "kr", WINDOWS_KR_CLOSED, session_date="2026-08-11")

    assert rows == []


def test_a_missing_session_date_selects_nothing():
    documents = _docs("2026-08-11")

    assert scope_session_documents(documents, "kr", WINDOWS_KR_CLOSED, session_date="") == []


def test_state_comes_from_the_windows_per_market():
    assert scope_session_state("kr", WINDOWS_KR_INTRADAY) == "intraday"
    assert scope_session_state("jp", WINDOWS_KR_INTRADAY) == "intraday"
    # 미국·유럽은 phase가 없다 — 브리핑 시점에는 언제나 직전 완료 세션이다.
    assert scope_session_state("us", WINDOWS_KR_INTRADAY) == "closed"
    assert scope_session_state("europe", WINDOWS_KR_INTRADAY) == "closed"


def test_both_generation_paths_keep_a_fallback_when_the_window_is_empty():
    """창을 좁히는 변경이 예전에는 만들어지던 브리핑을 지우면 안 된다.

    두 경로가 각자 `scope_session_documents(...) or docs` 형태로 되돌아가야 한다. 한쪽만
    고치면 그쪽 브리핑만 조용히 자료 없이 나간다 — 규칙 생성과 Agent 생성이 갈렸던 사고가
    이미 여러 번 있었다(세션 창 미전달, 한국 수치 캐시 TTL).
    """
    import inspect

    from features.agent_mode import service as agent_service
    from features.daily_briefing import builder

    for module in (builder, agent_service):
        source = inspect.getsource(module)
        assert "scope_session_documents(" in source, module.__name__
        assert " or docs" in source, f"{module.__name__}: 빈 창에서 되돌아가는 경로가 없다"
