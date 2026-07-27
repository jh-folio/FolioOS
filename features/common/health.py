"""Minimal, privacy-safe process and build identity for health checks."""

from __future__ import annotations

import hashlib
import json
import os
import re
import subprocess
from pathlib import Path
from typing import TypedDict


_VERSION_RE = re.compile(r"\d+\.\d+\.\d+")
_COMMIT_RE = re.compile(r"[0-9a-f]{40}")
_WORKSPACE_IDENTITY_RE = re.compile(r"[0-9a-f]{64}")


class HealthPayload(TypedDict):
    status: str
    pid: int
    version: str
    commit: str
    workspaceIdentity: str


def _build_metadata(root: Path) -> dict[str, object]:
    try:
        value = json.loads((root / "BUILD.json").read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError):
        return {}
    return value if isinstance(value, dict) else {}


def _version(root: Path, build: dict[str, object]) -> str:
    packaged = str(build.get("version", ""))
    if _VERSION_RE.fullmatch(packaged):
        return packaged
    try:
        source = (root / "VERSION").read_text(encoding="utf-8").strip()
    except (OSError, UnicodeError):
        source = ""
    return source if _VERSION_RE.fullmatch(source) else "0.0.0"


def _commit(root: Path, build: dict[str, object]) -> str:
    packaged = str(build.get("commit", ""))
    if _COMMIT_RE.fullmatch(packaged):
        return packaged
    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=root,
            stdin=subprocess.DEVNULL,
            text=True,
            encoding="utf-8",
            errors="replace",
            capture_output=True,
            check=False,
            timeout=2,
        )
        source = result.stdout.strip() if result.returncode == 0 else ""
    except (OSError, subprocess.SubprocessError):
        source = ""
    return source if _COMMIT_RE.fullmatch(source) else "0" * 40


def _workspace_identity(root: Path) -> str:
    supplied = os.environ.get("FOLIO_WORKSPACE_IDENTITY", "")
    if _WORKSPACE_IDENTITY_RE.fullmatch(supplied):
        return supplied
    # Only the digest leaves this process; the local path is never exposed.
    return hashlib.sha256(os.fsencode(str(root.resolve()))).hexdigest()


def health_payload(root: Path) -> HealthPayload:
    """Return the exact public liveness and immutable identity contract."""
    build = _build_metadata(root)
    return {
        "status": "ok",
        "pid": os.getpid(),
        "version": _version(root, build),
        "commit": _commit(root, build),
        "workspaceIdentity": _workspace_identity(root),
    }
