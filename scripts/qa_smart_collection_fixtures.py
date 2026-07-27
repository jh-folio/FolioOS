from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass
from pathlib import Path

from features.common.jcs import JsonValue
from features.common.research_library.indexing.research_index import embed_text, init_db
from features.common.research_library.rss.service import ensure_rss_cache


def clear_sources(db: Path) -> None:
    with sqlite3.connect(db) as connection:
        init_db(connection)
        ensure_rss_cache(connection)
        connection.execute("DELETE FROM chunks")
        connection.execute("DELETE FROM chunks_fts")
        connection.execute("DELETE FROM documents")
        connection.execute("DELETE FROM rss_feed_items")


@dataclass(frozen=True, slots=True)
class DocumentSeed:
    number: int
    source: str = "Reuters"
    path: str | None = None
    url: str | None = None
    withChunk: bool = False


def insert_document(connection: sqlite3.Connection, seed: DocumentSeed) -> str:
    doc_id = f"doc-{seed.number:04d}"
    doc_path = seed.path or f"research-inbox/articles/{doc_id}.md"
    doc_url = seed.url or f"https://example.com/{doc_id}"
    metadata = json.dumps({"contentHash": f"h-{seed.number}", "markets": ["US"]})
    connection.execute(
        "INSERT INTO documents (doc_id,path,title,source,date,type,url,market_relevance,metadata_json,"
        "updated_at,content,content_updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
        (
            doc_id,
            doc_path,
            doc_id,
            seed.source,
            "2026-07-15T00:00:00Z",
            "article",
            doc_url,
            1,
            metadata,
            "2026-07-16T00:00:00Z",
            "alpha",
            "2026-07-16T00:00:00Z",
        ),
    )
    if seed.withChunk:
        chunk_id = f"{doc_id}:0000"
        embedding = json.dumps(embed_text("alpha"))
        connection.execute(
            "INSERT INTO chunks VALUES (?,?,?,?,?)",
            (chunk_id, doc_id, 0, "alpha", embedding),
        )
        connection.execute(
            "INSERT INTO chunks_fts VALUES (?,?,?,?,?)",
            (chunk_id, doc_id, doc_id, seed.source, "alpha"),
        )
    return doc_id


def seed_count(db: Path, count: int) -> None:
    clear_sources(db)
    with sqlite3.connect(db) as connection:
        for number in range(count):
            insert_document(connection, DocumentSeed(number))


def seed_unindexed_rss(db: Path) -> None:
    clear_sources(db)
    with sqlite3.connect(db) as connection:
        ensure_rss_cache(connection)
        connection.execute(
            "INSERT INTO rss_feed_items VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (
                "live.md",
                "live.md",
                5,
                100,
                "Live alpha",
                "2026-07-15",
                "2026-07-15T00:00:00Z",
                "https://example.com/live",
                "alpha",
                "Reuters",
                "https://example.com/live",
                "rss",
                "news",
                "summary_only",
                "2",
                "US",
                1,
                "2026-07-16T00:00:00Z",
            ),
        )


def seed_explicit_index(db: Path) -> None:
    with sqlite3.connect(db) as connection:
        insert_document(
            connection,
            DocumentSeed(
                9000,
            path="research-inbox/rss/live.md",
            url="https://example.com/live",
                withChunk=True,
            ),
        )
        for number in range(121):
            insert_document(
                connection,
                DocumentSeed(number, source="Bloomberg", withChunk=True),
            )


def definition() -> dict[str, JsonValue]:
    return {
        "name": "US evidence",
        "query": "",
        "market": "US",
        "sources": [],
        "tickers": [],
        "tags": [],
    }
