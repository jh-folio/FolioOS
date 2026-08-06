from __future__ import annotations

import os
from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime
from functools import cache
from pathlib import Path
from threading import RLock

from pydantic import ValidationError

from features.agent_mode.work_log_schema import HiddenJob, PreviewTokenRecord, WorkLogStoreFile
from features.common.shared_jobs_projection import utc_z
from features.common.atomic_replace import replace_with_retry


@dataclass(frozen=True, slots=True)
class WorkLogStoreUnavailableError(Exception):
    code: str = "work_log_store_unavailable"

    def __str__(self) -> str:
        return self.code


@dataclass(frozen=True, slots=True)
class WorkLogState:
    store_revision: int
    updated_at: str
    hidden_jobs: tuple[HiddenJob, ...]
    tokens: tuple[PreviewTokenRecord, ...]
    recovered: bool = False


@cache
def work_log_lock(path: str) -> RLock:
    # The configured Work Log paths are finite in production. Never evict a
    # lock while a service may still hold it: same path means same lock for the
    # entire process lifetime.
    return RLock()


class WorkLogStore:
    def __init__(self, path: Path, *, clock: Callable[[], datetime]) -> None:
        self.path = path
        self.backup = path.with_name(path.name + ".bak")
        self.clock = clock
        self.lock = work_log_lock(str(path.resolve()))

    def _parse(self, path: Path) -> WorkLogStoreFile:
        try:
            return WorkLogStoreFile.model_validate_json(path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, ValidationError, ValueError) as error:
            raise WorkLogStoreUnavailableError() from error

    def _replace(self, path: Path, data: bytes, suffix: str) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        temporary = path.with_name(path.name + suffix)
        try:
            temporary.write_bytes(data)
            replace_with_retry(temporary, path)
        except OSError as error:
            raise WorkLogStoreUnavailableError() from error

    def load(self) -> WorkLogState:
        with self.lock:
            if self.path.exists():
                try:
                    value = self._parse(self.path)
                except WorkLogStoreUnavailableError:
                    if not self.backup.exists():
                        raise
                    value = self._parse(self.backup)
                    self._replace(self.path, value.model_dump_json(indent=2).encode(), ".restore.tmp")
                    return WorkLogState(value.storeRevision, value.updatedAt, tuple(value.hiddenJobs), tuple(value.tokens), True)
                return WorkLogState(value.storeRevision, value.updatedAt, tuple(value.hiddenJobs), tuple(value.tokens))
            if self.backup.exists():
                value = self._parse(self.backup)
                self._replace(self.path, value.model_dump_json(indent=2).encode(), ".restore.tmp")
                return WorkLogState(value.storeRevision, value.updatedAt, tuple(value.hiddenJobs), tuple(value.tokens), True)
            return WorkLogState(0, "", (), ())

    def write(self, hidden_jobs: tuple[HiddenJob, ...], tokens: tuple[PreviewTokenRecord, ...], revision: int) -> WorkLogState:
        with self.lock:
            ledger = WorkLogStoreFile(
                storeRevision=revision,
                updatedAt=utc_z(self.clock()),
                hiddenJobs=list(hidden_jobs),
                tokens=list(tokens),
            )
            if self.path.exists():
                current = self._parse(self.path)
                self._replace(self.backup, current.model_dump_json(indent=2).encode(), ".tmp")
                self._parse(self.backup)
            self._replace(self.path, ledger.model_dump_json(indent=2).encode(), ".tmp")
            written = self._parse(self.path)
            return WorkLogState(written.storeRevision, written.updatedAt, tuple(written.hiddenJobs), tuple(written.tokens))
