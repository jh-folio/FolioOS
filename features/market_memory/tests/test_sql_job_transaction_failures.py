from __future__ import annotations

from datetime import UTC, datetime

import pytest

from features.common.shared_jobs_private import JobPrivateLifecycle
from features.common.shared_jobs_projection import new_shared_job
from features.common.shared_jobs_schema import (
    Adapter,
    Engine,
    GenerationMode,
    JobKind,
    JobMode,
    JobStatus,
    TaskType,
)
from features.common.shared_jobs_store import SharedJobStore
from features.common.sqlite_receipts import ReceiptVerificationError
from features.common.sql_job_lifecycle import SqlJobLifecycle
from features.market_memory.attempt_store import (
    AttemptScope,
    AttemptStatus,
    AttemptStore,
)
from features.market_memory.graph_plan import graph_hash
from features.market_memory.sql_job_service import (
    CombinedMarketJobRequest,
    MarketMemoryJobRequest,
    MarketSqlJobRuntime,
    MarketStateJobRequest,
    run_combined_market_job,
    run_market_memory_job,
    run_market_state_job,
)
from features.market_memory.tests.sql_receipt_test_support import (
    NOW,
    connection,
    entry,
    snapshot_payload,
)


NOW_DT = datetime(2026, 7, 17, 3, 4, 5, tzinfo=UTC)


def _runtime(tmp_path) -> tuple[MarketSqlJobRuntime, SharedJobStore]:
    store = SharedJobStore(tmp_path / "jobs-v2.json", tmp_path / "jobs.json", clock=lambda: NOW_DT)
    private = JobPrivateLifecycle(tmp_path / "job-context", clock=lambda: NOW_DT)
    return (
        MarketSqlJobRuntime(
            lifecycle=SqlJobLifecycle(store, private),
            attempts=AttemptStore(tmp_path / "market-state-attempts.json"),
            clock=lambda: NOW_DT,
        ),
        store,
    )


def _running_job(store: SharedJobStore, task_type: TaskType):
    job = new_shared_job(
        kind=(
            JobKind.MARKET_STATE_SNAPSHOT
            if task_type is TaskType.MARKET_STATE_SNAPSHOT
            else JobKind.AGENT_BRIDGE
        ),
        task_type=task_type,
        generation_mode=GenerationMode.LLM_CLI,
        adapter=Adapter.CODEX,
        requested_mode=None,
        mode=JobMode.GENERATE,
        attempted_engine=Engine.CLI,
        clock=lambda: NOW_DT,
    )
    store.add(job)
    store.transition(job.id, JobStatus.RUNNING)
    return job


def test_memory_job_fails_commit_when_sql_transaction_rolls_back(tmp_path, monkeypatch) -> None:
    # Given
    runtime, store = _runtime(tmp_path)
    job = _running_job(store, TaskType.MARKET_MEMORY_LLM)
    database = connection()
    before = graph_hash(database)

    def fail_commit(*_args, **_kwargs) -> None:
        raise ReceiptVerificationError("injected_memory_commit_failure")

    monkeypatch.setattr("features.market_memory.sql_job_service.commit_memory_batch", fail_commit)

    # When / Then
    with pytest.raises(ReceiptVerificationError, match="injected_memory_commit_failure"):
        run_market_memory_job(
            database,
            runtime,
            MarketMemoryJobRequest(job.id, "op-memory-failure", (entry(),), NOW),
        )
    failed = store.get(job.id)
    assert failed is not None and failed.status is JobStatus.FAILED_COMMIT
    assert graph_hash(database) == before
    assert database.execute("SELECT COUNT(*) FROM job_operation_receipts").fetchone()[0] == 0


