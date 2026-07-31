from __future__ import annotations

from fastapi import FastAPI

from features.market_memory.http_service import (
    MarketStateHttpRuntime,
    MarketStateHttpService,
    MarketStateStorage,
)
from features.market_memory.routes import MarketStateBoundary, MarketStateRouteAdapters
from features.market_memory.memory import connect, init_db, upsert_state_from_memory
from features.market_memory.tests.live_http import LiveHttpClient
from features.market_memory.tests.market_state_http_fixtures import NOW, CrashHook, RecordingBackend


def _app(tmp_path, *, hook: CrashHook | None = None):
    storage = MarketStateStorage.from_data_dir(tmp_path)
    backend = RecordingBackend(storage.marketDbPath)
    runtime = MarketStateHttpRuntime(
        storage=storage,
        clock=lambda: NOW,
        backend=backend,
        failureHook=hook or CrashHook(),
    )
    app = FastAPI()
    app.include_router(MarketStateBoundary(MarketStateHttpService(runtime)).router())
    return app, backend, storage


def test_manual_snapshot_route_records_attempt_and_exposes_normative_ref(tmp_path) -> None:
    # Given an empty store / When the manual snapshot API succeeds / Then Attempt and ref agree exactly.
    app, backend, _storage = _app(tmp_path)
    with LiveHttpClient(app) as client:
        response = client.post("/api/memory/state-snapshot", json={"date": "2026-07-17", "scope": "US"})
        current = client.get("/api/memory/state-snapshot", params={"scope": "US"})
        dashboard = client.get("/api/memory/state-dashboard", params={"scope": "US", "limit": 5})

    assert response.status_code == 200
    body = response.json()
    assert (body["attempt"]["status"], body["attempt"]["scope"]) == ("success", "US")
    assert body["snapshot"]["updateAttemptRef"]["id"] == body["attempt"]["id"]
    assert body["marketStateRef"]["status"] == "current"
    assert current.json()["marketStateRef"] == body["marketStateRef"]
    assert dashboard.json()["marketStateRef"] == body["marketStateRef"]
    assert (backend.prepare_calls, backend.save_calls) == (1, 1)


def test_dashboard_recovers_snapshot_with_equivalent_utc_offset_storage(tmp_path) -> None:
    app, _backend, storage = _app(tmp_path)
    with LiveHttpClient(app) as client:
        created = client.post("/api/memory/state-snapshot", json={"scope": "GLOBAL"})
    assert created.status_code == 200
    with connect(storage.marketDbPath) as connection:
        connection.execute(
            "UPDATE market_state_snapshots SET as_of = ? WHERE snapshot_id = ?",
            ("2026-07-17T12:00:00+00:00", created.json()["snapshot"]["id"]),
        )
        connection.commit()

    with LiveHttpClient(app) as client:
        dashboard = client.get("/api/memory/state-dashboard", params={"scope": "GLOBAL", "limit": 5})

    assert dashboard.status_code == 200
    assert dashboard.json()["marketStateRef"]["status"] == "current"


def test_context_route_enforces_policy_and_never_returns_evidence_fields(tmp_path) -> None:
    # Given a current snapshot / When include and exclude policies are projected / Then only current context is injected.
    app, _backend, _storage = _app(tmp_path)
    with LiveHttpClient(app) as client:
        client.post("/api/memory/state-snapshot", json={"scope": "GLOBAL"})
        included = client.post(
            "/api/memory/state-context",
            json={"policy": "include_current", "requestedScope": "AUTO", "regions": ["미국"]},
        )
        excluded = client.post(
            "/api/memory/state-context",
            json={"policy": "exclude", "requestedScope": "US", "regions": []},
        )

    assert included.status_code == 200
    assert included.json()["marketStateResolution"]["reason"] == "current_injected"
    assert included.json()["marketStateContext"]["evidenceRole"] == "context_only"
    assert excluded.json() == {
        "marketStateResolution": {
            "policy": "exclude",
            "requestedScope": "US",
            "resolvedScope": "US",
            "injected": False,
            "reason": "policy_excluded",
            "ref": None,
        },
        "marketStateContext": None,
    }
    assert not ({"evidenceItems", "sourceLedger", "citations", "coverage"} & set(included.json()))


