"""Topic report service deep-research option tests.

    py -3 features/topic_report/tests/test_service_deep_research.py
"""
import os
import sys

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from features.topic_report import service as S


def test_generate_topic_report_deep_research_is_opt_in_and_bounded():
    originals = {
        "fetch_topic_market_data": S.fetch_topic_market_data,
        "fetch_macro_data": S.fetch_macro_data,
        "_search_docs": S._search_docs,
        "_search_memories": S._search_memories,
    }
    try:
        S.fetch_topic_market_data = lambda tickers, history_period="1y": {"tickers": {}, "period": history_period, "asOf": "2026-06-30"}
        S.fetch_macro_data = lambda **kwargs: {"ok": False}
        S._search_docs = lambda queries, limit=12: [
            {"title": "AI power bottleneck risk", "summary": "전력 병목과 수혜 기업", "source": "Reuters", "date": "2026-06-29", "url": f"http://example.com/{abs(hash(tuple(queries))) % 10000}"},
        ]
        S._search_memories = lambda keywords, limit=20: []

        report = S.generate_topic_report(
            "custom",
            custom_label="AI 데이터센터 전력 병목이 전력기기 기업에 주는 영향",
            llm_override=False,
            date="2026-06-30",
            deep_research=True,
        )
    finally:
        for name, value in originals.items():
            setattr(S, name, value)

    deep = report["topicPlan"]["deepResearch"]
    summary = report["evidencePackSummary"]

    assert deep["enabled"] is True
    assert deep["maxRounds"] == 2
    assert summary["deepResearch"]["enabled"] is True
    assert summary["deepResearch"]["maxRounds"] == 2
    assert summary["questionCoverage"], "서비스 결과에 하위 질문 커버리지가 저장되어야 함"
    assert any(row.get("researchQuestionId") for row in report["sourceLedger"])
    assert any(row.get("researchRound") for row in report["sourceLedger"])
    assert "## 심층 리서치 커버리지" in report["markdown"]


def test_deep_research_forces_minimal_plan_when_planner_disabled():
    originals = {
        "fetch_topic_market_data": S.fetch_topic_market_data,
        "fetch_macro_data": S.fetch_macro_data,
        "_search_docs": S._search_docs,
        "_search_memories": S._search_memories,
    }
    try:
        S.fetch_topic_market_data = lambda tickers, history_period="1y": {"tickers": {}, "period": history_period, "asOf": "2026-06-30"}
        S.fetch_macro_data = lambda **kwargs: {"ok": False}
        S._search_docs = lambda queries, limit=12: []
        S._search_memories = lambda keywords, limit=20: []

        report = S.generate_topic_report(
            "custom",
            custom_label="원화 약세가 한국 반도체 수출주에 주는 영향",
            llm_override=False,
            date="2026-06-30",
            use_planner=False,
            deep_research=True,
        )
    finally:
        for name, value in originals.items():
            setattr(S, name, value)

    assert report["topicPlan"]["deepResearch"]["enabled"] is True


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
