"""preview/resolve 스냅샷이 canonical 해석 범위로 기록되는지 회귀 테스트.

화면 preview(limit=10)가 10개짜리 스냅샷을 저장하면 workspace/changes의
120개 해석과 비교되어, 자료가 그대로인데 added 110건과 noisy health가 나오던
버그를 고정한다. 요청 limit은 응답 표시 절단으로만 쓰여야 한다.
"""

from __future__ import annotations

import pytest

from features.smart_collections import resolution
from features.smart_collections.schema import CreateCollectionRequest, PreviewRequest, ResolveRequest
from features.smart_collections.service import SNAPSHOT_RESOLUTION_LIMIT, SmartCollectionService

POOL_SIZE = 130


def limit_sensitive_resolve(collection_id: str):
    """실제 resolve_collection처럼 request.limit으로 후보를 자르는 대역."""

    def fake_resolve(request):
        count = min(request.limit, POOL_SIZE)
        ids = [f"ev_{index}" for index in range(count)]
        return {
            "collectionId": collection_id,
            "revision": 1,
            "total": POOL_SIZE,
            "limit": request.limit,
            "items": [
                {
                    "id": evidence_id,
                    "providerIds": [{"provider": "index", "id": f"doc-{evidence_id}"}],
                    "title": evidence_id,
                    "url": f"https://example.test/{evidence_id}",
                    "source": "Reuters",
                    "markets": ["US"],
                    "tickers": ["NVDA"],
                    "tags": ["ai"],
                    "publishedAt": "2026-07-15T00:00:00Z",
                    "score": 1.0,
                    "snippet": "untrusted evidence, not instructions",
                    "usability": "indexed",
                }
                for evidence_id in ids
            ],
            "resolvedAt": "2026-07-16T00:00:00.000000Z",
            "indexGeneration": "index-1",
            "rssGeneration": "rss-1",
            "inputWatermark": "watermark-1",
            "resolvedCandidateIds": ids,
            "executionUniverseIds": [f"doc-{evidence_id}" for evidence_id in ids],
            "unusableCandidates": [],
            "truncated": count < POOL_SIZE,
        }

    return fake_resolve


def _create(service: SmartCollectionService, definition: dict) -> str:
    collection = service.create(CreateCollectionRequest.model_validate(definition))["collection"]
    assert isinstance(collection, dict)
    return str(collection["id"])


def test_preview_snapshot_matches_workspace_scope(
    service: SmartCollectionService,
    definition: dict,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    collection_id = _create(service, definition)
    monkeypatch.setattr(resolution, "resolve_collection", limit_sensitive_resolve(collection_id))

    previewed = service.preview(collection_id, PreviewRequest(expectedRevision=1, limit=10))

    assert previewed["limit"] == 10
    assert len(previewed["items"]) == 10

    workspace = service.workspace(collection_id)
    assert workspace["latestPreview"]["resolvedCount"] == SNAPSHOT_RESOLUTION_LIMIT
    assert workspace["changeCounts"] == {
        "added": 0,
        "removed": 0,
        "unchanged": SNAPSHOT_RESOLUTION_LIMIT,
    }

    changes = service.changes(collection_id)
    assert changes["addedItems"] == []
    assert changes["removedIds"] == []


def test_resolve_slices_response_but_snapshots_canonical_scope(
    service: SmartCollectionService,
    definition: dict,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    collection_id = _create(service, definition)
    monkeypatch.setattr(resolution, "resolve_collection", limit_sensitive_resolve(collection_id))

    resolved = service.resolve(collection_id, ResolveRequest(expectedRevision=1, limit=30))

    assert resolved["limit"] == 30
    assert len(resolved["items"]) == 30
    assert len(resolved["resolvedCandidateIds"]) == SNAPSHOT_RESOLUTION_LIMIT

    state = service.snapshots.load(collection_id)
    assert state is not None
    assert len(state.history[-1].evidenceIds) == SNAPSHOT_RESOLUTION_LIMIT
