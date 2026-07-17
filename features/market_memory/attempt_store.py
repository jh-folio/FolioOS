from __future__ import annotations

import os
import re
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from enum import StrEnum
from functools import lru_cache
from pathlib import Path
from threading import RLock
from typing import Annotated, Literal, Self, assert_never
from uuid import uuid4

from pydantic import AfterValidator, BaseModel, BeforeValidator, ConfigDict, Field, ValidationError, model_validator


class AttemptScope(StrEnum):
    GLOBAL = "GLOBAL"
    US = "US"
    KR = "KR"


class AttemptMode(StrEnum):
    MANUAL = "manual"
    STANDALONE_JOB = "standalone_job"
    COMBINED_JOB = "combined_job"


class AttemptStatus(StrEnum):
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"


class AttemptErrorCode(StrEnum):
    ADAPTER_UNAVAILABLE = "adapter_unavailable"
    ADAPTER_FAILED = "adapter_failed"
    VALIDATION_FAILED = "validation_failed"
    SAVE_FAILED = "save_failed"
    INTERNAL_ERROR = "internal_error"
    INTERRUPTED = "interrupted"
    COMMIT_RECOVERY_FAILED = "commit_recovery_failed"


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True, strict=True)


def _utc(value: datetime | str) -> datetime:
    match value:
        case str() if re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z", value): parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        case datetime(): parsed = value
        case unreachable:
            assert_never(unreachable)
    if parsed.tzinfo is None or parsed.utcoffset() != timedelta(0):
        raise AttemptSchemaError(code="utc_z_required")
    return parsed.astimezone(UTC)


UtcInstant = Annotated[datetime, BeforeValidator(_utc)]


def _watermark(value: str) -> str:
    _utc(value)
    return value


UtcWatermark = Annotated[str, AfterValidator(_watermark)]


class AttemptStart(StrictModel):
    scope: AttemptScope
    mode: AttemptMode
    jobId: str | None = Field(default=None, min_length=1, max_length=200)
    operationId: str | None = Field(default=None, min_length=1, max_length=200)
    startedAt: UtcInstant
    inputWatermark: UtcWatermark | None = None

    @model_validator(mode="after")
    def validate_binding(self) -> Self:
        manual_binding = self.jobId is None and self.operationId is None
        if self.mode is AttemptMode.MANUAL and not manual_binding:
            raise AttemptSchemaError(code="manual_job_binding_forbidden")
        if self.mode is not AttemptMode.MANUAL and manual_binding:
            raise AttemptSchemaError(code="job_binding_required")
        if (self.jobId is None) != (self.operationId is None):
            raise AttemptSchemaError(code="incomplete_job_binding")
        return self


class UpdateAttemptRef(AttemptStart):
    id: str = Field(pattern=r"^msa_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$")


class MarketStateAttempt(UpdateAttemptRef):
    finishedAt: UtcInstant | None
    status: AttemptStatus
    snapshotId: str | None = Field(min_length=1, max_length=200)
    errorCode: AttemptErrorCode | None

    @model_validator(mode="after")
    def validate_status(self) -> Self:
        match self.status:
            case AttemptStatus.RUNNING:
                valid = self.finishedAt is None and self.snapshotId is None and self.errorCode is None
            case AttemptStatus.SUCCESS:
                valid = self.finishedAt is not None and self.snapshotId is not None and self.errorCode is None
            case AttemptStatus.FAILED:
                valid = self.finishedAt is not None and self.snapshotId is None and self.errorCode is not None
            case unreachable: assert_never(unreachable)
        if not valid or (self.finishedAt is not None and self.finishedAt < self.startedAt):
            raise AttemptSchemaError(code="incoherent_attempt_status")
        return self

    def reference(self) -> UpdateAttemptRef:
        return UpdateAttemptRef.model_validate(self.model_dump(include=set(UpdateAttemptRef.model_fields), mode="python"))

    def terminal_sort_key(self) -> tuple[float, float, str]:
        if self.finishedAt is None:
            raise AttemptSchemaError(code="terminal_attempt_required")
        return (-self.finishedAt.timestamp(), -self.startedAt.timestamp(), self.id)


class AttemptStoreFile(StrictModel):
    schemaVersion: Literal[1]
    attempts: list[MarketStateAttempt]

    @model_validator(mode="after")
    def validate_unique_ids(self) -> Self:
        ids = [attempt.id for attempt in self.attempts]
        if len(ids) != len(set(ids)):
            raise AttemptSchemaError(code="duplicate_attempt_id")
        return self


@dataclass(frozen=True, slots=True)
class AttemptStoreState:
    attempts: tuple[MarketStateAttempt, ...]
    recovered: bool = False


@dataclass(frozen=True, slots=True)
class AttemptSchemaError(ValueError):
    code: str

    def __str__(self) -> str:
        return self.code


@dataclass(frozen=True, slots=True)
class AttemptStoreUnavailableError(Exception):
    code: str = "attempt_store_unavailable"

    def __str__(self) -> str:
        return self.code


@dataclass(frozen=True, slots=True)
class AttemptTransitionError(Exception):
    attempt_id: str
    code: str

    def __str__(self) -> str:
        return f"{self.code}:{self.attempt_id}"


@lru_cache(maxsize=64)
def _store_lock(path: str) -> RLock:
    return RLock()


