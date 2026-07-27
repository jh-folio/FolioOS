from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path
from uuid import UUID

import pytest

from features.topic_report.approval_store import ApprovalProof, ApprovalStore, ApprovalStoreRuntime
from features.topic_report.approval_submission import (
    InjectedSubmissionFailure,
    JobMetadata,
    SubmissionCoordinator,
    SubmissionRequest,
)


class InMemoryJobs:
    def __init__(self) -> None:
        self.items: dict[str, JobMetadata] = {}

    def write_queued(self, metadata: JobMetadata) -> None:
        self.items[metadata.id] = metadata

    def read(self, job_id: str) -> JobMetadata | None:
        return self.items.get(job_id)


def make_store(path: Path) -> ApprovalStore:
    return ApprovalStore(
        ApprovalStoreRuntime(
            path=path / "topic-plan-approvals.json",
            clock=lambda: datetime(2026, 7, 16, tzinfo=UTC),
            entropy=lambda size: b"z" * size,
            uuidFactory=lambda: UUID("62345678-1234-4567-9234-567812345678"),
        )
    )


@pytest.mark.parametrize(
    ("boundary", "job_exists"),
    [
        ("prepared", False),
        ("job_written", True),
        ("journal_job_written", True),
        ("approval_consumed", True),
    ],
)
def test_submission_recovery_is_deterministic_at_every_boundary(
    tmp_path: Path,
    boundary: str,
    job_exists: bool,
) -> None:
    given_root = tmp_path / boundary
    given_store = make_store(given_root)
    given_grant = given_store.issue("c" * 64)
    given_proof = ApprovalProof(id=given_grant.id, token=given_grant.token, planHash="c" * 64)
    given_jobs = InMemoryJobs()
    given_coordinator = SubmissionCoordinator(given_root, given_store)
    given_request = SubmissionRequest(proof=given_proof, jobId="job_fixed")

    with pytest.raises(InjectedSubmissionFailure):
        given_coordinator.submit(given_request, given_jobs, failAfter=boundary)
    when_receipts = given_coordinator.recover(given_jobs)

    assert when_receipts == [given_grant.id]
    assert (given_jobs.read("job_fixed") is not None) is job_exists
    assert list((given_root / "topic-plan-submissions").glob("*.json")) == []
    if job_exists:
        assert given_store.authorize(given_proof).jobId == "job_fixed"
    else:
        assert given_store.authorize(given_proof).status == "issued"


def test_submission_journal_contains_only_safe_linkage_metadata(tmp_path: Path) -> None:
    given_store = make_store(tmp_path)
    given_grant = given_store.issue("d" * 64)
    given_proof = ApprovalProof(id=given_grant.id, token=given_grant.token, planHash="d" * 64)
    given_coordinator = SubmissionCoordinator(tmp_path, given_store)

    with pytest.raises(InjectedSubmissionFailure):
        given_coordinator.submit(
            SubmissionRequest(proof=given_proof, jobId="job_safe"),
            InMemoryJobs(),
            failAfter="prepared",
        )
    when_journal = next((tmp_path / "topic-plan-submissions").glob("*.json")).read_text(encoding="utf-8")

    assert set(__import__("json").loads(when_journal)) == {
        "schemaVersion",
        "approvalId",
        "planHash",
        "jobId",
        "status",
    }
    assert given_grant.token not in when_journal
    assert "question" not in when_journal
    assert "context" not in when_journal
