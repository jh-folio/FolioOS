from __future__ import annotations

import argparse
import json
import shutil
import sys
from datetime import UTC, datetime
from pathlib import Path

SOURCE_ROOT = Path(__file__).resolve().parents[1]
if str(SOURCE_ROOT) not in sys.path:
    sys.path.insert(0, str(SOURCE_ROOT))

from features.agent_mode.work_log import WorkLogService
from features.common import jobs
from features.common.shared_jobs_private import JobPrivateLifecycle, PrivateCleanupError
from features.common.shared_jobs_projection import ProjectionValueError, new_shared_job, project_terminal_result
from features.common.shared_jobs_schema import ErrorCode, JobStatus, TaskType
from features.common.shared_jobs_store import JobTransitionError, JobsStoreUnavailableError, SharedJobStore


NOW = datetime(2026, 7, 19, 0, 0, tzinfo=UTC)


def clock() -> datetime:
    return NOW


def artifact_job(task_type: TaskType):
    return new_shared_job(
        kind="agent_bridge",
        task_type=task_type,
        generation_mode="llm_cli",
        adapter="codex",
        requested_mode="cli",
        mode="generate",
        attempted_engine="cli",
        clock=clock,
    )


def companion_job():
    return new_shared_job(
        kind="agent_bridge",
        task_type="companion",
        generation_mode="llm_cli",
        adapter="codex",
        requested_mode="cli",
        mode="answer",
        attempted_engine="cli",
        clock=clock,
    )


def probe_commit_protocol(runtime: Path) -> dict[str, object]:
    store = SharedJobStore(runtime / "direct-jobs-v2.json", runtime / "direct-jobs.json", clock=clock)
    terminal_result = {
        "artifactId": "topic-01",
        "reportId": "topic-01",
        "date": "2026-07-19",
        "title": "Topic",
    }
    direct = artifact_job(TaskType.TOPIC_REPORT)
    store.add(direct)
    store.transition(direct.id, JobStatus.RUNNING)
    direct_rejected = False
    try:
        store.transition(direct.id, JobStatus.DONE, result=terminal_result)
    except JobTransitionError:
        direct_rejected = True

    startup = artifact_job(TaskType.TOPIC_REPORT)
    store.add(startup)
    startup_rejected = False
    try:
        store.transition_recovery(startup.id, JobStatus.DONE)
    except JobTransitionError:
        startup_rejected = True

    jobs.JOBS_PATH = runtime / "generic" / "jobs.json"
    jobs._LIFECYCLES.clear()
    jobs.JOBS.clear()
    generic = artifact_job(TaskType.TOPIC_REPORT)
    jobs.shared_store().add(generic)

    def returns_without_commit(*, progress):
        del progress
        return {
            "artifactId": "topic-02",
            "reportId": "topic-02",
            "date": "2026-07-19",
            "title": "Topic",
        }

    jobs.run_job(generic.id, returns_without_commit)
    terminal = jobs.shared_store().get(generic.id)
    generic_failed_safe = (
        terminal is not None
        and terminal.status is JobStatus.FAILED
        and terminal.errorCode is ErrorCode.SAVE_FAILED
        and terminal.commitIntent is None
        and terminal.artifactRefs == []
    )
    current = store.get(direct.id)
    return {
        "directTransitionRejected": direct_rejected,
        "directStatus": current.status.value if current is not None else None,
        "startupBypassRejected": startup_rejected,
        "genericWorkerFailedSafe": generic_failed_safe,
        "genericStatus": terminal.status.value if terminal is not None else None,
        "genericErrorCode": terminal.errorCode.value if terminal is not None and terminal.errorCode else None,
        "passed": direct_rejected and startup_rejected and generic_failed_safe,
    }


