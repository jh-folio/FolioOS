from __future__ import annotations

import json
import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from threading import RLock

from pydantic import ValidationError

from features.smart_collections.schema import Collection, CollectionStoreFile


@dataclass(frozen=True, slots=True)
class StoreState:
    storeRevision: int
    updatedAt: str
    collections: tuple[Collection, ...]
    recovered: bool = False


@dataclass(frozen=True, slots=True)
class CollectionStoreUnavailableError(Exception):
    code: str = "collection_store_unavailable"

    def __str__(self) -> str:
        return self.code


@lru_cache(maxsize=64)
def store_lock(path: str) -> RLock:
    return RLock()


class CollectionStore:
    def __init__(self, path: Path) -> None:
        self.path = path
        self.backup = path.with_name(path.name + ".bak")
        self.lock = store_lock(str(path.resolve()))

    def _parse(self, path: Path) -> CollectionStoreFile:
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
            return CollectionStoreFile.model_validate(payload)
        except (OSError, UnicodeError, json.JSONDecodeError, ValidationError) as error:
            raise CollectionStoreUnavailableError from error

    def _replace(self, path: Path, payload: str, suffix: str) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        temporary = path.with_name(path.name + suffix)
        try:
            temporary.write_text(payload, encoding="utf-8")
            os.replace(temporary, path)
        except OSError as error:
            raise CollectionStoreUnavailableError from error

    def _restore(self) -> StoreState:
        backup = self._parse(self.backup)
        self._replace(self.path, backup.model_dump_json(indent=2), ".restore.tmp")
        restored = self._parse(self.path)
        return StoreState(
            storeRevision=restored.storeRevision,
            updatedAt=restored.updatedAt,
            collections=tuple(restored.collections),
            recovered=True,
        )

    def load(self) -> StoreState:
        with self.lock:
            if self.path.exists():
                try:
                    ledger = self._parse(self.path)
                except CollectionStoreUnavailableError:
                    if self.backup.exists():
                        return self._restore()
                    raise
                return StoreState(
                    storeRevision=ledger.storeRevision,
                    updatedAt=ledger.updatedAt,
                    collections=tuple(ledger.collections),
                )
            if self.backup.exists():
                return self._restore()
            return StoreState(storeRevision=0, updatedAt="", collections=())

    def write(self, state: StoreState) -> StoreState:
        with self.lock:
            ledger = CollectionStoreFile(
                schemaVersion=1,
                storeRevision=state.storeRevision,
                updatedAt=state.updatedAt,
                collections=list(state.collections),
            )
            if self.path.exists():
                current = self._parse(self.path)
                self._replace(self.backup, current.model_dump_json(indent=2), ".tmp")
                self._parse(self.backup)
            self._replace(self.path, ledger.model_dump_json(indent=2), ".tmp")
            written = self._parse(self.path)
            return StoreState(
                storeRevision=written.storeRevision,
                updatedAt=written.updatedAt,
                collections=tuple(written.collections),
            )
