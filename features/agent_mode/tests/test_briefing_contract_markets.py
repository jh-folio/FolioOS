"""출력 계약은 **실제 생성할 시장 목록**을 검사해야 한다.

2026-08-12 18:00 예약(한국장+일본장)이 45분을 쓰고 `internal_error`로 끝났다.
`market_selection_scope(["kr","jp"])`는 `multi`를 돌려주는데 계약 생성기가 그 이름을
몰라 조용히 `both`로 되돌아갔고, 그래서 **미국장 섹션을 요구하는 계약**으로 검사됐다.
프롬프트는 `read_briefing_prompt(requested_markets)`로 한국·일본을 올바르게 시키고
있었으므로, 생성 결과는 매번 계약을 어겼다 — 위반 → 재작성 1회 → 또 위반 → 실패.
CLI를 두 번 돌리므로 시간만 쓰고 아무것도 남기지 못했다.
"""
from __future__ import annotations

import pytest

from features.agent_mode.briefing_contract import briefing_output_contract
from features.daily_briefing.schema import market_selection_scope, normalize_market_selection


def _titles(**kwargs):
    return briefing_output_contract(**kwargs)["requiredMarketTitles"]


def test_a_market_list_decides_the_contract():
    assert _titles(market_scope="multi", markets=["kr", "jp"]) == [
        "Korea Market Briefing", "Japan Market Briefing",
    ]


def test_the_failing_schedule_no_longer_asks_for_a_market_it_will_not_generate():
    """실패한 그 예약을 그대로 재현한다."""
    markets = list(normalize_market_selection(["kr", "jp"]))
    scope = market_selection_scope(markets)

    titles = _titles(market_scope=scope, markets=markets)

    assert scope == "multi", "이 조합에 이름이 없다는 사실이 이 테스트의 전제다"
    assert "US Market Briefing" not in titles


@pytest.mark.parametrize(
    ("markets", "expected"),
    [
        (["us", "europe"], ["US Market Briefing", "Europe Market Briefing"]),
        (["europe", "jp"], ["Europe Market Briefing", "Japan Market Briefing"]),
        (["us", "kr", "europe", "jp"],
         ["US Market Briefing", "Korea Market Briefing", "Europe Market Briefing", "Japan Market Briefing"]),
        (["jp"], ["Japan Market Briefing"]),
    ],
)
def test_every_combination_asks_for_exactly_its_markets(markets, expected):
    scope = market_selection_scope(list(normalize_market_selection(markets)))

    assert _titles(market_scope=scope, markets=markets) == expected


def test_required_sections_follow_the_same_markets():
    sections = briefing_output_contract("multi", markets=["kr", "jp"])["requiredSections"]

    assert not any("미국장" in section for section in sections)
    assert any("한국장" in section for section in sections)
    assert any("일본장" in section for section in sections)


def test_thresholds_scale_with_the_market_count():
    one = briefing_output_contract("kr", markets=["kr"])
    two = briefing_output_contract("multi", markets=["kr", "jp"])

    assert two["minimumCharacters"] == one["minimumCharacters"] * 2
    assert two["minimumOneLineConclusions"] == one["minimumOneLineConclusions"] * 2


def test_the_scope_name_still_works_when_no_list_is_given():
    """목록 없이 부르는 기존 호출자를 깨지 않는다."""
    assert _titles(market_scope="both") == ["US Market Briefing", "Korea Market Briefing"]
    assert _titles(market_scope="kr") == ["Korea Market Briefing"]
    assert _titles(market_scope="all") == [
        "US Market Briefing", "Korea Market Briefing", "Europe Market Briefing", "Japan Market Briefing",
    ]


def test_unknown_names_in_the_list_are_ignored_not_fatal():
    assert _titles(market_scope="multi", markets=["kr", "mars", ""]) == ["Korea Market Briefing"]


def test_the_pack_builds_its_contract_from_the_requested_markets():
    """프롬프트와 계약이 같은 입력을 봐야 한다. 한쪽만 목록을 쓰던 것이 어긋남의 시작이었다."""
    import inspect

    from features.agent_mode import service

    source = inspect.getsource(service)
    assert "markets=requested_markets," in source
    assert "read_briefing_prompt(market_scope)" not in source
