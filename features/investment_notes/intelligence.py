"""Rules-only note and Thesis intelligence projections."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Callable

from features.investment_notes import service as note_service
from features.investment_notes.intelligence_schema import (
    CheckpointState,
    HypothesisCheckpoint,
    HypothesisIntelligence,
)
from features.market_memory.market_state_ref import (
    MarketStateRefQuery,
    resolve_market_state_ref,
)
from features.thesis_tracking import review_state
from features.thesis_tracking import store as thesis_store


@dataclass(frozen=True, slots=True)
class IntelligenceRuntime:
    dataDir: Path
    clock: Callable[[], datetime]

    @property
    def notesDir(self) -> Path:
        return self.dataDir / "investment-notes"

    @property
    def marketMemoryDbPath(self) -> Path:
        return self.dataDir / "market-memory.sqlite3"

    @property
    def researchDbPath(self) -> Path:
        return self.dataDir / "research-index.sqlite3"


@dataclass(frozen=True, slots=True)
class IntelligenceServiceError(Exception):
    code: str

    def __str__(self) -> str:
        return self.code


class IntelligenceNotFoundError(IntelligenceServiceError):
    pass


class IntelligenceConflictError(IntelligenceServiceError):
    pass


def _utc_z(value: datetime) -> str:
    if value.utcoffset() is None:
        value = value.replace(tzinfo=UTC)
    return value.astimezone(UTC).isoformat(timespec="seconds").replace("+00:00", "Z")


def checkpoint_counts(checkpoints: tuple[HypothesisCheckpoint, ...]) -> dict[str, int]:
    return {
        state.value: sum(checkpoint.state is state for checkpoint in checkpoints)
        for state in CheckpointState
    }


def _latest_delta_projection(delta: dict | None) -> dict | None:
    if not delta:
        return None
    return {
        "deltaId": str(delta.get("deltaId") or "")[:200],
        "verdict": str(delta.get("verdict") or "insufficient_evidence")[:40],
        "generatedAt": str(delta.get("generatedAt") or "")[:48],
        "counterEvidenceCount": min(len(delta.get("counterEvidence") or []), 1000),
        "contradictionCount": min(len(delta.get("contradictions") or []), 1000),
        "uncertaintyCount": min(len(delta.get("uncertainties") or []), 1000),
    }


class IntelligenceService:
    def __init__(self, runtime: IntelligenceRuntime) -> None:
        self.runtime = runtime

    def _market_state_ref(self) -> dict:
        return resolve_market_state_ref(
            MarketStateRefQuery(
                market_db_path=self.runtime.marketMemoryDbPath,
                research_db_path=self.runtime.researchDbPath,
                scope="GLOBAL",
                now=self.runtime.clock(),
            )
        )

    def _note(self, note_id: str) -> dict:
        note = note_service.get_note(note_id, notes_dir=self.runtime.notesDir)
        if not note:
            raise IntelligenceNotFoundError("note_not_found")
        return note

    def _thesis_parts(self, ticker: str) -> tuple[dict | None, dict | None, review_state.ReviewState]:
        connection = thesis_store.connect(self.runtime.marketMemoryDbPath)
        try:
            thesis = thesis_store.get_thesis(connection, ticker)
            if thesis is None:
                return None, None, review_state.empty_review_state(ticker)
            latest = thesis_store.latest_delta(connection, ticker)
            state = review_state.load_review_state(connection, ticker)
            if state.revision == 0:
                state = review_state.state_from_thesis(thesis, now=self.runtime.clock())
            return thesis, latest, state
        finally:
            connection.close()

    def _payload(self, ticker: str, note: dict | None) -> dict:
        thesis, latest, state = self._thesis_parts(ticker)
        reasons: list[str] = []
        if thesis is None:
            reasons.append("thesis_missing")
        if latest is None:
            reasons.append("delta_missing")
        if not state.checkpoints:
            reasons.append("checkpoints_missing")
        if state.freshness.value in {"due", "stale"}:
            reasons.append("review_due")
        observed_at = _utc_z(self.runtime.clock())
        note_id = str((note or {}).get("id") or f"thesis-{ticker.lower()}")
        intelligence = HypothesisIntelligence(
            noteId=note_id,
            ticker=ticker,
            freshness=state.freshness,
            observedAt=observed_at,
            lastReviewedAt=state.lastReviewedAt,
            nextReviewAt=state.nextReviewAt,
            latestDeltaId=state.latestDeltaId,
            reasonCodes=tuple(reasons),
            checkpoints=state.checkpoints,
        )
        thesis_ref = None
        if thesis is not None:
            thesis_ref = {
                "ticker": thesis["ticker"],
                "company": str(thesis.get("company") or "")[:120],
                "status": str(thesis.get("status") or "")[:32],
                "reviewCycle": str(thesis.get("review_cycle") or "")[:32],
                "conviction": str(thesis.get("conviction") or "")[:32],
            }
        note_ref = None
        if note is not None:
            note_ref = {
                "id": note["id"],
                "ticker": str(note.get("ticker") or ""),
                "title": str(note.get("title") or "")[:160],
                "linkedReports": [str(item)[:160] for item in (note.get("linkedReports") or [])[:20]],
            }
        return {
            "note": note_ref,
            "thesis": thesis_ref,
            "latestDelta": _latest_delta_projection(latest),
            "reviewState": state.model_dump(mode="json"),
            "checkpointCounts": checkpoint_counts(state.checkpoints),
            "marketStateRef": self._market_state_ref(),
            "reasonCodes": list(intelligence.reasonCodes),
            "observedAt": intelligence.observedAt,
            "layer": intelligence.layer,
            "reuseAsEvidence": intelligence.reuseAsEvidence,
        }

    def note(self, note_id: str) -> dict:
        note = self._note(note_id)
        ticker = str(note.get("ticker") or "")
        if not ticker:
            raise IntelligenceConflictError("note_ticker_missing")
        return self._payload(ticker, note)

    def thesis(self, ticker: str) -> dict:
        thesis, _, _ = self._thesis_parts(ticker)
        if thesis is None:
            raise IntelligenceNotFoundError("thesis_not_found")
        return self._payload(ticker, None)

    def update_checkpoint(
        self,
        ticker: str,
        *,
        note_id: str,
        checkpoint_id: str,
        state: CheckpointState,
        expected_revision: int,
    ) -> dict:
        note = self._note(note_id)
        if str(note.get("ticker") or "") != ticker:
            raise IntelligenceConflictError("note_ticker_mismatch")
        thesis, _, current = self._thesis_parts(ticker)
        if thesis is None:
            raise IntelligenceNotFoundError("thesis_not_found")
        target = next(
            (checkpoint for checkpoint in current.checkpoints if checkpoint.id == checkpoint_id),
            None,
        )
        if target is None:
            raise IntelligenceNotFoundError("checkpoint_not_found")
        now = _utc_z(self.runtime.clock())
        updated_checkpoints = tuple(
            checkpoint.model_copy(
                update={
                    "state": state,
                    "checkedAt": now if state is CheckpointState.CHECKED else checkpoint.checkedAt,
                }
            )
            if checkpoint.id == checkpoint_id
            else checkpoint
            for checkpoint in current.checkpoints
        )
        candidate = current.model_copy(
            update={"checkpoints": updated_checkpoints, "updatedAt": now}
        )
        connection = thesis_store.connect(self.runtime.marketMemoryDbPath)
        try:
            saved = review_state.save_review_state(
                connection,
                candidate,
                expected_revision=expected_revision,
            )
        except review_state.ReviewStateConflictError as error:
            raise IntelligenceConflictError(str(error)) from error
        finally:
            connection.close()
        return {
            **self._payload(ticker, note),
            "reviewState": saved.model_dump(mode="json"),
            "checkpointCounts": checkpoint_counts(saved.checkpoints),
        }


__all__ = [
    "IntelligenceConflictError",
    "IntelligenceNotFoundError",
    "IntelligenceRuntime",
    "IntelligenceService",
    "IntelligenceServiceError",
    "checkpoint_counts",
]

