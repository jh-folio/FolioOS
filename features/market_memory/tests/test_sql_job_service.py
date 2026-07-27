from __future__ import annotations

import sqlite3
from datetime import UTC, datetime

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
from features.common.sqlite_receipts import read_receipts
from features.common.sql_job_lifecycle import SqlJobLifecycle
from features.market_memory.attempt_store import (
    AttemptMode,
    AttemptScope,
    AttemptStatus,
    AttemptStore,
)
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


def _runtime(tmp_path) -> tuple[MarketSqlJobRuntime, SharedJobStore, JobPrivateLifecycle]:
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


def _running_job(store: SharedJobStore, task_type: TaskType):
    job = new_shared_job(
        kind=JobKind.MARKET_STATE_SNAPSHOT if task_type is TaskType.MARKET_STATE_SNAPSHOT else JobKind.AGENT_BRIDGE,
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


def test_standalone_memory_job_commits_one_receipt_and_terminal_projection(tmp_path) -> None:
    # Given
    runtime, store, private = _runtime(tmp_path)
    job = _running_job(store, TaskType.MARKET_MEMORY_LLM)
    private.set_private(job.id, {"canary": "memory-private"})
    database = connection()

    # When
    result = run_market_memory_job(
        database,
        runtime,
        MarketMemoryJobRequest(job.id, "op-memory", (entry(),), NOW),
    )

    # Then
    terminal = store.get(job.id)
    assert terminal is not None
    assert terminal.status is JobStatus.DONE
    assert result.saved_count == 1
    assert terminal.resultProjection is not None
    assert terminal.resultProjection.model_dump(mode="json")["savedCount"] is None
    assert len(read_receipts(database, "op-memory")) == 1
    assert not private.has_private(job.id)


def test_standalone_snapshot_job_links_attempt_receipt_and_terminal_job(tmp_path) -> None:
    # Given
    runtime, store, _private = _runtime(tmp_path)
    job = _running_job(store, TaskType.MARKET_STATE_SNAPSHOT)
    database = connection()

    # When
    result = run_market_state_job(
        database,
        runtime,
        MarketStateJobRequest(
            job_id=job.id,
            operation_id="op-snapshot",
            payload=snapshot_payload(),
            scope=AttemptScope.GLOBAL,
            input_watermark=NOW,
            started_at=NOW_DT,
            created_at=NOW,
        ),
    )

    # Then
    terminal = store.get(job.id)
    attempt = runtime.attempts.get(result.attempt_id)
    assert terminal is not None
    assert terminal.status is JobStatus.DONE
    assert attempt.status is AttemptStatus.SUCCESS
    assert attempt.mode is AttemptMode.STANDALONE_JOB
    assert (attempt.jobId, attempt.operationId, attempt.snapshotId) == (
        job.id,
        "op-snapshot",
        result.snapshot_id,
    )
    assert len(read_receipts(database, "op-snapshot")) == 1


def test_combined_job_commits_graph_snapshot_two_receipts_and_one_attempt(tmp_path) -> None:
    # Given
    runtime, store, _private = _runtime(tmp_path)
    job = _running_job(store, TaskType.MARKET_MEMORY_UPDATE)
    database = connection()

    def build_snapshot(projected: sqlite3.Connection):
        payload = snapshot_payload()
        count = projected.execute("SELECT COUNT(*) FROM market_memory").fetchone()[0]
        payload["headline"] = f"projected:{count}"
        return payload

    # When
    result = run_combined_market_job(
        database,
        runtime,
        CombinedMarketJobRequest(
            job_id=job.id,
            operation_id="op-combined",
            entries=(entry(),),
            snapshot_builder=build_snapshot,
            scope=AttemptScope.GLOBAL,
            input_watermark=NOW,
            started_at=NOW_DT,
            prepared_at=NOW,
        ),
    )

    # Then
    terminal = store.get(job.id)
    attempt = runtime.attempts.get(result.attempt_id)
    receipts = read_receipts(database, "op-combined")
    assert terminal is not None
    assert terminal.status is JobStatus.DONE
    assert attempt.status is AttemptStatus.SUCCESS
    assert attempt.mode is AttemptMode.COMBINED_JOB
    assert result.saved_count == 1
    assert len(receipts) == 2
    assert receipts[0].terminal_projection == receipts[1].terminal_projection
    assert database.execute("SELECT COUNT(*) FROM market_memory").fetchone()[0] == 1
    assert database.execute("SELECT COUNT(*) FROM market_state_snapshots").fetchone()[0] == 1
