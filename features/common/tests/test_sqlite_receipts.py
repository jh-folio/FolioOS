from __future__ import annotations

import json
import sqlite3
from dataclasses import replace

import pytest

from features.common.canonical_json import JsonValue
from features.common.sqlite_receipts import (
    ReceiptExpectation,
    ReceiptRecord,
    ReceiptVerificationError,
    ensure_receipt_table,
    read_receipts,
    verify_receipt_set,
    write_receipt,
)


NOW = "2026-07-17T03:04:05Z"
HASH = "a" * 64
PROJECTION = {
    "status": "done",
    "artifactType": "market_memory_llm",
    "artifactId": "job-memory",
    "reportId": None,
    "date": None,
    "title": None,
    "savedCount": 1,
    "snapshotId": None,
    "proposalId": None,
    "requestedMode": None,
    "attemptedEngine": "cli",
    "finalEngine": "cli",
    "fallbackReason": None,
    "adapter": "codex",
    "mode": "generate",
}
VALID_RECORD = ReceiptRecord(
    "op-memory",
    "job-memory",
    "market_memory_batch",
    "job-memory",
    HASH,
    PROJECTION,
    NOW,
)
VALID_EXPECTATION = ReceiptExpectation("market_memory_batch", "job-memory", HASH)


def _connection() -> sqlite3.Connection:
    connection = sqlite3.connect(":memory:")
    connection.row_factory = sqlite3.Row
    ensure_receipt_table(connection)
    return connection


@pytest.mark.parametrize(
    ("field", "invalid"),
    [
        ("operation_id", ""),
        ("operation_id", "x" * 161),
        ("job_id", "   "),
        ("job_id", "x" * 161),
        ("artifact_id", ""),
        ("artifact_id", "x" * 201),
        ("artifact_type", "unknown_receipt"),
        ("result_hash", "a" * 63),
        ("result_hash", "A" * 64),
        ("created_at", "2026-02-30T03:04:05Z"),
        ("created_at", "2026-07-17T03:04:05+00:00"),
    ],
)
def test_receipt_record_rejects_malformed_boundary_fields(field: str, invalid: str) -> None:
    # Given: one malformed durable receipt field
    # When / Then: construction rejects it before SQLite can receive a row.
    with pytest.raises(ReceiptVerificationError):
        replace(VALID_RECORD, **{field: invalid})


@pytest.mark.parametrize(
    ("field", "invalid"),
    [
        ("artifact_id", ""),
        ("artifact_id", "x" * 201),
        ("artifact_type", "unknown_receipt"),
        ("result_hash", "short"),
        ("result_hash", "A" * 64),
    ],
)
def test_receipt_expectation_rejects_malformed_boundary_fields(
    field: str,
    invalid: str,
) -> None:
    # Given: one malformed recovery expectation field
    # When / Then: expectation construction rejects it.
    with pytest.raises(ReceiptVerificationError):
        replace(VALID_EXPECTATION, **{field: invalid})


@pytest.mark.parametrize(
    "projection",
    [
        {**PROJECTION, "privateText": "PRIVATE_CANARY"},
        {**PROJECTION, "savedCount": "1"},
        {**PROJECTION, "artifactType": "market_state_snapshot"},
    ],
)
def test_write_rejects_unsafe_or_task_mismatched_projection_without_row(
    projection: dict[str, JsonValue],
) -> None:
    # Given: an unsafe projection at the receipt write boundary
    connection = _connection()

    # When
    with pytest.raises(ReceiptVerificationError):
        write_receipt(connection, replace(VALID_RECORD, terminal_projection=projection))

    # Then
    assert connection.execute("SELECT COUNT(*) FROM job_operation_receipts").fetchone()[0] == 0


@pytest.mark.parametrize(
    ("field", "invalid"),
    [
        ("operation_id", ""),
        ("job_id", " "),
        ("artifact_id", ""),
        ("result_hash", "short"),
        ("created_at", "2026-02-30T03:04:05Z"),
    ],
)
def test_write_revalidates_mutated_scalar_fields_without_row(field: str, invalid: str) -> None:
    # Given: a valid frozen record mutated by an untrusted caller
    connection = _connection()
    candidate = replace(VALID_RECORD)
    object.__setattr__(candidate, field, invalid)

    # When / Then
    with pytest.raises(ReceiptVerificationError):
        write_receipt(connection, candidate)
    assert connection.execute("SELECT COUNT(*) FROM job_operation_receipts").fetchone()[0] == 0


def test_verify_rejects_tampered_projection_without_rewrite() -> None:
    # Given: a row tampered outside the receipt writer
    connection = _connection()
    unsafe = {**PROJECTION, "privateText": "PRIVATE_CANARY"}
    connection.execute(
        """
        INSERT INTO job_operation_receipts (
            operation_id,job_id,artifact_type,artifact_id,result_hash,terminal_projection_json,created_at
        ) VALUES (?,?,?,?,?,?,?)
        """,
        ("op-memory", "job-memory", "market_memory_batch", "job-memory", HASH, json.dumps(unsafe), NOW),
    )
    before = connection.total_changes

    # When / Then
    with pytest.raises(ReceiptVerificationError, match="receipt_projection_invalid"):
        verify_receipt_set(
            connection,
            "job-memory",
            "op-memory",
            (ReceiptExpectation("market_memory_batch", "job-memory", HASH),),
        )
    assert connection.total_changes == before


def test_read_rejects_tampered_scalar_fields() -> None:
    # Given: malformed durable scalars inserted outside the receipt writer
    connection = _connection()
    connection.execute(
        """
        INSERT INTO job_operation_receipts (
            operation_id,job_id,artifact_type,artifact_id,result_hash,terminal_projection_json,created_at
        ) VALUES (?,?,?,?,?,?,?)
        """,
        ("", "", "market_memory_batch", "", "short", json.dumps(PROJECTION), "not-utc"),
    )

    # When / Then
    with pytest.raises(ReceiptVerificationError):
        read_receipts(connection, "")


def test_valid_receipt_round_trip_remains_exact() -> None:
    # Given
    connection = _connection()

    # When
    write_receipt(connection, VALID_RECORD)

    # Then
    assert read_receipts(connection, "op-memory") == (VALID_RECORD,)
    assert verify_receipt_set(
        connection,
        "job-memory",
        "op-memory",
        (ReceiptExpectation("market_memory_batch", "job-memory", HASH),),
    ) == PROJECTION


def test_receipts_reject_partial_expected_set_without_rewrite() -> None:
    # Given
    connection = _connection()
    write_receipt(connection, VALID_RECORD)
    expected = (
        VALID_EXPECTATION,
        ReceiptExpectation("market_state_snapshot", "snapshot-1", "b" * 64),
    )

    # When / Then
    with pytest.raises(ReceiptVerificationError, match="receipt_set_mismatch"):
        verify_receipt_set(connection, "job-memory", "op-memory", expected)
    assert read_receipts(connection, "op-memory") == (VALID_RECORD,)
