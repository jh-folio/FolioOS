"""Evidence item persistence for intake collectors."""
from __future__ import annotations

import datetime as dt
import json
import sqlite3
from pathlib import Path


def _text(value) -> str:
    if isinstance(value, dt.datetime):
        return value.isoformat()
    if isinstance(value, (list, dict)):
        return json.dumps(value, ensure_ascii=False)
    if value is None:
        return ""
    return str(value)


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
            summary TEXT NOT NULL,
            collection_status TEXT NOT NULL,
            relevance_score REAL NOT NULL,
            search_score REAL,
            related_tickers TEXT NOT NULL,
            related_themes TEXT NOT NULL,
            event_id TEXT NOT NULL,
            narrative_ids TEXT NOT NULL,
            reliability_tier INTEGER NOT NULL,
            markdown_path TEXT NOT NULL
        )
        """
    )
    conn.execute("CREATE INDEX IF NOT EXISTS idx_evidence_items_normalized_url ON evidence_items(normalized_url)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_evidence_items_collector ON evidence_items(collector, source_type)")


def save_evidence_item(db_path: Path, item: dict, markdown_path: str = ""):
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    try:
        ensure_evidence_store(conn)
        conn.execute(
            """
            INSERT INTO evidence_items (
                id, collector, source_type, source, title, url, normalized_url,
                published_at_utc, collected_at_utc, query, query_source, summary,
                collection_status, relevance_score, search_score, related_tickers,
                related_themes, event_id, narrative_ids, reliability_tier, markdown_path
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                collector=excluded.collector,
                source_type=excluded.source_type,
                source=excluded.source,
                title=excluded.title,
                url=excluded.url,
                normalized_url=excluded.normalized_url,
                published_at_utc=excluded.published_at_utc,
                collected_at_utc=excluded.collected_at_utc,
                query=excluded.query,
                query_source=excluded.query_source,
                summary=excluded.summary,
                collection_status=excluded.collection_status,
                relevance_score=excluded.relevance_score,
                search_score=excluded.search_score,
                related_tickers=excluded.related_tickers,
                related_themes=excluded.related_themes,
                event_id=excluded.event_id,
                narrative_ids=excluded.narrative_ids,
                reliability_tier=excluded.reliability_tier,
                markdown_path=excluded.markdown_path
            """,
            (
                _text(item.get("id")),
                _text(item.get("collector")),
                _text(item.get("source_type")),
                _text(item.get("source")),
                _text(item.get("title")),
                _text(item.get("url")),
                _text(item.get("normalized_url")),
                _text(item.get("published_at_utc")),
                _text(item.get("collected_at_utc")),
                _text(item.get("query")),
                _text(item.get("query_source")),
                _text(item.get("summary")),
                _text(item.get("collection_status")),
                float(item.get("relevance_score") or 0),
                item.get("search_score"),
                _text(item.get("related_tickers") or []),
                _text(item.get("related_themes") or []),
                _text(item.get("event_id")),
                _text(item.get("narrative_ids") or []),
                int(item.get("reliability_tier") or 2),
                _text(markdown_path or item.get("markdown_path")),
            ),
        )
        conn.commit()
    finally:
        conn.close()
