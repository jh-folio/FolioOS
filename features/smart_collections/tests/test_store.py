from __future__ import annotations

import json
from pathlib import Path

import pytest

from features.smart_collections.schema import CreateCollectionRequest, UpdateCollectionRequest
from features.smart_collections.service import (
    CollectionConflictError,
    CollectionStoreUnavailableError,
    SmartCollectionService,
)


def test_lazy_create_and_revision_conflict(
    service: SmartCollectionService,
    definition: dict[str, str | list[str]],
    tmp_path: Path,
) -> None:
    assert service.list(limit=100, offset=0)["storeRevision"] == 0
    assert not (tmp_path / "smart-collections.json").exists()
    created = service.create(CreateCollectionRequest.model_validate(definition))
    assert created["storeRevision"] == 1
    collection = created["collection"]
    assert collection["revision"] == 1
    assert collection["sources"] == ["reuters"]
    assert collection["tickers"] == ["NVDA"]
    stale = UpdateCollectionRequest.model_validate({**definition, "expectedRevision": 2})
    with pytest.raises(CollectionConflictError, match="revision_conflict"):
        service.update(str(collection["id"]), stale)
    assert service.list(limit=100, offset=0)["storeRevision"] == 1


def test_backup_recovery_and_double_corruption(
    service: SmartCollectionService,
    definition: dict[str, str | list[str]],
    tmp_path: Path,
) -> None:
    created = service.create(CreateCollectionRequest.model_validate(definition))
    collection = created["collection"]
    update = UpdateCollectionRequest.model_validate(
        {**definition, "expectedRevision": 1, "query": "AI chips"}
    )
    service.update(str(collection["id"]), update)
    primary = tmp_path / "smart-collections.json"
    backup = tmp_path / "smart-collections.json.bak"
    primary.write_text("{broken", encoding="utf-8")
    recovered = service.list(limit=100, offset=0)
    assert recovered["recovered"] is True
    assert recovered["storeRevision"] == 1
    primary.write_text("{broken", encoding="utf-8")
    backup.write_text("{also-broken", encoding="utf-8")
    before = (primary.read_bytes(), backup.read_bytes())
    with pytest.raises(CollectionStoreUnavailableError):
        service.list(limit=100, offset=0)
    assert (primary.read_bytes(), backup.read_bytes()) == before


def test_duplicate_name_is_casefold_unique(
    service: SmartCollectionService,
    definition: dict[str, str | list[str]],
) -> None:
    service.create(CreateCollectionRequest.model_validate(definition))
    duplicate = CreateCollectionRequest.model_validate({**definition, "name": "ai leaders"})
    with pytest.raises(CollectionConflictError, match="duplicate_name"):
        service.create(duplicate)


def test_collection_market_alias_is_saved_as_canonical_europe(
    service: SmartCollectionService,
    definition: dict[str, str | list[str]],
) -> None:
    request = CreateCollectionRequest.model_validate({**definition, "market": "EU"})
    assert request.market == "EUROPE"
    created = service.create(request)
    assert created["collection"]["market"] == "EUROPE"


def test_store_shape_is_strict_json(
    service: SmartCollectionService,
    definition: dict[str, str | list[str]],
    tmp_path: Path,
) -> None:
    service.create(CreateCollectionRequest.model_validate(definition))
    payload = json.loads((tmp_path / "smart-collections.json").read_text(encoding="utf-8"))
    assert set(payload) == {"schemaVersion", "storeRevision", "updatedAt", "collections"}


def test_read_operations_do_not_change_definition_bytes_or_revisions(
    service: SmartCollectionService,
    definition: dict[str, str | list[str]],
    tmp_path: Path,
) -> None:
    created = service.create(CreateCollectionRequest.model_validate(definition))
    collection = created["collection"]
    primary = tmp_path / "smart-collections.json"
    bytes_before = primary.read_bytes()

    listed = service.list(limit=100, offset=0)
    fetched = service.get(str(collection["id"]))
    approved = service.approved_ref(str(collection["id"]), expected_revision=1)

    assert primary.read_bytes() == bytes_before
    assert listed["storeRevision"] == created["storeRevision"] == 1
    assert fetched["storeRevision"] == 1
    assert listed["items"][0]["revision"] == collection["revision"] == 1
    assert fetched["collection"]["revision"] == 1
    assert approved.revision == 1
