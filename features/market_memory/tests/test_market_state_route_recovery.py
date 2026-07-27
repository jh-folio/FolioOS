from __future__ import annotations

from fastapi import FastAPI

from features.market_memory.attempt_store import AttemptStatus, AttemptStore
from features.market_memory.http_service import MarketStateHttpRuntime, MarketStateHttpService, MarketStateStorage
from features.market_memory.manual_snapshot import ManualSnapshotBoundary
from features.market_memory.routes import MarketStateBoundary
from features.market_memory.tests.live_http import LiveHttpClient
from features.market_memory.tests.market_state_http_fixtures import NOW, CrashHook, RecordingBackend


def _client(tmp_path, hook: CrashHook) -> tuple[LiveHttpClient, MarketStateStorage]:
    storage = MarketStateStorage.from_data_dir(tmp_path)
    runtime = MarketStateHttpRuntime(
        storage=storage,
        clock=lambda: NOW,
        backend=RecordingBackend(storage.marketDbPath),
        failureHook=hook,
    )
    app = FastAPI()
    app.include_router(MarketStateBoundary(MarketStateHttpService(runtime)).router())
    return LiveHttpClient(app), storage


def test_restart_before_snapshot_commit_terminalizes_running_attempt(tmp_path) -> None:
    # Given a crash after Attempt start / When a new app serves a read / Then recovery marks interrupted.
    client, storage = _client(tmp_path, CrashHook(ManualSnapshotBoundary.AFTER_ATTEMPT_START))
    with client:
        crashed = client.post("/api/memory/state-snapshot", json={"scope": "US"})
    running = AttemptStore(storage.attemptPath).load().attempts[0]
    restarted, _ = _client(tmp_path, CrashHook())
    with restarted:
        current = restarted.get("/api/memory/state-snapshot", params={"scope": "US"})
    recovered = AttemptStore(storage.attemptPath).get(running.id)

    assert crashed.status_code == 500
    assert current.status_code == 200
    assert (recovered.status, recovered.errorCode) == (AttemptStatus.FAILED, "interrupted")
    assert current.json()["marketStateRef"]["status"] == "empty"


def test_restart_after_snapshot_commit_recovers_receipt_free_success(tmp_path) -> None:
    # Given a crash after SQLite snapshot commit / When a new app serves a read / Then the manual Attempt becomes success.
    client, storage = _client(tmp_path, CrashHook(ManualSnapshotBoundary.AFTER_SNAPSHOT_SAVE))
    with client:
        crashed = client.post("/api/memory/state-snapshot", json={"scope": "KR"})
    running = AttemptStore(storage.attemptPath).load().attempts[0]
    restarted, _ = _client(tmp_path, CrashHook())
    with restarted:
        current = restarted.get("/api/memory/state-snapshot", params={"scope": "KR"})
    recovered = AttemptStore(storage.attemptPath).get(running.id)

    assert crashed.status_code == 500
    assert (recovered.status, recovered.snapshotId) == (AttemptStatus.SUCCESS, "mss_kr")
    assert current.json()["snapshot"]["updateAttemptRef"]["id"] == running.id
    assert current.json()["marketStateRef"]["freshnessReason"] == "within_window"
