"""`(market, sessionDate, state)`가 브리핑의 1차 키라는 계약.

지금까지는 발행일이 먼저 정해지고 제목·자료 창·수치·파일명이 각자 세션을 되짚었다.
그래서 넷이 서로 다른 날짜를 가리켰다 — 실측으로 같은 KR 세션(08-10)이 파일 두 개로
저장됐고, 한쪽 본문은 08-07 종가를 08-10 수치로 서술했다.

이 파일은 판정이 먼저 오고 나머지가 거기서 파생된다는 것만 검사한다. 저장 키 전환은
Phase 5, 자료 창 통합은 Phase 4다.
"""
from __future__ import annotations

import datetime as dt

import pytest

from features.daily_briefing.target import (
    CLOSED,
    INTRADAY,
    BriefingTarget,
    briefing_title,
    resolve_targets,
)

KST = dt.timezone(dt.timedelta(hours=9))


def _at(year, month, day, hour, minute=0):
    return dt.datetime(year, month, day, hour, minute, tzinfo=KST)


def _by_market(targets):
    return {t.market: t for t in targets}


# --- 생성 시각 기반 판정 -------------------------------------------------


def test_one_instant_resolves_two_markets_to_different_sessions():
    """08-12(수) 20:00 KST.

    한국장은 15:30에 이미 마감했고, 그 시각 뉴욕은 08-12 07:00이라 아직 개장 전이다.
    그래서 같은 순간이 한국장 08-12 마감과 미국장 08-11 마감을 가리킨다.
    """
    targets, errors = resolve_targets(["us", "kr"], now=_at(2026, 8, 12, 20))

    assert errors == []
    rows = _by_market(targets)
    assert (rows["kr"].session_date, rows["kr"].state) == ("2026-08-12", CLOSED)
    assert (rows["us"].session_date, rows["us"].state) == ("2026-08-11", CLOSED)


def test_a_pre_open_request_lands_on_the_last_completed_session():
    """개장 전에는 그 시장의 직전 완료 세션이다(2026-08-11 결정: session-only).

    07:47 예약이 만드는 것은 전일 세션 요약이며 그것이 의도된 동작이다. 열리지도 않은
    거래일을 세션일로 빌려 쓰지 않는다.
    """
    targets, _ = resolve_targets(["kr"], now=_at(2026, 8, 12, 7, 47))

    assert (targets[0].session_date, targets[0].state) == ("2026-08-11", CLOSED)


def test_a_mid_session_request_is_intraday_on_that_days_session():
    targets, _ = resolve_targets(["kr"], now=_at(2026, 8, 12, 11, 15))

    assert (targets[0].session_date, targets[0].state) == ("2026-08-12", INTRADAY)


def test_there_is_no_pre_open_state():
    """상태는 둘뿐이다. 셋째가 생기면 저장 키와 제목 계약이 함께 깨진다."""
    for hour in (7, 10, 16, 23):
        targets, _ = resolve_targets(["kr", "jp", "us", "europe"], now=_at(2026, 8, 12, hour))
        assert {t.state for t in targets} <= {CLOSED, INTRADAY}


def test_europe_follows_the_us_rule_and_japan_follows_the_korean_one():
    """유럽은 한국시간 자정 이후 마감이라 항상 직전 세션, 일본은 한국과 나란히 흐른다."""
    targets = _by_market(resolve_targets(["europe", "jp"], now=_at(2026, 8, 12, 11, 15))[0])

    assert targets["europe"].state == CLOSED
    assert targets["jp"].session_date == "2026-08-12"


# --- 명시 세션일 ---------------------------------------------------------


def test_an_explicit_date_is_read_as_that_markets_session_not_a_publication_date():
    """변환하지 않는다. 08-07을 고르면 두 시장 모두 08-07 장이다.

    예전에는 미국장 기준으로 발행일 08-10을 만들고 한국장이 그것을 자기 세션일로 읽어,
    고르지 않은 08-10 장 브리핑이 경고 없이 나왔다.
    """
    targets, errors = resolve_targets(["us", "kr"], session_date="2026-08-07", now=_at(2026, 8, 12, 20))

    assert errors == []
    assert {t.session_date for t in targets} == {"2026-08-07"}
    assert {t.state for t in targets} == {CLOSED}


def test_a_future_session_is_refused_instead_of_being_filled_in():
    """지난 사고의 직접 원인. 08-10 08:02에 08-10 한국장을 요청하자 코드가 금요일
    종가로 메우고 그것을 영구 캐시했다."""
    targets, errors = resolve_targets(["kr"], session_date="2026-08-12", now=_at(2026, 8, 12, 8, 2))

    assert targets == []
    assert [e.reason for e in errors] == ["session_not_available"]
    assert "2026-08-11" in str(errors[0])


def test_a_non_trading_day_is_refused():
    """2026-08-08은 토요일이다."""
    targets, errors = resolve_targets(["kr"], session_date="2026-08-08", now=_at(2026, 8, 12, 20))

    assert targets == []
    assert [e.reason for e in errors] == ["not_a_session"]


def test_an_unreadable_date_is_refused_rather_than_defaulted():
    _targets, errors = resolve_targets(["kr"], session_date="not-a-date", now=_at(2026, 8, 12, 20))

    assert [e.reason for e in errors] == ["invalid_date"]


def test_one_refused_market_does_not_block_the_others():
    """미국장은 08-08(토)에 열리지 않지만 그것이 다른 시장 브리핑을 막을 이유는 없다."""
    targets, errors = resolve_targets(["us", "kr"], session_date="2026-08-11", now=_at(2026, 8, 12, 20))

    assert {t.market for t in targets} == {"us", "kr"}
    assert errors == []


# --- 식별자와 제목 -------------------------------------------------------


def test_the_artifact_id_is_the_session_not_the_run_date():
    target = BriefingTarget("kr", "2026-08-10", CLOSED, "2026-08-11T07:47:00+09:00", "static")

    assert target.artifact_id == "2026-08-10.kr"


def test_the_title_comes_from_the_target_alone():
    """제목은 코드가 만든다. LLM이 시장·날짜·상태를 다시 정하지 못한다."""
    closed = BriefingTarget("kr", "2026-08-11", CLOSED, "", "static")
    intraday = BriefingTarget("kr", "2026-08-12", INTRADAY, "", "static")

    assert briefing_title(closed) == "Korea Market Briefing — 2026.08.11 마감"
    assert briefing_title(intraday) == "Korea Market Briefing — 2026.08.12 장중"
    assert briefing_title(BriefingTarget("us", "2026-08-11", CLOSED, "", "static")) == (
        "US Market Briefing — 2026.08.11 마감"
    )


def test_resolution_is_stable_for_the_same_instant():
    """같은 요청은 모든 실행 경로에서 같은 target을 만든다."""
    first, _ = resolve_targets(["us", "kr", "europe", "jp"], now=_at(2026, 8, 12, 20))
    second, _ = resolve_targets(["us", "kr", "europe", "jp"], now=_at(2026, 8, 12, 20))

    assert [t.to_dict() for t in first] == [t.to_dict() for t in second]


def test_unknown_market_names_are_dropped_not_guessed():
    targets, errors = resolve_targets(["us", "mars", ""], now=_at(2026, 8, 12, 20))

    assert [t.market for t in targets] == ["us"]
    assert errors == []


@pytest.mark.parametrize("state", [CLOSED, INTRADAY])
def test_a_target_is_immutable(state):
    target = BriefingTarget("kr", "2026-08-12", state, "", "static")

    with pytest.raises(Exception):
        target.session_date = "2026-08-13"  # type: ignore[misc]
