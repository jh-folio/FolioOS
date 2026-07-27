from __future__ import annotations

from collections.abc import Mapping
from datetime import datetime

from features.common.jcs import JsonValue
from features.common.shared_jobs_projection import new_shared_job, project_terminal_result, utc_z
from features.common.shared_jobs_schema import (
    Adapter,
    Engine,
    ErrorCode,
    GenerationMode,
    JobKind,
    JobMode,
    JobStatus,
    RequestedMode,
    SharedJob,
    TaskType,
)


def _string(raw: Mapping[str, JsonValue], key: str) -> str | None:
    value = raw.get(key)
    return value if isinstance(value, str) and value else None


def _result(raw: Mapping[str, JsonValue]) -> dict[str, str | int | bool | None]:
    value = raw.get("result")
    if not isinstance(value, dict):
        return {}
    allowed = {
        "count",
        "generatedAt",
        "incremental",
        "sqlite",
        "added",
        "total",
        "failed",
        "ok",
        "adapter",
        "proposalId",
        "reportId",
        "id",
        "date",
        "title",
        "artifactId",
        "savedCount",
        "snapshotId",
    }
    return {
        key: item
        for key, item in value.items()
        if key in allowed and (item is None or isinstance(item, (str, int, bool)))
    }


def _kind(raw: Mapping[str, JsonValue]) -> JobKind:
    value = _string(raw, "kind") or JobKind.AGENT_BRIDGE.value
    try:
        return JobKind(value)
    except ValueError:
        return JobKind.AGENT_BRIDGE


def _task(raw: Mapping[str, JsonValue], kind: JobKind) -> TaskType:
    explicit = _string(raw, "taskType")
    if explicit is not None:
        try:
            return TaskType(explicit)
        except ValueError:
            explicit = None
    direct = {
        JobKind.INDEX: TaskType.INDEX,
        JobKind.RSS: TaskType.RSS,
        JobKind.SETUP: TaskType.SETUP,
        JobKind.AGENT_CLI_INSTALL: TaskType.SETUP,
        JobKind.BRIEFING: TaskType.BRIEFING,
        JobKind.COMPANY_ANALYSIS: TaskType.COMPANY_ANALYSIS,
        JobKind.TOPIC_REPORT: TaskType.TOPIC_REPORT,
        JobKind.MARKET_STATE_SNAPSHOT: TaskType.MARKET_STATE_SNAPSHOT,
    }
    return direct.get(kind, TaskType.COMPANION)


def _status(raw: Mapping[str, JsonValue]) -> JobStatus:
    value = _string(raw, "status") or JobStatus.FAILED.value
    aliases = {"failed": JobStatus.FAILED, "cancelled": JobStatus.CANCELLED}
    if value in aliases:
        return aliases[value]
    try:
        return JobStatus(value)
    except ValueError:
        return JobStatus.FAILED


def normalize_legacy_job(job_id: str, raw: Mapping[str, JsonValue], clock) -> SharedJob:
    kind = _kind(raw)
    task = _task(raw, kind)
    generation_value = _string(raw, "generationMode") or (
        GenerationMode.LLM_CLI.value if kind == JobKind.AGENT_BRIDGE else GenerationMode.NONE.value
    )
    adapter_value = _string(raw, "adapter") or (
        Adapter.AUTO.value if kind == JobKind.AGENT_BRIDGE else Adapter.NONE.value
    )
    requested_value = _string(raw, "requestedMode")
    attempted_value = _string(raw, "attemptedEngine")
    mode_value = _string(raw, "mode") or (
        JobMode.ANSWER.value if task == TaskType.COMPANION else JobMode.GENERATE.value
    )
    try:
        generation = GenerationMode(generation_value)
    except ValueError:
        generation = GenerationMode.NONE
    try:
        adapter = Adapter(adapter_value)
    except ValueError:
        adapter = Adapter.NONE
    try:
        requested = RequestedMode(requested_value) if requested_value is not None else None
    except ValueError:
        requested = None
    try:
        attempted = Engine(attempted_value) if attempted_value is not None else None
    except ValueError:
        attempted = None
    try:
        mode = JobMode(mode_value)
    except ValueError:
        mode = JobMode.GENERATE
    base = new_shared_job(
        kind=kind,
        task_type=task,
        generation_mode=generation,
        adapter=adapter,
        requested_mode=requested,
        mode=mode,
        attempted_engine=attempted,
        clock=clock,
        proposal_id=_string(raw, "proposalId"),
    )
    status = _status(raw)
    now = utc_z(clock())
    created = _string(raw, "createdAt") or now
    updated = _string(raw, "updatedAt") or created
    progress_value = raw.get("progress")
    progress = progress_value if isinstance(progress_value, int) else (100 if status in {JobStatus.DONE, JobStatus.CANCELLED} else 0)
    values = base.model_dump(mode="json")
    values.update(
        {
            "id": job_id,
            "status": status.value,
            "messageCode": status.value,
            "progress": max(0, min(progress, 100)),
            "createdAt": created,
            "startedAt": _string(raw, "startedAt"),
            "updatedAt": updated,
            "finishedAt": _string(raw, "finishedAt") if status.value.startswith("failed") or status in {JobStatus.DONE, JobStatus.CANCELLED} else None,
            "errorCode": ErrorCode.INTERNAL_ERROR.value if status.value.startswith("failed") else None,
        }
    )
    interim = SharedJob.model_validate(
        {
            **values,
            "status": JobStatus.RUNNING.value,
            "messageCode": JobStatus.RUNNING.value,
            "resultProjection": None,
            "finishedAt": None,
            "errorCode": None,
        }
    )
    if status in {JobStatus.QUEUED, JobStatus.RUNNING, JobStatus.CANCEL_REQUESTED, JobStatus.COMMITTING}:
        return SharedJob.model_validate(values)
    projection = project_terminal_result(interim, status, _result(raw), ErrorCode.INTERNAL_ERROR)
    values["resultProjection"] = projection.model_dump(mode="json")
    values["finishedAt"] = _string(raw, "finishedAt") or updated
    return SharedJob.model_validate(values)
