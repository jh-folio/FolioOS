from __future__ import annotations

import json
from collections.abc import Callable, Mapping
from datetime import UTC, datetime
from typing import assert_never
from uuid import uuid4

from features.agent_mode import service as agent_service
from features.common import jobs
from features.common.canonical_identity import ReportKind
from features.common.canonical_json import JsonValue
from features.common.job_json_producer_types import (
    BriefingJobRequest,
    InvestmentReviewJobRequest,
    OverlayJobRequest,
    QualityRepairJobRequest,
    ReportJobRequest,
)
from features.common.job_json_producers import JobJsonProducers
from features.common.shared_jobs_projection import utc_z
from features.common.shared_jobs_schema import JobStatus, SharedJob, TaskType
from features.common.sql_job_lifecycle import SqlJobLifecycle
from features.market_memory.attempt_store import AttemptScope, AttemptStore
from features.market_memory.memory import connect as connect_market_memory
from features.market_memory.memory import init_db
from features.market_memory.snapshot import ensure_snapshot_table
from features.market_memory.sql_job_service import (
    CombinedMarketJobRequest,
    MarketMemoryJobRequest,
    MarketSqlJobRuntime,
    MarketStateJobRequest,
    run_combined_market_job,
    run_market_memory_job,
    run_market_state_job,
)
from features.thesis_tracking import store as thesis_store
from features.thesis_tracking import review_state as thesis_review_state
from features.thesis_tracking.sql_job_service import ThesisDeltaJobRequest, run_thesis_delta_job


type SnapshotBuilder = Callable[[object], Mapping[str, JsonValue]]


def _clock() -> datetime:
    return datetime.now(UTC)


def _operation_id() -> str:
    return f"op_{uuid4().hex}"


def shared_job(job_id: str) -> SharedJob | None:
    return jobs.get_shared_job(job_id)


def is_durable_job(job_id: str) -> bool:
    return bool(job_id and shared_job(job_id) is not None)


def _running(job_id: str, task_type: TaskType) -> SharedJob:
    job = shared_job(job_id)
    if job is None or job.status is not JobStatus.RUNNING or job.taskType is not task_type:
        raise RuntimeError("shared job is not running for the requested producer")
    return job


def _report_kind(value: str) -> ReportKind:
    normalized = str(value or "").strip().lower()
    if normalized == "briefing":
        return ReportKind.BRIEFING
    if normalized in {"analysis", "company_analysis"}:
        return ReportKind.COMPANY_ANALYSIS
    if normalized == "topic_report":
        return ReportKind.TOPIC_REPORT
    raise ValueError("unsupported canonical report kind")


def _identity(kind: ReportKind, report_id: str, path: str) -> tuple[str, str | None]:
    if kind is not ReportKind.BRIEFING:
        return report_id, None
    stem = path.rsplit("/", 1)[-1].rsplit("\\", 1)[-1].removesuffix(".json")
    if stem.endswith((".us", ".kr")):
        return stem[:-3], stem[-2:]
    if report_id.endswith((".us", ".kr")):
        return report_id[:-3], report_id[-2:]
    raise ValueError("briefing producer requires an exact us or kr scope")


def _json_summary(task_type: TaskType, pack: dict, candidate: dict) -> dict[str, str | int | bool | None]:
    artifact_id = str(candidate.get("id") or pack.get("artifactId") or "")
    generated_at = str(candidate.get("generatedAt") or "")
    report_date = str(candidate.get("date") or generated_at[:10] or pack.get("artifactId") or "")
    summary: dict[str, str | int | bool | None] = {
        "artifactId": artifact_id,
        "title": str(candidate.get("title") or candidate.get("headline") or pack.get("title") or ""),
    }
    if task_type is TaskType.BRIEFING:
        summary["reportId"] = artifact_id
        summary["date"] = report_date
    elif task_type in {TaskType.COMPANY_ANALYSIS, TaskType.TOPIC_REPORT}:
        summary["reportId"] = artifact_id
        summary["date"] = report_date
    elif task_type is TaskType.INVESTMENT_REVIEW:
        summary["reportId"] = artifact_id or report_date
        summary["artifactId"] = artifact_id or report_date
        summary["date"] = report_date
    return summary


