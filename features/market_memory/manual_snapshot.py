from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime
from enum import StrEnum
from typing import Protocol, Self, assert_never

from pydantic import Field, ValidationError, model_validator

from features.market_memory.attempt_store import (
    AttemptErrorCode,
    AttemptMode,
    AttemptScope,
    AttemptStart,
    AttemptStatus,
    AttemptStore,
    AttemptStoreState,
    MarketStateAttempt,
    StrictModel,
    UtcInstant,
    UtcWatermark,
    UpdateAttemptRef,
)


type JsonScalar = str | int | float | bool | None
type JsonValue = JsonScalar | list[JsonValue] | dict[str, JsonValue]


class ManualSnapshotBoundary(StrEnum):
    AFTER_ATTEMPT_START = "after_attempt_start"
    BEFORE_SNAPSHOT_SAVE = "before_snapshot_save"
    AFTER_SNAPSHOT_SAVE = "after_snapshot_save"
    AFTER_ATTEMPT_SUCCESS = "after_attempt_success"


class ManualSnapshotRequest(StrictModel):
    scope: AttemptScope
    inputWatermark: UtcWatermark | None = None

    def to_attempt_start(self, started_at: datetime) -> AttemptStart:
        return AttemptStart(
            scope=self.scope,
            mode=AttemptMode.MANUAL,
            startedAt=started_at,
            inputWatermark=self.inputWatermark,
        )


class ManualSnapshotCandidate(StrictModel):
    payload: dict[str, JsonValue]
    updateAttemptRef: UpdateAttemptRef

    @model_validator(mode="after")
    def validate_embedded_reference(self) -> Self:
        embedded = UpdateAttemptRef.model_validate_json(json.dumps(self.payload.get("updateAttemptRef")))
        if embedded != self.updateAttemptRef:
            raise ManualSnapshotRepairRequiredError()
        return self


class CommittedManualSnapshot(StrictModel):
    snapshotId: str = Field(min_length=1, max_length=200)
    savedAt: UtcInstant
    updateAttemptRef: UpdateAttemptRef


@dataclass(frozen=True, slots=True)
class ManualSnapshotResult:
    running: MarketStateAttempt
    attempt: MarketStateAttempt
    snapshot: CommittedManualSnapshot


@dataclass(frozen=True, slots=True)
class ManualSnapshotStageError(Exception):
    code: AttemptErrorCode

    def __str__(self) -> str:
        return self.code


@dataclass(frozen=True, slots=True)
class ManualSnapshotRepairRequiredError(Exception):
    code: str = "manual_snapshot_repair_required"

    def __str__(self) -> str:
        return self.code


class Clock(Protocol):
    def __call__(self) -> datetime: ...


class SnapshotPreparer(Protocol):
    def __call__(self, reference: UpdateAttemptRef) -> ManualSnapshotCandidate: ...


class SnapshotSaver(Protocol):
    def __call__(self, candidate: ManualSnapshotCandidate) -> CommittedManualSnapshot: ...


class FailureHook(Protocol):
    def __call__(self, boundary: ManualSnapshotBoundary) -> None: ...


@dataclass(frozen=True, slots=True)
class ManualLifecycleAdapters:
    clock: Clock
    prepare: SnapshotPreparer
    save: SnapshotSaver
    failureHook: FailureHook


