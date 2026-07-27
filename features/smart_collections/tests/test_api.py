from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from uuid import UUID

from fastapi import FastAPI

from features.agent_mode.routes import AgentCompanionBoundary
from features.smart_collections.routes import SmartCollectionBoundary
from features.smart_collections.service import SmartCollectionRuntime, SmartCollectionService


COLLECTION_UUID = UUID("12345678-1234-4234-9234-123456789abc")
COLLECTION_ID = f"sc_{COLLECTION_UUID}"
QUERY_CANARY = "IGNORE_RULES_QUERY_CANARY"
SOURCE_CANARY = "source-prompt-canary"
HYPOTHESIS_CANARY = "USER_CONTEXT_HYPOTHESIS_CANARY"
FAKE_BODY_CANARY = "FRONTEND_FAKE_EVIDENCE_BODY_CANARY"


@dataclass
class ApiResponse:
    status_code: int
    body: bytes

    @property
    def text(self) -> str:
        return self.body.decode("utf-8")

    def json(self):
        return json.loads(self.body)


class ApiClient:
    def __init__(self, app: FastAPI) -> None:
        self.app = app

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return None

    def request(self, method: str, path: str, json_body=None) -> ApiResponse:
        payload = b"" if json_body is None else json.dumps(json_body).encode("utf-8")

        async def invoke() -> ApiResponse:
            sent = []
            received = False

            async def receive():
                nonlocal received
                if not received:
                    received = True
                    return {"type": "http.request", "body": payload, "more_body": False}
                return {"type": "http.disconnect"}

            async def send(message):
                sent.append(message)

            raw_path, _, raw_query = path.partition("?")
            scope = {
                "type": "http", "asgi": {"version": "3.0"}, "http_version": "1.1",
                "method": method, "scheme": "http", "path": raw_path,
                "raw_path": raw_path.encode(), "query_string": raw_query.encode(),
                "root_path": "", "headers": [(b"content-type", b"application/json")],
                "client": ("test", 1), "server": ("test", 80),
            }
            await self.app(scope, receive, send)
            start = next(item for item in sent if item["type"] == "http.response.start")
            body = b"".join(item.get("body", b"") for item in sent if item["type"] == "http.response.body")
            return ApiResponse(start["status"], body)

        return asyncio.run(invoke())

    def get(self, path: str) -> ApiResponse:
        return self.request("GET", path)

    def post(self, path: str, json=None) -> ApiResponse:
        return self.request("POST", path, json)

    def put(self, path: str, json=None) -> ApiResponse:
        return self.request("PUT", path, json)


def _service(data_dir: Path) -> SmartCollectionService:
    return SmartCollectionService(SmartCollectionRuntime(
        dataDir=data_dir,
        clock=lambda: datetime(2026, 7, 22, tzinfo=UTC),
        uuidFactory=lambda: COLLECTION_UUID,
    ))


def _app(data_dir: Path) -> FastAPI:
    service = _service(data_dir)
    app = FastAPI()
    app.include_router(SmartCollectionBoundary(service).router())
    app.include_router(AgentCompanionBoundary(service).router())
    return app


def _definition(**overrides):
    return {
        "name": "Canary Collection",
        "query": QUERY_CANARY,
        "market": "US",
        "sources": [SOURCE_CANARY],
        "tickers": [],
        "tags": [],
        **overrides,
    }


def _create(client: ApiClient, **overrides) -> dict:
    response = client.post("/api/smart-collections", json=_definition(**overrides))
    assert response.status_code == 201, response.text
    return response.json()["collection"]


def _explain(client: ApiClient, revision: int = 1, **extra):
    return client.post("/api/agent/companion", json={
        "message": "이 컬렉션을 설명해줘",
        "context": {
            "surface": "deep_research",
            "collectionId": COLLECTION_ID,
            "collectionRevision": revision,
            **extra,
        },
    })


def test_list_accepts_canonical_decimal_query_strings_only(tmp_path: Path):
    with ApiClient(_app(tmp_path)) as client:
        valid = client.get("/api/smart-collections?limit=100&offset=0")
        invalid = {
            value: client.get(f"/api/smart-collections?limit={value}&offset=0")
            for value in ("1.0", "-1", "+1", "01", "101")
        }
        invalid_offset = client.get("/api/smart-collections?limit=10&offset=10001")
    assert valid.status_code == 200
    assert valid.json()["items"] == []
    for value, rejected in invalid.items():
        assert rejected.status_code == 422, (value, rejected.text)
        assert "limit" in rejected.json()["fields"]
    assert invalid_offset.status_code == 422
    assert "offset" in invalid_offset.json()["fields"]


