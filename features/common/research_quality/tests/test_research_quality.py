"""Research Quality common evaluator tests.

    py -3 features/common/research_quality/tests/test_research_quality.py
"""
import os
import sys

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from features.common.research_quality.evaluator import evaluate_artifact, evaluate_report


GOOD = """# 리포트

## Executive Summary
현재 판단: 자료 기반으로 중립.

## 질문 정의와 분석 범위
포함 범위와 제외 범위.

## 핵심 데이터
S&P 500 1.2%, 금리 4.5%, 환율 1350, 유가 70.

## 반론과 리스크
이 판단이 틀릴 수 있는 조건.

## 시나리오
금리 4.7%를 상회하면 위험.

## 앞으로 확인할 체크포인트
- 금리 4.7% 상회 여부

## Source & Data Notes
로컬 자료와 marketTape 기반. 일부 추정.
"""


def test_evaluate_report_has_step7_fields():
    q = evaluate_report(
        GOOD,
        evidence_summary={"totalDocs": 8, "roleCounts": {"challenging": 1}, "axisCoverage": {}},
        checkpoints=[{"checkpoint": "금리"}],
        source_ledger=[{"title": "A", "source": "Reuters"}],
        evidence_items=[{"title": "A", "type": "news"}],
        market_tape={"items": [{"status": "fresh"}]},
    )
    assert q["status"] in {"pass", "warn", "fail"}
    assert q["sourceGrounding"] in {"high", "medium", "low", "none"}
    assert "source_grounding" in q["checks"]
    assert q["hallucinationRisk"] in {"low", "medium", "high"}


def test_user_note_not_counted_for_grounding():
    q = evaluate_report(
        "# Memo\n\n## 결론\n수치 1 2 3 4 5 6 7 8 9 10",
        evidence_items=[{"title": "내 노트", "type": "user_note"}],
        source_ledger=[],
        artifact_type="personal_overlay",
        user_context_present=True,
    )
    detail = q["sourceGroundingDetail"]
    assert detail["evidenceCount"] == 0
    assert q["personalBiasRisk"] == "elevated"


def test_briefing_artifact_adapter_uses_structured_fields():
    q = evaluate_artifact("briefing", {
        "markdown": GOOD,
        "sources": [{"title": "A"}],
        "stats": {"sourceCount": 5},
        "checkpoints": [{"checkpoint": "금리"}],
        "sourceLedger": [{"title": "A"}],
        "marketTape": {"items": [{"status": "fresh"}]},
    })
    assert q["artifactType"] == "briefing"
    assert q["checkpointQuality"] in {"high", "medium"}


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
