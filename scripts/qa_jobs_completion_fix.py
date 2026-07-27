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

from features.common import jobs
from features.common.shared_jobs_schema import (
    CommitIntent,
    ErrorCode,
    ExpectedArtifact,
    JobStatus,
    StorageKind,
    TaskType,
)
from features.common.shared_jobs_store import JobTransitionError, SharedJobStore


NOW = datetime(2026, 7, 19, 0, 0, tzinfo=UTC)


def clock() -> datetime:
    return NOW


def new_job(task_type: TaskType):
    return jobs.new_shared_job(
        kind="agent_bridge",
        task_type=task_type,
        generation_mode="llm_cli",
        adapter="codex",
        requested_mode="cli",
        mode="answer" if task_type is TaskType.COMPANION else "generate",
        attempted_engine="cli",
        clock=clock,
    )


def topic_result() -> dict[str, str]:
    return {
        "artifactId": "topic-01",
        "reportId": "topic-01",
        "date": "2026-07-19",
        "title": "Topic",
    }


def topic_intent(job) -> CommitIntent:
    return CommitIntent(
        operationId="op-topic-01",
        expectedArtifacts=[
            ExpectedArtifact(
                storage=StorageKind.JSON,
                type="topic_report",
                id="topic-01",
                baseHash=None,
                baseMarker=None,
                targetRevision=1,
                targetHash="a" * 64,
            )
        ],
        terminalProjection=jobs.project_terminal_result(
            job,
            JobStatus.DONE,
            topic_result(),
        ),
    )


def prepare_source(
    store: SharedJobStore,
    source: JobStatus,
):
    task_type = TaskType.TOPIC_REPORT if source is JobStatus.COMMITTING else TaskType.COMPANION
    job = new_job(task_type)
    store.add(job)
    if source is JobStatus.QUEUED:
        return store.get(job.id)
    store.transition(job.id, JobStatus.RUNNING)
    if source is JobStatus.RUNNING:
        return store.get(job.id)
    if source is JobStatus.CANCEL_REQUESTED:
        store.transition(job.id, JobStatus.CANCEL_REQUESTED)
        return store.get(job.id)
    if source is JobStatus.COMMITTING:
        running = store.get(job.id)
        if running is None:
            raise AssertionError("running job missing")
        store.claim_committing(job.id, topic_intent(running))
        return store.get(job.id)
    raise AssertionError(f"unsupported source: {source}")


def probe_fabricated_intent(runtime: Path) -> dict[str, object]:
    store = SharedJobStore(runtime / "intent-jobs-v2.json", runtime / "intent-jobs.json", clock=clock)
    job = prepare_source(store, JobStatus.COMMITTING)
    if job is None:
        raise AssertionError("committing job missing")
    missing_target = runtime / "topic-reports" / "topic-01.json"
    missing_journal = runtime / "job-artifacts" / job.id / "commit-journal.json"
    before = store.path.read_bytes()

    generic_rejected = False
    try:
        store.transition(job.id, JobStatus.DONE, result=topic_result())
    except JobTransitionError:
        generic_rejected = True

    unsealed_rejected = False
    try:
        store.complete_artifact(job.id, object())
    except ValueError:
        unsealed_rejected = True

    current = store.get(job.id)
    bytes_unchanged = store.path.read_bytes() == before
    target_absent = not missing_target.exists()
    journal_absent = not missing_journal.exists()
    passed = (
        generic_rejected
        and unsealed_rejected
        and current is not None
        and current.status is JobStatus.COMMITTING
        and bytes_unchanged
        and target_absent
        and journal_absent
    )
    return {
        "genericDoneRejected": generic_rejected,
        "unsealedProofRejected": unsealed_rejected,
        "status": current.status.value if current is not None else None,
        "storeBytesUnchanged": bytes_unchanged,
        "targetAbsent": target_absent,
        "journalAbsent": journal_absent,
        "passed": passed,
    }


def probe_update_job_bypass(runtime: Path) -> dict[str, object]:
    original_jobs_path = jobs.JOBS_PATH
    isolated_jobs_path = runtime / "compat" / "jobs.json"
    jobs.JOBS_PATH = isolated_jobs_path
    jobs._LIFECYCLES.clear()
    jobs.JOBS.clear()
    try:
        store = jobs.shared_store()
        job = prepare_source(store, JobStatus.COMMITTING)
        if job is None:
            raise AssertionError("committing compat job missing")
        before = store.path.read_bytes()
        rejected = False
        try:
            jobs.update_job(job.id, status=JobStatus.DONE.value, result=topic_result())
        except JobTransitionError:
            rejected = True
        current = jobs.shared_store().get(job.id)
        bytes_unchanged = store.path.read_bytes() == before
        return {
            "updateJobDoneRejected": rejected,
            "status": current.status.value if current is not None else None,
            "storeBytesUnchanged": bytes_unchanged,
            "passed": (
                rejected
                and current is not None
                and current.status is JobStatus.COMMITTING
                and bytes_unchanged
            ),
        }
    finally:
        jobs.JOBS_PATH = original_jobs_path
        jobs._LIFECYCLES.clear()
        jobs.JOBS.clear()


