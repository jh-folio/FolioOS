from __future__ import annotations

from dataclasses import dataclass
from typing import Final, assert_never

from features.common.shared_jobs_completion import ArtifactCompletionProof
from features.common.shared_jobs_private import JobPrivateLifecycle
from features.common.shared_jobs_schema import (
    ArtifactProjection,
    CancelledProjection,
    CompanionProjection,
    CommitIntent,
    ErrorCode,
    ExpectedArtifact,
    FailedProjection,
    IndexProjection,
    JobStatus,
    ResultProjection,
    RssProjection,
    SetupProjection,
    SharedJob,
    StorageKind,
    TaskType,
)
from features.common.shared_jobs_store import SharedJobStore


SQL_TASKS: Final = frozenset(
    {
        TaskType.THESIS_DELTA,
        TaskType.MARKET_MEMORY_LLM,
        TaskType.MARKET_STATE_SNAPSHOT,
        TaskType.MARKET_MEMORY_UPDATE,
    }
)
SQL_ARTIFACT_TYPES: Final = {
    TaskType.THESIS_DELTA: frozenset({"thesis_delta"}),
    TaskType.MARKET_MEMORY_LLM: frozenset({"market_memory_batch"}),
    TaskType.MARKET_STATE_SNAPSHOT: frozenset({"market_state_snapshot"}),
    TaskType.MARKET_MEMORY_UPDATE: frozenset(
        {"market_memory_batch", "market_state_snapshot"}
    ),
}


@dataclass(frozen=True, slots=True)
class SqlJobLifecycleError(Exception):
    code: str

    def __str__(self) -> str:
        return self.code


class SqlJobLifecycle:
    def __init__(self, store: SharedJobStore, private: JobPrivateLifecycle) -> None:
        self._store = store
        self._private = private

    def claim(
        self,
        job_id: str,
        operation_id: str,
        expected_artifacts: tuple[ExpectedArtifact, ...],
        terminal_projection: ResultProjection,
    ) -> CommitIntent:
        job = self._store.get(job_id)
        if job is None:
            raise SqlJobLifecycleError("job_not_found")
        if job.taskType not in SQL_TASKS:
            raise SqlJobLifecycleError("sql_job_task_invalid")
        if not operation_id or operation_id.strip() != operation_id:
            raise SqlJobLifecycleError("operation_id_required")
        if not expected_artifacts or any(
            artifact.storage is not StorageKind.SQLITE for artifact in expected_artifacts
        ):
            raise SqlJobLifecycleError("sqlite_artifacts_required")
        ordered = sorted(
            expected_artifacts,
            key=lambda artifact: (artifact.storage.value, artifact.type, artifact.id),
        )
        if {artifact.type for artifact in ordered} != SQL_ARTIFACT_TYPES[job.taskType] or len(
            ordered
        ) != len(SQL_ARTIFACT_TYPES[job.taskType]):
            raise SqlJobLifecycleError("sql_artifact_set_invalid")
        by_type = {artifact.type: artifact for artifact in ordered}
        match terminal_projection:
            case ArtifactProjection(artifactType=artifact_type, artifactId=artifact_id):
                if artifact_type != job.taskType.value:
                    raise SqlJobLifecycleError("sql_projection_task_invalid")
                memory_id = by_type.get("market_memory_batch")
                snapshot_id = by_type.get("market_state_snapshot")
                thesis_id = by_type.get("thesis_delta")
                expected_id = (
                    thesis_id.id
                    if thesis_id is not None
                    else snapshot_id.id
                    if memory_id is None and snapshot_id is not None
                    else job.id
                )
                if (
                    artifact_id != expected_id
                    or memory_id is not None and memory_id.id != job.id
                    or snapshot_id is not None
                    and terminal_projection.snapshotId != snapshot_id.id
                ):
                    raise SqlJobLifecycleError("sql_projection_linkage_invalid")
            case (
                CancelledProjection()
                | CompanionProjection()
                | FailedProjection()
                | IndexProjection()
                | RssProjection()
                | SetupProjection()
            ):
                raise SqlJobLifecycleError("sql_projection_task_invalid")
            case unreachable:
                assert_never(unreachable)
        intent = CommitIntent(
            operationId=operation_id,
            expectedArtifacts=ordered,
            terminalProjection=terminal_projection,
        )
        self._store.claim_committing(job_id, intent)
        return intent

    def job(self, job_id: str) -> SharedJob | None:
        return self._store.get(job_id)

    def complete(
        self,
        job_id: str,
        proof: ArtifactCompletionProof,
    ) -> None:
        self._private.complete_artifact(
            self._store,
            job_id,
            proof,
        )

    def fail_commit(self, job_id: str) -> None:
        self._private.terminalize(
            self._store,
            job_id,
            JobStatus.FAILED_COMMIT,
            error_code=ErrorCode.SAVE_FAILED,
        )

    def fail_run(self, job_id: str) -> None:
        self._private.terminalize(
            self._store,
            job_id,
            JobStatus.FAILED,
            error_code=ErrorCode.VALIDATION_FAILED,
        )

    def fail_recovery(self, job_id: str) -> None:
        self._private.terminalize_recovery(
            self._store,
            job_id,
            JobStatus.FAILED_COMMIT_RECOVERY,
        )


__all__ = [
    "SQL_ARTIFACT_TYPES",
    "SQL_TASKS",
    "SqlJobLifecycle",
    "SqlJobLifecycleError",
]
