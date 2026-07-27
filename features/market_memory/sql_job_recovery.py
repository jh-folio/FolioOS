from __future__ import annotations

import json
import sqlite3
from collections.abc import Callable
from datetime import datetime
from typing import Protocol, assert_never

from pydantic import ValidationError

from features.common.shared_jobs_completion import (
    ArtifactCompletionSource,
    _mint_artifact_completion_proof,
)
from features.common.shared_jobs_schema import (
    ExpectedArtifact,
    JobStatus,
    StorageKind,
    TaskType,
)
from features.common.sqlite_receipts import (
    ReceiptExpectation,
    ReceiptVerificationError,
    read_receipts,
    verify_receipt_set,
)
from features.common.sql_job_lifecycle import SqlJobLifecycle, SqlJobLifecycleError
from features.market_memory.attempt_store import (
    AttemptErrorCode,
    AttemptMode,
    AttemptStatus,
    AttemptStore,
    AttemptTransitionError,
    UpdateAttemptRef,
)
from features.market_memory.snapshot_job import (
    PreparedSnapshot,
    current_snapshot_hash,
    snapshot_row,
)
from features.market_memory.standalone_job import reconcile_snapshot_attempt


class MarketRecoveryRuntime(Protocol):
    lifecycle: SqlJobLifecycle
    attempts: AttemptStore
    clock: Callable[[], datetime]


def _sqlite_artifacts(job_id: str, runtime: MarketRecoveryRuntime) -> tuple[ExpectedArtifact, ...]:
    job = runtime.lifecycle.job(job_id)
    if job is None or job.status is not JobStatus.COMMITTING or job.commitIntent is None:
        raise SqlJobLifecycleError("committing_job_required")
    artifacts = tuple(job.commitIntent.expectedArtifacts)
    if not artifacts or any(artifact.storage is not StorageKind.SQLITE for artifact in artifacts):
        raise SqlJobLifecycleError("sqlite_intent_required")
    return artifacts


def _verify_receipts(
    connection: sqlite3.Connection,
    runtime: MarketRecoveryRuntime,
    job_id: str,
    artifacts: tuple[ExpectedArtifact, ...],
) -> None:
    job = runtime.lifecycle.job(job_id)
    if job is None or job.commitIntent is None:
        raise SqlJobLifecycleError("committing_job_required")
    projection = verify_receipt_set(
        connection,
        job_id,
        job.commitIntent.operationId,
        tuple(
            ReceiptExpectation(artifact.type, artifact.id, artifact.targetHash)
            for artifact in artifacts
        ),
    )
    if projection != job.commitIntent.terminalProjection.model_dump(mode="json"):
        raise ReceiptVerificationError("receipt_intent_projection_mismatch")


def _snapshot_artifact(artifacts: tuple[ExpectedArtifact, ...]) -> ExpectedArtifact:
    matches = [artifact for artifact in artifacts if artifact.type == "market_state_snapshot"]
    if len(matches) != 1:
        raise ReceiptVerificationError("snapshot_artifact_mismatch")
    return matches[0]


def _reconcile_attempt(
    connection: sqlite3.Connection,
    runtime: MarketRecoveryRuntime,
    job_id: str,
    artifact: ExpectedArtifact,
    required_mode: AttemptMode,
) -> None:
    job = runtime.lifecycle.job(job_id)
    if job is None or job.commitIntent is None:
        raise SqlJobLifecycleError("committing_job_required")
    captured = snapshot_row(connection, artifact.id)
    if captured is None or current_snapshot_hash(connection, artifact.id) != artifact.targetHash:
        raise ReceiptVerificationError("snapshot_recovery_hash_mismatch")
    raw, logical = captured
    payload = logical.get("payload")
    if not isinstance(payload, dict):
        raise ReceiptVerificationError("snapshot_payload_invalid")
    try:
        reference = UpdateAttemptRef.model_validate_json(
            json.dumps(payload["updateAttemptRef"], ensure_ascii=False)
        )
        graph_base_hash = str(payload["inputGraphBaseHash"])
        graph_target_hash = str(payload["inputGraphTargetHash"])
    except (KeyError, TypeError, ValueError, ValidationError) as error:
        raise ReceiptVerificationError("snapshot_linkage_invalid") from error
    if (
        reference.mode is not required_mode
        or reference.jobId != job_id
        or reference.operationId != job.commitIntent.operationId
    ):
        raise ReceiptVerificationError("attempt_snapshot_linkage_mismatch")
    prepared = PreparedSnapshot(
        snapshot_id=artifact.id,
        raw_row=raw,
        logical_row=logical,
        base_hash=artifact.baseHash,
        target_hash=artifact.targetHash,
        input_graph_base_hash=graph_base_hash,
        input_graph_target_hash=graph_target_hash,
        update_attempt_ref=reference,
    )
    try:
        runtime.attempts.get(reference.id)
    except AttemptTransitionError as error:
        if error.code != "attempt_not_found":
            raise
        runtime.attempts.start(reference, attempt_id=reference.id)
    receipts = read_receipts(connection, job.commitIntent.operationId)
    saved_at = datetime.fromisoformat(receipts[0].created_at.replace("Z", "+00:00"))
    reconcile_snapshot_attempt(runtime.attempts, prepared, saved_at)


