from __future__ import annotations

from collections.abc import Mapping

from features.agent_mode.proposal_schema import (
    ProposalErrorCode,
    ProposalRecord,
    ProposalStatus,
    RevisionRef,
)
from features.agent_mode.proposal_store import (
    ProposalPaths,
    ProposalStoreError,
    read_proposal,
    read_raw,
    write_proposal,
)
from features.agent_mode.proposal_support import (
    ProposalActionError,
    allowed_source_refs,
    ensure_revision,
    exact_path,
    now_utc_z,
    parse_market_scope,
    parse_report_kind,
    proposal_request_hash,
    sha256_normalized_text,
)
from features.common.canonical_json import JsonValue
from features.common.canonical_report_state import load_report, revision
from features.common.canonical_reports import canonical_content_hash
from features.common.jcs import sha256_hex


def normalize_legacy(
    paths: ProposalPaths,
    raw: Mapping[str, JsonValue],
    *,
    persist: bool = True,
) -> ProposalRecord:
    proposal_id = raw.get("id")
    kind_value = raw.get("artifactKind")
    report_id = raw.get("artifactId")
    if not isinstance(proposal_id, str) or not isinstance(kind_value, str) or not isinstance(report_id, str):
        raise ProposalActionError("proposal_invalid", "기존 제안 형식이 올바르지 않습니다.", 500)
    kind = parse_report_kind(kind_value)
    scope = parse_market_scope(kind, str(raw.get("marketScope") or ""))
    path = exact_path(paths, kind, report_id, scope)
    current = ensure_revision(path, kind) if persist else load_report(path)
    if current is None:
        raise ProposalActionError("proposal_not_found", "대상 보고서를 찾을 수 없습니다.", 404)
    current_revision = revision(current)
    if current_revision is None:
        current_revision = (1, canonical_content_hash(current))
    statuses = {
        "pending": ProposalStatus.PENDING,
        "applied": ProposalStatus.APPLIED,
        "rejected": ProposalStatus.REJECTED,
        "stale": ProposalStatus.STALE,
    }
    status = statuses.get(str(raw.get("status") or "pending"), ProposalStatus.FAILED_APPLY)
    revised_markdown = str(raw.get("revisedMarkdown") or "")
    diff = str(raw.get("diff") or "")[:100_000]
    request = str(raw.get("request") or "")[:2000]
    summary = str(raw.get("summary") or "")[:1000]
    active = status == ProposalStatus.PENDING
    timestamp = str(raw.get("createdAt") or now_utc_z()).replace("+00:00", "Z")
    if not timestamp.endswith("Z"):
        timestamp = now_utc_z()
    updated_at = str(raw.get("updatedAt") or timestamp).replace("+00:00", "Z")
    if not updated_at.endswith("Z"):
        updated_at = timestamp
    finished_at = str(raw.get("finishedAt") or updated_at).replace("+00:00", "Z")
    if not finished_at.endswith("Z"):
        finished_at = updated_at
    legacy_hash = sha256_hex(dict(raw))
    base_revision = RevisionRef(number=current_revision[0], hash=current_revision[1])
    adapter = str(raw.get("adapter") or "")[:120]
    model = str(raw.get("model") or "")[:120]
    source_refs = allowed_source_refs(current)
    proposal = ProposalRecord(
        id=proposal_id,
        reportKind=kind,
        reportId=report_id,
        marketScope=scope,
        status=status,
        createdAt=timestamp,
        updatedAt=updated_at,
        finishedAt=None if active else finished_at,
        baseRevision=base_revision,
        targetRevision=RevisionRef(number=current_revision[0], hash=current_revision[1]) if status == ProposalStatus.APPLIED else None,
        operationId=None,
        errorCode=ProposalErrorCode.BASE_REVISION_STALE if status == ProposalStatus.STALE else None,
        requestHash=proposal_request_hash(
            report_kind=kind.value,
            report_id=report_id,
            market_scope=scope.value,
            user_request=request,
            summary=summary,
            base_revision=base_revision,
            adapter=adapter,
            model=model,
            allowed_refs=source_refs,
        ),
        revisedMarkdownHash=sha256_normalized_text(revised_markdown),
        diffHash=sha256_normalized_text(diff),
        legacyNormalizationHash=legacy_hash,
        userRequest=request if active else None,
        summary=summary if active else None,
        revisedMarkdown=revised_markdown if active else None,
        diff=diff if active else None,
        adapter=adapter if active else None,
        model=model if active else None,
        allowedSourceRefs=source_refs if active else None,
    )
    if persist:
        write_proposal(paths, proposal)
    return proposal


def read_normalized(
    paths: ProposalPaths,
    proposal_id: str,
    *,
    persist_legacy: bool = True,
) -> ProposalRecord | None:
    try:
        return read_proposal(paths, proposal_id)
    except ProposalStoreError:
        raw = read_raw(paths, proposal_id)
        if raw is None or raw.get("schemaVersion") == 2:
            raise
        return normalize_legacy(paths, raw, persist=persist_legacy)
