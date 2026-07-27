from __future__ import annotations

import sqlite3
from datetime import UTC, datetime

import pytest

from features.common.canonical_json import JsonValue
from features.common.sqlite_receipts import (
    ReceiptRecord,
    ReceiptVerificationError,
    read_receipts,
    write_receipt,
)
from features.market_memory.attempt_store import (
    AttemptMode,
    AttemptScope,
    AttemptStart,
    AttemptStatus,
    AttemptStore,
)
from features.market_memory.graph_plan import graph_hash, prepare_graph_plan
from features.market_memory.job_writes import (
    commit_memory_batch,
    commit_snapshot_update,
    commit_combined_update,
    prepare_combined_update,
    prepare_snapshot_update,
    reconcile_snapshot_attempt,
    recover_memory_batch,
    recover_snapshot_update,
    recover_combined_update,
)
from features.market_memory.snapshot import current_market_state_snapshot, save_market_state_snapshot
from features.market_memory.tests.sql_receipt_test_support import (
    NOW,
    attempt as _attempt,
    connection as _connection,
    entry as _entry,
    projection as _projection,
    snapshot_payload as _snapshot_payload,
)


def test_graph_plan_captures_all_five_tables_and_detects_stale_base() -> None:
    # Given
    connection = _connection()
    prepared = prepare_graph_plan(connection, (_entry(),), NOW)
    touched = {row.table for row in prepared.touched_rows}

    # Then
    assert touched == {
        "market_memory",
        "market_narrative_states",
        "market_memory_taxonomy",
        "market_story_links",
        "market_story_family_suggestions",
    }
    assert graph_hash(connection) == prepared.graph_base_hash


def test_combined_memory_snapshot_uses_projected_graph_and_two_receipts() -> None:
    # Given
    connection = _connection()
    attempt = _attempt()

    def build_snapshot(projected: sqlite3.Connection) -> dict[str, JsonValue]:
        count = projected.execute("SELECT COUNT(*) FROM market_memory").fetchone()[0]
        payload = _snapshot_payload()
        payload["headline"] = f"projected-memory-count:{count}"
        return payload

    prepared = prepare_combined_update(
        connection,
        entries=(_entry(),),
        snapshot_builder=build_snapshot,
        update_attempt_ref=attempt,
        prepared_at=NOW,
    )
    before_hash = graph_hash(connection)
    assert current_market_state_snapshot(connection) is None

    # When
    projection = _projection("market_memory_update", str(attempt.jobId))
    committed = commit_combined_update(
        connection,
        prepared,
        terminal_projection=projection,
        created_at=NOW,
    )

    # Then
    assert before_hash == prepared.graph_plan.graph_base_hash
    assert committed.snapshot["headline"] == "projected-memory-count:1"
    receipts = read_receipts(connection, str(attempt.operationId))
    assert len(receipts) == 2
    assert receipts[0].terminal_projection == receipts[1].terminal_projection == projection
    assert recover_combined_update(connection, prepared) == projection


def test_combined_stale_graph_rolls_back_snapshot_and_receipts() -> None:
    # Given
    connection = _connection()
    attempt = _attempt()
    prepared = prepare_combined_update(
        connection,
        entries=(_entry(),),
        snapshot_builder=lambda _connection: _snapshot_payload(),
        update_attempt_ref=attempt,
        prepared_at=NOW,
    )
    connection.execute(
        "INSERT INTO market_memory (memory_id,as_of,date,title,summary,story,created_at) VALUES (?,?,?,?,?,?,?)",
        ("racer", NOW, "2026-07-17", "race", "race", "race", NOW),
    )
    connection.commit()

    # When / Then
    with pytest.raises(ReceiptVerificationError, match="graph_base_hash_mismatch"):
        commit_combined_update(
            connection,
            prepared,
            terminal_projection=_projection("market_memory_update", str(attempt.jobId)),
            created_at=NOW,
        )
    assert connection.execute("SELECT COUNT(*) FROM market_state_snapshots").fetchone()[0] == 0
    assert connection.execute("SELECT COUNT(*) FROM job_operation_receipts").fetchone()[0] == 0


