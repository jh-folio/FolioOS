from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Literal, assert_never

from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict

from features.automation import service as automation_service
from features.market_memory.attempt_store import AttemptErrorCode, AttemptStore
from features.market_memory.http_service import (
    MarketStateHttpRuntime,
    MarketStateHttpService,
    MarketStateStorage,
    SnapshotPreparation,
)
from features.market_memory.manual_snapshot import (
    CommittedManualSnapshot,
    Clock,
    ManualSnapshotBoundary,
    ManualSnapshotCandidate,
    ManualSnapshotStageError,
)
from features.market_memory.routes import MarketStateBoundary, MarketStateRouteAdapters
from features.market_memory.snapshot import ensure_snapshot_table, save_market_state_snapshot


class ControlBody(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    action: Literal[
        "default", "adapter_failed", "crash_before", "crash_after", "fallback", "empty",
        "add_evidence", "tamper_ref", "automation", "corrupt_store",
    ]
    scope: Literal["GLOBAL", "US", "KR"] = "GLOBAL"
    timestamp: str = "2026-07-17T12:00:00Z"


@dataclass(frozen=True, slots=True)
class QaBackend:
    storage: MarketStateStorage
    clock: Clock
    controlPath: Path

    def _control(self) -> str:
        return self.controlPath.read_text(encoding="utf-8").strip() if self.controlPath.exists() else "default"

    def prepare(self, request: SnapshotPreparation) -> ManualSnapshotCandidate:
        if self._control() == "adapter_failed":
            raise ManualSnapshotStageError(AttemptErrorCode.ADAPTER_FAILED)
        reference = request.updateAttemptRef
        payload = {
            "id": "mss_" + reference.id.removeprefix("msa_"),
            "asOf": self.clock().isoformat(timespec="seconds").replace("+00:00", "Z"),
            "headline": "PROMPT_INJECTION_CANARY context only",
            "oneLineSummary": "Bounded market state",
            "marketRegime": "mixed",
            "actionPosture": "check",
            "keyDrivers": [{"title": "Driver", "summary": "Bounded", "sourceRefs": ["src:1"]}],
            "watchItems": ["Checkpoint"],
            "counterEvidence": ["Challenge"],
            "uncertainties": ["Unknown"],
            "sourceRefs": [{"id": "src:1", "title": "Fixture", "source": "QA"}],
            "confidence": 0.7,
            "inputWatermarks": request.inputWatermarks,
            "updateAttemptRef": reference.model_dump(mode="json"),
        }
        return ManualSnapshotCandidate(payload=payload, updateAttemptRef=reference)

    def save(self, candidate: ManualSnapshotCandidate) -> CommittedManualSnapshot:
        snapshot = save_market_state_snapshot(self.storage.marketDbPath, candidate.payload)
        return CommittedManualSnapshot(
            snapshotId=str(snapshot["id"]),
            savedAt=self.clock(),
            updateAttemptRef=candidate.updateAttemptRef,
        )

    def fail(self, boundary: ManualSnapshotBoundary) -> None:
        mode = self._control()
        if mode == "crash_before" and boundary is ManualSnapshotBoundary.AFTER_ATTEMPT_START:
            raise QaInjectedCrash("qa_crash_before_snapshot")
        if mode == "crash_after" and boundary is ManualSnapshotBoundary.AFTER_SNAPSHOT_SAVE:
            raise QaInjectedCrash("qa_crash_after_snapshot")


@dataclass(frozen=True, slots=True)
class QaInjectedCrash(Exception):
    code: str

    def __str__(self) -> str:
        return self.code


def _clear_snapshots(storage: MarketStateStorage) -> sqlite3.Connection:
    connection = sqlite3.connect(storage.marketDbPath)
    connection.row_factory = sqlite3.Row
    ensure_snapshot_table(connection)
    connection.execute("DELETE FROM market_state_snapshots")
    connection.execute("DELETE FROM market_narrative_states")
    return connection


def _inventory(storage: MarketStateStorage) -> dict[str, JsonValue]:
    attempts = AttemptStore(storage.attemptPath).load().attempts
    documents = 0
    if storage.researchDbPath.exists():
        with sqlite3.connect(storage.researchDbPath) as connection:
            table = connection.execute("SELECT 1 FROM sqlite_master WHERE name='documents'").fetchone()
            documents = int(connection.execute("SELECT COUNT(*) FROM documents").fetchone()[0]) if table else 0
    return {
        "attemptCount": len(attempts),
        "attempts": [row.model_dump(mode="json") for row in attempts],
        "evidenceCount": documents,
    }


def create_qa_market_state_router(data_dir: Path, clock: Clock) -> APIRouter:
    storage = MarketStateStorage.from_data_dir(data_dir)
    control = data_dir / "market-state-control.txt"
    backend = QaBackend(storage, clock, control)
    runtime = MarketStateHttpRuntime(storage, clock, backend, backend.fail)
    service = MarketStateHttpService(runtime)
    adapters = MarketStateRouteAdapters(memoryRunner=lambda _date: {"ok": True, "saved": []})
    router = APIRouter()
    router.include_router(MarketStateBoundary(service, adapters).router())

    @router.get("/qa/market-state/inventory")
    def inventory():
        return _inventory(storage)

    @router.post("/qa/market-state/control")
    def apply_control(body: ControlBody):
        match body.action:
            case "default" | "adapter_failed" | "crash_before" | "crash_after":
                control.write_text(body.action, encoding="utf-8")
            case "fallback" | "empty":
                with _clear_snapshots(storage) as connection:
                    if body.action == "fallback":
                        connection.execute(
                            "INSERT INTO market_narrative_states "
                            "(state_id,state_key,state_label,story,status,effective_from,updated_at) VALUES (?,?,?,?,?,?,?)",
                            ("qa_state", "qa", "QA fallback", "QA", "watch", body.timestamp, body.timestamp),
                        )
            case "add_evidence":
                with sqlite3.connect(storage.researchDbPath) as connection:
                    connection.execute(
                        "CREATE TABLE IF NOT EXISTS documents "
                        "(doc_id TEXT PRIMARY KEY,path TEXT,type TEXT,market_relevance REAL,metadata_json TEXT,content_updated_at TEXT)"
                    )
                    connection.execute(
                        "INSERT OR REPLACE INTO documents VALUES (?,?,?,?,?,?)",
                        ("qa_doc", "research-inbox/rss/qa.md", "article", 1, json.dumps({"markets": [body.scope]}), body.timestamp),
                    )
            case "tamper_ref":
                with sqlite3.connect(storage.marketDbPath) as connection:
                    row = connection.execute(
                        "SELECT snapshot_id,payload_json FROM market_state_snapshots ORDER BY as_of DESC LIMIT 1"
                    ).fetchone()
                    payload = json.loads(row[1])
                    payload["updateAttemptRef"]["scope"] = "KR" if payload["updateAttemptRef"]["scope"] != "KR" else "US"
                    connection.execute(
                        "UPDATE market_state_snapshots SET payload_json=? WHERE snapshot_id=?",
                        (json.dumps(payload), row[0]),
                    )
            case "automation":
                automation_service.RUNS_PATH = data_dir / "automation-runs.json"
                automation_service.import_rssarchive = lambda **_kwargs: {"ok": True, "rss": 0}
                automation_service.run_rss_market_memory_update = lambda: {"ok": True, "memory": 0}
                return automation_service.run_automation_once("briefingPrerequisites")
            case "corrupt_store":
                storage.attemptPath.write_text("{broken", encoding="utf-8")
                storage.attemptBackupPath.write_text("{also-broken", encoding="utf-8")
            case unreachable:
                assert_never(unreachable)
        return {"ok": True, "action": body.action}

    return router