def test_snapshot_job_fails_attempt_and_job_when_sql_transaction_rolls_back(
    tmp_path,
    monkeypatch,
) -> None:
    # Given
    runtime, store = _runtime(tmp_path)
    job = _running_job(store, TaskType.MARKET_STATE_SNAPSHOT)
    database = connection()

    def fail_commit(*_args, **_kwargs) -> None:
        raise ReceiptVerificationError("injected_snapshot_commit_failure")

    monkeypatch.setattr("features.market_memory.sql_job_service.commit_snapshot_update", fail_commit)

    # When / Then
    with pytest.raises(ReceiptVerificationError, match="injected_snapshot_commit_failure"):
        run_market_state_job(
            database,
            runtime,
            MarketStateJobRequest(
                job.id,
                "op-snapshot-failure",
                snapshot_payload(),
                AttemptScope.GLOBAL,
                NOW,
                NOW_DT,
                NOW,
            ),
        )
    failed = store.get(job.id)
    attempt = runtime.attempts.load().attempts[0]
    assert failed is not None and failed.status is JobStatus.FAILED_COMMIT
    assert attempt.status is AttemptStatus.FAILED
    assert attempt.errorCode == "save_failed"
    assert database.execute("SELECT COUNT(*) FROM market_state_snapshots").fetchone()[0] == 0
    assert database.execute("SELECT COUNT(*) FROM job_operation_receipts").fetchone()[0] == 0


def test_combined_job_fails_attempt_and_preserves_graph_when_transaction_rolls_back(
    tmp_path,
    monkeypatch,
) -> None:
    # Given
    runtime, store = _runtime(tmp_path)
    job = _running_job(store, TaskType.MARKET_MEMORY_UPDATE)
    database = connection()
    before = graph_hash(database)

    def fail_commit(*_args, **_kwargs) -> None:
        raise ReceiptVerificationError("injected_combined_commit_failure")

    monkeypatch.setattr("features.market_memory.sql_job_service.commit_combined_update", fail_commit)

    # When / Then
    with pytest.raises(ReceiptVerificationError, match="injected_combined_commit_failure"):
        run_combined_market_job(
            database,
            runtime,
            CombinedMarketJobRequest(
                job.id,
                "op-combined-failure",
                (entry(),),
                lambda _projected: snapshot_payload(),
                AttemptScope.GLOBAL,
                NOW,
                NOW_DT,
                NOW,
            ),
        )
    failed = store.get(job.id)
    attempt = runtime.attempts.load().attempts[0]
    assert failed is not None and failed.status is JobStatus.FAILED_COMMIT
    assert attempt.status is AttemptStatus.FAILED
    assert attempt.errorCode == "save_failed"
    assert graph_hash(database) == before
    assert database.execute("SELECT COUNT(*) FROM market_state_snapshots").fetchone()[0] == 0
    assert database.execute("SELECT COUNT(*) FROM job_operation_receipts").fetchone()[0] == 0


def test_snapshot_prepare_failure_terminalizes_attempt_and_running_job(
    tmp_path,
    monkeypatch,
) -> None:
    # Given
    runtime, store = _runtime(tmp_path)
    job = _running_job(store, TaskType.MARKET_STATE_SNAPSHOT)
    database = connection()

    def fail_prepare(*_args, **_kwargs) -> None:
        raise ReceiptVerificationError("injected_snapshot_prepare_failure")

    monkeypatch.setattr("features.market_memory.sql_job_service.prepare_snapshot_update", fail_prepare)

    # When / Then
    with pytest.raises(ReceiptVerificationError, match="injected_snapshot_prepare_failure"):
        run_market_state_job(
            database,
            runtime,
            MarketStateJobRequest(
                job.id,
                "op-snapshot-prepare-failure",
                snapshot_payload(),
                AttemptScope.GLOBAL,
                NOW,
                NOW_DT,
                NOW,
            ),
        )
    terminal = store.get(job.id)
    attempt = runtime.attempts.load().attempts[0]
    assert terminal is not None and terminal.status is JobStatus.FAILED
    assert attempt.status is AttemptStatus.FAILED
    assert attempt.errorCode == "validation_failed"
