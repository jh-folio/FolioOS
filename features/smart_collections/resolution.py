from __future__ import annotations

import hashlib
import re
import unicodedata
from collections.abc import Callable
from dataclasses import dataclass, replace
from datetime import datetime
from pathlib import Path
from typing import assert_never

from features.common.jcs import JsonValue, sha256_hex
from features.smart_collections.providers import (
    ProviderRow,
    index_query_ids,
    load_snapshot,
    ranked_index_rows,
)
from features.smart_collections.schema import Collection
from features.smart_collections.service import utc_z


TOKEN_PATTERN = re.compile(r"[A-Za-z0-9가-힣]{2,}")


@dataclass(frozen=True, slots=True)
class ResolutionRequest:
    dataDir: Path
    collection: Collection
    limit: int
    includeResolution: bool
    clock: Callable[[], datetime]


@dataclass(frozen=True, slots=True)
class Candidate:
    id: str
    index: ProviderRow | None
    rss: ProviderRow | None
    providerRows: tuple[ProviderRow, ...]
    score: float


class CandidateInvariantError(RuntimeError):
    pass


def dedupe_key(row: ProviderRow) -> bytes:
    if row.normalizedUrl:
        return f"url:{row.normalizedUrl}".encode()
    return f"path:{row.path}".encode()


def fused_id(row: ProviderRow) -> str:
    return "ev_" + hashlib.sha256(dedupe_key(row)).hexdigest()[:24]


def normalized_query(value: str) -> str:
    return " ".join(unicodedata.normalize("NFKC", value).casefold().split())


def rss_score(row: ProviderRow, query: str) -> int:
    phrase = normalized_query(query)
    if not phrase:
        return 0
    title = normalized_query(row.title)
    description = normalized_query(row.snippet)
    tokens = set(TOKEN_PATTERN.findall(phrase))
    score = 8 if phrase in title else 0
    score += 4 * sum(token in title for token in tokens)
    score += sum(token in description for token in tokens)
    return score


def ranked_rss_rows(rows: tuple[ProviderRow, ...], query: str) -> tuple[ProviderRow, ...]:
    if query:
        scored = [(rss_score(row, query), row) for row in rows]
        scored = [item for item in scored if item[0] > 0]
        scored.sort(key=lambda item: item[1].providerId)
        scored.sort(key=lambda item: valid_time(item[1].publishedAt), reverse=True)
        scored.sort(key=lambda item: item[0], reverse=True)
        return tuple(replace(row, rank=rank) for rank, (_, row) in enumerate(scored[:120], 1))
    ordered = sorted(rows, key=lambda row: row.providerId)
    ordered.sort(key=lambda row: valid_time(row.publishedAt), reverse=True)
    ordered = ordered[:120]
    return tuple(replace(row, rank=rank) for rank, row in enumerate(ordered, 1))


def query_eligible(request: ResolutionRequest, rows: tuple[ProviderRow, ...]) -> tuple[ProviderRow, ...]:
    if not request.collection.query:
        return rows
    if not rows:
        return ()
    match rows[0].provider:
        case "index":
            allowed = {row.providerId for row in rows}
            matches = index_query_ids(request.dataDir, request.collection.query, allowed)
            return tuple(row for row in rows if row.providerId in matches)
        case "rss":
            return tuple(row for row in rows if rss_score(row, request.collection.query) > 0)
        case unreachable:
            assert_never(unreachable)


def provider_groups(rows: tuple[ProviderRow, ...]) -> dict[bytes, tuple[ProviderRow, ...]]:
    grouped: dict[bytes, list[ProviderRow]] = {}
    for row in rows:
        grouped.setdefault(dedupe_key(row), []).append(row)
    return {key: tuple(value) for key, value in grouped.items()}


def best_row(rows: tuple[ProviderRow, ...]) -> ProviderRow:
    return min(rows, key=lambda row: (row.rank, -valid_time(row.contentUpdatedAt), -valid_time(row.publishedAt), row.providerId))


def valid_time(value: str) -> float:
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).timestamp()
    except (OSError, OverflowError, ValueError):
        return float("-inf")


