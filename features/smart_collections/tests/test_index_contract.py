from __future__ import annotations

import sqlite3
from pathlib import Path

from features.common.research_library.indexing.research_index import hybrid_search, init_db, sync_index


def document(doc_id: str, content_hash: str, content: str = "allowed alpha") -> dict[str, str | int]:
    return {
        "id": doc_id,
        "path": f"research-inbox/articles/{doc_id}.md",
        "title": doc_id,
        "source": "Reuters",
        "date": "2026-07-15",
        "type": "article",
        "url": f"https://example.com/{doc_id}",
        "marketRelevance": 10,
        "contentHash": content_hash,
        "content": content,
    }


def test_content_updated_at_migrates_and_preserves_noop(tmp_path: Path) -> None:
    db = tmp_path / "index.sqlite3"
    with sqlite3.connect(db) as connection:
        connection.execute(
            "CREATE TABLE documents (doc_id TEXT PRIMARY KEY,path TEXT UNIQUE NOT NULL,title TEXT NOT NULL,"
            "source TEXT NOT NULL,date TEXT NOT NULL,type TEXT NOT NULL,url TEXT NOT NULL,"
            "market_relevance REAL NOT NULL,metadata_json TEXT NOT NULL,updated_at TEXT NOT NULL)"
        )
        connection.execute(
            "INSERT INTO documents VALUES ('legacy','research-inbox/articles/legacy.md','Legacy','R',"
            "'2026-07-01','article','',1,'{}','2026-07-01T00:00:00Z')"
        )
        init_db(connection)
        migrated = connection.execute(
            "SELECT content_updated_at FROM documents WHERE doc_id='legacy'"
        ).fetchone()
    assert migrated == ("2026-07-01T00:00:00Z",)
    sync_index(db, {"generatedAt": "2026-07-02T00:00:00Z", "documents": [document("a", "h1")]})
    sync_index(db, {"generatedAt": "2026-07-03T00:00:00Z", "documents": [document("a", "h1")]})
    with sqlite3.connect(db) as connection:
        assert connection.execute("SELECT content_updated_at FROM documents").fetchone() == (
            "2026-07-02T00:00:00Z",
        )
    sync_index(db, {"generatedAt": "2026-07-04T00:00:00Z", "documents": [document("a", "h2")]})
    with sqlite3.connect(db) as connection:
        assert connection.execute("SELECT content_updated_at FROM documents").fetchone() == (
            "2026-07-04T00:00:00Z",
        )


def test_allowed_document_is_filtered_before_fts_cap(tmp_path: Path) -> None:
    db = tmp_path / "index.sqlite3"
    decoys = [document(f"d{number:03d}", f"h{number}", "alpha alpha alpha") for number in range(121)]
    sync_index(
        db,
        {"generatedAt": "2026-07-02T00:00:00Z", "documents": [*decoys, document("allowed", "ha")]},
    )
    hits = hybrid_search(db, "alpha", allowed_doc_ids={"allowed"}, limit=10)
    assert [hit["id"] for hit in hits] == ["allowed"]
