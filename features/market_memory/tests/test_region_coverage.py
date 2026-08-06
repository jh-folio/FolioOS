"""Europe and Japan narratives must survive normalization.

`allowed_region` was hardcoded to {US, KR, GLOBAL} while the rest of 0.5 moved
to four markets, so an LLM entry classified `EUROPE` or `JP` was rewritten to
GLOBAL on the way into storage. The Market Memory screen therefore showed no
European or Japanese narrative no matter what the model produced.
"""
from __future__ import annotations

import pytest

from features.common.markets import PRODUCT_MARKETS
from features.market_memory.memory import REGION_CHOICES, detect_region


@pytest.mark.parametrize("market", [m.value for m in PRODUCT_MARKETS])
def test_every_product_market_is_a_storable_region(market):
    assert market in REGION_CHOICES


def test_global_stays_available_for_cross_market_narratives():
    assert "GLOBAL" in REGION_CHOICES


@pytest.mark.parametrize("text,expected", [
    ("ECB가 금리를 동결하며 DAX가 상승했다", "EUROPE"),
    ("일본은행 BOJ 정책 수정으로 닛케이가 흔들렸다", "JP"),
    ("코스피와 삼성전자 실적", "KR"),
    ("Fed와 Nasdaq 반응", "US"),
])
def test_detection_reaches_all_four_markets(text, expected):
    assert detect_region([], text) == expected


def test_a_multi_market_story_stays_global():
    assert detect_region([], "ECB와 Fed가 동시에 움직였다") == "GLOBAL"


@pytest.mark.parametrize("region", ["EUROPE", "JP"])
def test_normalization_keeps_the_new_markets(region):
    """The gate: the service-layer filter must not silently downgrade to GLOBAL."""
    from features.market_memory import service

    normalized = service.REGION_CHOICES
    assert region in normalized, f"{region}가 저장 직전에 GLOBAL로 강등된다"