def fuse(index_rows: tuple[ProviderRow, ...], rss_rows: tuple[ProviderRow, ...]) -> list[Candidate]:
    index_groups = provider_groups(index_rows)
    rss_groups = provider_groups(rss_rows)
    candidates: list[Candidate] = []
    for key in set(index_groups) | set(rss_groups):
        index = best_row(index_groups[key]) if key in index_groups else None
        rss = best_row(rss_groups[key]) if key in rss_groups else None
        representative = index or rss
        if representative is None:
            continue
        score = sum(1 / (60 + row.rank) for row in (index, rss) if row is not None and row.rank > 0)
        candidates.append(
            Candidate(
                id=fused_id(representative),
                index=index,
                rss=rss,
                providerRows=tuple(sorted((*index_groups.get(key, ()), *rss_groups.get(key, ())), key=lambda row: (row.provider, row.providerId))),
                score=score,
            )
        )
    candidates.sort(
        key=lambda item: (
            -item.score,
            -valid_time((item.index or item.rss).publishedAt if item.index or item.rss else ""),
            item.id,
        )
    )
    return candidates


def mapped_index(candidate: Candidate, index_rows: tuple[ProviderRow, ...]) -> ProviderRow | None:
    if candidate.index is not None:
        return candidate.index
    rss = candidate.rss
    if rss is None:
        return None
    path_matches = [row for row in index_rows if row.path == rss.path]
    url_matches = [row for row in index_rows if rss.normalizedUrl and row.normalizedUrl == rss.normalizedUrl]
    matches = path_matches or url_matches
    if not matches:
        return None
    return sorted(
        matches,
        key=lambda row: (-valid_time(row.contentUpdatedAt), -valid_time(row.publishedAt), row.providerId),
    )[0]


def preview_item(candidate: Candidate, mapped: ProviderRow | None) -> dict[str, JsonValue]:
    representative = candidate.index or candidate.rss
    if representative is None:
        raise CandidateInvariantError("candidate_without_representative")
    return {
        "id": candidate.id,
        "providerIds": [
            {"provider": row.provider, "id": row.providerId} for row in candidate.providerRows
        ],
        "title": representative.title,
        "url": representative.url,
        "source": representative.source,
        "markets": [value.upper() for value in representative.markets],
        "tickers": list(representative.tickers),
        "tags": list(representative.tags),
        "publishedAt": representative.publishedAt,
        "score": candidate.score,
        "snippet": representative.snippet,
        "usability": "indexed" if mapped is not None else "unindexed_rss",
    }


def resolve_collection(request: ResolutionRequest) -> dict[str, JsonValue]:
    snapshot = load_snapshot(request.dataDir, request.collection)
    eligible_index = query_eligible(request, snapshot.indexRows)
    eligible_rss = query_eligible(request, snapshot.rssRows)
    eligible_total = len(set(provider_groups(eligible_index)) | set(provider_groups(eligible_rss)))
    raw_index = ranked_index_rows(request.dataDir, request.collection.query, snapshot.indexRows)
    raw_rss = ranked_rss_rows(snapshot.rssRows, request.collection.query)
    candidates = fuse(raw_index, raw_rss)[: request.limit]
    mapped = [mapped_index(candidate, snapshot.indexRows) for candidate in candidates]
    payload: dict[str, JsonValue] = {
        "collectionId": request.collection.id,
        "revision": request.collection.revision,
        "total": eligible_total,
        "limit": request.limit,
        "items": [preview_item(candidate, match) for candidate, match in zip(candidates, mapped, strict=True)],
    }
    if not request.includeResolution:
        return payload
    resolved_ids = [candidate.id for candidate in candidates]
    universe: list[str] = []
    unusable: list[JsonValue] = []
    for candidate, match in zip(candidates, mapped, strict=True):
        if match is None:
            unusable.append({"candidateId": candidate.id, "reason": "unindexed_rss"})
        elif match.providerId not in universe:
            universe.append(match.providerId)
    generations: dict[str, JsonValue] = {
        "indexGeneration": snapshot.indexGeneration,
        "rssGeneration": snapshot.rssGeneration,
    }
    payload.update(
        {
            "resolvedAt": utc_z(request.clock()),
            **generations,
            "inputWatermark": sha256_hex(generations) if any(generations.values()) else None,
            "resolvedCandidateIds": resolved_ids,
            "executionUniverseIds": universe,
            "unusableCandidates": unusable,
            "truncated": len(resolved_ids) < eligible_total,
        }
    )
    return payload
