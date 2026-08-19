"""같은 날 다른 질문의 보고서가 서로를 덮어썼다.

승인 경로의 topicKey는 늘 "custom"이고 topicLabel은 `topic_subject()`가 40자로
끊은 주제어다. 그래서 "AI 데이터센터 전력 병목: 발전 설비 수혜주는?"과
"AI 데이터센터 전력 병목: 규제 리스크는?"이 같은 id가 되어, 뒤 보고서가 앞
보고서를 새 revision으로 교체했다.
"""
from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path
from uuid import UUID

from features.common.shared_jobs_schema import JobStatus
from features.topic_report import approved_jobs as jobs_module
from features.topic_report.approval_store import ApprovalStore, ApprovalStoreRuntime
from features.topic_report.approved_generation import ApprovedGenerationOutcome
from features.topic_report.approved_jobs import ApprovedTopicJobs
from features.topic_report.service import _stable_topic_id


NOW = datetime(2026, 7, 16, tzinfo=UTC)
SUBJECT = "AI 데이터센터 전력 병목"


class HoldingExecutor:
    def submit(self, *_args, **_kwargs):  # pragma: no cover - 제출은 테스트에서 쓰지 않는다
        raise AssertionError("executor should not run in this test")


def _scheduler(tmp_path: Path) -> ApprovedTopicJobs:
    approvals = ApprovalStore(
        ApprovalStoreRuntime(
            path=tmp_path / "topic-plan-approvals.json",
            clock=lambda: NOW,
            entropy=lambda size: bytes(size),
            uuidFactory=lambda: UUID("12345678-1234-4567-9234-567812345678"),
        )
    )
    return ApprovedTopicJobs(tmp_path, approvals, clock=lambda: NOW, executor=HoldingExecutor())


def _outcome(plan_hash: str) -> ApprovedGenerationOutcome:
    return ApprovedGenerationOutcome(
        report={
            "date": "2026-07-16",
            "topicKey": "custom",
            "topicLabel": SUBJECT,
            "title": f"{SUBJECT} 분석 리포트 — 2026-07-16",
            "generatedAt": "2026-07-16T00:00:00Z",
            "markdown": f"# {SUBJECT} 분석 리포트 — 2026-07-16",
            "sources": [],
            "executionProvenance": {"schemaVersion": 1, "planHash": plan_hash},
        },
        attemptedEngine="api",
        finalEngine="api",
        fallbackReason=None,
        adapter="openai_api",
        generationMode="llm_api",
        mode="generate",
    )


def _run_once(scheduler: ApprovedTopicJobs, tmp_path: Path, plan_hash: str, monkeypatch) -> set[str]:
    job = scheduler.queued_job(requested_mode="direct", adapter="auto", confirmed_zero=False)
    scheduler.store.add(job)
    monkeypatch.setattr(jobs_module, "build_approved_report", lambda *_a, **_k: _outcome(plan_hash))
    scheduler._run(job.id, object())
    terminal = scheduler.store.get(job.id)
    assert terminal is not None and terminal.status is JobStatus.DONE
    return {path.name for path in (tmp_path / "topic-reports").glob("*.json")}


def test_two_questions_sharing_a_subject_do_not_overwrite_each_other(tmp_path: Path, monkeypatch) -> None:
    scheduler = _scheduler(tmp_path)
    first = _run_once(scheduler, tmp_path, "plan-hash-supply", monkeypatch)
    second = _run_once(scheduler, tmp_path, "plan-hash-regulation", monkeypatch)

    assert len(first) == 1
    assert len(second) == 2
    assert first < second


def test_rerunning_the_same_plan_keeps_one_report(tmp_path: Path, monkeypatch) -> None:
    scheduler = _scheduler(tmp_path)
    first = _run_once(scheduler, tmp_path, "plan-hash-supply", monkeypatch)
    second = _run_once(scheduler, tmp_path, "plan-hash-supply", monkeypatch)

    assert first == second
    assert len(second) == 1


def test_an_id_without_a_discriminator_matches_the_stored_files(tmp_path: Path) -> None:
    """판별자 없는 호출은 예전 키 그대로다 — 기존 저장 파일의 id가 재현된다."""
    legacy = _stable_topic_id("2026-07-16", "custom", SUBJECT)
    assert legacy == _stable_topic_id("2026-07-16", "custom", SUBJECT, discriminator="")
    assert legacy != _stable_topic_id("2026-07-16", "custom", SUBJECT, discriminator="plan-hash")
