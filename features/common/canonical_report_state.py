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

# 품질 재평가만으로 바뀌는 필드. 지문(canonical_content_hash)에서 빼지 않는다 —
# 빼면 기존 저장물의 canonicalRevision.hash가 전부 어긋나 그 보고서가 영구히 못 쓰게 된다.
# 대신 "본문이 실제로 바뀌었는가"를 따로 판정할 때만 제외한다.
CANONICAL_QUALITY_FIELDS: Final = frozenset({"quality"})


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


def substantive_content_hash(report: Mapping[str, JsonValue]) -> str:
    """quality를 뺀 내용 지문. 저장하지 않고 커밋 시 비교에만 쓴다."""
    content = {
        key: deepcopy(value)
        for key, value in report.items()
        if key not in CANONICAL_EXCLUDED_FIELDS and key not in CANONICAL_QUALITY_FIELDS
    }
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
    # Path is bound by safe_child_path.
    # codeql[py/path-injection]
    if not path.exists():
        return None
    try:
        # Path is bound by safe_child_path.
        # codeql[py/path-injection]
        value = json.loads(path.read_text(encoding="utf-8"))
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


def _advance_overlay_revision(
    report: dict[str, JsonValue],
    current_revision: tuple[int, str] | None,
    number: int,
    content_hash: str,
) -> None:
    """quality만 바뀐 커밋에서 overlay의 리비전 포인터만 따라 올린다.

    Canonical `markdown`이 그대로인데 "본문이 바뀌어 개인 해석이 낡았다"고 말하면 안 된다
    (§5 원칙 1). 하지만 quality는 지문에 포함돼 revision 번호·해시가 반드시 오르므로,
    포인터를 두면 `personal_overlay/schema.py::public_projection`이 번호·해시 불일치로
    stale을 낸다. 그래서 포인터를 새 리비전으로 옮긴다.

    overlay가 **지금** 리비전을 가리키고 있을 때만 옮긴다. 이미 낡은 overlay(옛 번호를
    가리키거나 stale 표시가 붙은 것)를 quality 재평가가 되살리면 안 된다.
    personalOverlay는 CANONICAL_EXCLUDED_FIELDS라 이 변경이 지문을 건드리지 않는다.
    """
    overlay = report.get("personalOverlay")
    if not isinstance(overlay, dict) or current_revision is None:
        return
    pointer = overlay.get("canonicalRevision")
    if not isinstance(pointer, dict):
        return
    if pointer.get("number") != current_revision[0] or pointer.get("hash") != current_revision[1]:
        return
    if overlay.get("stale") or overlay.get("staleReason"):
        return
    updated = deepcopy(overlay)
    updated["canonicalRevision"] = {"number": number, "hash": content_hash}
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
    # quality만 달라진 커밋(재평가)은 본문 변경이 아니다. revision은 지문에 quality가
    # 들어가므로 올라가지만, overlay를 stale로 찍는 대신 포인터만 따라 올린다.
    quality_only = (
        changed
        and current is not None
        and substantive_content_hash(current) == substantive_content_hash(target)
    )
    if current is not None and changed:
        if quality_only:
            _advance_overlay_revision(target, current_revision, target_number, target_content_hash)
        else:
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