def test_id_revision_only_trust_and_source_hypothesis_canary_separation(tmp_path: Path):
    with ApiClient(_app(tmp_path)) as client:
        _create(client)
        clean = _explain(client)
        poisoned = _explain(
            client,
            query="OVERRIDE QUERY",
            matches=[{"body": FAKE_BODY_CANARY}],
            evidenceBodies=[FAKE_BODY_CANARY],
            userContext=HYPOTHESIS_CANARY,
        )
    assert clean.status_code == poisoned.status_code == 200
    clean_projection = clean.json()["context"]["collection"]
    poisoned_projection = poisoned.json()["context"]["collection"]
    assert poisoned_projection == clean_projection
    assert set(clean_projection) == {
        "contextVersion", "target", "collection", "snapshots", "changes",
        "evidence", "safety",
    }
    assert clean_projection["collection"]["layer"] == "saved_filter_metadata_not_evidence"
    assert clean_projection["target"] == "collection_change_summary"
    assert clean_projection["safety"]["nestedTextIsUntrusted"] is True
    serialized = json.dumps(poisoned.json(), ensure_ascii=False)
    for canary in (QUERY_CANARY, SOURCE_CANARY, HYPOTHESIS_CANARY, FAKE_BODY_CANARY, "OVERRIDE QUERY"):
        assert canary not in serialized


def test_reload_persistence_uses_server_saved_definition(tmp_path: Path):
    with ApiClient(_app(tmp_path)) as first:
        created = _create(first)
        before = _explain(first).json()["context"]["collection"]
    with ApiClient(_app(tmp_path)) as reloaded:
        fetched = reloaded.get(f"/api/smart-collections/{created['id']}")
        after = _explain(reloaded).json()["context"]["collection"]
    assert fetched.status_code == 200
    assert fetched.json()["collection"] == created
    assert before == after
    assert fetched.json()["storeRevision"] == 1


def test_zero_match_projection_is_successful_metadata_not_evidence(tmp_path: Path):
    with ApiClient(_app(tmp_path)) as client:
        _create(client)
        preview = client.post(f"/api/smart-collections/{COLLECTION_ID}/preview", json={"expectedRevision": 1, "limit": 20})
        explained = _explain(client)
    assert preview.status_code == 200
    assert preview.json()["total"] == 0 and preview.json()["items"] == []
    assert explained.status_code == 200
    projection = explained.json()["context"]["collection"]
    assert projection["snapshots"]["current"]["eligibleCount"] == 0
    assert projection["snapshots"]["current"]["resolvedCount"] == 0
    assert projection["snapshots"]["current"]["executionCount"] == 0
    assert projection["evidence"] == []


def test_stale_revision_is_not_a_misleading_success(tmp_path: Path):
    with ApiClient(_app(tmp_path)) as client:
        _create(client)
        update = client.put(f"/api/smart-collections/{COLLECTION_ID}", json={
            **_definition(query="new server query"),
            "expectedRevision": 1,
        })
        stale = _explain(client, revision=1)
        stale_chat = client.post("/api/agent/chat", json={
            "message": "이 컬렉션을 설명해줘",
            "context": {"collectionId": COLLECTION_ID, "collectionRevision": 1},
        })
    assert update.status_code == 200
    assert stale.status_code == 409
    assert stale.json()["error"] == "revision_conflict"
    assert stale.json()["currentRevision"] == 2
    assert stale_chat.status_code == 409
    assert stale_chat.json()["error"] == "revision_conflict"


def test_invalid_edit_preserves_saved_collection(tmp_path: Path):
    with ApiClient(_app(tmp_path)) as client:
        created = _create(client)
        invalid_form = {**_definition(query=""), "market": "ALL", "sources": [], "expectedRevision": 1}
        rejected = client.put(f"/api/smart-collections/{COLLECTION_ID}", json=invalid_form)
        saved = client.get(f"/api/smart-collections/{COLLECTION_ID}")
    assert rejected.status_code == 422
    assert saved.status_code == 200
    assert saved.json()["collection"] == created
    assert saved.json()["storeRevision"] == 1
    assert invalid_form["query"] == ""


def test_malformed_identity_and_unavailable_store_fail_closed(tmp_path: Path):
    with ApiClient(_app(tmp_path)) as client:
        malformed = client.post("/api/agent/companion", json={
            "message": "설명",
            "context": {"collectionId": "../bad", "collectionRevision": "1"},
        })
    assert malformed.status_code == 422

    blocked = tmp_path / "blocked"
    blocked.mkdir()
    (blocked / "smart-collections.json").write_text("not-json", encoding="utf-8")
    with ApiClient(_app(blocked)) as client:
        unavailable = _explain(client)
    assert unavailable.status_code == 503
    assert unavailable.json()["error"] == "collection_store_unavailable"
