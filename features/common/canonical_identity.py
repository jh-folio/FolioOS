from __future__ import annotations

import json
import re
from enum import StrEnum
from pathlib import Path
from collections.abc import Mapping
from typing import Final, assert_never

from features.common.canonical_json import JsonValue

DATE_PATTERN: Final = re.compile(r"^\d{4}-\d{2}-\d{2}$")
SAFE_ID_PATTERN: Final = re.compile(r"^[A-Za-z0-9_-]{1,160}$")


class ReportKind(StrEnum):
    BRIEFING = "briefing"
    COMPANY_ANALYSIS = "company_analysis"
    TOPIC_REPORT = "topic_report"


class CanonicalIdentityError(Exception):
    __slots__ = ("code", "detail")

    def __init__(self, code: str, detail: str) -> None:
        super().__init__(detail)
        self.code = code
        self.detail = detail

    def __str__(self) -> str:
        return self.detail


class CanonicalNotFoundError(Exception):
    __slots__ = ("code", "report_id")

    def __init__(self, code: str, report_id: str) -> None:
        super().__init__(report_id)
        self.code = code
        self.report_id = report_id

    def __str__(self) -> str:
        return f"canonical report not found: {self.report_id}"


def _briefing_identity(report_id: str, market_scope: str | None) -> tuple[str, str | None]:
    normalized_scope = str(market_scope or "").strip().lower() or None
    if normalized_scope == "both":
        raise CanonicalIdentityError("briefing_overlay_scope_required", "briefing scope must be us or kr")
    if normalized_scope not in {None, "us", "kr"}:
        raise CanonicalIdentityError("briefing_scope_invalid", "briefing scope must be us or kr")
    match = re.fullmatch(r"(\d{4}-\d{2}-\d{2})(?:\.(us|kr))?", report_id)
    if match is None:
        raise CanonicalIdentityError("briefing_id_invalid", "briefing id must be YYYY-MM-DD[.us|.kr]")
    date_text, suffix = match.groups()
    if suffix is not None and normalized_scope is not None and suffix != normalized_scope:
        raise CanonicalIdentityError("briefing_scope_mismatch", "briefing id suffix and scope differ")
    return date_text, normalized_scope or suffix


def _read_report_id(path: Path) -> str | None:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        return None
    if not isinstance(value, dict):
        return None
    report_id = value.get("id")
    return report_id if isinstance(report_id, str) else None


def resolve_exact_report_path(
    data_root: Path,
    report_kind: ReportKind,
    report_id: str,
    market_scope: str | None = None,
) -> Path:
    match report_kind:
        case ReportKind.BRIEFING:
            date_text, scope = _briefing_identity(report_id, market_scope)
            filename = f"{date_text}.{scope}.json" if scope is not None else f"{date_text}.json"
            candidate = data_root / "briefings" / filename
            if candidate.is_file():
                return candidate
        case ReportKind.COMPANY_ANALYSIS:
            if SAFE_ID_PATTERN.fullmatch(report_id) is None:
                raise CanonicalIdentityError("company_report_id_invalid", "company report id is invalid")
            candidate = data_root / "company-analysis" / f"{report_id}.json"
            if candidate.is_file() and _read_report_id(candidate) in {None, report_id}:
                return candidate
        case ReportKind.TOPIC_REPORT:
            if SAFE_ID_PATTERN.fullmatch(report_id) is None:
                raise CanonicalIdentityError("topic_report_id_invalid", "topic report id is invalid")
            folder = data_root / "topic-reports"
            exact_matches = [path for path in sorted(folder.glob("*.json")) if _read_report_id(path) == report_id]
            if len(exact_matches) == 1:
                return exact_matches[0]
            if len(exact_matches) > 1:
                raise CanonicalIdentityError("topic_report_id_conflict", "multiple topic reports have the same exact id")
        case unreachable:
            assert_never(unreachable)
    raise CanonicalNotFoundError("canonical_report_not_found", report_id)


def validate_report_identity(
    report_kind: ReportKind,
    exact_path: Path,
    report: Mapping[str, JsonValue],
) -> None:
    match report_kind:
        case ReportKind.BRIEFING:
            match = re.fullmatch(r"(\d{4}-\d{2}-\d{2})(?:\.(us|kr))?\.json", exact_path.name)
            date_value = report.get("date")
            scope_value = report.get("marketScope")
            if match is None or date_value != match.group(1):
                raise CanonicalIdentityError("briefing_path_mismatch", "briefing date does not match exact path")
            if match.group(2) is not None and scope_value != match.group(2):
                raise CanonicalIdentityError("briefing_scope_mismatch", "briefing scope does not match exact path")
        case ReportKind.COMPANY_ANALYSIS:
            if report.get("id") != exact_path.stem:
                raise CanonicalIdentityError("company_report_id_mismatch", "company report id does not match exact path")
        case ReportKind.TOPIC_REPORT:
            report_id = report.get("id")
            if not isinstance(report_id, str) or not (
                exact_path.stem == report_id or exact_path.stem.endswith(f"_{report_id}")
            ):
                raise CanonicalIdentityError("topic_report_id_mismatch", "topic report id does not match exact path")
        case unreachable:
            assert_never(unreachable)
