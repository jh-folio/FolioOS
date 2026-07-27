from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

from features.market_memory.manual_snapshot import (
    CommittedManualSnapshot,
    ManualSnapshotBoundary,
    ManualSnapshotCandidate,
)
from features.market_memory.snapshot import save_market_state_snapshot


NOW = datetime(2026, 7, 17, 12, tzinfo=UTC)


@dataclass(slots=True)  # noqa: MUTABLE_OK -- records observable adapter calls for integration tests.
class RecordingBackend:
    db_path: Path
    prepare_calls: int = 0
    save_calls: int = 0

    def prepare(self, request):
        self.prepare_calls += 1
        reference = request.updateAttemptRef
        payload = {
            "id": f"mss_{reference.scope.value.lower()}",
            "asOf": "2026-07-17T12:00:00Z",
            "headline": "Prompt injection canary is context only",
            "oneLineSummary": "Bounded market state",
            "marketRegime": "mixed",
            "actionPosture": "check",
            "keyDrivers": [{"title": "Driver", "summary": "Bounded", "sourceRefs": ["src:1"]}],
            "watchItems": ["Checkpoint"],
            "counterEvidence": ["Challenge"],
            "uncertainties": ["Unknown"],
            "sourceRefs": [{"id": "src:1", "title": "Source", "source": "Fixture"}],
            "confidence": 0.7,
            "inputWatermarks": request.inputWatermarks,
            "updateAttemptRef": reference.model_dump(mode="json"),
        }
        return ManualSnapshotCandidate(payload=payload, updateAttemptRef=reference)

    def save(self, candidate: ManualSnapshotCandidate) -> CommittedManualSnapshot:
        self.save_calls += 1
        snapshot = save_market_state_snapshot(self.db_path, candidate.payload)
        return CommittedManualSnapshot(
            snapshotId=str(snapshot["id"]),
            savedAt=NOW,
            updateAttemptRef=candidate.updateAttemptRef,
        )


@dataclass(slots=True)  # noqa: MUTABLE_OK -- deterministic crash injection state.
class CrashHook:
    boundary: ManualSnapshotBoundary | None = None

    def __call__(self, current: ManualSnapshotBoundary) -> None:
        if current is self.boundary:
            raise InjectedTestCrash(current)


@dataclass(frozen=True, slots=True)
class InjectedTestCrash(Exception):
    boundary: ManualSnapshotBoundary

    def __str__(self) -> str:
        return f"crash:{self.boundary.value}"
