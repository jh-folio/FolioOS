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
    """지문의 목적은 `자료가 바뀌었는지`다. 본문과 metadata 원문은 읽지 않는다.

    `content`/`metadata_json`을 전 행에 대해 읽으면 색인 규모에 비례해 수백 MB가
    한 번에 메모리로 올라온다(실측 19,968행에서 canonical bytes 48.6MB, peak 176MB).
    본문 변화는 인덱서가 이미 해시로 판정해 둔다 — `content_updated_at`은 metadata의
    `contentHash`가 달라질 때만 갱신되므로(`research_index.py::sync_index`) 작은 컬럼만으로
    같은 목적을 달성한다. 형제 구현 `smart_collections/providers.py::generation()`도
    본문을 넣지 않는다.
    """
    connection.row_factory = sqlite3.Row
    columns = {str(row[1]) for row in connection.execute("PRAGMA table_info(documents)")}
    content_column = "content_updated_at" if "content_updated_at" in columns else "updated_at"
    rows = connection.execute(
        f"""
        SELECT doc_id, path, title, source, date, type, url,
               market_relevance, {content_column} AS content_updated_at
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
            "contentUpdatedAt": str(row["content_updated_at"] or ""),
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
