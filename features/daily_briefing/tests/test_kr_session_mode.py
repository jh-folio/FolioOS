import datetime as dt
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features.daily_briefing.issue_selection import session_modes_from_windows

KST = dt.timezone(dt.timedelta(hours=9))


def _windows(session_date, mode="weekday_kr_open"):
    return {"analysisMode": mode, "krCurrentSessionDate": session_date}


def test_past_session_is_closed_not_intraday(monkeypatch):
    """지난 날짜로 생성한 브리핑이 "장중"이라고 말하면 안 된다.

    analysisMode는 그날이 거래일인지만 본다. 그것만 믿으면 어제 세션도 진행
    중으로 나온다 — 8/5에 8/4 한국장을 만들면 제목이 "장중"이 됐다.
    """
    real = dt.datetime

    class Frozen(real):
        @classmethod
        def now(cls, tz=None):
            fixed = real(2026, 8, 5, 10, 0, tzinfo=KST)
            return fixed.astimezone(tz) if tz else fixed

    monkeypatch.setattr(dt, "datetime", Frozen)
    assert session_modes_from_windows(_windows("2026-08-04"))["kr"] == "kr_close"


def test_today_during_market_hours_is_intraday(monkeypatch):
    real = dt.datetime

    class Frozen(real):
        @classmethod
        def now(cls, tz=None):
            fixed = real(2026, 8, 5, 10, 0, tzinfo=KST)
            return fixed.astimezone(tz) if tz else fixed

    monkeypatch.setattr(dt, "datetime", Frozen)
    assert session_modes_from_windows(_windows("2026-08-05"))["kr"] == "kr_intraday"


def test_today_after_the_close_is_closed(monkeypatch):
    real = dt.datetime

    class Frozen(real):
        @classmethod
        def now(cls, tz=None):
            fixed = real(2026, 8, 5, 16, 0, tzinfo=KST)
            return fixed.astimezone(tz) if tz else fixed

    monkeypatch.setattr(dt, "datetime", Frozen)
    assert session_modes_from_windows(_windows("2026-08-05"))["kr"] == "kr_close"


def test_before_the_open_is_not_intraday(monkeypatch):
    real = dt.datetime

    class Frozen(real):
        @classmethod
        def now(cls, tz=None):
            fixed = real(2026, 8, 5, 8, 0, tzinfo=KST)
            return fixed.astimezone(tz) if tz else fixed

    monkeypatch.setattr(dt, "datetime", Frozen)
    assert session_modes_from_windows(_windows("2026-08-05"))["kr"] == "kr_close"


def test_us_side_and_holiday_modes_are_unchanged():
    """미국장은 항상 직전 정규장 복기라 이 변경의 영향을 받지 않는다."""
    assert session_modes_from_windows(_windows("2026-08-05"))["us"] == "us_close"
    assert session_modes_from_windows({"analysisMode": "kr_holiday"})["kr"] == "kr_holiday"
    assert session_modes_from_windows({"analysisMode": "weekend"})["kr"] == "kr_off_session"
