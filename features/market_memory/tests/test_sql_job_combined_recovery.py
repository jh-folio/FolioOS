from __future__ import annotations

import sqlite3
from datetime import UTC, datetime

from features.common.shared_jobs_private import JobPrivateLifecycle
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
from features.common.shared_jobs_store import SharedJobStore
from features.common.sql_job_lifecycle import SqlJobLifecycle
from features.market_memory.attempt_store import (
    AttemptMode,
    AttemptScope,
    AttemptStart,
    AttemptStatus,
    AttemptStore,
)
from features.market_memory.graph_plan import graph_hash
from features.market_memory.job_writes import commit_combined_update, prepare_combined_update
from features.market_memory.sql_job_service import MarketSqlJobRuntime, recover_market_sql_job
from features.market_memory.tests.sql_receipt_test_support import (
    NOW,
    connection,
    entry,
    snapshot_payload,
)


NOW_DT = datetime(2026, 7, 17, 3, 4, 5, tzinfo=UTC)


def test_partial_combined_receipts_fail_without_rewriting_committed_rows(tmp_path) -> None:
    # Given
    database = connection()
    store = SharedJobStore(tmp_path / "jobs-v2.json", tmp_path / "jobs.json", clock=lambda: NOW_DT)
    private = JobPrivateLifecycle(tmp_path / "job-context", clock=lambda: NOW_DT)
    runtime = MarketSqlJobRuntime(
        lifecycle=SqlJobLifecycle(store, private),
        attempts=AttemptStore(tmp_path / "market-state-attempts.json"),
        clock=lambda: NOW_DT,
    )
    job = new_shared_job(
        kind=JobKind.AGENT_BRIDGE,
        task_type=TaskType.MARKET_MEMORY_UPDATE,
        generation_mode=GenerationMode.LLM_CLI,
        adapter=Adapter.CODEX,
        requested_mode=None,
        mode=JobMode.GENERATE,
        attempted_engine=Engine.CLI,
        clock=lambda: NOW_DT,
    )
    store.add(job)
    store.transition(job.id, JobStatus.RUNNING)
    operation_id = "op-partial-combined"
    attempt = runtime.attempts.start(
        AttemptStart(
            scope=AttemptScope.GLOBAL,
            mode=AttemptMode.COMBINED_JOB,
            jobId=job.id,
            operationId=operation_id,
            startedAt=NOW_DT,
            inputWatermark=NOW,
        )
    )

    def build_snapshot(_projected: sqlite3.Connection):
        return snapshot_payload()

    prepared = prepare_combined_update(
        database,
        entries=(entry(),),
        snapshot_builder=build_snapshot,
        update_attempt_ref=attempt.reference(),
        prepared_at=NOW,
    )
    projection = project_terminal_result(
        job,
        JobStatus.DONE,
        {
            "artifactId": job.id,
            "savedCount": prepared.graph_plan.saved_count,
            "snapshotId": prepared.snapshot.snapshot_id,
        },
    )
    artifacts = (
        ExpectedArtifact(
            storage=StorageKind.SQLITE,
            type="market_memory_batch",
            id=job.id,
            baseHash=prepared.graph_plan.graph_base_hash,
            baseMarker=None,
            targetRevision=None,
            targetHash=prepared.graph_plan.target_hash,
        ),
        ExpectedArtifact(
            storage=StorageKind.SQLITE,
            type="market_state_snapshot",
            id=prepared.snapshot.snapshot_id,
            baseHash=prepared.snapshot.base_hash,
            baseMarker=None,
            targetRevision=None,
            targetHash=prepared.snapshot.target_hash,
        ),
    )
    runtime.lifecycle.claim(job.id, operation_id, artifacts, projection)
    commit_combined_update(
        database,
        prepared,
        terminal_projection=projection.model_dump(mode="json"),
        created_at=NOW,
    )
    database.execute(
        "DELETE FROM job_operation_receipts WHERE operation_id=? AND artifact_type='market_state_snapshot'",
        (operation_id,),
    )
    database.commit()
    committed_graph_hash = graph_hash(database)

    # When
    outcome = recover_market_sql_job(database, runtime, job.id)

    # Then
    terminal = store.get(job.id)
    failed_attempt = runtime.attempts.get(attempt.id)
    assert outcome is JobStatus.FAILED_COMMIT_RECOVERY
    assert terminal is not None and terminal.status is JobStatus.FAILED_COMMIT_RECOVERY
    assert failed_attempt.status is AttemptStatus.FAILED
    assert graph_hash(database) == committed_graph_hash
    assert database.execute("SELECT COUNT(*) FROM market_memory").fetchone()[0] == 1
    assert database.execute("SELECT COUNT(*) FROM market_state_snapshots").fetchone()[0] == 1
