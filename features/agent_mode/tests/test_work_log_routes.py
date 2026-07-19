from __future__ import annotations

import json
import socket
import threading
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

import pytest
import uvicorn

import app
from app import fastapi_app
from features.agent_mode.work_log_schema import WORK_LOG_ENTRY_KEYS
from features.common import jobs
from features.common.shared_jobs_projection import new_shared_job
from features.common.shared_jobs_schema import JobStatus


NOW = datetime(2026, 7, 19, 0, 0, tzinfo=UTC)


@dataclass(frozen=True, slots=True)
class HttpResponse:
    status_code: int
    payload: dict
    text: str

    def json(self) -> dict:
        return self.payload


class LiveClient:
    def __init__(self, base_url: str) -> None:
        self.base_url = base_url

    def _request(self, path: str, method: str, payload: dict | None) -> HttpResponse:
        data = json.dumps(payload).encode() if payload is not None else None
        request = urllib.request.Request(
            self.base_url + path,
            data=data,
            headers={"Content-Type": "application/json"},
            method=method,
        )
        try:
            with urllib.request.urlopen(request, timeout=5) as response:
                raw = response.read().decode()
                return HttpResponse(response.status, json.loads(raw), raw)
        except urllib.error.HTTPError as error:
            raw = error.read().decode()
            return HttpResponse(error.code, json.loads(raw), raw)

    def get(self, path: str) -> HttpResponse:
        return self._request(path, "GET", None)

    def post(self, path: str, payload: dict) -> HttpResponse:
        return self._request(path, "POST", payload)

    def delete(self, path: str, payload: dict) -> HttpResponse:
        return self._request(path, "DELETE", payload)


@pytest.fixture(scope="module")
def client() -> LiveClient:
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        port = listener.getsockname()[1]
    server = uvicorn.Server(
        uvicorn.Config(
            fastapi_app,
            host="127.0.0.1",
            port=port,
            log_level="warning",
            lifespan="off",
        )
    )
    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()
    deadline = time.monotonic() + 5
    live = LiveClient(f"http://127.0.0.1:{port}")
    while time.monotonic() < deadline:
        try:
            live.get("/openapi.json")
            break
        except urllib.error.URLError:
            time.sleep(0.02)
    else:
        pytest.fail("HTTP server did not become ready")
    yield live
    server.should_exit = True
    thread.join(timeout=5)
    assert not thread.is_alive()


def _queued(task_type: str = "companion"):
    return new_shared_job(
        kind="agent_bridge",
        task_type=task_type,
        generation_mode="llm_cli",
        adapter="codex",
        requested_mode="cli",
        mode="answer" if task_type == "companion" else "generate",
        attempted_engine="cli",
        clock=lambda: NOW,
    )


def _isolated_jobs(monkeypatch, tmp_path: Path):
    monkeypatch.setattr(jobs, "JOBS_PATH", tmp_path / "jobs.json")
    jobs._LIFECYCLES.clear()
    return jobs._store()


def test_jobs_and_work_log_http_are_safe_v2_projections(
    client: LiveClient,
    monkeypatch,
    tmp_path: Path,
) -> None:
    # Given: one terminal companion job with distinct private and public canaries.
    store = _isolated_jobs(monkeypatch, tmp_path)
    job = _queued()
    store.add(job)
    store.transition(job.id, JobStatus.RUNNING)
    lifecycle = jobs._lifecycle()
    lifecycle.set_private(job.id, {"context": "PRIVATE_HTTP_CANARY"})
    lifecycle.terminalize(
        store,
        job.id,
        JobStatus.DONE,
        result={"proposalId": None},
        live_detail={
            "noticeCode": None,
            "optionCodes": [],
            "reply": "SAFE_HTTP_REPLY",
            "proposalId": None,
        },
    )
    # When: the real application jobs and derived Work Log routes are read.
    listing = client.get("/api/jobs")
    detail = client.get(f"/api/jobs/{job.id}")
    work_log = client.get("/api/agent/work-log")

    # Then: detail alone has safe transient output and no HTTP surface leaks private state.
    assert listing.status_code == 200
    assert detail.status_code == 200
    assert work_log.status_code == 200
    assert "SAFE_HTTP_REPLY" not in listing.text
    assert detail.json()["result"]["reply"] == "SAFE_HTTP_REPLY"
    assert "PRIVATE_HTTP_CANARY" not in listing.text + detail.text + work_log.text
    assert set(work_log.json()["entries"][0]) == WORK_LOG_ENTRY_KEYS


