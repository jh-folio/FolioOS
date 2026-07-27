from __future__ import annotations

import os
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import assert_never

import pytest

from features.common.job_json_artifacts import recover_json_jobs_startup
from features.common.shared_jobs_private import JobPrivateLifecycle
from features.common.shared_jobs_projection import new_shared_job, project_terminal_result
from features.common.shared_jobs_schema import (
    CommitIntent,
    ExpectedArtifact,
    JobStatus,
    StorageKind,
    TaskType,
)
from features.common.shared_jobs_store import SharedJobStore


NOW = datetime(2026, 7, 19, 0, 0, tzinfo=UTC)


def clock() -> datetime:
    return NOW


def new_job(task_type: TaskType):
    return new_shared_job(
        kind="agent_bridge",
        task_type=task_type,
        generation_mode="llm_cli",
        adapter="codex",
        requested_mode="cli",
        mode="answer" if task_type is TaskType.COMPANION else "generate",
        attempted_engine="cli",
        clock=clock,
    )


def store_for(data_root: Path) -> SharedJobStore:
    return SharedJobStore(
        data_root / "jobs-v2.json",
        data_root / "jobs.json",
        clock=clock,
    )


def set_modified(path: Path, age: timedelta) -> None:
    modified = (NOW - age).timestamp()
    os.utime(path, (modified, modified))


def active_job(store: SharedJobStore, status: JobStatus):
    task_type = (
        TaskType.MARKET_MEMORY_LLM
        if status is JobStatus.COMMITTING
        else TaskType.COMPANION
    )
    job = new_job(task_type)
    store.add(job)
    match status:
        case JobStatus.QUEUED:
            pass
        case JobStatus.RUNNING:
            store.transition(job.id, JobStatus.RUNNING)
        case JobStatus.CANCEL_REQUESTED:
            store.transition(job.id, JobStatus.RUNNING)
            store.transition(job.id, JobStatus.CANCEL_REQUESTED)
        case JobStatus.COMMITTING:
            store.transition(job.id, JobStatus.RUNNING)
            running = store.get(job.id)
            assert running is not None
            projection = project_terminal_result(
                running,
                JobStatus.DONE,
                {"artifactId": job.id, "savedCount": 1},
            )
            store.claim_committing(
                job.id,
                CommitIntent(
                    operationId=f"op-{job.id}",
                    expectedArtifacts=[
                        ExpectedArtifact(
                            storage=StorageKind.SQLITE,
                            type="market_memory_batch",
                            id=job.id,
                            baseHash=None,
                            baseMarker=None,
                            targetRevision=None,
                            targetHash="a" * 64,
                        )
                    ],
                    terminalProjection=projection,
                ),
            )
        case unreachable:
            assert_never(unreachable)
    current = store.get(job.id)
    assert current is not None
    return current


@pytest.mark.parametrize(
    ("age", "retained"),
    [
        (timedelta(hours=1), True),
        (timedelta(hours=24), True),
        (timedelta(hours=25), False),
    ],
)
def test_unmatched_strict_staging_is_removed_only_after_24_hours(
    tmp_path: Path,
    age: timedelta,
    retained: bool,
) -> None:
    # Given: an unmatched strict job staging owner at a deterministic age.
    data_root = tmp_path / "data"
    store = store_for(data_root)
    lifecycle = JobPrivateLifecycle(data_root / "job-context", clock=clock)
    owner = data_root / "job-staging" / "job_00000000-0000-4000-8000-000000000001"
    owner.mkdir(parents=True)
    set_modified(owner, age)

    # When: JSON startup cleanup classifies the staging owner.
    recover_json_jobs_startup(data_root, store, lifecycle, clock=clock)

    # Then: age <=24h is retained and only age >24h is removed.
    assert owner.exists() is retained


@pytest.mark.parametrize(
    "status",
    [
        JobStatus.QUEUED,
        JobStatus.RUNNING,
        JobStatus.CANCEL_REQUESTED,
        JobStatus.COMMITTING,
    ],
)
def test_matching_active_staging_is_retained_regardless_of_age(
    tmp_path: Path,
    status: JobStatus,
) -> None:
    # Given: an old staging owner still linked to an active or committing job.
    data_root = tmp_path / "data"
    store = store_for(data_root)
    lifecycle = JobPrivateLifecycle(data_root / "job-context", clock=clock)
    job = active_job(store, status)
    owner = data_root / "job-staging" / job.id
    owner.mkdir(parents=True)
    set_modified(owner, timedelta(days=30))

    # When: JSON startup cleanup runs.
    recover_json_jobs_startup(data_root, store, lifecycle, clock=clock)

    # Then: a matching nonterminal owner is never treated as an orphan.
    assert owner.is_dir()
