"""Quality Gate / Personal Overlay 분리 테스트.

    py -3 features/topic_report/tests/test_quality_eval.py
"""
import os
import sys

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from features.topic_report.evaluation import evaluate_report
from features.topic_report.service import _append_topic_report_continuation, _topic_report_looks_cut

_GOOD_REPORT = """# 일본 금리 인상 분석 리포트 — 2026-06-12

## 1. Executive Summary
BOJ의 정책 변화가 핵심입니다. 현재 판단: 엔화 강세 압력 우세.

## 2. 질문 정의와 분석 범위
이 보고서가 답하려는 질문은 ... 포함 범위와 제외 범위를 정의합니다. 데이터 한계도 명시합니다.

## 3. 핵심 데이터 대시보드
| 지표 | 현재 | 변화 | 해석 |
|---|---|---|---|
| USD/JPY | 148.5 | -1.2% | 엔화 강세 |
| 10년물 | 4.5% | +0.1% | 금리 상승 |
| KRW | 1350 | +0.5% | 약세 |
| 닛케이 | 38000 | -2.0% | 하락 |

## 5. 작동 경로
금리 0.25%p 인상이 엔화로, 다시 원화로 전이됩니다.

## 7. 반론과 리스크
이 분석이 틀릴 수 있는 이유는 미국 금리가 상쇄할 가능성입니다.

## 8. 시나리오
| 시나리오 | 조건 | 영향 |
|---|---|---|
| 기본 | USD/JPY 145를 하회하면 | 엔 강세 |

## 9. 앞으로 확인할 체크포인트
| 체크포인트 | 좋아지는 신호 | 나빠지는 신호 |
|---|---|---|
| USD/JPY | 145 아래로 | 152 위로 |

## 10. 결론
핵심 판단을 재정리합니다. 지금 당장 가장 먼저 확인해야 할 것: USD/JPY 145 하회 여부.

## 11. Source & Data Notes
yfinance, 로컬 RSS 기반. 추정 포함.
"""

_BAD_REPORT = """# 대충 보고서

## 결론
오를 것 같습니다. 무조건 좋습니다.
"""

_SUMMARY_GOOD = {
    "totalDocs": 8,
    "roleCounts": {"supporting": 4, "challenging": 3, "data_point": 1},
    "axisCoverage": {
        "a1": {"label": "BOJ 정책", "count": 4, "level": "high"},
        "a2": {"label": "환율 반응", "count": 3, "level": "medium"},
    },
}


def test_good_report_scores_higher_than_bad():
    good = evaluate_report(_GOOD_REPORT, evidence_summary=_SUMMARY_GOOD)
    bad = evaluate_report(_BAD_REPORT, evidence_summary={"totalDocs": 0, "roleCounts": {}, "axisCoverage": {}})
    assert good["score"] > bad["score"]
    assert good["score"] >= 70
    assert bad["score"] < 50


def test_grade_and_levels_present():
    q = evaluate_report(_GOOD_REPORT, evidence_summary=_SUMMARY_GOOD)
    assert q["grade"] in {"A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"}
    assert q["counterArgument"] in {"present", "weak"}
    assert q["dataCoverage"] in {"high", "medium", "low", "none"}
    assert set(q["checks"]) >= {"topic_answered", "counterargument_present", "scenario_quality"}


def test_missing_counterargument_flagged():
    no_counter = _GOOD_REPORT.replace("## 7. 반론과 리스크\n이 분석이 틀릴 수 있는 이유는 미국 금리가 상쇄할 가능성입니다.\n", "")
    q = evaluate_report(no_counter, evidence_summary={"totalDocs": 5, "roleCounts": {}, "axisCoverage": {}})
    assert q["counterArgument"] == "weak"
    assert any("반론" in w for w in q["warnings"])


def test_personal_bias_risk_with_weak_counter():
    q = evaluate_report(_BAD_REPORT, evidence_summary={"totalDocs": 0}, user_context_present=True)
    assert q["personalBiasRisk"] == "elevated"
    assert any("사용자 관점" in w for w in q["warnings"])


def test_scenario_without_condition_flagged():
    no_cond = _GOOD_REPORT.replace("USD/JPY 145를 하회하면", "아마도")
    q = evaluate_report(no_cond, evidence_summary=_SUMMARY_GOOD)
    assert any("조건 기반" in w for w in q["warnings"])


def test_deep_research_quality_checks_question_coverage_and_diversity():
    summary = {
        **_SUMMARY_GOOD,
        "deepResearch": {"enabled": True, "maxRounds": 2},
        "questionCoverage": {
            "dq_01": {"question": "핵심 데이터는?", "count": 3, "level": "medium", "round": 1},
            "dq_02": {"question": "반대 근거는?", "count": 0, "level": "none", "round": 2},
        },
    }
    ledger = [
        {"title": "A", "source": "Reuters", "evidenceRole": "supporting"},
        {"title": "B", "source": "FRED", "evidenceRole": "data_point"},
        {"title": "C", "source": "SEC", "evidenceRole": "challenging"},
    ]
    q = evaluate_report(_GOOD_REPORT, evidence_summary=summary, source_ledger=ledger)

    assert "deep_question_coverage" in q["checks"]
    assert "source_diversity" in q["checks"]
    assert q["checks"]["deep_question_coverage"] < 1
    assert any("심층 질문" in w for w in q["warnings"])


def test_handles_empty_inputs():
    q = evaluate_report("", evidence_summary=None, topic_plan=None)
    assert 0 <= q["score"] <= 100
    assert q["grade"] == "F" or q["score"] < 50


def test_topic_report_cut_detection_requires_tail_sections():
    partial = _GOOD_REPORT.split("## 9. 앞으로 확인할 체크포인트")[0]
    assert _topic_report_looks_cut(partial) is True
    assert _topic_report_looks_cut(_GOOD_REPORT) is False


def test_append_topic_report_continuation_removes_duplicate_h1():
    out = _append_topic_report_continuation("# 제목\n\n## 1. 앞부분", "# 제목\n\n## 9. 앞으로 확인할 체크포인트\n- A")
    assert out.count("# 제목") == 1
    assert "## 9. 앞으로 확인할 체크포인트" in out


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
