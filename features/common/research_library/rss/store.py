"""Evidence item persistence for intake collectors.

The additive columns also hold metadata-only fast-origin leads. Existing rows
remain ``intake_stage=evidence`` after migration.
"""
from __future__ import annotations

import datetime as dt
import json
import sqlite3
from pathlib import Path


def _text(value) -> str:
    if isinstance(value, dt.datetime):
        return value.isoformat()
    if isinstance(value, (list, dict, tuple)):
        return json.dumps(value, ensure_ascii=False)
    if value is None:
        return ""
    return str(value)


BASE_COLUMNS = {
    "intake_stage": "TEXT NOT NULL DEFAULT 'evidence'",
    "signal_status": "TEXT NOT NULL DEFAULT ''",
    "source_status": "TEXT NOT NULL DEFAULT ''",
    "event_at_utc": "TEXT NOT NULL DEFAULT ''",
    "provider_published_at_utc": "TEXT NOT NULL DEFAULT ''",
    "received_at_utc": "TEXT NOT NULL DEFAULT ''",
    "official_confirmed_at_utc": "TEXT NOT NULL DEFAULT ''",
    "expires_at_utc": "TEXT NOT NULL DEFAULT ''",
    "cluster_id": "TEXT NOT NULL DEFAULT ''",
    "corroboration_count": "INTEGER NOT NULL DEFAULT 0",
    "independent_source_groups": "TEXT NOT NULL DEFAULT '[]'",
    "markets": "TEXT NOT NULL DEFAULT '[]'",
    "policy_version": "TEXT NOT NULL DEFAULT ''",
    "language": "TEXT NOT NULL DEFAULT ''",
    "country": "TEXT NOT NULL DEFAULT ''",
}


