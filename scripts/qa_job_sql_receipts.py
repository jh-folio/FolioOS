#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///

# ─── How to run ───
# 1. Install uv: https://docs.astral.sh/uv/getting-started/installation/
# 2. Run: uv run scripts/qa_job_sql_receipts.py --source-root <repo> --attempt-dir <dir>
# 3. Windows project runtime: py -3 scripts/qa_job_sql_receipts.py --source-root <repo> --attempt-dir <dir>
# ──────────────────

from __future__ import annotations

import argparse
import json
import shutil
import sqlite3
import sys
from datetime import UTC, datetime
from pathlib import Path


NOW = "2026-07-17T03:04:05Z"
type JsonValue = None | bool | int | float | str | list[JsonValue] | dict[str, JsonValue]


def _entry() -> dict[str, JsonValue]:
    return {
        "id": "qa-memory-1",
        "date": "2026-07-17",
        "asOf": NOW,
        "title": "AI 전력 인프라 투자 확대",
        "summary": "PRIVATE_QA_MARKER 공식 자료가 전력 인프라 투자를 확인했다.",
        "story": "qa_power_branch",
        "storyFamily": "qa_power_family",
        "parentStory": "qa_power_family",
        "storyRelation": "branches_from",
        "stateKey": "qa_power_branch",
        "stateStatus": "active",
        "importance": "high",
        "tags": ["AI", "Energy"],
        "industries": ["Energy"],
        "tickers": ["ETN"],
        "sources": [
            {"source": "official-a", "title": "Grid A", "url": "https://a.invalid"},
            {"source": "official-b", "title": "Grid B", "url": "https://b.invalid"},
        ],
    }


def _snapshot(snapshot_id: str) -> dict[str, JsonValue]:
    return {
        "id": snapshot_id,
        "asOf": NOW,
        "horizon": "medium_term",
        "status": "current",
        "headline": "전력 인프라 투자 확대",
        "oneLineSummary": "AI 전력 수요가 인프라 투자를 지지한다.",
        "beginnerSummary": "전력 설비 투자 흐름을 확인한다.",
        "actionPosture": "투자 집행을 확인하며 분할 접근한다.",
        "actionGuide": {"headline": "확인", "action": "분할 접근", "timing": "집행 확인 후"},
        "keyDrivers": [{"id": "driver-1", "title": "전력 투자", "summary": "설비 투자가 늘어난다.", "sourceRefs": ["source-1"]}],
        "watchItems": ["설비 투자 집행률"],
        "counterEvidence": ["금리 상승"],
        "uncertainties": ["투자 집행 속도"],
        "sourceRefs": [{"id": "source-1", "title": "Grid", "source": "official", "date": "2026-07-17", "url": "https://source.invalid"}],
        "confidence": 0.6,
    }


def _open(path: Path) -> sqlite3.Connection:
    connection = sqlite3.connect(path)
    connection.row_factory = sqlite3.Row
    return connection


