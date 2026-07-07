"""포트폴리오/워치리스트 ↔ regime/thesis 연결·영향 판정 테스트.

    py -3 features/investment_review/tests/test_portfolio_links.py
"""
import os
import sys

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from features.investment_review import service as S

_REGIME = [
    {"stateLabel": "AI 데이터센터 전력 병목", "momentum": "strengthening", "bias": "bullish", "linkedCompanies": ["GEV", "ETN"]},
    {"stateLabel": "금리·달러 유동성", "momentum": "fading", "bias": "bearish", "linkedCompanies": ["NVDA"]},
]


def test_positive_when_strengthening_regime():
    impacts = S.build_portfolio_impacts(
        positions=[{"ticker": "GEV", "name": "GE Vernova"}], watchlist=[],
        regime_states=_REGIME, thesis_changes=[],
    )
    assert impacts[0]["impact"] == "positive"
    assert "AI 데이터센터 전력 병목" in impacts[0]["linkedNarratives"]


def test_watch_when_at_risk_verdict_overrides():
    impacts = S.build_portfolio_impacts(
        positions=[{"ticker": "GEV"}], watchlist=[],
        regime_states=_REGIME,
        thesis_changes=[{"ticker": "GEV", "verdict": "at_risk"}],
    )
    # strengthening regime이라도 thesis at_risk면 watch
    assert impacts[0]["impact"] == "watch"


def test_watch_when_fading_regime():
    impacts = S.build_portfolio_impacts(
        positions=[{"ticker": "NVDA"}], watchlist=[], regime_states=_REGIME, thesis_changes=[],
    )
    assert impacts[0]["impact"] == "watch"


def test_neutral_when_no_link():
    impacts = S.build_portfolio_impacts(
        positions=[{"ticker": "AAPL"}], watchlist=[], regime_states=_REGIME, thesis_changes=[],
    )
    assert impacts[0]["impact"] == "neutral"
    assert impacts[0]["linkedNarratives"] == []


def test_watchlist_string_and_dict_and_dedup():
    impacts = S.build_portfolio_impacts(
        positions=[{"ticker": "GEV"}],
        watchlist=["gev", {"ticker": "ETN", "name": "Eaton"}],  # gev 중복 → dedup
        regime_states=_REGIME, thesis_changes=[],
    )
    tickers = [i["ticker"] for i in impacts]
    assert tickers == ["GEV", "ETN"]  # GEV는 portfolio에서 이미 추가 → 워치리스트 중복 제외
    eaton = [i for i in impacts if i["ticker"] == "ETN"][0]
    assert eaton["source"] == "watchlist" and eaton["impact"] == "positive"


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
