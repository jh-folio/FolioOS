from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass, replace
from datetime import datetime
from pathlib import Path, PurePosixPath
from typing import Literal, assert_never

from features.common.jcs import JsonValue, sha256_hex
from features.common.research_library.indexing.research_index import hybrid_search, sanitize_fts_query
from features.common.research_library.rss.policy import normalize_url
from features.smart_collections.schema import Collection


@dataclass(frozen=True, slots=True)
class ProviderRow:
    provider: Literal["index", "rss"]
    providerId: str
    path: str
    title: str
    url: str
    normalizedUrl: str
    source: str
    markets: tuple[str, ...]
    tickers: tuple[str, ...]
    tags: tuple[str, ...]
    publishedAt: str
    contentHash: str
    contentUpdatedAt: str
    fileMtimeNs: int
    fileSize: int
    snippet: str
    rank: int = 0


@dataclass(frozen=True, slots=True)
class ProviderSnapshot:
    indexRows: tuple[ProviderRow, ...]
    rssRows: tuple[ProviderRow, ...]
    indexGeneration: str | None
    rssGeneration: str | None


@dataclass(frozen=True, slots=True)
class CollectionSourceUnavailableError(Exception):
    code: str = "collection_source_unavailable"

    def __str__(self) -> str:
        return self.code


def values(raw: JsonValue, *, upper: bool = False) -> tuple[str, ...]:
    source = raw if isinstance(raw, list) else str(raw or "").split(",")
    normalized = []
    for item in source:
        if not isinstance(item, str):
            continue
        token = item.strip()
        if token:
            normalized.append(token.upper() if upper else token.casefold())
    return tuple(sorted(set(normalized)))


def inbox_path(raw: str) -> str:
    normalized = str(PurePosixPath(raw.replace("\\", "/")))
    marker = "research-inbox/"
    position = normalized.casefold().find(marker)
    return normalized[position:] if position >= 0 else normalized.lstrip("/")


def metadata(raw: str) -> dict[str, JsonValue]:
    try:
        parsed = json.loads(raw or "{}")
    except json.JSONDecodeError:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def index_row(row: sqlite3.Row) -> ProviderRow:
    meta = metadata(str(row["metadata_json"] or "{}"))
    market_raw = meta.get("markets", meta.get("market", []))
    tags = (*values(meta.get("impactTags", [])), *values(meta.get("relatedThemes", [])))
    raw_url = str(row["url"] or "")
    normalized = str(meta.get("normalizedUrl") or normalize_url(raw_url))
    return ProviderRow(
        provider="index",
        providerId=str(row["doc_id"]),
        path=inbox_path(str(row["path"])),
        title=str(row["title"]),
        url=raw_url,
        normalizedUrl=normalize_url(normalized),
        source=str(row["source"] or meta.get("media") or "").strip(),
        markets=values(market_raw) or ("unknown",),
        tickers=values(meta.get("relatedTickers", []), upper=True),
        tags=tuple(sorted(set(tags))),
        publishedAt=str(row["date"] or ""),
        contentHash=str(meta.get("contentHash") or ""),
        contentUpdatedAt=str(row["content_updated_at"] or ""),
        fileMtimeNs=0,
        fileSize=0,
        snippet=str(meta.get("summary") or ""),
    )


def rss_row(row: sqlite3.Row) -> ProviderRow:
    url = str(row["url"] or "")
    normalized = normalize_url(str(row["normalized_url"] or url))
    content_hash = sha256_hex(
        {
            "id": str(row["filename"]),
            "url": normalized,
            "title": str(row["title"]),
            "summary": str(row["description"]),
        }
    )
    return ProviderRow(
        provider="rss",
        providerId=str(row["filename"]),
        path=f"research-inbox/rss/{row['filename']}",
        title=str(row["title"]),
        url=url,
        normalizedUrl=normalized,
        source=str(row["media"] or row["source_type"] or "").strip(),
        markets=values(str(row["markets"] or "")) or ("unknown",),
        tickers=(),
        tags=(),
        publishedAt=str(row["timestamp_sort"] or row["timestamp"] or ""),
        contentHash=content_hash,
        contentUpdatedAt="",
        fileMtimeNs=int(row["mtime_ns"] or 0),
        fileSize=int(row["size"] or 0),
        snippet=str(row["description"] or "")[:700],
    )


def passes_filters(row: ProviderRow, collection: Collection) -> bool:
    source_ok = not collection.sources or row.source.casefold() in collection.sources
    market_ok = collection.market == "ALL" or collection.market.casefold() in row.markets
    ticker_ok = not collection.tickers or bool(set(collection.tickers) & set(row.tickers))
    tag_ok = not collection.tags or bool(set(collection.tags) & set(row.tags))
    return source_ok and market_ok and ticker_ok and tag_ok


