"""Deterministic, bounded Smart Collection health projections."""
from __future__ import annotations

from enum import StrEnum
from typing import Annotated, Self

from pydantic import BaseModel, ConfigDict, Field

from features.smart_collections.schema import COLLECTION_ID_PATTERN


UtcZ = Annotated[
    str,
    Field(pattern=r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$"),
]
CandidateId = Annotated[str, Field(pattern=r"^[A-Za-z0-9:._-]{1,200}$")]
ReasonCode = Annotated[str, Field(pattern=r"^[a-z][a-z0-9_]{0,79}$")]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class CollectionHealth(StrEnum):
    ACTIVE = "active"
    STALE = "stale"
    EMPTY = "empty"
    NOISY = "noisy"


class CollectionHealthProjection(StrictModel):
    collectionId: Annotated[str, Field(pattern=COLLECTION_ID_PATTERN.pattern)]
    revision: Annotated[int, Field(ge=1)]
    health: CollectionHealth
    observedAt: UtcZ | None
    itemCount: Annotated[int, Field(ge=0, le=1_000_000)] = 0
    addedIds: Annotated[tuple[CandidateId, ...], Field(max_length=120)] = ()
    removedIds: Annotated[tuple[CandidateId, ...], Field(max_length=120)] = ()
    unchangedIds: Annotated[tuple[CandidateId, ...], Field(max_length=120)] = ()
    reasonCodes: Annotated[tuple[ReasonCode, ...], Field(max_length=12)] = ()

    @classmethod
    def from_legacy(cls, payload: dict | None) -> Self:
        legacy = payload if isinstance(payload, dict) else {}
        item_count = legacy.get("itemCount") or 0
        return cls.model_validate(
            {
                "collectionId": legacy.get("collectionId") or legacy.get("id") or "",
                "revision": legacy.get("revision") or 1,
                "health": legacy.get("health")
                or (CollectionHealth.EMPTY if item_count == 0 else CollectionHealth.ACTIVE),
                "observedAt": legacy.get("observedAt"),
                "itemCount": item_count,
                "addedIds": legacy.get("addedIds") or (),
                "removedIds": legacy.get("removedIds") or (),
                "unchangedIds": legacy.get("unchangedIds") or (),
                "reasonCodes": legacy.get("reasonCodes") or (),
            }
        )


class CollectionChangeProjection(StrictModel):
    collectionId: Annotated[str, Field(pattern=COLLECTION_ID_PATTERN.pattern)]
    revision: Annotated[int, Field(ge=1)]
    observedAt: UtcZ
    health: CollectionHealth
    addedIds: Annotated[tuple[CandidateId, ...], Field(max_length=120)] = ()
    removedIds: Annotated[tuple[CandidateId, ...], Field(max_length=120)] = ()
    unchangedIds: Annotated[tuple[CandidateId, ...], Field(max_length=120)] = ()
    addedCount: Annotated[int, Field(ge=0)] = 0
    removedCount: Annotated[int, Field(ge=0)] = 0
    unchangedCount: Annotated[int, Field(ge=0)] = 0
    eligibleCount: Annotated[int, Field(ge=0)] = 0
    resolvedCount: Annotated[int, Field(ge=0)] = 0
    unusableCount: Annotated[int, Field(ge=0)] = 0
    truncated: bool = False
    reasonCodes: Annotated[tuple[ReasonCode, ...], Field(min_length=1, max_length=12)]


__all__ = [
    "CollectionChangeProjection",
    "CollectionHealth",
    "CollectionHealthProjection",
]