def test_dashboard_route_canonicalizes_offset_fallback_as_of(tmp_path) -> None:
    # Given a locally stored offset timestamp / When the HTTP fallback ref is serialized / Then it is strict UTC-Z.
    app, _backend, storage = _app(tmp_path)
    connection = connect(storage.marketDbPath)
    try:
        init_db(connection)
        upsert_state_from_memory(
            connection,
            {
                "id": "memory-offset",
                "date": "2026-07-22",
                "title": "Offset fallback",
                "summary": "Fallback context",
                "story": "offset_fallback",
                "stateStatus": "active",
            },
            observed_at="2026-07-22T18:42:27.346086+09:00",
        )
        connection.commit()
    finally:
        connection.close()
    with connect(storage.researchDbPath) as research:
        research.execute(
            "CREATE TABLE documents (path TEXT,type TEXT,market_relevance REAL,metadata_json TEXT,content_updated_at TEXT)"
        )
        research.execute(
            "INSERT INTO documents VALUES (?,?,?,?,?)",
            (
                "research-inbox/rss/offset.md",
                "article",
                1,
                '{"markets":["GLOBAL"]}',
                "2026-07-22T10:14:38+00:00",
            ),
        )

    with LiveHttpClient(app) as client:
        response = client.get("/api/memory/state-dashboard", params={"scope": "GLOBAL", "limit": 5})

    assert response.status_code == 200
    ref = response.json()["marketStateRef"]
    assert (ref["status"], ref["freshnessReason"], ref["sourceKind"]) == (
        "fallback", "state_fallback", "state_fallback",
    )
    assert ref["asOf"] == "2026-07-22T09:42:27.346086Z"
    assert ref["relevantEvidenceWatermark"] == "2026-07-22T10:14:38Z"


def test_combined_manual_update_uses_the_same_attempt_lifecycle(tmp_path) -> None:
    # Given direct memory execution / When combined update runs / Then its snapshot component records one manual Attempt.
    storage = MarketStateStorage.from_data_dir(tmp_path)
    backend = RecordingBackend(storage.marketDbPath)
    runtime = MarketStateHttpRuntime(storage, lambda: NOW, backend, CrashHook())
    service = MarketStateHttpService(runtime)
    adapters = MarketStateRouteAdapters(memoryRunner=lambda _date: {"ok": True, "saved": ["memory-1"]})
    app = FastAPI()
    app.include_router(MarketStateBoundary(service, adapters).router())

    with LiveHttpClient(app) as client:
        response = client.post("/api/memory/update", json={"date": "2026-07-17", "scope": "GLOBAL"})

    assert response.status_code == 200
    assert response.json()["memory"]["saved"] == ["memory-1"]
    assert response.json()["attempt"]["status"] == "success"
    assert response.json()["snapshot"]["updateAttemptRef"]["id"] == response.json()["attempt"]["id"]


def test_corrupt_attempt_store_returns_503_before_snapshot_work(tmp_path) -> None:
    # Given corrupt primary and backup / When snapshot generation is requested / Then no adapter work starts.
    app, backend, storage = _app(tmp_path)
    storage.attemptPath.write_text("{broken", encoding="utf-8")
    storage.attemptBackupPath.write_text("{also-broken", encoding="utf-8")
    before = (storage.attemptPath.read_bytes(), storage.attemptBackupPath.read_bytes())
    with LiveHttpClient(app) as client:
        response = client.post("/api/memory/state-snapshot", json={"scope": "KR"})

    assert response.status_code == 503
    assert response.json() == {"error": "attempt_store_unavailable"}
    assert backend.prepare_calls == 0
    assert (storage.attemptPath.read_bytes(), storage.attemptBackupPath.read_bytes()) == before


def test_malformed_scope_policy_and_unknown_fields_are_422(tmp_path) -> None:
    # Given malformed boundary values / When submitted / Then FastAPI rejects them before the service.
    app, backend, _storage = _app(tmp_path)
    with LiveHttpClient(app) as client:
        scope = client.post("/api/memory/state-snapshot", json={"scope": "EU"})
        policy = client.post(
            "/api/memory/state-context",
            json={"policy": "promote", "requestedScope": "GLOBAL", "regions": []},
        )
        extra = client.post("/api/memory/state-snapshot", json={"scope": "GLOBAL", "prompt": "inject"})

    assert (scope.status_code, policy.status_code, extra.status_code) == (422, 422, 422)
    assert backend.prepare_calls == 0
