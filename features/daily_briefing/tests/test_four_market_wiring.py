"""Task 3.5 — the wiring around generation: visuals, exports, Agent contract.

These are the places that named `us` and `kr` directly and would drop Europe and
Japan without failing: the chart-subject parser, the sidecar loader, the export
image filter, and the Agent CLI contract.
"""
from __future__ import annotations

import pytest

from features.agent_mode.briefing_contract import (
    TITLE_REQUIREMENTS,
    _market_keys_from_contract,
    briefing_output_contract,
    required_sections,
)
from features.daily_briefing.schema import SINGLE_MARKET_SCOPES, briefing_export_units
from features.daily_briefing.visuals import leading_company_subjects_from_markdown

DATE = "2026-08-05"
LABELS = {"us": "미국장", "kr": "한국장", "europe": "유럽장", "jp": "일본장"}
TITLES = {
    "us": "US Market Briefing", "kr": "Korea Market Briefing",
    "europe": "Europe Market Briefing", "jp": "Japan Market Briefing",
}


# --- chart subjects -----------------------------------------------------


@pytest.mark.parametrize("scope", SINGLE_MARKET_SCOPES)
def test_every_market_heading_is_recognized_as_a_chart_subject(scope):
    """An unrecognized heading loses that company's chart with no warning."""
    markdown = f"## 3. {LABELS[scope]}을 주도한 기업 ① — 엔비디아"
    result = leading_company_subjects_from_markdown(markdown)
    assert set(result) == {*SINGLE_MARKET_SCOPES, "warnings"}
    # 엔비디아는 미국 기업이라 다른 시장 제목에서는 해석 실패로 남는다.
    resolved = result[scope]
    if scope == "us":
        assert [row["ticker"] for row in resolved] == ["NVDA"]
    else:
        assert resolved == []
        assert any(scope.upper() in text for text in result["warnings"])


def test_an_unresolvable_company_is_reported_rather_than_dropped():
    result = leading_company_subjects_from_markdown("## 3. 유럽장을 주도한 기업 ① — ASML")
    assert result["europe"] == []
    assert any("ASML" in text for text in result["warnings"])


# --- exports ------------------------------------------------------------


def test_export_units_label_each_market_and_title_it_correctly():
    report = {
        "date": DATE, "marketScope": "all", "briefingType": "default",
        "briefings": {key: {"markdown": f"# {TITLES[key]}\n\nbody"} for key in SINGLE_MARKET_SCOPES},
    }
    units = {unit["marketScope"]: unit for unit in briefing_export_units(report)}
    assert set(units) == set(SINGLE_MARKET_SCOPES)
    for scope in SINGLE_MARKET_SCOPES:
        assert TITLES[scope] in units[scope]["title"]
        assert LABELS[scope] in units[scope]["tags"]


@pytest.mark.parametrize("module_path", [
    "features.obsidian.export.service",
    "features.notion_export.service",
])
def test_an_aggregate_export_takes_every_markets_chart(module_path):
    """`ALL` had no case, so a four-market export shipped without its charts."""
    import importlib

    module = importlib.import_module(module_path)
    # Notion은 dataUrl을, Obsidian은 원본 dict를 돌려주므로 개수로만 비교한다.
    images = [
        {"market": key.upper(), "dataUrl": f"data:image/png;base64,{key}"}
        for key in SINGLE_MARKET_SCOPES
    ]
    selector = module._briefing_images_for_market
    assert len(selector(images, "ALL")) == 4
    assert len(selector(images, "BOTH")) == 4
    assert len(selector(images, "EUROPE")) == 1


# --- Agent CLI contract -------------------------------------------------


@pytest.mark.parametrize("scope", SINGLE_MARKET_SCOPES)
def test_the_agent_contract_demands_only_the_requested_markets_sections(scope):
    contract = briefing_output_contract(scope)
    assert contract["requiredMarketTitles"] == [TITLES[scope]]
    assert _market_keys_from_contract(contract) == [scope]
    for other in SINGLE_MARKET_SCOPES:
        if other != scope:
            assert TITLES[other] not in contract["requiredSections"]


def test_the_section_skeleton_is_identical_across_markets():
    shapes = {
        scope: [section.replace(LABELS[scope], "<시장>") for section in required_sections(scope)[1:]]
        for scope in SINGLE_MARKET_SCOPES
    }
    assert len(set(map(tuple, shapes.values()))) == 1


def test_length_thresholds_scale_with_the_number_of_markets():
    single = briefing_output_contract("us")
    both = briefing_output_contract("both")
    every = briefing_output_contract("all")
    assert both["minimumCharacters"] == single["minimumCharacters"] * 2
    assert every["minimumCharacters"] == single["minimumCharacters"] * 4
    assert every["minimumOneLineConclusions"] == single["minimumOneLineConclusions"] * 4


def test_both_still_means_two_markets_in_the_agent_contract():
    contract = briefing_output_contract("both")
    assert _market_keys_from_contract(contract) == ["us", "kr"]
    assert "Europe Market Briefing" not in contract["requiredSections"]


def test_a_contract_with_no_scope_falls_back_to_two_markets_not_four():
    """Widening the fallback would demand sections for markets never requested."""
    assert _market_keys_from_contract({"marketScope": "", "requiredSections": ["x"]}) == ["us", "kr"]


def test_titles_are_recovered_from_required_sections_when_scope_is_missing():
    contract = {"marketScope": "", "requiredSections": list(required_sections("jp"))}
    assert _market_keys_from_contract(contract) == ["jp"]


def test_every_market_has_a_title_requirement():
    assert set(TITLE_REQUIREMENTS) == set(SINGLE_MARKET_SCOPES)


# --- change events ------------------------------------------------------


@pytest.mark.parametrize("scope", SINGLE_MARKET_SCOPES)
def test_change_events_are_keyed_per_market(scope):
    """One key per date would let the last market committed overwrite the rest."""
    from features.common.change_intelligence.adapters.briefing import _briefing_artifact_id

    assert _briefing_artifact_id({"date": DATE}, scope) == f"{DATE}.{scope}"
