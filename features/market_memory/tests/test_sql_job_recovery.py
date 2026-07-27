from __future__ import annotations

import sqlite3
from datetime import UTC, datetime

import pytest

from features.common.shared_jobs_private import JobPrivateLifecycle, PrivateCleanupError
from features.common.shared_jobs_projection import new_shared_job, project_terminal_result
from features.common.shared_jobs_schema import (
    Adapter,
    Engine,
    ExpectedArtifact,
    GenerationMode,
    JobKind,
    JobMode,
    JobStatus,
    StorageKind,
    TaskType,
)
from features.common.shared_jobs_store import JobsStoreUnavailableError, SharedJobStore
from features.common.sql_job_lifecycle import SqlJobLifecycle
from features.market_memory.attempt_store import (
    AttemptMode,
    AttemptScope,
    AttemptStart,
    AttemptStatus,
    AttemptStore,
)
from features.market_memory.job_writes import commit_snapshot_update, prepare_snapshot_update
from features.market_memory.sql_job_service import (
    MarketMemoryJobRequest,
    MarketSqlJobRuntime,
    recover_market_sql_job,
    run_market_memory_job,
)
from features.market_memory.tests.sql_receipt_test_support import (
    NOW,
    connection,
    entry,
    snapshot_payload,
)


NOW_DT = datetime(2026, 7, 17, 3, 4, 5, tzinfo=UTC)


def _runtime(
    tmp_path,
) -> tuple[MarketSqlJobRuntime, SharedJobStore, JobPrivateLifecycle]:
    store = SharedJobStore(tmp_path / "jobs-v2.json", tmp_path / "jobs.json", clock=lambda: NOW_DT)
    private = JobPrivateLifecycle(tmp_path / "job-context", clock=lambda: NOW_DT)
    return (
        MarketSqlJobRuntime(
            lifecycle=SqlJobLifecycle(store, private),
            attempts=AttemptStore(tmp_path / "market-state-attempts.json"),
            clock=lambda: NOW_DT,
        ),
        store,
        private,
    )


def _committing_snapshot(tmp_path):
    runtime, store, _private = _runtime(tmp_path)
    job = new_shared_job(
        kind=JobKind.MARKET_STATE_SNAPSHOT,
        task_type=TaskType.MARKET_STATE_SNAPSHOT,
        generation_mode=GenerationMode.LLM_CLI,
        adapter=Adapter.CODEX,
        requested_mode=None,
        mode=JobMode.GENERATE,
        attempted_engine=Engine.CLI,
        clock=lambda: NOW_DT,
    )
    store.add(job)
    store.transition(job.id, JobStatus.RUNNING)
    database = connection()
    operation_id = "op-recover-snapshot"
    attempt = runtime.attempts.start(
        AttemptStart(
            scope=AttemptScope.GLOBAL,
            mode=AttemptMode.STANDALONE_JOB,
            jobId=job.id,
            operationId=operation_id,
            startedAt=NOW_DT,
            inputWatermark=NOW,
        )
    )
    prepared = prepare_snapshot_update(database, snapshot_payload(), attempt.reference())
    projection = project_terminal_result(
        job,
        JobStatus.DONE,
        {"artifactId": prepared.snapshot_id, "snapshotId": prepared.snapshot_id},
    )
    runtime.lifecycle.claim(
        job.id,
        operation_id,
        (
            ExpectedArtifact(
                storage=StorageKind.SQLITE,
                type="market_state_snapshot",
                id=prepared.snapshot_id,
                baseHash=prepared.base_hash,
                baseMarker=None,
                targetRevision=None,
                targetHash=prepared.target_hash,
            ),
        ),
        projection,
    )
    return database, runtime, store, job, attempt, prepared, projection


