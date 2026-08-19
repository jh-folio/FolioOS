from __future__ import annotations

import gzip
import json
from datetime import UTC, datetime
from pathlib import Path

import pytest

from features.common.canonical_identity import ReportKind
from features.common.canonical_report_state import canonical_content_hash, storage_hash
from features.common.job_json_producers import (
    BriefingJobRequest,
    InvestmentReviewJobRequest,
    JobJsonProducers,
    OverlayJobRequest,
    QualityRepairJobRequest,
    ReportJobRequest,
)
from features.common.job_json_schema import JobArtifactValidationError
from features.common.shared_jobs_private import JobPrivateLifecycle
from features.common.shared_jobs_projection import new_shared_job
from features.common.shared_jobs_schema import JobStatus
from features.common.shared_jobs_store import SharedJobStore


NOW = datetime(2026, 7, 18, 1, 0, tzinfo=UTC)


def _clock() -> datetime:
    return NOW


def _running(store: SharedJobStore, task_type: str):
    job = new_shared_job(
        kind="agent_bridge",
        task_type=task_type,
        generation_mode="llm_cli",
        adapter="codex",
        requested_mode="cli",
        mode="generate",
        attempted_engine="cli",
        clock=_clock,
    )
    store.add(job)
    store.transition(job.id, JobStatus.RUNNING)
    current = store.get(job.id)
    assert current is not None
    return current


