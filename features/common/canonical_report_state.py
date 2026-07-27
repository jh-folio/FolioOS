from __future__ import annotations

import hashlib
import json
from collections.abc import Mapping
from copy import deepcopy
from pathlib import Path
from typing import Final

from features.common.canonical_json import JsonValue, canonical_json_bytes
from features.common.canonical_report_io import safe_child_path
from features.common.canonical_report_types import (
    CanonicalConflictError,
    CanonicalValidationError,
    PreparedCanonicalWrite,
)

CANONICAL_EXCLUDED_FIELDS: Final = frozenset(
    {"canonicalRevision", "agentRevisions", "personalOverlay", "updatedAt", "jobCommit"}
)


def _sha256(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def _revision_updated_at(
    current: Mapping[str, JsonValue] | None,
    target: Mapping[str, JsonValue],
) -> str:
    candidates = [target.get(key) for key in ("updatedAt", "generatedAt", "savedAt")]
    if current is not None:
        candidates.extend(current.get(key) for key in ("updatedAt", "generatedAt", "savedAt"))
    for value in candidates:
        if isinstance(value, str) and value.endswith("Z"):
            return value
    return "1970-01-01T00:00:00.000Z"


def copy_mapping(value: Mapping[str, JsonValue]) -> dict[str, JsonValue]:
    return deepcopy(dict(value))


def canonical_content_hash(report: Mapping[str, JsonValue]) -> str:
    content = {key: deepcopy(value) for key, value in report.items() if key not in CANONICAL_EXCLUDED_FIELDS}
    return _sha256(canonical_json_bytes(content))


def storage_hash(report: Mapping[str, JsonValue]) -> str:
    content = {key: deepcopy(value) for key, value in report.items() if key != "jobCommit"}
    return _sha256(canonical_json_bytes(content))


def marker(report: Mapping[str, JsonValue] | None) -> dict[str, JsonValue] | None:
    if report is None or "jobCommit" not in report:
        return None
    value = report["jobCommit"]
    if not isinstance(value, dict):
        raise CanonicalValidationError("job_marker_invalid", "jobCommit must be an object")
    if set(value) != {"jobId", "operationId"}:
        raise CanonicalValidationError("job_marker_invalid", "jobCommit fields are invalid")
    if not all(isinstance(value.get(key), str) and value[key] for key in ("jobId", "operationId")):
        raise CanonicalValidationError("job_marker_invalid", "jobCommit values are invalid")
    return deepcopy(value)


def load_report(path: Path) -> dict[str, JsonValue] | None:
    path = safe_child_path(path.parent, path.name)
    if not path.exists():  # lgtm[py/path-injection] safe_child_path-bound
        return None
    try:
        value = json.loads(path.read_text(encoding="utf-8"))  # lgtm[py/path-injection] safe_child_path-bound
    except (OSError, UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise CanonicalValidationError("canonical_json_invalid", f"cannot read canonical report: {path}") from exc
    if not isinstance(value, dict):
        raise CanonicalValidationError("canonical_json_invalid", "canonical report must be a JSON object")
    canonical_json_bytes(value)
    return value


def revision(report: Mapping[str, JsonValue]) -> tuple[int, str] | None:
    value = report.get("canonicalRevision")
    if value is None:
        return None
    if not isinstance(value, dict):
        raise CanonicalValidationError("canonical_revision_invalid", "canonicalRevision must be an object")
    number = value.get("number")
    revision_hash = value.get("hash")
    if not isinstance(number, int) or isinstance(number, bool) or number < 1 or not isinstance(revision_hash, str):
        raise CanonicalValidationError("canonical_revision_invalid", "canonicalRevision number/hash are invalid")
    if revision_hash != canonical_content_hash(report):
        raise CanonicalValidationError("canonical_revision_hash_invalid", "canonicalRevision hash does not match content")
    return number, revision_hash


def serialize(report: Mapping[str, JsonValue]) -> bytes:
    canonical_json_bytes(dict(report))
    return (json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True) + "\n").encode("utf-8")


def _mark_overlay_stale(report: dict[str, JsonValue]) -> None:
    overlay = report.get("personalOverlay")
    if isinstance(overlay, dict):
        updated = deepcopy(overlay)
        updated["stale"] = True
        updated["staleReason"] = "canonical_revision_changed"
        report["personalOverlay"] = updated


def canonical_candidate(
    current: dict[str, JsonValue] | None,
    candidate: Mapping[str, JsonValue],
    operation_id: str | None,
) -> tuple[dict[str, JsonValue], int, str, bool]:
    target = copy_mapping(candidate)
    target.pop("canonicalRevision", None)
    target.pop("jobCommit", None)
    current_hash = canonical_content_hash(current) if current is not None else None
    target_content_hash = canonical_content_hash(target)
    changed = current_hash != target_content_hash
    current_revision = revision(current) if current is not None else None
    target_number = 1 if current_revision is None else current_revision[0] + (1 if changed else 0)
    if current is not None and "personalOverlay" in current:
        target["personalOverlay"] = deepcopy(current["personalOverlay"])
    if current is not None and "agentRevisions" in current and "agentRevisions" not in target:
        target["agentRevisions"] = deepcopy(current["agentRevisions"])
    if current is not None and changed:
        _mark_overlay_stale(target)
    if current_revision is not None and not changed:
        revision_value = deepcopy(current["canonicalRevision"])
        if not isinstance(revision_value, dict):
            raise CanonicalValidationError("canonical_revision_invalid", "canonicalRevision must be an object")
        if operation_id is not None:
            revision_value["lastOperationId"] = operation_id
        target["canonicalRevision"] = revision_value
    else:
        target["canonicalRevision"] = {
            "number": target_number,
            "hash": target_content_hash,
            "updatedAt": _revision_updated_at(current, target),
            "lastOperationId": operation_id,
        }
    return target, target_number, target_content_hash, changed


def overlay_candidate(
    current: dict[str, JsonValue] | None,
    candidate: Mapping[str, JsonValue],
) -> tuple[dict[str, JsonValue], int, str, bool]:
    if current is None:
        raise CanonicalValidationError("overlay_report_not_found", "Overlay write requires an existing report")
    target = deepcopy(current)
    target.pop("jobCommit", None)
    target["personalOverlay"] = deepcopy(candidate.get("personalOverlay"))
    current_revision = revision(current)
    content_hash = canonical_content_hash(current)
    if current_revision is None:
        target["canonicalRevision"] = {
            "number": 1,
            "hash": content_hash,
            "updatedAt": _revision_updated_at(current, target),
            "lastOperationId": None,
        }
        return target, 1, content_hash, False
    return target, current_revision[0], content_hash, False


def matches_target(current: dict[str, JsonValue] | None, prepared: PreparedCanonicalWrite) -> bool:
    if current is None or storage_hash(current) != prepared.target_hash or marker(current) != prepared.target_marker:
        return False
    current_revision = revision(current)
    return current_revision is not None and current_revision[0] == prepared.target_revision


def verify_base(current: dict[str, JsonValue] | None, prepared: PreparedCanonicalWrite) -> None:
    current_hash = storage_hash(current) if current is not None else None
    if current_hash != prepared.base_hash or marker(current) != prepared.base_marker:
        raise CanonicalConflictError("canonical_base_changed", "canonical report changed after prepare")


def verify_committed(prepared: PreparedCanonicalWrite) -> None:
    committed = load_report(prepared.exact_path)
    if not matches_target(committed, prepared):
        raise CanonicalConflictError("canonical_commit_verification_failed", "committed report verification failed")
    if committed is None or canonical_content_hash(committed) != prepared.canonical_content_hash:
        raise CanonicalConflictError("canonical_commit_verification_failed", "canonical content verification failed")
