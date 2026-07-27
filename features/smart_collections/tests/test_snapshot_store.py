from __future__ import annotations

import json
from pathlib import Path

import pytest

from features.smart_collections import resolution
from features.smart_collections.schema import (
    CreateCollectionRequest,
    DeleteCollectionRequest,
    PreviewRequest,
    ResolveRequest,
)
from features.smart_collections.snapshot_store import (
    SNAPSHOT_HISTORY_LIMIT,
    SnapshotStore,
    SnapshotStoreUnavailableError,
)
from features.smart_collections.service import SmartCollectionService


def resolved_payload(collection_id: str, revision: int, suffix: int = 0) -> dict:
    return {
        "collectionId": collection_id,
        "revision": revision,
        "total": 3,
        "limit": 2,
        "items": [
            {
                "id": f"ev_{suffix}_a",
                "providerIds": [{"provider": "index", "id": f"doc-{suffix}-a"}],
                "title": "A",
                "url": "https://example.test/a",
                "source": "Reuters",
                "markets": ["US"],
                "tickers": ["NVDA"],
                "tags": ["ai"],
                "publishedAt": "2026-07-15T00:00:00Z",
                "score": 1.0,
                "snippet": "must not be stored",
                "usability": "indexed",
            },
            {
                "id": f"ev_{suffix}_b",
                "providerIds": [{"provider": "rss", "id": f"rss-{suffix}-b"}],
                "title": "B",
                "url": "https://example.test/b",
                "source": "Reuters",
                "markets": ["US"],
                "tickers": [],
                "tags": [],
                "publishedAt": "2026-07-15T00:00:00Z",
                "score": 0.5,
                "snippet": "must not be stored either",
                "usability": "unindexed_rss",
            },
        ],
        "resolvedAt": f"2026-07-{16 + suffix:02d}T00:00:00.000000Z",
        "indexGeneration": f"index-{suffix}",
        "rssGeneration": f"rss-{suffix}",
        "inputWatermark": f"watermark-{suffix}",
        "resolvedCandidateIds": [f"ev_{suffix}_a", f"ev_{suffix}_b"],
        "executionUniverseIds": [f"doc-{suffix}-a"],
        "unusableCandidates": [{"candidateId": f"ev_{suffix}_b", "reason": "unindexed_rss"}],
        "truncated": True,
    }


def create_collection(service: SmartCollectionService, definition: dict) -> dict:
    created = service.create(CreateCollectionRequest.model_validate(definition))
    assert isinstance(created["collection"], dict)
    return created["collection"]


def test_preview_and_resolve_persist_bounded_history_without_touching_definitions(
    service: SmartCollectionService,
    definition: dict,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    collection = create_collection(service, definition)
    collection_id = str(collection["id"])
    definition_path = tmp_path / "smart-collections.json"
    definition_bytes = definition_path.read_bytes()
    calls = 0

    def fake_resolve(request):
        nonlocal calls
        result = resolved_payload(collection_id, 1, calls)
        calls += 1
        return result

    monkeypatch.setattr(resolution, "resolve_collection", fake_resolve)
    preview = service.preview(collection_id, PreviewRequest(expectedRevision=1, limit=2))
    assert set(preview) == {"collectionId", "revision", "total", "limit", "items"}
    for _ in range(SNAPSHOT_HISTORY_LIMIT + 1):
        service.resolve(collection_id, ResolveRequest(expectedRevision=1, limit=2))

    sidecar = tmp_path / "smart-collection-state" / f"{collection_id}.json"
    payload = json.loads(sidecar.read_text(encoding="utf-8"))
    assert definition_path.read_bytes() == definition_bytes
    assert set(payload) == {"schemaVersion", "collectionId", "history"}
    assert len(payload["history"]) == SNAPSHOT_HISTORY_LIMIT
    latest = payload["history"][-1]
    assert set(latest) == {
        "collectionId", "revision", "definitionHash", "resolvedAt",
        "providerGenerations", "inputWatermark", "evidenceIds",
        "eligibleCount", "resolvedCount", "executionCount", "unusableCount",
        "truncated",
    }
    assert "items" not in latest
    assert "snippet" not in json.dumps(payload)


def test_failed_resolution_does_not_write_success_snapshot(
    service: SmartCollectionService,
    definition: dict,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    collection = create_collection(service, definition)
    collection_id = str(collection["id"])

    def fail(_request):
        raise RuntimeError("provider_failed")

    monkeypatch.setattr(resolution, "resolve_collection", fail)
    with pytest.raises(RuntimeError, match="provider_failed"):
        service.resolve(collection_id, ResolveRequest(expectedRevision=1, limit=2))
    assert not (tmp_path / "smart-collection-state" / f"{collection_id}.json").exists()


def test_interrupted_sidecar_recovers_backup_or_returns_unavailable(tmp_path: Path) -> None:
    store = SnapshotStore(tmp_path / "smart-collection-state")
    collection_id = "sc_12345678-1234-4234-9234-123456789abc"
    store.append(resolved_payload(collection_id, 1, 0), definition_hash="hash-0")
    store.append(resolved_payload(collection_id, 1, 1), definition_hash="hash-1")
    primary = tmp_path / "smart-collection-state" / f"{collection_id}.json"
    backup = primary.with_name(primary.name + ".bak")
    primary.write_text("{broken", encoding="utf-8")
    recovered = store.load(collection_id)
    assert recovered is not None and recovered.recovered is True
    primary.write_text("{broken", encoding="utf-8")
    backup.write_text("{also-broken", encoding="utf-8")
    before = (primary.read_bytes(), backup.read_bytes())
    with pytest.raises(SnapshotStoreUnavailableError):
        store.load(collection_id)
    assert (primary.read_bytes(), backup.read_bytes()) == before


def test_collection_delete_removes_only_its_validated_sidecar(
    service: SmartCollectionService,
    definition: dict,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    collection = create_collection(service, definition)
    collection_id = str(collection["id"])
    monkeypatch.setattr(
        resolution,
        "resolve_collection",
        lambda _request: resolved_payload(collection_id, 1),
    )
    service.resolve(collection_id, ResolveRequest(expectedRevision=1, limit=2))
    unrelated = tmp_path / "smart-collection-state" / "unrelated.json"
    unrelated.write_text("keep", encoding="utf-8")

    service.delete(collection_id, DeleteCollectionRequest(expectedRevision=1))

    assert not (tmp_path / "smart-collection-state" / f"{collection_id}.json").exists()
    assert unrelated.read_text(encoding="utf-8") == "keep"
    with pytest.raises(SnapshotStoreUnavailableError):
        SnapshotStore(tmp_path / "smart-collection-state").load("../escape")