def test_snapshot_restart_recovery_reconciles_attempt_before_terminal_job(tmp_path) -> None:
    # Given
    database, runtime, store, job, attempt, prepared, projection = _committing_snapshot(tmp_path)
    commit_snapshot_update(database, prepared, projection.model_dump(mode="json"), NOW)

    # When
    outcome = recover_market_sql_job(database, runtime, job.id)

    # Then
    terminal = store.get(job.id)
    recovered_attempt = runtime.attempts.get(attempt.id)
    assert outcome is JobStatus.DONE
    assert terminal is not None and terminal.status is JobStatus.DONE
    assert recovered_attempt.status is AttemptStatus.SUCCESS
    assert recovered_attempt.snapshotId == prepared.snapshot_id


def test_snapshot_restart_without_receipt_fails_job_and_running_attempt(tmp_path) -> None:
    # Given
    database, runtime, store, job, attempt, _prepared, _projection = _committing_snapshot(tmp_path)

    # When
    outcome = recover_market_sql_job(database, runtime, job.id)

    # Then
    terminal = store.get(job.id)
    failed_attempt = runtime.attempts.get(attempt.id)
    assert outcome is JobStatus.FAILED_COMMIT_RECOVERY
    assert terminal is not None and terminal.status is JobStatus.FAILED_COMMIT_RECOVERY
    assert failed_attempt.status is AttemptStatus.FAILED
    assert failed_attempt.errorCode == "commit_recovery_failed"
    assert database.execute("SELECT COUNT(*) FROM market_state_snapshots").fetchone()[0] == 0


def test_private_cleanup_failure_gates_read_then_receipt_recovery_finishes(
    tmp_path,
    monkeypatch,
) -> None:
    # Given
    runtime, store, private = _runtime(tmp_path)
    job = new_shared_job(
        kind=JobKind.AGENT_BRIDGE,
        task_type=TaskType.MARKET_MEMORY_LLM,
        generation_mode=GenerationMode.LLM_CLI,
        adapter=Adapter.CODEX,
        requested_mode=None,
        mode=JobMode.GENERATE,
        attempted_engine=Engine.CLI,
        clock=lambda: NOW_DT,
    )
    store.add(job)
    store.transition(job.id, JobStatus.RUNNING)
    database = connection()
    cleanup_owner = private.cleanup_owner
    monkeypatch.setattr(private, "cleanup_owner", lambda _job_id: False)

    # When / Then
    with pytest.raises(PrivateCleanupError):
        run_market_memory_job(
            database,
            runtime,
            MarketMemoryJobRequest(job.id, "op-cleanup-retry", (entry(),), NOW),
        )
    with pytest.raises(JobsStoreUnavailableError):
        private.assert_readable()
    committing = store.get(job.id)
    assert committing is not None and committing.status is JobStatus.COMMITTING

    # When
    monkeypatch.setattr(private, "cleanup_owner", cleanup_owner)
    outcome = recover_market_sql_job(database, runtime, job.id)

    # Then
    terminal = store.get(job.id)
    assert outcome is JobStatus.DONE
    assert terminal is not None and terminal.status is JobStatus.DONE
    private.assert_readable()


def test_snapshot_restart_database_error_fails_job_and_running_attempt(
    tmp_path,
    monkeypatch,
) -> None:
    # Given
    database, runtime, store, job, attempt, _prepared, _projection = _committing_snapshot(tmp_path)

    def fail_receipts(*_args, **_kwargs):
        raise sqlite3.OperationalError("injected recovery read failure")

    monkeypatch.setattr("features.market_memory.sql_job_recovery._verify_receipts", fail_receipts)

    # When
    outcome = recover_market_sql_job(database, runtime, job.id)

    # Then
    terminal = store.get(job.id)
    failed_attempt = runtime.attempts.get(attempt.id)
    assert outcome is JobStatus.FAILED_COMMIT_RECOVERY
    assert terminal is not None and terminal.status is JobStatus.FAILED_COMMIT_RECOVERY
    assert failed_attempt.status is AttemptStatus.FAILED
    assert failed_attempt.errorCode == "commit_recovery_failed"