def generation(rows: tuple[ProviderRow, ...]) -> str:
    payload: list[JsonValue] = []
    for row in sorted(rows, key=lambda item: item.providerId):
        generation_row: dict[str, JsonValue] = {
            "id": row.providerId,
            "contentHash": row.contentHash,
            "contentUpdatedAt": row.contentUpdatedAt or None,
            "publishedAt": row.publishedAt,
            "source": row.source,
            "markets": list(row.markets),
            "tickers": list(row.tickers),
            "tags": list(row.tags),
            "normalizedUrl": row.normalizedUrl,
            "path": row.path,
        }
        match row.provider:
            case "index":
                pass
            case "rss":
                generation_row["fileMtimeNs"] = row.fileMtimeNs
                generation_row["fileSize"] = row.fileSize
            case unreachable:
                assert_never(unreachable)
        payload.append(generation_row)
    return sha256_hex(payload)


def _tables(connection: sqlite3.Connection) -> set[str]:
    return {
        str(row[0])
        for row in connection.execute("SELECT name FROM sqlite_master WHERE type IN ('table','view')")
    }


def load_snapshot(data_dir: Path, collection: Collection) -> ProviderSnapshot:
    path = data_dir / "research-index.sqlite3"
    if not path.is_file():
        return ProviderSnapshot((), (), None, None)
    try:
        with sqlite3.connect(f"file:{path.as_posix()}?mode=ro", uri=True, timeout=5) as connection:
            connection.row_factory = sqlite3.Row
            tables = _tables(connection)
            index_rows: tuple[ProviderRow, ...] = ()
            rss_rows: tuple[ProviderRow, ...] = ()
            if "documents" in tables:
                columns = {str(row[1]) for row in connection.execute("PRAGMA table_info(documents)")}
                content_column = "content_updated_at" if "content_updated_at" in columns else "updated_at"
                rows = connection.execute(
                    f"SELECT *, {content_column} AS content_updated_at FROM documents "
                    "WHERE type='article' AND market_relevance>0 AND "
                    "(path LIKE 'research-inbox/articles/%' OR path LIKE 'research-inbox/rss/%')"
                ).fetchall()
                index_rows = tuple(item for item in map(index_row, rows) if passes_filters(item, collection))
            if "rss_feed_items" in tables:
                rows = connection.execute("SELECT * FROM rss_feed_items WHERE visible=1").fetchall()
                rss_rows = tuple(item for item in map(rss_row, rows) if passes_filters(item, collection))
    except (sqlite3.DatabaseError, OSError, ValueError, KeyError, TypeError) as error:
        raise CollectionSourceUnavailableError from error
    return ProviderSnapshot(
        indexRows=index_rows,
        rssRows=rss_rows,
        indexGeneration=generation(index_rows) if "documents" in tables else None,
        rssGeneration=generation(rss_rows) if "rss_feed_items" in tables else None,
    )


def index_query_ids(data_dir: Path, query: str, allowed_ids: set[str]) -> set[str]:
    if not query or not allowed_ids:
        return set(allowed_ids)
    expression = sanitize_fts_query(query)
    if not expression:
        return set()
    path = data_dir / "research-index.sqlite3"
    # 허용 ID를 `IN (...)`에 바인딩하지 않는다. 검색어만 지정한 컬렉션의 허용 집합은
    # 색인의 모든 article 문서라, SQLITE_MAX_VARIABLE_NUMBER(현행 32766, 구버전 999)를
    # 넘는 순간 `too many SQL variables`가 컬렉션 전체를 열지 못하게 만든다.
    # FTS MATCH가 어차피 먼저 평가되므로 교집합은 파이썬에서 잡는다(결과는 동일).
    try:
        with sqlite3.connect(f"file:{path.as_posix()}?mode=ro", uri=True, timeout=5) as connection:
            rows = connection.execute(
                "SELECT DISTINCT c.doc_id FROM chunks_fts JOIN chunks c "
                "ON c.chunk_id=chunks_fts.chunk_id WHERE chunks_fts MATCH ?",
                (expression,),
            ).fetchall()
    except sqlite3.DatabaseError as error:
        raise CollectionSourceUnavailableError from error
    return {str(row[0]) for row in rows} & set(allowed_ids)


def ranked_index_rows(data_dir: Path, query: str, rows: tuple[ProviderRow, ...]) -> tuple[ProviderRow, ...]:
    if not query:
        ordered = sorted(rows, key=lambda row: row.providerId)
        ordered.sort(key=lambda row: valid_date(row.publishedAt), reverse=True)
        return tuple(replace(row, rank=rank) for rank, row in enumerate(ordered[:120], 1))
    by_id = {row.providerId: row for row in rows}
    hits = hybrid_search(data_dir / "research-index.sqlite3", query, limit=120, allowed_doc_ids=set(by_id))
    return tuple(
        replace(by_id[str(hit["id"])], rank=rank)
        for rank, hit in enumerate(hits, 1)
        if str(hit["id"]) in by_id
    )


def valid_date(value: str) -> str:
    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return ""
    return value
