from __future__ import annotations

from datetime import UTC, datetime

from features.common.shared_jobs_completion import (
    ArtifactCompletionSource,
    _mint_artifact_completion_proof,
)
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


NOW = datetime(2026, 7, 18, 1, 2, 3, tzinfo=UTC)


def test_claim_persists_intent_before_done_and_scrubs_private(tmp_path) -> None:
    # Given
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
    running = store.get(job.id)
    assert running is not None
    projection = project_terminal_result(
        running,
        JobStatus.DONE,
        {"artifactId": "delta-1", "reportId": "delta-1"},
    )
    expected = ExpectedArtifact(
        storage=StorageKind.SQLITE,
        type="thesis_delta",
        id="delta-1",
        baseHash=None,
        baseMarker=None,
        targetRevision=None,
        targetHash="a" * 64,
    )
    lifecycle = SqlJobLifecycle(store, private)

    # When
    lifecycle.claim(job.id, "op-thesis", (expected,), projection)

    # Then
    committing = store.get(job.id)
    assert committing is not None
    assert committing.status is JobStatus.COMMITTING
    assert committing.commitIntent is not None
    assert committing.artifactRefs[0].model_dump() == {"type": "thesis_delta", "id": "delta-1"}
    assert private.has_private(job.id)

    # When
    proof = _mint_artifact_completion_proof(
        committing,
        ArtifactCompletionSource.SQLITE,
    )
    lifecycle.complete(job.id, proof)

    # Then
    terminal = store.get(job.id)
    assert terminal is not None
    assert terminal.status is JobStatus.DONE
    assert terminal.commitIntent is None
    assert terminal.resultProjection == projection
    assert not private.has_private(job.id)


def test_complete_forwards_sealed_proof_to_private_lifecycle(tmp_path, monkeypatch) -> None:
    # Given
    store = SharedJobStore(tmp_path / "jobs-v2.json", tmp_path / "jobs.json", clock=lambda: NOW)
    private = JobPrivateLifecycle(tmp_path / "job-context", clock=lambda: NOW)
    lifecycle = SqlJobLifecycle(store, private)
    completed: list[tuple[str, object]] = []

    def record_completion(_store, job_id: str, proof) -> None:
        completed.append((job_id, proof))

    monkeypatch.setattr(private, "complete_artifact", record_completion)
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
    projection = project_terminal_result(
        job,
        JobStatus.DONE,
        {"artifactId": "delta-1", "reportId": "delta-1"},
    )
    store.add(job)
    store.transition(job.id, JobStatus.RUNNING)
    lifecycle.claim(
        job.id,
        "op-thesis",
        (
            ExpectedArtifact(
                storage=StorageKind.SQLITE,
                type="thesis_delta",
                id="delta-1",
                baseHash=None,
                baseMarker=None,
                targetRevision=None,
                targetHash="a" * 64,
            ),
        ),
        projection,
    )
    committing = store.get(job.id)
    assert committing is not None
    proof = _mint_artifact_completion_proof(
        committing,
        ArtifactCompletionSource.SQLITE,
    )

    # When
    lifecycle.complete(job.id, proof)

    # Then
    assert completed == [(job.id, proof)]
