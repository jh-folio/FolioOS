from __future__ import annotations

import re
from copy import deepcopy
from pathlib import Path
from typing import assert_never

from features.common.canonical_identity import ReportKind, resolve_exact_report_path
from features.common.canonical_report_types import WriteKind
from features.common.job_json_producer_types import OverlayJobRequest, QualityRepairJobRequest, ReportJobRequest
from features.common.job_json_schema import CanonicalArtifactSpec, JobArtifactValidationError
from features.common.research_quality.evaluator import evaluate_artifact


def company_spec(data_root: Path, request: ReportJobRequest) -> CanonicalArtifactSpec:
    from features.company_analysis.service import analysis_report_id

    report = deepcopy(request.report)
    generated_at = report.get("generatedAt")
    company = report.get("company")
    if not isinstance(generated_at, str) or not isinstance(company, dict):
        raise JobArtifactValidationError("company report identity input is invalid")
    report_id = report.get("id") or analysis_report_id(company, generated_at)
    if not isinstance(report_id, str):
        raise JobArtifactValidationError("company report id is invalid")
    report["id"] = report_id
    report["saved"] = True
    report["savedAt"] = report.get("savedAt") or generated_at
    return CanonicalArtifactSpec(
        artifact_type="company_analysis_report",
        artifact_id=report_id,
        report_kind=ReportKind.COMPANY_ANALYSIS,
        exact_path=data_root / "company-analysis" / f"{report_id}.json",
        write_kind=WriteKind.CANONICAL,
        candidate=report,
    )


def topic_spec(data_root: Path, request: ReportJobRequest) -> CanonicalArtifactSpec:
    from features.topic_report.service import _stable_topic_id

    report = deepcopy(request.report)
    date = report.get("date")
    label = report.get("topicLabel")
    raw_key = report.get("topicKey")
    if not isinstance(date, str) or not isinstance(label, str) or not isinstance(raw_key, str):
        raise JobArtifactValidationError("topic report identity input is invalid")
    topic_key = re.sub(r"[^a-z0-9_]", "_", raw_key)
    report_id = report.get("id") or _stable_topic_id(date, topic_key, label)
    if not isinstance(report_id, str):
        raise JobArtifactValidationError("topic report id is invalid")
    filename = f"{date}_{topic_key}_{report_id}.json"
    report.update({"id": report_id, "saved": True, "filename": filename, "topicKey": topic_key})
    for field_name in ("checkpoints", "dataGaps", "sourceLedger", "evidenceItems"):
        values = report.get(field_name)
        if isinstance(values, list):
            for item in values:
                if isinstance(item, dict) and not item.get("artifactId"):
                    item["artifactId"] = report_id
    return CanonicalArtifactSpec(
        artifact_type="topic_report",
        artifact_id=report_id,
        report_kind=ReportKind.TOPIC_REPORT,
        exact_path=data_root / "topic-reports" / filename,
        write_kind=WriteKind.CANONICAL,
        candidate=report,
    )


def _artifact_type(report_kind: ReportKind) -> str:
    match report_kind:
        case ReportKind.BRIEFING:
            return "briefing_report"
        case ReportKind.COMPANY_ANALYSIS:
            return "company_analysis_report"
        case ReportKind.TOPIC_REPORT:
            return "topic_report"
        case unreachable:
            assert_never(unreachable)


def overlay_spec(data_root: Path, request: OverlayJobRequest) -> CanonicalArtifactSpec:
    path = resolve_exact_report_path(data_root, request.report_kind, request.report_id, request.market_scope)
    return CanonicalArtifactSpec(
        artifact_type=_artifact_type(request.report_kind),
        artifact_id=request.report_id if request.market_scope is None else f"{request.report_id.split('.')[0]}.{request.market_scope}",
        report_kind=request.report_kind,
        exact_path=path,
        write_kind=WriteKind.OVERLAY,
        candidate={"personalOverlay": deepcopy(request.personal_overlay)},
    )


def quality_repair_spec(data_root: Path, request: QualityRepairJobRequest) -> CanonicalArtifactSpec:
    path = resolve_exact_report_path(data_root, request.report_kind, request.report_id, request.market_scope)
    candidate = deepcopy(request.candidate)
    match request.report_kind:
        case ReportKind.BRIEFING:
            artifact_kind = "briefing"
        case ReportKind.COMPANY_ANALYSIS:
            artifact_kind = "company_analysis"
        case ReportKind.TOPIC_REPORT:
            artifact_kind = "topic_report"
        case unreachable:
            assert_never(unreachable)
    candidate["quality"] = evaluate_artifact(artifact_kind, candidate)
    return CanonicalArtifactSpec(
        artifact_type=_artifact_type(request.report_kind),
        artifact_id=request.report_id if request.market_scope is None else f"{request.report_id.split('.')[0]}.{request.market_scope}",
        report_kind=request.report_kind,
        exact_path=path,
        write_kind=WriteKind.CANONICAL,
        candidate=candidate,
    )
