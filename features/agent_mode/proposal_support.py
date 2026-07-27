from __future__ import annotations

import hashlib
import unicodedata
from collections.abc import Mapping, Sequence
from datetime import UTC, datetime
from pathlib import Path

from features.agent_mode.proposal_schema import (
    AllowedSourceRef,
    PENDING_ONLY_FIELDS,
    ProposalErrorCode,
    ProposalMarketScope,
    ProposalRecord,
    ProposalStatus,
    RevisionRef,
    SourceRefKind,
)
from features.agent_mode.proposal_store import ProposalPaths
from features.common.canonical_identity import CanonicalNotFoundError, ReportKind, resolve_exact_report_path
from features.common.canonical_json import JsonValue
from features.common.canonical_report_state import load_report, revision
from features.common.canonical_reports import WriteKind, commit_sync, prepare
from features.common.jcs import sha256_hex
from features.common.research_library.rss.policy import normalize_url


class ProposalActionError(ValueError):
    __slots__ = ("code", "detail", "status_code")

    def __init__(self, code: str, detail: str, status_code: int) -> None:
        super().__init__(detail)
        self.code = code
        self.detail = detail
        self.status_code = status_code

    def __str__(self) -> str:
        return self.detail


def now_utc_z() -> str:
    return datetime.now(UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def normalize_line_endings(value: str) -> str:
    return value.replace("\r\n", "\n").replace("\r", "\n")


def sha256_normalized_text(value: str) -> str:
    return sha256_text(normalize_line_endings(value))


def proposal_request_hash(
    *,
    report_kind: str,
    report_id: str,
    market_scope: str,
    user_request: str,
    summary: str,
    base_revision: RevisionRef,
    adapter: str,
    model: str,
    allowed_refs: Sequence[AllowedSourceRef],
) -> str:
    refs = sorted(
        (item.model_dump(mode="json") for item in allowed_refs),
        key=lambda item: (str(item["kind"]), str(item["value"])),
    )
    return sha256_hex({
        "reportKind": report_kind,
        "reportId": report_id,
        "marketScope": market_scope,
        "userRequest": user_request,
        "summary": summary,
        "baseRevision": base_revision.model_dump(mode="json"),
        "adapter": adapter,
        "model": model,
        "allowedSourceRefs": refs,
    })


def parse_report_kind(value: str) -> ReportKind:
    try:
        return ReportKind(value)
    except ValueError as exc:
        raise ProposalActionError("proposal_invalid", "지원하지 않는 보고서 종류입니다.", 422) from exc


def parse_market_scope(kind: ReportKind, value: str) -> ProposalMarketScope:
    normalized = value.strip().lower()
    if kind == ReportKind.BRIEFING:
        normalized = normalized or ProposalMarketScope.BOTH
    else:
        normalized = ProposalMarketScope.NONE
    try:
        return ProposalMarketScope(normalized)
    except ValueError as exc:
        raise ProposalActionError("proposal_invalid", "지원하지 않는 시장 범위입니다.", 422) from exc


def exact_path(paths: ProposalPaths, kind: ReportKind, report_id: str, scope: ProposalMarketScope) -> Path:
    market_scope = scope.value if scope in {ProposalMarketScope.US, ProposalMarketScope.KR} else None
    try:
        return resolve_exact_report_path(paths.data_root, kind, report_id, market_scope)
    except CanonicalNotFoundError as exc:
        raise ProposalActionError("proposal_not_found", "대상 보고서를 찾을 수 없습니다.", 404) from exc


def ensure_revision(path: Path, kind: ReportKind) -> dict[str, JsonValue]:
    current = load_report(path)
    if current is None:
        raise ProposalActionError("proposal_not_found", "대상 보고서를 찾을 수 없습니다.", 404)
    if revision(current) is None:
        commit_sync(prepare(
            report_kind=kind,
            exact_path=path,
            write_kind=WriteKind.CANONICAL,
            candidate=current,
            operation_id=None,
        ))
        current = load_report(path)
    if current is None or revision(current) is None:
        raise ProposalActionError("proposal_invalid", "보고서 revision을 초기화하지 못했습니다.", 500)
    return current


def allowed_source_refs(report: Mapping[str, JsonValue]) -> list[AllowedSourceRef]:
    refs: set[tuple[SourceRefKind, str]] = set()
    for container_name in ("sources", "sourceLedger", "evidenceItems"):
        container = report.get(container_name)
        if not isinstance(container, list):
            continue
        for item in container:
            if not isinstance(item, dict):
                continue
            for key, kind in (
                ("url", SourceRefKind.URL),
                ("sourceId", SourceRefKind.SOURCE_ID),
                ("id", SourceRefKind.SOURCE_ID),
                ("documentId", SourceRefKind.DOCUMENT_ID),
            ):
                value = item.get(key)
                if not isinstance(value, str) or not value.strip():
                    continue
                normalized = normalize_url(value) if kind == SourceRefKind.URL else unicodedata.normalize("NFKC", value).strip()
                if normalized:
                    refs.add((kind, normalized))
    markdown = report.get("markdown")
    if isinstance(markdown, str):
        for token in markdown.split():
            raw = token.strip("<>()[]{}\"'.,")
            if raw.startswith(("http://", "https://")):
                normalized = normalize_url(raw)
                if normalized:
                    refs.add((SourceRefKind.URL, normalized))
    ordered = sorted(refs, key=lambda item: (item[0].value, item[1]))[:200]
    return [AllowedSourceRef(kind=kind, value=value) for kind, value in ordered]


def terminal_record(
    proposal: ProposalRecord,
    status: ProposalStatus,
    error: ProposalErrorCode | None,
) -> ProposalRecord:
    updates: dict[str, JsonValue] = {
        "status": status,
        "updatedAt": now_utc_z(),
        "finishedAt": now_utc_z(),
        "errorCode": error,
    }
    updates.update({field: None for field in PENDING_ONLY_FIELDS})
    return proposal.model_copy(update=updates)


def proposal_projection(proposal: ProposalRecord) -> dict[str, JsonValue]:
    return {
        "proposalId": proposal.id,
        "status": proposal.status.value,
        "reportKind": proposal.reportKind.value,
        "reportId": proposal.reportId,
        "marketScope": proposal.marketScope.value,
        "targetRevision": proposal.targetRevision.model_dump(mode="json") if proposal.targetRevision is not None else None,
    }