def commit_json_output(
    job_id: str,
    task_type: TaskType,
    pack: dict,
    *,
    markdown: str | None,
    payload: dict | None,
) -> dict[str, str | int | bool | None]:
    job = _running(job_id, task_type)
    root = jobs.data_root()
    lifecycle = jobs.private_lifecycle()
    producer = JobJsonProducers(root, clock=_clock)
    match task_type:
        case TaskType.BRIEFING:
            prepared = agent_service.write_briefing_from_markdown(pack, markdown or "", persist=False)
            reports = prepared["reports"]
            result = prepared["result"]
            summary = _json_summary(task_type, pack, result)
            bundle = producer.stage_briefing(
                job,
                BriefingJobRequest(
                    date=str(result.get("date") or pack.get("artifactId") or ""),
                    scopes=tuple(reports),
                    reports=reports,
                    visuals=prepared["visuals"],
                    terminal_result=summary,
                ),
            )
        case TaskType.COMPANY_ANALYSIS:
            candidate = agent_service.write_company_analysis_from_markdown(pack, markdown or "", persist=False)
            from features.company_analysis.service import analysis_report_id

            candidate["id"] = candidate.get("id") or analysis_report_id(candidate.get("company", {}), candidate.get("generatedAt", ""))
            summary = _json_summary(task_type, pack, candidate)
            bundle = producer.stage_company(job, ReportJobRequest(candidate, summary))
        case TaskType.TOPIC_REPORT:
            candidate = agent_service.write_topic_report_from_markdown(pack, markdown or "", persist=False)
            from features.topic_report.service import _stable_topic_id

            candidate["id"] = candidate.get("id") or _stable_topic_id(
                str(candidate.get("date") or ""),
                str(candidate.get("topicKey") or ""),
                str(candidate.get("topicLabel") or ""),
            )
            summary = _json_summary(task_type, pack, candidate)
            bundle = producer.stage_topic(job, ReportJobRequest(candidate, summary))
        case TaskType.PERSONAL_OVERLAY:
            result = agent_service.write_personal_overlay_from_json(pack, payload or {}, persist=False)
            internal = pack.get("internal") or {}
            draft = pack.get("draftArtifact") or {}
            canonical = draft.get("canonical") or {}
            kind = _report_kind(str(internal.get("reportKind") or canonical.get("kind") or ""))
            report_id, scope = _identity(kind, str(canonical.get("id") or ""), str(internal.get("reportPath") or ""))
            summary = {"artifactId": f"{report_id}.{scope}" if scope else report_id, "reportId": report_id}
            bundle = producer.stage_overlay(
                job,
                OverlayJobRequest(kind, report_id, scope, result["personalOverlay"], summary),
            )
        case TaskType.QUALITY_REPAIR:
            candidate = agent_service.write_quality_repair_from_markdown(pack, markdown or "", persist=False)
            internal = pack.get("internal") or {}
            kind = _report_kind(str(internal.get("targetArtifactType") or ""))
            report_id, scope = _identity(
                kind,
                str(internal.get("targetArtifactId") or ""),
                str(pack.get("saveTarget") or ""),
            )
            summary = {"artifactId": f"{report_id}.{scope}" if scope else report_id, "reportId": report_id}
            bundle = producer.stage_quality_repair(
                job,
                QualityRepairJobRequest(kind, report_id, scope, candidate, summary),
            )
        case TaskType.INVESTMENT_REVIEW:
            candidate = agent_service.write_investment_review_from_markdown(pack, markdown or "", persist=False)
            summary = _json_summary(task_type, pack, candidate)
            producer = JobJsonProducers(root, clock=_clock, review_builder=lambda _body: candidate)
            bundle = producer.stage_investment_review(job, InvestmentReviewJobRequest({}, summary))
        case (
            TaskType.INDEX
            | TaskType.RSS
            | TaskType.SETUP
            | TaskType.COMPANION
            | TaskType.THESIS_DELTA
            | TaskType.MARKET_MEMORY_LLM
            | TaskType.MARKET_STATE_SNAPSHOT
            | TaskType.MARKET_MEMORY_UPDATE
        ):
            raise ValueError("task is not a JSON producer")
        case unreachable:
            assert_never(unreachable)
    producer.workspace.commit(bundle, jobs.shared_store(), lifecycle)
    return summary


def _market_runtime() -> MarketSqlJobRuntime:
    return MarketSqlJobRuntime(
        lifecycle=SqlJobLifecycle(jobs.shared_store(), jobs.private_lifecycle()),
        attempts=AttemptStore(jobs.data_root() / "market-state-update-attempts.json"),
        clock=_clock,
    )


def _market_connection():
    connection = connect_market_memory(jobs.data_root() / "market-memory.sqlite3")
    init_db(connection)
    ensure_snapshot_table(connection, initialize_graph=False)
    connection.commit()
    return connection


def run_consultation_job(data_dir: Path, session_id: str, user_message_id: str, *, progress=None, job_id: str = "") -> dict[str, str]:
    """Answer one saved consultation turn and persist the reply outside job telemetry."""
    progress = progress or (lambda *_args, **_kwargs: None)
    from features.agent_mode import bridge
    from features.agent_mode.consultation_context import assemble_consultation_context
    from features.agent_mode.consultation_prompt import build_consultation_prompt, rules_fallback
    from features.agent_mode.consultation_store import append_assistant_message, get_session

    session = get_session(data_dir, session_id)
    user_message = next((row for row in session.get("messages") or [] if row.get("id") == user_message_id and row.get("role") == "user"), None)
    if not user_message:
        raise ValueError("consultation_user_message_not_found")
    progress("상담 문맥을 조립하고 있습니다.", 20)
    context = assemble_consultation_context(data_dir, session_id)
    prompt = build_consultation_prompt(context["serialized"], str(user_message.get("content") or ""))
    engine = "rules"
    reply = rules_fallback(str(user_message.get("content") or ""))
    try:
        if bridge.bridge_status().get("available"):
            progress("Agent가 상담 답변을 작성하고 있습니다.", 50)
            result = bridge.run_agent_prompt(prompt, job_id=job_id)
            output = str(result.get("output") or "").strip()
            if output:
                reply = output
                engine = str(result.get("adapter") or "cli")[:30]
    except Exception:
        # Transcript and private provider errors never enter job result or telemetry.
        engine = "rules"
    append_assistant_message(data_dir, session_id, user_message_id, reply, engine=engine)
    return {"sessionId": session_id, "messageId": user_message_id, "status": "answered"}


