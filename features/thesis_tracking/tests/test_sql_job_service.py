from __future__ import annotations

import sqlite3
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
from features.thesis_tracking import store as thesis_store
from features.thesis_tracking.sql_job_service import (
    ThesisDeltaJobRequest,
    deterministic_delta_id,
    run_thesis_delta_job,
    recover_thesis_delta_job,
)
from features.common.shared_jobs_projection import project_terminal_result
from features.common.shared_jobs_schema import ExpectedArtifact, StorageKind
from features.thesis_tracking.job_writes import commit_thesis_delta, prepare_thesis_delta


NOW = datetime(2026, 7, 18, 1, 2, 3, tzinfo=UTC)
NOW_Z = "2026-07-18T01:02:03Z"


def test_thesis_job_claims_intent_commits_receipt_and_scrubs_private(tmp_path) -> None:
    # Given
    database = sqlite3.connect(":memory:")
    database.row_factory = sqlite3.Row
    thesis_store.init_db(database)
    store = SharedJobStore(tmp_path / "jobs-v2.json", tmp_path / "jobs.json", clock=lambda: NOW)
    private = JobPrivateLifecycle(tmp_path / "job-context", clock=lambda: NOW)
    job = new_shared_job(
        kind=JobKind.AGENT_BRIDGE,
        task_type=TaskType.THESIS_DELTA,
        generation_mode=GenerationMode.LLM_CLI,
        adapter=Adapter.CODEX,
        requested_mode=None,
        mode=JobMode.GENERATE,
        attempted_engine=Engine.CLI,
        clock=lambda: NOW,
    )
    store.add(job)
    store.transition(job.id, JobStatus.RUNNING)
    private.set_private(job.id, {"canary": "private-thesis"})
    operation_id = "op-thesis-001"
    expected_id = deterministic_delta_id("nvda", NOW_Z, operation_id)
    request = ThesisDeltaJobRequest(
        job_id=job.id,
        operation_id=operation_id,
        ticker="nvda",
        generated_at=NOW_Z,
        delta={
            "period": "90d",
            "periodDays": 90,
            "verdict": "maintained",
            "summary": "가설은 유지된다.",
            "evidence": [],
        },
        created_at=NOW_Z,
    )

    # When
    result = run_thesis_delta_job(database, SqlJobLifecycle(store, private), request)

    # Then
    assert result.delta_id == expected_id
    terminal = store.get(job.id)
    assert terminal is not None
    assert terminal.status is JobStatus.DONE
    assert terminal.operationId == operation_id
    assert terminal.artifactRefs[0].model_dump() == {"type": "thesis_delta", "id": expected_id}
    assert database.execute("SELECT delta_id FROM thesis_delta").fetchone()[0] == expected_id
    assert database.execute("SELECT COUNT(*) FROM job_operation_receipts").fetchone()[0] == 1
    assert not private.has_private(job.id)


def test_thesis_restart_recovery_marks_complete_receipt_done(tmp_path) -> None:
    # Given
    database = sqlite3.connect(":memory:")
    database.row_factory = sqlite3.Row
    thesis_store.init_db(database)
    store = SharedJobStore(tmp_path / "jobs-v2.json", tmp_path / "jobs.json", clock=lambda: NOW)
    private = JobPrivateLifecycle(tmp_path / "job-context", clock=lambda: NOW)
    job = new_shared_job(
        kind=JobKind.AGENT_BRIDGE,
        task_type=TaskType.THESIS_DELTA,
        generation_mode=GenerationMode.LLM_CLI,
        adapter=Adapter.CODEX,
        requested_mode=None,
        mode=JobMode.GENERATE,
        attempted_engine=Engine.CLI,
        clock=lambda: NOW,
    )
    store.add(job)
    store.transition(job.id, JobStatus.RUNNING)
    lifecycle = SqlJobLifecycle(store, private)
    operation_id = "op-thesis-recover"
    delta_id = deterministic_delta_id("NVDA", NOW_Z, operation_id)
    projection = project_terminal_result(
        job,
        JobStatus.DONE,
        {"artifactId": delta_id, "reportId": delta_id},
    )
    prepared = prepare_thesis_delta(
        database,
        ticker="NVDA",
        delta={
            "deltaId": delta_id,
            "generatedAt": NOW_Z,
            "period": "90d",
            "periodDays": 90,
            "verdict": "maintained",
            "summary": "가설은 유지된다.",
            "evidence": [],
        },
        job_id=job.id,
        operation_id=operation_id,
        terminal_projection=projection.model_dump(mode="json"),
        created_at=NOW_Z,
    )
    lifecycle.claim(
        job.id,
        operation_id,
        (
            ExpectedArtifact(
                storage=StorageKind.SQLITE,
                type="thesis_delta",
                id=delta_id,
                baseHash=prepared.base_hash,
                baseMarker=None,
                targetRevision=None,
                targetHash=prepared.target_hash,
            ),
        ),
        projection,
    )
    commit_thesis_delta(database, prepared)

    # When
    outcome = recover_thesis_delta_job(database, lifecycle, job.id)

    # Then
    terminal = store.get(job.id)
    assert outcome is JobStatus.DONE
    assert terminal is not None and terminal.status is JobStatus.DONE
    assert terminal.resultProjection == projection


