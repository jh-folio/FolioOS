from __future__ import annotations

import shutil
from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from pathlib import Path

from pydantic import ValidationError

from features.common.job_json_commit import JobArtifactCommitter
from features.common.job_json_schema import (
    CommitJournalStatus,
    JobArtifactConflictError,
    JobArtifactValidationError,
    JobCommitJournal,
    StagedArtifact,
)
from features.common.shared_jobs_schema import (
    JOB_ID_PATTERN,
    TERMINAL_STATUSES,
    ArtifactRef,
    JobStatus,
    SharedJob,
)


def read_commit_journal(path: Path) -> JobCommitJournal | None:
    if not path.exists():
        return None
    try:
        return JobCommitJournal.model_validate_json(path.read_bytes())
    except (OSError, ValidationError) as exc:
        raise JobArtifactValidationError("job commit journal is invalid") from exc


def _done_residual_is_valid(
    data_root: Path,
    journal_path: Path,
    journal: JobCommitJournal,
    job: SharedJob,
    committer: JobArtifactCommitter,
) -> bool:
    expected_refs = [ArtifactRef(type=item.type, id=item.id) for item in journal.expectedArtifacts]
    if (
        journal_path.stem != journal.jobId
        or journal.status is not CommitJournalStatus.ARTIFACTS_WRITTEN
        or job.status is not JobStatus.DONE
        or job.taskType is not journal.taskType
        or job.operationId != journal.operationId
        or job.artifactRefs != expected_refs
    ):
        return False
    root = data_root.resolve(strict=False)
    for item in journal.artifacts:
        exact_path = (root / Path(item.targetRelativePath)).resolve(strict=False)
        try:
            exact_path.relative_to(root)
        except ValueError:
            return False
        staged_path = data_root / "job-staging" / journal.jobId / item.stageFile
        artifact = StagedArtifact(item, exact_path, staged_path, None)
        committer._verify_target(artifact, journal.operationId, journal.jobId)
    return True


def classify_residual_journals(
    data_root: Path,
    jobs_by_id: dict[str, SharedJob],
    committer: JobArtifactCommitter,
) -> set[str]:
    repair_owners: set[str] = set()
    journal_root = data_root / "job-commits"
    if not journal_root.exists():
        return repair_owners
    for path in sorted(journal_root.glob("*.json"), key=lambda item: item.name):
        journal: JobCommitJournal | None = None
        try:
            journal = read_commit_journal(path)
            job = jobs_by_id.get(journal.jobId) if journal is not None else None
            if journal is None or job is None or not _done_residual_is_valid(
                data_root,
                path,
                journal,
                job,
                committer,
            ):
                repair_owners.add(path.stem)
                if journal is not None:
                    repair_owners.add(journal.jobId)
                continue
            path.unlink()
        except (
            JobArtifactConflictError,
            JobArtifactValidationError,
            OSError,
        ):
            repair_owners.add(path.stem)
            if journal is not None:
                repair_owners.add(journal.jobId)
    return repair_owners


def cleanup_staging(
    data_root: Path,
    protected_job_ids: set[str],
    *,
    clock: Callable[[], datetime],
) -> None:
    stage_root = data_root / "job-staging"
    if not stage_root.exists():
        return
    cutoff = clock().astimezone(UTC) - timedelta(hours=24)
    for path in sorted(stage_root.iterdir(), key=lambda item: item.name):
        if (
            not path.is_dir()
            or JOB_ID_PATTERN.fullmatch(path.name) is None
            or path.name in protected_job_ids
        ):
            continue
        modified = datetime.fromtimestamp(path.stat().st_mtime, tz=UTC)
        if modified >= cutoff:
            continue
        shutil.rmtree(path)


def cleanup_json_recovery_residue(
    data_root: Path,
    jobs: list[SharedJob],
    committer: JobArtifactCommitter,
    *,
    clock: Callable[[], datetime],
) -> set[str]:
    jobs_by_id = {job.id: job for job in jobs}
    repair_owners = classify_residual_journals(data_root, jobs_by_id, committer)
    nonterminal = {job.id for job in jobs if job.status not in TERMINAL_STATUSES}
    cleanup_staging(data_root, nonterminal | repair_owners, clock=clock)
    return repair_owners
