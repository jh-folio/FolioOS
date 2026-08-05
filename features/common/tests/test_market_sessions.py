"""Task 2.1 — session descriptors for Europe and Japan.

The gate is that the existing US/KR window keys keep their exact shape: saved
reports and every current consumer read them.
"""
from __future__ import annotations

import datetime as dt

from features.common.exchange_holidays import market_exchange_status
from features.common.market_calendar import briefing_market_windows, market_open_status

LEGACY_WINDOW_KEYS = (
    "briefingDate", "analysisMode", "usRegularSessionDate", "krPreviousSessionDate",
    "krCurrentSessionDate", "krCurrentSessionOpen", "krMarketOpenOnDate",
    "krCurrentSessionActive", "krSessionPhase", "krLatestCompletedSessionDate",
    "usMarketOpenOnDate", "calendarProviders", "primarySessions", "secondarySessions",
    "sessionRoles", "weekendOrHolidayNewsMode", "offSessionNewsWindow", "sourceDates",
    "closedNotes", "sessionPriorityRule", "rule",
)


def test_legacy_window_keys_are_all_still_present():
    windows = briefing_market_windows("2026-08-05")
    for key in LEGACY_WINDOW_KEYS:
        assert key in windows, key


def test_us_and_kr_open_state_is_unchanged():
    for market, date, expected in (
        ("US", "2026-01-01", False), ("US", "2026-08-05", True),
        ("KR", "2026-08-15", False), ("KR", "2026-08-05", True),
    ):
        assert market_open_status(dt.date.fromisoformat(date), market)["isOpen"] is expected


def test_europe_and_japan_are_no_longer_treated_as_permanently_closed():
    """Both resolved to `unsupported_market` before, so every day read as closed."""
    for market in ("EUROPE", "JP"):
        status = market_open_status(dt.date(2026, 8, 5), market)
        assert status["isOpen"] is True
        assert status["provider"] == "static_calendar"


def test_a_uk_only_holiday_does_not_close_the_continent():
    """UK bank holidays shut the LSE while Euronext and Xetra trade.

    A single "Europe closed" flag would be wrong on roughly a dozen days a year.
    """
    status = market_exchange_status("EUROPE", dt.date(2026, 5, 4))
    assert status["isOpen"] is True
    assert status["divergent"] is True
    assert status["closedVenues"] == ["LSE"]
    assert "XETRA" in status["openVenues"]

    session = briefing_market_windows("2026-05-04")["marketSessions"]["europe"]
    assert session["venuesDiverge"] is True
    assert session["closedVenues"] == ["LSE"]


def test_a_spain_only_holiday_diverges_the_other_way():
    """Epiphany closes Madrid while London, Paris and Frankfurt trade."""
    status = market_exchange_status("EUROPE", dt.date(2026, 1, 6))
    assert status["divergent"] is True
    assert status["closedVenues"] == ["BME"]


def test_a_shared_holiday_closes_the_whole_region_without_divergence():
    status = market_exchange_status("EUROPE", dt.date(2026, 12, 25))
    assert status["isOpen"] is False
    assert status["divergent"] is False

    session = briefing_market_windows("2026-12-25")["marketSessions"]["europe"]
    assert session["openOnBriefingDate"] is False
    assert session["sessionDate"] == "2026-12-24"


def test_japanese_holidays_fall_back_to_the_previous_session():
    session = briefing_market_windows("2026-05-05")["marketSessions"]["jp"]
    assert session["openOnBriefingDate"] is False
    assert session["phase"] == "holiday"
    # 5/4~5/6은 연휴다. 직전 거래일인 5/1로 돌아가야 한다.
    assert session["sessionDate"] == "2026-05-01"


def test_europe_always_reports_the_previous_completed_session():
    """London closes after KST midnight, so briefing day D describes D-1.

    This is the same rule the US already follows. Reporting D would name a
    session that has not finished when the morning briefing is written.
    """
    session = briefing_market_windows("2026-08-05")["marketSessions"]["europe"]
    assert session["openOnBriefingDate"] is True
    assert session["sessionDate"] == "2026-08-04"


def test_tokyo_session_date_follows_the_generation_time():
    """JST is KST, so Tokyo's session runs alongside the briefing, not overnight."""
    morning = briefing_market_windows("2026-08-05", as_of="2026-08-05T07:00:00+09:00")
    assert morning["marketSessions"]["jp"]["phase"] == "pre_open"
    assert morning["marketSessions"]["jp"]["sessionDate"] == "2026-08-04"

    midday = briefing_market_windows("2026-08-05", as_of="2026-08-05T13:00:00+09:00")
    assert midday["marketSessions"]["jp"]["phase"] == "intraday"
    assert midday["marketSessions"]["jp"]["sessionDate"] == "2026-08-04"

    evening = briefing_market_windows("2026-08-05", as_of="2026-08-05T18:00:00+09:00")
    assert evening["marketSessions"]["jp"]["phase"] == "closed"
    assert evening["marketSessions"]["jp"]["sessionDate"] == "2026-08-05"


def test_a_year_without_a_table_reports_expiry_instead_of_guessing():
    """Transcribed tables run out. Treating a weekday as open would be a silent lie."""
    status = market_exchange_status("EUROPE", dt.date(2030, 3, 4))
    assert status["coverage"] == "coverage_expired"
    assert status["isOpen"] is False

    resolved = market_open_status(dt.date(2030, 3, 4), "JP")
    assert resolved["provider"] == "coverage_expired"
    assert resolved["source"] == "unavailable"


def test_every_market_reports_a_calendar_provider():
    providers = briefing_market_windows("2026-08-05")["calendarProviders"]
    assert set(providers) == {"US", "KR", "EUROPE", "JP"}
