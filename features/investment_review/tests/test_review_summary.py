"""Investment Review 집계/요약 테스트.

    py -3 features/investment_review/tests/test_review_summary.py
"""
import os
import sys

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from features.investment_review import service as S
from features.investment_review.schema import normalize_review


def test_market_state_from_regime():
    states = [
        {"id": "s1", "stateLabel": "AI 반도체 공급망", "momentum": "strengthening", "confidence": 0.7,
         "bias": "bullish", "status": "active", "linkedCompanies": ["nvda", "AVGO"]},
        {"stateKey": "rates", "story": "금리·달러", "momentum": "conflicted"},
        {"momentum": "stable"},  # label 없음 → 제외
    ]
    ms = S.build_market_state(states)
    assert len(ms) == 2
    assert ms[0]["label"] == "AI 반도체 공급망"
    assert ms[0]["linkedCompanies"] == ["NVDA", "AVGO"]
    assert ms[1]["label"] == "금리·달러"


def test_thesis_changes_join_delta():
    theses = [{"ticker": "nvda", "company": "NVIDIA", "conviction": "high", "status": "active"},
              {"ticker": "GEV", "company": "GE Vernova", "status": "active"}]
    deltas = {"NVDA": {"verdict": "weakened", "generatedAt": "2026-06-13"}}
    tc = S.build_thesis_changes(theses, deltas)
    assert tc[0]["ticker"] == "NVDA" and tc[0]["verdict"] == "weakened"
    # delta 없으면 insufficient_evidence 기본
    assert tc[1]["ticker"] == "GEV" and tc[1]["verdict"] == "insufficient_evidence"


def test_render_markdown_has_sections_and_disclaimer():
    review = {
        "date": "2026-06-13",
        "marketState": [{"label": "AI 반도체", "momentum": "strengthening"}],
        "thesisChanges": [{"ticker": "NVDA", "verdict": "weakened"}],
        "portfolioImpacts": [{"ticker": "NVDA", "impact": "watch", "linkedNarratives": ["AI 반도체"]}],
        "keyCheckpoints": [{"checkpoint": "10년물 금리 재상승 확인"}],
        "linkedNotes": [], "warnings": [],
    }
    md = S.render_markdown(review)
    assert "## 오늘의 시장 상태" in md
    assert "## 내 Thesis 변화" in md
    assert "## 포트폴리오 영향" in md
    assert "## 이번 주 체크포인트" in md
    assert "매수/매도 지시가 아닙니다" in md


def test_normalize_review_fills_empty():
    out = normalize_review(None, date="2026-06-13")
    assert out["date"] == "2026-06-13"
    assert out["marketState"] == [] and out["mode"] == "rule"
    assert out["qualitySummary"] == {}


def test_empty_data_produces_warning():
    review = {"date": "2026-06-13", "marketState": [], "thesisChanges": []}
    # 빈 데이터에서도 markdown은 생성된다(원문 불변, 화면 안깨짐)
    md = S.render_markdown(review)
    assert "누적된 시장 내러티브가 없습니다" in md


def test_build_stats_counts():
    ms = [{"momentum": "strengthening"}, {"momentum": "fading"}, {"momentum": "strengthening"}]
    tc = [{"verdict": "strengthened"}, {"verdict": "at_risk"}, {"verdict": "maintained"}]
    pi = [{"impact": "positive"}, {"impact": "watch"}, {"impact": "positive"}]
    kc = [{"checkpoint": "a"}, {"checkpoint": "b"}]
    s = S.build_stats(ms, tc, pi, kc)
    assert s["marketStrengthening"] == 2 and s["marketTotal"] == 3
    assert s["thesisStrengthened"] == 1 and s["thesisWeakened"] == 1
    assert s["positionsPositive"] == 2 and s["positionsWatch"] == 1
    assert s["checkpointCount"] == 2
    assert s["thesisDistribution"]["strengthened"] == 1
    assert s["impactDistribution"]["positive"] == 2


def test_build_exposure_ranked():
    pi = [
        {"ticker": "GEV", "linkedNarratives": ["전력 병목", "AI 반도체"]},
        {"ticker": "NVDA", "linkedNarratives": ["AI 반도체"]},
        {"ticker": "AAPL", "linkedNarratives": []},
    ]
    exp = S.build_exposure(pi)
    assert exp[0] == {"narrative": "AI 반도체", "count": 2}
    assert {"narrative": "전력 병목", "count": 1} in exp


def test_build_summary_strong_and_soft():
    ms = [{"label": "AI 반도체", "momentum": "strengthening"}, {"label": "금리", "momentum": "fading"}]
    summary = S.build_summary(ms)
    assert "AI 반도체 강화" in summary and "금리 주의" in summary


def test_build_summary_empty():
    assert "먼저 생성" in S.build_summary([])


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
