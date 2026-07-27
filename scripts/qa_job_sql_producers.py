#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///

# ─── How to run ───
# 1. Install uv: https://docs.astral.sh/uv/getting-started/installation/
# 2. Run: uv run scripts/qa_job_sql_producers.py --source-root <repo> --attempt-dir <dir>
# 3. Windows: py -3 scripts/qa_job_sql_producers.py --source-root <repo> --attempt-dir <dir>
# ──────────────────

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sqlite3
import sys
from datetime import UTC, datetime
from pathlib import Path
from unittest.mock import patch


NOW = "2026-07-17T03:04:05Z"
NOW_DT = datetime(2026, 7, 17, 3, 4, 5, tzinfo=UTC)


class SimulatedCrash(BaseException):
    pass


def _digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _run(source_root: Path, attempt_dir: Path) -> dict[str, bool]:
    sys.path.insert(0, str(source_root))
    from features.common.shared_jobs_private import JobPrivateLifecycle
    from features.common.shared_jobs_projection import new_shared_job, project_terminal_result
    from features.common.shared_jobs_schema import Adapter, Engine, ExpectedArtifact, GenerationMode, JobKind, JobMode, JobStatus, StorageKind, TaskType
    from features.common.shared_jobs_store import SharedJobStore
    from features.common.sqlite_receipts import ReceiptVerificationError, read_receipts
    from features.common.sql_job_lifecycle import SqlJobLifecycle, SqlJobLifecycleError
    from features.market_memory.attempt_store import AttemptScope, AttemptStatus, AttemptStore
    from features.market_memory.graph_plan import graph_hash, prepare_graph_plan
    from features.market_memory.memory import init_db
    from features.market_memory.snapshot import save_market_state_snapshot
    from features.market_memory.sql_job_service import CombinedMarketJobRequest, MarketMemoryJobRequest, MarketSqlJobRuntime, MarketStateJobRequest, recover_market_sql_job, run_combined_market_job, run_market_memory_job, run_market_state_job
    from features.market_memory.standalone_job import commit_memory_batch
    from features.market_memory.tests.sql_receipt_test_support import entry, snapshot_payload
    from features.thesis_tracking.sql_job_service import ThesisDeltaJobRequest, deterministic_delta_id, run_thesis_delta_job
    from features.thesis_tracking.store import init_db as init_thesis_db
    from scripts.qa_job_sql_receipts import _run as run_receipt_qa

    work = attempt_dir / "work"
    receipt_attempt = attempt_dir / "receipt-harness"
    shutil.rmtree(work, ignore_errors=True)
    shutil.rmtree(receipt_attempt, ignore_errors=True)
    work.mkdir(parents=True)
    peer_paths = sorted((source_root / "features" / "common").glob("job_json_*.py"))
    peer_paths.extend(source_root / "features" / "common" / name for name in ("job_briefing_producer.py", "job_report_producers.py"))
    peer_before = {path: _digest(path) for path in peer_paths}
    checks = ("receiptHarness", "thesisProducer", "memoryProducer", "snapshotProducer", "combinedProducer", "combinedOneTransaction", "restartAfterCommit", "restartBeforeTransaction", "invalidMetadataRejected", "staleGraphRejected", "deterministicIdsClocksOrder", "manualReceiptFree", "savedRowsReceiptsReread", "jsonProducerPeersUnchanged", "cleanup")
    result = dict.fromkeys(checks, False)
    database: sqlite3.Connection | None = None
    try:
        result["receiptHarness"] = all(run_receipt_qa(source_root, receipt_attempt).values())
        database = sqlite3.connect(work / "market-memory.sqlite3")
        database.row_factory = sqlite3.Row
        init_db(database)
        init_thesis_db(database)
        store = SharedJobStore(work / "jobs-v2.json", work / "jobs.json", clock=lambda: NOW_DT)
        private = JobPrivateLifecycle(work / "job-context", clock=lambda: NOW_DT)
        lifecycle = SqlJobLifecycle(store, private)
        attempts = AttemptStore(work / "market-state-attempts.json")
        runtime = MarketSqlJobRuntime(lifecycle, attempts, lambda: NOW_DT)

        def running(task_type: TaskType):
            kind = JobKind.MARKET_STATE_SNAPSHOT if task_type is TaskType.MARKET_STATE_SNAPSHOT else JobKind.AGENT_BRIDGE
            job = new_shared_job(kind=kind, task_type=task_type, generation_mode=GenerationMode.LLM_CLI, adapter=Adapter.CODEX, requested_mode=None, mode=JobMode.GENERATE, attempted_engine=Engine.CLI, clock=lambda: NOW_DT)
            store.add(job)
            store.transition(job.id, JobStatus.RUNNING)
            return job

        thesis_job = running(TaskType.THESIS_DELTA)
        thesis_operation = "qa-thesis-operation"
        thesis_id = deterministic_delta_id("nvda", NOW, thesis_operation)
        delta = {"period": "90d", "periodDays": 90, "verdict": "maintained", "summary": "유지", "evidence": []}
        thesis_request = ThesisDeltaJobRequest(thesis_job.id, thesis_operation, "nvda", NOW, delta, NOW)
        thesis_result = run_thesis_delta_job(database, lifecycle, thesis_request)
        result["thesisProducer"] = thesis_result.delta_id == thesis_id

        memory_job = running(TaskType.MARKET_MEMORY_LLM)
        memory_result = run_market_memory_job(
            database,
            runtime,
            MarketMemoryJobRequest(memory_job.id, "qa-memory-operation", (entry(),), NOW),
        )
        result["memoryProducer"] = memory_result.saved_count == 1

        snapshot_job = running(TaskType.MARKET_STATE_SNAPSHOT)
        snapshot_result = run_market_state_job(
            database,
            runtime,
            MarketStateJobRequest(
                snapshot_job.id,
                "qa-snapshot-operation",
                snapshot_payload(),
                AttemptScope.GLOBAL,
                NOW,
                NOW_DT,
                NOW,
            ),
        )
        result["snapshotProducer"] = attempts.get(snapshot_result.attempt_id).status is AttemptStatus.SUCCESS

        combined_job = running(TaskType.MARKET_MEMORY_UPDATE)
        traces: list[str] = []
        combined_crashed = False
        database.set_trace_callback(traces.append)
        with patch(
            "features.market_memory.sql_job_service.reconcile_snapshot_attempt",
            side_effect=SimulatedCrash(),
        ):
            try:
                run_combined_market_job(
                    database,
                    runtime,
                    CombinedMarketJobRequest(
                        combined_job.id,
                        "qa-combined-operation",
                        (entry(),),
                        lambda projected: {**snapshot_payload(), "id": "qa-combined-snapshot", "headline": f"projected:{projected.execute('SELECT COUNT(*) FROM market_memory').fetchone()[0]}"},
                        AttemptScope.GLOBAL,
                        NOW,
                        NOW_DT,
                        NOW,
                    ),
                )
            except SimulatedCrash:
                combined_crashed = True
        database.set_trace_callback(None)
        combined_before = store.get(combined_job.id)
        combined_status = recover_market_sql_job(database, runtime, combined_job.id)
        result["combinedProducer"] = len(read_receipts(database, "qa-combined-operation")) == 2
        result["combinedOneTransaction"] = sum(
            statement.strip().upper() == "COMMIT" for statement in traces
        ) == 1
        result["restartAfterCommit"] = (
            combined_before is not None
            and combined_before.status is JobStatus.COMMITTING
            and combined_crashed
            and combined_status is JobStatus.DONE
        )

        interrupted_job = running(TaskType.MARKET_STATE_SNAPSHOT)
        before_transaction_crashed = False
        with patch(
            "features.market_memory.sql_job_service.commit_snapshot_update",
            side_effect=SimulatedCrash(),
        ):
            try:
                run_market_state_job(
                    database,
                    runtime,
                    MarketStateJobRequest(
                        interrupted_job.id,
                        "qa-before-transaction",
                        {**snapshot_payload(), "id": "qa-uncommitted-snapshot"},
                        AttemptScope.US,
                        NOW,
                        NOW_DT,
                        NOW,
                    ),
                )
            except SimulatedCrash:
                before_transaction_crashed = True
        result["restartBeforeTransaction"] = (
            before_transaction_crashed
            and recover_market_sql_job(database, runtime, interrupted_job.id)
            is JobStatus.FAILED_COMMIT_RECOVERY
        )

        invalid_job = running(TaskType.MARKET_STATE_SNAPSHOT)
        invalid_projection = project_terminal_result(
            invalid_job,
            JobStatus.DONE,
            {
                "artifactId": "qa-invalid-snapshot",
                "snapshotId": "qa-invalid-snapshot",
            },
        )
        try:
            lifecycle.claim(
                invalid_job.id,
                "qa-invalid-operation",
                (ExpectedArtifact(storage=StorageKind.SQLITE, type="market_memory_batch", id=invalid_job.id, baseHash=None, baseMarker=None, targetRevision=None, targetHash="a" * 64),),
                invalid_projection,
            )
        except SqlJobLifecycleError:
            result["invalidMetadataRejected"] = store.get(invalid_job.id).status is JobStatus.RUNNING

        stale_plan = prepare_graph_plan(database, ({**entry(), "id": "qa-stale-memory"},), NOW)
        database.execute(
            "INSERT INTO market_memory (memory_id,as_of,date,title,summary,story,created_at) VALUES (?,?,?,?,?,?,?)",
            ("qa-racer", NOW, "2026-07-17", "race", "race", "race", NOW),
        )
        database.commit()
        stale_hash = graph_hash(database)
        try:
            commit_memory_batch(
                database,
                stale_plan,
                job_id="qa-stale-job",
                operation_id="qa-stale-operation",
                terminal_projection=project_terminal_result(memory_job, JobStatus.DONE, {"artifactId": memory_job.id, "savedCount": 1}).model_dump(mode="json"),
                created_at=NOW,
            )
        except ReceiptVerificationError:
            result["staleGraphRejected"] = graph_hash(database) == stale_hash

        receipt_count = database.execute("SELECT COUNT(*) FROM job_operation_receipts").fetchone()[0]
        save_market_state_snapshot(database, {**snapshot_payload(), "id": "qa-manual-snapshot"})
        result["manualReceiptFree"] = database.execute(
            "SELECT COUNT(*) FROM job_operation_receipts"
        ).fetchone()[0] == receipt_count
        operation_receipts = read_receipts(database, "qa-combined-operation")
        result["deterministicIdsClocksOrder"] = (
            thesis_id == deterministic_delta_id("NVDA", NOW, thesis_operation)
            and [row.artifact_type.value for row in operation_receipts]
            == sorted(row.artifact_type.value for row in operation_receipts)
            and all(row.created_at == NOW for row in operation_receipts)
        )
        database.close()
        database = None
        reopened = sqlite3.connect(work / "market-memory.sqlite3")
        reopened.row_factory = sqlite3.Row
        result["savedRowsReceiptsReread"] = (
            reopened.execute("SELECT COUNT(*) FROM thesis_delta WHERE delta_id=?", (thesis_id,)).fetchone()[0] == 1
            and len(read_receipts(reopened, "qa-combined-operation")) == 2
            and reopened.execute("SELECT COUNT(*) FROM market_state_snapshots WHERE snapshot_id='qa-combined-snapshot'").fetchone()[0] == 1
        )
        reopened.close()
        result["jsonProducerPeersUnchanged"] = peer_before == {
            path: _digest(path) for path in peer_paths
        }
    finally:
        if database is not None:
            database.close()
        shutil.rmtree(work, ignore_errors=True)
        shutil.rmtree(receipt_attempt, ignore_errors=True)
        result["cleanup"] = not work.exists() and not receipt_attempt.exists() and not list(
            attempt_dir.rglob("*.sqlite3*")
        )
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", type=Path, required=True)
    parser.add_argument("--attempt-dir", type=Path, required=True)
    args = parser.parse_args()
    args.attempt_dir.mkdir(parents=True, exist_ok=True)
    result = _run(args.source_root.resolve(), args.attempt_dir.resolve())
    target = args.attempt_dir / "result.json"
    target.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"passed": all(result.values()), "result": str(target)}, ensure_ascii=False))
    return 0 if all(result.values()) else 1


if __name__ == "__main__":
    raise SystemExit(main())
