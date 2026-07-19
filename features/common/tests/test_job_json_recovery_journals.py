from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path

import pytest
from fastapi import HTTPException

from features.agent_mode.work_log_http_schema import WorkLogQuery
from features.agent_mode.work_log_routes import list_work_log
from features.common import jobs, jobs_routes
from features.common.job_json_artifacts import (
    CommitInterruptedError,
    JobArtifactWorkspace,
    JsonArtifactSpec,
    recover_json_jobs_startup,
)
from features.common.job_json_schema import (
    CommitJournalStatus,
    JobCommitJournal,
    ManifestArtifact,
)
from features.common.shared_jobs_private import JobPrivateLifecycle
from features.common.shared_jobs_projection import new_shared_job
from features.common.shared_jobs_schema import (
    ExpectedArtifact,
    JobStatus,
    StorageKind,
    TaskType,
)
from features.common.shared_jobs_store import JobsStoreUnavailableError, SharedJobStore


NOW = datetime(2026, 7, 19, 0, 0, tzinfo=UTC)


def clock() -> datetime:
    return NOW


def new_review_job():
    return new_shared_job(
        kind="agent_bridge",
        task_type="investment_review",
        generation_mode="llm_cli",
        adapter="codex",
        requested_mode="cli",
        mode="generate",
        attempted_engine="cli",
        clock=clock,
    )


def store_for(data_root: Path) -> SharedJobStore:
    return SharedJobStore(
        data_root / "jobs-v2.json",
        data_root / "jobs.json",
        clock=clock,
    )


def journal(job_id: str, operation_id: str = "op-orphan") -> JobCommitJournal:
    expected = ExpectedArtifact(
        storage=StorageKind.JSON,
        type="investment_review",
        id="2026-07-19",
        baseHash=None,
        baseMarker=None,
        targetRevision=None,
        targetHash="a" * 64,
    )
    artifact = ManifestArtifact(
        expected=expected,
        targetRelativePath="investment-review/2026-07-19.json",
        stageFile="000.json",
        reportKind=None,
        canonicalContentHash=None,
        canonicalChanged=None,
    )
    return JobCommitJournal(
        jobId=job_id,
        operationId=operation_id,
        taskType=TaskType.INVESTMENT_REVIEW,
        expectedArtifacts=[expected],
        artifacts=[artifact],
        status=CommitJournalStatus.PREPARED,
        createdAt="2026-07-19T00:00:00Z",
        updatedAt="2026-07-19T00:00:00Z",
    )


def test_no_job_journal_is_preserved_and_jobs_routes_fail_closed(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    # Given: a schema-valid commit journal whose strict owner has no SharedJob.
    data_root = tmp_path / "data"
    monkeypatch.setattr(jobs, "JOBS_PATH", data_root / "jobs.json")
    monkeypatch.setattr(jobs, "JOBS", {})
    monkeypatch.setattr(jobs, "_LIFECYCLES", {})
    journal_path = (
        data_root
        / "job-commits"
        / "job_00000000-0000-4000-8000-000000000002.json"
    )
    journal_path.parent.mkdir(parents=True)
    journal_path.write_text(
        journal(journal_path.stem).model_dump_json(indent=2),
        encoding="utf-8",
    )

    # When: the shared startup seam and both public route handlers run.
    jobs.load_jobs()

    # Then: repair metadata survives and both routes expose stable 503 outcomes.
    assert journal_path.is_file()
    with pytest.raises(HTTPException) as jobs_error:
        jobs_routes.list_jobs()
    with pytest.raises(HTTPException) as work_log_error:
        list_work_log(WorkLogQuery())
    assert jobs_error.value.status_code == 503
    assert work_log_error.value.status_code == 503

    # When/Then: removing the repaired journal and rerunning startup reopens reads.
    journal_path.unlink()
    jobs.load_jobs()
    assert jobs_routes.list_jobs() == []
    assert list_work_log(WorkLogQuery())["total"] == 0


def test_irreconcilable_linked_journal_is_preserved_and_blocks_reads(
    tmp_path: Path,
) -> None:
    # Given: a prepared journal linked to a job that never entered committing.
    data_root = tmp_path / "data"
    store = store_for(data_root)
    lifecycle = JobPrivateLifecycle(data_root / "job-context", clock=clock)
    job = new_review_job()
    store.add(job)
    journal_path = data_root / "job-commits" / f"{job.id}.json"
    journal_path.parent.mkdir(parents=True)
    journal_path.write_text(
        journal(job.id, "op-irreconcilable").model_dump_json(indent=2),
        encoding="utf-8",
    )

    # When: startup cannot reconcile the journal to a committing job.
    recover_json_jobs_startup(data_root, store, lifecycle, clock=clock)

    # Then: the journal remains available for repair and reads fail closed.
    assert journal_path.is_file()
    with pytest.raises(JobsStoreUnavailableError):
        lifecycle.assert_readable()


def test_valid_done_residual_journal_is_cleaned_without_blocking_reads(
    tmp_path: Path,
) -> None:
    # Given: a real artifact commit crashes after durable terminal job write.
    data_root = tmp_path / "data"
    store = store_for(data_root)
    lifecycle = JobPrivateLifecycle(data_root / "job-context", clock=clock)
    job = new_review_job()
    store.add(job)
    store.transition(job.id, JobStatus.RUNNING)
    running = store.get(job.id)
    assert running is not None
    workspace = JobArtifactWorkspace(data_root, clock=clock)
    bundle = workspace.stage(
        running,
        [
            JsonArtifactSpec(
                storage=StorageKind.JSON,
                artifact_type="investment_review",
                artifact_id="2026-07-19",
                exact_path=data_root / "investment-review" / "2026-07-19.json",
                payload={"date": "2026-07-19", "summary": "done residual"},
            )
        ],
        terminal_result={
            "artifactId": "2026-07-19",
            "reportId": "2026-07-19",
            "date": "2026-07-19",
        },
    )

    def interrupt(phase: str) -> None:
        if phase == "job_terminal":
            raise CommitInterruptedError(phase)

    with pytest.raises(CommitInterruptedError):
        workspace.commit(bundle, store, lifecycle, fault_hook=interrupt)
    journal_path = data_root / "job-commits" / f"{job.id}.json"
    assert journal_path.is_file()

    # When: the next startup classifies the exact terminal residue.
    restarted = JobPrivateLifecycle(data_root / "job-context", clock=clock)
    recover_json_jobs_startup(data_root, store, restarted, clock=clock)

    # Then: only the valid residual journal is removed and reads stay available.
    assert not journal_path.exists()
    terminal = store.get(job.id)
    assert terminal is not None and terminal.status is JobStatus.DONE
    restarted.assert_readable()
