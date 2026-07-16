from __future__ import annotations

import json
import sqlite3
from collections.abc import Callable
from datetime import datetime
from pathlib import Path

import pytest

from features.common.research_library.indexing.research_index import init_db
from features.common.research_library.rss.service import ensure_rss_cache
from features.smart_collections.schema import CreateCollectionRequest, ResolveRequest
from features.smart_collections.service import SmartCollectionService


def seed_documents(db: Path, count: int, *, duplicate_url: bool = False) -> None:
    with sqlite3.connect(db) as connection:
        init_db(connection)
        rows = []
        for number in range(count):
            doc_id = f"doc-{number:04d}"
            url = "https://example.com/duplicate" if duplicate_url else f"https://example.com/{doc_id}"
            metadata = json.dumps(
                {
                    "contentHash": f"hash-{number}",
                    "markets": ["US"],
                    "relatedTickers": [],
                    "impactTags": [],
                }
            )
            rows.append(
                (
                    doc_id,
                    f"research-inbox/articles/{doc_id}.md",
                    doc_id,
                    "Reuters",
                    "2026-07-15T00:00:00Z",
                    "article",
                    url,
                    1,
                    metadata,
                    "2026-07-16T00:00:00Z",
                    "alpha",
                    "2026-07-16T00:00:00Z",
                )
            )
        connection.executemany(
            "INSERT INTO documents (doc_id,path,title,source,date,type,url,market_relevance,metadata_json,"
            "updated_at,content,content_updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
            rows,
        )


def seed_rss(db: Path, filename: str, url: str, description: str = "alpha") -> None:
    with sqlite3.connect(db) as connection:
        ensure_rss_cache(connection)
        connection.execute(
            "INSERT INTO rss_feed_items (filename,path,size,mtime_ns,title,timestamp,timestamp_sort,url,"
            "description,media,normalized_url,collector,source_type,collection_status,reliability_tier,"
            "markets,visible,parsed_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (
                filename,
                filename,
                len(description),
                100,
                filename,
                "2026-07-15",
                "2026-07-15T00:00:00Z",
                url,
                description,
                "Reuters",
                url,
                "rss",
                "news",
                "summary_only",
                "2",
                "US",
                1,
                "2026-07-16T00:00:00Z",
            ),
        )


def empty_query_collection(service: SmartCollectionService) -> str:
    created = service.create(
        CreateCollectionRequest(
            name="US evidence",
            query="",
            market="US",
            sources=[],
            tickers=[],
            tags=[],
        )
    )
    collection = created["collection"]
    assert isinstance(collection, dict)
    return str(collection["id"])


@pytest.mark.parametrize("total", [241, 500, 501])
def test_exact_eligible_totals_are_bounded(
    service: SmartCollectionService,
    tmp_path: Path,
    total: int,
) -> None:
    seed_documents(tmp_path / "research-index.sqlite3", total)
    collection_id = empty_query_collection(service)
    result = service.resolve(collection_id, ResolveRequest(expectedRevision=1, limit=120))
    assert result["total"] == total
    assert len(result["resolvedCandidateIds"]) == 120
    assert result["truncated"] is True


def test_duplicate_raw_window_reports_truthful_total(
    service: SmartCollectionService,
    tmp_path: Path,
) -> None:
    seed_documents(tmp_path / "research-index.sqlite3", 121, duplicate_url=True)
    with sqlite3.connect(tmp_path / "research-index.sqlite3") as connection:
        connection.execute(
            "UPDATE documents SET url='https://example.com/unique' WHERE doc_id='doc-0120'"
        )
    collection_id = empty_query_collection(service)
    result = service.resolve(collection_id, ResolveRequest(expectedRevision=1, limit=120))
    assert result["total"] == 2
    assert len(result["resolvedCandidateIds"]) == 1
    assert len(result["items"][0]["providerIds"]) == 120
    assert result["truncated"] is True


def test_rss_fuses_with_index_and_unindexed_row_is_unusable(
    service: SmartCollectionService,
    tmp_path: Path,
) -> None:
    db = tmp_path / "research-index.sqlite3"
    seed_documents(db, 1)
    seed_rss(db, "mapped.md", "https://example.com/doc-0000")
    seed_rss(db, "unindexed.md", "https://example.com/unindexed")
    collection_id = empty_query_collection(service)
    result = service.resolve(collection_id, ResolveRequest(expectedRevision=1, limit=120))
    assert result["total"] == 2
    assert result["items"][0]["providerIds"] == [
        {"provider": "index", "id": "doc-0000"},
        {"provider": "rss", "id": "mapped.md"},
    ]
    assert result["executionUniverseIds"] == ["doc-0000"]
    assert result["unusableCandidates"] == [
        {"candidateId": result["items"][1]["id"], "reason": "unindexed_rss"}
    ]


def test_rss_content_change_changes_only_rss_generation(
    service: SmartCollectionService,
    tmp_path: Path,
) -> None:
    db = tmp_path / "research-index.sqlite3"
    seed_documents(db, 1)
    seed_rss(db, "rss.md", "https://example.com/rss", "alpha")
    collection_id = empty_query_collection(service)
    first = service.resolve(collection_id, ResolveRequest(expectedRevision=1, limit=120))
    with sqlite3.connect(db) as connection:
        connection.execute(
            "UPDATE rss_feed_items SET description='beta', size=4, mtime_ns=101 WHERE filename='rss.md'"
        )
    second = service.resolve(collection_id, ResolveRequest(expectedRevision=1, limit=120))
    assert first["indexGeneration"] == second["indexGeneration"]
    assert first["rssGeneration"] != second["rssGeneration"]
    assert first["inputWatermark"] != second["inputWatermark"]
