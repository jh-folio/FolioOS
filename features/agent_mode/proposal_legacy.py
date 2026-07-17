from __future__ import annotations

import json
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
    sha256_text,
)
from features.common.canonical_report_state import revision
from features.common.canonical_json import JsonValue


def normalize_legacy(paths: ProposalPaths, raw: Mapping[str, JsonValue]) -> ProposalRecord:
    proposal_id = raw.get("id")
    kind_value = raw.get("artifactKind")
    report_id = raw.get("artifactId")
    if not isinstance(proposal_id, str) or not isinstance(kind_value, str) or not isinstance(report_id, str):
        raise ProposalActionError("proposal_invalid", "기존 제안 형식이 올바르지 않습니다.", 500)
    kind = parse_report_kind(kind_value)
    scope = parse_market_scope(kind, str(raw.get("marketScope") or ""))
    current = ensure_revision(exact_path(paths, kind, report_id, scope), kind)
    current_revision = revision(current)
    if current_revision is None:
        raise ProposalActionError("proposal_invalid", "기존 보고서 revision이 없습니다.", 500)
    statuses = {
        "pending": ProposalStatus.PENDING,
        "applied": ProposalStatus.APPLIED,
        "rejected": ProposalStatus.REJECTED,
        "stale": ProposalStatus.STALE,
    }
    status = statuses.get(str(raw.get("status") or "pending"), ProposalStatus.FAILED_APPLY)
    revised_markdown = str(raw.get("revisedMarkdown") or "")
    diff = str(raw.get("diff") or "")
    request = str(raw.get("request") or "")[:2000]
    summary = str(raw.get("summary") or "")[:1000]
    active = status == ProposalStatus.PENDING
    timestamp = str(raw.get("createdAt") or now_utc_z()).replace("+00:00", "Z")
    if not timestamp.endswith("Z"):
        timestamp = now_utc_z()
    legacy_hash = sha256_text(json.dumps(raw, ensure_ascii=False, sort_keys=True, separators=(",", ":"), default=str))
    proposal = ProposalRecord(
        id=proposal_id,
        reportKind=kind,
        reportId=report_id,
        marketScope=scope,
        status=status,
        createdAt=timestamp,
        updatedAt=now_utc_z(),
        finishedAt=None if active else now_utc_z(),
        baseRevision=RevisionRef(number=current_revision[0], hash=current_revision[1]),
        targetRevision=RevisionRef(number=current_revision[0], hash=current_revision[1]) if status == ProposalStatus.APPLIED else None,
        operationId=None,
        errorCode=ProposalErrorCode.BASE_REVISION_STALE if status == ProposalStatus.STALE else None,
        requestHash=sha256_text(request),
        revisedMarkdownHash=sha256_text(revised_markdown),
        diffHash=sha256_text(diff),
        legacyNormalizationHash=legacy_hash,
        userRequest=request if active else None,
        summary=summary if active else None,
        revisedMarkdown=revised_markdown if active else None,
        diff=diff if active else None,
        adapter=str(raw.get("adapter") or "")[:120] if active else None,
        model=str(raw.get("model") or "")[:120] if active else None,
        allowedSourceRefs=allowed_source_refs(current) if active else None,
    )
    write_proposal(paths, proposal)
    return proposal


def read_normalized(paths: ProposalPaths, proposal_id: str) -> ProposalRecord | None:
    try:
        return read_proposal(paths, proposal_id)
    except ProposalStoreError:
        raw = read_raw(paths, proposal_id)
        if raw is None or raw.get("schemaVersion") == 2:
            raise
        return normalize_legacy(paths, raw)
