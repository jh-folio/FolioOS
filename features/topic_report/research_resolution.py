from __future__ import annotations

import sqlite3
from pathlib import Path

from features.common.jcs import JsonValue, sha256_hex
from features.topic_report.approved_schema import ApprovedRequest
from features.topic_report.resolution_schema import ProviderGenerations, ResolutionSnapshotV1


def missing_index_snapshot() -> ResolutionSnapshotV1:
    return ResolutionSnapshotV1(
        schemaVersion=1,
        collectionId=None,
        collectionRevision=None,
        collectionDefinitionHash=None,
        eligibleTotal=None,
        candidateCap=None,
        truncated=False,
        resolvedCandidateIds=[],
        executionUniverseIds=[],
        unusableCandidates=[],
        selectedEvidenceIds=[],
        providerGenerations=ProviderGenerations(indexGeneration=None, rssGeneration=None),
        inputWatermark=None,
    )


def _eligible_rows(connection: sqlite3.Connection) -> list[dict[str, JsonValue]]:
    connection.row_factory = sqlite3.Row
    rows = connection.execute(
        """
        SELECT doc_id, path, title, source, date, type, url,
               market_relevance, metadata_json, content
        FROM documents
        WHERE type = 'article'
          AND (path LIKE 'research-inbox/articles/%' OR path LIKE 'research-inbox/rss/%')
          AND market_relevance > 0
        ORDER BY doc_id ASC
        """
    ).fetchall()
    return [
        {
            "id": str(row["doc_id"]),
            "path": str(row["path"]),
            "title": str(row["title"]),
            "source": str(row["source"]),
            "date": str(row["date"]),
            "type": str(row["type"]),
            "url": str(row["url"]),
            "marketRelevance": int(float(row["market_relevance"]) * 1_000_000),
            "metadata": str(row["metadata_json"]),
            "content": str(row["content"]),
        }
        for row in rows
    ]


def resolve_null_collection(data_dir: Path, approved: ApprovedRequest) -> ResolutionSnapshotV1:
    path = data_dir / "research-index.sqlite3"
    if not path.is_file():
        return missing_index_snapshot()
    try:
        with sqlite3.connect(f"file:{path.as_posix()}?mode=ro", uri=True, timeout=5) as connection:
            rows = _eligible_rows(connection)
        index_generation = sha256_hex(rows)
    except (sqlite3.DatabaseError, OSError, ValueError, KeyError, TypeError):
        return missing_index_snapshot()
    generations: dict[str, JsonValue] = {
        "indexGeneration": index_generation,
        "rssGeneration": None,
    }
    return ResolutionSnapshotV1(
        schemaVersion=1,
        collectionId=None,
        collectionRevision=None,
        collectionDefinitionHash=None,
        eligibleTotal=None,
        candidateCap=None,
        truncated=False,
        resolvedCandidateIds=[],
        executionUniverseIds=[],
        unusableCandidates=[],
        selectedEvidenceIds=[],
        providerGenerations=ProviderGenerations(indexGeneration=index_generation, rssGeneration=None),
        inputWatermark=sha256_hex(generations),
    )