def _fail_running_attempt(runtime: MarketRecoveryRuntime, job_id: str, operation_id: str) -> None:
    for attempt in runtime.attempts.load().attempts:
        if (
            attempt.jobId == job_id
            and attempt.operationId == operation_id
            and attempt.status is AttemptStatus.RUNNING
        ):
            runtime.attempts.fail(
                attempt.id,
                runtime.clock(),
                AttemptErrorCode.COMMIT_RECOVERY_FAILED,
            )


def recover_market_sql_job(
    connection: sqlite3.Connection,
    runtime: MarketRecoveryRuntime,
    job_id: str,
) -> JobStatus:
    job = runtime.lifecycle.job(job_id)
    if job is None or job.commitIntent is None:
        raise SqlJobLifecycleError("committing_job_required")
    operation_id = job.commitIntent.operationId
    try:
        artifacts = _sqlite_artifacts(job_id, runtime)
        match job.taskType:
            case TaskType.MARKET_MEMORY_LLM:
                if len(artifacts) != 1 or artifacts[0].type != "market_memory_batch":
                    raise ReceiptVerificationError("memory_artifact_mismatch")
                _verify_receipts(connection, runtime, job_id, artifacts)
            case TaskType.MARKET_STATE_SNAPSHOT:
                _verify_receipts(connection, runtime, job_id, artifacts)
                _reconcile_attempt(
                    connection,
                    runtime,
                    job_id,
                    _snapshot_artifact(artifacts),
                    AttemptMode.STANDALONE_JOB,
                )
            case TaskType.MARKET_MEMORY_UPDATE:
                if len(artifacts) != 2 or {artifact.type for artifact in artifacts} != {
                    "market_memory_batch",
                    "market_state_snapshot",
                }:
                    raise ReceiptVerificationError("combined_artifact_mismatch")
                _verify_receipts(connection, runtime, job_id, artifacts)
                _reconcile_attempt(
                    connection,
                    runtime,
                    job_id,
                    _snapshot_artifact(artifacts),
                    AttemptMode.COMBINED_JOB,
                )
            case (
                TaskType.INDEX
                | TaskType.RSS
                | TaskType.SETUP
                | TaskType.COMPANION
                | TaskType.BRIEFING
                | TaskType.COMPANY_ANALYSIS
                | TaskType.TOPIC_REPORT
                | TaskType.PERSONAL_OVERLAY
                | TaskType.THESIS_DELTA
                | TaskType.QUALITY_REPAIR
                | TaskType.INVESTMENT_REVIEW
            ):
                raise SqlJobLifecycleError("market_recovery_task_invalid")
            case unreachable:
                assert_never(unreachable)
    except (sqlite3.Error, ReceiptVerificationError, AttemptTransitionError):
        _fail_running_attempt(runtime, job_id, operation_id)
        runtime.lifecycle.fail_recovery(job_id)
        return JobStatus.FAILED_COMMIT_RECOVERY
    proof = _mint_artifact_completion_proof(
        job,
        ArtifactCompletionSource.SQLITE,
    )
    runtime.lifecycle.complete(job_id, proof)
    return JobStatus.DONE


__all__ = ["MarketRecoveryRuntime", "recover_market_sql_job"]
