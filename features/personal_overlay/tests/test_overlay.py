"""Personal Overlay 스키마·생성·저장 단위 테스트.

의존성: 프로젝트 모듈 + 표준 라이브러리만. pytest 없이 스크립트로 실행 가능.

    py -3 -m features.personal_overlay.tests.test_overlay
    py -3 features/personal_overlay/tests/test_overlay.py
"""
import json
import os
import sys
import tempfile
from pathlib import Path

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from features.personal_overlay import schema as S
from features.personal_overlay import service as svc


# ---------------------------------------------------------------------------
# schema.normalize_overlay — 편향방지 필드 보장 (원칙 3)
# ---------------------------------------------------------------------------

def test_normalize_guarantees_all_list_fields():
    o = S.normalize_overlay({})
    for f in S.LIST_FIELDS:
        assert f in o and isinstance(o[f], list)
    # 확증편향 방지 3종은 반드시 존재
    assert "counterEvidence" in o and "contradictions" in o and "uncertainties" in o


def test_normalize_coerces_string_to_list():
    o = S.normalize_overlay({"counterEvidence": "중국 매출 리스크"})
    assert o["counterEvidence"] == ["중국 매출 리스크"]


def test_normalize_invalid_stance_defaults():
    assert S.normalize_overlay({"stance": "강화"})["stance"] == S.STANCE_DEFAULT
    assert S.normalize_overlay({"stance": "reinforced"})["stance"] == "reinforced"


def test_normalize_keeps_dict_items():
    linked = [{"noteId": "abc", "title": "LRCX"}]
    o = S.normalize_overlay({}, linked_notes=linked)
    assert o["linkedNotes"] == linked


def test_normalize_markdown_arg_wins():
    o = S.normalize_overlay({"markdown": "raw"}, markdown="override")
    assert o["markdown"] == "override"


# ---------------------------------------------------------------------------
# generate_overlay — fallback (LLM 꺼짐)
# ---------------------------------------------------------------------------

def test_fallback_overlay_has_counter_fields():
    hyps = [{"note_id": "n1", "title": "LRCX 투자 Thesis", "note_type": "company_thesis", "ticker": "LRCX"}]
    overlay, status = svc.generate_overlay({"markdown": "보고서"}, hyps, llm_override=False)
    assert status == "disabled"
    assert "counterEvidence" in overlay and isinstance(overlay["counterEvidence"], list)
    assert overlay["uncertainties"]  # 비어있지 않음(LLM 미수행 안내)
    assert overlay["linkedNotes"][0]["ticker"] == "LRCX"
    assert overlay["stance"] == "insufficient"


def test_no_notes_short_circuits():
    # 노트가 없으면 LLM 설정과 무관하게 호출 없이 no_notes로 단락
    overlay, status = svc.generate_overlay({"markdown": "보고서"}, [], llm_override=False)
    assert status == "no_notes"
    assert overlay["linkedNotes"] == []
    assert overlay["uncertainties"]  # "연결할 노트 없음" 안내


def test_no_notes_short_circuits_even_with_llm_on():
    # llm_override=True여도 노트가 없으면 LLM 경로로 가지 않는다(no_notes)
    overlay, status = svc.generate_overlay({"markdown": "보고서"}, [], llm_override=True)
    assert status == "no_notes"
    assert overlay["stance"] == "insufficient"


# ---------------------------------------------------------------------------
# with_overlay / strip_overlay — markdown 불변 + 응답 필터
# ---------------------------------------------------------------------------

def test_with_overlay_does_not_mutate_markdown():
    report = {"markdown": "CANONICAL 본문", "sources": [1, 2]}
    overlay = S.normalize_overlay({"supportingEvidence": ["x"]})
    updated = svc.with_overlay(report, overlay, status="ok")
    # 기본 markdown 불변
    assert updated["markdown"] == "CANONICAL 본문"
    # 원본 dict도 변경되지 않음(얕은 복사)
    assert "personalOverlay" not in report
    # overlay는 별도 블록으로 저장
    assert updated["personalOverlay"]["enabled"] is True
    assert updated["personalOverlay"]["status"] == "ok"
    assert "supportingEvidence" in updated["personalOverlay"]