def test_work_log_http_enforces_strict_queries_bodies_and_token_replay(
    client: LiveClient,
    monkeypatch,
    tmp_path: Path,
) -> None:
    # Given: one visible companion job in an isolated durable store.
    store = _isolated_jobs(monkeypatch, tmp_path)
    store.add(_queued())
    # When / Then: unknown or out-of-range input is rejected by the HTTP boundary.
    assert client.get("/api/agent/work-log?unknown=1").status_code == 422
    assert client.get("/api/agent/work-log?limit=0").status_code == 422
    assert client.post("/api/agent/work-log/clear-preview", {"scope": "all", "extra": True}).status_code == 422
    assert client.post("/api/agent/work-log/migration-preview", {"extra": True}).status_code == 422

    # When: a valid clear preview is consumed and replayed.
    preview = client.post("/api/agent/work-log/clear-preview", {"scope": "all"})
    cleared = client.delete(
        "/api/agent/work-log",
        {"scope": "all", "previewToken": preview.json()["previewToken"]},
    )
    replay = client.delete(
        "/api/agent/work-log",
        {"scope": "all", "previewToken": preview.json()["previewToken"]},
    )

    # Then: the first request hides the exact view and replay is a safe 409.
    assert preview.status_code == 200
    assert cleared.status_code == 200
    assert cleared.json()["hiddenCount"] == 1
    assert replay.status_code == 409
    assert replay.json() == {"detail": {"code": "preview_token_replayed"}}


def test_general_and_agent_alias_cancel_have_identical_outcomes(
    client: LiveClient,
    monkeypatch,
    tmp_path: Path,
) -> None:
    # Given: two equivalent running jobs plus a missing id.
    store = _isolated_jobs(monkeypatch, tmp_path)
    general_job = _queued()
    alias_job = _queued()
    store.add(general_job)
    store.add(alias_job)
    store.transition(general_job.id, JobStatus.RUNNING)
    store.transition(alias_job.id, JobStatus.RUNNING)
    # When: both public cancel paths receive the same strict empty body.
    general = client.post(f"/api/jobs/{general_job.id}/cancel", {})
    alias = client.post(f"/api/agent-bridge/jobs/{alias_job.id}/cancel", {})
    missing_general = client.post("/api/jobs/job_00000000-0000-0000-0000-000000000000/cancel", {})
    missing_alias = client.post(
        "/api/agent-bridge/jobs/job_00000000-0000-0000-0000-000000000000/cancel",
        {},
    )

    # Then: status and response shape agree for success and not-found outcomes.
    assert general.status_code == alias.status_code == 200
    assert set(general.json()) == set(alias.json()) == {"cancelled", "job"}
    assert missing_general.status_code == missing_alias.status_code == 404
    assert missing_general.json() == missing_alias.json()
    assert client.post(f"/api/jobs/{general_job.id}/cancel", {"extra": True}).status_code == 422


