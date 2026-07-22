#!/usr/bin/env python3
"""Host-side Folio OS 0.2 QA evidence orchestrator.

This file is deliberately not part of the release package.  It only operates
inside a marker-owned attempt directory and never opens the repository's real
``data``, ``config`` or ``research-inbox`` roots.
"""

from __future__ import annotations

import argparse
import ctypes
import datetime as dt
import hashlib
import json
import os
import re
import shutil
import signal
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
import zipfile
from pathlib import Path
from typing import Any


PRE_EXPOSURE = [
    "DR-H1",
    "PLAN-F1",
    "GEN-F1",
    "GEN-F2",
    "RP-H1",
    "AG-H1",
    "WB-H1",
    "WB-F1",
    "WL-H1",
    "COL-H1",
    "COL-F1",
    "MS-H1",
    "CTX-F1",
    "REL-H1",
]
POST_EXPOSURE = ["DOC-H1"]
SCENARIO_SETS = {
    "preExposure": PRE_EXPOSURE,
    "postExposure": POST_EXPOSURE,
    "full": [*PRE_EXPOSURE, *POST_EXPOSURE],
}
RESTART_SCENARIOS = ["DR-H1", "WB-H1", "WL-H1"]
OWNERSHIP_MARKER = ".folio-qa-owned"
SCHEMA_VERSION = 1
REPORT_ID = "2026-07-22:qa-contract:fixture"
INJECTED_CLOCK = "2026-07-22T12:00:00Z"
VIEWPORTS = ("1440", "768", "390")
CAPTURE_FILES = (
    "screenshot.png",
    "screenshot.json",
    "console.json",
    "network.json",
    "dom.json",
    "api-before.json",
    "api-after.json",
    "result.json",
)
VIEWPORT_SCENARIOS = {"DR-H1", "RP-H1", "REL-H1", "DOC-H1"}

EXIT_OK = 0
EXIT_OWNERSHIP = 2
EXIT_HEALTH = 3
EXIT_EVIDENCE = 4
EXIT_PROCESS = 5
EXIT_PROXY = 6

PRIVATE_CANARIES = ("PROMPT_INJECTION_CANARY", "PRIVATE_CONTEXT_CANARY")
HEALTH_KEYS = {"status", "pid", "version", "commit", "workspaceIdentity"}
ISO_MAX_AGE = dt.timedelta(days=7)


class HarnessError(Exception):
    def __init__(self, code: str, message: str, exit_code: int) -> None:
        super().__init__(message)
        self.code = code
        self.exit_code = exit_code


def _fail(code: str, message: str, exit_code: int = EXIT_EVIDENCE) -> None:
    raise HarnessError(code, message, exit_code)


def _utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def _read_json(path: Path, *, code: str = "MALFORMED_MANIFEST") -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        _fail(code, f"Cannot read JSON at {path}: {exc}")
    if not isinstance(value, dict):
        _fail(code, f"Expected a JSON object at {path}")
    return value


def _write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.{uuid.uuid4().hex}.tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(temporary, path)


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _is_relative_to(path: Path, parent: Path) -> bool:
    try:
        path.relative_to(parent)
        return True
    except ValueError:
        return False


def _safe_attempt_dir(path: Path) -> Path:
    resolved = path.resolve()
    forbidden_names = {"data", "config", "research-inbox", ".git"}
    if resolved.parent == resolved or resolved.name.lower() in forbidden_names:
        _fail("UNSAFE_ATTEMPT_ROOT", f"Unsafe attempt directory: {resolved}", EXIT_OWNERSHIP)
    return resolved


def _claim_attempt_dir(attempt_dir: Path) -> tuple[str, Path]:
    attempt_dir = _safe_attempt_dir(attempt_dir)
    marker = attempt_dir / OWNERSHIP_MARKER
    if attempt_dir.exists():
        if marker.is_file():
            owned = _read_json(marker, code="INVALID_OWNERSHIP_MARKER")
            attempt_id = str(owned.get("attemptId", ""))
            if not attempt_id:
                _fail("INVALID_OWNERSHIP_MARKER", "Ownership marker has no attemptId", EXIT_OWNERSHIP)
            return attempt_id, marker
        if any(attempt_dir.iterdir()):
            _fail("UNOWNED_RUN_ROOT", f"Attempt directory is non-empty and unowned: {attempt_dir}", EXIT_OWNERSHIP)
    else:
        attempt_dir.mkdir(parents=True)
    attempt_id = f"qa020-{uuid.uuid4().hex}"
    _write_json(marker, {"attemptId": attempt_id, "state": "prepared", "createdAt": _utc_now()})
    return attempt_id, marker


def _load_owned_manifest(path: Path) -> tuple[dict[str, Any], Path]:
    manifest_path = path.resolve()
    payload = _read_json(manifest_path)
    required = {
        "schemaVersion",
        "attemptId",
        "routeExposure",
        "runRoot",
        "ownershipMarker",
        "artifact",
        "build",
        "workspaceIdentity",
        "port",
        "baseUrl",
        "healthExpected",
        "scenarioSet",
        "scenarioSets",
        "selectedScenarioIds",
        "phases",
        "fixtures",
        "urls",
        "selectors",
        "requiredEvidencePaths",
    }
    missing = sorted(required - set(payload))
    if missing:
        _fail("INCOMPLETE_MANIFEST", f"Manifest is missing: {', '.join(missing)}")
    run_root = Path(str(payload["runRoot"])).resolve()
    marker = Path(str(payload["ownershipMarker"])).resolve()
    if marker != run_root / OWNERSHIP_MARKER or not marker.is_file():
        _fail("UNOWNED_RUN_ROOT", f"Missing ownership marker for {run_root}", EXIT_OWNERSHIP)
    owned = _read_json(marker, code="INVALID_OWNERSHIP_MARKER")
    if owned.get("attemptId") != payload.get("attemptId"):
        _fail("OWNERSHIP_ID_MISMATCH", "Ownership marker attemptId does not match", EXIT_OWNERSHIP)
    if not _is_relative_to(manifest_path, run_root):
        _fail("MANIFEST_OUTSIDE_RUN_ROOT", "Manifest is outside its owned run root", EXIT_OWNERSHIP)
    return payload, manifest_path


