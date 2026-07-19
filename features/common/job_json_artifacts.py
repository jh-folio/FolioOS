from __future__ import annotations

from collections.abc import Callable, Sequence
from datetime import datetime
from pathlib import Path

from features.common.job_json_commit import JobArtifactCommitter
from features.common.job_json_recovery import recover_json_job, recover_json_jobs_startup
from features.common.job_json_schema import (
    ArtifactSpec,
    CanonicalArtifactSpec,
    CommitInterruptedError,
    FaultHook,
    JobArtifactConflictError,
    JobArtifactValidationError,
    JsonArtifactSpec,
    StagedJobBundle,
)
from features.common.job_json_stage import JobArtifactStager
from features.common.shared_jobs_private import JobPrivateLifecycle
from features.common.shared_jobs_schema import SharedJob
from features.common.shared_jobs_store import SharedJobStore


class JobArtifactWorkspace:
    def __init__(self, data_root: Path, *, clock: Callable[[], datetime]) -> None:
        self.stager = JobArtifactStager(data_root, clock=clock)
        self.committer = JobArtifactCommitter(data_root, clock=clock)

    def stage(
        self,
        job: SharedJob,
        specs: Sequence[ArtifactSpec],
        *,
        terminal_result: dict[str, str | int | bool | None],
    ) -> StagedJobBundle:
        return self.stager.stage(job, specs, terminal_result)

    def commit(
        self,
        bundle: StagedJobBundle,
        store: SharedJobStore,
        lifecycle: JobPrivateLifecycle,
        *,
        fault_hook: FaultHook | None = None,
    ) -> None:
        self.committer.commit(bundle, store, lifecycle, fault_hook=fault_hook)


__all__ = [
    "CanonicalArtifactSpec",
    "CommitInterruptedError",
    "JobArtifactConflictError",
    "JobArtifactValidationError",
    "JobArtifactWorkspace",
    "JsonArtifactSpec",
    "recover_json_job",
    "recover_json_jobs_startup",
]
