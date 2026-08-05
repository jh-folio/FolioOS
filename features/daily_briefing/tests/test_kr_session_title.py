import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features.daily_briefing.schema import briefing_market_metadata, briefing_session_mode


def test_legacy_window_without_phase_does_not_claim_intraday():
    """제목의 마감/장중은 읽을 때마다 다시 계산된다.

    phase가 기록되지 않은 window에서 "거래일이니 장중"이라고 답하면, 한국장
    브리핑이 언제 만들어졌든 열 때마다 "장중"으로 되살아난다.
    """
    assert briefing_session_mode("kr", "", {"krCurrentSessionDate": "2020-01-02"}) == "kr_close"


def test_us_side_keeps_its_default():
    assert briefing_session_mode("us", "", {}) == "us_close"


def test_a_past_korean_briefing_reads_as_closed():
    report = {
        "date": "2026-08-04",
        "generatedAt": "2026-08-03T23:02:40+00:00",  # 08-04 08:02 KST — 개장 전
        "marketWindows": {
            "briefingDate": "2026-08-04",
            "analysisMode": "weekday_kr_open",
            "krCurrentSessionDate": "2026-08-04",
            "krPreviousSessionDate": "2026-08-03",
            "krMarketOpenOnDate": True,
        },
    }
    assert briefing_market_metadata(report, "kr")["sessionMode"] == "kr_close"


def test_a_briefing_written_during_the_session_stays_intraday():
    """생성 시각이 장중이면 나중에 읽어도 장중이다. 그때는 사실이었다."""
    report = {
        "date": "2026-08-04",
        "generatedAt": "2026-08-04T02:00:00+00:00",  # 11:00 KST
        "marketWindows": {
            "briefingDate": "2026-08-04",
            "analysisMode": "weekday_kr_open",
            "krCurrentSessionDate": "2026-08-04",
            "krPreviousSessionDate": "2026-08-03",
            "krMarketOpenOnDate": True,
        },
    }
    assert briefing_market_metadata(report, "kr")["sessionMode"] == "kr_intraday"
