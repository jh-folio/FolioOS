from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path
from uuid import UUID

import json

from starlette.requests import Request
from starlette.responses import Response

from features.common.jcs import JsonValue

from features.smart_collections.routes import SmartCollectionBoundary
from features.smart_collections.service import SmartCollectionRuntime, SmartCollectionService


def boundary(tmp_path: Path) -> SmartCollectionBoundary:
    service = SmartCollectionService(
        SmartCollectionRuntime(
            dataDir=tmp_path,
            clock=lambda: datetime(2026, 7, 16, tzinfo=UTC),
            uuidFactory=lambda: UUID("12345678-1234-4234-9234-123456789abc"),
        )
    )
    return SmartCollectionBoundary(service)


def payload(response: Response) -> dict[str, JsonValue]:
    parsed = json.loads(response.body)
    assert isinstance(parsed, dict)
    return parsed


def list_request(query: bytes = b"") -> Request:
    return Request({"type": "http", "method": "GET", "path": "/", "query_string": query, "headers": []})


def body() -> dict[str, str | list[str]]:
    return {
        "name": "US AI",
        "query": "AI",
        "market": "US",
        "sources": [],
        "tickers": [],
        "tags": [],
    }


def test_crud_http_contract_and_strict_validation(tmp_path: Path) -> None:
    api = boundary(tmp_path)
    assert payload(api.list(list_request())) == {
        "schemaVersion": 1,
        "storeRevision": 0,
        "recovered": False,
        "total": 0,
        "items": [],
    }
    invalid = api.create({**body(), "extra": True})
    assert invalid.status_code == 422
    assert payload(invalid) == {"error": "validation_error", "fields": ["extra"]}
    created = api.create(body())
    assert created.status_code == 201
    collection = payload(created)["collection"]
    assert isinstance(collection, dict)
    collection_id = collection["id"]
    stale = api.update(str(collection_id), {**body(), "expectedRevision": 2})
    assert stale.status_code == 409
    assert payload(stale)["error"] == "revision_conflict"
    updated = api.update(
        str(collection_id),
        {**body(), "expectedRevision": 1, "query": "chips"},
    )
    assert updated.status_code == 200
    updated_collection = payload(updated)["collection"]
    assert isinstance(updated_collection, dict) and updated_collection["revision"] == 2
    deleted = api.delete(str(collection_id), {"expectedRevision": 2})
    assert deleted.status_code == 200
    assert payload(deleted) == {"storeRevision": 3, "deletedId": collection_id}


def test_query_and_body_bounds_are_422(tmp_path: Path) -> None:
    api = boundary(tmp_path)
    assert api.list(list_request(b"limit=101")).status_code == 422
    assert api.create({**body(), "query": "x" * 501}).status_code == 422
