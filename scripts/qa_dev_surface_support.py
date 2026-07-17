from __future__ import annotations

import json
import gc
import shutil
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from collections.abc import Mapping
from copy import deepcopy
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import IO

import uvicorn
from fastapi import FastAPI

from features.common.jcs import JsonValue
from features.topic_report.routes import ApprovedRequestBoundary
from features.smart_collections.routes import SmartCollectionBoundary
from features.smart_collections.service import SmartCollectionRuntime, SmartCollectionService
from qa_market_state_server import create_qa_market_state_router


@dataclass(frozen=True, slots=True)
class HttpResult:
    status: int
    payload: dict[str, JsonValue]


@dataclass(frozen=True, slots=True)
class ServerConfig:
    sourceRoot: Path
    scriptPath: Path
    dataDir: Path
    clockFile: Path
    port: int


@dataclass(frozen=True, slots=True)
class QaFailure(Exception):
    code: str

    def __str__(self) -> str:
        return self.code


def json_dict(raw: bytes) -> dict[str, JsonValue]:
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        return {"error": raw.decode("utf-8", errors="replace")}
    if not isinstance(payload, dict):
        raise QaFailure("non_object_response")
    return payload


def post(base_url: str, path: str, payload: Mapping[str, JsonValue]) -> HttpResult:
    return request_json(base_url, path, "POST", payload)


def request_json(
    base_url: str,
    path: str,
    method: str,
    payload: Mapping[str, JsonValue] | None = None,
) -> HttpResult:
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8") if payload is not None else None
    request = urllib.request.Request(
        base_url + path,
        data=data,
        headers={"Content-Type": "application/json"},
        method=method,
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return HttpResult(status=response.status, payload=json_dict(response.read()))
    except urllib.error.HTTPError as error:
        return HttpResult(status=error.code, payload=json_dict(error.read()))


def require(condition: bool, code: str) -> None:
    if not condition:
        raise QaFailure(code)


def free_port() -> int:
    with socket.socket() as server:
        server.bind(("127.0.0.1", 0))
        return int(server.getsockname()[1])


def start_server(config: ServerConfig, output: IO[str]) -> subprocess.Popen[str]:
    command = [
        sys.executable,
        str(config.scriptPath),
        "serve",
        "--data-dir",
        str(config.dataDir),
        "--clock-file",
        str(config.clockFile),
        "--port",
        str(config.port),
    ]
    return subprocess.Popen(
        command,
        cwd=config.sourceRoot,
        stdout=output,
        stderr=subprocess.STDOUT,
        text=True,
    )


def wait_ready(process: subprocess.Popen[str], base_url: str) -> None:
    deadline = time.monotonic() + 15
    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise QaFailure("server_exited_before_ready")
        try:
            with urllib.request.urlopen(base_url + "/health", timeout=1) as response:
                if response.status == 200:
                    return
        except (urllib.error.URLError, TimeoutError):
            time.sleep(0.05)
    raise QaFailure("server_ready_timeout")


def stop_server(process: subprocess.Popen[str]) -> int:
    if process.poll() is None:
        process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=5)
    return int(process.returncode or 0)


def remove_tree(path: Path) -> None:
    for attempt in range(20):
        try:
            shutil.rmtree(path)
            return
        except PermissionError:
            if attempt == 19:
                raise
            gc.collect()
            time.sleep(0.1)


def execution(envelope: Mapping[str, JsonValue]) -> dict[str, JsonValue]:
    approved = envelope.get("approvedRequest")
    approval = envelope.get("approval")
    if not isinstance(approved, dict) or not isinstance(approval, dict):
        raise QaFailure("invalid_plan_envelope")
    return {
        "approvedRequest": deepcopy(approved),
        "approval": {"id": approval.get("id"), "token": approval.get("token")},
        "execution": {
            "mode": "direct",
            "adapter": "auto",
            "fallbackPolicy": "rules_on_engine_failure",
        },
    }


def plan(base_url: str, question: str) -> HttpResult:
    return post(
        base_url,
        "/api/topic-reports/plan",
        {"question": question, "userContext": "PRIVATE_CONTEXT_CANARY"},
    )


def clock_from_file(path: Path) -> datetime:
    value = path.read_text(encoding="utf-8").strip()
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(UTC)


def serve(data_dir: Path, clock_file: Path, port: int) -> int:
    app = FastAPI()
    clock = lambda: clock_from_file(clock_file)
    collections = SmartCollectionService(SmartCollectionRuntime(dataDir=data_dir, clock=clock))
    boundary = ApprovedRequestBoundary(data_dir, clock=clock, collection_service=collections)
    app.include_router(boundary.router())
    app.include_router(SmartCollectionBoundary(collections).router())
    app.include_router(create_qa_market_state_router(data_dir, clock))
    app.add_api_route("/health", lambda: {"ok": True}, methods=["GET"])
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")
    return 0