def probe_strict_projections() -> dict[str, object]:
    cases = {
        TaskType.BRIEFING: {},
        TaskType.COMPANY_ANALYSIS: {
            "artifactId": "company-01",
            "reportId": "company-01",
            "date": "2026-07-19",
        },
        TaskType.TOPIC_REPORT: {
            "artifactId": "topic-01",
            "reportId": "topic-01",
            "title": "Topic",
        },
        TaskType.PERSONAL_OVERLAY: {"artifactId": "overlay-01"},
        TaskType.THESIS_DELTA: {},
        TaskType.MARKET_MEMORY_LLM: {},
        TaskType.MARKET_STATE_SNAPSHOT: {
            "artifactId": "snapshot-a",
            "snapshotId": "snapshot-b",
        },
        TaskType.MARKET_MEMORY_UPDATE: {},
        TaskType.QUALITY_REPAIR: {"artifactId": "quality-01"},
        TaskType.INVESTMENT_REVIEW: {"artifactId": "review-01"},
    }
    rejected: dict[str, bool] = {}
    for task_type, result in cases.items():
        job = artifact_job(task_type)
        try:
            project_terminal_result(job, JobStatus.DONE, result)
        except ProjectionValueError:
            rejected[task_type.value] = True
        else:
            rejected[task_type.value] = False
    return {
        "caseCount": len(rejected),
        "rejected": rejected,
        "passed": all(rejected.values()),
    }


class ToggleCleanupLifecycle(JobPrivateLifecycle):
    cleanup_fails = True

    def cleanup_owner(self, job_id: str) -> bool:
        if self.cleanup_fails:
            return False
        return super().cleanup_owner(job_id)


def probe_cleanup_durability(runtime: Path) -> dict[str, object]:
    store = SharedJobStore(runtime / "cleanup-jobs-v2.json", runtime / "cleanup-jobs.json", clock=clock)
    lifecycle = ToggleCleanupLifecycle(runtime / "cleanup-context", clock=clock)
    job = companion_job()
    store.add(job)
    store.transition(job.id, JobStatus.RUNNING)
    lifecycle.write_pack(job.id, "probe", {"canary": "PRIVATE_CLEANUP_CANARY"})
    cleanup_raised = False
    try:
        lifecycle.terminalize(store, job.id, JobStatus.DONE, result={"proposalId": None})
    except PrivateCleanupError:
        cleanup_raised = True
    durable = SharedJobStore(store.path, store.legacy_path, clock=clock).get(job.id)
    read_failed_closed = False
    try:
        lifecycle.assert_readable()
    except JobsStoreUnavailableError:
        read_failed_closed = True
    lifecycle.cleanup_fails = False
    lifecycle.terminalize(store, job.id, JobStatus.DONE, result={"proposalId": None})
    lifecycle.assert_readable()
    terminal = store.get(job.id)
    pack_removed = not (lifecycle.context_root / job.id).exists()
    persisted_failure = (
        durable is not None
        and durable.status is JobStatus.RUNNING
        and durable.errorCode is ErrorCode.PRIVATE_CLEANUP_FAILED
    )
    retry_succeeded = terminal is not None and terminal.status is JobStatus.DONE and terminal.errorCode is None
    return {
        "cleanupRaised": cleanup_raised,
        "durableStatus": durable.status.value if durable is not None else None,
        "durableErrorCode": durable.errorCode.value if durable is not None and durable.errorCode else None,
        "readFailedClosed": read_failed_closed,
        "retrySucceeded": retry_succeeded,
        "packRemoved": pack_removed,
        "passed": cleanup_raised and persisted_failure and read_failed_closed and retry_succeeded and pack_removed,
    }


def probe_ordering(runtime: Path) -> dict[str, object]:
    store = SharedJobStore(runtime / "order-jobs-v2.json", runtime / "order-jobs.json", clock=clock)
    first_id = "job_00000000-0000-4000-8000-000000000001"
    second_id = "job_00000000-0000-4000-8000-000000000002"
    store.add(companion_job().model_copy(update={"id": second_id}))
    store.add(companion_job().model_copy(update={"id": first_id}))
    observed = [job.id for job in store.merged().jobs]
    expected = [first_id, second_id]
    return {"observed": observed, "expected": expected, "passed": observed == expected}


