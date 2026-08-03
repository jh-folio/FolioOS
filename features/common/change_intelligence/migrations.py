from __future__ import annotations

import sqlite3


def ensure_change_projection_tables(connection: sqlite3.Connection) -> None:
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS change_event_index (
            artifact_kind TEXT NOT NULL,
            artifact_id TEXT NOT NULL,
            lineage_id TEXT NOT NULL,
            authority_kind TEXT NOT NULL,
            authority_id TEXT NOT NULL,
            status TEXT NOT NULL,
            materiality REAL NOT NULL,
            reliability REAL NOT NULL,
            summary_json TEXT NOT NULL,
            generated_at TEXT NOT NULL,
            invalidation_token TEXT NOT NULL,
            PRIMARY KEY (artifact_kind, artifact_id)
        )
        """
    )
    connection.execute("CREATE INDEX IF NOT EXISTS idx_change_event_lineage ON change_event_index(lineage_id, generated_at DESC)")
    connection.execute("CREATE INDEX IF NOT EXISTS idx_change_event_status ON change_event_index(status, generated_at DESC)")
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS change_projection_repair_queue (
            authority_kind TEXT NOT NULL,
            authority_id TEXT NOT NULL,
            error_code TEXT NOT NULL,
            queued_at TEXT NOT NULL,
            PRIMARY KEY (authority_kind, authority_id)
        )
        """
    )
