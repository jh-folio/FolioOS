"""예약이 고른 시장만 만든다."""
from __future__ import annotations

import inspect

import pytest

from features.agent_mode import service as agent_service
from features.agent_mode.briefing_contract import briefing_output_contract
from features.daily_briefing.schema import market_keys_for_briefing_scope, market_selection_scope


def test_an_arbitrary_pair_cannot_be_expressed_as_a_scope_name():
    """왜 목록을 넘겨야 하는지 남긴다.

    범위 이름은 `us`/`kr`/`both`/`all`처럼 몇 가지뿐이라 임의 조합을 담지 못한다.
    한국+일본은 `multi`가 되고, `multi`는 **네 시장 전부**로 풀린다.
    """
    assert market_selection_scope(["kr", "jp"]) == "multi"
    assert market_keys_for_briefing_scope("multi") == ("us", "kr", "europe", "jp")


def test_the_pack_dispatcher_forwards_the_market_list():
    """디스패처가 `markets`를 버리면 팩이 범위 이름으로 되짚어 네 시장을 만든다.

    실측 2026-08-13 18:18에 한국·일본 예약 하나가 파일 넷(us/kr/jp/europe)을
    한꺼번에 썼다.
    """
    source = inspect.getsource(agent_service.prepare_pack)

    assert "markets=kwargs.get(\"markets\")" in source


@pytest.mark.parametrize("markets,expected", [
    (["kr", "jp"], ["Korea Market Briefing", "Japan Market Briefing"]),
    (["us"], ["US Market Briefing"]),
    (["us", "europe"], ["US Market Briefing", "Europe Market Briefing"]),
])
def test_the_contract_covers_only_the_chosen_markets(markets, expected):
    contract = briefing_output_contract("multi", "default", markets=markets)

    assert contract["requiredMarketTitles"] == expected


def test_expected_titles_are_narrowed_to_the_chosen_markets():
    """**프롬프트가 이 표를 전부 펼쳐 모델에게 지시한다.**

    `Market title H1 lines must exactly match: ...`에 미국·유럽이 섞여 있으면
    한국·일본 예약이 네 시장을 다 쓴다. 호출자가 범위 이름으로 만든 넓은 표를
    넘겨도 계약이 자기 시장으로 좁힌다.
    """
    wide = {
        "us": "US Market Briefing — 2026.08.12 마감",
        "kr": "Korea Market Briefing — 2026.08.13 마감",
        "europe": "Europe Market Briefing — 2026.08.12 마감",
        "jp": "Japan Market Briefing — 2026.08.13 마감",
    }

    contract = briefing_output_contract("multi", "default", markets=["kr", "jp"], expected_titles=wide)

    assert sorted(contract["expectedTitles"]) == ["jp", "kr"]


def test_both_prompts_only_ask_for_the_contract_titles():
    """두 프롬프트가 같은 표를 펼치므로 좁히는 곳도 한 곳이어야 한다."""
    from features.agent_mode import bridge

    contract = briefing_output_contract(
        "multi", "default", markets=["kr", "jp"],
        expected_titles={
            "us": "US Market Briefing — 2026.08.12 마감",
            "kr": "Korea Market Briefing — 2026.08.13 마감",
            "jp": "Japan Market Briefing — 2026.08.13 마감",
        },
    )
    correction = bridge._briefing_correction_prompt("BASE", ["위반"], contract)

    assert "US Market Briefing" not in correction
    assert "Korea Market Briefing — 2026.08.13 마감" in correction
    assert "Japan Market Briefing — 2026.08.13 마감" in correction