def valid_proposal(proposal_id: str) -> dict[str, object]:
    return {
        "schemaVersion": 2,
        "id": proposal_id,
        "reportKind": "topic_report",
        "reportId": "topic-01",
        "marketScope": "none",
        "status": "pending",
        "createdAt": "2026-07-19T00:00:00Z",
        "updatedAt": "2026-07-19T00:00:00Z",
        "finishedAt": None,
        "baseRevision": {"number": 1, "hash": "b" * 64},
        "targetRevision": None,
        "operationId": None,
        "errorCode": None,
        "requestHash": "c" * 64,
        "revisedMarkdownHash": "d" * 64,
        "diffHash": "e" * 64,
        "legacyNormalizationHash": None,
        "userRequest": "QA request",
        "summary": "QA summary",
        "revisedMarkdown": "# Revised",
        "diff": "+ revised",
        "adapter": "codex",
        "model": "qa-model",
        "allowedSourceRefs": [],
    }


def probe_proposal_authority(runtime: Path) -> dict[str, object]:
    store = SharedJobStore(runtime / "proposal-jobs-v2.json", runtime / "proposal-jobs.json", clock=clock)
    proposal_id = "a" * 32
    job = new_shared_job(
        kind="agent_bridge",
        task_type="quality_repair",
        generation_mode="llm_cli",
        adapter="codex",
        requested_mode="cli",
        mode="revise",
        attempted_engine="cli",
        proposal_id=proposal_id,
        clock=clock,
    )
    store.add(job)
    proposals = runtime / "agent-proposals"
    service = WorkLogService(store, runtime / "agent-work-log.json", proposals, clock=clock)

    def status() -> object:
        entries = service.list(limit=20, offset=0, kind="task")["entries"]
        return entries[0]["proposalStatus"]

    observed = {"missing": status()}
    proposals.mkdir()
    path = proposals / f"{proposal_id}.json"
    path.write_text("{", encoding="utf-8")
    observed["malformedJson"] = status()
    path.write_text(json.dumps({"status": "pending"}), encoding="utf-8")
    observed["schemaInvalid"] = status()
    path.write_text(json.dumps(valid_proposal(proposal_id)), encoding="utf-8")
    observed["valid"] = status()
    passed = (
        observed["missing"] == "unavailable"
        and observed["malformedJson"] == "unavailable"
        and observed["schemaInvalid"] == "unavailable"
        and observed["valid"] == "pending"
    )
    return {"observed": observed, "passed": passed}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--attempt-dir", type=Path, required=True)
    args = parser.parse_args()
    attempt_dir = args.attempt_dir.resolve()
    attempt_dir.mkdir(parents=True, exist_ok=True)
    runtime = attempt_dir / ".runtime"
    if runtime.exists():
        shutil.rmtree(runtime)
    runtime.mkdir()
    result: dict[str, object] = {}
    try:
        result["artifactCommitProtocol"] = probe_commit_protocol(runtime)
        result["strictTaskProjections"] = probe_strict_projections()
        result["privateCleanupDurability"] = probe_cleanup_durability(runtime)
        result["sameTimeJobsOrder"] = probe_ordering(runtime)
        result["proposalAuthority"] = probe_proposal_authority(runtime)
    finally:
        if runtime.exists():
            shutil.rmtree(runtime)
        result["cleanup"] = not runtime.exists()
        result["passed"] = result["cleanup"] is True and all(
            isinstance(value, dict) and value.get("passed") is True
            for key, value in result.items()
            if key not in {"cleanup", "passed"}
        )
        (attempt_dir / "probe-results.json").write_text(
            json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
        )
    return 0 if result["passed"] is True else 4


if __name__ == "__main__":
    raise SystemExit(main())
