# /// script
# requires-python = ">=3.12"
# ///
# ─── How to run ───
# py -3 scripts/qa_shared_jobs_core.py --source-root <repo> --attempt-dir <evidence-dir>

from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
import tempfile
from datetime import UTC, datetime
from pathlib import Path
from unittest.mock import patch


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", type=Path, required=True)
    parser.add_argument("--attempt-dir", type=Path, required=True)
    args = parser.parse_args()
    source_root = args.source_root.resolve()
    attempt_dir = args.attempt_dir.resolve()
    attempt_dir.mkdir(parents=True, exist_ok=True)
    sys.path.insert(0, str(source_root))

    from features.agent_mode.work_log import WorkLogService
    from features.agent_mode.work_log_schema import WORK_LOG_ENTRY_KEYS, TokenStatus
    from features.common import jobs

    now = datetime(2026, 7, 17, 0, 0, tzinfo=UTC)
    current = [now]
    clock = lambda: current[0]
    workspace = Path(tempfile.mkdtemp(prefix="shared-jobs-core-", dir=attempt_dir))
    result = {
        "strictStore": False,
        "projectionMatrix": False,
        "legacyMerge": False,
        "privateScrub": False,
        "jobContextCleanup": False,
        "manualPackPreserved": False,
        "restartRecovery": False,
        "workLogDerived": False,
        "clearTokens": False,
        "migrationRollback": False,
        "migrationDomainError": False,
        "migrationPriorV2": False,
        "migrationTokenReissued": False,
        "migrationRestartSafe": False,
        "expiredTokenRollback": False,
        "peerSqliteUnchanged": False,
        "deterministicClock": False,
        "cleanup": False,
    }
    try:
        store = jobs.SharedJobStore(workspace / "jobs-v2.json", workspace / "jobs.json", clock=clock)
        companion = jobs.new_shared_job(
            kind="agent_bridge",
            task_type="companion",
            generation_mode="llm_cli",
            adapter="codex",
            requested_mode="cli",
            mode="answer",
            attempted_engine="cli",
            clock=clock,
        )
        store.add(companion)
        result["strictStore"] = set(json.loads(store.path.read_text(encoding="utf-8"))) == {
            "schemaVersion",
            "storeRevision",
            "updatedAt",
            "jobs",
        }
        matrix = {
            "index": {"count": 1, "generatedAt": "2026-07-17T00:00:00Z", "incremental": True, "sqlite": "x"},
            "rss": {"added": 1, "total": 1, "failed": 0},
            "setup": {"ok": True, "adapter": "codex"},
            "briefing": {
                "artifactId": "2026-07-17.us",
                "reportId": "2026-07-17.us",
                "date": "2026-07-17",
                "title": "US",
            },
            "market_memory_update": {"savedCount": 1, "snapshotId": "s1"},
        }
        projections = []
        for task_type, worker_result in matrix.items():
            candidate = jobs.new_shared_job(
                kind="agent_bridge" if task_type not in {"index", "rss"} else task_type,
                task_type=task_type,
                generation_mode="llm_cli" if task_type not in {"index", "rss"} else "none",
                adapter="codex" if task_type not in {"index", "rss"} else "none",
                requested_mode="cli" if task_type not in {"index", "rss"} else None,
                mode="generate" if task_type not in {"index", "rss"} else ("index" if task_type == "index" else "collect"),
                attempted_engine="cli" if task_type not in {"index", "rss"} else None,
                clock=clock,
            )
            if task_type == "market_memory_update":
                worker_result["artifactId"] = candidate.id
            projections.append(jobs.project_terminal_result(candidate, "done", worker_result).status)
        result["projectionMatrix"] = projections == ["done"] * len(matrix)

        manual = workspace / "agent-context" / "manual.json"
        manual.parent.mkdir()
        manual.write_bytes(b"MANUAL_SENTINEL")
        lifecycle = jobs.JobPrivateLifecycle(workspace / "job-context", clock=clock)
        store.transition(companion.id, jobs.JobStatus.RUNNING)
        lifecycle.set_private(companion.id, {"prompt": "PRIVATE_CANARY"})
        lifecycle.write_pack(companion.id, "pack", {"prompt": "PACK_CANARY"})
        lifecycle.terminalize(
            store,
            companion.id,
            jobs.JobStatus.DONE,
            result={"proposalId": None},
            live_detail={"noticeCode": None, "optionCodes": [], "reply": "safe", "proposalId": None},
        )
        result["privateScrub"] = "CANARY" not in store.path.read_text(encoding="utf-8")
        result["jobContextCleanup"] = not (workspace / "job-context" / companion.id).exists()
        result["manualPackPreserved"] = manual.read_bytes() == b"MANUAL_SENTINEL"

        interrupted = jobs.new_shared_job(
            kind="agent_bridge",
            task_type="companion",
            generation_mode="llm_cli",
            adapter="codex",
            requested_mode="cli",
            mode="answer",
            attempted_engine="cli",
            clock=clock,
        )
        store.add(interrupted)
        lifecycle.write_pack(interrupted.id, "pack", {"prompt": "RESTART_CANARY"})
        lifecycle.recover_startup(store)
        result["restartRecovery"] = store.get(interrupted.id).status == jobs.JobStatus.FAILED_RESTART

        work_log = WorkLogService(
            store,
            workspace / "agent-work-log.json",
            workspace / "agent-proposals",
            clock=clock,
            token_bytes=lambda: b"t" * 32,
        )
        listing = work_log.list(limit=200, offset=0, kind="all")
        result["workLogDerived"] = listing["total"] == 2 and all(
            set(entry) == WORK_LOG_ENTRY_KEYS for entry in listing["entries"]
        )
        preview = work_log.clear_preview("all")
        cleared = work_log.clear("all", preview["previewToken"])
        result["clearTokens"] = cleared["hiddenCount"] == 2 and work_log.list(limit=20, offset=0, kind="all")["total"] == 0

        legacy = workspace / "legacy-jobs.json"
        legacy_payload = {"legacy": {"id": "legacy", "kind": "index", "status": "done", "createdAt": "2026-07-17T00:00:00Z", "updatedAt": "2026-07-17T00:00:00Z", "finishedAt": "2026-07-17T00:00:00Z", "result": {"count": 1, "generatedAt": "2026-07-17T00:00:00Z", "incremental": True, "sqlite": "x"}}}
        legacy.write_text(json.dumps(legacy_payload), encoding="utf-8")
        migration_store = jobs.SharedJobStore(workspace / "migration-v2.json", legacy, clock=clock)
        result["legacyMerge"] = migration_store.legacy_preview().migratable_jobs == 1 and len(migration_store.merged().jobs) == 1
        migration_store.add(jobs.new_shared_job(kind="index", task_type="index", generation_mode="none", adapter="none", requested_mode=None, mode="index", attempted_engine=None, clock=clock))
        migration_log = WorkLogService(
            migration_store,
            workspace / "migration-work-log.json",
            workspace / "agent-proposals",
            clock=clock,
            token_bytes=lambda: b"m" * 32,
        )
        migration_token = migration_log.migration_preview()["previewToken"]
        legacy_before = legacy.read_bytes()
        v2_before = migration_store.path.read_bytes()
        peer_files = {
            workspace / "market-memory.sqlite3": b"SQLITE_SENTINEL",
            workspace / "market-memory.sqlite3-wal": b"WAL_SENTINEL",
            workspace / "market-memory.sqlite3-shm": b"SHM_SENTINEL",
        }
        for path, content in peer_files.items():
            path.write_bytes(content)
        real_replace = os.replace
        injected = False

        def fail_first_v2_replace(source, destination) -> None:
            nonlocal injected
            if not injected and Path(destination) == migration_store.path:
                injected = True
                raise OSError("injected v2 replace failure")
            real_replace(source, destination)

        with patch.object(os, "replace", side_effect=fail_first_v2_replace):
            try:
                migration_log.migration_confirm(migration_token, "migrate_delete_original")
            except jobs.JobsStoreUnavailableError as error:
                result["migrationDomainError"] = error.code == "jobs_store_unavailable"
        result["migrationRollback"] = (
            legacy.read_bytes() == legacy_before
            and not list(workspace.glob("legacy-jobs.json.quarantine.*"))
            and not list(workspace.glob("job-migration-*.json"))
        )
        result["migrationPriorV2"] = migration_store.path.read_bytes() == v2_before
        rolled_back_token = migration_log.store.load().tokens[-1]
        result["migrationTokenReissued"] = rolled_back_token.status == TokenStatus.ISSUED and rolled_back_token.operationId is None
        restarted_log = WorkLogService(migration_store, workspace / "migration-work-log.json", workspace / "agent-proposals", clock=clock)
        result["migrationRestartSafe"] = restarted_log.store.load().tokens[-1].status == TokenStatus.ISSUED
        result["peerSqliteUnchanged"] = all(path.read_bytes() == content for path, content in peer_files.items())
        result["deterministicClock"] = current[0] == now and rolled_back_token.expiresAt == "2026-07-17T00:10:00Z"

        expired_legacy = workspace / "expired-jobs.json"
        expired_legacy.write_bytes(legacy_before)
        expired_store = jobs.SharedJobStore(workspace / "expired-v2.json", expired_legacy, clock=clock)
        expired_log = WorkLogService(expired_store, workspace / "expired-work-log.json", workspace / "agent-proposals", clock=clock, token_bytes=lambda: b"e" * 32)
        expired_token = expired_log.migration_preview()["previewToken"]
        expired_injected = False
        expired_domain_error = False

        def fail_expired_v2_replace(source, destination) -> None:
            nonlocal expired_injected
            if not expired_injected and Path(destination) == expired_store.path:
                expired_injected = True
                current[0] = now.replace(minute=10)
                raise OSError("injected expired v2 replace failure")
            real_replace(source, destination)

        with patch.object(os, "replace", side_effect=fail_expired_v2_replace):
            try:
                expired_log.migration_confirm(expired_token, "migrate_delete_original")
            except jobs.JobsStoreUnavailableError as error:
                expired_domain_error = error.code == "jobs_store_unavailable"
        expired_record = expired_log.store.load().tokens[-1]
        result["expiredTokenRollback"] = (
            expired_legacy.read_bytes() == legacy_before
            and expired_domain_error
            and expired_record.status == TokenStatus.IN_PROGRESS
            and not list(workspace.glob("expired-jobs.json.quarantine.*"))
            and not list(workspace.glob("job-migration-*.json"))
            and not expired_store.path.exists()
        )
    finally:
        shutil.rmtree(workspace, ignore_errors=True)
        result["cleanup"] = not workspace.exists()
        (attempt_dir / "result.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    passed = all(result.values())
    print(json.dumps({"passed": passed, "result": str(attempt_dir / "result.json")}, ensure_ascii=False))
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