def _reserve_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as listener:
        listener.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        listener.bind(("127.0.0.1", 0))
        return int(listener.getsockname()[1])


def _port_open(port: int, timeout: float = 0.2) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as client:
        client.settimeout(timeout)
        return client.connect_ex(("127.0.0.1", port)) == 0


def _safe_extract(artifact: Path, destination: Path) -> Path:
    if not artifact.is_file() or not zipfile.is_zipfile(artifact):
        _fail("INVALID_ARTIFACT", f"Artifact is not a ZIP file: {artifact}")
    destination.mkdir(parents=True, exist_ok=False)
    with zipfile.ZipFile(artifact) as archive:
        for info in archive.infolist():
            member = Path(info.filename.replace("\\", "/"))
            target = (destination / member).resolve()
            if member.is_absolute() or ".." in member.parts or not _is_relative_to(target, destination.resolve()):
                _fail("UNSAFE_ARTIFACT_PATH", f"Unsafe ZIP member: {info.filename}")
        archive.extractall(destination)
    candidates = [path.parent for path in destination.rglob("BUILD.json") if path.is_file()]
    candidates = [path for path in candidates if (path / "VERSION").is_file()]
    if len(candidates) != 1:
        _fail("ARTIFACT_BUILD_ROOT_AMBIGUOUS", f"Expected one BUILD.json/VERSION root, found {len(candidates)}")
    return candidates[0].resolve()


def _read_build(extract_root: Path) -> dict[str, str]:
    build = _read_json(extract_root / "BUILD.json", code="INVALID_BUILD_METADATA")
    if set(build) != {"version", "commit", "builtAt"}:
        _fail("INVALID_BUILD_METADATA", "BUILD.json must contain exactly version, commit, and builtAt")
    version = str(build["version"])
    commit = str(build["commit"])
    if not re.fullmatch(r"\d+\.\d+\.\d+", version) or not re.fullmatch(r"[0-9a-f]{40}", commit):
        _fail("INVALID_BUILD_IDENTITY", "Artifact version or commit is invalid")
    if (extract_root / "VERSION").read_text(encoding="utf-8").strip() != version:
        _fail("BUILD_VERSION_MISMATCH", "BUILD.json version differs from VERSION")
    return {"version": version, "commit": commit, "builtAt": str(build["builtAt"])}


def _workspace_identity(attempt_id: str, artifact_sha256: str, extract_root: Path) -> str:
    material = f"{attempt_id}\0{artifact_sha256}\0{extract_root.resolve()}".encode("utf-8")
    return hashlib.sha256(material).hexdigest()


def _phases(selected: list[str]) -> list[dict[str, str]]:
    phases = [
        {"phaseId": f"{scenario}:pre", "scenario": scenario, "action": "pre_restart", "expectedEpochId": None}
        for scenario in selected
    ]
    restart_number = 1
    for scenario in RESTART_SCENARIOS:
        if scenario in selected:
            restart_number += 1
            phases.append(
                {
                    "phaseId": f"{scenario}:post",
                    "scenario": scenario,
                    "action": "post_restart",
                    "expectedEpochId": None,
                }
            )
    return phases


def _required_evidence_paths(selected: list[str]) -> list[str]:
    paths: list[str] = []
    for scenario in selected:
        if scenario in VIEWPORT_SCENARIOS:
            for viewport in VIEWPORTS:
                paths.extend(f"{scenario}/{viewport}/{name}" for name in CAPTURE_FILES)
        else:
            paths.append(f"{scenario}/result.json")
        if scenario in RESTART_SCENARIOS:
            paths.append(f"{scenario}/post-restart-result.json")
    return paths


def _scenario_selectors(selected: list[str]) -> dict[str, dict[str, str]]:
    common = {"root": "[data-qa=app-shell]", "result": "[data-qa=scenario-result]"}
    selectors = {scenario: dict(common) for scenario in selected}
    if "DR-H1" in selectors:
        selectors["DR-H1"].update(
            {
                "question": "[data-qa=dr-question]",
                "preview": "[data-qa=dr-preview]",
                "plan": "[data-qa=dr-plan]",
                "continue": "[data-qa=dr-continue]",
                "report": "[data-qa=dr-report]",
            }
        )
    return selectors