def submit_consultation_job(data_dir: Path, session_id: str, user_message_id: str) -> dict:
    job = jobs.submit_job(
        "agent_bridge",
        "투자 상담",
        run_consultation_job,
        Path(data_dir),
        session_id,
        user_message_id,
        pass_job_id=True,
        dedicated_thread=True,
    )
    job["generationMode"] = "llm_cli"
    return job


def commit_thesis_output(job_id: str, pack: dict, payload: dict) -> dict[str, str | int | bool | None]:
    _running(job_id, TaskType.THESIS_DELTA)
    ticker, delta = agent_service.prepare_thesis_delta_writeback(pack, payload)
    generated_at = str(delta.get("generatedAt") or utc_z(_clock()))
    operation_id = _operation_id()
    connection = thesis_store.connect(jobs.data_root() / "market-memory.sqlite3")
    lifecycle = SqlJobLifecycle(jobs.shared_store(), jobs.private_lifecycle())
    try:
        result = run_thesis_delta_job(
            connection,
            lifecycle,
            ThesisDeltaJobRequest(job_id, operation_id, ticker, generated_at, delta, utc_z(_clock())),
        )
        thesis = thesis_store.get_thesis(connection, ticker)
        saved_delta = thesis_store.get_delta(connection, result.delta_id)
        if thesis and saved_delta:
            thesis_review_state.record_completed_review(connection, thesis, saved_delta)
    finally:
        connection.close()
    return {"artifactId": result.delta_id, "reportId": result.delta_id}


def commit_market_memory_output(job_id: str, pack: dict, payload: dict) -> dict[str, str | int | bool | None]:
    _running(job_id, TaskType.MARKET_MEMORY_LLM)
    prepared = agent_service.prepare_market_memory_writeback(pack, payload)
    entries = tuple(prepared["entries"])
    connection = _market_connection()
    try:
        result = run_market_memory_job(
            connection,
            _market_runtime(),
            MarketMemoryJobRequest(job_id, _operation_id(), entries, utc_z(_clock())),
        )
    finally:
        connection.close()
    return {"artifactId": job_id, "savedCount": result.saved_count, "date": str(pack.get("artifactId") or "")}


def commit_market_state_output(job_id: str, pack: dict, payload: dict) -> dict[str, str | int | bool | None]:
    _running(job_id, TaskType.MARKET_STATE_SNAPSHOT)
    snapshot = agent_service.prepare_market_state_snapshot_writeback(pack, payload)
    now = _clock()
    now_text = utc_z(now)
    context = json.loads(str(pack.get("context") or "{}"))
    watermarks = context.get("inputWatermarks") if isinstance(context, dict) else None
    watermark = watermarks.get("GLOBAL") if isinstance(watermarks, dict) else None
    connection = _market_connection()
    try:
        result = run_market_state_job(
            connection,
            _market_runtime(),
            MarketStateJobRequest(
                job_id,
                _operation_id(),
                snapshot,
                AttemptScope.GLOBAL,
                str(watermark or now_text),
                now,
                now_text,
            ),
        )
    finally:
        connection.close()
    return {
        "artifactId": result.snapshot_id,
        "snapshotId": result.snapshot_id,
        "date": str(pack.get("artifactId") or ""),
        "title": str(snapshot.get("headline") or pack.get("title") or ""),
    }


def commit_combined_market_output(
    job_id: str,
    entries: tuple[Mapping[str, JsonValue], ...],
    snapshot_builder: SnapshotBuilder,
) -> dict[str, str | int | bool | None]:
    _running(job_id, TaskType.MARKET_MEMORY_UPDATE)
    now = _clock()
    now_text = utc_z(now)
    connection = _market_connection()
    try:
        result = run_combined_market_job(
            connection,
            _market_runtime(),
            CombinedMarketJobRequest(
                job_id,
                _operation_id(),
                entries,
                snapshot_builder,
                AttemptScope.GLOBAL,
                now_text,
                now,
                now_text,
            ),
        )
    finally:
        connection.close()
    return {
        "artifactId": job_id,
        "savedCount": result.saved_count,
        "snapshotId": result.snapshot_id,
    }


__all__ = [
    "commit_combined_market_output",
    "commit_json_output",
    "commit_market_memory_output",
    "commit_market_state_output",
    "commit_thesis_output",
    "is_durable_job",
    "shared_job",
]
