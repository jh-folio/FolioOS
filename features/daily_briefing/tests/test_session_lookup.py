"""세션일로 보고서를 찾는다. 저장 키가 넘어가는 동안 두 형식이 섞여 있다.

파일명 모양은 새 키와 옛 키가 **같다**(`YYYY-MM-DD.market.json`). 날짜의 뜻만 다르다.
그래서 이름만 보고 고를 수 없고, 찾은 파일이 정말 그 세션을 다루는지 확인해야 한다.

옛 파일이 어느 날짜에 놓였는지는 언제 만들어졌는지에 달려 있었다:

    미국·유럽   발행일 = 세션 다음 거래일        (publication_date_for_session)
    한국·일본   마감 후 생성이면 세션일 그대로
                개장 전 예약이면 그날 날짜 = 세션+1  ← 07:45 예약이 전일 세션을 다루면서
                                                     그날로 저장돼 하루 앞섰다
"""
from __future__ import annotations

import json

import pytest

from features.daily_briefing import service


@pytest.fixture
def briefings_dir(tmp_path, monkeypatch):
    target = tmp_path / "briefings"
    target.mkdir()
    monkeypatch.setattr(service, "BRIEFINGS_DIR", target)
    return target


def _write(directory, name, payload):
    (directory / name).write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")


def _us_report(session_date, *, market_scope="us"):
    return {
        "date": session_date,
        "marketScope": market_scope,
        "briefingType": "default",
        "generatedAt": f"{session_date}T22:00:00+09:00",
        "markdown": f"# US Market Briefing — {session_date.replace('-', '.')} 마감",
        "sessionDate": session_date,
        "marketWindows": {"briefingDate": session_date, "usRegularSessionDate": session_date},
    }


def _kr_report(session_date, *, phase="closed"):
    return {
        "date": session_date,
        "marketScope": "kr",
        "briefingType": "default",
        "generatedAt": f"{session_date}T16:00:00+09:00",
        "markdown": f"# Korea Market Briefing — {session_date.replace('-', '.')} 마감",
        "sessionDate": session_date,
        "marketWindows": {
            "briefingDate": session_date,
            "krSessionPhase": phase,
            "krCurrentSessionDate": session_date if phase == "closed" else "",
            "krPreviousSessionDate": session_date,
        },
    }


def test_a_session_keyed_file_is_found_directly(briefings_dir):
    _write(briefings_dir, "2026-08-11.kr.json", _kr_report("2026-08-11"))

    report = service.resolve_briefing_by_session("2026-08-11", "kr")

    assert report is not None
    assert service.effective_session_date(report, "kr") == "2026-08-11"


def test_a_legacy_us_file_under_its_publication_date_is_found(briefings_dir):
    """미국 세션 08-07은 발행일 08-10(다음 거래일)에 저장돼 있었다."""
    _write(briefings_dir, "2026-08-10.us.json", _us_report("2026-08-07"))

    report = service.resolve_briefing_by_session("2026-08-07", "us")

    assert report is not None
    assert service.effective_session_date(report, "us") == "2026-08-07"


def test_a_legacy_korean_file_filed_one_day_ahead_is_found(briefings_dir):
    """07:45 예약이 08-10 세션을 다루면서 08-11로 저장한 실제 형태."""
    _write(briefings_dir, "2026-08-11.kr.json", _kr_report("2026-08-10"))

    report = service.resolve_briefing_by_session("2026-08-10", "kr")

    assert report is not None
    assert service.effective_session_date(report, "kr") == "2026-08-10"


def test_a_file_whose_session_differs_is_not_returned(briefings_dir):
    """이름이 맞아도 내용이 다른 세션이면 아니다.

    확인 없이 첫 후보를 받으면 옛 발행일 파일이 다른 세션의 브리핑으로 잘못 잡힌다.
    """
    _write(briefings_dir, "2026-08-11.us.json", _us_report("2026-08-10"))

    assert service.resolve_briefing_by_session("2026-08-11", "us") is None


def test_the_session_keyed_file_wins_when_both_exist(briefings_dir):
    """이관 중에는 같은 세션이 두 이름으로 있을 수 있다. 새 키가 이긴다."""
    _write(briefings_dir, "2026-08-07.us.json", _us_report("2026-08-07"))
    legacy = _us_report("2026-08-07")
    legacy["markdown"] = "# 옛 파일"
    _write(briefings_dir, "2026-08-10.us.json", legacy)

    report = service.resolve_briefing_by_session("2026-08-07", "us")

    assert report["markdown"].startswith("# US Market Briefing")


def test_a_missing_session_returns_nothing(briefings_dir):
    assert service.resolve_briefing_by_session("2026-08-11", "kr") is None


def test_an_aggregate_scope_is_not_a_session_lookup(briefings_dir):
    """세션은 시장별 개념이다. 종합에는 세션일이 하나로 정해지지 않는다."""
    assert service.resolve_briefing_by_session("2026-08-11", "both") is None


def test_an_unreadable_report_yields_no_session():
    assert service.effective_session_date(None, "kr") == ""
    assert service.effective_session_date({}, "kr") == ""
