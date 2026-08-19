"""전일 체크포인트 추출과 시장별 체크포인트 갭.

두 가지가 조용히 어긋나 있었다.

- `extract_prev_checklist`의 제목 목록이 `미국장|한국장|시장`뿐이라 유럽·일본 본문에서
  아무것도 뽑지 못했다. `load_prev_briefing()`은 시장 무관 최신 파일을 돌려주므로,
  유럽·일본 파일이 그날 최신이면 **미국장·한국장 생성에서도** 전일 블록이 비었다.
- 체크포인트 갭 판정이 합본 기준이라, 네 시장 중 하나만 섹션이 없으면 그 사실이
  어디에도 남지 않았다. 저장 파일은 시장별인데 갭은 "전부 비었을 때"만 붙었다.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features.daily_briefing.schema import SINGLE_MARKET_SCOPES
from features.daily_briefing.service import (
    MARKET_LABELS,
    extract_prev_checklist,
    load_prev_briefing,
)


def _body(scope):
    return (
        f"# {scope} briefing\n\n"
        "## 5. 앞 섹션\n\n본문\n\n"
        f"## 6. 다음 {MARKET_LABELS[scope]} 체크포인트\n"
        f"- {scope} 확인 조건 하나\n"
        f"- {scope} 확인 조건 둘\n\n"
        "## 참고자료\n\n- 자료\n"
    )


# --- 제목 목록 --------------------------------------------------------------


@pytest.mark.parametrize("scope", SINGLE_MARKET_SCOPES)
def test_every_market_label_is_extractable(scope):
    """손으로 나열한 목록에서는 유럽·일본이 빈 문자열이었다."""
    extracted = extract_prev_checklist(_body(scope))

    assert f"- {scope} 확인 조건 하나" in extracted
    assert f"- {scope} 확인 조건 둘" in extracted
    # 다음 H2 직전까지만 가져온다.
    assert "참고자료" not in extracted


@pytest.mark.parametrize(
    "heading", ["내일 확인할 체크포인트", "다음 시장 체크포인트", "오늘의 투자 체크리스트"]
)
def test_legacy_headings_still_extract(heading):
    """옛 저장물이 판올림만으로 전일 블록을 잃으면 안 된다."""
    markdown = f"## 6. {heading}\n- 옛 확인 조건\n\n## 참고자료\n- 자료\n"

    assert extract_prev_checklist(markdown) == "- 옛 확인 조건"


def test_no_section_returns_empty():
    assert extract_prev_checklist("## 1. 요약\n본문만 있다\n") == ""
    assert extract_prev_checklist(None) == ""


# --- 최신 파일이 일본장이어도 값이 나온다 -----------------------------------


def test_a_japanese_latest_file_still_yields_a_checklist(tmp_path, monkeypatch):
    """전일 파일 선택은 시장 무관 최신이다 — 그 파일이 jp여도 블록이 차야 한다."""
    import json

    from features.daily_briefing import service as briefing_service

    monkeypatch.setattr(briefing_service, "BRIEFINGS_DIR", tmp_path)
    (tmp_path / "2026-06-18.us.json").write_text(
        json.dumps({"markdown": _body("us")}), encoding="utf-8"
    )
    # 사전순 뒤라 `_briefing_report_paths()`(reverse)가 먼저 돌려주는 파일.
    (tmp_path / "2026-06-19.jp.json").write_text(
        json.dumps({"markdown": _body("jp")}), encoding="utf-8"
    )

    prev = load_prev_briefing("2026-06-20")

    assert "jp" in prev["markdown"]
    assert "- jp 확인 조건 하나" in extract_prev_checklist(prev["markdown"])