def probe_recovery_matrix(runtime: Path) -> dict[str, object]:
    matrix = (
        (JobStatus.QUEUED, JobStatus.FAILED_RESTART, True),
        (JobStatus.QUEUED, JobStatus.FAILED_COMMIT_RECOVERY, False),
        (JobStatus.RUNNING, JobStatus.FAILED_RESTART, True),
        (JobStatus.RUNNING, JobStatus.FAILED_COMMIT_RECOVERY, False),
        (JobStatus.CANCEL_REQUESTED, JobStatus.FAILED_RESTART, True),
        (JobStatus.CANCEL_REQUESTED, JobStatus.FAILED_COMMIT_RECOVERY, False),
        (JobStatus.COMMITTING, JobStatus.FAILED_RESTART, False),
        (JobStatus.COMMITTING, JobStatus.FAILED_COMMIT_RECOVERY, True),
    )
    cases: list[dict[str, object]] = []
    for index, (source, target, allowed) in enumerate(matrix):
        store = SharedJobStore(
            runtime / f"recovery-{index}-v2.json",
            runtime / f"recovery-{index}.json",
            clock=clock,
        )
        job = prepare_source(store, source)
        if job is None:
            raise AssertionError("source job missing")
        before = store.path.read_bytes()
        accepted = True
        try:
            store.transition_recovery(job.id, target)
        except JobTransitionError:
            accepted = False
        current = store.get(job.id)
        expected_error = (
            ErrorCode.RESTART_INTERRUPTED
            if target is JobStatus.FAILED_RESTART
            else ErrorCode.COMMIT_RECOVERY_FAILED
        )
        exact = (
            current is not None
            and (
                (
                    allowed
                    and accepted
                    and current.status is target
                    and current.errorCode is expected_error
                )
                or (
                    not allowed
                    and not accepted
                    and current.status is source
                    and store.path.read_bytes() == before
                )
            )
        )
        cases.append(
            {
                "source": source.value,
                "target": target.value,
                "expectedAccepted": allowed,
                "accepted": accepted,
                "observedStatus": current.status.value if current is not None else None,
                "observedErrorCode": (
                    current.errorCode.value
                    if current is not None and current.errorCode is not None
                    else None
                ),
                "exact": exact,
            }
        )
    return {"caseCount": len(cases), "cases": cases, "passed": all(case["exact"] for case in cases)}


def probe_startup_boundary(runtime: Path) -> dict[str, object]:
    sources = (
        JobStatus.QUEUED,
        JobStatus.RUNNING,
        JobStatus.CANCEL_REQUESTED,
        JobStatus.COMMITTING,
    )
    recovery_done: list[dict[str, object]] = []
    normal_startup: list[dict[str, object]] = []
    for index, source in enumerate(sources):
        recovery_store = SharedJobStore(
            runtime / f"done-{index}-v2.json",
            runtime / f"done-{index}.json",
            clock=clock,
        )
        recovery_job = prepare_source(recovery_store, source)
        if recovery_job is None:
            raise AssertionError("recovery source missing")
        recovery_before = recovery_store.path.read_bytes()
        done_rejected = False
        try:
            recovery_store.transition_recovery(recovery_job.id, JobStatus.DONE)
        except JobTransitionError:
            done_rejected = True
        recovery_current = recovery_store.get(recovery_job.id)
        recovery_done.append(
            {
                "source": source.value,
                "rejected": done_rejected,
                "unchanged": (
                    recovery_current is not None
                    and recovery_current.status is source
                    and recovery_store.path.read_bytes() == recovery_before
                ),
            }
        )

        target = (
            JobStatus.FAILED_COMMIT_RECOVERY
            if source is JobStatus.COMMITTING
            else JobStatus.FAILED_RESTART
        )
        normal_store = SharedJobStore(
            runtime / f"normal-{index}-v2.json",
            runtime / f"normal-{index}.json",
            clock=clock,
        )
        normal_job = prepare_source(normal_store, source)
        if normal_job is None:
            raise AssertionError("normal source missing")
        normal_before = normal_store.path.read_bytes()
        startup_rejected = False
        try:
            normal_store.transition(normal_job.id, target)
        except JobTransitionError:
            startup_rejected = True
        normal_current = normal_store.get(normal_job.id)
        normal_startup.append(
            {
                "source": source.value,
                "target": target.value,
                "rejected": startup_rejected,
                "unchanged": (
                    normal_current is not None
                    and normal_current.status is source
                    and normal_store.path.read_bytes() == normal_before
                ),
            }
        )
    passed = all(item["rejected"] and item["unchanged"] for item in recovery_done) and all(
        item["rejected"] and item["unchanged"] for item in normal_startup
    )
    return {
        "recoveryDoneCases": recovery_done,
        "normalStartupTargetCases": normal_startup,
        "passed": passed,
    }


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
        result["fabricatedCommitIntent"] = probe_fabricated_intent(runtime)
        result["ordinaryUpdateJobBypass"] = probe_update_job_bypass(runtime)
        result["startupRecoveryMatrix"] = probe_recovery_matrix(runtime)
        result["startupApiBoundary"] = probe_startup_boundary(runtime)
    finally:
        shutil.rmtree(runtime, ignore_errors=True)
        result["cleanup"] = not runtime.exists()
        result["passed"] = result["cleanup"] is True and all(
            isinstance(value, dict) and value.get("passed") is True
            for key, value in result.items()
            if key not in {"cleanup", "passed"}
        )
        output = attempt_dir / "probe-results.json"
        output.write_text(
            json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
        )
        print(json.dumps({"passed": result["passed"], "result": str(output)}))
    return 0 if result["passed"] is True else 4


if __name__ == "__main__":
    raise SystemExit(main())
