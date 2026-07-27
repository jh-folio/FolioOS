from __future__ import annotations

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
    resolved_root = root.resolve(strict=False)  # lgtm[py/path-injection] configured storage/vault root
    candidate = (resolved_root / safe_name).resolve(strict=False)  # lgtm[py/path-injection] basename and separator checked
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
    lock_path.parent.mkdir(parents=True, exist_ok=True)  # lgtm[py/path-injection] normalized artifact parent
    with _process_lock(resolved):
        with lock_path.open("a+b") as stream:  # lgtm[py/path-injection] normalized artifact sibling
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
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)
