from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Literal, Protocol

from pydantic import BaseModel, ConfigDict, ValidationError

from features.topic_report.approval_store import (
    ApprovalProof,
    ApprovalRecovery,
    ApprovalStore,
    ApprovalStoreUnavailableError,
)
from features.common.atomic_replace import replace_with_retry


Boundary = Literal["prepared", "job_written", "journal_job_written", "approval_consumed"]


@dataclass(frozen=True, slots=True)
class JobMetadata:
    id: str
    approvalId: str
    planHash: str


class SubmissionJobs(Protocol):
    def write_queued(self, metadata: JobMetadata) -> None: ...

    def read(self, job_id: str) -> JobMetadata | None: ...


@dataclass(frozen=True, slots=True)
class SubmissionRequest:
    proof: ApprovalProof
    jobId: str


@dataclass(frozen=True, slots=True)
class SubmissionError(Exception):
    code: str

    def __str__(self) -> str:
        return self.code


class InjectedSubmissionFailure(SubmissionError):
    def __init__(self, boundary: str) -> None:
        super().__init__(code=f"injected_{boundary}")


class SubmissionRecoveryError(SubmissionError):
    def __init__(self) -> None:
        super().__init__(code="submission_recovery_failed")


class SubmissionJournal(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True, strict=True)

    schemaVersion: Literal[1]
    approvalId: str
    planHash: str
    jobId: str
    status: Literal["prepared", "job_written"]


class SubmissionCoordinator:
    def __init__(self, data_dir: Path, approvals: ApprovalStore) -> None:
        self._directory = data_dir / "topic-plan-submissions"
        self._approvals = approvals

    def _path(self, approval_id: str) -> Path:
        return self._directory / f"{approval_id}.json"

    def _read(self, path: Path) -> SubmissionJournal:
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
            journal = SubmissionJournal.model_validate(payload)
        except (OSError, UnicodeError, json.JSONDecodeError, ValidationError) as exc:
            raise SubmissionRecoveryError from exc
        if path.stem != journal.approvalId:
            raise SubmissionRecoveryError
        return journal

    def _write(self, journal: SubmissionJournal) -> SubmissionJournal:
        self._directory.mkdir(parents=True, exist_ok=True)
        path = self._path(journal.approvalId)
        temporary = path.with_name(path.name + ".tmp")
        temporary.write_text(journal.model_dump_json(indent=2), encoding="utf-8")
        replace_with_retry(temporary, path)
        reread = self._read(path)
        if reread != journal:
            raise SubmissionRecoveryError
        return reread

    @staticmethod
    def _fail(boundary: Boundary, fail_after: str | None) -> None:
        if boundary == fail_after:
            raise InjectedSubmissionFailure(boundary)

    def submit(
        self,
        request: SubmissionRequest,
        jobs: SubmissionJobs,
        failAfter: str | None = None,
    ) -> JobMetadata:
        entry = self._approvals.authorize(request.proof)
        if entry.status == "consumed":
            if entry.jobId is None:
                raise SubmissionRecoveryError
            replay = jobs.read(entry.jobId)
            if replay is None:
                raise ApprovalStoreUnavailableError
            return replay
        metadata = JobMetadata(
            id=request.jobId,
            approvalId=request.proof.id,
            planHash=request.proof.planHash,
        )
        journal = SubmissionJournal(
            schemaVersion=1,
            approvalId=request.proof.id,
            planHash=request.proof.planHash,
            jobId=request.jobId,
            status="prepared",
        )
        self._write(journal)
        self._fail("prepared", failAfter)
        jobs.write_queued(metadata)
        if jobs.read(request.jobId) != metadata:
            raise SubmissionRecoveryError
        self._fail("job_written", failAfter)
        self._write(journal.model_copy(update={"status": "job_written"}))
        self._fail("journal_job_written", failAfter)
        self._approvals.consume(request.proof, request.jobId)
        self._fail("approval_consumed", failAfter)
        self._path(request.proof.id).unlink()
        return metadata

    def recover(self, jobs: SubmissionJobs) -> list[str]:
        if not self._directory.exists():
            return []
        recovered: list[str] = []
        for path in sorted(self._directory.glob("*.json")):
            journal = self._read(path)
            job = jobs.read(journal.jobId)
            if job is not None and job != JobMetadata(
                id=journal.jobId,
                approvalId=journal.approvalId,
                planHash=journal.planHash,
            ):
                raise SubmissionRecoveryError
            self._approvals.reconcile(
                ApprovalRecovery(
                    id=journal.approvalId,
                    planHash=journal.planHash,
                    jobId=journal.jobId if job is not None else None,
                )
            )
            path.unlink()
            recovered.append(journal.approvalId)
        return recovered
