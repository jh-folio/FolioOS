"""Controlled public projections for note and thesis review intelligence.

The records in this module describe hypothesis state. Evidence references stay
separate and never change a note's layer or evidence-reuse policy.
"""
from __future__ import annotations

from enum import StrEnum
from typing import Annotated, Literal, Self

from pydantic import BaseModel, ConfigDict, Field


UtcZ = Annotated[
    str,
    Field(pattern=r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$"),
]
NoteId = Annotated[str, Field(pattern=r"^[A-Za-z0-9_-]{1,96}$")]
Ticker = Annotated[str, Field(pattern=r"^(?:[A-Z0-9-]{1,12})?$")]
CheckpointId = Annotated[str, Field(pattern=r"^[A-Za-z0-9:_-]{1,120}$")]
ReferenceId = Annotated[str, Field(pattern=r"^[A-Za-z0-9:._-]{1,200}$")]
ReasonCode = Annotated[str, Field(pattern=r"^[a-z][a-z0-9_]{0,79}$")]
ShortText = Annotated[str, Field(min_length=1, max_length=240)]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class Freshness(StrEnum):
    FRESH = "fresh"
    DUE = "due"
    STALE = "stale"
    UNKNOWN = "unknown"


class CheckpointState(StrEnum):
    OPEN = "open"
    DUE = "due"
    CHECKED = "checked"
    INVALIDATED = "invalidated"


class EvidenceReference(StrictModel):
    evidenceId: ReferenceId
    source: Annotated[str, Field(min_length=1, max_length=120)]
    title: Annotated[str, Field(min_length=1, max_length=240)]


class HypothesisCheckpoint(StrictModel):
    id: CheckpointId
    label: ShortText
    state: CheckpointState
    dueAt: UtcZ | None = None
    checkedAt: UtcZ | None = None
    reasonCode: ReasonCode
    evidenceRefs: Annotated[tuple[EvidenceReference, ...], Field(max_length=20)] = ()


class HypothesisIntelligence(StrictModel):
    noteId: NoteId
    ticker: Ticker = ""
    freshness: Freshness
    observedAt: UtcZ | None
    lastReviewedAt: UtcZ | None = None
    nextReviewAt: UtcZ | None = None
    latestDeltaId: ReferenceId | None = None
    reasonCodes: Annotated[tuple[ReasonCode, ...], Field(max_length=12)] = ()
    checkpoints: Annotated[tuple[HypothesisCheckpoint, ...], Field(max_length=20)] = ()
    layer: Literal["hypothesis"] = "hypothesis"
    reuseAsEvidence: Literal[False] = False

    @classmethod
    def from_legacy(cls, payload: dict | None) -> Self:
        legacy = payload if isinstance(payload, dict) else {}
        return cls.model_validate(
            {
                "noteId": legacy.get("noteId") or legacy.get("id") or "",
                "ticker": legacy.get("ticker") or "",
                "freshness": legacy.get("freshness") or Freshness.UNKNOWN,
                "observedAt": legacy.get("observedAt"),
                "lastReviewedAt": legacy.get("lastReviewedAt"),
                "nextReviewAt": legacy.get("nextReviewAt"),
                "latestDeltaId": legacy.get("latestDeltaId"),
                "reasonCodes": legacy.get("reasonCodes") or (),
                "checkpoints": legacy.get("checkpoints") or (),
                "layer": "hypothesis",
                "reuseAsEvidence": False,
            }
        )


__all__ = [
    "CheckpointState",
    "EvidenceReference",
    "Freshness",
    "HypothesisCheckpoint",
    "HypothesisIntelligence",
]