def _run(source_root: Path, attempt_dir: Path) -> dict[str, bool]:
    sys.path.insert(0, str(source_root))
    from features.common.sqlite_receipts import ReceiptVerificationError, read_receipts
    from features.market_memory.attempt_store import AttemptMode, AttemptScope, AttemptStart, AttemptStatus, AttemptStore
    from features.market_memory.graph_plan import graph_hash, prepare_graph_plan
    from features.market_memory.job_writes import commit_combined_update, prepare_combined_update, reconcile_snapshot_attempt, recover_combined_update
    from features.market_memory.memory import init_db
    from features.market_memory.snapshot import save_market_state_snapshot
    from features.thesis_tracking.job_writes import commit_thesis_delta, prepare_thesis_delta, recover_thesis_delta
    from features.thesis_tracking.store import init_db as init_thesis_db
    from scripts.qa_job_sql_receipts_boundary import artifact_projection, strict_receipt_boundary

    work = attempt_dir / "work"
    if work.exists():
        shutil.rmtree(work)
    work.mkdir(parents=True, exist_ok=True)
    database = work / "market.sqlite3"
    connection = _open(database)
    init_db(connection)
    init_thesis_db(connection)
    thesis = prepare_thesis_delta(
        connection,
        ticker="NVDA",
        delta={"deltaId": "qa-delta", "generatedAt": NOW, "period": "90d", "periodDays": 90, "verdict": "maintained", "summary": "유지", "evidence": []},
        job_id="job-thesis",
        operation_id="op-thesis",
        terminal_projection=artifact_projection("thesis_delta", "qa-delta", None),
        created_at=NOW,
    )
    commit_thesis_delta(connection, thesis)
    thesis_atomic = recover_thesis_delta(connection, thesis)["artifactId"] == "qa-delta"

    attempt_store = AttemptStore(work / "attempts.json")
    attempt = attempt_store.start(
        AttemptStart(
            scope=AttemptScope.GLOBAL,
            mode=AttemptMode.COMBINED_JOB,
            jobId="job-combined",
            operationId="op-combined",
            startedAt=datetime(2026, 7, 17, 3, 4, 5, tzinfo=UTC),
            inputWatermark=NOW,
        ),
        attempt_id="msa_21234567-89ab-4cde-8fab-0123456789ab",
    )

    def snapshot_builder(projected: sqlite3.Connection) -> dict[str, JsonValue]:
        payload = _snapshot("qa-snapshot")
        count = projected.execute("SELECT COUNT(*) FROM market_memory").fetchone()[0]
        payload["headline"] = f"projected-memory-count:{count}"
        return payload

    prepared = prepare_combined_update(
        connection,
        entries=(_entry(),),
        snapshot_builder=snapshot_builder,
        update_attempt_ref=attempt.reference(),
        prepared_at=NOW,
    )
    five_tables = {row.table for row in prepared.graph_plan.touched_rows}
    traces: list[str] = []
    connection.set_trace_callback(traces.append)
    projection = artifact_projection("market_memory_update", "job-combined", "qa-snapshot")
    committed = commit_combined_update(connection, prepared, terminal_projection=projection, created_at=NOW)
    connection.set_trace_callback(None)
    terminal_attempt = reconcile_snapshot_attempt(
        attempt_store,
        prepared.snapshot,
        datetime(2026, 7, 17, 3, 5, 5, tzinfo=UTC),
    )
    receipts = read_receipts(connection, "op-combined")
    recovery_first = recover_combined_update(connection, prepared)
    recovery_second = recover_combined_update(connection, prepared)
    private_excluded = all("PRIVATE_QA_MARKER" not in json.dumps(row.terminal_projection) for row in receipts)

    strict_boundary = strict_receipt_boundary(connection, NOW)

    conflict_db = work / "conflict.sqlite3"
    conflict = _open(conflict_db)
    init_db(conflict)
    conflict_plan = prepare_graph_plan(conflict, (_entry(),), NOW)
    conflict.execute(
        "INSERT INTO market_memory (memory_id,as_of,date,title,summary,story,created_at) VALUES (?,?,?,?,?,?,?)",
        ("racer", NOW, "2026-07-17", "race", "race", "race", NOW),
    )
    conflict.commit()
    conflict_hash = graph_hash(conflict)
    try:
        from features.market_memory.job_writes import commit_memory_batch

        commit_memory_batch(
            conflict,
            conflict_plan,
            job_id="job-conflict",
            operation_id="op-conflict",
            terminal_projection=artifact_projection("market_memory_llm", "job-conflict", None),
            created_at=NOW,
        )
        base_preserved = False
    except ReceiptVerificationError:
        base_preserved = graph_hash(conflict) == conflict_hash and len(read_receipts(conflict, "op-conflict")) == 0
    conflict.close()

    manual_db = work / "manual.sqlite3"
    manual = _open(manual_db)
    init_db(manual)
    save_market_state_snapshot(manual, _snapshot("manual-snapshot"))
    manual_receipt_free = manual.execute("SELECT COUNT(*) FROM job_operation_receipts").fetchone()[0] == 0
    manual.close()
    connection.close()
    reopened = _open(database)
    persisted_receipts = read_receipts(reopened, "op-combined")
    saved_db_reread = (
        len(persisted_receipts) == 2
        and all(row.terminal_projection == projection for row in persisted_receipts)
        and reopened.execute("SELECT COUNT(*) FROM thesis_delta WHERE delta_id='qa-delta'").fetchone()[0] == 1
    )
    deterministic_receipts = [row.artifact_type for row in persisted_receipts] == sorted(
        row.artifact_type for row in persisted_receipts
    ) and all(row.created_at == NOW for row in persisted_receipts)
    reopened.close()

    result = {
        "thesisAtomic": thesis_atomic,
        "memoryFiveTables": five_tables == {"market_memory", "market_narrative_states", "market_memory_taxonomy", "market_story_links", "market_story_family_suggestions"},
        "snapshotAttemptBound": terminal_attempt.status is AttemptStatus.SUCCESS and terminal_attempt.snapshotId == "qa-snapshot",
        "combinedOneTransaction": sum(1 for statement in traces if statement.strip().upper() == "COMMIT") == 1,
        "twoReceipts": len(receipts) == 2,
        "projectedParity": committed.snapshot["headline"] == "projected-memory-count:1",
        "baseConflictPreserved": base_preserved,
        "recoveryDeterministic": recovery_first == recovery_second == projection,
        "manualReceiptFree": manual_receipt_free,
        "privateTextExcluded": private_excluded,
        "strictBoundary": strict_boundary,
        "savedDbReread": saved_db_reread,
        "deterministicReceipts": deterministic_receipts,
        "cleanup": False,
    }
    shutil.rmtree(work)
    result["cleanup"] = not work.exists()
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", type=Path, required=True)
    parser.add_argument("--attempt-dir", type=Path, required=True)
    args = parser.parse_args()
    args.attempt_dir.mkdir(parents=True, exist_ok=True)
    result = _run(args.source_root.resolve(), args.attempt_dir.resolve())
    (args.attempt_dir / "result.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, sort_keys=True))
    return 0 if all(result.values()) else 1


if __name__ == "__main__":
    raise SystemExit(main())
