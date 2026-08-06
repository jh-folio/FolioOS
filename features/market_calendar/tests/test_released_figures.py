"""발표된 지표는 결과를 함께 실어야 한다.

예정 날짜만 보여주면 발표가 끝난 뒤 캘린더를 다시 열 이유가 없다. 세 provider 모두
값을 줄 수 있는데 우리가 버리고 있었다 — ECOS는 관측값을 받아 마지막 달만 쓰고
나머지를 버렸고, yfinance 집계는 Actual/Expected/Last 컬럼을 통째로 무시했다.
"""
from __future__ import annotations

import pytest

from features.market_calendar.adapters.yf_economic import _reading, normalize_yf_economic_events
from features.market_calendar.schema import normalize_event


class TestMissingReadingsStayEmpty:
    """발표되지 않은 것과 0은 다르다. 결측을 숫자로 바꾸지 않는다."""

    @pytest.mark.parametrize("value", [None, float("nan"), "", "nan", "None"])
    def test_absent_values_are_empty(self, value):
        assert _reading(value) == ""

    @pytest.mark.parametrize("value,expected", [(2.7, "2.7"), (54, "54"), ("-3.47", "-3.47"), (0, "0")])
    def test_real_readings_survive(self, value, expected):
        assert _reading(value) == expected

    def test_zero_is_a_reading_not_a_gap(self):
        assert _reading(0) == "0"
        assert _reading(0) != ""


class TestEventCarriesResults:
    def test_schema_keeps_released_figures(self):
        event = normalize_event({
            "kind": "macro", "title": "미국 CPI", "startsAt": "2026-08-01T08:30:00",
            "status": "actual", "actualValue": 2.7, "previousValue": "2.9",
            "unit": "%", "observedAt": "2026-07",
        })
        assert event["actualValue"] == "2.7"
        assert event["previousValue"] == "2.9"
        assert event["unit"] == "%"
        assert event["observedAt"] == "2026-07"
        assert event["status"] == "actual"

    def test_a_scheduled_event_has_no_figures(self):
        event = normalize_event({"kind": "macro", "title": "예정", "startsAt": "2026-12-01T08:30:00"})
        assert event["actualValue"] == ""
        assert event["previousValue"] == ""

    def test_a_released_aggregation_row_keeps_actual_status(self):
        """집계 provider라도 결과가 실렸으면 이미 발표된 것이다."""
        rows = normalize_yf_economic_events([
            {"title": "US CPI", "startsAt": "2026-08-01T12:30:00", "status": "actual", "actualValue": "2.7"},
        ])
        assert rows[0]["status"] == "actual"

    def test_a_future_aggregation_row_stays_estimated(self):
        rows = normalize_yf_economic_events([
            {"title": "US CPI", "startsAt": "2026-12-01T12:30:00"},
        ])
        assert rows[0]["status"] == "estimated"
        assert rows[0]["actualValue"] == ""


def test_yfinance_events_carry_no_outbound_link():
    """수집 경로일 뿐 사용자가 읽을 원문이 아니다. 클릭하면 제3자 페이지로 나간다."""
    rows = normalize_yf_economic_events([{"title": "US CPI", "startsAt": "2026-08-01T12:30:00"}])
    assert rows[0]["sourceUrl"] == ""


def test_ecos_link_points_at_the_portal_not_the_api():
    from features.market_calendar.adapters.bok import _ECOS_DOC

    assert "/api" not in _ECOS_DOC, "API 엔드포인트를 열면 개발자 문서가 뜬다"
