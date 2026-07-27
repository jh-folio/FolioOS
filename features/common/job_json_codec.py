from __future__ import annotations

import gzip
import hashlib
import json
from copy import deepcopy
from pathlib import Path
from typing import assert_never

from features.common.canonical_json import JsonValue, canonical_json_bytes
from features.common.job_json_schema import JobArtifactValidationError
from features.common.shared_jobs_schema import JobMarker, StorageKind


def copy_json(value: dict[str, JsonValue]) -> dict[str, JsonValue]:
    return deepcopy(value)


def storage_hash(value: dict[str, JsonValue]) -> str:
    logical = {key: deepcopy(item) for key, item in value.items() if key != "jobCommit"}
    return hashlib.sha256(canonical_json_bytes(logical)).hexdigest()


def read_logical(path: Path, storage: StorageKind) -> dict[str, JsonValue] | None:
    if not path.exists():
        return None
    try:
        match storage:
            case StorageKind.JSON:
                raw = path.read_bytes()
            case StorageKind.GZIP_JSON:
                raw = gzip.decompress(path.read_bytes())
            case StorageKind.SQLITE:
                raise JobArtifactValidationError("sqlite is not a JSON artifact")
            case unreachable:
                assert_never(unreachable)
        parsed = json.loads(raw)
    except (OSError, EOFError, UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise JobArtifactValidationError(f"invalid JSON artifact: {path}") from exc
    if not isinstance(parsed, dict):
        raise JobArtifactValidationError("JSON artifact must be an object")
    canonical_json_bytes(parsed)
    return parsed


def serialize_logical(value: dict[str, JsonValue], storage: StorageKind) -> bytes:
    raw = (json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n").encode("utf-8")
    match storage:
        case StorageKind.JSON:
            return raw
        case StorageKind.GZIP_JSON:
            return gzip.compress(raw, compresslevel=6, mtime=0)
        case StorageKind.SQLITE:
            raise JobArtifactValidationError("sqlite is not a JSON artifact")
        case unreachable:
            assert_never(unreachable)


def marker(value: dict[str, JsonValue] | None) -> JobMarker | None:
    if value is None or "jobCommit" not in value:
        return None
    raw = value["jobCommit"]
    if not isinstance(raw, dict):
        raise JobArtifactValidationError("jobCommit must be an object")
    try:
        return JobMarker.model_validate(raw)
    except ValueError as exc:
        raise JobArtifactValidationError("jobCommit marker is invalid") from exc