class ManualSnapshotLifecycle:
    def __init__(self, store: AttemptStore, adapters: ManualLifecycleAdapters) -> None:
        self._store = store
        self._adapters = adapters

    def _fail(self, attempt_id: str, code: AttemptErrorCode) -> None:
        self._store.fail(attempt_id, self._adapters.clock(), code)

    def run(self, request: ManualSnapshotRequest) -> ManualSnapshotResult:
        running = self._store.start(request.to_attempt_start(self._adapters.clock()))
        self._adapters.failureHook(ManualSnapshotBoundary.AFTER_ATTEMPT_START)
        try:
            candidate = self._adapters.prepare(running.reference())
        except ManualSnapshotStageError as error:
            self._fail(running.id, error.code)
            raise
        except ValidationError as error:
            self._fail(running.id, AttemptErrorCode.VALIDATION_FAILED)
            raise ManualSnapshotStageError(AttemptErrorCode.VALIDATION_FAILED) from error
        if candidate.updateAttemptRef != running.reference():
            self._fail(running.id, AttemptErrorCode.VALIDATION_FAILED)
            raise ManualSnapshotStageError(AttemptErrorCode.VALIDATION_FAILED)
        self._adapters.failureHook(ManualSnapshotBoundary.BEFORE_SNAPSHOT_SAVE)
        try:
            snapshot = self._adapters.save(candidate)
        except ManualSnapshotStageError as error:
            self._fail(running.id, error.code)
            raise
        except (OSError, ValidationError) as error:
            self._fail(running.id, AttemptErrorCode.SAVE_FAILED)
            raise ManualSnapshotStageError(AttemptErrorCode.SAVE_FAILED) from error
        if snapshot.updateAttemptRef != running.reference():
            raise ManualSnapshotRepairRequiredError()
        self._adapters.failureHook(ManualSnapshotBoundary.AFTER_SNAPSHOT_SAVE)
        success = self._store.succeed(running.id, self._adapters.clock(), snapshot.snapshotId)
        self._adapters.failureHook(ManualSnapshotBoundary.AFTER_ATTEMPT_SUCCESS)
        return ManualSnapshotResult(running, success, snapshot)


def _success(attempt: MarketStateAttempt, snapshot: CommittedManualSnapshot) -> MarketStateAttempt:
    return MarketStateAttempt.model_validate(
        {
            **attempt.model_dump(mode="python"),
            "finishedAt": snapshot.savedAt,
            "status": AttemptStatus.SUCCESS,
            "snapshotId": snapshot.snapshotId,
            "errorCode": None,
        }
    )


def _reconstructed(snapshot: CommittedManualSnapshot) -> MarketStateAttempt:
    return MarketStateAttempt.model_validate(
        {
            **snapshot.updateAttemptRef.model_dump(mode="python"),
            "finishedAt": snapshot.savedAt,
            "status": AttemptStatus.SUCCESS,
            "snapshotId": snapshot.snapshotId,
            "errorCode": None,
        }
    )


def recover_manual_attempts(
    store: AttemptStore,
    committed: tuple[CommittedManualSnapshot, ...],
    recovery_now: datetime,
) -> AttemptStoreState:
    loaded = store.load()
    current = loaded.attempts
    if not current and not committed:
        return loaded
    by_id = {attempt.id: attempt for attempt in current}
    referenced: dict[str, CommittedManualSnapshot] = {}
    additions: list[MarketStateAttempt] = []
    for snapshot in sorted(committed, key=lambda row: (row.savedAt, row.snapshotId)):
        reference = snapshot.updateAttemptRef
        if snapshot.savedAt < reference.startedAt:
            raise ManualSnapshotRepairRequiredError()
        match reference.mode:
            case AttemptMode.MANUAL:
                pass
            case AttemptMode.STANDALONE_JOB | AttemptMode.COMBINED_JOB:
                continue
            case unreachable:
                assert_never(unreachable)
        if reference.id in referenced:
            raise ManualSnapshotRepairRequiredError()
        referenced[reference.id] = snapshot
        existing = by_id.get(reference.id)
        if existing is None:
            additions.append(_reconstructed(snapshot))
            continue
        if existing.reference() != reference:
            raise ManualSnapshotRepairRequiredError()
        match existing.status:
            case AttemptStatus.RUNNING:
                by_id[existing.id] = _success(existing, snapshot)
            case AttemptStatus.SUCCESS:
                if existing.snapshotId != snapshot.snapshotId:
                    raise ManualSnapshotRepairRequiredError()
            case AttemptStatus.FAILED:
                raise ManualSnapshotRepairRequiredError()
            case unreachable:
                assert_never(unreachable)
    rows = [by_id[attempt.id] for attempt in current]
    rows.extend(additions)
    recovered = []
    for attempt in rows:
        if attempt.mode is AttemptMode.MANUAL and attempt.status is AttemptStatus.RUNNING and attempt.id not in referenced:
            if recovery_now < attempt.startedAt:
                raise ManualSnapshotRepairRequiredError()
            recovered.append(
                MarketStateAttempt.model_validate(
                    {
                        **attempt.model_dump(mode="python"),
                        "finishedAt": recovery_now,
                        "status": AttemptStatus.FAILED,
                        "errorCode": AttemptErrorCode.INTERRUPTED,
                    }
                )
            )
        else:
            recovered.append(attempt)
    store.replace_all(tuple(recovered))
    return store.prune(recovery_now, frozenset(referenced))
