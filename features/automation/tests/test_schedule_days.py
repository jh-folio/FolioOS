"""예약이 도는 요일."""
import datetime as dt

import pytest

from features.automation.schema import WEEKDAYS, default_schedule, default_settings, normalize_schedule
from features.automation.service import schedule_due

SETTINGS = default_settings()


def at(month_day: int, hour: int = 8, minute: int = 2) -> dt.datetime:
    """2026-08-10이 월요일이다. +0..6이 월~일."""
    return dt.datetime(2026, 8, month_day, hour, minute).astimezone()


def test_a_new_schedule_skips_the_weekend():
    """예전에는 요일을 보지 않아 08:00 예약이 토·일에도 돌았고, 장이 열리지 않은 날
    금요일 자료로 만든 브리핑이 매주 두 건씩 쌓였다."""
    row = default_schedule(id="s", enabled=True, time="08:00")

    assert row["days"] == [0, 1, 2, 3, 4]
    assert [schedule_due(row, settings=SETTINGS, now=at(10 + d), runs=[]) for d in range(7)] == [
        True, True, True, True, True, False, False,
    ]


def test_a_schedule_saved_before_this_setting_still_runs_every_day():
    """판올림만으로 토·일 브리핑이 사라지는 것도 사용자가 정한 적 없는 변화다.
    화면에 요일 칩이 보이므로 한 번 눌러 정하면 된다."""
    row = normalize_schedule({"id": "old", "enabled": True, "time": "08:00"})

    assert row["days"] == list(WEEKDAYS)
    assert schedule_due(row, settings=SETTINGS, now=at(15), runs=[]) is True, "토요일"


def test_a_weekend_only_schedule_is_allowed():
    """주간 요약과 다음주 프리뷰는 토·일에 내는 것이 맞다. 거래일 판정으로 대신했다면
    이 예약을 만들 길이 막힌다."""
    row = normalize_schedule({"id": "wk", "enabled": True, "time": "09:00", "days": [5, 6]})

    assert row["days"] == [5, 6]
    assert schedule_due(row, settings=SETTINGS, now=at(14, hour=9), runs=[]) is False, "금요일"
    assert schedule_due(row, settings=SETTINGS, now=at(15, hour=9), runs=[]) is True, "토요일"
    assert schedule_due(row, settings=SETTINGS, now=at(16, hour=9), runs=[]) is True, "일요일"


@pytest.mark.parametrize("value", [[], [9, "x"], "mon", None, {}])
def test_an_unusable_choice_falls_back_to_every_day(value):
    """하나도 안 고른 예약은 저장은 되는데 영영 돌지 않는 상태가 된다."""
    assert normalize_schedule({"id": "t", "days": value})["days"] == list(WEEKDAYS)


def test_the_day_list_is_deduped_and_ordered():
    assert normalize_schedule({"id": "t", "days": [2, 0, 4, 0]})["days"] == [0, 2, 4]


def test_the_day_gate_comes_before_the_catch_up_window():
    """따라잡기 창이 요일을 넘기지 않는다 — 금요일 예약이 토요일 아침에 실행되면 안 된다."""
    row = normalize_schedule({"id": "s", "enabled": True, "time": "23:00", "days": [4]})
    settings = {**SETTINGS, "missedRuns": {"catchUpHours": 24}}

    assert schedule_due(row, settings=settings, now=at(15, hour=2), runs=[]) is False


def test_each_schedule_decides_its_own_prerequisites():
    """예약이 여럿일 때 매번 모으면 같은 자료를 하루에 여러 번 수집한다.

    화면에서 이 토글이 사라진 동안(0.5.2) 값은 살아 있었지만 모든 예약이 무조건
    수집했다. 사용자가 RSS 자동 수집을 끄고 브리핑 직전에만 모으는 구성을 쓰면 이
    항목이 유일한 수집 경로다.
    """
    on = normalize_schedule({"id": "a", "runPrerequisites": True})
    off = normalize_schedule({"id": "b", "runPrerequisites": False})
    missing = normalize_schedule({"id": "c"})

    assert on["runPrerequisites"] is True
    assert off["runPrerequisites"] is False
    # 예전 예약에는 이 값이 늘 있었고, 없으면 모으는 쪽이 안전하다.
    assert missing["runPrerequisites"] is True


def test_the_screen_lets_each_schedule_choose():
    """백엔드만 살아 있고 화면에 컨트롤이 없으면 사용자가 정할 수 없다."""
    from pathlib import Path

    source = Path(__file__).resolve().parents[3].joinpath(
        "web", "src", "app", "SettingsRoute.tsx"
    ).read_text(encoding="utf-8")

    assert "patch(row.id, { runPrerequisites: checked })" in source
    assert "브리핑 전에 RSS 수집과 시장 메모리 갱신" in source
