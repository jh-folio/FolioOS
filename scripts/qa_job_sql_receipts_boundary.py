#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///

# ─── How to run ───
# Imported by qa_job_sql_receipts.py after the source root is added to sys.path.
# ──────────────────

from __future__ import annotations

import json
import sqlite3
from dataclasses import replace

from features.common.canonical_json import JsonValue
from features.common.sqlite_receipts import (
    ReceiptExpectation,
    ReceiptRecord,
    ReceiptVerificationError,
    verify_receipt_set,
    write_receipt,
)


def artifact_projection(
    artifact_type: str,
    artifact_id: str,
    snapshot_id: str | None,
) -> dict[str, JsonValue]:
    return {
        "status": "done",
        "artifactType": artifact_type,
        "artifactId": artifact_id,
        "reportId": None,
        "date": None,
        "title": None,
        "savedCount": 1 if artifact_type in {"market_memory_llm", "market_memory_update"} else None,
        "snapshotId": snapshot_id,
        "proposalId": None,
        "requestedMode": None,
        "attemptedEngine": "cli",
        "finalEngine": "cli",
        "fallbackReason": None,
        "adapter": "codex",
        "mode": "generate",
    }


def strict_receipt_boundary(connection: sqlite3.Connection, created_at: str) -> bool:
    record = ReceiptRecord(
        "op-boundary",
        "job-boundary",
        "market_memory_batch",
        "job-boundary",
        "a" * 64,
        artifact_projection("market_memory_llm", "job-boundary", None),
        created_at,
    )
    row_count = connection.execute("SELECT COUNT(*) FROM job_operation_receipts").fetchone()[0]
    malformed_fields = (
        ("operation_id", ""),
        ("job_id", " "),
        ("artifact_id", ""),
        ("artifact_type", "unknown_receipt"),
        ("result_hash", "short"),
        ("result_hash", "A" * 64),
        ("created_at", "2026-02-30T03:04:05Z"),
    )

    def write_is_rejected(candidate: ReceiptRecord) -> bool:
        try:
            write_receipt(connection, candidate)
        except ReceiptVerificationError:
            return True
        return False

    rejected = True
    for field, value in malformed_fields:
        candidate = replace(record)
        object.__setattr__(candidate, field, value)
        rejected = write_is_rejected(candidate) and rejected
    for projection in (
        {**record.terminal_projection, "privateText": "PRIVATE_QA_MARKER"},
        {**record.terminal_projection, "savedCount": "1"},
    ):
        candidate = replace(record)
        object.__setattr__(candidate, "terminal_projection", projection)
        rejected = write_is_rejected(candidate) and rejected
    rejected = rejected and connection.execute(
        "SELECT COUNT(*) FROM job_operation_receipts"
    ).fetchone()[0] == row_count
    connection.execute(
        """
        INSERT INTO job_operation_receipts (
            operation_id,job_id,artifact_type,artifact_id,result_hash,terminal_projection_json,created_at
        ) VALUES (?,?,?,?,?,?,?)
        """,
        (
            record.operation_id,
            record.job_id,
            record.artifact_type,
            record.artifact_id,
            record.result_hash,
            json.dumps({**record.terminal_projection, "privateText": "PRIVATE_QA_MARKER"}),
            record.created_at,
        ),
    )
    verification_rejected = False
    try:
        verify_receipt_set(
            connection,
            record.job_id,
            record.operation_id,
            (ReceiptExpectation(record.artifact_type, record.artifact_id, record.result_hash),),
        )
    except ReceiptVerificationError:
        verification_rejected = True
    connection.execute("DELETE FROM job_operation_receipts WHERE operation_id='op-boundary'")
    connection.commit()
    return rejected and verification_rejected