def test_strip_overlay_hides_by_default():
    report = {"markdown": "x", "personalOverlay": {"enabled": True}}
    assert "personalOverlay" not in svc.strip_overlay(report, include_personal=False)
    assert "personalOverlay" in svc.strip_overlay(report, include_personal=True)
    # 원본 불변
    assert "personalOverlay" in report


# ---------------------------------------------------------------------------
# attach_overlay_to_briefing — 통합 (임시 디렉터리, LLM off)
# ---------------------------------------------------------------------------

def test_attach_briefing_keeps_markdown_and_saves_overlay():
    tmp = Path(tempfile.mkdtemp())
    orig_dir = svc.BRIEFINGS_DIR
    orig_gather = svc._gather_hypotheses
    try:
        svc.BRIEFINGS_DIR = tmp
        svc._gather_hypotheses = lambda kind, canonical: [
            {"note_id": "n1", "title": "AI 전력 메모", "note_type": "market_memo", "ticker": ""}
        ]
        (tmp / "2026-06-10.json").write_text(
            json.dumps({"markdown": "원본 브리핑 본문", "date": "2026-06-10"}, ensure_ascii=False),
            encoding="utf-8",
        )
        result = svc.attach_overlay_to_briefing("2026-06-10", llm_override=False)
        assert result["ok"] is True
        saved = json.loads((tmp / "2026-06-10.json").read_text(encoding="utf-8"))
        # 기본 markdown은 그대로
        assert saved["markdown"] == "원본 브리핑 본문"
        # overlay가 별도 블록으로 저장됨 + 편향방지 필드 존재
        assert saved["personalOverlay"]["enabled"] is True
        assert "counterEvidence" in saved["personalOverlay"]
        assert saved["personalOverlay"]["linkedNotes"][0]["title"] == "AI 전력 메모"
    finally:
        svc.BRIEFINGS_DIR = orig_dir
        svc._gather_hypotheses = orig_gather


def test_attach_briefing_market_scope_saves_overlay_to_scoped_file_only():
    tmp = Path(tempfile.mkdtemp())
    orig_dir = svc.BRIEFINGS_DIR
    orig_gather = svc._gather_hypotheses
    try:
        svc.BRIEFINGS_DIR = tmp
        svc._gather_hypotheses = lambda kind, canonical: [
            {"note_id": "n1", "title": "US 시장 메모", "note_type": "market_memo", "ticker": ""}
        ]
        (tmp / "2026-06-10.us.json").write_text(
            json.dumps({"markdown": "US 브리핑 본문", "date": "2026-06-10", "marketScope": "us"}, ensure_ascii=False),
            encoding="utf-8",
        )
        (tmp / "2026-06-10.kr.json").write_text(
            json.dumps({"markdown": "KR 브리핑 본문", "date": "2026-06-10", "marketScope": "kr"}, ensure_ascii=False),
            encoding="utf-8",
        )
        result = svc.attach_overlay_to_briefing("2026-06-10", market_scope="us", llm_override=False)
        assert result["ok"] is True
        us = json.loads((tmp / "2026-06-10.us.json").read_text(encoding="utf-8"))
        kr = json.loads((tmp / "2026-06-10.kr.json").read_text(encoding="utf-8"))
        assert us["personalOverlay"]["enabled"] is True
        assert "personalOverlay" not in kr
        assert us["markdown"] == "US 브리핑 본문"
    finally:
        svc.BRIEFINGS_DIR = orig_dir
        svc._gather_hypotheses = orig_gather


def test_attach_briefing_missing_raises():
    tmp = Path(tempfile.mkdtemp())
    orig_dir = svc.BRIEFINGS_DIR
    try:
        svc.BRIEFINGS_DIR = tmp
        raised = False
        try:
            svc.attach_overlay_to_briefing("2099-01-01", llm_override=False)
        except FileNotFoundError:
            raised = True
        assert raised
    finally:
        svc.BRIEFINGS_DIR = orig_dir


def _run_all():
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    passed = 0
    for t in tests:
        t()
        passed += 1
        print(f"PASS {t.__name__}")
    print(f"\n{passed}/{len(tests)} tests passed")
    return passed == len(tests)


if __name__ == "__main__":
    sys.exit(0 if _run_all() else 1)
