from __future__ import annotations

from datetime import UTC, datetime

import pytest

from features.investment_notes.intelligence_schema import (
    CheckpointState,
    Freshness,
    HypothesisCheckpoint,
)
from features.thesis_tracking import model as thesis_model
from features.thesis_tracking import review_state
from features.thesis_tracking import service
from features.thesis_tracking import store


NOW = datetime(2026, 7, 27, 12, 0, tzinfo=UTC)


@pytest.mark.parametrize(
    ("cycle", "expected"),
    [
        ("weekly", "2026-07-08T00:00:00Z"),
        ("monthly", "2026-07-31T00:00:00Z"),
        ("quarterly", "2026-09-29T00:00:00Z"),
        ("event_driven", None),
    ],
)
def test_next_review_is_derived_from_controlled_cycle(cycle: str, expected: str | None) -> None:
    assert review_state.derive_next_review_at("2026-07-01", cycle) == expected


def test_freshness_is_deterministic_at_cycle_boundaries() -> None:
    assert (
        review_state.derive_freshness("2026-07-28T12:00:00Z", "weekly", now=NOW)
        is Freshness.FRESH
    )
    assert (
        review_state.derive_freshness("2026-07-27T12:00:00Z", "weekly", now=NOW)
        is Freshness.DUE
    )
    assert (
        review_state.derive_freshness("2026-07-19T12:00:00Z", "weekly", now=NOW)
        is Freshness.STALE
    )
    assert review_state.derive_freshness(None, "event_driven", now=NOW) is Freshness.UNKNOWN


def test_missing_review_state_returns_safe_legacy_default() -> None:
    connection = store.connect(":memory:")
    try:
        state = review_state.load_review_state(connection, "nvda")
    finally:
        connection.close()

    assert state.ticker == "NVDA"
    assert state.freshness is Freshness.UNKNOWN
    assert state.revision == 0
    assert state.lastReviewedAt is None
    assert state.nextReviewAt is None
    assert state.checkpoints == ()


def test_review_state_roundtrip_is_revision_safe_and_bounded() -> None:
    connection = store.connect(":memory:")
    checkpoint = HypothesisCheckpoint(
        id="cp_next_earnings",
        label="다음 실적 확인",
        state=CheckpointState.OPEN,
        dueAt="2026-08-20T00:00:00Z",
        reasonCode="scheduled_review",
    )
    initial = review_state.ReviewState(
        ticker="NVDA",
        lastReviewedAt="2026-07-27T12:00:00Z",
        nextReviewAt="2026-08-03T12:00:00Z",
        latestDeltaId="delta_123",
        freshness=Freshness.FRESH,
        checkpoints=(checkpoint,),
        revision=0,
        updatedAt="2026-07-27T12:00:00Z",
    )
    try:
        saved = review_state.save_review_state(connection, initial, expected_revision=0)
        loaded = review_state.load_review_state(connection, "NVDA")
        with pytest.raises(review_state.ReviewStateConflictError):
            review_state.save_review_state(connection, initial, expected_revision=0)
    finally:
        connection.close()

    assert saved.revision == 1
    assert loaded == saved
    assert loaded.checkpoints[0].state is CheckpointState.OPEN


def test_additive_schema_preserves_existing_thesis_and_delta_rows() -> None:
    connection = store.connect(":memory:")
    thesis = thesis_model.Thesis(
        ticker="NVDA",
        core_thesis="AI capex remains supportive",
        review_cycle="monthly",
    )
    try:
        store.upsert_thesis(connection, thesis)
        thesis_before = dict(
            connection.execute("SELECT * FROM thesis WHERE ticker='NVDA'").fetchone()
        )
        schema_before = {
            table: [tuple(row) for row in connection.execute(f"PRAGMA table_info({table})")]
            for table in ("thesis", "thesis_delta")
        }

        store.ensure_schema(connection)
        store.ensure_schema(connection)

        thesis_after = dict(
            connection.execute("SELECT * FROM thesis WHERE ticker='NVDA'").fetchone()
        )
        schema_after = {
            table: [tuple(row) for row in connection.execute(f"PRAGMA table_info({table})")]
            for table in ("thesis", "thesis_delta")
        }
        review_columns = {
            row["name"]
            for row in connection.execute("PRAGMA table_info(thesis_review_state)")
        }
    finally:
        connection.close()

    assert thesis_after == thesis_before
    assert schema_after == schema_before
    assert review_columns == {
        "ticker",
        "last_reviewed_at",
        "next_review_at",
        "latest_delta_id",
        "freshness",
        "checkpoints_json",
        "revision",
        "updated_at",
    }
    assert "note_body" not in review_columns
    assert "agent_response" not in review_columns


def test_service_derives_legacy_safe_state_without_persisting_a_row(tmp_path) -> None:
    database = tmp_path / "market-memory.sqlite3"
    connection = store.connect(database)
    try:
        store.upsert_thesis(
            connection,
            thesis_model.Thesis(
                ticker="NVDA",
                review_cycle="weekly",
                last_reviewed_at="2026-07-25",
                next_checkpoints=["다음 실적 확인"],
            ),
        )
    finally:
        connection.close()

    payload = service.get_thesis_review_state("nvda", database, now=NOW)

    connection = store.connect(database)
    try:
        persisted = connection.execute(
            "SELECT COUNT(*) FROM thesis_review_state WHERE ticker='NVDA'"
        ).fetchone()[0]
    finally:
        connection.close()
    assert payload["ticker"] == "NVDA"
    assert payload["freshness"] == "fresh"
    assert payload["revision"] == 0
    assert len(payload["checkpoints"]) == 1
    assert persisted == 0


def test_completed_delta_updates_review_state_and_preserves_checked_checkpoint() -> None:
    connection = store.connect(":memory:")
    thesis = thesis_model.Thesis(
        ticker="NVDA",
        review_cycle="weekly",
        last_reviewed_at="2026-07-20",
        next_checkpoints=["다음 실적 확인"],
    )
    try:
        store.upsert_thesis(connection, thesis)
        derived = review_state.state_from_thesis(thesis.to_row(), now=NOW)
        checked = derived.checkpoints[0].model_copy(
            update={
                "state": CheckpointState.CHECKED,
                "checkedAt": "2026-07-26T12:00:00Z",
            }
        )
        review_state.save_review_state(
            connection,
            derived.model_copy(
                update={
                    "checkpoints": (checked,),
                    "updatedAt": "2026-07-26T12:00:00Z",
                }
            ),
            expected_revision=0,
        )

        completed = review_state.record_completed_review(
            connection,
            thesis.to_row(),
            {
                "deltaId": "delta_123",
                "generatedAt": "2026-07-27T12:00:00Z",
                "nextCheckpoints": ["다음 실적 확인", "마진 변화 확인"],
            },
        )
    finally:
        connection.close()

    assert completed.latestDeltaId == "delta_123"
    assert completed.lastReviewedAt == "2026-07-27T12:00:00Z"
    assert completed.nextReviewAt == "2026-08-03T12:00:00Z"
    assert completed.freshness is Freshness.FRESH
    assert completed.revision == 2
    assert completed.checkpoints[0].state is CheckpointState.CHECKED
    assert completed.checkpoints[1].state is CheckpointState.OPEN
