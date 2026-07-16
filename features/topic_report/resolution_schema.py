from __future__ import annotations

from typing import Literal, Self

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ResolutionModel(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True, strict=True)


class ProviderGenerations(ResolutionModel):
    indexGeneration: str | None
    rssGeneration: str | None


class UnusableCandidate(ResolutionModel):
    candidateId: str = Field(min_length=1, max_length=200)
    reason: Literal["unindexed_rss"]


class ResolutionSnapshotV1(ResolutionModel):
    schemaVersion: Literal[1]
    collectionId: str | None
    collectionRevision: int | None = Field(default=None, ge=1)
    collectionDefinitionHash: str | None
    eligibleTotal: int | None = Field(default=None, ge=0)
    candidateCap: int | None = Field(default=None, ge=1, le=120)
    truncated: bool
    resolvedCandidateIds: list[str] = Field(max_length=120)
    executionUniverseIds: list[str] = Field(max_length=120)
    unusableCandidates: list[UnusableCandidate] = Field(max_length=120)
    selectedEvidenceIds: list[str] = Field(max_length=120)
    providerGenerations: ProviderGenerations
    inputWatermark: str | None

    @model_validator(mode="after")
    def validate_collection_shape(self) -> Self:
        if self.collectionId is None:
            null_fields = (
                self.collectionRevision,
                self.collectionDefinitionHash,
                self.eligibleTotal,
                self.candidateCap,
            )
            if any(value is not None for value in null_fields):
                raise ValueError("null_collection_metadata")
            if self.truncated or self.resolvedCandidateIds or self.executionUniverseIds or self.unusableCandidates:
                raise ValueError("null_collection_candidates")
        elif any(
            value is None
            for value in (
                self.collectionRevision,
                self.collectionDefinitionHash,
                self.eligibleTotal,
                self.candidateCap,
            )
        ):
            raise ValueError("collection_metadata_required")
        return self


class ZeroEvidence(ResolutionModel):
    required: bool
    reasonCode: Literal["no_index", "zero_matches", "filtered_empty"] | None
    resolutionFingerprint: str | None


class ResearchPreview(ResolutionModel):
    resolution: ResolutionSnapshotV1
    resolvedAt: str
    zeroEvidence: ZeroEvidence
