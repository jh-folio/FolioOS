from __future__ import annotations

import re
from enum import StrEnum
from typing import Annotated, Final

from pydantic import BaseModel, ConfigDict, Field, model_validator

from features.common.canonical_identity import ReportKind

UTC_Z_PATTERN: Final = r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$"
HASH_PATTERN: Final = r"^[0-9a-f]{64}$"
PROPOSAL_ID_PATTERN: Final = re.compile(r"^(?:[0-9a-f]{12}|[0-9a-f]{32})$")
UtcZ = Annotated[str, Field(pattern=UTC_Z_PATTERN)]
Sha256 = Annotated[str, Field(pattern=HASH_PATTERN)]


class ProposalIdError(ValueError):
    __slots__ = ("value",)

    def __init__(self, value: str) -> None:
        super().__init__("proposal id must be 12 or 32 lowercase hexadecimal characters")
        self.value = value


def parse_proposal_id(value: str) -> str:
    if PROPOSAL_ID_PATTERN.fullmatch(value) is None:
        raise ProposalIdError(value)
    return value


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class ProposalStatus(StrEnum):
    PENDING = "pending"
    APPLYING = "applying"
    APPLIED = "applied"
    REJECTED = "rejected"
    STALE = "stale"
    CONFLICT = "conflict"
    FAILED_APPLY = "failed_apply"


class ProposalErrorCode(StrEnum):
    BASE_REVISION_STALE = "base_revision_stale"
    SOURCE_VALIDATION_FAILED = "source_validation_failed"
    REQUIRED_SECTION_MISSING = "required_section_missing"
    QUALITY_VALIDATION_FAILED = "quality_validation_failed"
    REPORT_NOT_FOUND = "report_not_found"
    RECOVERY_CONFLICT = "recovery_conflict"
    RECOVERY_VALIDATION_FAILED = "recovery_validation_failed"
    RECOVERY_SAVE_FAILED = "recovery_save_failed"
    INTERNAL_ERROR = "internal_error"


class ProposalMarketScope(StrEnum):
    """Which market's saved file a proposal may change.

    A proposal targets one stored report, so the scope has to name the market
    whose file will be rewritten. Without Europe and Japan here, a revision to a
    Japanese briefing could not be scoped to its own file.
    """
    BOTH = "both"
    ALL = "all"
    MULTI = "multi"
    US = "us"
    KR = "kr"
    EUROPE = "europe"
    JP = "jp"
    NONE = "none"


class ProposalAction(StrEnum):
    APPROVE = "approve"
    REJECT = "reject"


class SourceRefKind(StrEnum):
    URL = "url"
    SOURCE_ID = "source_id"
    DOCUMENT_ID = "document_id"


class RevisionRef(StrictModel):
    number: Annotated[int, Field(ge=1)]
    hash: Sha256


class AllowedSourceRef(StrictModel):
    kind: SourceRefKind
    value: Annotated[str, Field(min_length=1, max_length=2048)]


class ProposalRecord(StrictModel):
    schemaVersion: Annotated[int, Field(ge=2, le=2)] = 2
    id: str
    reportKind: ReportKind
    reportId: Annotated[str, Field(min_length=1, max_length=160)]
    marketScope: ProposalMarketScope
    status: ProposalStatus
    createdAt: UtcZ
    updatedAt: UtcZ
    finishedAt: UtcZ | None
    baseRevision: RevisionRef
    targetRevision: RevisionRef | None
    operationId: str | None
    errorCode: ProposalErrorCode | None
    requestHash: Sha256
    revisedMarkdownHash: Sha256
    diffHash: Sha256
    legacyNormalizationHash: Sha256 | None
    userRequest: Annotated[str, Field(max_length=2000)] | None = None
    summary: Annotated[str, Field(max_length=1000)] | None = None
    revisedMarkdown: Annotated[str, Field(max_length=200_000)] | None = None
    diff: Annotated[str, Field(max_length=100_000)] | None = None
    adapter: Annotated[str, Field(max_length=120)] | None = None
    model: Annotated[str, Field(max_length=120)] | None = None
    allowedSourceRefs: Annotated[list[AllowedSourceRef], Field(max_length=200)] | None = None

    @model_validator(mode="after")
    def validate_state_fields(self) -> "ProposalRecord":
        parse_proposal_id(self.id)
        active = self.status in {ProposalStatus.PENDING, ProposalStatus.APPLYING}
        bodies = (
            self.userRequest,
            self.summary,
            self.revisedMarkdown,
            self.diff,
            self.adapter,
            self.model,
            self.allowedSourceRefs,
        )
        if active and any(value is None for value in bodies):
            msg = "pending/applying proposal requires revision bodies"
            raise ValueError(msg)
        if not active and any(value is not None for value in bodies):
            msg = "terminal proposal must strip revision bodies"
            raise ValueError(msg)
        if self.status == ProposalStatus.PENDING and (self.operationId is not None or self.targetRevision is not None):
            msg = "pending proposal cannot have operation or target revision"
            raise ValueError(msg)
        if self.status == ProposalStatus.APPLYING and (self.operationId is None or self.targetRevision is None):
            msg = "applying proposal requires operation and target revision"
            raise ValueError(msg)
        if active and self.finishedAt is not None:
            msg = "nonterminal proposal cannot have finishedAt"
            raise ValueError(msg)
        if not active and self.finishedAt is None:
            msg = "terminal proposal requires finishedAt"
            raise ValueError(msg)
        return self


class JournalStatus(StrEnum):
    PREPARED = "prepared"
    REPORT_WRITTEN = "report_written"


class ProposalApplyJournal(StrictModel):
    schemaVersion: Annotated[int, Field(ge=1, le=1)] = 1
    proposalId: str
    operationId: Annotated[str, Field(min_length=1, max_length=160)]
    reportKind: ReportKind
    reportId: Annotated[str, Field(min_length=1, max_length=160)]
    baseRevision: RevisionRef
    targetRevision: RevisionRef
    status: JournalStatus


class ProposalActionRequest(StrictModel):
    action: ProposalAction


PENDING_ONLY_FIELDS: Final = (
    "userRequest",
    "summary",
    "revisedMarkdown",
    "diff",
    "adapter",
    "model",
    "allowedSourceRefs",
)
