from __future__ import annotations

import hashlib
import json
import sqlite3
from collections.abc import Mapping
from dataclasses import dataclass
from typing import Protocol

from features.common.canonical_json import JsonValue, canonical_json_bytes
from features.common.sqlite_receipts import ReceiptVerificationError
from features.market_memory.attempt_store import UpdateAttemptRef
from features.market_memory.snapshot import save_market_state_snapshot


class SnapshotBuilder(Protocol):
    def __call__(self, projected: sqlite3.Connection) -> Mapping[str, JsonValue]: ...


@dataclass(frozen=True, slots=True)
class PreparedSnapshot:
    snapshot_id: str
    raw_row: dict[str, JsonValue]
    logical_row: dict[str, JsonValue]
    base_hash: str | None
    target_hash: str
    input_graph_base_hash: str
    input_graph_target_hash: str
    update_attempt_ref: UpdateAttemptRef


def snapshot_row(
    connection: sqlite3.Connection,
    snapshot_id: str,
) -> tuple[dict[str, JsonValue], dict[str, JsonValue]] | None:
    row = connection.execute(
        "SELECT snapshot_id,as_of,horizon,status,headline,payload_json FROM market_state_snapshots WHERE snapshot_id=?",
        (snapshot_id,),
    ).fetchone()
    if row is None:
        return None
    try:
        payload = json.loads(row["payload_json"])
    except (json.JSONDecodeError, TypeError) as error:
        raise ReceiptVerificationError("snapshot_payload_invalid") from error
    if not isinstance(payload, dict):
        raise ReceiptVerificationError("snapshot_payload_invalid")
    raw: dict[str, JsonValue] = {
        "snapshot_id": row["snapshot_id"],
        "as_of": row["as_of"],
        "horizon": row["horizon"],
        "status": row["status"],
        "headline": row["headline"],
        "payload_json": row["payload_json"],
    }
    logical: dict[str, JsonValue] = {
        "snapshot_id": row["snapshot_id"],
        "as_of": row["as_of"],
        "horizon": row["horizon"],
        "status": row["status"],
        "headline": row["headline"],
        "payload": payload,
    }
    return raw, logical


def snapshot_hash(
    logical_row: dict[str, JsonValue],
    graph_base_hash: str,
    graph_target_hash: str,
    reference: UpdateAttemptRef,
) -> str:
    value: JsonValue = {
        "snapshotRow": logical_row,
        "inputGraphBaseHash": graph_base_hash,
        "inputGraphTargetHash": graph_target_hash,
        "updateAttemptRef": reference.model_dump(mode="json"),
    }
    return hashlib.sha256(canonical_json_bytes(value)).hexdigest()


def current_snapshot_hash(connection: sqlite3.Connection, snapshot_id: str) -> str | None:
    current = snapshot_row(connection, snapshot_id)
    if current is None:
        return None
    _raw, logical = current
    payload = logical["payload"]
    if not isinstance(payload, dict):
        raise ReceiptVerificationError("snapshot_payload_invalid")
    try:
        reference = UpdateAttemptRef.model_validate_json(
            json.dumps(payload["updateAttemptRef"], ensure_ascii=False)
        )
        graph_base_hash = str(payload["inputGraphBaseHash"])
        graph_target_hash = str(payload["inputGraphTargetHash"])
    except (KeyError, ValueError, TypeError) as error:
        raise ReceiptVerificationError("snapshot_linkage_invalid") from error
    return snapshot_hash(logical, graph_base_hash, graph_target_hash, reference)


def prepare_snapshot_on_connection(
    projected: sqlite3.Connection,
    payload: Mapping[str, JsonValue],
    reference: UpdateAttemptRef,
    graph_base_hash: str,
    graph_target_hash: str,
    base_hash: str | None,
) -> PreparedSnapshot:
    context: dict[str, JsonValue] = {
        "updateAttemptRef": reference.model_dump(mode="json"),
        "inputGraphBaseHash": graph_base_hash,
        "inputGraphTargetHash": graph_target_hash,
    }
    saved = save_market_state_snapshot(projected, dict(payload), context=context)
    snapshot_id = str(saved["id"])
    captured = snapshot_row(projected, snapshot_id)
    if captured is None:
        raise ReceiptVerificationError("snapshot_target_missing")
    raw, logical = captured
    return PreparedSnapshot(
        snapshot_id=snapshot_id,
        raw_row=raw,
        logical_row=logical,
        base_hash=base_hash,
        target_hash=snapshot_hash(logical, graph_base_hash, graph_target_hash, reference),
        input_graph_base_hash=graph_base_hash,
        input_graph_target_hash=graph_target_hash,
        update_attempt_ref=reference,
    )


def insert_snapshot(connection: sqlite3.Connection, prepared: PreparedSnapshot) -> None:
    columns = tuple(prepared.raw_row)
    placeholders = ",".join("?" for _column in columns)
    connection.execute(
        f"INSERT INTO market_state_snapshots ({','.join(columns)}) VALUES ({placeholders}) "
        "ON CONFLICT(snapshot_id) DO UPDATE SET "
        "as_of=excluded.as_of,horizon=excluded.horizon,status=excluded.status,"
        "headline=excluded.headline,payload_json=excluded.payload_json",
        tuple(prepared.raw_row[column] for column in columns),
    )


__all__ = [
    "PreparedSnapshot",
    "SnapshotBuilder",
    "current_snapshot_hash",
    "insert_snapshot",
    "prepare_snapshot_on_connection",
    "snapshot_hash",
    "snapshot_row",
]
