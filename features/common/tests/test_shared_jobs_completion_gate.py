from __future__ import annotations

import inspect
from datetime import UTC, datetime
from pathlib import Path

import pytest

from features.common import jobs
from features.common.shared_jobs_schema import (
    CommitIntent,
    ExpectedArtifact,
    JobStatus,
    StorageKind,
)


NOW = datetime(2026, 7, 19, 0, 0, tzinfo=UTC)


def clock() -> datetime:
    return NOW


def queued(task_type: str = "companion"):
    return jobs.new_shared_job(
        kind="agent_bridge",
        task_type=task_type,
        generation_mode="llm_cli",
        adapter="codex",
        requested_mode="cli",
        mode="answer" if task_type == "companion" else "generate",
        attempted_engine="cli",
        clock=clock,
    )


def topic_result() -> dict[str, str]:
    return {
        "artifactId": "topic-01",
        "reportId": "topic-01",
        "date": "2026-07-19",
        "title": "Topic",
    }


def topic_intent(job) -> CommitIntent:
    return CommitIntent(
        operationId="op-topic-01",
        expectedArtifacts=[
            ExpectedArtifact(
                storage=StorageKind.JSON,
                type="topic_report",
                id="topic-01",
                baseHash=None,
                baseMarker=None,
                targetRevision=1,
                targetHash="a" * 64,
            )
        ],
        terminalProjection=jobs.project_terminal_result(job, JobStatus.DONE, topic_result()),
    )


def source_job(store: jobs.SharedJobStore, source: JobStatus):
    task_type = "topic_report" if source is JobStatus.COMMITTING else "companion"
    job = queued(task_type)
    store.add(job)
    if source is JobStatus.QUEUED:
        return job
    store.transition(job.id, JobStatus.RUNNING)
    if source is JobStatus.RUNNING:
        return store.get(job.id)
    if source is JobStatus.CANCEL_REQUESTED:
        store.transition(job.id, JobStatus.CANCEL_REQUESTED)
        return store.get(job.id)
    if source is JobStatus.COMMITTING:
        running = store.get(job.id)
        assert running is not None
        store.claim_committing(job.id, topic_intent(running))
        return store.get(job.id)
    raise AssertionError(source)


def test_fabricated_commit_intent_cannot_use_generic_done_transition(tmp_path: Path) -> None:
    # Given: a committing Topic job with syntactically valid intent but no target or journal.
    store = jobs.SharedJobStore(tmp_path / "jobs-v2.json", tmp_path / "jobs.json", clock=clock)
    job = source_job(store, JobStatus.COMMITTING)
    assert job is not None
    before = store.path.read_bytes()

    # When/Then: the generic store transition cannot certify artifact completion.
    with pytest.raises(jobs.JobTransitionError):
        store.transition(job.id, JobStatus.DONE, result=topic_result())
    assert store.path.read_bytes() == before
    assert store.get(job.id).status is JobStatus.COMMITTING


def test_artifact_completion_rejects_an_unsealed_caller_value(tmp_path: Path) -> None:
    # Given: the same receipt-less committing state and an arbitrary caller object.
    store = jobs.SharedJobStore(tmp_path / "jobs-v2.json", tmp_path / "jobs.json", clock=clock)
    job = source_job(store, JobStatus.COMMITTING)
    assert job is not None
    complete = getattr(store, "complete_artifact", None)
    assert complete is not None

    # When/Then: only a producer coordinator's verified proof is accepted.
    with pytest.raises(ValueError):
        complete(job.id, object())
    assert store.get(job.id).status is JobStatus.COMMITTING


@pytest.mark.parametrize(
    ("source", "target", "allowed"),
    [
        (JobStatus.QUEUED, JobStatus.FAILED_RESTART, True),
        (JobStatus.QUEUED, JobStatus.FAILED_COMMIT_RECOVERY, False),
        (JobStatus.RUNNING, JobStatus.FAILED_RESTART, True),
        (JobStatus.RUNNING, JobStatus.FAILED_COMMIT_RECOVERY, False),
        (JobStatus.CANCEL_REQUESTED, JobStatus.FAILED_RESTART, True),
        (JobStatus.CANCEL_REQUESTED, JobStatus.FAILED_COMMIT_RECOVERY, False),
        (JobStatus.COMMITTING, JobStatus.FAILED_RESTART, False),
        (JobStatus.COMMITTING, JobStatus.FAILED_COMMIT_RECOVERY, True),
    ],
)
def test_startup_recovery_transition_matrix_is_exact(
    tmp_path: Path,
    source: JobStatus,
    target: JobStatus,
    allowed: bool,
) -> None:
    store = jobs.SharedJobStore(tmp_path / "jobs-v2.json", tmp_path / "jobs.json", clock=clock)
    job = source_job(store, source)
    assert job is not None
    transition_recovery = getattr(store, "transition_recovery", None)
    assert transition_recovery is not None

    if allowed:
        transition_recovery(job.id, target)
        assert store.get(job.id).status is target
    else:
        before = store.path.read_bytes()
        with pytest.raises(jobs.JobTransitionError):
            transition_recovery(job.id, target)
        assert store.path.read_bytes() == before
        assert store.get(job.id).status is source


@pytest.mark.parametrize(
    "source",
    (
        JobStatus.QUEUED,
        JobStatus.RUNNING,
        JobStatus.CANCEL_REQUESTED,
        JobStatus.COMMITTING,
    ),
)
def test_startup_recovery_api_never_certifies_done(
    tmp_path: Path,
    source: JobStatus,
) -> None:
    store = jobs.SharedJobStore(tmp_path / "jobs-v2.json", tmp_path / "jobs.json", clock=clock)
    job = source_job(store, source)
    assert job is not None
    transition_recovery = getattr(store, "transition_recovery", None)
    assert transition_recovery is not None
    before = store.path.read_bytes()

    with pytest.raises(jobs.JobTransitionError):
        transition_recovery(job.id, JobStatus.DONE)
    assert store.path.read_bytes() == before
    assert store.get(job.id).status is source


@pytest.mark.parametrize(
    ("source", "target"),
    [
        (JobStatus.QUEUED, JobStatus.FAILED_RESTART),
        (JobStatus.RUNNING, JobStatus.FAILED_RESTART),
        (JobStatus.CANCEL_REQUESTED, JobStatus.FAILED_RESTART),
        (JobStatus.COMMITTING, JobStatus.FAILED_COMMIT_RECOVERY),
    ],
)
def test_non_recovery_transition_rejects_startup_only_targets(
    tmp_path: Path,
    source: JobStatus,
    target: JobStatus,
) -> None:
    store = jobs.SharedJobStore(tmp_path / "jobs-v2.json", tmp_path / "jobs.json", clock=clock)
    job = source_job(store, source)
    assert job is not None
    before = store.path.read_bytes()

    with pytest.raises(jobs.JobTransitionError):
        store.transition(job.id, target)
    assert store.path.read_bytes() == before
    assert store.get(job.id).status is source


def test_generic_transition_has_no_startup_escape_parameter() -> None:
    assert "startup" not in inspect.signature(jobs.SharedJobStore.transition).parameters
