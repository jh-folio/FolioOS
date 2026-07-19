from __future__ import annotations

from datetime import UTC, datetime

import pytest

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
from features.common.sql_job_lifecycle import SqlJobLifecycle, SqlJobLifecycleError


NOW = datetime(2026, 7, 18, 1, 2, 3, tzinfo=UTC)


def _running_snapshot_lifecycle(tmp_path) -> tuple[SqlJobLifecycle, SharedJobStore, str]:
    store = SharedJobStore(tmp_path / "jobs-v2.json", tmp_path / "jobs.json", clock=lambda: NOW)
    private = JobPrivateLifecycle(tmp_path / "job-context", clock=lambda: NOW)
    job = new_shared_job(
        kind=JobKind.MARKET_STATE_SNAPSHOT,
        task_type=TaskType.MARKET_STATE_SNAPSHOT,
        generation_mode=GenerationMode.LLM_CLI,
        adapter=Adapter.CODEX,
        requested_mode=None,
        mode=JobMode.GENERATE,
        attempted_engine=Engine.CLI,
        clock=lambda: NOW,
    )
    store.add(job)
    store.transition(job.id, JobStatus.RUNNING)
    return SqlJobLifecycle(store, private), store, job.id


def _artifact(artifact_type: str, artifact_id: str) -> ExpectedArtifact:
    return ExpectedArtifact(
        storage=StorageKind.SQLITE,
        type=artifact_type,
        id=artifact_id,
        baseHash=None,
        baseMarker=None,
        targetRevision=None,
        targetHash="a" * 64,
    )


def test_claim_rejects_wrong_sql_artifact_for_task(tmp_path) -> None:
    # Given
    lifecycle, store, job_id = _running_snapshot_lifecycle(tmp_path)
    job = store.get(job_id)
    assert job is not None
    projection = project_terminal_result(
        job,
        JobStatus.DONE,
        {"artifactId": job_id, "snapshotId": job_id},
    )

    # When / Then
    with pytest.raises(SqlJobLifecycleError, match="sql_artifact_set_invalid"):
        lifecycle.claim(job_id, "op-invalid-artifact", (_artifact("market_memory_batch", job_id),), projection)
    current = store.get(job_id)
    assert current is not None and current.status is JobStatus.RUNNING


def test_claim_rejects_snapshot_projection_link_mismatch(tmp_path) -> None:
    # Given
    lifecycle, store, job_id = _running_snapshot_lifecycle(tmp_path)
    job = store.get(job_id)
    assert job is not None
    projection = project_terminal_result(
        job,
        JobStatus.DONE,
        {"artifactId": "snapshot-other", "snapshotId": "snapshot-other"},
    )

    # When / Then
    with pytest.raises(SqlJobLifecycleError, match="sql_projection_linkage_invalid"):
        lifecycle.claim(
            job_id,
            "op-invalid-link",
            (_artifact("market_state_snapshot", "snapshot-expected"),),
            projection,
        )
    current = store.get(job_id)
    assert current is not None and current.status is JobStatus.RUNNING


def test_claim_rejects_whitespace_operation_id_before_persisting_intent(tmp_path) -> None:
    # Given
    lifecycle, store, job_id = _running_snapshot_lifecycle(tmp_path)
    job = store.get(job_id)
    assert job is not None
    projection = project_terminal_result(
        job,
        JobStatus.DONE,
        {"artifactId": "snapshot-1", "snapshotId": "snapshot-1"},
    )

    # When / Then
    with pytest.raises(SqlJobLifecycleError, match="operation_id_required"):
        lifecycle.claim(
            job_id,
            " ",
            (_artifact("market_state_snapshot", "snapshot-1"),),
            projection,
        )
    current = store.get(job_id)
    assert current is not None and current.status is JobStatus.RUNNING
