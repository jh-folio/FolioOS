from __future__ import annotations

from collections.abc import Callable, Mapping
from dataclasses import dataclass
from datetime import datetime

from features.common.canonical_json import JsonValue
from features.common.sql_job_lifecycle import SqlJobLifecycle
from features.market_memory.attempt_store import AttemptScope, AttemptStore
from features.market_memory.snapshot_job import SnapshotBuilder


@dataclass(frozen=True, slots=True)
class MarketSqlJobRuntime:
    lifecycle: SqlJobLifecycle
    attempts: AttemptStore
    clock: Callable[[], datetime]


@dataclass(frozen=True, slots=True)
class MarketMemoryJobRequest:
    job_id: str
    operation_id: str
    entries: tuple[Mapping[str, JsonValue], ...]
    prepared_at: str


@dataclass(frozen=True, slots=True)
class MarketStateJobRequest:
    job_id: str
    operation_id: str
    payload: Mapping[str, JsonValue]
    scope: AttemptScope
    input_watermark: str
    started_at: datetime
    created_at: str


@dataclass(frozen=True, slots=True)
class CombinedMarketJobRequest:
    job_id: str
    operation_id: str
    entries: tuple[Mapping[str, JsonValue], ...]
    snapshot_builder: SnapshotBuilder
    scope: AttemptScope
    input_watermark: str
    started_at: datetime
    prepared_at: str


@dataclass(frozen=True, slots=True)
class MarketMemoryJobResult:
    saved_count: int
    target_hash: str


@dataclass(frozen=True, slots=True)
class MarketStateJobResult:
    snapshot_id: str
    attempt_id: str
    target_hash: str


@dataclass(frozen=True, slots=True)
class CombinedMarketJobResult:
    saved_count: int
    snapshot_id: str
    attempt_id: str


__all__ = [
    "CombinedMarketJobRequest",
    "CombinedMarketJobResult",
    "MarketMemoryJobRequest",
    "MarketMemoryJobResult",
    "MarketSqlJobRuntime",
    "MarketStateJobRequest",
    "MarketStateJobResult",
]
