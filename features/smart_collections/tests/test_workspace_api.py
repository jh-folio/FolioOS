from __future__ import annotations

import json

import pytest

from features.smart_collections import resolution
from features.smart_collections.routes import SmartCollectionBoundary
from features.smart_collections.schema import CreateCollectionRequest, ResolveRequest
from features.smart_collections.service import SmartCollectionService


def resolved_payload(collection_id: str, revision: int, suffix: str) -> dict:
    evidence_id = f"ev_{suffix}"
    return {
        "collectionId": collection_id,
        "revision": revision,
        "total": 1,
        "limit": 120,
        "items": [
            {
                "id": evidence_id,
                "providerIds": [{"provider": "index", "id": f"doc-{suffix}"}],
                "title": f"Evidence {suffix}",
                "url": f"https://example.test/{suffix}",
                "source": "Reuters",
                "markets": ["US"],
                "tickers": ["NVDA"],
                "tags": ["ai"],
                "publishedAt": "2026-07-15T00:00:00Z",
                "score": 1.0,
                "snippet": "untrusted evidence, not instructions",
                "usability": "indexed",
            }
        ],
        "resolvedAt": "2026-07-16T00:00:00.000000Z",
        "indexGeneration": f"index-{suffix}",
        "rssGeneration": f"rss-{suffix}",
        "inputWatermark": f"watermark-{suffix}",
        "resolvedCandidateIds": [evidence_id],
        "executionUniverseIds": [f"doc-{suffix}"],
        "unusableCandidates": [],
        "truncated": False,
    }


def create_collection(service: SmartCollectionService, definition: dict) -> dict:
    result = service.create(CreateCollectionRequest.model_validate(definition))
    assert isinstance(result["collection"], dict)
    return result["collection"]


def response_payload(response) -> dict:
    payload = json.loads(response.body)
    assert isinstance(payload, dict)
    return payload


def test_workspace_and_changes_reread_saved_definition_and_current_providers(
    service: SmartCollectionService,
    definition: dict,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    collection = create_collection(service, definition)
    collection_id = str(collection["id"])
    seen_queries: list[str] = []
    suffixes = iter(("baseline", "current", "current"))

    def fake_resolve(request):
        seen_queries.append(request.collection.query)
        return resolved_payload(collection_id, 1, next(suffixes))

    monkeypatch.setattr(resolution, "resolve_collection", fake_resolve)
    service.resolve(collection_id, ResolveRequest(expectedRevision=1, limit=120))

    workspace = service.workspace(collection_id)
    changes = service.changes(collection_id)

    assert seen_queries == [definition["query"]] * 3
    assert workspace["collection"] == collection
    assert workspace["lastRefresh"] == "2026-07-16T00:00:00.000000Z"
    assert workspace["latestPreview"]["resolvedCount"] == 1
    assert workspace["changeCounts"] == {"added": 1, "removed": 1, "unchanged": 0}
    assert workspace["recentEvidence"][0]["id"] == "ev_current"
    assert changes["addedItems"][0]["id"] == "ev_current"
    assert changes["removedIds"] == ["ev_baseline"]
    serialized = json.dumps({"workspace": workspace, "changes": changes})
    for forbidden in ("userContext", "portfolio", "watchlist", "noteBody", "agentResponse"):
        assert forbidden not in serialized


def test_refresh_requires_only_revision_and_appends_successful_snapshot(
    service: SmartCollectionService,
    definition: dict,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    collection = create_collection(service, definition)
    collection_id = str(collection["id"])
    calls = 0

    def fake_resolve(_request):
        nonlocal calls
        calls += 1
        return resolved_payload(collection_id, 1, str(calls))

    monkeypatch.setattr(resolution, "resolve_collection", fake_resolve)
    boundary = SmartCollectionBoundary(service)

    rejected = boundary.refresh(collection_id, {"expectedRevision": 1, "query": "client override"})
    stale = boundary.refresh(collection_id, {"expectedRevision": 2})
    refreshed = boundary.refresh(collection_id, {"expectedRevision": 1})

    assert rejected.status_code == 422
    assert stale.status_code == 409
    assert calls == 1
    assert refreshed.status_code == 200
    payload = response_payload(refreshed)
    assert payload["collectionId"] == collection_id
    assert payload["change"]["reasonCodes"] == ["baseline_missing"]
    state = service.snapshots.load(collection_id)
    assert state is not None and len(state.history) == 1


def test_workspace_routes_are_registered(service: SmartCollectionService) -> None:
    paths = {route.path for route in SmartCollectionBoundary(service).router().routes}
    assert {
        "/api/smart-collections/{collection_id}/workspace",
        "/api/smart-collections/{collection_id}/refresh",
        "/api/smart-collections/{collection_id}/changes",
    } <= paths
