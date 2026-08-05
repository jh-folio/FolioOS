"""Task 7.2 — a proposal may only rewrite the market it targets.

The scope enum stopped at `us`/`kr`, so a Europe or Japan revision resolved to
the aggregate `{date}.json` and an approval would have rewritten the wrong file.
"""
from __future__ import annotations

import json
from pathlib import Path
from tempfile import TemporaryDirectory

import pytest

from features.agent_mode.proposal_schema import ProposalMarketScope
from features.agent_mode.proposal_support import SINGLE_MARKET_PROPOSAL_SCOPES, exact_path
from features.common.canonical_identity import ReportKind

DATE = "2026-08-05"
MARKETS = ("us", "kr", "europe", "jp")


class _Paths:
    def __init__(self, root: Path):
        self.data_root = root


def _write(root: Path, scope: str):
    briefings = root / "briefings"
    briefings.mkdir(parents=True, exist_ok=True)
    name = f"{DATE}.{scope}.json" if scope else f"{DATE}.json"
    (briefings / name).write_text(json.dumps({
        "date": DATE, "marketScope": scope or "all", "revision": 1, "markdown": f"{scope or 'all'} body",
    }, ensure_ascii=False), encoding="utf-8")


@pytest.mark.parametrize("market", MARKETS)
def test_every_market_can_be_proposed_against(market):
    assert ProposalMarketScope(market).value == market
    assert ProposalMarketScope(market) in SINGLE_MARKET_PROPOSAL_SCOPES


@pytest.mark.parametrize("market", MARKETS)
def test_a_proposal_resolves_to_its_own_markets_file(market):
    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        for scope in (*MARKETS, ""):
            _write(root, scope)
        path = exact_path(_Paths(root), ReportKind.BRIEFING, f"{DATE}.{market}", ProposalMarketScope(market))
        assert path.name == f"{DATE}.{market}.json"


@pytest.mark.parametrize("scope", ["both", "all", "multi", "none"])
def test_an_aggregate_scope_does_not_claim_one_markets_file(scope):
    """`both` and `all` name a set, not a file, so they must not resolve to one."""
    assert ProposalMarketScope(scope) not in SINGLE_MARKET_PROPOSAL_SCOPES


def test_a_japanese_proposal_cannot_land_on_the_us_file():
    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        for scope in ("us", "jp"):
            _write(root, scope)
        jp = exact_path(_Paths(root), ReportKind.BRIEFING, f"{DATE}.jp", ProposalMarketScope.JP)
        us = exact_path(_Paths(root), ReportKind.BRIEFING, f"{DATE}.us", ProposalMarketScope.US)
        assert jp != us
        assert json.loads(jp.read_text(encoding="utf-8"))["marketScope"] == "jp"
