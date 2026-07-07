import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features.daily_briefing.link_analysis import build_link_analysis


def _result(drivers, issues=None):
    return {"marketDrivers": drivers, "issueCoverageRaw": issues or []}


def test_link_analysis_surfaces_shared_and_per_market_drivers():
    us = _result([
        {"driver": "AI 반도체 수요", "score": 9, "markets": ["US"], "sectors": ["Semiconductors"], "docs": []},
        {"driver": "장기금리 상승", "score": 5, "markets": ["US"], "sectors": [], "docs": []},
    ])
    kr = _result([
        {"driver": "AI 반도체 수요", "score": 8, "markets": ["KR"], "sectors": ["Semiconductors"], "docs": []},
        {"driver": "원/달러 환율", "score": 6, "markets": ["KR"], "sectors": [], "docs": []},
    ])

    link = build_link_analysis(us, kr, market_windows={})

    assert link["status"] in {"connected", "selectively_connected", "independent", "insufficient_evidence"}
    assert "AI 반도체 수요" in link["sharedDrivers"]
    assert "장기금리 상승" in link["usOnlyDrivers"]
    assert "원/달러 환율" in link["krOnlyDrivers"]
    # Canonical-style section with a confirmation-bias guard (limits/uncertainty).
    assert link["markdown"].lstrip().startswith("## 한미 시장 연결 분석")
    assert ("한계" in link["markdown"]) or ("불확실" in link["markdown"])


def test_link_analysis_spillover_uses_session_dates():
    windows = {"usPreviousSessionDate": "2026-06-26", "krCurrentSessionDate": "2026-06-29"}
    link = build_link_analysis(_result([]), _result([]), market_windows=windows)
    # Spillover note references the US prior close feeding the KR session.
    assert "2026-06-26" in link["markdown"]
    assert "2026-06-29" in link["markdown"]


def test_link_analysis_is_rule_based_without_llm_and_handles_empty():
    link = build_link_analysis(_result([]), _result([]), market_windows={})
    assert link["status"] == "insufficient_evidence"
    assert link["sharedDrivers"] == []
    assert link["markdown"].lstrip().startswith("## 한미 시장 연결 분석")
