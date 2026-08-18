"""휴장일 표와 세션일 폴백의 회귀 테스트.

세 가지가 조용히 어긋나 있었다. 어느 쪽도 예외를 내지 않아 잘못된 세션일이 박힌
브리핑이 그대로 저장·발행된다.
"""
from __future__ import annotations

import datetime as dt

from features.common.market_calendar import (
    briefing_market_windows,
    kr_market_holidays,
    market_open_status,
    next_trading_day,
    previous_trading_day,
    publication_date_for_session,
    us_market_holidays,
)


# --- 한국 대체공휴일 -------------------------------------------------------
# KRX 연간 휴장일 안내(https://open.krx.co.kr) 기준.
KRX_SUBSTITUTE_HOLIDAYS = (
    ("2026-09-28", "추석 대체휴일 — 추석 연휴가 토·일에 걸침"),
    ("2026-10-05", "개천절(10-03 토) 대체휴일"),
    ("2027-08-16", "광복절(08-15 일) 대체휴일"),
    ("2027-10-04", "개천절(10-03 일) 대체휴일"),
    ("2027-10-11", "한글날(10-09 토) 대체휴일"),
    ("2027-12-27", "성탄절(12-25 토) 대체휴일"),
)


def test_krx_substitute_holidays_are_closed():
    for text, reason in KRX_SUBSTITUTE_HOLIDAYS:
        day = dt.date.fromisoformat(text)
        assert day in kr_market_holidays(day.year), reason
        assert market_open_status(day, "KR")["isOpen"] is False, reason


def test_a_substitute_holiday_is_not_described_as_a_closing_session():
    """열리지 않은 장을 '당일 정규장 마감 결과'로 서술하면 안 된다."""
    windows = briefing_market_windows("2026-10-05", as_of="2026-10-05T18:00:00+09:00")
    assert windows["krMarketOpenOnDate"] is False
    assert windows["krSessionPhase"] == "holiday"
    assert windows["krCurrentSessionDate"] == ""
    assert windows["analysisMode"] == "kr_holiday"
    # 직전 한국 거래일은 10-02(금)이다. 10-03 토, 10-04 일, 10-05 대체휴일.
    assert windows["krPreviousSessionDate"] == "2026-10-02"


def test_regular_korean_trading_days_stay_open():
    """대체휴일을 넣다가 정상 거래일을 닫아버리지 않았는지 확인한다."""
    for text in ("2026-10-06", "2026-09-29", "2027-08-17", "2027-12-28"):
        assert market_open_status(dt.date.fromisoformat(text), "KR")["isOpen"] is True, text


# --- 미국 관측일(observed) 보정 -------------------------------------------
def test_christmas_observes_in_both_directions():
    """NYSE는 성탄절이 토요일이면 직전 금요일, 일요일이면 다음 월요일에 휴장한다."""
    assert dt.date(2027, 12, 24) in us_market_holidays(2027)  # 12-25 토
    assert market_open_status(dt.date(2027, 12, 24), "US")["isOpen"] is False
    assert dt.date(2033, 12, 26) in us_market_holidays(2033)  # 12-25 일
    assert market_open_status(dt.date(2033, 12, 26), "US")["isOpen"] is False


def test_new_year_only_observes_forward():
    """신정만은 토요일 보정이 없다 — NYSE는 전년 12/31에 휴장하지 않는다.

    2021-12-31은 실제로 정규 거래일이었다(2022-01-01이 토요일).
    """
    assert dt.date(2021, 12, 31) not in us_market_holidays(2021)
    assert market_open_status(dt.date(2021, 12, 31), "US")["isOpen"] is True
    assert dt.date(2023, 1, 2) in us_market_holidays(2023)  # 01-01 일 → 월 휴장
    assert market_open_status(dt.date(2023, 1, 2), "US")["isOpen"] is False


def test_a_christmas_substitute_does_not_shift_the_us_session_date():
    """12-24가 휴장이면 12-27 브리핑의 미국 세션일은 12-23이다."""
    assert briefing_market_windows("2027-12-27")["usRegularSessionDate"] == "2027-12-23"


# --- 표 없는 연도(coverage_expired)의 세션일 ------------------------------
def test_an_expired_table_never_names_a_weekend_session():
    """모른다를 어제로 바꾸지 않는다. 주말은 표 없이도 아는 사실이다."""
    sessions = briefing_market_windows("2027-03-08")["marketSessions"]
    for scope in ("europe", "jp"):
        session_date = dt.date.fromisoformat(sessions[scope]["sessionDate"])
        assert session_date.weekday() < 5, f"{scope}: {session_date} 는 주말이다"
        assert sessions[scope]["provider"] == "coverage_expired"


def test_expired_coverage_still_reports_the_expiry():
    """세션일을 채운다고 개장 판정이 되살아나면 안 된다."""
    sessions = briefing_market_windows("2027-03-08")["marketSessions"]
    for scope in ("europe", "jp"):
        assert sessions[scope]["openOnBriefingDate"] is False
        assert sessions[scope]["coverage"] == "coverage_expired"


def test_trading_day_fallbacks_skip_weekends():
    # 2027-03-08은 월요일. 표가 없으면 직전 평일인 03-05(금)로 물러난다.
    assert previous_trading_day(dt.date(2027, 3, 8), "EUROPE") == dt.date(2027, 3, 5)
    # 2027-03-12는 금요일. 다음 평일은 03-15(월)이다.
    assert next_trading_day(dt.date(2027, 3, 12), "EUROPE") == dt.date(2027, 3, 15)


def test_publication_date_for_an_expired_year_is_not_a_weekend():
    published = publication_date_for_session("2027-05-14", ["europe"])  # 금요일 세션
    assert dt.date.fromisoformat(published).weekday() < 5
