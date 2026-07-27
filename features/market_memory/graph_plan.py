from __future__ import annotations

import hashlib
import json
import sqlite3
from collections.abc import Iterator, Mapping, Sequence
from contextlib import contextmanager
from dataclasses import dataclass

from features.common.canonical_json import JsonValue, canonical_json_bytes
from features.common.sqlite_receipts import ReceiptVerificationError
from features.market_memory.memory import init_db, upsert_memory


GRAPH_PRIMARY_KEYS: dict[str, tuple[str, ...]] = {
    "market_memory": ("memory_id",),
    "market_narrative_states": ("state_id",),
    "market_memory_taxonomy": ("term_type", "term_key"),
    "market_story_links": ("link_id",),
    "market_story_family_suggestions": ("suggestion_id",),
}


@dataclass(frozen=True, slots=True)
class GraphRow:
    table: str
    primary_key: str
    raw_row: dict[str, JsonValue]
    logical_row: dict[str, JsonValue]


@dataclass(frozen=True, slots=True)
class PreparedGraphPlan:
    graph_base_hash: str
    target_hash: str
    touched_rows: tuple[GraphRow, ...]
    saved_count: int
    prepared_at: str


def _hash(value: JsonValue) -> str:
    return hashlib.sha256(canonical_json_bytes(value)).hexdigest()


def _logical_row(row: sqlite3.Row) -> dict[str, JsonValue]:
    logical: dict[str, JsonValue] = {}
    for key in row.keys():
        value = row[key]
        if key.endswith("_json") and isinstance(value, str):
            try:
                parsed = json.loads(value)
            except json.JSONDecodeError as error:
                raise ReceiptVerificationError(code="graph_json_invalid") from error
            logical[key] = parsed
        elif value is None or isinstance(value, str | int | float | bool):
            logical[key] = value
        else:
            raise ReceiptVerificationError(code="graph_value_invalid")
    return logical


def _raw_row(row: sqlite3.Row) -> dict[str, JsonValue]:
    raw: dict[str, JsonValue] = {}
    for key in row.keys():
        value = row[key]
        if value is None or isinstance(value, str | int | float | bool):
            raw[key] = value
        else:
            raise ReceiptVerificationError(code="graph_value_invalid")
    return raw


def _capture(connection: sqlite3.Connection) -> dict[tuple[str, str], GraphRow]:
    captured: dict[tuple[str, str], GraphRow] = {}
    for table, primary_columns in GRAPH_PRIMARY_KEYS.items():
        order = ",".join(primary_columns)
        for row in connection.execute(f"SELECT * FROM {table} ORDER BY {order}").fetchall():
            logical = _logical_row(row)
            primary_values: list[JsonValue] = [logical[column] for column in primary_columns]
            primary_key = canonical_json_bytes(primary_values).decode("utf-8")
            captured[(table, primary_key)] = GraphRow(
                table=table,
                primary_key=primary_key,
                raw_row=_raw_row(row),
                logical_row=logical,
            )
    return captured


def _graph_hash(rows: Mapping[tuple[str, str], GraphRow]) -> str:
    logical: list[JsonValue] = [
        {"table": row.table, "primaryKey": row.primary_key, "row": row.logical_row}
        for _key, row in sorted(rows.items())
    ]
    return _hash(logical)


def graph_hash(connection: sqlite3.Connection) -> str:
    return _graph_hash(_capture(connection))


@contextmanager
def projected_graph(
    connection: sqlite3.Connection,
    plan: PreparedGraphPlan,
) -> Iterator[sqlite3.Connection]:
    clone = sqlite3.connect(":memory:")
    clone.row_factory = sqlite3.Row
    try:
        connection.backup(clone)
        apply_graph_plan(clone, plan)
        yield clone
    finally:
        clone.close()


def prepare_graph_plan(
    connection: sqlite3.Connection,
    entries: Sequence[Mapping[str, JsonValue]],
    prepared_at: str,
) -> PreparedGraphPlan:
    base_rows = _capture(connection)
    base_hash = _graph_hash(base_rows)
    clone = sqlite3.connect(":memory:")
    clone.row_factory = sqlite3.Row
    try:
        connection.backup(clone)
        init_db(clone)
        for entry in entries:
            upsert_memory(clone, dict(entry), prepared_at=prepared_at)
        target_rows = _capture(clone)
    finally:
        clone.close()
    removed = set(base_rows).difference(target_rows)
    if removed:
        raise ReceiptVerificationError(code="graph_plan_delete_unsupported")
    touched = tuple(
        target_rows[key]
        for key in sorted(target_rows)
        if key not in base_rows or target_rows[key].logical_row != base_rows[key].logical_row
    )
    touched_logical: list[JsonValue] = [
        {"table": row.table, "primaryKey": row.primary_key, "row": row.logical_row}
        for row in touched
    ]
    return PreparedGraphPlan(
        graph_base_hash=base_hash,
        target_hash=_hash({"graphBaseHash": base_hash, "touchedRows": touched_logical}),
        touched_rows=touched,
        saved_count=len(entries),
        prepared_at=prepared_at,
    )


def apply_graph_plan(connection: sqlite3.Connection, plan: PreparedGraphPlan) -> None:
    if graph_hash(connection) != plan.graph_base_hash:
        raise ReceiptVerificationError(code="graph_base_hash_mismatch")
    for row in plan.touched_rows:
        primary_columns = GRAPH_PRIMARY_KEYS[row.table]
        columns = tuple(row.raw_row)
        placeholders = ",".join("?" for _column in columns)
        updates = ",".join(
            f"{column}=excluded.{column}" for column in columns if column not in primary_columns
        )
        connection.execute(
            f"INSERT INTO {row.table} ({','.join(columns)}) VALUES ({placeholders}) "
            f"ON CONFLICT({','.join(primary_columns)}) DO UPDATE SET {updates}",
            tuple(row.raw_row[column] for column in columns),
        )
    reread = _capture(connection)
    for expected in plan.touched_rows:
        actual = reread.get((expected.table, expected.primary_key))
        if actual is None or actual.logical_row != expected.logical_row:
            raise ReceiptVerificationError(code="graph_target_hash_mismatch")
    touched_logical: list[JsonValue] = [
        {"table": row.table, "primaryKey": row.primary_key, "row": row.logical_row}
        for row in plan.touched_rows
    ]
    target_hash = _hash({"graphBaseHash": plan.graph_base_hash, "touchedRows": touched_logical})
    if target_hash != plan.target_hash:
        raise ReceiptVerificationError(code="graph_target_hash_mismatch")


def verify_graph_plan_rows(connection: sqlite3.Connection, plan: PreparedGraphPlan) -> None:
    rows = _capture(connection)
    for expected in plan.touched_rows:
        actual = rows.get((expected.table, expected.primary_key))
        if actual is None or actual.logical_row != expected.logical_row:
            raise ReceiptVerificationError(code="graph_recovery_hash_mismatch")


__all__ = [
    "GRAPH_PRIMARY_KEYS",
    "GraphRow",
    "PreparedGraphPlan",
    "apply_graph_plan",
    "graph_hash",
    "prepare_graph_plan",
    "projected_graph",
    "verify_graph_plan_rows",
]
