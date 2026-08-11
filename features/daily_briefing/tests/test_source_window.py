"""자료 창은 세션과 세션 사이다.

지금 창은 발행일 하나에 걸려 있고 미국·한국 세션이 union으로 섞인다. 앵커를 세션일로
옮기면 그 union이 깨지므로, 창을 시장별로 다시 정의한다 — 직전 세션이 끝난 뒤부터
이 세션이 끝날 때까지.

이 정의는 주말·휴장을 특별 취급하지 않는다. 금요일 마감과 월요일 마감 사이에 토·일이
들어 있으므로 주말 뉴스가 월요일 세션 브리핑에 자연히 들어간다.
"""
from __future__ import annotations

import pytest

from features.daily_briefing.source_window import kst_close_date, target_source_dates


# --- 세션이 KST 달력으로 언제 끝나는가 ----------------------------------


def test_same_day_markets_close_on_their_session_date():
    """서울·도쿄는 15:30에 끝난다. 그 세션 기사는 같은 날짜다."""
    assert kst_close_date("kr", "2026-08-10").isoformat() == "2026-08-10"
    assert kst_close_date("jp", "2026-08-10").isoformat() == "2026-08-10"


def test_overnight_markets_close_on_the_next_calendar_day():
    """뉴욕 16:00은 KST로 다음 날 새벽이다. 그 세션 기사는 다음 날짜까지 걸친다."""
    assert kst_close_date("us", "2026-08-10").isoformat() == "2026-08-11"
    assert kst_close_date("europe", "2026-08-10").isoformat() == "2026-08-11"


def test_this_is_not_the_publication_date_rule():
    """`publication_date_for_session()`은 **다음 거래일**이라 금요일 미국장이 월요일이
    된다. 여기서는 마감이 실제로 걸치는 달력 날짜라 토요일이다."""
    from features.common.market_calendar import publication_date_for_session

    assert kst_close_date("us", "2026-08-07").isoformat() == "2026-08-08"
    assert publication_date_for_session("2026-08-07", ["us"]) == "2026-08-10"


# --- 창 ------------------------------------------------------------------


def test_a_midweek_korean_session_reads_two_days():
    """화요일 세션은 월요일 마감 뒤부터 화요일 마감까지."""
    assert target_source_dates("kr", "2026-08-11", "closed") == ["2026-08-10", "2026-08-11"]


def test_a_monday_korean_session_swallows_the_weekend():
    """금요일 마감과 월요일 마감 사이에는 토·일이 들어 있다.

    주말 뉴스를 위한 별도 분기가 필요 없다. 예전에는 `analysis_mode`가 `weekend`인지
    보고 off-session 구간을 따로 계산했는데, 그 분기는 앵커를 세션일로 옮기면 성립하지
    않는다.
    """
    assert target_source_dates("kr", "2026-08-10", "closed") == [
        "2026-08-07", "2026-08-08", "2026-08-09", "2026-08-10",
    ]


def test_a_us_session_window_is_shifted_by_one_day():
    """미국 세션 S의 기사는 S와 S+1(KST)에 걸쳐 나온다."""
    assert target_source_dates("us", "2026-08-11", "closed") == ["2026-08-11", "2026-08-12"]


def test_a_us_monday_session_also_swallows_the_weekend():
    assert target_source_dates("us", "2026-08-10", "closed") == [
        "2026-08-08", "2026-08-09", "2026-08-10", "2026-08-11",
    ]


def test_an_intraday_window_runs_to_today_because_the_session_is_not_over():
    """장중 브리핑은 지금까지 나온 이야기를 다룬다."""
    assert target_source_dates("kr", "2026-08-12", "intraday", today="2026-08-12") == [
        "2026-08-11", "2026-08-12",
    ]


def test_a_japanese_holiday_widens_the_next_session_window():
    """2026-08-11은 산의 날이라 도쿄가 쉰다. 08-12 세션은 08-10 마감 뒤부터다."""
    assert target_source_dates("jp", "2026-08-12", "closed") == [
        "2026-08-10", "2026-08-11", "2026-08-12",
    ]


@pytest.mark.parametrize("market", ["us", "kr", "europe", "jp"])
def test_a_window_is_never_empty_and_is_ordered(market):
    dates = target_source_dates(market, "2026-08-11", "closed")

    assert dates == sorted(dates)
    assert dates
