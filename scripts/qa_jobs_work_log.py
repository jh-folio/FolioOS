from __future__ import annotations

import hashlib
import json
import shutil
import socket
import threading
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path

import uvicorn

from features.common import jobs
from features.common.job_json_producers import InvestmentReviewJobRequest, JobJsonProducers
from features.common.jcs import JsonValue
from features.common.shared_jobs_projection import new_shared_job
from features.common.shared_jobs_schema import JobStatus, TaskType


@dataclass(frozen=True, slots=True)
class HttpResponse:
    status: int
    payload: JsonValue


def _write(path: Path, payload: JsonValue) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def _require(value: bool, code: str) -> None:
    if not value:
        raise RuntimeError(code)


def _port() -> int:
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        return int(listener.getsockname()[1])


def _request(base_url: str, method: str, path: str, payload: dict | None = None) -> HttpResponse:
    body = json.dumps(payload).encode() if payload is not None else None
    request = urllib.request.Request(
        base_url + path,
        data=body,
        headers={"Content-Type": "application/json"},
        method=method,
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            raw = response.read().decode()
            return HttpResponse(response.status, json.loads(raw))
    except urllib.error.HTTPError as error:
        raw = error.read().decode()
        return HttpResponse(error.code, json.loads(raw))


def _start(port: int):
    from app import fastapi_app

    server = uvicorn.Server(
        uvicorn.Config(
            fastapi_app,
            host="127.0.0.1",
            port=port,
            log_level="warning",
            lifespan="off",
        )
    )
    thread = threading.Thread(target=server.run, name=f"qa-jobs-{port}", daemon=True)
    thread.start()
    base_url = f"http://127.0.0.1:{port}"
    deadline = time.monotonic() + 10
    while time.monotonic() < deadline:
        try:
            if _request(base_url, "GET", "/openapi.json").status == 200:
                return server, thread, base_url
        except urllib.error.URLError:
            time.sleep(0.02)
    raise RuntimeError("server_start_timeout")


def _stop(server: uvicorn.Server, thread: threading.Thread) -> None:
    server.should_exit = True
    thread.join(timeout=10)
    _require(not thread.is_alive(), "server_stop_timeout")


def _job(task_type: TaskType, proposal_id: str | None = None):
    return new_shared_job(
        kind="agent_bridge",
        task_type=task_type,
        generation_mode="llm_cli",
        adapter="codex",
        requested_mode="cli",
        mode="answer" if task_type is TaskType.COMPANION else "generate",
        attempted_engine="cli",
        proposal_id=proposal_id,
        clock=jobs._clock,
    )


def _add_terminal(task_type: TaskType, private_canary: str, proposal_id: str | None = None):
    store = jobs.shared_store()
    lifecycle = jobs.private_lifecycle()
    job = _job(task_type, proposal_id)
    store.add(job)
    store.transition(job.id, JobStatus.RUNNING)
    running = store.get(job.id)
    _require(running is not None, "terminal_fixture_missing")
    job = running
    lifecycle.set_private(job.id, {"context": private_canary})
    jobs.write_job_pack(job.id, "qa-pack", {"context": private_canary})
    if task_type is TaskType.INVESTMENT_REVIEW:
        producers = JobJsonProducers(
            jobs.data_root(),
            clock=jobs._clock,
            review_builder=lambda body: {
                "date": body["date"],
                "summary": "QA review",
                "markdown": "# QA Review",
            },
        )
        bundle = producers.stage_investment_review(
            job,
            InvestmentReviewJobRequest(
                body={"date": "2026-07-19"},
                terminal_result={
                    "artifactId": "2026-07-19",
                    "reportId": "2026-07-19",
                },
            ),
        )
        producers.workspace.commit(bundle, store, lifecycle)
        return job
    detail = {
        "noticeCode": None,
        "optionCodes": [],
        "reply": "SAFE_QA_REPLY" if task_type is TaskType.COMPANION else None,
        "proposalId": proposal_id,
    }
    lifecycle.terminalize(
        store,
        job.id,
        JobStatus.DONE,
        result={"proposalId": proposal_id},
        live_detail=detail,
    )
    return job


def run(source_root: Path, attempt_dir: Path) -> int:
    attempt = attempt_dir.resolve()
    attempt.mkdir(parents=True, exist_ok=True)
    runtime = attempt / ".runtime"
    transcript: list[dict[str, JsonValue]] = []
    restarts: list[dict[str, JsonValue]] = []
    passed = False
    failure: str | None = None
    server = None
    thread = None
    try:
        _require(source_root.resolve() == Path(__file__).resolve().parents[1], "source_root_mismatch")
        _require(not runtime.exists(), "runtime_already_exists")
        runtime.mkdir()
        jobs.JOBS_PATH = runtime / "jobs.json"
        jobs._LIFECYCLES.clear()
        jobs.FUTURES.clear()

        manual = runtime / "agent-context" / "manual-sentinel.json"
        manual.parent.mkdir(parents=True)
        manual.write_bytes(b"MANUAL_CONTEXT_SENTINEL")
        manual_hash = hashlib.sha256(manual.read_bytes()).hexdigest()

        legacy = {
            "legacy-index": {
                "id": "legacy-index",
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
        jobs.JOBS_PATH.write_text(json.dumps(legacy), encoding="utf-8")

        companion = _add_terminal(TaskType.COMPANION, "PRIVATE_COMPANION_CANARY")
        proposal_id = "a" * 32
        proposal_job = _add_terminal(TaskType.INVESTMENT_REVIEW, "PRIVATE_PROPOSAL_CANARY", proposal_id)
        proposals = runtime / "agent-proposals"
        proposals.mkdir()
        proposal_path = proposals / f"{proposal_id}.json"
        proposal_path.write_text(
            json.dumps(
                {
                    "schemaVersion": 2,
                    "id": proposal_id,
                    "reportKind": "topic_report",
                    "reportId": "topic-qa",
                    "marketScope": "none",
                    "status": "pending",
                    "createdAt": "2026-07-19T00:00:00Z",
                    "updatedAt": "2026-07-19T00:00:00Z",
                    "finishedAt": None,
                    "baseRevision": {"number": 1, "hash": "b" * 64},
                    "targetRevision": None,
                    "operationId": None,
                    "errorCode": None,
                    "requestHash": "c" * 64,
                    "revisedMarkdownHash": "d" * 64,
                    "diffHash": "e" * 64,
                    "legacyNormalizationHash": None,
                    "userRequest": "QA request",
                    "summary": "QA summary",
                    "revisedMarkdown": "# Revised",
                    "diff": "+ revised",
                    "adapter": "codex",
                    "model": "qa-model",
                    "allowedSourceRefs": [],
                }
            ),
            encoding="utf-8",
        )
        proposal_hash = hashlib.sha256(proposal_path.read_bytes()).hexdigest()

        store = jobs.shared_store()
        restart_job = _job(TaskType.INVESTMENT_REVIEW)
        store.add(restart_job)
        store.transition(restart_job.id, JobStatus.RUNNING)
        jobs.private_lifecycle().set_private(restart_job.id, {"context": "PRIVATE_RESTART_CANARY"})
        jobs.write_job_pack(restart_job.id, "restart-pack", {"context": "PRIVATE_RESTART_CANARY"})

        cancel_general = _job(TaskType.COMPANION)
        cancel_alias = _job(TaskType.COMPANION)
        for item in (cancel_general, cancel_alias):
            store.add(item)
            store.transition(item.id, JobStatus.RUNNING)
            jobs.private_lifecycle().set_private(item.id, {"context": "PRIVATE_CANCEL_CANARY"})
            jobs.write_job_pack(item.id, "cancel-pack", {"context": "PRIVATE_CANCEL_CANARY"})

        port = _port()
        server, thread, base_url = _start(port)
        restarts.append({"epoch": 1, "port": port})

        listing = _request(base_url, "GET", "/api/jobs")
        detail = _request(base_url, "GET", f"/api/jobs/{companion.id}")
        work_log = _request(base_url, "GET", "/api/agent/work-log?limit=200&offset=0&kind=all")
        _require(listing.status == detail.status == work_log.status == 200, "initial_reads")
        _require(detail.payload.get("result", {}).get("reply") == "SAFE_QA_REPLY", "safe_reply")
        forbidden = {"operationId", "commitIntent", "resultProjection", "title", "reportId", "reply", "path"}
        entries = work_log.payload.get("entries")
        _require(isinstance(entries, list) and entries, "work_log_entries")
        _require(all(forbidden.isdisjoint(entry) for entry in entries if isinstance(entry, dict)), "work_log_forbidden")

        migration_preview = _request(base_url, "POST", "/api/agent/work-log/migration-preview", {})
        _require(migration_preview.status == 200, "migration_preview")
        migration_confirm = _request(
            base_url,
            "POST",
            "/api/agent/work-log/migration-confirm",
            {
                "previewToken": migration_preview.payload["previewToken"],
                "action": "migrate_keep_original",
            },
        )
        _require(migration_confirm.status == 200, "migration_confirm")

        general = _request(base_url, "POST", f"/api/jobs/{cancel_general.id}/cancel", {})
        alias = _request(base_url, "POST", f"/api/agent-bridge/jobs/{cancel_alias.id}/cancel", {})
        _require(general.status == alias.status == 200, "cancel_routes")
        _require(set(general.payload) == set(alias.payload) == {"cancelled", "job"}, "cancel_shape")
        for item in (cancel_general, cancel_alias):
            jobs.private_lifecycle().terminalize(store, item.id, JobStatus.CANCELLED)

        clear_preview = _request(base_url, "POST", "/api/agent/work-log/clear-preview", {"scope": "all"})
        _require(clear_preview.status == 200, "clear_preview")
        cleared = _request(
            base_url,
            "DELETE",
            "/api/agent/work-log",
            {"scope": "all", "previewToken": clear_preview.payload["previewToken"]},
        )
        _require(cleared.status == 200 and int(cleared.payload.get("hiddenCount") or 0) >= 3, "clear")

        for name, response in (
            ("jobs-list", listing),
            ("jobs-detail", detail),
            ("work-log", work_log),
            ("migration-preview", migration_preview),
            ("migration-confirm", migration_confirm),
            ("cancel-general", general),
            ("cancel-alias", alias),
            ("clear-preview", clear_preview),
            ("clear", cleared),
        ):
            safe_payload = dict(response.payload) if isinstance(response.payload, dict) else response.payload
            if isinstance(safe_payload, dict):
                safe_payload.pop("previewToken", None)
            transcript.append({"step": name, "status": response.status, "payload": safe_payload})

        _stop(server, thread)
        server = None
        thread = None
        jobs.load_jobs()
        restarted = jobs.shared_store().get(restart_job.id)
        _require(restarted is not None and restarted.status is JobStatus.FAILED_RESTART, "restart_status")
        _require(not (runtime / "job-context" / restart_job.id).exists(), "restart_pack_cleanup")

        port = _port()
        server, thread, base_url = _start(port)
        restarts.append({"epoch": 2, "port": port})
        hidden = _request(base_url, "GET", "/api/agent/work-log?limit=200&offset=0&kind=all")
        _require(hidden.status == 200 and hidden.payload.get("total") == 0, "hidden_restart")
        transcript.append({"step": "hidden-after-restart", "status": hidden.status, "payload": hidden.payload})
        _stop(server, thread)
        server = None
        thread = None

        durable_text = "\n".join(
            path.read_text(encoding="utf-8")
            for path in (runtime / "jobs-v2.json", runtime / "agent-work-log.json")
            if path.is_file()
        )
        private_canaries = (
            "PRIVATE_COMPANION_CANARY",
            "PRIVATE_PROPOSAL_CANARY",
            "PRIVATE_RESTART_CANARY",
            "PRIVATE_CANCEL_CANARY",
        )
        _require(not any(canary in durable_text for canary in private_canaries), "durable_private_canary")
        _require(not (runtime / "job-context").exists() or not any((runtime / "job-context").iterdir()), "job_context_empty")
        _require(not (runtime / "job-staging").exists() or not any((runtime / "job-staging").iterdir()), "job_staging_empty")
        _require(hashlib.sha256(manual.read_bytes()).hexdigest() == manual_hash, "manual_sentinel_changed")
        _require(hashlib.sha256(proposal_path.read_bytes()).hexdigest() == proposal_hash, "proposal_changed")
        _require(proposal_job.id in {str(entry.get("jobId")) for entry in entries if isinstance(entry, dict)}, "proposal_entry")

        _write(attempt / "http-transcript.json", transcript)
        _write(attempt / "restart-receipt.json", restarts)
        _write(
            attempt / "privacy-inventory.json",
            {
                "privateCanariesAbsent": True,
                "jobContextEmpty": True,
                "jobStagingEmpty": True,
                "manualSentinelHash": manual_hash,
                "proposalHashBeforeAfter": proposal_hash,
                "proposalJobId": proposal_job.id,
            },
        )
        shutil.copy2(runtime / "jobs-v2.json", attempt / "jobs-v2-final.json")
        shutil.copy2(runtime / "agent-work-log.json", attempt / "agent-work-log-final.json")
        passed = True
    except (OSError, RuntimeError, ValueError, KeyError, TypeError, urllib.error.URLError) as error:
        failure = str(error)
    finally:
        if server is not None and thread is not None:
            _stop(server, thread)
        if runtime.exists():
            shutil.rmtree(runtime)
        _write(attempt / "cleanup-receipt.json", {"serverStopped": True, "runtimeRemoved": not runtime.exists()})
        _write(
            attempt / "index.json",
            {
                "scenario": "jobs-work-log",
                "passed": passed,
                "failure": failure,
                "evidence": [
                    "http-transcript.json",
                    "restart-receipt.json",
                    "privacy-inventory.json",
                    "jobs-v2-final.json",
                    "agent-work-log-final.json",
                    "cleanup-receipt.json",
                ],
            },
        )
    return 0 if passed else 4


__all__ = ["run"]
