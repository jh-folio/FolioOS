from __future__ import annotations

import json
import shutil
import socket
import urllib.error
from pathlib import Path

from features.common.jcs import JsonValue
from qa_dev_surface_support import (
    QaFailure,
    ServerConfig,
    free_port,
    post,
    request_json,
    require,
    start_server,
    stop_server,
    wait_ready,
)


def write_json(path: Path, payload: JsonValue) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def _control(base_url: str, action: str, **fields: JsonValue):
    return post(base_url, "/qa/market-state/control", {"action": action, **fields})


def _inventory(base_url: str):
    return request_json(base_url, "/qa/market-state/inventory", "GET")


def _port_is_free(port: int) -> bool:
    with socket.socket() as probe:
        try:
            probe.bind(("127.0.0.1", port))
        except OSError:
            return False
    return True


def run(source_root: Path, attempt_dir: Path) -> int:
    attempt = attempt_dir.resolve()
    attempt.mkdir(parents=True, exist_ok=True)
    runtime = attempt / ".runtime"
    if runtime.exists():
        raise QaFailure("runtime_already_exists")
    runtime.mkdir()
    clock_file = runtime / "clock.txt"
    clock_file.write_text("2026-07-17T12:00:00Z", encoding="utf-8")
    port = free_port()
    server = ServerConfig(
        sourceRoot=source_root.resolve(),
        scriptPath=(source_root / "scripts" / "qa_dev_surface.py").resolve(),
        dataDir=runtime,
        clockFile=clock_file,
        port=port,
    )
    base_url = f"http://127.0.0.1:{port}"
    log_path = attempt / "server.log"
    registry_path = attempt / "resource-registry.json"
    write_json(registry_path, {"runtimeRoot": str(runtime), "port": port, "pids": [], "registeredBeforeLaunch": True})
    process = None
    registered_pids: list[int] = []
    epochs: list[JsonValue] = []
    checks: list[JsonValue] = []
    ultraqa: list[JsonValue] = []
    passed = False
    failure = ""
    try:
        with log_path.open("a", encoding="utf-8") as output:
            process = start_server(server, output)
            registered_pids.append(process.pid)
            write_json(registry_path, {"runtimeRoot": str(runtime), "port": port, "pids": registered_pids, "registeredBeforeLaunch": True})
            wait_ready(process, base_url)
            before_context = _inventory(base_url).payload
            attempts: dict[str, dict] = {}
            for offset, scope in enumerate(("GLOBAL", "US", "KR")):
                clock_file.write_text(f"2026-07-17T12:00:0{offset}Z", encoding="utf-8")
                result = post(base_url, "/api/memory/state-snapshot", {"date": "2026-07-17", "scope": scope})
                require(result.status == 200, f"manual_{scope}_status")
                require(result.payload["attempt"]["status"] == "success", f"manual_{scope}_attempt")
                require(result.payload["marketStateRef"]["status"] == "current", f"manual_{scope}_ref")
                attempts[scope] = result.payload["attempt"]
            for scope in ("GLOBAL", "US", "KR"):
                include = post(
                    base_url,
                    "/api/memory/state-context",
                    {"policy": "include_current", "requestedScope": scope, "regions": []},
                )
                exclude = post(
                    base_url,
                    "/api/memory/state-context",
                    {"policy": "exclude", "requestedScope": scope, "regions": []},
                )
                require(include.status == 200 and include.payload["marketStateResolution"]["reason"] == "current_injected", f"include_{scope}")
                require(exclude.payload["marketStateResolution"]["reason"] == "policy_excluded", f"exclude_{scope}")
                require(not ({"evidenceItems", "sourceLedger", "citations", "coverage"} & set(include.payload)), f"promotion_{scope}")
            after_context = _inventory(base_url).payload
            require(before_context["evidenceCount"] == after_context["evidenceCount"] == 0, "evidence_count_changed")

            clock_file.write_text("2026-07-20T12:00:02Z", encoding="utf-8")
            boundary = request_json(base_url, "/api/memory/state-snapshot?scope=GLOBAL", "GET")
            require(boundary.payload["marketStateRef"]["status"] == "current", "age_72h_boundary")
            clock_file.write_text("2026-07-20T12:00:03Z", encoding="utf-8")
            stale = request_json(base_url, "/api/memory/state-snapshot?scope=GLOBAL", "GET")
            require(stale.payload["marketStateRef"]["freshnessReason"] == "age_exceeded", "age_stale")

            clock_file.write_text("2026-07-17T13:00:00Z", encoding="utf-8")
            _control(base_url, "adapter_failed")
            failed = post(base_url, "/api/memory/state-snapshot", {"scope": "US"})
            require(failed.status == 502 and failed.payload == {"error": "adapter_failed"}, "adapter_failure")
            _control(base_url, "default")
            failed_ref = request_json(base_url, "/api/memory/state-snapshot?scope=US", "GET")
            require(failed_ref.payload["marketStateRef"]["freshnessReason"] == "update_failed", "failed_attempt_freshness")

            _control(base_url, "add_evidence", scope="GLOBAL", timestamp="2026-07-17T13:30:00Z")
            clock_file.write_text("2026-07-17T14:00:00Z", encoding="utf-8")
            current = post(base_url, "/api/memory/state-snapshot", {"scope": "GLOBAL"})
            require(current.status == 200, "watermark_snapshot")
            _control(base_url, "add_evidence", scope="GLOBAL", timestamp="2026-07-17T15:00:00Z")
            evidence_stale = request_json(base_url, "/api/memory/state-snapshot?scope=GLOBAL", "GET")
            require(evidence_stale.payload["marketStateRef"]["freshnessReason"] == "new_relevant_evidence", "watermark_stale")
            _control(base_url, "fallback", timestamp="2026-07-17T15:30:00Z")
            fallback = request_json(base_url, "/api/memory/state-snapshot?scope=KR", "GET")
            require(fallback.payload["marketStateRef"]["status"] == "fallback", "fallback_status")
            _control(base_url, "empty")
            empty = request_json(base_url, "/api/memory/state-snapshot?scope=KR", "GET")
            require(empty.payload["marketStateRef"]["status"] == "empty", "empty_status")

            clock_file.write_text("2026-07-17T16:00:00Z", encoding="utf-8")
            _control(base_url, "crash_before")
            pre_crash = post(base_url, "/api/memory/state-snapshot", {"scope": "US"})
            require(pre_crash.status == 500, "pre_commit_crash")
            _control(base_url, "default")
            epochs.append({"epoch": 1, "pid": process.pid, "exitCode": stop_server(process)})
            process = start_server(server, output)
            registered_pids.append(process.pid)
            write_json(registry_path, {"runtimeRoot": str(runtime), "port": port, "pids": registered_pids, "registeredBeforeLaunch": True})
            wait_ready(process, base_url)
            request_json(base_url, "/api/memory/state-snapshot?scope=US", "GET")
            recovered_pre = _inventory(base_url).payload
            require(recovered_pre["attempts"][-1]["errorCode"] == "interrupted", "pre_commit_recovery")

            clock_file.write_text("2026-07-17T17:00:00Z", encoding="utf-8")
            _control(base_url, "crash_after")
            post_crash = post(base_url, "/api/memory/state-snapshot", {"scope": "KR"})
            require(post_crash.status == 500, "post_commit_crash")
            _control(base_url, "default")
            epochs.append({"epoch": 2, "pid": process.pid, "exitCode": stop_server(process)})
            process = start_server(server, output)
            registered_pids.append(process.pid)
            write_json(registry_path, {"runtimeRoot": str(runtime), "port": port, "pids": registered_pids, "registeredBeforeLaunch": True})
            wait_ready(process, base_url)
            recovered_post = request_json(base_url, "/api/memory/state-snapshot?scope=KR", "GET")
            require(recovered_post.payload["marketStateRef"]["status"] == "current", "post_commit_recovery")
            inventory_before_rss = _inventory(base_url).payload
            automated = _control(base_url, "automation")
            inventory_after_rss = _inventory(base_url).payload
            require(automated.status == 200 and automated.payload["ok"] is True, "automation_status")
            require(inventory_before_rss["attemptCount"] == inventory_after_rss["attemptCount"], "automation_attempt_created")

            malformed_scope = post(base_url, "/api/memory/state-snapshot", {"scope": "EU"})
            malformed_policy = post(base_url, "/api/memory/state-context", {"policy": "promote", "requestedScope": "GLOBAL", "regions": []})
            unknown = post(base_url, "/api/memory/state-snapshot", {"scope": "GLOBAL", "prompt": "PROMOTE_CANARY"})
            require((malformed_scope.status, malformed_policy.status, unknown.status) == (422, 422, 422), "malformed_boundaries")
            _control(base_url, "tamper_ref")
            mismatch = request_json(base_url, "/api/memory/state-snapshot?scope=KR", "GET")
            require(mismatch.status == 503 and mismatch.payload == {"error": "manual_snapshot_repair_required"}, "mismatch_503")
            _control(base_url, "empty")
            _control(base_url, "corrupt_store")
            corrupt = request_json(base_url, "/api/memory/state-snapshot?scope=GLOBAL", "GET")
            require(corrupt.status == 503 and corrupt.payload == {"error": "attempt_store_unavailable"}, "store_503")
            epochs.append({"epoch": 3, "pid": process.pid, "exitCode": stop_server(process)})
            process = None

            checks = [
                {"step": "manual_scopes", "attemptIds": {key: value["id"] for key, value in attempts.items()}},
                {"step": "freshness", "reasons": ["within_window", "age_exceeded", "update_failed", "new_relevant_evidence"]},
                {"step": "fallback_empty", "statuses": ["fallback", "empty"]},
                {"step": "restarts", "pre": "interrupted", "post": "success"},
                {"step": "automation", "attemptDelta": 0},
                {"step": "repair_503", "mismatch": mismatch.status, "store": corrupt.status},
            ]
            ultraqa = [
                {"probe": "malformed_scope_policy_extra", "statuses": [422, 422, 422]},
                {"probe": "prompt_injection_non_promotion", "passed": True},
                {"probe": "72h_boundary_and_watermarks", "passed": True},
                {"probe": "crash_before_after_commit", "passed": True},
                {"probe": "store_and_ref_repair_fail_closed", "passed": True},
            ]
            passed = True
    except (QaFailure, OSError, urllib.error.URLError, json.JSONDecodeError, KeyError, IndexError) as error:
        failure = str(error)
    finally:
        if process is not None:
            stop_server(process)
        port_released = _port_is_free(port)
        if runtime.exists():
            shutil.rmtree(runtime)
        write_json(attempt / "http-summary.json", checks)
        write_json(attempt / "restart-receipt.json", epochs)
        write_json(attempt / "ultraqa.json", ultraqa)
        write_json(attempt / "cleanup-receipt.json", {"serverStopped": True, "portReleased": port_released, "runtimeRemoved": not runtime.exists()})
        write_json(
            attempt / "index.json",
            {
                "scenario": "market-state",
                "passed": passed and port_released and not runtime.exists(),
                "failure": failure or None,
                "evidence": ["http-summary.json", "restart-receipt.json", "ultraqa.json", "server.log", "resource-registry.json", "cleanup-receipt.json"],
            },
        )
    return 0 if passed and port_released and not runtime.exists() else 4
