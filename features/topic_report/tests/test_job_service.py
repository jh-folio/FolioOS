from __future__ import annotations

from concurrent.futures import Future
from pathlib import Path

import pytest

from features.common import jobs
from features.common.shared_jobs_projection import new_shared_job
from features.common.shared_jobs_schema import JobStatus
from features.topic_report import job_service


class HoldingExecutor:
    def submit(self, *_args, **_kwargs) -> Future[None]:
        return Future()


def test_direct_topic_submission_uses_direct_api_identity(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(jobs, "JOBS_PATH", tmp_path / "jobs.json")
    jobs._LIFECYCLES.clear()

    submitted = jobs.submit_job(
        "topic_report",
        "Direct topic",
        lambda _params, **_kwargs: {},
        {},
        pass_job_id=True,
        executor=HoldingExecutor(),
    )

    assert submitted["requestedMode"] == "direct"
    assert submitted["generationMode"] == "llm_api"
    assert submitted["attemptedEngine"] == "api"


def test_direct_topic_worker_commits_as_shared_job(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(jobs, "JOBS_PATH", tmp_path / "jobs.json")
    jobs._LIFECYCLES.clear()
    job = new_shared_job(
        kind="topic_report",
        task_type="topic_report",
        generation_mode="none",
        adapter="none",
        requested_mode=None,
        mode="generate",
        attempted_engine=None,
        clock=jobs._clock,
    )
    jobs.shared_store().add(job)
    jobs.shared_store().transition(job.id, JobStatus.RUNNING)
    jobs.private_lifecycle().set_private(job.id, {"context": "PRIVATE_TOPIC_CANARY"})
    candidate = {
        "date": "2099-12-31",
        "topicKey": "custom",
        "topicLabel": "Synthetic Topic",
        "title": "Synthetic Topic",
        "generatedAt": "2099-12-31T00:00:00Z",
        "markdown": "# Synthetic Topic",
        "sources": [],
    }
    monkeypatch.setattr(job_service, "generate_topic_report", lambda **_kwargs: dict(candidate))
    monkeypatch.setattr(job_service, "apply_quality_loop", lambda _kind, report, **_kwargs: report)

    result = job_service.run_topic_report_job(
        {"topic_key": "custom", "custom_label": "Synthetic Topic", "date": "2099-12-31"},
        job_id=job.id,
    )

    terminal = jobs.shared_store().get(job.id)
    assert terminal is not None and terminal.status is JobStatus.DONE
    assert terminal.artifactRefs[0].type == "topic_report"
    assert result["reportId"] == terminal.artifactRefs[0].id
    assert list((tmp_path / "topic-reports").glob("*.json"))
    assert "PRIVATE_TOPIC_CANARY" not in (tmp_path / "jobs-v2.json").read_text(encoding="utf-8")
