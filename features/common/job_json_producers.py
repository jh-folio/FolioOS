from __future__ import annotations

from collections.abc import Callable
from datetime import datetime
from pathlib import Path

from features.common.canonical_json import JsonValue
from features.common.job_briefing_producer import briefing_specs
from features.common.job_json_artifacts import JobArtifactWorkspace, JsonArtifactSpec
from features.common.job_json_producer_types import (
    BriefingJobRequest,
    InvestmentReviewJobRequest,
    OverlayJobRequest,
    QualityRepairJobRequest,
    ReportJobRequest,
)
from features.common.job_json_schema import JobArtifactValidationError, StagedJobBundle
from features.common.job_report_producers import company_spec, overlay_spec, quality_repair_spec, topic_spec
from features.common.shared_jobs_schema import SharedJob, StorageKind, TaskType


type ReviewBuilder = Callable[[dict[str, JsonValue]], dict[str, JsonValue]]


def _review_builder(body: dict[str, JsonValue]) -> dict[str, JsonValue]:
    from features.investment_review.service import build_review

    date_value = body.get("date")
    date = date_value if isinstance(date_value, str) else None
    return build_review(
        date=date,
        include_portfolio=body.get("includePortfolio") is not False,
        include_watchlist=body.get("includeWatchlist") is not False,
        include_obsidian=body.get("includeObsidian") is not False,
        use_llm=body.get("useLlm") is True,
        force_refresh=True,
        persist=False,
    )


class JobJsonProducers:
    def __init__(
        self,
        data_root: Path,
        *,
        clock: Callable[[], datetime],
        review_builder: ReviewBuilder = _review_builder,
    ) -> None:
        self.data_root = data_root.resolve(strict=False)
        self.workspace = JobArtifactWorkspace(self.data_root, clock=clock)
        self.review_builder = review_builder

    @staticmethod
    def _require(job: SharedJob, task_type: TaskType) -> None:
        if job.taskType != task_type:
            raise JobArtifactValidationError(f"producer requires taskType={task_type.value}")

    def stage_briefing(self, job: SharedJob, request: BriefingJobRequest) -> StagedJobBundle:
        self._require(job, TaskType.BRIEFING)
        return self.workspace.stage(job, briefing_specs(self.data_root, request), terminal_result=request.terminal_result)

    def stage_company(self, job: SharedJob, request: ReportJobRequest) -> StagedJobBundle:
        self._require(job, TaskType.COMPANY_ANALYSIS)
        return self.workspace.stage(job, [company_spec(self.data_root, request)], terminal_result=request.terminal_result)

    def stage_topic(self, job: SharedJob, request: ReportJobRequest) -> StagedJobBundle:
        self._require(job, TaskType.TOPIC_REPORT)
        return self.workspace.stage(job, [topic_spec(self.data_root, request)], terminal_result=request.terminal_result)

    def stage_overlay(self, job: SharedJob, request: OverlayJobRequest) -> StagedJobBundle:
        self._require(job, TaskType.PERSONAL_OVERLAY)
        return self.workspace.stage(job, [overlay_spec(self.data_root, request)], terminal_result=request.terminal_result)

    def stage_quality_repair(self, job: SharedJob, request: QualityRepairJobRequest) -> StagedJobBundle:
        self._require(job, TaskType.QUALITY_REPAIR)
        spec = quality_repair_spec(self.data_root, request)
        return self.workspace.stage(job, [spec], terminal_result=request.terminal_result)

    def stage_investment_review(
        self,
        job: SharedJob,
        request: InvestmentReviewJobRequest,
    ) -> StagedJobBundle:
        self._require(job, TaskType.INVESTMENT_REVIEW)
        review = self.review_builder(request.body)
        date_value = review.get("date")
        if not isinstance(date_value, str) or not date_value:
            raise JobArtifactValidationError("investment review date is invalid")
        spec = JsonArtifactSpec(
            storage=StorageKind.JSON,
            artifact_type="investment_review",
            artifact_id=date_value,
            exact_path=self.data_root / "investment-review" / f"{date_value}.json",
            payload=review,
        )
        return self.workspace.stage(job, [spec], terminal_result=request.terminal_result)


__all__ = [
    "BriefingJobRequest",
    "InvestmentReviewJobRequest",
    "JobJsonProducers",
    "OverlayJobRequest",
    "QualityRepairJobRequest",
    "ReportJobRequest",
]
