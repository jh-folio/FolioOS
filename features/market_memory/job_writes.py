from __future__ import annotations

import sqlite3
from collections.abc import Mapping, Sequence
from dataclasses import dataclass

from features.common.canonical_json import JsonValue
from features.common.sqlite_receipts import (
    ReceiptExpectation,
    ReceiptRecord,
    ReceiptVerificationError,
    verify_receipt_set,
    write_receipt,
)
from features.market_memory.attempt_store import AttemptMode, UpdateAttemptRef
from features.market_memory.graph_plan import (
    PreparedGraphPlan,
    apply_graph_plan,
    prepare_graph_plan,
    projected_graph,
    verify_graph_plan_rows,
)
from features.market_memory.snapshot_job import (
    PreparedSnapshot,
    SnapshotBuilder,
    current_snapshot_hash,
    insert_snapshot,
    prepare_snapshot_on_connection,
)
from features.market_memory.standalone_job import (
    commit_memory_batch,
    commit_snapshot_update,
    prepare_snapshot_update,
    reconcile_snapshot_attempt,
    recover_memory_batch,
    recover_snapshot_update,
)


@dataclass(frozen=True, slots=True)
class PreparedCombinedUpdate:
    graph_plan: PreparedGraphPlan
    snapshot: PreparedSnapshot


@dataclass(frozen=True, slots=True)
class CommittedCombinedUpdate:
    saved_count: int
    snapshot: dict[str, JsonValue]
    terminal_projection: dict[str, JsonValue]


def prepare_combined_update(
    connection: sqlite3.Connection,
    *,
    entries: Sequence[Mapping[str, JsonValue]],
    snapshot_builder: SnapshotBuilder,
    update_attempt_ref: UpdateAttemptRef,
    prepared_at: str,
) -> PreparedCombinedUpdate:
    if update_attempt_ref.mode is not AttemptMode.COMBINED_JOB:
        raise ReceiptVerificationError(code="combined_attempt_required")
    graph_plan = prepare_graph_plan(connection, entries, prepared_at)
    with projected_graph(connection, graph_plan) as projected:
        payload = snapshot_builder(projected)
        snapshot_id = str(payload.get("id") or "")
        base_hash = current_snapshot_hash(connection, snapshot_id) if snapshot_id else None
        snapshot = prepare_snapshot_on_connection(
            projected,
            payload,
            update_attempt_ref,
            graph_plan.graph_base_hash,
            graph_plan.target_hash,
            base_hash,
        )
    return PreparedCombinedUpdate(graph_plan=graph_plan, snapshot=snapshot)


def commit_combined_update(
    connection: sqlite3.Connection,
    prepared: PreparedCombinedUpdate,
    *,
    terminal_projection: Mapping[str, JsonValue],
    created_at: str,
) -> CommittedCombinedUpdate:
    reference = prepared.snapshot.update_attempt_ref
    if reference.jobId is None or reference.operationId is None:
        raise ReceiptVerificationError(code="combined_attempt_binding_missing")
    projection = dict(terminal_projection)
    try:
        connection.execute("BEGIN IMMEDIATE")
        apply_graph_plan(connection, prepared.graph_plan)
        if current_snapshot_hash(connection, prepared.snapshot.snapshot_id) != prepared.snapshot.base_hash:
            raise ReceiptVerificationError(code="snapshot_base_hash_mismatch")
        insert_snapshot(connection, prepared.snapshot)
        if current_snapshot_hash(connection, prepared.snapshot.snapshot_id) != prepared.snapshot.target_hash:
            raise ReceiptVerificationError(code="snapshot_target_hash_mismatch")
        write_receipt(
            connection,
            ReceiptRecord(
                operation_id=reference.operationId,
                job_id=reference.jobId,
                artifact_type="market_memory_batch",
                artifact_id=reference.jobId,
                result_hash=prepared.graph_plan.target_hash,
                terminal_projection=projection,
                created_at=created_at,
            ),
        )
        write_receipt(
            connection,
            ReceiptRecord(
                operation_id=reference.operationId,
                job_id=reference.jobId,
                artifact_type="market_state_snapshot",
                artifact_id=prepared.snapshot.snapshot_id,
                result_hash=prepared.snapshot.target_hash,
                terminal_projection=projection,
                created_at=created_at,
            ),
        )
        connection.commit()
    except (sqlite3.Error, ReceiptVerificationError):
        connection.rollback()
        raise
    payload = prepared.snapshot.logical_row["payload"]
    if not isinstance(payload, dict):
        raise ReceiptVerificationError(code="snapshot_payload_invalid")
    return CommittedCombinedUpdate(
        saved_count=prepared.graph_plan.saved_count,
        snapshot=payload,
        terminal_projection=projection,
    )


def recover_combined_update(
    connection: sqlite3.Connection,
    prepared: PreparedCombinedUpdate,
) -> dict[str, JsonValue]:
    reference = prepared.snapshot.update_attempt_ref
    if reference.jobId is None or reference.operationId is None:
        raise ReceiptVerificationError(code="combined_attempt_binding_missing")
    verify_graph_plan_rows(connection, prepared.graph_plan)
    if current_snapshot_hash(connection, prepared.snapshot.snapshot_id) != prepared.snapshot.target_hash:
        raise ReceiptVerificationError(code="snapshot_recovery_hash_mismatch")
    return verify_receipt_set(
        connection,
        reference.jobId,
        reference.operationId,
        (
            ReceiptExpectation("market_memory_batch", reference.jobId, prepared.graph_plan.target_hash),
            ReceiptExpectation("market_state_snapshot", prepared.snapshot.snapshot_id, prepared.snapshot.target_hash),
        ),
    )


__all__ = [
    "CommittedCombinedUpdate",
    "PreparedCombinedUpdate",
    "PreparedSnapshot",
    "SnapshotBuilder",
    "commit_combined_update",
    "commit_memory_batch",
    "commit_snapshot_update",
    "prepare_combined_update",
    "prepare_snapshot_update",
    "reconcile_snapshot_attempt",
    "recover_combined_update",
    "recover_memory_batch",
    "recover_snapshot_update",
]