def _read(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def test_briefing_producer_stages_complete_multiscope_visual_matrix(tmp_path: Path) -> None:
    # Given: a two-scope briefing with one optional visual sidecar.
    data_root = tmp_path / "data"
    store = SharedJobStore(data_root / "jobs-v2.json", data_root / "jobs.json", clock=_clock)
    lifecycle = JobPrivateLifecycle(data_root / "job-context", clock=_clock)
    producers = JobJsonProducers(data_root, clock=_clock)
    job = _running(store, "briefing")
    request = BriefingJobRequest(
        date="2026-07-18",
        scopes=("us", "kr"),
        reports={"us": {"markdown": "# US"}, "kr": {"markdown": "# KR"}},
        visuals={"us": {"snapshots": {"SPY": {"rows": [1]}}}, "kr": {"snapshots": {}}},
        terminal_result={
            "artifactId": "2026-07-18",
            "reportId": "2026-07-18",
            "date": "2026-07-18",
            "title": "Daily Briefing",
        },
    )

    # When: the producer prepares and commits the complete bundle.
    bundle = producers.stage_briefing(job, request)
    assert not (data_root / "briefings" / "2026-07-18.us.json").exists()
    producers.workspace.commit(bundle, store, lifecycle)

    # Then: exact refs, paths, markers, and the optional gzip are durable.
    assert [(item.storage.value, item.type, item.id) for item in bundle.intent.expectedArtifacts] == [
        ("gzip_json", "briefing_visual", "2026-07-18.us"),
        ("json", "briefing_report", "2026-07-18.kr"),
        ("json", "briefing_report", "2026-07-18.us"),
    ]
    for scope in ("us", "kr"):
        report = _read(data_root / "briefings" / f"2026-07-18.{scope}.json")
        assert report["canonicalRevision"]["number"] == 1
        assert report["jobCommit"]["jobId"] == job.id
    with gzip.open(data_root / "briefings" / "2026-07-18.us.visuals.json.gz", "rt", encoding="utf-8") as stream:
        assert json.load(stream)["jobCommit"]["operationId"] == bundle.operation_id
    assert not (data_root / "briefings" / "2026-07-18.kr.visuals.json.gz").exists()


def test_company_overlay_and_quality_producers_preserve_revision_contract(tmp_path: Path) -> None:
    # Given: a company report with an existing non-stale Personal Overlay.
    data_root = tmp_path / "data"
    store = SharedJobStore(data_root / "jobs-v2.json", data_root / "jobs.json", clock=_clock)
    lifecycle = JobPrivateLifecycle(data_root / "job-context", clock=_clock)
    producers = JobJsonProducers(data_root, clock=_clock)
    first_job = _running(store, "company_analysis")
    first = producers.stage_company(
        first_job,
        ReportJobRequest(
            report={
                "generatedAt": "2026-07-18T01:00:00Z",
                "company": {"ticker": "TEST", "name": "Test"},
                "markdown": "# Company\n\nInitial",
                "personalOverlay": {"stale": False, "markdown": "private"},
            },
            terminal_result={
                "artifactId": "company",
                "reportId": "company",
                "date": "2026-07-18",
                "title": "Test",
            },
        ),
    )
    report_id = first.manifest.artifacts[0].expected.id
    producers.workspace.commit(first, store, lifecycle)
    path = data_root / "company-analysis" / f"{report_id}.json"
    baseline = _read(path)

    # When: canonical, Overlay-only, and quality-repair writers run in sequence.
    second_job = _running(store, "company_analysis")
    changed = producers.stage_company(
        second_job,
        ReportJobRequest(
            report={
                "id": report_id,
                "generatedAt": "2026-07-18T01:00:00Z",
                "company": {"ticker": "TEST", "name": "Test"},
                "markdown": "# Company\n\nChanged",
            },
            terminal_result={
                "artifactId": report_id,
                "reportId": report_id,
                "date": "2026-07-18",
                "title": "Test",
            },
        ),
    )
    producers.workspace.commit(changed, store, lifecycle)
    after_canonical = _read(path)
    overlay_job = _running(store, "personal_overlay")
    overlay = producers.stage_overlay(
        overlay_job,
        OverlayJobRequest(
            report_kind=ReportKind.COMPANY_ANALYSIS,
            report_id=report_id,
            market_scope=None,
            personal_overlay={"stale": False, "markdown": "new private"},
            terminal_result={"artifactId": report_id, "reportId": report_id},
        ),
    )
    producers.workspace.commit(overlay, store, lifecycle)
    after_overlay = _read(path)
    quality_job = _running(store, "quality_repair")
    repair = producers.stage_quality_repair(
        quality_job,
        QualityRepairJobRequest(
            report_kind=ReportKind.COMPANY_ANALYSIS,
            report_id=report_id,
            market_scope=None,
            candidate=after_overlay,
            terminal_result={"artifactId": report_id, "reportId": report_id},
        ),
    )
    producers.workspace.commit(repair, store, lifecycle)
    after_quality = _read(path)

    # Then: canonical changes stale Overlay, Overlay keeps revision/hash, and quality is recomputed.
    assert baseline["canonicalRevision"]["number"] == 1
    assert after_canonical["canonicalRevision"]["number"] == 2
    assert after_canonical["personalOverlay"]["stale"] is True
    assert after_overlay["canonicalRevision"]["number"] == 2
    assert canonical_content_hash(after_overlay) == canonical_content_hash(after_canonical)
    assert storage_hash(after_overlay) != storage_hash(after_canonical)
    assert after_quality["canonicalRevision"]["number"] == 3
    assert isinstance(after_quality["quality"], dict)


def test_topic_and_review_producers_use_exact_stable_and_nonpersisting_preparation(tmp_path: Path) -> None:
    # Given: a topic candidate and an injected review builder that records preparation only.
    data_root = tmp_path / "data"
    store = SharedJobStore(data_root / "jobs-v2.json", data_root / "jobs.json", clock=_clock)
    lifecycle = JobPrivateLifecycle(data_root / "job-context", clock=_clock)
    review_calls: list[dict] = []

    def build_review(body: dict) -> dict:
        review_calls.append(body)
        return {"date": "2026-07-18", "summary": "review", "markdown": "# Review"}

    producers = JobJsonProducers(data_root, clock=_clock, review_builder=build_review)
    topic_job = _running(store, "topic_report")
    topic = producers.stage_topic(
        topic_job,
        ReportJobRequest(
            report={
                "date": "2026-07-18",
                "topicKey": "custom",
                "topicLabel": "AI Power",
                "markdown": "# Topic",
                "checkpoints": [{"label": "watch"}],
            },
            terminal_result={
                "artifactId": "topic",
                "reportId": "topic",
                "date": "2026-07-18",
                "title": "AI Power",
            },
        ),
    )
    topic_id = topic.manifest.artifacts[0].expected.id

    # When: topic and investment review bundles are prepared before either final write.
    review_job = _running(store, "investment_review")
    review = producers.stage_investment_review(
        review_job,
        InvestmentReviewJobRequest(
            body={"date": "2026-07-18"},
            terminal_result={"artifactId": "2026-07-18", "reportId": "2026-07-18", "date": "2026-07-18"},
        ),
    )
    assert list((data_root / "topic-reports").glob("*.json")) == []
    assert not (data_root / "investment-review" / "2026-07-18.json").exists()
    producers.workspace.commit(topic, store, lifecycle)
    producers.workspace.commit(review, store, lifecycle)

    # Then: stable exact topic identity and review output are committed once from staging.
    topic_paths = list((data_root / "topic-reports").glob("*.json"))
    assert len(topic_paths) == 1
    saved_topic = _read(topic_paths[0])
    assert saved_topic["id"] == topic_id
    assert saved_topic["checkpoints"][0]["artifactId"] == topic_id
    assert review_calls == [{"date": "2026-07-18"}]
    assert _read(data_root / "investment-review" / "2026-07-18.json")["summary"] == "review"


def test_review_builder_can_render_without_touching_cache(monkeypatch: pytest.MonkeyPatch) -> None:
    # Given: deterministic empty review inputs and a cache writer that fails if called.
    from features.investment_review import service

    monkeypatch.setattr(service, "_load_regime_states", lambda _warnings: [])
    monkeypatch.setattr(service, "_load_theses_with_deltas", lambda _warnings: ([], {}))
    monkeypatch.setattr(service, "_load_positions", lambda _warnings: [])
    monkeypatch.setattr(service, "_load_watchlist", lambda _warnings: [])
    monkeypatch.setattr(service, "_load_notes", lambda _warnings: [])
    monkeypatch.setattr(service, "build_dashboard_tape", lambda _date, _warnings: {})
    monkeypatch.setattr(service, "_load_recent_reports", lambda _warnings: [])

    def reject_cache(_date: str, _review: dict) -> None:
        raise AssertionError("nonpersisting preparation touched review cache")

    monkeypatch.setattr(service, "_save_cache", reject_cache)

    # When: SharedJob preparation requests a fresh nonpersisting review.
    review = service.build_review(date="2026-07-18", force_refresh=True, persist=False)

    # Then: a complete review is returned without invoking the live cache writer.
    assert review["date"] == "2026-07-18"
    assert isinstance(review["markdown"], str)


def test_briefing_qa_matrix_checks_only_artifacts_the_producer_makes(tmp_path: Path) -> None:
    """QA 하네스는 실제 산출물(시장별 보고서 + gzip visuals)만 검사해야 한다.

    예전에는 `BriefingJobRequest(link=...)`로 없는 인자를 넘기고 `.link.json`
    사이드카를 읽어, 호출 즉시 TypeError가 나 QA 스크립트가 한 번도 완주하지 못했다.
    """
    from features.common.job_json_qa_core import briefing_matrix

    matrix, ordered, reread = briefing_matrix(tmp_path)

    assert (matrix, ordered, reread) == (True, True, True)


def test_briefing_producer_rejects_unrequested_visual_metadata(tmp_path: Path) -> None:
    # Given: a US-only request carrying an unrelated KR visual payload.
    data_root = tmp_path / "data"
    store = SharedJobStore(data_root / "jobs-v2.json", data_root / "jobs.json", clock=_clock)
    producers = JobJsonProducers(data_root, clock=_clock)
    job = _running(store, "briefing")
    request = BriefingJobRequest(
        date="2026-07-18",
        scopes=("us",),
        reports={"us": {"markdown": "# US"}},
        visuals={"kr": {"snapshots": {"KOSPI": {"rows": [1]}}}},
        terminal_result={"artifactId": "2026-07-18", "date": "2026-07-18"},
    )

    # When/Then: the adapter rejects metadata that cannot map to an exact requested target.
    with pytest.raises(JobArtifactValidationError):
        producers.stage_briefing(job, request)
    assert not (data_root / "job-staging" / job.id).exists()
