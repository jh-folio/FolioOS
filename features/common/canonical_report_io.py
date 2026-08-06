from __future__ import annotations
from features.common.atomic_replace import replace_with_retry

import os
import threading
import uuid
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path

_PROCESS_LOCKS: dict[Path, threading.RLock] = {}
_PROCESS_LOCKS_GUARD = threading.Lock()


def safe_child_path(root: Path, filename: str) -> Path:
    """Resolve one literal child while rejecting separators, dot names, and symlink escapes."""
    raw_name = str(filename)
    safe_name = os.path.basename(raw_name)
    if "/" in raw_name or "\\" in raw_name or safe_name != raw_name or safe_name in {"", ".", ".."}:
        raise ValueError("artifact filename must be one safe path component")
    # Root is an explicitly configured storage/vault root.
    # codeql[py/path-injection]
    resolved_root = root.resolve(strict=False)
    # safe_name is basename- and separator-checked above.
    # codeql[py/path-injection]
    candidate = (resolved_root / safe_name).resolve(strict=False)
    if candidate.parent != resolved_root:
        raise ValueError("artifact path escapes its configured root")
    return candidate


def _normalized_artifact_path(path: Path) -> Path:
    return safe_child_path(path.parent, path.name)


def _process_lock(path: Path) -> threading.RLock:
    with _PROCESS_LOCKS_GUARD:
        return _PROCESS_LOCKS.setdefault(path, threading.RLock())


@contextmanager
def artifact_lock(path: Path) -> Iterator[None]:
    resolved = _normalized_artifact_path(path)
    lock_path = resolved.with_name(f".{resolved.name}.canonical.lock")
    # resolved is normalized by safe_child_path.
    # codeql[py/path-injection]
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    with _process_lock(resolved):
        # lock_path is a fixed sibling of the normalized artifact.
        # codeql[py/path-injection]
        with lock_path.open("a+b") as stream:
            stream.seek(0, os.SEEK_END)
            if stream.tell() == 0:
                stream.write(b"\0")
                stream.flush()
            stream.seek(0)
            if os.name == "nt":
                import msvcrt

                msvcrt.locking(stream.fileno(), msvcrt.LK_LOCK, 1)
                try:
                    yield
                finally:
                    stream.seek(0)
                    msvcrt.locking(stream.fileno(), msvcrt.LK_UNLCK, 1)
            else:
                import fcntl

                fcntl.flock(stream.fileno(), fcntl.LOCK_EX)
                try:
                    yield
                finally:
                    fcntl.flock(stream.fileno(), fcntl.LOCK_UN)


def atomic_write(path: Path, content: bytes) -> None:
    path = _normalized_artifact_path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.{uuid.uuid4().hex}.tmp")
    try:
        with temporary.open("xb") as stream:
            stream.write(content)
            stream.flush()
            os.fsync(stream.fileno())
        replace_with_retry(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)
