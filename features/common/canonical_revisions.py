from __future__ import annotations

import re
from collections.abc import Mapping, Sequence
from copy import deepcopy
from dataclasses import dataclass
from typing import Final, TypeAlias, assert_never

from features.common.canonical_json import JsonValue
from features.common.canonical_reports import CanonicalValidationError, ReportKind
from features.common.research_quality.evaluator import evaluate_artifact

MAX_REVISED_MARKDOWN_CHARS: Final = 200_000
HEADING_PATTERN: Final = re.compile(r"^#{1,6}\s+(.+?)\s*$", re.MULTILINE)
URL_PATTERN: Final = re.compile(r"https?://[^\s<>\])}\"']+")
TYPED_REF_PATTERN: Final = re.compile(r"\b(source_id|document_id):([A-Za-z0-9._:-]{1,2048})\b")
SourceRef: TypeAlias = tuple[str, str]


@dataclass(frozen=True, slots=True)
class RevisionCandidate:
    report_kind: ReportKind
    candidate: dict[str, JsonValue]
    introduced_source_refs: tuple[SourceRef, ...]


def _artifact_type(report_kind: ReportKind) -> str:
    match report_kind:
        case ReportKind.BRIEFING:
            return "briefing"
        case ReportKind.COMPANY_ANALYSIS:
            return "company_analysis"
        case ReportKind.TOPIC_REPORT:
            return "topic_report"
        case unreachable:
            assert_never(unreachable)


def _headings(markdown: str) -> tuple[str, ...]:
    return tuple(match.group(1).strip().casefold() for match in HEADING_PATTERN.finditer(markdown))


def _source_refs(markdown: str) -> set[SourceRef]:
    urls = {("url", value) for value in URL_PATTERN.findall(markdown)}
    typed = {(match.group(1), match.group(2)) for match in TYPED_REF_PATTERN.finditer(markdown)}
    return urls | typed


def _allowed_values(allowed_source_refs: Sequence[Mapping[str, str]]) -> set[SourceRef]:
    values: set[SourceRef] = set()
    for item in allowed_source_refs:
        kind = item.get("kind")
        value = item.get("value")
        if kind not in {"url", "source_id", "document_id"} or not isinstance(value, str) or not value:
            raise CanonicalValidationError("source_validation_failed", "allowed source reference is invalid")
        values.add((kind, value))
    return values


def build_revision_candidate(
    report_kind: ReportKind,
    current: Mapping[str, JsonValue],
    revised_markdown: str,
    allowed_source_refs: Sequence[Mapping[str, str]] = (),
) -> RevisionCandidate:
    markdown = revised_markdown.strip()
    if not markdown or len(markdown) > MAX_REVISED_MARKDOWN_CHARS:
        raise CanonicalValidationError("revised_markdown_invalid", "revised markdown is empty or too large")
    current_markdown_value = current.get("markdown")
    if not isinstance(current_markdown_value, str) or not current_markdown_value.strip():
        raise CanonicalValidationError("canonical_markdown_invalid", "stored canonical markdown is invalid")
    missing_headings = [heading for heading in _headings(current_markdown_value) if heading not in _headings(markdown)]
    if missing_headings:
        raise CanonicalValidationError("required_section_missing", "revision removed a stored report section")
    introduced_refs = _source_refs(markdown) - _source_refs(current_markdown_value)
    unauthorized = introduced_refs - _allowed_values(allowed_source_refs)
    if unauthorized:
        raise CanonicalValidationError("source_validation_failed", "revision introduced an unapproved source reference")
    candidate = deepcopy(dict(current))
    candidate["markdown"] = markdown
    if markdown != current_markdown_value.strip():
        candidate["quality"] = evaluate_artifact(_artifact_type(report_kind), candidate)
    return RevisionCandidate(report_kind, candidate, tuple(sorted(introduced_refs)))


__all__ = ["RevisionCandidate", "build_revision_candidate"]
