from __future__ import annotations

import sqlite3
from collections.abc import Mapping
from dataclasses import replace
from datetime import datetime
from typing import assert_never

from features.common.canonical_json import JsonValue
from features.common.sqlite_receipts import (
    ReceiptExpectation,
    ReceiptRecord,
    ReceiptVerificationError,
    verify_receipt_set,
    write_receipt,
)
from features.market_memory.attempt_store import (
    AttemptMode,
    AttemptStatus,
    AttemptStore,
    MarketStateAttempt,
    UpdateAttemptRef,
)
from features.market_memory.graph_plan import (
    PreparedGraphPlan,
    apply_graph_plan,
    graph_hash,
    verify_graph_plan_rows,
)
from features.market_memory.snapshot_job import (
    PreparedSnapshot,
    current_snapshot_hash,
    insert_snapshot,
    prepare_snapshot_on_connection,
)


def commit_memory_batch(
    connection: sqlite3.Connection,
    plan: PreparedGraphPlan,
    *,
    job_id: str,
    operation_id: str,
    terminal_projection: Mapping[str, JsonValue],
    created_at: str,
) -> None:
    try:
        connection.execute("BEGIN IMMEDIATE")
        apply_graph_plan(connection, plan)
        write_receipt(
            connection,
            ReceiptRecord(
                operation_id=operation_id,
                job_id=job_id,
                artifact_type="market_memory_batch",
                artifact_id=job_id,
                result_hash=plan.target_hash,
                terminal_projection=dict(terminal_projection),
                created_at=created_at,
            ),
        )
        connection.commit()
    except (sqlite3.Error, ReceiptVerificationError):
        connection.rollback()
        raise


def recover_memory_batch(
    connection: sqlite3.Connection,
    plan: PreparedGraphPlan,
    job_id: str,
    operation_id: str,
) -> dict[str, JsonValue]:
    verify_graph_plan_rows(connection, plan)
    return verify_receipt_set(
        connection,
        job_id,
        operation_id,
        (ReceiptExpectation("market_memory_batch", job_id, plan.target_hash),),
    )


def prepare_snapshot_update(
    connection: sqlite3.Connection,
    payload: Mapping[str, JsonValue],
    update_attempt_ref: UpdateAttemptRef,
) -> PreparedSnapshot:
    if update_attempt_ref.mode is not AttemptMode.STANDALONE_JOB:
        raise ReceiptVerificationError("standalone_attempt_required")
    input_hash = graph_hash(connection)
    clone = sqlite3.connect(":memory:")
    clone.row_factory = sqlite3.Row
    try:
        connection.backup(clone)
        snapshot_id = str(payload.get("id") or "")
        base_hash = current_snapshot_hash(connection, snapshot_id) if snapshot_id else None
        prepared = prepare_snapshot_on_connection(
            clone,
            payload,
            update_attempt_ref,
            input_hash,
            input_hash,
            base_hash,
        )
    finally:
        clone.close()
    if not snapshot_id:
        prepared = replace(
            prepared,
            base_hash=current_snapshot_hash(connection, prepared.snapshot_id),
        )
    return prepared


def commit_snapshot_update(
    connection: sqlite3.Connection,
    prepared: PreparedSnapshot,
    terminal_projection: Mapping[str, JsonValue],
    created_at: str,
) -> None:
    reference = prepared.update_attempt_ref
    if reference.jobId is None or reference.operationId is None:
        raise ReceiptVerificationError("standalone_attempt_binding_missing")
    try:
        connection.execute("BEGIN IMMEDIATE")
        if current_snapshot_hash(connection, prepared.snapshot_id) != prepared.base_hash:
            raise ReceiptVerificationError("snapshot_base_hash_mismatch")
        insert_snapshot(connection, prepared)
        if current_snapshot_hash(connection, prepared.snapshot_id) != prepared.target_hash:
            raise ReceiptVerificationError("snapshot_target_hash_mismatch")
        write_receipt(
            connection,
            ReceiptRecord(
                operation_id=reference.operationId,
                job_id=reference.jobId,
                artifact_type="market_state_snapshot",
                artifact_id=prepared.snapshot_id,
                result_hash=prepared.target_hash,
                terminal_projection=dict(terminal_projection),
                created_at=created_at,
            ),
        )
        connection.commit()
    except (sqlite3.Error, ReceiptVerificationError):
        connection.rollback()
        raise


def recover_snapshot_update(
    connection: sqlite3.Connection,
    prepared: PreparedSnapshot,
) -> dict[str, JsonValue]:
    reference = prepared.update_attempt_ref
    if reference.jobId is None or reference.operationId is None:
        raise ReceiptVerificationError("standalone_attempt_binding_missing")
    if current_snapshot_hash(connection, prepared.snapshot_id) != prepared.target_hash:
        raise ReceiptVerificationError("snapshot_recovery_hash_mismatch")
    return verify_receipt_set(
        connection,
        reference.jobId,
        reference.operationId,
        (ReceiptExpectation("market_state_snapshot", prepared.snapshot_id, prepared.target_hash),),
    )


def reconcile_snapshot_attempt(
    store: AttemptStore,
    prepared: PreparedSnapshot,
    saved_at: datetime,
) -> MarketStateAttempt:
    reference = prepared.update_attempt_ref
    attempt = store.get(reference.id)
    if attempt.reference() != reference:
        raise ReceiptVerificationError("attempt_snapshot_linkage_mismatch")
    match attempt.status:
        case AttemptStatus.RUNNING:
            return store.succeed(reference.id, saved_at, prepared.snapshot_id)
        case AttemptStatus.SUCCESS:
            if attempt.snapshotId != prepared.snapshot_id:
                raise ReceiptVerificationError("attempt_snapshot_linkage_mismatch")
            return attempt
        case AttemptStatus.FAILED:
            raise ReceiptVerificationError("attempt_already_failed")
        case unreachable:
            assert_never(unreachable)


__all__ = [
    "commit_memory_batch",
    "commit_snapshot_update",
    "prepare_snapshot_update",
    "reconcile_snapshot_attempt",
    "recover_memory_batch",
    "recover_snapshot_update",
]
