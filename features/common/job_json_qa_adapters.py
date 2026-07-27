from __future__ import annotations

from pathlib import Path

from features.common.canonical_identity import ReportKind
from features.common.job_json_producers import (
    InvestmentReviewJobRequest,
    OverlayJobRequest,
    QualityRepairJobRequest,
    ReportJobRequest,
)
from features.common.job_json_qa_core import harness, read_json, running


def producer_adapters(runtime: Path) -> bool:
    owner = harness(runtime / "adapters")
    company_job = running(owner, "company_analysis")
    company = owner.producers.stage_company(
        company_job,
        ReportJobRequest(
            report={
                "generatedAt": "2026-07-18T02:00:00Z",
                "company": {"ticker": "TEST", "name": "Test"},
                "markdown": "# Company",
            },
            terminal_result={
                "artifactId": "company",
                "reportId": "company",
                "date": "2026-07-18",
                "title": "Test",
            },
        ),
    )
    owner.producers.workspace.commit(company, owner.store, owner.lifecycle)
    report_id = company.manifest.artifacts[0].expected.id
    company_path = owner.root / "company-analysis" / f"{report_id}.json"
    overlay_job = running(owner, "personal_overlay")
    overlay = owner.producers.stage_overlay(
        overlay_job,
        OverlayJobRequest(
            ReportKind.COMPANY_ANALYSIS,
            report_id,
            None,
            {"stale": False, "markdown": "private"},
            {"artifactId": report_id, "reportId": report_id},
        ),
    )
    owner.producers.workspace.commit(overlay, owner.store, owner.lifecycle)
    quality_job = running(owner, "quality_repair")
    repair = owner.producers.stage_quality_repair(
        quality_job,
        QualityRepairJobRequest(
            ReportKind.COMPANY_ANALYSIS,
            report_id,
            None,
            read_json(company_path),
            {"artifactId": report_id, "reportId": report_id},
        ),
    )
    owner.producers.workspace.commit(repair, owner.store, owner.lifecycle)
    topic_job = running(owner, "topic_report")
    topic = owner.producers.stage_topic(
        topic_job,
        ReportJobRequest(
            report={"date": "2026-07-18", "topicKey": "custom", "topicLabel": "AI", "markdown": "# Topic"},
            terminal_result={
                "artifactId": "topic",
                "reportId": "topic",
                "date": "2026-07-18",
                "title": "AI",
            },
        ),
    )
    owner.producers.workspace.commit(topic, owner.store, owner.lifecycle)
    review_job = running(owner, "investment_review")
    review = owner.producers.stage_investment_review(
        review_job,
        InvestmentReviewJobRequest(
            body={"date": "2026-07-18"},
            terminal_result={"artifactId": "2026-07-18", "reportId": "2026-07-18"},
        ),
    )
    owner.producers.workspace.commit(review, owner.store, owner.lifecycle)
    saved_company = read_json(company_path)
    topic_path = next((owner.root / "topic-reports").glob("*.json"))
    overlay_value = saved_company.get("personalOverlay")
    return (
        (saved_company.get("canonicalRevision") or {}).get("number") == 2
        and isinstance(overlay_value, dict)
        and overlay_value.get("markdown") == "private"
        and isinstance(saved_company.get("quality"), dict)
        and read_json(topic_path).get("id") == topic.manifest.artifacts[0].expected.id
        and read_json(owner.root / "investment-review" / "2026-07-18.json").get("summary") == "review"
    )