def test_standalone_memory_batch_has_one_receipt_and_recovers() -> None:
    # Given
    connection = _connection()
    plan = prepare_graph_plan(connection, (_entry(),), NOW)
    projection = _projection("market_memory_llm", "job-memory")

    # When
    commit_memory_batch(
        connection,
        plan,
        job_id="job-memory",
        operation_id="op-memory",
        terminal_projection=projection,
        created_at=NOW,
    )

    # Then
    assert recover_memory_batch(connection, plan, "job-memory", "op-memory") == projection
    assert len(read_receipts(connection, "op-memory")) == 1


def test_standalone_snapshot_receipt_reconciles_attempt(tmp_path) -> None:
    # Given
    connection = _connection()
    store = AttemptStore(tmp_path / "market-state-attempts.json")
    attempt = store.start(
        AttemptStart(
            scope=AttemptScope.GLOBAL,
            mode=AttemptMode.STANDALONE_JOB,
            jobId="job-snapshot",
            operationId="op-snapshot",
            startedAt=datetime(2026, 7, 17, 3, 4, 5, tzinfo=UTC),
            inputWatermark=NOW,
        ),
        attempt_id="msa_11234567-89ab-4cde-8fab-0123456789ab",
    )
    prepared = prepare_snapshot_update(connection, _snapshot_payload(), attempt.reference())
    projection = _projection("market_state_snapshot", "snapshot-1")

    # When
    commit_snapshot_update(connection, prepared, projection, NOW)
    terminal = reconcile_snapshot_attempt(
        store,
        prepared,
        datetime(2026, 7, 17, 3, 5, 5, tzinfo=UTC),
    )

    # Then
    assert terminal.status is AttemptStatus.SUCCESS
    assert recover_snapshot_update(connection, prepared) == projection
    assert len(read_receipts(connection, "op-snapshot")) == 1


def test_manual_snapshot_path_remains_receipt_free() -> None:
    # Given
    connection = _connection()
    payload = _snapshot_payload()

    # When
    save_market_state_snapshot(connection, payload)

    # Then
    assert connection.execute("SELECT COUNT(*) FROM market_state_snapshots").fetchone()[0] == 1
    assert connection.execute("SELECT COUNT(*) FROM job_operation_receipts").fetchone()[0] == 0


def test_memory_receipt_conflict_rolls_back_all_graph_rows() -> None:
    # Given
    connection = _connection()
    plan = prepare_graph_plan(connection, (_entry(),), NOW)
    write_receipt(
        connection,
        ReceiptRecord(
            "op-memory",
            "other-job",
            "market_memory_batch",
            "job-memory",
            "f" * 64,
            _projection("market_memory_llm", "job-memory"),
            NOW,
        ),
    )
    connection.commit()

    # When / Then
    with pytest.raises(ReceiptVerificationError, match="receipt_conflict"):
        commit_memory_batch(
            connection,
            plan,
            job_id="job-memory",
            operation_id="op-memory",
            terminal_projection=_projection("market_memory_llm", "job-memory"),
            created_at=NOW,
        )
    assert graph_hash(connection) == plan.graph_base_hash
    assert connection.execute("SELECT COUNT(*) FROM market_memory").fetchone()[0] == 0


def test_partial_combined_receipt_set_fails_recovery_without_rewrite() -> None:
    # Given
    connection = _connection()
    attempt = _attempt()
    prepared = prepare_combined_update(
        connection,
        entries=(_entry(),),
        snapshot_builder=lambda _connection: _snapshot_payload(),
        update_attempt_ref=attempt,
        prepared_at=NOW,
    )
    projection = _projection("market_memory_update", str(attempt.jobId))
    commit_combined_update(connection, prepared, terminal_projection=projection, created_at=NOW)
    connection.execute(
        "DELETE FROM job_operation_receipts WHERE operation_id=? AND artifact_type='market_state_snapshot'",
        (attempt.operationId,),
    )
    connection.commit()
    graph_after_commit = graph_hash(connection)

    # When / Then
    with pytest.raises(ReceiptVerificationError, match="receipt_set_mismatch"):
        recover_combined_update(connection, prepared)
    assert graph_hash(connection) == graph_after_commit
    assert connection.execute("SELECT COUNT(*) FROM market_state_snapshots").fetchone()[0] == 1
