"""각 FRED 발표일에는 **그 발표가 공표한** 수치가 붙는다."""
from __future__ import annotations

import datetime as dt

import pytest

from features.market_calendar.adapters import fred


@pytest.fixture
def rows():
    return [
        {"_releaseId": 10, "title": "미국 CPI", "startsAt": "2026-06-10T08:30:00"},
        {"_releaseId": 10, "title": "미국 CPI", "startsAt": "2026-07-14T08:30:00"},
        # 오늘 발표. FRED에는 아직 안 들어왔다.
        {"_releaseId": 10, "title": "미국 CPI", "startsAt": "2026-08-12T08:30:00"},
        # 미래 발표.
        {"_releaseId": 10, "title": "미국 CPI", "startsAt": "2026-09-11T08:30:00"},
    ]


@pytest.fixture(autouse=True)
def _today(monkeypatch):
    class FixedDate(dt.date):
        @classmethod
        def today(cls):
            return cls(2026, 8, 12)

    monkeypatch.setattr(fred.dt, "date", FixedDate)


@pytest.fixture(autouse=True)
def _fred(monkeypatch):
    monkeypatch.setattr(fred, "_first_releases", lambda series_id, api_key, start, end, *, timeout: {
        "2026-05-12": {"date": "2026-04-01", "value": "332.407"},
        "2026-06-10": {"date": "2026-05-01", "value": "333.979"},
        "2026-07-14": {"date": "2026-06-01", "value": "332.568"},
    })


def test_each_release_shows_the_month_it_published(rows):
    """**최신 관측치를 지나간 모든 발표일에 붙이면 안 된다.**

    예전 구현은 `sort_order=desc, limit=2`로 최신 두 개를 받아 지난 발표 전부에
    같은 값을 붙였다. 7월 CPI를 발표하는 8월 12일 행에 6월 관측치가 붙었고, 6월 25일
    GDP 행에는 7월 30일에야 공표된 값이 붙었다.
    """
    fred._attach_observations(rows, "KEY", timeout=5)

    assert rows[0]["actualValue"] == "333.979"
    assert rows[0]["observedAt"] == "2026-05-01"
    assert rows[1]["actualValue"] == "332.568"
    assert rows[1]["observedAt"] == "2026-06-01"
    assert rows[0]["actualValue"] != rows[1]["actualValue"]


def test_the_previous_value_is_the_prior_release_not_the_prior_observation(rows):
    fred._attach_observations(rows, "KEY", timeout=5)

    assert rows[1]["previousValue"] == "333.979"   # 6월 10일 발표분
    assert rows[0]["previousValue"] == "332.407"   # 5월 12일 발표분


def test_a_release_that_has_not_reached_fred_stays_empty(rows):
    """발표일이 지났어도 값이 없으면 비워 둔다.

    지난 값을 대신 보여주면 틀린 숫자를 오늘 발표라고 말하는 것이다 — 실측으로
    2026-08-12 CPI가 그랬다.
    """
    fred._attach_observations(rows, "KEY", timeout=5)

    assert "actualValue" not in rows[2]
    assert rows[2].get("status") in (None, "")


def test_future_releases_are_left_alone(rows):
    fred._attach_observations(rows, "KEY", timeout=5)

    assert "actualValue" not in rows[3]


def test_a_series_without_a_headline_mapping_is_skipped():
    rows = [{"_releaseId": 99999, "title": "알 수 없는 릴리즈", "startsAt": "2026-07-14T08:30:00"}]

    fred._attach_observations(rows, "KEY", timeout=5)

    assert "actualValue" not in rows[0]


class TestVintageParsing:
    """열 이름이 공표일을 나른다. 이 해석이 틀리면 모든 값이 엉뚱한 날에 붙는다."""

    @pytest.mark.parametrize("key,expected", [
        ("CPIAUCSL_20260714", ("2026", "07", "14")),
        ("GDPC1_20260625", ("2026", "06", "25")),
        ("BOPGSTB_20251231", ("2025", "12", "31")),
    ])
    def test_vintage_keys_are_recognised(self, key, expected):
        match = fred._VINTAGE_KEY.fullmatch(key)
        assert match and match.groups() == expected

    @pytest.mark.parametrize("key", ["date", "value", "realtime_start", "CPIAUCSL"])
    def test_other_columns_are_not_mistaken_for_vintages(self, key):
        assert fred._VINTAGE_KEY.fullmatch(key) is None


def test_revisions_count_as_releases():
    """GDP는 잠정·수정·확정으로 세 번 발표한다. 초판만 보면 개정 발표가 빈칸이 된다."""
    rows = [
        {"_releaseId": 53, "title": "미국 GDP", "startsAt": "2026-06-25T08:30:00"},
        {"_releaseId": 53, "title": "미국 GDP", "startsAt": "2026-07-30T08:30:00"},
    ]
    published = {
        "2026-05-28": {"date": "2026-01-01", "value": "24152.656"},
        "2026-06-25": {"date": "2026-01-01", "value": "24180.419"},
        "2026-07-30": {"date": "2026-04-01", "value": "24270.599"},
    }
    import features.market_calendar.adapters.fred as module

    original = module._first_releases
    module._first_releases = lambda *a, **k: published
    try:
        module._attach_observations(rows, "KEY", timeout=5)
    finally:
        module._first_releases = original

    assert rows[0]["actualValue"] == "24180.419"
    assert rows[0]["previousValue"] == "24152.656"
    assert rows[1]["actualValue"] == "24270.599"
