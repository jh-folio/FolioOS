from __future__ import annotations

import json
import re
import sqlite3
from dataclasses import dataclass
from datetime import datetime
from enum import StrEnum
from typing import Final, assert_never

from pydantic import TypeAdapter, ValidationError

from features.common.canonical_json import JsonValue, canonical_json_bytes
from features.common.shared_jobs_schema import (
    ArtifactProjection,
    CancelledProjection,
    CompanionProjection,
    FailedProjection,
    IndexProjection,
    ResultProjection,
    RssProjection,
    SetupProjection,
    TaskType,
)


class ReceiptVerificationError(Exception):
    __slots__ = ("code",)

    def __init__(self, code: str) -> None:
        super().__init__(code)
        self.code = code

    def __str__(self) -> str:
        return self.code


class ReceiptArtifactType(StrEnum):
    MARKET_MEMORY_BATCH = "market_memory_batch"
    MARKET_STATE_SNAPSHOT = "market_state_snapshot"
    THESIS_DELTA = "thesis_delta"


_IDENTIFIER_LIMIT: Final = 160
_ARTIFACT_ID_LIMIT: Final = 200
_SHA256_PATTERN: Final = re.compile(r"^[0-9a-f]{64}$")
_UTC_Z_PATTERN: Final = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$")
_PROJECTION_ADAPTER: Final = TypeAdapter(ResultProjection)
_PROJECTION_TASKS: Final = {
    ReceiptArtifactType.MARKET_MEMORY_BATCH: frozenset(
        {TaskType.MARKET_MEMORY_LLM, TaskType.MARKET_MEMORY_UPDATE}
    ),
    ReceiptArtifactType.MARKET_STATE_SNAPSHOT: frozenset(
        {TaskType.MARKET_STATE_SNAPSHOT, TaskType.MARKET_MEMORY_UPDATE}
    ),
    ReceiptArtifactType.THESIS_DELTA: frozenset({TaskType.THESIS_DELTA}),
}


def _require_identifier(value: str, maximum: int) -> None:
    if not value or value.strip() != value or len(value) > maximum:
        raise ReceiptVerificationError("receipt_identifier_invalid")


def _require_hash(value: str) -> None:
    if _SHA256_PATTERN.fullmatch(value) is None:
        raise ReceiptVerificationError("receipt_hash_invalid")


def _require_timestamp(value: str) -> None:
    if _UTC_Z_PATTERN.fullmatch(value) is None:
        raise ReceiptVerificationError("receipt_timestamp_invalid")
    try:
        datetime.fromisoformat(value[:-1] + "+00:00")
    except ValueError as error:
        raise ReceiptVerificationError("receipt_timestamp_invalid") from error


def _parse_artifact_type(value: ReceiptArtifactType | str) -> ReceiptArtifactType:
    try:
        return ReceiptArtifactType(value)
    except ValueError as error:
        raise ReceiptVerificationError("receipt_artifact_type_invalid") from error


def _validate_projection(
    artifact_type: ReceiptArtifactType,
    projection: dict[str, JsonValue],
) -> None:
    raw = canonical_json_bytes(projection)
    try:
        parsed = _PROJECTION_ADAPTER.validate_json(raw)
    except ValidationError as error:
        raise ReceiptVerificationError("receipt_projection_invalid") from error
    if canonical_json_bytes(parsed.model_dump(mode="json")) != raw:
        raise ReceiptVerificationError("receipt_projection_invalid")
    match parsed:
        case ArtifactProjection(artifactType=projection_type):
            try:
                task_type = TaskType(projection_type)
            except ValueError as error:
                raise ReceiptVerificationError("receipt_projection_invalid") from error
            if task_type not in _PROJECTION_TASKS[artifact_type]:
                raise ReceiptVerificationError("receipt_projection_linkage_mismatch")
        case (
            CancelledProjection()
            | FailedProjection()
            | IndexProjection()
            | RssProjection()
            | SetupProjection()
            | CompanionProjection()
        ):
            raise ReceiptVerificationError("receipt_projection_invalid")
        case unreachable:
            assert_never(unreachable)


@dataclass(frozen=True, slots=True)
class ReceiptExpectation:
    artifact_type: ReceiptArtifactType | str
    artifact_id: str
    result_hash: str

    def __post_init__(self) -> None:
        object.__setattr__(self, "artifact_type", _parse_artifact_type(self.artifact_type))
        _require_identifier(self.artifact_id, _ARTIFACT_ID_LIMIT)
        _require_hash(self.result_hash)


@dataclass(frozen=True, slots=True)
class ReceiptRecord:
    operation_id: str
    job_id: str
    artifact_type: ReceiptArtifactType | str
    artifact_id: str
    result_hash: str
    terminal_projection: dict[str, JsonValue]
    created_at: str

    def __post_init__(self) -> None:
        object.__setattr__(self, "artifact_type", _validate_record(self))


def _validate_record(receipt: ReceiptRecord) -> ReceiptArtifactType:
    artifact_type = _parse_artifact_type(receipt.artifact_type)
    _require_identifier(receipt.operation_id, _IDENTIFIER_LIMIT)
    _require_identifier(receipt.job_id, _IDENTIFIER_LIMIT)
    _require_identifier(receipt.artifact_id, _ARTIFACT_ID_LIMIT)
    _require_hash(receipt.result_hash)
    _require_timestamp(receipt.created_at)
    _validate_projection(artifact_type, receipt.terminal_projection)
    return artifact_type


