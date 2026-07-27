from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from pathlib import Path

from features.common.canonical_identity import ReportKind
from features.common.canonical_json import JsonValue


class WriteKind(StrEnum):
    CANONICAL = "canonical"
    OVERLAY = "overlay"


class CanonicalConflictError(Exception):
    __slots__ = ("code", "detail")

    def __init__(self, code: str, detail: str) -> None:
        super().__init__(detail)
        self.code = code
        self.detail = detail

    def __str__(self) -> str:
        return self.detail


class CanonicalValidationError(Exception):
    __slots__ = ("code", "detail")

    def __init__(self, code: str, detail: str) -> None:
        super().__init__(detail)
        self.code = code
        self.detail = detail

    def __str__(self) -> str:
        return self.detail


@dataclass(frozen=True, slots=True)
class PreparedCanonicalWrite:
    report_kind: ReportKind
    exact_path: Path
    base_hash: str | None
    base_marker: dict[str, JsonValue] | None
    target_hash: str
    target_revision: int
    canonical_content_hash: str
    canonical_changed: bool
    serialized_bytes: bytes
    operation_id: str | None
    target_marker: dict[str, JsonValue] | None
