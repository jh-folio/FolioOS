import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features.common.market_calendar import briefing_market_windows, publication_date_for_session


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
