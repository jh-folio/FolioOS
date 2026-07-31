from __future__ import annotations

import json
import sqlite3
from contextlib import closing
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Protocol

from pydantic import ValidationError

from features.agent_mode.market_state_context import (
    MarketStateProjection,
    MarketStateSelection,
    project_market_state,
)
from features.market_memory.attempt_store import (
    AttemptScope,
    AttemptStore,
    UpdateAttemptRef,
)
from features.market_memory.manual_snapshot import (
    CommittedManualSnapshot,
    Clock,
    FailureHook,
    ManualLifecycleAdapters,
    ManualSnapshotCandidate,
    ManualSnapshotLifecycle,
    ManualSnapshotRepairRequiredError,
    ManualSnapshotRequest,
    recover_manual_attempts,
)
from features.market_memory.market_state_ref import (
    JsonValue,
    MarketStateRef,
    MarketStateRefQuery,
    capture_input_watermarks,
    resolve_market_state_ref,
)
from features.market_memory.snapshot import current_market_state_snapshot
from features.market_memory.state_dashboard import market_state_dashboard_payload


@dataclass(frozen=True, slots=True)
class MarketStateStorage:
    marketDbPath: Path
    researchDbPath: Path
    attemptPath: Path

    @classmethod
    def from_data_dir(cls, data_dir: Path) -> MarketStateStorage:
        return cls(
            marketDbPath=data_dir / "market-memory.sqlite3",
            researchDbPath=data_dir / "research-index.sqlite3",
            attemptPath=data_dir / "market-state-update-attempts.json",
        )

    @property
    def attemptBackupPath(self) -> Path:
        return self.attemptPath.with_name(self.attemptPath.name + ".bak")


@dataclass(frozen=True, slots=True)
class SnapshotPreparation:
    date: str | None
    updateAttemptRef: UpdateAttemptRef
    inputWatermarks: dict[str, JsonValue]


class ManualSnapshotBackend(Protocol):
    def prepare(self, request: SnapshotPreparation) -> ManualSnapshotCandidate: ...

    def save(self, candidate: ManualSnapshotCandidate) -> CommittedManualSnapshot: ...


@dataclass(frozen=True, slots=True)
class MarketStateHttpRuntime:
    storage: MarketStateStorage
    clock: Clock
    backend: ManualSnapshotBackend
    failureHook: FailureHook


@dataclass(frozen=True, slots=True)
class ManualSnapshotCommand:
    scope: AttemptScope
    date: str | None = None


def _stored_instant_utc_z(value: object) -> str:
    text = str(value).strip()
    parsed = datetime.fromisoformat(text[:-1] + "+00:00" if text.endswith("Z") else text)
    if parsed.tzinfo is None:
        raise ValueError("timezone_required")
    return parsed.astimezone(UTC).isoformat().replace("+00:00", "Z")


def _committed_manual_snapshots(path: Path) -> tuple[CommittedManualSnapshot, ...]:
    if not path.is_file():
        return ()
    try:
        with closing(sqlite3.connect(f"file:{path.as_posix()}?mode=ro", uri=True)) as connection:
            table = connection.execute(
                "SELECT 1 FROM sqlite_master WHERE type='table' AND name='market_state_snapshots'"
            ).fetchone()
            rows = connection.execute(
                "SELECT snapshot_id,as_of,payload_json FROM market_state_snapshots WHERE status != 'archived'"
            ).fetchall() if table else []
    except sqlite3.Error as error:
        raise ManualSnapshotRepairRequiredError() from error
    committed: list[CommittedManualSnapshot] = []
    for snapshot_id, as_of, raw in rows:
        try:
            payload = json.loads(str(raw))
        except (json.JSONDecodeError, TypeError) as error:
            raise ManualSnapshotRepairRequiredError() from error
        if not isinstance(payload, dict) or "updateAttemptRef" not in payload:
            continue
        try:
            committed.append(
                CommittedManualSnapshot(
                    snapshotId=str(snapshot_id),
                    savedAt=_stored_instant_utc_z(as_of),
                    updateAttemptRef=UpdateAttemptRef.model_validate_json(
                        json.dumps(payload["updateAttemptRef"])
                    ),
                )
            )
        except (ValidationError, ValueError) as error:
            raise ManualSnapshotRepairRequiredError() from error
    return tuple(committed)


class MarketStateHttpService:
    def __init__(self, runtime: MarketStateHttpRuntime) -> None:
        self._runtime = runtime
        self._store = AttemptStore(runtime.storage.attemptPath)

    def reconcile(self):
        committed = _committed_manual_snapshots(self._runtime.storage.marketDbPath)
        return recover_manual_attempts(self._store, committed, self._runtime.clock())

    def _query(self, scope: AttemptScope) -> MarketStateRefQuery:
        state = self.reconcile()
        attempts = tuple(row.model_dump(mode="json") for row in state.attempts)
        return MarketStateRefQuery(
            self._runtime.storage.marketDbPath,
            self._runtime.storage.researchDbPath,
            scope.value,
            self._runtime.clock(),
            attempts,
        )

    def reference(self, scope: AttemptScope) -> MarketStateRef:
        return resolve_market_state_ref(self._query(scope))

    def current(self, scope: AttemptScope) -> dict[str, JsonValue]:
        snapshot = current_market_state_snapshot(self._runtime.storage.marketDbPath)
        return {"ok": bool(snapshot), "snapshot": snapshot, "marketStateRef": self.reference(scope)}

    def dashboard(self, scope: AttemptScope, limit: int) -> dict[str, JsonValue]:
        return market_state_dashboard_payload(
            self._runtime.storage.marketDbPath,
            limit=limit,
            ref_query=self._query(scope),
        )

    def context(self, selection: MarketStateSelection) -> MarketStateProjection:
        return project_market_state(selection, self._query(AttemptScope.GLOBAL))

    def run_manual(self, command: ManualSnapshotCommand) -> dict[str, JsonValue]:
        self.reconcile()
        watermarks = capture_input_watermarks(self._runtime.storage.researchDbPath)
        request = ManualSnapshotRequest(
            scope=command.scope,
            inputWatermark=watermarks[command.scope.value],
        )

        def prepare(reference: UpdateAttemptRef) -> ManualSnapshotCandidate:
            return self._runtime.backend.prepare(SnapshotPreparation(command.date, reference, watermarks))

        adapters = ManualLifecycleAdapters(
            clock=self._runtime.clock,
            prepare=prepare,
            save=self._runtime.backend.save,
            failureHook=self._runtime.failureHook,
        )
        result = ManualSnapshotLifecycle(self._store, adapters).run(request)
        snapshot = current_market_state_snapshot(self._runtime.storage.marketDbPath)
        return {
            "ok": True,
            "status": "ok",
            "snapshot": snapshot,
            "attempt": result.attempt.model_dump(mode="json"),
            "marketStateRef": self.reference(command.scope),
        }
