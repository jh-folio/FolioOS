from __future__ import annotations

from collections.abc import Callable
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from features.agent_mode.work_log import WorkLogService
from features.agent_mode.work_log_http_schema import (
    ClearPreviewRequest,
    ClearPreviewResponse,
    ClearRequest,
    ClearResponse,
    MigrationConfirmRequest,
    MigrationConfirmResponse,
    MigrationPreviewRequest,
    MigrationPreviewResponse,
    WorkLogListResponse,
    WorkLogQuery,
)
from features.agent_mode.work_log_store import WorkLogStoreUnavailableError
from features.agent_mode.work_log_token import WorkLogConflictError, WorkLogValidationError
from features.common import jobs
from features.common.jcs import JsonValue
from features.common.shared_jobs_store import (
    JobsStoreUnavailableError,
    LegacyJobCollisionError,
    SharedJobStore,
)


type JsonObject = dict[str, JsonValue]


def _clock() -> datetime:
    return datetime.now(UTC)


def _service() -> WorkLogService:
    legacy_path = jobs.JOBS_PATH
    return WorkLogService(
        SharedJobStore(legacy_path.with_name("jobs-v2.json"), legacy_path, clock=_clock),
        legacy_path.with_name("agent-work-log.json"),
        legacy_path.parent / "agent-proposals",
        clock=_clock,
    )


def _execute(operation: Callable[[], JsonObject]) -> JsonObject:
    try:
        jobs.private_lifecycle().assert_readable()
        return operation()
    except JobsStoreUnavailableError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "jobs_store_unavailable"},
        ) from error
    except WorkLogStoreUnavailableError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "work_log_store_unavailable"},
        ) from error
    except LegacyJobCollisionError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "legacy_job_collision"},
        ) from error
    except WorkLogConflictError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": error.code},
        ) from error
    except WorkLogValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={"code": error.code},
        ) from error


router = APIRouter(prefix="/api/agent/work-log", tags=["agent-work-log"])


@router.get("", response_model=WorkLogListResponse)
def list_work_log(query: Annotated[WorkLogQuery, Query()]) -> JsonObject:
    return _execute(
        lambda: _service().list(
            limit=query.limit,
            offset=query.offset,
            kind=query.kind,
        )
    )


@router.post("/clear-preview", response_model=ClearPreviewResponse)
def clear_preview(body: ClearPreviewRequest) -> JsonObject:
    return _execute(lambda: _service().clear_preview(body.scope))


@router.delete("", response_model=ClearResponse)
def clear_work_log(body: ClearRequest) -> JsonObject:
    return _execute(lambda: _service().clear(body.scope, body.previewToken))


@router.post("/migration-preview", response_model=MigrationPreviewResponse)
def migration_preview(_body: MigrationPreviewRequest) -> JsonObject:
    return _execute(lambda: _service().migration_preview())


@router.post("/migration-confirm", response_model=MigrationConfirmResponse)
def migration_confirm(body: MigrationConfirmRequest) -> JsonObject:
    return _execute(
        lambda: _service().migration_confirm(body.previewToken, body.action.value)
    )