def test_thesis_restart_database_error_marks_failed_commit_recovery(tmp_path, monkeypatch) -> None:
    # Given
    database = sqlite3.connect(":memory:")
    database.row_factory = sqlite3.Row
    thesis_store.init_db(database)
    store = SharedJobStore(tmp_path / "jobs-v2.json", tmp_path / "jobs.json", clock=lambda: NOW)
    private = JobPrivateLifecycle(tmp_path / "job-context", clock=lambda: NOW)
    job = new_shared_job(
        kind=JobKind.AGENT_BRIDGE,
        task_type=TaskType.THESIS_DELTA,
        generation_mode=GenerationMode.LLM_CLI,
        adapter=Adapter.CODEX,
        requested_mode=None,
        mode=JobMode.GENERATE,
        attempted_engine=Engine.CLI,
        clock=lambda: NOW,
    )
    store.add(job)
    store.transition(job.id, JobStatus.RUNNING)
    lifecycle = SqlJobLifecycle(store, private)
    projection = project_terminal_result(
        job,
        JobStatus.DONE,
        {"artifactId": "delta-db-error", "reportId": "delta-db-error"},
    )
    lifecycle.claim(
        job.id,
        "op-thesis-db-error",
        (
            ExpectedArtifact(
                storage=StorageKind.SQLITE,
                type="thesis_delta",
                id="delta-db-error",
                baseHash=None,
                baseMarker=None,
                targetRevision=None,
                targetHash="a" * 64,
            ),
        ),
        projection,
    )

    def fail_receipt(*_args, **_kwargs):
        raise sqlite3.OperationalError("injected recovery read failure")

    monkeypatch.setattr("features.thesis_tracking.sql_job_service.recover_thesis_receipt", fail_receipt)

    # When
    outcome = recover_thesis_delta_job(database, lifecycle, job.id)

    # Then
    terminal = store.get(job.id)
    assert outcome is JobStatus.FAILED_COMMIT_RECOVERY
    assert terminal is not None and terminal.status is JobStatus.FAILED_COMMIT_RECOVERY


def test_thesis_prepare_failure_terminalizes_running_job(tmp_path, monkeypatch) -> None:
    # Given
    database = sqlite3.connect(":memory:")
    database.row_factory = sqlite3.Row
    thesis_store.init_db(database)
    store = SharedJobStore(tmp_path / "jobs-v2.json", tmp_path / "jobs.json", clock=lambda: NOW)
    private = JobPrivateLifecycle(tmp_path / "job-context", clock=lambda: NOW)
    job = new_shared_job(
        kind=JobKind.AGENT_BRIDGE,
        task_type=TaskType.THESIS_DELTA,
        generation_mode=GenerationMode.LLM_CLI,
        adapter=Adapter.CODEX,
        requested_mode=None,
        mode=JobMode.GENERATE,
        attempted_engine=Engine.CLI,
        clock=lambda: NOW,
    )
    store.add(job)
    store.transition(job.id, JobStatus.RUNNING)
    lifecycle = SqlJobLifecycle(store, private)

    def fail_prepare(*_args, **_kwargs):
        raise ReceiptVerificationError("injected_prepare_failure")

    monkeypatch.setattr("features.thesis_tracking.sql_job_service.prepare_thesis_delta", fail_prepare)
    request = ThesisDeltaJobRequest(
        job.id,
        "op-thesis-prepare-failure",
        "NVDA",
        NOW_Z,
        {"period": "90d", "verdict": "maintained"},
        NOW_Z,
    )

    # When / Then
    with pytest.raises(ReceiptVerificationError, match="injected_prepare_failure"):
        run_thesis_delta_job(database, lifecycle, request)
    terminal = store.get(job.id)
    assert terminal is not None and terminal.status is JobStatus.FAILED