class AttemptStore:
    def __init__(self, path: Path) -> None:
        self.path = path
        self.backup = path.with_name(path.name + ".bak")
        self._lock = _store_lock(str(path.resolve()))

    def _parse(self, path: Path) -> AttemptStoreFile:
        try:
            return AttemptStoreFile.model_validate_json(path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, ValidationError) as error:
            raise AttemptStoreUnavailableError() from error

    def _replace(self, path: Path, ledger: AttemptStoreFile, suffix: str) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        temporary = path.with_name(path.name + suffix)
        try:
            with temporary.open("w", encoding="utf-8", newline="\n") as handle:
                handle.write(ledger.model_dump_json(indent=2))
                handle.flush()
                os.fsync(handle.fileno())
            os.replace(temporary, path)
        except OSError as error:
            temporary.unlink(missing_ok=True)
            raise AttemptStoreUnavailableError() from error

    def load(self) -> AttemptStoreState:
        with self._lock:
            if self.path.exists():
                try:
                    ledger = self._parse(self.path)
                except AttemptStoreUnavailableError:
                    if not self.backup.exists():
                        raise
                    backup = self._parse(self.backup)
                    self._replace(self.path, backup, ".restore.tmp")
                    restored = self._parse(self.path)
                    return AttemptStoreState(tuple(restored.attempts), recovered=True)
                return AttemptStoreState(tuple(ledger.attempts))
            if self.backup.exists():
                backup = self._parse(self.backup)
                self._replace(self.path, backup, ".restore.tmp")
                restored = self._parse(self.path)
                return AttemptStoreState(tuple(restored.attempts), recovered=True)
            return AttemptStoreState(())

    def _write(self, attempts: tuple[MarketStateAttempt, ...]) -> AttemptStoreState:
        ledger = AttemptStoreFile(schemaVersion=1, attempts=list(attempts))
        if self.path.exists():
            current = self._parse(self.path)
            self._replace(self.backup, current, ".tmp")
            self._parse(self.backup)
        self._replace(self.path, ledger, ".tmp")
        written = self._parse(self.path)
        return AttemptStoreState(tuple(written.attempts))

    def start(self, request: AttemptStart, attempt_id: str | None = None) -> MarketStateAttempt:
        with self._lock:
            state = self.load()
            identifier = attempt_id or f"msa_{uuid4()}"
            attempt = MarketStateAttempt(
                id=identifier,
                **request.model_dump(mode="python"),
                finishedAt=None,
                status=AttemptStatus.RUNNING,
                snapshotId=None,
                errorCode=None,
            )
            if any(row.id == identifier for row in state.attempts):
                raise AttemptTransitionError(identifier, "duplicate_attempt_id")
            self._write((*state.attempts, attempt))
            return attempt

    def _terminal(self, replacement: MarketStateAttempt) -> MarketStateAttempt:
        with self._lock:
            state = self.load()
            matches = [row for row in state.attempts if row.id == replacement.id]
            if not matches:
                raise AttemptTransitionError(replacement.id, "attempt_not_found")
            if matches[0].status is not AttemptStatus.RUNNING:
                raise AttemptTransitionError(replacement.id, "attempt_already_terminal")
            rows = tuple(replacement if row.id == replacement.id else row for row in state.attempts)
            self._write(rows)
            return replacement

    def succeed(self, attempt_id: str, finished_at: datetime, snapshot_id: str) -> MarketStateAttempt:
        attempt = self.get(attempt_id)
        if attempt.status is not AttemptStatus.RUNNING:
            raise AttemptTransitionError(attempt.id, "attempt_already_terminal")
        return self._terminal(
            MarketStateAttempt.model_validate(
                {**attempt.model_dump(mode="python"), "finishedAt": _utc(finished_at), "status": AttemptStatus.SUCCESS, "snapshotId": snapshot_id}
            )
        )

    def fail(self, attempt_id: str, finished_at: datetime, code: AttemptErrorCode) -> MarketStateAttempt:
        attempt = self.get(attempt_id)
        if attempt.status is not AttemptStatus.RUNNING:
            raise AttemptTransitionError(attempt.id, "attempt_already_terminal")
        return self._terminal(
            MarketStateAttempt.model_validate(
                {**attempt.model_dump(mode="python"), "finishedAt": _utc(finished_at), "status": AttemptStatus.FAILED, "errorCode": code}
            )
        )

    def get(self, attempt_id: str) -> MarketStateAttempt:
        matches = [row for row in self.load().attempts if row.id == attempt_id]
        if not matches:
            raise AttemptTransitionError(attempt_id, "attempt_not_found")
        return matches[0]

    def replace_all(self, attempts: tuple[MarketStateAttempt, ...]) -> AttemptStoreState:
        with self._lock:
            self.load()
            return self._write(attempts)

    def prune(self, now: datetime, referenced_ids: frozenset[str]) -> AttemptStoreState:
        current = self.load().attempts
        failures = [row for row in current if row.status is AttemptStatus.FAILED]
        latest = {
            scope: sorted(
                (row for row in failures if row.scope is scope),
                key=MarketStateAttempt.terminal_sort_key,
            )[0].id
            for scope in AttemptScope
            if any(row.scope is scope for row in failures)
        }
        exempt = referenced_ids | frozenset(latest.values()) | frozenset(
            row.id for row in current if row.status is AttemptStatus.RUNNING
        )
        remaining = sorted(
            (row for row in current if row.id not in exempt),
            key=MarketStateAttempt.terminal_sort_key,
        )
        cutoff = _utc(now) - timedelta(days=180)
        retained = exempt | frozenset(
            row.id for row in remaining[:500] if row.finishedAt is not None and row.finishedAt >= cutoff
        )
        return self.replace_all(tuple(row for row in current if row.id in retained))
