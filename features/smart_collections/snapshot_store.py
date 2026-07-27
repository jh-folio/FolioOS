from __future__ import annotations

import json
import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from threading import RLock
from typing import Any

from pydantic import ValidationError

from features.smart_collections.schema import (
    COLLECTION_ID_PATTERN,
    CollectionResolutionSnapshot,
    CollectionSnapshotFile,
    SnapshotProviderGenerations,
)


SNAPSHOT_HISTORY_LIMIT = 8


@dataclass(frozen=True, slots=True)
class SnapshotState:
    collectionId: str
    history: tuple[CollectionResolutionSnapshot, ...]
    recovered: bool = False


@dataclass(frozen=True, slots=True)
class SnapshotStoreUnavailableError(Exception):
    code: str = "collection_snapshot_unavailable"

    def __str__(self) -> str:
        return self.code


@lru_cache(maxsize=128)
def snapshot_lock(path: str) -> RLock:
    return RLock()


class SnapshotStore:
    def __init__(self, root: Path) -> None:
        self.root = root

    def _paths(self, collection_id: str) -> tuple[Path, Path]:
        if COLLECTION_ID_PATTERN.fullmatch(collection_id) is None:
            raise SnapshotStoreUnavailableError()
        root = self.root.resolve()
        primary = (root / f"{collection_id}.json").resolve()
        if primary.parent != root:
            raise SnapshotStoreUnavailableError()
        return primary, primary.with_name(primary.name + ".bak")

    def _parse(self, path: Path, collection_id: str) -> CollectionSnapshotFile:
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
            parsed = CollectionSnapshotFile.model_validate(payload)
        except (OSError, UnicodeError, json.JSONDecodeError, ValidationError) as error:
            raise SnapshotStoreUnavailableError() from error
        if parsed.collectionId != collection_id:
            raise SnapshotStoreUnavailableError()
        return parsed

    def _replace(self, path: Path, payload: str, suffix: str) -> None:
        temporary = path.with_name(path.name + suffix)
        try:
            path.parent.mkdir(parents=True, exist_ok=True)
            temporary.write_text(payload, encoding="utf-8")
            os.replace(temporary, path)
        except OSError as error:
            raise SnapshotStoreUnavailableError() from error

    def _restore(
        self,
        primary: Path,
        backup: Path,
        collection_id: str,
    ) -> SnapshotState:
        parsed = self._parse(backup, collection_id)
        self._replace(primary, parsed.model_dump_json(indent=2), ".restore.tmp")
        restored = self._parse(primary, collection_id)
        return SnapshotState(
            collectionId=restored.collectionId,
            history=tuple(restored.history),
            recovered=True,
        )

    def load(self, collection_id: str) -> SnapshotState | None:
        primary, backup = self._paths(collection_id)
        with snapshot_lock(str(primary)):
            if primary.exists():
                try:
                    parsed = self._parse(primary, collection_id)
                except SnapshotStoreUnavailableError:
                    if backup.exists():
                        return self._restore(primary, backup, collection_id)
                    raise
                return SnapshotState(parsed.collectionId, tuple(parsed.history))
            if backup.exists():
                return self._restore(primary, backup, collection_id)
            return None

    def append(
        self,
        resolution: dict[str, Any],
        *,
        definition_hash: str,
    ) -> SnapshotState:
        snapshot = resolution_snapshot(resolution, definition_hash=definition_hash)
        primary, backup = self._paths(snapshot.collectionId)
        with snapshot_lock(str(primary)):
            current = self.load(snapshot.collectionId)
            history = tuple(current.history if current is not None else ())
            ledger = CollectionSnapshotFile(
                schemaVersion=1,
                collectionId=snapshot.collectionId,
                history=list((*history, snapshot)[-SNAPSHOT_HISTORY_LIMIT:]),
            )
            if primary.exists():
                parsed = self._parse(primary, snapshot.collectionId)
                self._replace(backup, parsed.model_dump_json(indent=2), ".tmp")
                self._parse(backup, snapshot.collectionId)
            self._replace(primary, ledger.model_dump_json(indent=2), ".tmp")
            written = self._parse(primary, snapshot.collectionId)
            return SnapshotState(written.collectionId, tuple(written.history))

    def delete(self, collection_id: str) -> None:
        primary, backup = self._paths(collection_id)
        with snapshot_lock(str(primary)):
            try:
                primary.unlink(missing_ok=True)
                backup.unlink(missing_ok=True)
            except OSError as error:
                raise SnapshotStoreUnavailableError() from error


def resolution_snapshot(
    resolution: dict[str, Any],
    *,
    definition_hash: str,
) -> CollectionResolutionSnapshot:
    try:
        collection_id = resolution["collectionId"]
        if not isinstance(collection_id, str):
            raise TypeError("collection_id")
        return CollectionResolutionSnapshot(
            collectionId=collection_id,
            revision=resolution["revision"],
            definitionHash=definition_hash,
            resolvedAt=resolution["resolvedAt"],
            providerGenerations=SnapshotProviderGenerations(
                index=resolution.get("indexGeneration"),
                rss=resolution.get("rssGeneration"),
            ),
            inputWatermark=resolution.get("inputWatermark"),
            evidenceIds=list(resolution["resolvedCandidateIds"])[:120],
            eligibleCount=resolution["total"],
            resolvedCount=len(resolution["resolvedCandidateIds"]),
            executionCount=len(resolution["executionUniverseIds"]),
            unusableCount=len(resolution["unusableCandidates"]),
            truncated=resolution["truncated"],
        )
    except (KeyError, TypeError, ValidationError) as error:
        raise SnapshotStoreUnavailableError() from error


__all__ = [
    "SNAPSHOT_HISTORY_LIMIT",
    "SnapshotState",
    "SnapshotStore",
    "SnapshotStoreUnavailableError",
    "resolution_snapshot",
]