def ensure_evidence_store(conn: sqlite3.Connection):
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS evidence_items (
            id TEXT PRIMARY KEY,
            collector TEXT NOT NULL,
            source_type TEXT NOT NULL,
            source TEXT NOT NULL,
            title TEXT NOT NULL,
            url TEXT NOT NULL,
            normalized_url TEXT NOT NULL,
            published_at_utc TEXT NOT NULL,
            collected_at_utc TEXT NOT NULL,
            query TEXT NOT NULL,
            query_source TEXT NOT NULL,
            language TEXT NOT NULL DEFAULT '',
            country TEXT NOT NULL DEFAULT '',
            summary TEXT NOT NULL,
            collection_status TEXT NOT NULL,
            relevance_score REAL NOT NULL,
            search_score REAL,
            related_tickers TEXT NOT NULL,
            related_themes TEXT NOT NULL,
            event_id TEXT NOT NULL,
            narrative_ids TEXT NOT NULL,
            reliability_tier INTEGER NOT NULL,
            markdown_path TEXT NOT NULL,
            intake_stage TEXT NOT NULL DEFAULT 'evidence',
            signal_status TEXT NOT NULL DEFAULT '',
            source_status TEXT NOT NULL DEFAULT '',
            event_at_utc TEXT NOT NULL DEFAULT '',
            provider_published_at_utc TEXT NOT NULL DEFAULT '',
            received_at_utc TEXT NOT NULL DEFAULT '',
            official_confirmed_at_utc TEXT NOT NULL DEFAULT '',
            expires_at_utc TEXT NOT NULL DEFAULT '',
            cluster_id TEXT NOT NULL DEFAULT '',
            corroboration_count INTEGER NOT NULL DEFAULT 0,
            independent_source_groups TEXT NOT NULL DEFAULT '[]',
            markets TEXT NOT NULL DEFAULT '[]',
            policy_version TEXT NOT NULL DEFAULT ''
        )
        """
    )
    existing = {row[1] for row in conn.execute("PRAGMA table_info(evidence_items)").fetchall()}
    for column, definition in BASE_COLUMNS.items():
        if column not in existing:
            conn.execute(f"ALTER TABLE evidence_items ADD COLUMN {column} {definition}")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_evidence_items_normalized_url ON evidence_items(normalized_url)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_evidence_items_collector ON evidence_items(collector, source_type)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_evidence_items_language_country ON evidence_items(language, country)")
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_evidence_items_signals "
        "ON evidence_items(intake_stage, source_status, signal_status, received_at_utc DESC, id DESC)"
    )
    conn.execute("CREATE INDEX IF NOT EXISTS idx_evidence_items_signal_cluster ON evidence_items(cluster_id)")


STORE_COLUMNS = (
    "id", "collector", "source_type", "source", "title", "url", "normalized_url",
    "published_at_utc", "collected_at_utc", "query", "query_source", "language", "country", "summary",
    "collection_status", "relevance_score", "search_score", "related_tickers",
    "related_themes", "event_id", "narrative_ids", "reliability_tier", "markdown_path",
    "intake_stage", "signal_status", "source_status", "event_at_utc",
    "provider_published_at_utc", "received_at_utc", "official_confirmed_at_utc",
    "expires_at_utc", "cluster_id", "corroboration_count", "independent_source_groups",
    "markets", "policy_version",
)


def _store_values(item: dict, markdown_path: str) -> tuple:
    values = {
        "id": _text(item.get("id")),
        "collector": _text(item.get("collector")),
        "source_type": _text(item.get("source_type")),
        "source": _text(item.get("source") or item.get("provider")),
        "title": _text(item.get("title")),
        "url": _text(item.get("url")),
        "normalized_url": _text(item.get("normalized_url")),
        "published_at_utc": _text(item.get("published_at_utc") or item.get("provider_published_at_utc")),
        "collected_at_utc": _text(item.get("collected_at_utc") or item.get("received_at_utc")),
        "query": _text(item.get("query")),
        "query_source": _text(item.get("query_source")),
        "language": _text(item.get("language")).lower(),
        "country": _text(item.get("country")).upper(),
        "summary": _text(item.get("summary")),
        "collection_status": _text(item.get("collection_status")),
        "relevance_score": float(item.get("relevance_score") or 0),
        "search_score": item.get("search_score"),
        "related_tickers": _text(item.get("related_tickers") or []),
        "related_themes": _text(item.get("related_themes") or []),
        "event_id": _text(item.get("event_id")),
        "narrative_ids": _text(item.get("narrative_ids") or []),
        "reliability_tier": int(item.get("reliability_tier") or 2),
        "markdown_path": _text(markdown_path or item.get("markdown_path")),
        "intake_stage": _text(item.get("intake_stage") or "evidence"),
        "signal_status": _text(item.get("signal_status")),
        "source_status": _text(item.get("source_status")),
        "event_at_utc": _text(item.get("event_at_utc")),
        "provider_published_at_utc": _text(item.get("provider_published_at_utc")),
        "received_at_utc": _text(item.get("received_at_utc") or item.get("collected_at_utc")),
        "official_confirmed_at_utc": _text(item.get("official_confirmed_at_utc")),
        "expires_at_utc": _text(item.get("expires_at_utc")),
        "cluster_id": _text(item.get("cluster_id")),
        "corroboration_count": max(0, int(item.get("corroboration_count") or 0)),
        "independent_source_groups": _text(item.get("independent_source_groups") or []),
        "markets": _text(item.get("markets") or []),
        "policy_version": _text(item.get("policy_version")),
    }
    return tuple(values[column] for column in STORE_COLUMNS)


def save_evidence_item(db_path: Path, item: dict, markdown_path: str = ""):
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    try:
        ensure_evidence_store(conn)
        columns = ", ".join(STORE_COLUMNS)
        placeholders = ", ".join("?" for _ in STORE_COLUMNS)
        updates = ", ".join(f"{column}=excluded.{column}" for column in STORE_COLUMNS if column != "id")
        conn.execute(
            f"INSERT INTO evidence_items ({columns}) VALUES ({placeholders}) "
            f"ON CONFLICT(id) DO UPDATE SET {updates}",
            _store_values(item, markdown_path),
        )
        conn.commit()
    finally:
        conn.close()
