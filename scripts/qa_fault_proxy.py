#!/usr/bin/env python3
"""Deterministic host-only HTTP fault proxy for a marker-owned QA attempt."""

from __future__ import annotations

import argparse
import datetime as dt
import http.server
import json
import os
import signal
import sys
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path
from typing import Any


OWNERSHIP_MARKER = ".folio-qa-owned"
EXIT_OWNERSHIP = 2
EXIT_PROXY = 6
STOP_REQUESTED = False


def _now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def _read(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"Expected object: {path}")
    return value


def _write(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.{uuid.uuid4().hex}.tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(temporary, path)


def _is_relative_to(path: Path, root: Path) -> bool:
    try:
        path.relative_to(root)
        return True
    except ValueError:
        return False


def _load_owned(path: Path) -> dict[str, Any]:
    manifest_path = path.resolve()
    manifest = _read(manifest_path)
    run_root = Path(str(manifest["runRoot"])).resolve()
    marker = run_root / OWNERSHIP_MARKER
    if Path(str(manifest.get("ownershipMarker", ""))).resolve() != marker or not marker.is_file():
        raise PermissionError("missing marker-owned run root")
    if _read(marker).get("attemptId") != manifest.get("attemptId"):
        raise PermissionError("ownership marker mismatch")
    if not _is_relative_to(manifest_path, run_root):
        raise PermissionError("manifest outside run root")
    return manifest


def _request_body(handler: http.server.BaseHTTPRequestHandler) -> bytes | None:
    length = int(handler.headers.get("Content-Length", "0") or 0)
    return handler.rfile.read(length) if length else None


def _handler(
    fault: str, upstream: str, timeout_seconds: float, state: dict[str, Any], state_path: Path
) -> type[http.server.BaseHTTPRequestHandler]:
    class FaultHandler(http.server.BaseHTTPRequestHandler):
        server_version = "FolioQAHostProxy/1"

        def _serve(self) -> None:
            if state["consumedRequests"] >= state["expectedRequests"]:
                self.send_error(410, "fault already consumed")
                return
            state["consumedRequests"] += 1
            state["state"] = "consumed" if state["consumedRequests"] == state["expectedRequests"] else "ready"
            _write(state_path, state)
            if fault == "disconnect":
                self.close_connection = True
                try:
                    self.connection.shutdown(2)
                except OSError:
                    pass
                return
            if fault == "timeout":
                time.sleep(timeout_seconds)
                self.close_connection = True
                return
            if fault == "http-500":
                body = b'{"error":"injected host proxy failure"}'
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
            target = upstream.rstrip("/") + self.path
            headers = {
                key: value
                for key, value in self.headers.items()
                if key.lower() not in {"host", "connection", "content-length"}
            }
            request = urllib.request.Request(
                target,
                data=_request_body(self),
                headers=headers,
                method=self.command,
            )
            try:
                with urllib.request.urlopen(request, timeout=10) as response:
                    body = response.read()
                    self.send_response(response.status)
                    for key, value in response.headers.items():
                        if key.lower() not in {"connection", "transfer-encoding", "content-length"}:
                            self.send_header(key, value)
            except urllib.error.HTTPError as exc:
                body = exc.read()
                self.send_response(exc.code)
            except (OSError, urllib.error.URLError) as exc:
                body = json.dumps({"error": str(exc)}).encode("utf-8")
                self.send_response(502)
                self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(body)

        do_GET = _serve
        do_POST = _serve
        do_PUT = _serve
        do_PATCH = _serve
        do_DELETE = _serve
        do_HEAD = _serve
        # urllib's normal HTTPS proxy path starts with CONNECT.  Returning the
        # configured fault here exercises the real client transport without a
        # product-only base URL or QA branch.
        do_CONNECT = _serve

        def log_message(self, fmt: str, *args: object) -> None:
            print(f"{self.address_string()} {fmt % args}", flush=True)

    return FaultHandler


class LoopbackServer(http.server.ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = False


def _request_stop(_signum: int, _frame: Any) -> None:
    global STOP_REQUESTED
    STOP_REQUESTED = True


def run(args: argparse.Namespace) -> int:
    manifest = _load_owned(args.manifest)
    run_root = Path(manifest["runRoot"])
    listen_port = int(manifest["proxyPort"])
    state_path = run_root / "proxy.json"
    state = {
        "pid": os.getpid(),
        "port": listen_port,
        "state": "ready",
        "fault": args.fault,
        "expectedRequests": 1,
        "consumedRequests": 0,
    }
    handler = _handler(args.fault, str(manifest["baseUrl"]), args.timeout_seconds, state, state_path)
    with LoopbackServer(("127.0.0.1", listen_port), handler) as server:
        server.timeout = 0.2
        _write(state_path, state)
        _write(
            run_root / "proxy-process.json",
            {"pid": os.getpid(), "createTime": _process_create_time(os.getpid()), "startedAt": _now()},
        )
        while not STOP_REQUESTED:
            server.handle_request()
    return 0


def _process_create_time(pid: int) -> str:
    if os.name == "nt":
        import ctypes
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


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run a host-only loopback fault proxy for QA-020.")
    parser.add_argument("--manifest", required=True, type=Path, help="Marker-owned fixture manifest.")
    parser.add_argument(
        "--fault", required=True, choices=("disconnect", "timeout", "http-500", "passthrough"),
        help="Deterministic connection behavior.",
    )
    parser.add_argument("--timeout-seconds", type=float, default=60.0)
    return parser


def main(argv: list[str] | None = None) -> int:
    signal.signal(signal.SIGINT, _request_stop)
    signal.signal(signal.SIGTERM, _request_stop)
    try:
        return run(build_parser().parse_args(argv))
    except PermissionError as exc:
        print(f"UNOWNED_RUN_ROOT: {exc}", file=sys.stderr)
        return EXIT_OWNERSHIP
    except (KeyError, OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"FAULT_PROXY_FAILED: {exc}", file=sys.stderr)
        return EXIT_PROXY


if __name__ == "__main__":
    raise SystemExit(main())