def ensure_receipt_table(connection: sqlite3.Connection) -> None:
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS job_operation_receipts (
            operation_id TEXT NOT NULL,
            job_id TEXT NOT NULL,
            artifact_type TEXT NOT NULL,
            artifact_id TEXT NOT NULL,
            result_hash TEXT NOT NULL,
            terminal_projection_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            PRIMARY KEY(operation_id, artifact_type, artifact_id)
        )
        """
    )
    connection.execute(
        "CREATE INDEX IF NOT EXISTS idx_job_operation_receipts_job ON job_operation_receipts(job_id, operation_id)"
    )


def _projection_text(projection: dict[str, JsonValue]) -> str:
    return canonical_json_bytes(projection).decode("utf-8")


def write_receipt(connection: sqlite3.Connection, receipt: ReceiptRecord) -> None:
    _validate_record(receipt)
    ensure_receipt_table(connection)
    existing = connection.execute(
        """
        SELECT operation_id,job_id,artifact_type,artifact_id,result_hash,terminal_projection_json,created_at
        FROM job_operation_receipts
        WHERE operation_id=? AND artifact_type=? AND artifact_id=?
        """,
        (receipt.operation_id, receipt.artifact_type, receipt.artifact_id),
    ).fetchone()
    projection_text = _projection_text(receipt.terminal_projection)
    if existing is not None:
        exact = (
            existing["job_id"] == receipt.job_id
            and existing["result_hash"] == receipt.result_hash
            and existing["terminal_projection_json"] == projection_text
            and existing["created_at"] == receipt.created_at
        )
        if exact:
            return
        raise ReceiptVerificationError("receipt_conflict")
    connection.execute(
        """
        INSERT INTO job_operation_receipts (
            operation_id,job_id,artifact_type,artifact_id,result_hash,terminal_projection_json,created_at
        ) VALUES (?,?,?,?,?,?,?)
        """,
        (
            receipt.operation_id,
            receipt.job_id,
            receipt.artifact_type,
            receipt.artifact_id,
            receipt.result_hash,
            projection_text,
            receipt.created_at,
        ),
    )


def read_receipts(connection: sqlite3.Connection, operation_id: str) -> tuple[ReceiptRecord, ...]:
    _require_identifier(operation_id, _IDENTIFIER_LIMIT)
    ensure_receipt_table(connection)
    rows = connection.execute(
        """
        SELECT operation_id,job_id,artifact_type,artifact_id,result_hash,terminal_projection_json,created_at
        FROM job_operation_receipts
        WHERE operation_id=?
        ORDER BY artifact_type,artifact_id
        """,
        (operation_id,),
    ).fetchall()
    records: list[ReceiptRecord] = []
    for row in rows:
        try:
            projection = json.loads(row["terminal_projection_json"])
        except (json.JSONDecodeError, TypeError) as error:
            raise ReceiptVerificationError("receipt_projection_invalid") from error
        if not isinstance(projection, dict) or not all(isinstance(key, str) for key in projection):
            raise ReceiptVerificationError("receipt_projection_invalid")
        records.append(
            ReceiptRecord(
                operation_id=row["operation_id"],
                job_id=row["job_id"],
                artifact_type=row["artifact_type"],
                artifact_id=row["artifact_id"],
                result_hash=row["result_hash"],
                terminal_projection=projection,
                created_at=row["created_at"],
            )
        )
    return tuple(records)


def verify_receipt_set(
    connection: sqlite3.Connection,
    job_id: str,
    operation_id: str,
    expected: tuple[ReceiptExpectation, ...],
) -> dict[str, JsonValue]:
    _require_identifier(job_id, _IDENTIFIER_LIMIT)
    _require_identifier(operation_id, _IDENTIFIER_LIMIT)
    receipts = read_receipts(connection, operation_id)
    actual_keys = {(row.artifact_type, row.artifact_id) for row in receipts}
    expected_keys = {(row.artifact_type, row.artifact_id) for row in expected}
    if actual_keys != expected_keys or len(receipts) != len(expected):
        raise ReceiptVerificationError("receipt_set_mismatch")
    expected_by_key = {(row.artifact_type, row.artifact_id): row for row in expected}
    projections: list[dict[str, JsonValue]] = []
    for receipt in receipts:
        requirement = expected_by_key[(receipt.artifact_type, receipt.artifact_id)]
        if receipt.job_id != job_id or receipt.result_hash != requirement.result_hash:
            raise ReceiptVerificationError("receipt_linkage_mismatch")
        projections.append(receipt.terminal_projection)
    if not projections:
        raise ReceiptVerificationError("receipt_set_mismatch")
    first = _projection_text(projections[0])
    if any(_projection_text(projection) != first for projection in projections[1:]):
        raise ReceiptVerificationError("receipt_projection_mismatch")
    return projections[0]


__all__ = [
    "ReceiptArtifactType",
    "ReceiptExpectation",
    "ReceiptRecord",
    "ReceiptVerificationError",
    "ensure_receipt_table",
    "read_receipts",
    "verify_receipt_set",
    "write_receipt",
]
