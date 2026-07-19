from __future__ import annotations

from enum import StrEnum
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field

from features.agent_mode.work_log_schema import WorkLogEntry, WorkLogFilter
from features.common.shared_jobs_schema import UtcZ


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class MigrationAction(StrEnum):
    KEEP = "migrate_keep_original"
    DELETE = "migrate_delete_original"


class Retention(StrictModel):
    maxEntries: Annotated[int, Field(ge=200, le=200)]
    maxDays: Annotated[int, Field(ge=30, le=30)]


class WorkLogListResponse(StrictModel):
    schemaVersion: Annotated[int, Field(ge=1, le=1)]
    storeRevision: Annotated[int, Field(ge=0)]
    jobsStoreRevision: Annotated[int, Field(ge=0)]
    retention: Retention
    total: Annotated[int, Field(ge=0)]
    entries: list[WorkLogEntry]


class WorkLogQuery(StrictModel):
    limit: Annotated[int, Field(ge=1, le=200)] = 200
    offset: Annotated[int, Field(ge=0, le=10_000)] = 0
    kind: WorkLogFilter = WorkLogFilter.ALL


class ClearPreviewRequest(StrictModel):
    scope: WorkLogFilter


class ClearPreviewResponse(StrictModel):
    previewToken: Annotated[str, Field(pattern=r"^wlt1_[A-Za-z0-9_-]{43}$")]
    scope: WorkLogFilter
    count: Annotated[int, Field(ge=0)]
    jobsStoreRevision: Annotated[int, Field(ge=0)]
    expiresAt: UtcZ


class ClearRequest(StrictModel):
    scope: WorkLogFilter
    previewToken: str


class ClearResponse(StrictModel):
    scope: WorkLogFilter
    hiddenCount: Annotated[int, Field(ge=0)]
    jobsStoreRevision: Annotated[int, Field(ge=0)]
    storeRevision: Annotated[int, Field(ge=1)]


class MigrationPreviewRequest(StrictModel):
    pass


class MigrationCollision(StrictModel):
    legacyId: str
    reason: Annotated[str, Field(pattern=r"^id_collision$")]


class MigrationPreviewResponse(StrictModel):
    previewToken: Annotated[str, Field(pattern=r"^wlt1_[A-Za-z0-9_-]{43}$")]
    legacyJobs: Annotated[int, Field(ge=0)]
    migratableJobs: Annotated[int, Field(ge=0)]
    collisions: list[MigrationCollision]
    jobsStoreRevision: Annotated[int, Field(ge=0)]
    expiresAt: UtcZ


class MigrationConfirmRequest(StrictModel):
    previewToken: str
    action: MigrationAction


class MigrationConfirmResponse(StrictModel):
    migratedJobs: Annotated[int, Field(ge=0)]
    derivedVisibleEntries: Annotated[int, Field(ge=0)]
    keptOriginal: bool
    deletedOriginal: bool
    jobsStoreRevision: Annotated[int, Field(ge=0)]
    storeRevision: Annotated[int, Field(ge=1)]
