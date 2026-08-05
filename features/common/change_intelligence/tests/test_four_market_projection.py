"""Task 7.4 — four briefings share one date, so the projection must keep four rows.

`change_event_index` is keyed on (artifact_kind, artifact_id). While a date held
only a US and a KR briefing, two ids were enough; with Europe and Japan added, an
id that dropped the market would let each commit overwrite the last and the
Change Feed would show one market's change standing in for all four.
"""
from __future__ import annotations

import json
import sqlite3

import pytest

from features.common.change_intelligence.adapters.briefing import build_briefing_basis
from features.common.change_intelligence.comparator import compare_basis
from features.common.change_intelligence.projection import list_change_events, repair_change_projection
from features.common.markets import PRODUCT_MARKETS

DATE = "2026-08-05"
MARKETS = tuple(market.value.lower() for market in PRODUCT_MARKETS)


def _briefing(scope):
    return {
        "date": DATE,
        "marketScope": scope,
        "marketDrivers": [{"driver": f"{scope}-rates", "score": 12, "docCount": 3}],
        "sources": [{"url": f"https://example.com/{scope}", "reliabilityTier": 2, "publisherGroup": "wire-a"}],
    }


def test_every_market_gets_its_own_artifact_id():
    ids = [build_briefing_basis(_briefing(scope))["artifactId"] for scope in MARKETS]
    assert ids == [f"{DATE}.{scope}" for scope in MARKETS]
    assert len(set(ids)) == len(MARKETS) == 4


def _summary(scope, previous=None):
    """A change summary built the way a commit builds one, not hand-assembled."""
    basis = build_briefing_basis(_briefing(scope))
    return compare_basis(
        basis,
        previous,
        current_ref={"storageKind": "json_report", "id": f"{DATE}.{scope}", "contentHash": scope * 4},
    )


def test_a_rebuild_from_saved_reports_keeps_one_row_per_market(tmp_path):
    briefings = tmp_path / "briefings"
    briefings.mkdir()
    for scope in MARKETS:
        (briefings / f"{DATE}.{scope}.json").write_text(
            json.dumps({"date": DATE, "marketScope": scope, "changeSummary": _summary(scope)}, ensure_ascii=False),
            encoding="utf-8",
        )
    db = tmp_path / "market-memory.sqlite3"

    result = repair_change_projection(tmp_path, db)
    assert result["repaired"] == 4

    with sqlite3.connect(str(db)) as conn:
        rows = conn.execute("SELECT artifact_id FROM change_event_index ORDER BY artifact_id").fetchall()
    assert [row[0] for row in rows] == sorted(f"{DATE}.{scope}" for scope in MARKETS)


def test_a_rebuild_is_idempotent(tmp_path):
    briefings = tmp_path / "briefings"
    briefings.mkdir()
    for scope in MARKETS:
        (briefings / f"{DATE}.{scope}.json").write_text(
            json.dumps({"date": DATE, "marketScope": scope, "changeSummary": _summary(scope)}, ensure_ascii=False),
            encoding="utf-8",
        )
    db = tmp_path / "market-memory.sqlite3"
    repair_change_projection(tmp_path, db)
    repair_change_projection(tmp_path, db)

    events = list_change_events(db, limit=50)
    assert len(events) == 4
    assert sorted(event["artifactId"] for event in events) == sorted(f"{DATE}.{scope}" for scope in MARKETS)


@pytest.mark.parametrize("scope", MARKETS)
def test_one_markets_commit_leaves_the_others_standing(tmp_path, scope):
    briefings = tmp_path / "briefings"
    briefings.mkdir()
    for other in MARKETS:
        (briefings / f"{DATE}.{other}.json").write_text(
            json.dumps({"date": DATE, "marketScope": other, "changeSummary": _summary(other)}, ensure_ascii=False),
            encoding="utf-8",
        )
    db = tmp_path / "market-memory.sqlite3"
    repair_change_projection(tmp_path, db)

    # Re-commit this one market with a different driver mix so it, and only it, moves.
    moved = {**_briefing(scope), "marketDrivers": [{"driver": f"{scope}-oil", "score": 40, "docCount": 6}]}
    revised = compare_basis(
        build_briefing_basis(moved),
        build_briefing_basis(_briefing(scope)),
        current_ref={"storageKind": "json_report", "id": f"{DATE}.{scope}", "contentHash": "revised"},
    )
    (briefings / f"{DATE}.{scope}.json").write_text(
        json.dumps({"date": DATE, "marketScope": scope, "changeSummary": revised}, ensure_ascii=False), encoding="utf-8"
    )
    repair_change_projection(tmp_path, db)

    events = {event["artifactId"]: event for event in list_change_events(db, limit=50)}
    assert len(events) == 4
    assert events[f"{DATE}.{scope}"]["currentRef"]["contentHash"] == "revised"
    for other in MARKETS:
        if other != scope:
            assert events[f"{DATE}.{other}"]["currentRef"]["contentHash"] == other * 4
