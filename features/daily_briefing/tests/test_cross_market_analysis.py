"""Task 3.4 — one global analysis across N markets.

The gates are that `all` still produces something useful when a region is
missing, that no market's Canonical markdown is touched, and that an LLM
failure falls back to the rule-based text.
"""
from __future__ import annotations

import pytest

from features.common.market_calendar import briefing_market_windows
from features.daily_briefing import service
from features.daily_briefing.link_analysis import (
    build_cross_market_analysis,
    build_link_analysis,
)

DATE = "2026-08-05"


def _result(*drivers, issues=1):
    return {
        "marketDrivers": [{"driver": name, "score": 10 - index} for index, name in enumerate(drivers)],
        "issueCoverageRaw": [{"docs": []}] * issues,
        "markdown": "# Market Briefing\n\ncanonical body",
    }


@pytest.fixture(scope="module")
def windows():
    return briefing_market_windows(DATE, as_of=f"{DATE}T18:00:00+09:00")


@pytest.fixture
def four_markets():
    return {
        "us": _result("반도체/AI", "금리", "실적/가이던스"),
        "kr": _result("반도체/AI", "수급", "환율/달러"),
        "europe": _result("금리", "정책/규제"),
        "jp": _result("환율/달러", "반도체/AI"),
    }


# --- session ordering ---------------------------------------------------


def test_the_chain_follows_when_sessions_actually_closed(windows, four_markets):
    """Europe and the US close overnight in KST; Tokyo and Seoul close that afternoon."""
    out = build_cross_market_analysis(four_markets, market_windows=windows, aggregate_scope="all")
    assert out["sessionChain"] == ["EUROPE", "US", "KR", "JP"]
    assert out["sessionDates"]["EUROPE"] == out["sessionDates"]["US"]
    assert out["sessionDates"]["KR"] == out["sessionDates"]["JP"]


def test_a_pre_open_asia_session_moves_to_the_front_of_the_chain(four_markets):
    """Before Tokyo opens it describes yesterday — which closed before last night's Europe."""
    pre_open = briefing_market_windows(DATE, as_of=f"{DATE}T07:00:00+09:00")
    out = build_cross_market_analysis(four_markets, market_windows=pre_open, aggregate_scope="all")
    assert out["sessionChain"].index("JP") < out["sessionChain"].index("EUROPE")


def test_transmission_paths_only_link_adjacent_sessions(windows, four_markets):
    out = build_cross_market_analysis(four_markets, market_windows=windows, aggregate_scope="all")
    chain = out["sessionChain"]
    for path in out["transmissionPaths"]:
        assert chain.index(path["to"]) - chain.index(path["from"]) == 1
        assert path["sharedDrivers"]


# --- noise control ------------------------------------------------------


def test_pairs_without_a_shared_driver_are_not_recorded(windows):
    """Six pairs of four markets, mostly empty, would bury the ones with evidence."""
    results = {
        "us": _result("반도체/AI"), "kr": _result("수급"),
        "europe": _result("정책/규제"), "jp": _result("실적/가이던스"),
    }
    out = build_cross_market_analysis(results, market_windows=windows, aggregate_scope="all")
    assert out["pairs"] == []
    assert out["status"] == "independent"


def test_a_market_sharing_nothing_is_named_rather_than_left_implicit(windows):
    results = {
        "us": _result("반도체/AI"), "kr": _result("반도체/AI"),
        "europe": _result("정책/규제"), "jp": _result("반도체/AI"),
    }
    out = build_cross_market_analysis(results, market_windows=windows, aggregate_scope="all")
    assert out["decoupledMarkets"] == ["EUROPE"]
    assert any("유럽장" in text for text in out["limitations"])


def test_global_channels_need_two_markets_to_count(windows):
    results = {"us": _result("금리", "반도체/AI"), "kr": _result("반도체/AI")}
    out = build_cross_market_analysis(results, market_windows=windows, aggregate_scope="all")
    assert out["globalChannels"] == []

    results["kr"] = _result("반도체/AI", "금리")
    out = build_cross_market_analysis(results, market_windows=windows, aggregate_scope="all")
    assert [row["channel"] for row in out["globalChannels"]] == ["금리"]


# --- partial coverage ---------------------------------------------------