def command_prepare(args: argparse.Namespace) -> int:
    artifact = args.artifact.resolve()
    run_root = _safe_attempt_dir(args.attempt_dir)
    attempt_id, marker = _claim_attempt_dir(run_root)
    selected = list(SCENARIO_SETS[args.scenario_set])
    if args.route_exposure == "hidden" and "DOC-H1" in selected:
        _fail("DOC_H1_HIDDEN_PRE_EXPOSURE", "DOC-H1 requires an exposed-route fixture")

    packages = run_root / "packages"
    extraction = packages / args.scenario_set
    if extraction.exists():
        _fail("ATTEMPT_ALREADY_PREPARED", f"Extraction root already exists: {extraction}", EXIT_OWNERSHIP)
    artifact_sha256 = _sha256(artifact) if artifact.is_file() else _fail("INVALID_ARTIFACT", str(artifact))
    extract_root = _safe_extract(artifact, extraction)
    build = _read_build(extract_root)
    workspace_identity = _workspace_identity(attempt_id, str(artifact_sha256), extract_root)
    port = _reserve_port()
    proxy_port = _reserve_port()
    while proxy_port == port:
        proxy_port = _reserve_port()
    base_url = f"http://127.0.0.1:{port}"
    report_url_id = urllib.parse.quote(REPORT_ID, safe="")

    fixture_dir = run_root / "fixtures"
    fixture_dir.mkdir(parents=True, exist_ok=True)
    adapters_dir = fixture_dir / "adapters"
    adapters_dir.mkdir(parents=True, exist_ok=True)
    direct_adapter = adapters_dir / "fake-direct-adapter.json"
    cli_adapter = adapters_dir / "fake-cli-adapter.py"
    clock_path = fixture_dir / "injected-clock.json"
    _write_json(direct_adapter, {"mode": "fake-direct", "status": 500})
    cli_adapter.write_text("raise SystemExit(127)\n", encoding="utf-8")
    _write_json(clock_path, {"now": INJECTED_CLOCK})
    sentinel = extract_root / "data" / "manual-pack-sentinel.bin"
    sentinel.parent.mkdir(parents=True, exist_ok=True)
    sentinel.write_bytes(b"FOLIO-QA-MANUAL-PACK-SENTINEL\n")
    missing_index = extract_root / "data" / "research-index.sqlite3"
    _write_json(
        fixture_dir / "canonical-report.json",
        {
            "id": REPORT_ID,
            "markdown": "# QA contract fixture\n\nEXTERNAL_EVIDENCE_CANARY",
            "userContext": "HYPOTHESIS_ONLY_CANARY",
            "marketContext": "MARKET_CONTEXT_CANARY",
        },
    )
    manifest = {
        "schemaVersion": SCHEMA_VERSION,
        "attemptId": attempt_id,
        "createdAt": _utc_now(),
        "routeExposure": args.route_exposure,
        "runRoot": str(run_root),
        "ownershipMarker": str(marker),
        "artifact": {"path": str(artifact), "sha256": artifact_sha256},
        "artifactSha256": artifact_sha256,
        "build": build,
        "buildCommit": build["commit"],
        "extractRoot": str(extract_root),
        "workspaceIdentity": workspace_identity,
        "port": port,
        "proxyPort": proxy_port,
        "baseUrl": base_url,
        "healthExpected": {
            "status": "ok",
            "version": build["version"],
            "commit": build["commit"],
            "workspaceIdentity": workspace_identity,
        },
        "scenarioSet": args.scenario_set,
        "scenarioSets": SCENARIO_SETS,
        "selectedScenarioIds": selected,
        "restartScenarios": [item for item in RESTART_SCENARIOS if item in selected],
        "phases": _phases(selected),
        "fixtures": {
            "reportId": REPORT_ID,
            "externalCanary": "EXTERNAL_EVIDENCE_CANARY",
            "hypothesisCanary": "HYPOTHESIS_ONLY_CANARY",
            "marketCanary": "MARKET_CONTEXT_CANARY",
            "privateCanaries": list(PRIVATE_CANARIES),
        },
        "reportId": REPORT_ID,
        "fixtureIdentity": {
            "manualPackSentinel": {"path": str(sentinel), "sha256": _sha256(sentinel)},
            "missingIndex": {"path": str(missing_index), "expectedExists": False},
            "adapters": {"direct": str(direct_adapter), "cli": str(cli_adapter)},
            "injectedClock": {"path": str(clock_path), "value": INJECTED_CLOCK},
        },
        "urls": {
            "health": f"{base_url}/api/health",
            "root": f"{base_url}/",
            "deepResearch": f"{base_url}/#/deep-research",
            "report": f"{base_url}/#/deep-research/{report_url_id}",
            "home": f"{base_url}/#/home",
            "docs": f"{base_url}/#/docs",
        },
        "selectors": _scenario_selectors(selected),
        "requiredEvidencePaths": _required_evidence_paths(selected),
        "processesStarted": False,
    }
    manifest_path = run_root / "fixture-manifest.json"
    _write_json(manifest_path, manifest)
    print(str(manifest_path))
    if not args.manifest_only:
        args.manifest = manifest_path
        return command_start(args)
    return EXIT_OK


def _health(url: str, timeout: float = 2.0) -> dict[str, Any]:
    try:
        with urllib.request.urlopen(url, timeout=timeout) as response:
            body = response.read().decode("utf-8")
    except (OSError, urllib.error.URLError, UnicodeError) as exc:
        _fail("HEALTH_UNREACHABLE", f"Health endpoint failed: {exc}", EXIT_HEALTH)
    try:
        value = json.loads(body)
    except json.JSONDecodeError as exc:
        _fail("HEALTH_MALFORMED", f"Health response is not JSON: {exc}", EXIT_HEALTH)
    if not isinstance(value, dict):
        _fail("HEALTH_MALFORMED", "Health response is not an object", EXIT_HEALTH)
    return value