def test_work_log_migration_preview_and_confirm_http(
    client: LiveClient,
    monkeypatch,
    tmp_path: Path,
) -> None:
    # Given: one valid legacy job and no v2 migration target.
    _isolated_jobs(monkeypatch, tmp_path)
    legacy = {
        "legacy": {
            "id": "legacy",
            "kind": "index",
            "status": "done",
            "createdAt": "2026-07-19T00:00:00Z",
            "updatedAt": "2026-07-19T00:00:00Z",
            "finishedAt": "2026-07-19T00:00:00Z",
            "result": {
                "count": 1,
                "generatedAt": "2026-07-19T00:00:00Z",
                "incremental": True,
                "sqlite": "research-index.sqlite3",
            },
        }
    }
    (tmp_path / "jobs.json").write_text(json.dumps(legacy), encoding="utf-8")

    # When: migration is previewed and confirmed through the real application.
    preview = client.post("/api/agent/work-log/migration-preview", {})
    confirmed = client.post(
        "/api/agent/work-log/migration-confirm",
        {
            "previewToken": preview.json()["previewToken"],
            "action": "migrate_keep_original",
        },
    )

    # Then: both strict route contracts succeed and the original remains byte-addressable.
    assert preview.status_code == 200
    assert preview.json()["legacyJobs"] == 1
    assert confirmed.status_code == 200
    assert confirmed.json()["migratedJobs"] == 1
    assert confirmed.json()["keptOriginal"] is True
    assert (tmp_path / "jobs.json").is_file()


def test_direct_topic_report_http_returns_accepted_shared_job(
    client: LiveClient,
    monkeypatch,
) -> None:
    captured: dict = {}

    def fake_submit_job(kind, title, function, params, *, pass_job_id=False):
        captured.update(
            kind=kind,
            title=title,
            function=function,
            params=params,
            pass_job_id=pass_job_id,
        )
        return {
            "id": "job_00000000-0000-0000-0000-000000000001",
            "kind": kind,
            "taskType": kind,
            "status": "queued",
        }

    monkeypatch.setattr(app, "request_generation_mode", lambda _body: "rules")
    monkeypatch.setattr(app, "submit_job", fake_submit_job)

    response = client.post(
        "/api/topic-reports",
        {"topicKey": "weekly_market", "customLabel": "Direct topic"},
    )

    assert response.status_code == 202
    assert response.json()["taskType"] == "topic_report"
    assert captured["kind"] == "topic_report"
    assert captured["function"] is app.run_topic_report_job
    assert captured["pass_job_id"] is True


def test_jobs_and_work_log_fail_closed_on_corrupt_job_store(
    client: LiveClient,
    monkeypatch,
    tmp_path: Path,
) -> None:
    # Given: a corrupt v2 jobs store with no valid backup.
    _isolated_jobs(monkeypatch, tmp_path)
    (tmp_path / "jobs-v2.json").write_text("{broken", encoding="utf-8")
    # When: jobs and Work Log are read through their real HTTP boundaries.
    jobs_response = client.get("/api/jobs")
    work_log_response = client.get("/api/agent/work-log")

    # Then: both fail closed with the stable safe error code.
    assert jobs_response.status_code == 503
    assert jobs_response.json() == {"detail": {"code": "jobs_store_unavailable"}}
    assert work_log_response.status_code == 503
    assert work_log_response.json() == {"detail": {"code": "jobs_store_unavailable"}}


def test_jobs_and_work_log_fail_closed_until_private_cleanup_retry_succeeds(
    client: LiveClient,
    monkeypatch,
    tmp_path: Path,
) -> None:
    store = _isolated_jobs(monkeypatch, tmp_path)
    job = _queued()
    store.add(job)
    store.transition(job.id, JobStatus.RUNNING)
    lifecycle = jobs.private_lifecycle()
    lifecycle.write_pack(job.id, "pack", {"context": "PRIVATE_RETRY_CANARY"})
    cleanup_owner = lifecycle.cleanup_owner
    monkeypatch.setattr(lifecycle, "cleanup_owner", lambda _job_id: False)

    with pytest.raises(jobs.PrivateCleanupError):
        lifecycle.terminalize(store, job.id, JobStatus.FAILED, error_code="internal_error")

    assert store.get(job.id).errorCode is jobs.ErrorCode.PRIVATE_CLEANUP_FAILED
    assert client.get("/api/jobs").status_code == 503
    assert client.get("/api/agent/work-log").status_code == 503

    monkeypatch.setattr(lifecycle, "cleanup_owner", cleanup_owner)
    lifecycle.terminalize(store, job.id, JobStatus.FAILED, error_code="internal_error")

    assert client.get("/api/jobs").status_code == 200
    assert client.get("/api/agent/work-log").status_code == 200
    assert not (tmp_path / "job-context" / job.id).exists()
