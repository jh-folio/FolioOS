import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features.common.market_calendar import (
    briefing_market_windows,
    publication_date_for_session,
    publication_date_groups,
)


def test_us_session_publishes_on_the_next_trading_day():
    """미국장은 마감 후 다음 날 발행된다. 8/3(월) 세션 -> 8/4(화) 발행."""
    assert publication_date_for_session("2026-08-03", "us") == "2026-08-04"


def test_us_session_on_friday_publishes_on_monday():
    """주말을 건너뛴다. 7/31(금) 세션 -> 8/3(월) 발행."""
    assert publication_date_for_session("2026-07-31", "us") == "2026-08-03"


def test_kr_session_publishes_on_the_same_day():
    """한국장은 당일 장을 다루므로 세션일이 곧 발행일이다."""
    assert publication_date_for_session("2026-08-03", "kr") == "2026-08-03"


def test_both_scope_anchors_on_the_us_session():
    """종합은 미국장 세션 기준이며 한국장은 그 다음 세션이 함께 담긴다."""
    assert publication_date_for_session("2026-08-03", "both") == "2026-08-04"


def test_round_trip_lands_on_the_requested_session():
    """변환한 발행일로 window를 만들면 사용자가 고른 세션이 나와야 한다."""
    for session in ("2026-08-03", "2026-07-31"):
        publication = publication_date_for_session(session, "us")
        assert briefing_market_windows(publication)["usRegularSessionDate"] == session

    for session in ("2026-08-03", "2026-08-04"):
        publication = publication_date_for_session(session, "kr")
        assert briefing_market_windows(publication)["krCurrentSessionDate"] == session


def test_invalid_input_is_returned_unchanged():
    """빈 값·형식 오류는 호출부가 기존대로 처리하도록 그대로 돌려준다."""
    assert publication_date_for_session("", "us") == ""
    assert publication_date_for_session("not-a-date", "us") == "not-a-date"


def test_a_single_market_selection_makes_one_group():
    assert publication_date_groups("2026-08-07", ["us"]) == [("2026-08-10", ["us"])]
    assert publication_date_groups("2026-08-07", ["kr"]) == [("2026-08-07", ["kr"])]


def test_mixing_overnight_and_same_day_markets_splits_the_run():
    """발행일 하나로 두 시장을 다 만족시킬 수 없다.

    예전에는 밤샘 마감 시장 기준 하나로 합쳤다. 그러면 나머지 시장은 그 발행일을
    자기 세션일로 읽어서, 금요일(08-07)을 고르고 미국장·한국장을 함께 만들면 한국장은
    월요일(08-10) 장을 다뤘다 — 고르지 않은 날의 브리핑이 경고 없이 나왔다.
    """
    assert publication_date_groups("2026-08-07", ["us", "kr"]) == [
        ("2026-08-07", ["kr"]),
        ("2026-08-10", ["us"]),
    ]


def test_four_markets_still_make_at_most_two_groups():
    """유럽은 미국과, 일본은 한국과 같은 시간대 규칙을 쓴다."""
    assert publication_date_groups("2026-08-07", ["us", "kr", "europe", "jp"]) == [
        ("2026-08-07", ["kr", "jp"]),
        ("2026-08-10", ["us", "europe"]),
    ]


def test_each_group_lands_on_the_requested_session():
    """나눈 결과가 실제로 사용자가 고른 세션을 가리키는지 창으로 되짚는다."""
    session = "2026-08-07"
    windows = {
        date: briefing_market_windows(date)
        for date, _markets in publication_date_groups(session, ["us", "kr"])
    }
    us_date = next(d for d, m in publication_date_groups(session, ["us", "kr"]) if "us" in m)
    kr_date = next(d for d, m in publication_date_groups(session, ["us", "kr"]) if "kr" in m)

    assert windows[us_date]["usRegularSessionDate"] == session
    assert windows[kr_date]["krCurrentSessionDate"] == session