def _assert_health(payload: dict[str, Any], observed: dict[str, Any], child_pid: int | None = None) -> None:
    if set(observed) != HEALTH_KEYS:
        _fail(
            "HEALTH_IDENTITY_SHAPE_MISMATCH",
            "Health response must contain exactly status, pid, version, commit, and workspaceIdentity",
            EXIT_HEALTH,
        )
    expected = payload["healthExpected"]
    for key in ("status", "version", "commit", "workspaceIdentity"):
        if observed.get(key) != expected.get(key):
            _fail("HEALTH_IDENTITY_MISMATCH", f"Health {key} does not match manifest", EXIT_HEALTH)
    if child_pid is not None and observed.get("pid") != child_pid:
        _fail("HEALTH_PID_MISMATCH", "Health pid is not the owned child pid", EXIT_HEALTH)


def _health_hash(observed: dict[str, Any]) -> str:
    encoded = json.dumps(observed, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def _epoch_id(
    supervisor_pid: int,
    supervisor_create_time: str | int,
    child_pid: int,
    child_create_time: str | int,
    restart_count: int,
    started_at: str,
) -> str:
    material = "\0".join(
        map(str, (supervisor_pid, supervisor_create_time, child_pid, child_create_time, restart_count, started_at))
    )
    return hashlib.sha256(material.encode("utf-8")).hexdigest()


def _detached_flags() -> dict[str, Any]:
    if os.name == "nt":
        return {"creationflags": subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.DETACHED_PROCESS}
    return {"start_new_session": True}


def command_start(args: argparse.Namespace) -> int:
    payload, manifest_path = _load_owned_manifest(args.manifest)
    port = int(payload["port"])
    if _port_open(port):
        _fail("PORT_ALREADY_IN_USE", f"Port {port} is already open", EXIT_PROCESS)
    supervisor = Path(__file__).with_name("qa_server_supervisor.py")
    log_path = Path(payload["runRoot"]) / "supervisor-launch.log"
    with log_path.open("ab") as log:
        subprocess.Popen(
            [sys.executable, str(supervisor), "--manifest", str(manifest_path), "--readiness-timeout", str(args.readiness_timeout)],
            cwd=Path(payload["runRoot"]),
            stdin=subprocess.DEVNULL,
            stdout=log,
            stderr=subprocess.STDOUT,
            close_fds=True,
            **_detached_flags(),
        )
    state_path = Path(payload["runRoot"]) / "server.json"
    deadline = time.monotonic() + args.readiness_timeout + 2
    state: dict[str, Any] | None = None
    while time.monotonic() < deadline:
        if state_path.is_file():
            state = _read_json(state_path, code="SUPERVISOR_STATE_INVALID")
            if state.get("state") in {"ready", "failed", "stopped"}:
                break
        time.sleep(0.1)
    if not state or state.get("state") != "ready":
        _fail("SUPERVISOR_START_FAILED", f"Supervisor did not become ready: {state}", EXIT_PROCESS)
    observed = _health(payload["urls"]["health"])
    _assert_health(payload, observed, int(state["childPid"]))
    payload["healthObserved"] = observed
    payload["processesStarted"] = True
    payload["serverEpochId"] = state["epochId"]
    payload["epochHistory"] = [state]
    for phase in payload["phases"]:
        if phase["action"] == "pre_restart":
            phase["expectedEpochId"] = state["epochId"]
    _write_json(manifest_path, payload)
    print(json.dumps(state, sort_keys=True))
    return EXIT_OK


def _request_supervisor(
    payload: dict[str, Any], action: str, timeout: float, *, scenario: str | None = None
) -> dict[str, Any]:
    run_root = Path(payload["runRoot"])
    state_path = run_root / "server.json"
    response_path = run_root / "supervisor-response.json"
    if not state_path.is_file():
        _fail("SUPERVISOR_NOT_RUNNING", "Supervisor state is missing", EXIT_PROCESS)
    before = _read_json(state_path, code="SUPERVISOR_STATE_INVALID")
    request_id = uuid.uuid4().hex
    request = {"requestId": request_id, "action": action, "createdAt": _utc_now()}
    if scenario is not None:
        request["scenario"] = scenario
    _write_json(run_root / "supervisor-control.json", request)
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if state_path.is_file():
            current = _read_json(state_path, code="SUPERVISOR_STATE_INVALID")
            if response_path.is_file():
                response = _read_json(response_path, code="SUPERVISOR_RESPONSE_INVALID")
                if response.get("requestId") == request_id:
                    return current
            if action == "stop" and current.get("state") == "stopped":
                return current
            if action == "restart" and int(current.get("restartCount", 0)) > int(before.get("restartCount", 0)):
                return current
        time.sleep(0.1)
    _fail("SUPERVISOR_REQUEST_TIMEOUT", f"Supervisor did not complete {action}", EXIT_PROCESS)


def command_restart(args: argparse.Namespace) -> int:
    payload, manifest_path = _load_owned_manifest(args.manifest)
    run_root = Path(payload["runRoot"])
    before = _read_json(run_root / "server.json", code="SUPERVISOR_STATE_INVALID")
    if args.scenario not in payload.get("restartScenarios", []):
        _fail("RESTART_SCENARIO_NOT_ALLOWED", args.scenario, EXIT_PROCESS)
    completed = len(payload.get("restartReceipts", []))
    if completed >= len(payload["restartScenarios"]) or payload["restartScenarios"][completed] != args.scenario:
        _fail("RESTART_SCENARIO_ORDER_INVALID", args.scenario, EXIT_PROCESS)
    state = _request_supervisor(payload, "restart", args.timeout, scenario=args.scenario)
    receipt_number = int(state["restartCount"])
    receipt_path = run_root / f"restart-{receipt_number}-receipt.json"
    receipt = _read_json(receipt_path, code="RESTART_RECEIPT_MISSING")
    receipts = list(payload.get("restartReceipts", []))
    receipts.append(receipt)
    payload["restartReceipts"] = receipts
    payload["serverEpochId"] = state["epochId"]
    payload.setdefault("epochHistory", []).append(state)
    matching = [
        phase for phase in payload["phases"]
        if phase["scenario"] == args.scenario and phase["action"] == "post_restart"
    ]
    if len(matching) != 1 or matching[0].get("expectedEpochId") is not None:
        _fail("RESTART_PHASE_ALREADY_BOUND", args.scenario, EXIT_PROCESS)
    if receipt.get("oldEpochId") != before.get("epochId") or receipt.get("newEpochId") != state.get("epochId"):
        _fail("RESTART_RECEIPT_IDENTITY_MISMATCH", args.scenario, EXIT_PROCESS)
    matching[0]["expectedEpochId"] = state["epochId"]
    observed = _health(payload["urls"]["health"])
    _assert_health(payload, observed, int(state["childPid"]))
    payload["healthObserved"] = observed
    _write_json(manifest_path, payload)
    print(json.dumps(receipt, sort_keys=True))
    return EXIT_OK


def command_stop(args: argparse.Namespace) -> int:
    payload, manifest_path = _load_owned_manifest(args.manifest)
    state_path = Path(payload["runRoot"]) / "server.json"
    if state_path.is_file():
        state = _read_json(state_path, code="SUPERVISOR_STATE_INVALID")
        if state.get("state") != "stopped":
            state = _request_supervisor(payload, "stop", args.timeout)
            print(json.dumps(state, sort_keys=True))
    payload["processesStarted"] = False
    _write_json(manifest_path, payload)
    return EXIT_OK


def _process_create_time(pid: int) -> str:
    if os.name == "nt":
        from ctypes import wintypes

        kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
        handle = kernel32.OpenProcess(0x1000, False, pid)
        if not handle:
            raise ProcessLookupError(pid)
        creation, exit_time, kernel, user = (wintypes.FILETIME() for _ in range(4))
        try:
            if not kernel32.GetProcessTimes(
                handle, ctypes.byref(creation), ctypes.byref(exit_time), ctypes.byref(kernel), ctypes.byref(user)
            ):
                raise OSError(ctypes.get_last_error(), "GetProcessTimes")
            return str((creation.dwHighDateTime << 32) | creation.dwLowDateTime)
        finally:
            kernel32.CloseHandle(handle)
    return Path(f"/proc/{pid}/stat").read_text(encoding="ascii").rsplit(")", 1)[1].split()[19]


def _terminate_pid(pid: int, expected_create_time: str) -> None:
    if pid <= 0:
        return
    try:
        if _process_create_time(pid) != expected_create_time:
            _fail("PROXY_PID_IDENTITY_MISMATCH", "Refusing to kill a reused proxy PID", EXIT_PROXY)
        if os.name == "nt":
            subprocess.run(["taskkill", "/PID", str(pid), "/T", "/F"], capture_output=True, timeout=10, check=False)
        else:
            os.killpg(pid, signal.SIGTERM)
    except (OSError, subprocess.SubprocessError):
        pass


def command_proxy_start(args: argparse.Namespace) -> int:
    payload, manifest_path = _load_owned_manifest(args.manifest)
    state_path = Path(payload["runRoot"]) / "proxy.json"
    if state_path.is_file():
        old = _read_json(state_path, code="PROXY_STATE_INVALID")
        if _port_open(int(old.get("port", 0))):
            _fail("PROXY_ALREADY_RUNNING", "Fault proxy is already running", EXIT_PROXY)
    proxy = Path(__file__).with_name("qa_fault_proxy.py")
    log_path = Path(payload["runRoot"]) / "fault-proxy.log"
    with log_path.open("ab") as log:
        subprocess.Popen(
            [sys.executable, str(proxy), "--manifest", str(manifest_path), "--fault", args.fault],
            cwd=Path(payload["runRoot"]), stdin=subprocess.DEVNULL, stdout=log, stderr=subprocess.STDOUT,
            close_fds=True, **_detached_flags(),
        )
    deadline = time.monotonic() + args.timeout
    while time.monotonic() < deadline:
        if state_path.is_file():
            state = _read_json(state_path, code="PROXY_STATE_INVALID")
            if state.get("state") == "ready" and _port_open(int(state["port"])):
                print(json.dumps(state, sort_keys=True))
                return EXIT_OK
        time.sleep(0.1)
    _fail("PROXY_START_FAILED", "Fault proxy did not become ready", EXIT_PROXY)


def command_proxy_stop(args: argparse.Namespace) -> int:
    payload, _ = _load_owned_manifest(args.manifest)
    state_path = Path(payload["runRoot"]) / "proxy.json"
    receipt_path = Path(payload["runRoot"]) / "proxy-stop-receipt.json"
    if receipt_path.is_file():
        return EXIT_OK
    if state_path.is_file():
        state = _read_json(state_path, code="PROXY_STATE_INVALID")
        process = _read_json(Path(payload["runRoot"]) / "proxy-process.json", code="PROXY_PROCESS_INVALID")
        _terminate_pid(int(state.get("pid", 0)), str(process.get("createTime", "")))
        deadline = time.monotonic() + args.timeout
        while time.monotonic() < deadline and _port_open(int(state.get("port", 0))):
            time.sleep(0.1)
        if _port_open(int(state.get("port", 0))):
            _fail("PROXY_STOP_FAILED", "Fault proxy port remained open", EXIT_PROXY)
        _write_json(
            receipt_path,
            {"pid": state["pid"], "createTime": process["createTime"], "stoppedAt": _utc_now(), "portClosed": True},
        )
    return EXIT_OK


def _validate_scenario_contract(payload: dict[str, Any], requested: str) -> None:
    if payload.get("scenarioSets") != SCENARIO_SETS:
        _fail("SCENARIO_SET_CONTRACT_MISMATCH", "Manifest scenario sets are not exact")
    if requested not in SCENARIO_SETS or payload.get("scenarioSet") != requested:
        _fail("SCENARIO_SET_MISMATCH", "Requested scenario set differs from manifest")
    selected = payload.get("selectedScenarioIds")
    if selected != SCENARIO_SETS[requested]:
        if payload.get("routeExposure") == "hidden" and isinstance(selected, list) and "DOC-H1" in selected:
            _fail("DOC_H1_HIDDEN_PRE_EXPOSURE", "Hidden-route evidence includes DOC-H1")
        _fail("SELECTED_SCENARIO_SET_INCOMPLETE", "Selected scenarios are not the exact named set")
    if payload.get("routeExposure") == "hidden" and "DOC-H1" in selected:
        _fail("DOC_H1_HIDDEN_PRE_EXPOSURE", "DOC-H1 cannot run before route exposure")


def _validate_freshness(payload: dict[str, Any]) -> None:
    try:
        created = dt.datetime.fromisoformat(str(payload["createdAt"]).replace("Z", "+00:00"))
    except (KeyError, ValueError):
        _fail("MALFORMED_CREATED_AT", "createdAt is not a UTC instant")
    now = dt.datetime.now(dt.timezone.utc)
    if created.tzinfo is None:
        _fail("MALFORMED_CREATED_AT", "createdAt lacks timezone")
    if now - created.astimezone(dt.timezone.utc) > ISO_MAX_AGE:
        _fail("STALE_BUNDLE", "Evidence bundle is older than seven days")


def _validate_epochs(payload: dict[str, Any]) -> dict[str, str]:
    phases = payload.get("phases")
    if not isinstance(phases, list):
        _fail("MALFORMED_PHASES", "phases must be a list")
    phase_epochs: dict[str, str] = {}
    for phase in phases:
        if not isinstance(phase, dict) or not all(key in phase for key in ("phaseId", "scenario", "action", "expectedEpochId")):
            _fail("MALFORMED_PHASE", "A phase is incomplete")
        phase_id = str(phase["phaseId"])
        if phase_id in phase_epochs:
            _fail("DUPLICATE_PHASE_ID", phase_id)
        epoch = str(phase["expectedEpochId"])
        phase_epochs[phase_id] = epoch
        if not re.fullmatch(r"[0-9a-f]{64}", epoch):
            _fail("EVIDENCE_EPOCH_MISMATCH", "Phase epoch is not a bound SHA-256 identity")
    history = payload.get("epochHistory")
    if not isinstance(history, list) or not history:
        _fail("EPOCH_HISTORY_MISSING", "Manifest lacks actual server epoch history")
    exact_server_keys = {
        "supervisorPid", "supervisorCreateTime", "childPid", "childCreateTime", "restartCount",
        "epochId", "port", "startedAt", "commandHash", "state",
    }
    for number, server in enumerate(history):
        if not isinstance(server, dict) or set(server) != exact_server_keys or server.get("restartCount") != number:
            _fail("SERVER_IDENTITY_INVALID", "server.json history is incomplete or reordered")
        computed = _epoch_id(
            server["supervisorPid"], server["supervisorCreateTime"], server["childPid"],
            server["childCreateTime"], server["restartCount"], server["startedAt"],
        )
        if server.get("epochId") != computed:
            _fail("EVIDENCE_EPOCH_MISMATCH", "Server epoch hash does not match process identity")
        if number and (
            server["supervisorPid"] != history[0]["supervisorPid"]
            or server["supervisorCreateTime"] != history[0]["supervisorCreateTime"]
            or (server["childPid"], server["childCreateTime"])
            == (history[number - 1]["childPid"], history[number - 1]["childCreateTime"])
        ):
            _fail("EVIDENCE_EPOCH_MISMATCH", "Restart did not preserve supervisor and replace child identity")
    pre_epochs = [phase_epochs[phase["phaseId"]] for phase in phases if phase["action"] == "pre_restart"]
    if any(epoch != history[0]["epochId"] for epoch in pre_epochs):
        _fail("EVIDENCE_EPOCH_MISMATCH", "Pre-restart phases are not bound to the initial epoch")
    post_phases = [phase for phase in phases if phase["action"] == "post_restart"]
    for number, phase in enumerate(post_phases, 1):
        if number >= len(history) or phase["expectedEpochId"] != history[number]["epochId"]:
            _fail("EVIDENCE_EPOCH_MISMATCH", "Post-restart phase is copied or reordered")
    receipts = payload.get("restartReceipts", [])
    if not isinstance(receipts, list):
        _fail("RESTART_RECEIPTS_MALFORMED", "restartReceipts must be a list")
    if len(receipts) != len(history) - 1:
        _fail("RESTART_RECEIPT_ORDER_INVALID", "Restart receipt count differs from epoch history")
    receipt_keys = {"oldEpochId", "newEpochId", "oldChild", "newChild", "triggeredAt", "readyAt", "healthHash"}
    for expected_number, receipt in enumerate(receipts, 1):
        if not isinstance(receipt, dict) or set(receipt) != receipt_keys:
            _fail("RESTART_RECEIPT_ORDER_INVALID", "Restart receipts are missing, copied, or reordered")
        old, new = history[expected_number - 1], history[expected_number]
        if receipt.get("oldEpochId") != old["epochId"] or receipt.get("newEpochId") != new["epochId"]:
            _fail("EVIDENCE_EPOCH_MISMATCH", "Restart receipt epoch chain is invalid")
        if receipt.get("oldChild") != {"pid": old["childPid"], "createTime": old["childCreateTime"]}:
            _fail("EVIDENCE_EPOCH_MISMATCH", "Restart old child identity is invalid")
        if receipt.get("newChild") != {"pid": new["childPid"], "createTime": new["childCreateTime"]}:
            _fail("EVIDENCE_EPOCH_MISMATCH", "Restart new child identity is invalid")
        try:
            triggered = dt.datetime.fromisoformat(str(receipt["triggeredAt"]).replace("Z", "+00:00"))
            ready = dt.datetime.fromisoformat(str(receipt["readyAt"]).replace("Z", "+00:00"))
        except ValueError:
            _fail("RESTART_RECEIPT_TIME_INVALID", "Restart receipt timestamp is invalid")
        if triggered > ready:
            _fail("RESTART_RECEIPT_TIME_INVALID", "Restart readiness predates trigger")
        expected_health = {**payload["healthExpected"], "pid": new["childPid"]}
        if receipt.get("healthHash") != _health_hash(expected_health):
            _fail("RESTART_RECEIPT_HEALTH_MISMATCH", "Restart receipt health hash is invalid")
    return phase_epochs


def _validate_evidence_files(payload: dict[str, Any], phase_epochs: dict[str, str]) -> None:
    run_root = Path(payload["runRoot"]).resolve()
    paths = payload.get("requiredEvidencePaths")
    if not isinstance(paths, list) or not all(isinstance(item, str) for item in paths):
        _fail("REQUIRED_EVIDENCE_PATHS_MALFORMED", "requiredEvidencePaths must be strings")
    if paths != _required_evidence_paths(payload["selectedScenarioIds"]):
        _fail("REQUIRED_EVIDENCE_PATHS_INCOMPLETE", "Evidence paths are not the exact selected scenario ledger")
    history_by_epoch = {item["epochId"]: item for item in payload["epochHistory"]}
    receipt_by_new_epoch = {item["newEpochId"]: item for item in payload.get("restartReceipts", [])}
    next_trigger: dict[str, str] = {
        item["oldEpochId"]: item["triggeredAt"] for item in payload.get("restartReceipts", [])
    }
    json_identity = {
        "artifactSha256", "buildCommit", "capturedAt", "baseUrl", "viewport", "scenario",
        "phaseId", "serverEpochId", "childPid", "childCreateTime", "restartCount",
    }
    phase_coverage = {phase_id: 0 for phase_id in phase_epochs}
    for relative in paths:
        path = (run_root / relative).resolve()
        if not _is_relative_to(path, run_root) or not path.is_file():
            _fail("REQUIRED_EVIDENCE_MISSING", f"Missing or unsafe evidence path: {relative}")
        if path.suffix.lower() == ".png":
            sidecar = path.with_suffix(".json")
            if not sidecar.is_file():
                _fail("PNG_SIDECAR_MISSING", str(sidecar))
            metadata = _read_json(sidecar, code="PNG_SIDECAR_MALFORMED")
            if metadata.get("pngSha256") != _sha256(path):
                _fail("PNG_SHA256_MISMATCH", str(path))
        text = path.read_text(encoding="utf-8", errors="replace")
        if any(canary in text for canary in PRIVATE_CANARIES):
            _fail("PRIVATE_CANARY_EXPOSED", f"Private canary found in {relative}")
        if path.suffix.lower() == ".json":
            evidence = _read_json(path, code="EVIDENCE_JSON_MALFORMED")
            if not json_identity.issubset(evidence):
                _fail("EVIDENCE_IDENTITY_MISSING", relative)
            epoch = str(evidence["serverEpochId"])
            if phase_epochs.get(str(evidence["phaseId"])) != epoch or evidence["scenario"] != relative.split("/", 1)[0]:
                _fail("EVIDENCE_EPOCH_MISMATCH", relative)
            phase_coverage[str(evidence["phaseId"])] += 1
            server = history_by_epoch.get(epoch)
            if server is None or (
                evidence["childPid"] != server["childPid"]
                or evidence["childCreateTime"] != server["childCreateTime"]
                or evidence["restartCount"] != server["restartCount"]
            ):
                _fail("EVIDENCE_EPOCH_MISMATCH", relative)
            try:
                captured = dt.datetime.fromisoformat(str(evidence["capturedAt"]).replace("Z", "+00:00"))
                lower_text = receipt_by_new_epoch.get(epoch, {}).get("readyAt", server["startedAt"])
                lower = dt.datetime.fromisoformat(str(lower_text).replace("Z", "+00:00"))
                upper_text = next_trigger.get(epoch)
                upper = dt.datetime.fromisoformat(str(upper_text).replace("Z", "+00:00")) if upper_text else None
            except ValueError:
                _fail("EVIDENCE_CAPTURE_TIME_INVALID", relative)
            if captured < lower or (upper is not None and captured >= upper):
                _fail("EVIDENCE_CAPTURE_TIME_INVALID", relative)
    uncovered = [phase_id for phase_id, count in phase_coverage.items() if count == 0]
    if uncovered:
        _fail("EVIDENCE_PHASE_COVERAGE_MISSING", ", ".join(uncovered))
    for relative in [item for item in paths if item.endswith("/result.json")]:
        result_path = run_root / relative
        result = _read_json(result_path, code="RESULT_JSON_MALFORMED")
        scenario = relative.split("/", 1)[0]
        if result.get("scenario") != scenario or result.get("passed") is not True:
            _fail("SCENARIO_RESULT_INVALID", scenario)
        if "cancellation" not in result:
            _fail("CANCELLATION_CONTRACT_MISSING", scenario)
        phase_id = str(result.get("phaseId", ""))
        if phase_id not in phase_epochs or result.get("serverEpochId") != phase_epochs[phase_id]:
            _fail("EVIDENCE_EPOCH_MISMATCH", scenario)
        if result.get("privateCanariesAbsent") is not True:
            _fail("PRIVATE_CANARY_ASSERTION_MISSING", scenario)


def command_verify(args: argparse.Namespace) -> int:
    payload, _ = _load_owned_manifest(args.manifest)
    _validate_scenario_contract(payload, args.scenario_set)
    _validate_freshness(payload)
    phase_epochs = _validate_epochs(payload)
    if "healthObserved" in payload:
        _assert_health(payload, payload["healthObserved"])
    _validate_evidence_files(payload, phase_epochs)
    print("QA020_EVIDENCE_VERIFIED")
    return EXIT_OK


def command_cleanup(args: argparse.Namespace) -> int:
    payload, _ = _load_owned_manifest(args.manifest)
    run_root = Path(payload["runRoot"]).resolve()
    try:
        if (run_root / "proxy.json").is_file():
            command_proxy_stop(args)
        if (run_root / "server.json").is_file():
            command_stop(args)
    finally:
        ports = [int(payload.get("port", 0)), int(payload.get("proxyPort", 0))]
        if any(port and _port_open(port) for port in ports):
            _fail("CLEANUP_PORT_STILL_OPEN", "An owned port remained open", EXIT_PROCESS)
        shutil.rmtree(run_root)
    print(f"Removed owned attempt root: {run_root}")
    return EXIT_OK


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Prepare, supervise, fault, and verify Folio OS QA-020 evidence.")
    commands = parser.add_subparsers(dest="command", required=True)

    prepare = commands.add_parser("prepare", help="Extract a synthetic release artifact and emit fixture-manifest.json.")
    prepare.add_argument("--artifact", required=True, type=Path)
    prepare.add_argument("--attempt-dir", required=True, type=Path)
    prepare.add_argument("--scenario-set", required=True, choices=tuple(SCENARIO_SETS))
    prepare.add_argument("--route-exposure", choices=("hidden", "exposed"), default="hidden")
    prepare.add_argument("--manifest-only", action="store_true", help="Prepare fixtures without starting processes.")
    prepare.add_argument("--readiness-timeout", type=float, default=30.0)
    prepare.set_defaults(handler=command_prepare)

    for name, handler in (("start", command_start), ("restart", command_restart), ("stop", command_stop)):
        sub = commands.add_parser(name, help=f"{name.title()} the marker-owned packaged server.")
        sub.add_argument("--manifest", required=True, type=Path)
        if name == "start":
            sub.add_argument("--readiness-timeout", type=float, default=30.0)
        else:
            sub.add_argument("--timeout", type=float, default=30.0)
        if name == "restart":
            sub.add_argument("--scenario", required=True, choices=tuple(RESTART_SCENARIOS))
        sub.set_defaults(handler=handler)

    cleanup = commands.add_parser("cleanup", help="Stop owned process trees and remove the marker-owned attempt root.")
    cleanup.add_argument("--manifest", required=True, type=Path)
    cleanup.add_argument("--timeout", type=float, default=30.0)
    cleanup.set_defaults(handler=command_cleanup)

    verify = commands.add_parser("verify-evidence", help="Fail closed on malformed, stale, copied, or private evidence.")
    verify.add_argument("--manifest", required=True, type=Path)
    verify.add_argument("--scenario-set", required=True, choices=tuple(SCENARIO_SETS))
    verify.set_defaults(handler=command_verify)

    proxy_start = commands.add_parser("proxy-start", help="Start the host-only deterministic fault proxy.")
    proxy_start.add_argument("--manifest", required=True, type=Path)
    proxy_start.add_argument("--fault", required=True, choices=("disconnect", "timeout", "http-500", "passthrough"))
    proxy_start.add_argument("--timeout", type=float, default=10.0)
    proxy_start.set_defaults(handler=command_proxy_start)

    proxy_stop = commands.add_parser("proxy-stop", help="Stop the marker-owned fault proxy tree.")
    proxy_stop.add_argument("--manifest", required=True, type=Path)
    proxy_stop.add_argument("--timeout", type=float, default=10.0)
    proxy_stop.set_defaults(handler=command_proxy_stop)
    return parser


def main(argv: list[str] | None = None) -> int:
    try:
        args = build_parser().parse_args(argv)
        return int(args.handler(args))
    except HarnessError as exc:
        print(f"{exc.code}: {exc}", file=sys.stderr)
        return exc.exit_code
    except KeyboardInterrupt:
        print("INTERRUPTED: operation cancelled", file=sys.stderr)
        return EXIT_PROCESS


if __name__ == "__main__":
    raise SystemExit(main())
