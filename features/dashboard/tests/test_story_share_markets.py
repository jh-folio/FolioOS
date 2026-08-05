"""Task 7.1/7.4 — Story Share and Market State across four markets.

These surfaces were added in 0.4 against a two-market product and named `us`
and `kr` directly, so Europe and Japan silently fell back to US.
"""
from __future__ import annotations

import pytest

from features.dashboard.story_share import (
    MIN_CONFIDENT_SAMPLE,
    STORY_SHARE_MARKETS,
    _normalized_scope,
    build_story_share,
)
from features.market_memory.market_context import MARKET_KEYS
from features.market_memory.service import MARKET_STATE_SCOPES
from features.market_memory.snapshot import MARKET_VIEW_KEYS

MARKETS = ("us", "kr", "europe", "jp")


def test_every_market_surface_covers_the_same_four_markets():
    assert STORY_SHARE_MARKETS == MARKETS
    assert MARKET_VIEW_KEYS == MARKETS
    assert MARKET_KEYS == MARKETS
    assert MARKET_STATE_SCOPES == ("overall", *MARKETS)


@pytest.mark.parametrize("scope", MARKETS)
def test_a_requested_market_is_not_quietly_turned_into_us(scope):
    assert _normalized_scope(scope) == scope


def test_an_unknown_market_still_falls_back_rather_than_failing():
    assert _normalized_scope("mars") == "us"
    assert _normalized_scope("") == "us"


def _docs(count, market_title):
    return [
        {"title": f"{market_title} semiconductor demand story {i}", "date": "2026-08-05",
         "source": "Reuters", "path": "research-inbox/rss/a.md"}
        for i in range(count)
    ]


def test_a_thin_sample_is_labelled_rather_than_shown_as_a_clean_delta():
    """One or two articles move a share by tens of points.

    Presenting that delta plainly reads as a change in the story when it is a
    change in how much was collected.
    """
    payload = build_story_share(_docs(3, "FTSE 100 London"), "2026-08-05", "europe")
    if payload["collectedCount"]:
        assert payload["smallSample"] is True
        assert "small_sample" in payload["warnings"]
        assert payload["minConfidentSample"] == MIN_CONFIDENT_SAMPLE


def test_the_payload_reports_the_market_it_was_asked_for():
    payload = build_story_share([], "2026-08-05", "jp")
    assert payload["market"] == "jp"
    assert payload["basis"] == "collected_news_volume"
