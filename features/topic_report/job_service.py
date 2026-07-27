from __future__ import annotations

import re
from datetime import UTC, datetime

from features.common import jobs
from features.common.job_json_producer_types import ReportJobRequest
from features.common.job_json_producers import JobJsonProducers
from features.common.quality_generation.loop import apply_quality_loop
from features.common.quality_generation.schema import normalize_quality_mode
from features.common.shared_jobs_schema import JobStatus, TaskType
from features.topic_report.service import _stable_topic_id, generate_topic_report


def _clock() -> datetime:
    return datetime.now(UTC)


def run_topic_report_job(
    params: dict,
    *,
    progress=None,
    job_id: str,
) -> dict[str, str]:
    progress = progress or (lambda *_args, **_kwargs: None)
    job = jobs.get_shared_job(job_id)
    if job is None or job.status is not JobStatus.RUNNING or job.taskType is not TaskType.TOPIC_REPORT:
        raise RuntimeError("topic report SharedJob is not running")
    quality_mode = normalize_quality_mode(params.get("quality_mode", "diagnose_only"))
    progress("테마 분석 자료를 구성하고 있습니다.", 15)
    report = generate_topic_report(
        topic_key=params.get("topic_key", "weekly_market"),
        custom_label=params.get("custom_label", ""),
        user_context=params.get("user_context", ""),
        web_search_override=params.get("web_search_override"),
        llm_override=params.get("llm_override"),
        date=params.get("date", ""),
        use_planner=params.get("use_planner", True) is not False,
        custom_tickers=params.get("custom_tickers") if isinstance(params.get("custom_tickers"), dict) else None,
        quality_mode=quality_mode,
        deep_research=bool(params.get("deep_research")),
    )
    try:
        preflight = report.pop("qualityPreflight", None)
        report = apply_quality_loop("topic_report", report, mode=quality_mode, preflight=preflight)
    except Exception as error:
        report["qualityGeneration"] = {
            "mode": quality_mode,
            "repairApplied": False,
            "repairCount": 0,
            "warnings": [f"quality generation failed: {str(error)[:120]}"],
        }
    date = str(report.get("date") or params.get("date") or "")
    topic_key = re.sub(r"[^a-z0-9_]", "_", str(report.get("topicKey") or params.get("topic_key") or "report"))
    topic_label = str(report.get("topicLabel") or params.get("custom_label") or "")
    report_id = str(report.get("id") or _stable_topic_id(date, topic_key, topic_label))
    report["id"] = report_id
    summary = {
        "artifactId": report_id,
        "reportId": report_id,
        "date": date,
        "title": str(report.get("title") or topic_label),
    }
    progress("테마 분석 결과를 안전하게 저장하고 있습니다.", 85)
    producer = JobJsonProducers(jobs.data_root(), clock=_clock)
    bundle = producer.stage_topic(job, ReportJobRequest(report, summary))
    producer.workspace.commit(bundle, jobs.shared_store(), jobs.private_lifecycle())
    return summary


__all__ = ["run_topic_report_job"]
