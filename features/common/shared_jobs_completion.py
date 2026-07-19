from __future__ import annotations

from enum import StrEnum

from features.common.jcs import sha256_hex
from features.common.shared_jobs_schema import JobStatus, ResultProjection, SharedJob, StorageKind


class ArtifactCompletionSource(StrEnum):
    JSON = "json"
    SQLITE = "sqlite"


class ArtifactCompletionProofError(ValueError):
    pass


_PROOF_AUTHORITY = object()


class ArtifactCompletionProof:
    __slots__ = ("job_id", "operation_id", "intent_hash", "source", "__authority")

    job_id: str
    operation_id: str
    intent_hash: str
    source: ArtifactCompletionSource
    __authority: object

    def __init__(self) -> None:
        raise TypeError("artifact completion proofs are coordinator-issued")

    def __setattr__(self, _name: str, _value: object) -> None:
        raise AttributeError("artifact completion proofs are immutable")


def _intent_hash(job: SharedJob) -> str:
    if job.commitIntent is None:
        raise ArtifactCompletionProofError("commit_intent_required")
    return sha256_hex(job.commitIntent.model_dump(mode="json"))


def _validate_source(job: SharedJob, source: ArtifactCompletionSource) -> None:
    if job.commitIntent is None or not job.commitIntent.expectedArtifacts:
        raise ArtifactCompletionProofError("expected_artifacts_required")
    storages = {artifact.storage for artifact in job.commitIntent.expectedArtifacts}
    expected = (
        {StorageKind.JSON, StorageKind.GZIP_JSON}
        if source is ArtifactCompletionSource.JSON
        else {StorageKind.SQLITE}
    )
    if not storages.issubset(expected):
        raise ArtifactCompletionProofError("completion_source_mismatch")


def _mint_artifact_completion_proof(
    job: SharedJob,
    source: ArtifactCompletionSource,
) -> ArtifactCompletionProof:
    if job.status is not JobStatus.COMMITTING or job.commitIntent is None:
        raise ArtifactCompletionProofError("committing_job_required")
    _validate_source(job, source)
    proof = object.__new__(ArtifactCompletionProof)
    object.__setattr__(proof, "job_id", job.id)
    object.__setattr__(proof, "operation_id", job.commitIntent.operationId)
    object.__setattr__(proof, "intent_hash", _intent_hash(job))
    object.__setattr__(proof, "source", source)
    object.__setattr__(proof, "_ArtifactCompletionProof__authority", _PROOF_AUTHORITY)
    return proof


def _validated_artifact_completion(
    proof: object,
    job: SharedJob,
) -> ResultProjection:
    if not isinstance(proof, ArtifactCompletionProof):
        raise ArtifactCompletionProofError("completion_proof_required")
    authority = object.__getattribute__(proof, "_ArtifactCompletionProof__authority")
    if authority is not _PROOF_AUTHORITY:
        raise ArtifactCompletionProofError("completion_proof_invalid")
    if job.status is not JobStatus.COMMITTING or job.commitIntent is None:
        raise ArtifactCompletionProofError("committing_job_required")
    _validate_source(job, proof.source)
    if (
        proof.job_id != job.id
        or proof.operation_id != job.commitIntent.operationId
        or proof.intent_hash != _intent_hash(job)
    ):
        raise ArtifactCompletionProofError("completion_proof_mismatch")
    return job.commitIntent.terminalProjection


__all__ = [
    "ArtifactCompletionProof",
    "ArtifactCompletionProofError",
    "ArtifactCompletionSource",
]
