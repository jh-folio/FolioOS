from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, ConfigDict

from features.common import jobs
from features.common.jcs import JsonValue
from features.common.shared_jobs_private import PrivateCleanupError
from features.common.shared_jobs_store import JobsStoreUnavailableError, JobTransitionError


class EmptyBody(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


router = APIRouter(tags=["jobs"])


def _unavailable() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail={"code": "jobs_store_unavailable"},
    )


@router.get("/api/jobs")
def list_jobs() -> list[dict[str, JsonValue]]:
    try:
        return jobs.recent_jobs()
    except (JobsStoreUnavailableError, PrivateCleanupError) as error:
        raise _unavailable() from error


@router.get("/api/jobs/{job_id}")
def get_job(job_id: str) -> dict[str, JsonValue]:
    try:
        job = jobs.get_job(job_id)
    except (JobsStoreUnavailableError, PrivateCleanupError) as error:
        raise _unavailable() from error
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "job_not_found"},
        )
    return job


def _cancel(job_id: str) -> dict[str, JsonValue]:
    from features.agent_mode.bridge import cancel_agent_task

    try:
        result = cancel_agent_task(job_id)
    except (JobsStoreUnavailableError, PrivateCleanupError) as error:
        raise _unavailable() from error
    except JobTransitionError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "job_not_cancellable"},
        ) from error
    if result.get("error") == "Job not found":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "job_not_found"},
        )
    if result.get("cancelled") is not True:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "job_not_cancellable"},
        )
    return result


@router.post("/api/jobs/{job_id}/cancel")
def cancel_job(job_id: str, _body: EmptyBody) -> dict[str, JsonValue]:
    return _cancel(job_id)


@router.post("/api/agent-bridge/jobs/{job_id}/cancel")
def cancel_agent_alias(job_id: str, _body: EmptyBody) -> dict[str, JsonValue]:
    return _cancel(job_id)