def test_a_missing_region_does_not_block_the_analysis(windows, four_markets):
    """Three markets still explain more than nothing."""
    del four_markets["europe"]
    out = build_cross_market_analysis(four_markets, market_windows=windows, aggregate_scope="all")
    assert out is not None
    assert out["includedMarkets"] == ["US", "KR", "JP"]
    assert out["expectedMarkets"] == ["US", "KR", "EUROPE", "JP"]
    assert any("유럽장" in text and "빠져" in text for text in out["limitations"])
    assert out["markdown"].startswith("## 시장 간 연결 요약")


def test_no_markets_at_all_returns_nothing_rather_than_an_empty_report(windows):
    assert build_cross_market_analysis({}, market_windows=windows, aggregate_scope="all") is None


def test_a_market_with_no_issues_makes_the_picture_insufficient_not_independent(windows):
    """Absence of evidence is not evidence of decoupling."""
    results = {"us": _result("반도체/AI"), "kr": _result("반도체/AI", issues=0)}
    out = build_cross_market_analysis(results, market_windows=windows, aggregate_scope="all")
    assert out["status"] == "insufficient_evidence"


# --- canonical isolation ------------------------------------------------


def test_link_generation_never_touches_a_markets_canonical_markdown(windows, four_markets):
    before = {scope: result["markdown"] for scope, result in four_markets.items()}
    build_cross_market_analysis(four_markets, market_windows=windows, aggregate_scope="all")
    assert {scope: result["markdown"] for scope, result in four_markets.items()} == before


# --- legacy two-market path ---------------------------------------------


def test_the_two_market_adapter_keeps_its_original_keys_and_heading(windows):
    out = build_link_analysis(_result("반도체/AI", "금리"), _result("반도체/AI", "수급"), market_windows=windows)
    assert set(out) == {"status", "sharedDrivers", "usOnlyDrivers", "krOnlyDrivers", "spillover", "markdown"}
    assert out["markdown"].startswith("## 한미 시장 연결 분석")
    assert "sessionChain" not in out


# --- LLM enhancement ----------------------------------------------------


def test_both_link_headings_survive_validation():
    """The N-market heading differs; rejecting it would silently drop enhancement."""
    guard = "\n\n### 한계와 불확실성\n- " + ("추정 " * 40)
    assert service._valid_link_markdown("## 한미 시장 연결 분석" + guard)
    assert service._valid_link_markdown("## 시장 간 연결 요약" + guard)
    assert not service._valid_link_markdown("## 다른 제목" + guard)


def test_the_llm_context_describes_whichever_draft_shape_it_got(windows, four_markets):
    cross = build_cross_market_analysis(four_markets, market_windows=windows, aggregate_scope="all")
    context = service._link_llm_context(cross, windows)
    assert "세션 순서" in context and "전달 경로" in context
    assert "미국장 고유 동인" not in context  # 두 시장 전용 라벨

    legacy = build_link_analysis(_result("반도체/AI"), _result("반도체/AI"), market_windows=windows)
    legacy_context = service._link_llm_context(legacy, windows)
    assert "미국장 고유 동인" in legacy_context
    assert "세션 순서" not in legacy_context


def test_an_llm_failure_leaves_the_rule_based_analysis(monkeypatch, windows, four_markets):
    cross = build_cross_market_analysis(four_markets, market_windows=windows, aggregate_scope="all")
    monkeypatch.setattr(service, "selected_llm_config", lambda: {
        "enabled": True, "apiKey": "k", "provider": "openai", "model": "m",
    })
    monkeypatch.setattr(service, "request_openai", lambda *a, **k: (_ for _ in ()).throw(RuntimeError("down")))

    assert service.llm_enhance_link_analysis(cross, market_windows=windows, llm_override=True) is None
    assert cross["markdown"].startswith("## 시장 간 연결 요약")


def test_the_n_market_draft_gets_the_n_market_prompt(monkeypatch, windows, four_markets):
    cross = build_cross_market_analysis(four_markets, market_windows=windows, aggregate_scope="all")
    seen = {}
    monkeypatch.setattr(service, "selected_llm_config", lambda: {
        "enabled": True, "apiKey": "k", "provider": "openai", "model": "m",
    })

    def fake(cfg, system, context, **kwargs):
        seen["system"] = system
        return "## 시장 간 연결 요약\n\n" + ("본문 " * 40) + "\n\n### 한계와 불확실성\n- 추정", None, None

    monkeypatch.setattr(service, "request_openai", fake)
    out = service.llm_enhance_link_analysis(cross, market_windows=windows, llm_override=True)
    assert out is not None
    assert "## 시장 간 연결 요약" in seen["system"]
    assert "초안에 없는 시장을 추가하지 않습니다" in seen["system"]
