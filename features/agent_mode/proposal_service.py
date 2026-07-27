from __future__ import annotations

import uuid
from collections.abc import Callable
from typing import Final, assert_never

from features.agent_mode.proposal_candidate import approval_candidate, report_matches_target
from features.agent_mode.proposal_legacy import read_normalized
from features.agent_mode.proposal_schema import (
    JournalStatus,
    ProposalAction,
    ProposalApplyJournal,
    ProposalErrorCode,
    ProposalIdError,
    ProposalRecord,
    ProposalStatus,
    RevisionRef,
    parse_proposal_id,
)
from features.agent_mode.proposal_store import (
    ProposalPaths,
    proposal_lock,
    read_journal,
    write_journal,
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
    proposal_projection,
    proposal_request_hash,
    sha256_normalized_text,
    terminal_record,
)
from features.common.canonical_json import JsonValue
from features.common.canonical_report_state import revision
from features.common.canonical_reports import (
    CanonicalConflictError,
    CanonicalValidationError,
    WriteKind,
    commit_sync,
    prepare,
)

PhaseHook = Callable[[str], None]
NO_PHASE_HOOK: Final[PhaseHook] = lambda _phase: None


def create_proposal(
    paths: ProposalPaths,
    *,
    kind: str,
    report_id: str,
    market_scope: str,
    message: str,
    summary: str,
    revised_markdown: str,
    current_markdown: str,
    diff: str,
    adapter: str,
    model: str,
) -> ProposalRecord:
    report_kind = parse_report_kind(kind)
    scope = parse_market_scope(report_kind, market_scope)
    path = exact_path(paths, report_kind, report_id, scope)
    current = ensure_revision(path, report_kind)
    stored_markdown = current.get("markdown")
    if not isinstance(stored_markdown, str) or stored_markdown != current_markdown:
        raise ProposalActionError("proposal_action_conflict", "보고서가 수정안 생성 중 변경되었습니다.", 409)
    current_revision = revision(current)
    if current_revision is None:
        raise ProposalActionError("proposal_invalid", "보고서 revision이 없습니다.", 500)
    base_revision = RevisionRef(number=current_revision[0], hash=current_revision[1])
    user_request = message[:2000]
    bounded_summary = summary[:1000]
    bounded_diff = diff[:100_000]
    bounded_adapter = adapter[:120]
    bounded_model = model[:120]
    source_refs = allowed_source_refs(current)
    proposal = ProposalRecord(
        id=uuid.uuid4().hex,
        reportKind=report_kind,
        reportId=report_id,
        marketScope=scope,
        status=ProposalStatus.PENDING,
        createdAt=now_utc_z(),
        updatedAt=now_utc_z(),
        finishedAt=None,
        baseRevision=base_revision,
        targetRevision=None,
        operationId=None,
        errorCode=None,
        requestHash=proposal_request_hash(
            report_kind=report_kind.value,
            report_id=report_id,
            market_scope=scope.value,
            user_request=user_request,
            summary=bounded_summary,
            base_revision=base_revision,
            adapter=bounded_adapter,
            model=bounded_model,
            allowed_refs=source_refs,
        ),
        revisedMarkdownHash=sha256_normalized_text(revised_markdown),
        diffHash=sha256_normalized_text(bounded_diff),
        legacyNormalizationHash=None,
        userRequest=user_request,
        summary=bounded_summary,
        revisedMarkdown=revised_markdown,
        diff=bounded_diff,
        adapter=bounded_adapter,
        model=bounded_model,
        allowedSourceRefs=source_refs,
    )
    write_proposal(paths, proposal)
    return proposal


def _persist_apply_failure(paths: ProposalPaths, proposal: ProposalRecord, status: ProposalStatus, error: ProposalErrorCode) -> None:
    write_proposal(paths, terminal_record(proposal, status, error))


def _validated_proposal_id(value: str) -> str:
    try:
        return parse_proposal_id(value)
    except ProposalIdError as exc:
        raise ProposalActionError("proposal_id_invalid", "proposal identifier is invalid", 422) from exc


def _approve_locked(paths: ProposalPaths, proposal: ProposalRecord, phase_hook: PhaseHook) -> dict[str, JsonValue]:
    path = exact_path(paths, proposal.reportKind, proposal.reportId, proposal.marketScope)
    current = ensure_revision(path, proposal.reportKind)
    current_revision = revision(current)
    if current_revision is None:
        raise ProposalActionError("proposal_invalid", "보고서 revision이 없습니다.", 500)
    journal = read_journal(paths, proposal.id)
    if journal is not None and report_matches_target(current, journal):
        terminal = terminal_record(proposal.model_copy(update={"operationId": journal.operationId, "targetRevision": journal.targetRevision}), ProposalStatus.APPLIED, None)
        write_proposal(paths, terminal)
        paths.journal(proposal.id).unlink(missing_ok=True)
        return proposal_projection(terminal)
    if journal is not None and journal.status == JournalStatus.REPORT_WRITTEN:
        _persist_apply_failure(paths, proposal, ProposalStatus.CONFLICT, ProposalErrorCode.RECOVERY_CONFLICT)
        paths.journal(proposal.id).unlink(missing_ok=True)
        raise ProposalActionError("proposal_action_conflict", "제안 복구 중 보고서 충돌을 확인했습니다.", 409)
    if (current_revision[0], current_revision[1]) != (proposal.baseRevision.number, proposal.baseRevision.hash):
        _persist_apply_failure(paths, proposal, ProposalStatus.STALE, ProposalErrorCode.BASE_REVISION_STALE)
        if journal is not None:
            paths.journal(proposal.id).unlink(missing_ok=True)
        raise ProposalActionError("proposal_stale", "제안 생성 이후 보고서가 변경되어 적용할 수 없습니다.", 409)
    operation_id = journal.operationId if journal is not None else f"proposal_{uuid.uuid4().hex}"
    try:
        candidate, _allowed = approval_candidate(proposal, current, operation_id)
        prepared = prepare(
            report_kind=proposal.reportKind,
            exact_path=path,
            write_kind=WriteKind.CANONICAL,
            candidate=candidate,
            operation_id=operation_id,
        )
    except ProposalActionError:
        raise
    except CanonicalValidationError as exc:
        error_map = {
            "source_validation_failed": ProposalErrorCode.SOURCE_VALIDATION_FAILED,
            "required_section_missing": ProposalErrorCode.REQUIRED_SECTION_MISSING,
        }
        error = error_map.get(exc.code, ProposalErrorCode.QUALITY_VALIDATION_FAILED)
        _persist_apply_failure(paths, proposal, ProposalStatus.FAILED_APPLY, error)
        raise ProposalActionError("proposal_validation_failed", "proposal validation failed", 409) from exc
    except Exception as exc:
        _persist_apply_failure(paths, proposal, ProposalStatus.FAILED_APPLY, ProposalErrorCode.INTERNAL_ERROR)
        raise ProposalActionError(
            "proposal_apply_failed",
            "제안 적용 중 내부 오류가 발생했습니다.",
            500,
        ) from exc
    target_revision = RevisionRef(number=prepared.target_revision, hash=prepared.canonical_content_hash)
    if journal is None:
        journal = ProposalApplyJournal(
            proposalId=proposal.id,
            operationId=operation_id,
            reportKind=proposal.reportKind,
            reportId=proposal.reportId,
            baseRevision=proposal.baseRevision,
            targetRevision=target_revision,
            status=JournalStatus.PREPARED,
        )
        write_journal(paths, journal)
        phase_hook("prepared")
    applying = proposal.model_copy(update={
        "status": ProposalStatus.APPLYING,
        "updatedAt": now_utc_z(),
        "operationId": operation_id,
        "targetRevision": target_revision,
    })
    write_proposal(paths, applying)
    phase_hook("applying")
    try:
        commit_sync(prepared)
    except CanonicalConflictError as exc:
        _persist_apply_failure(paths, applying, ProposalStatus.CONFLICT, ProposalErrorCode.RECOVERY_CONFLICT)
        paths.journal(proposal.id).unlink(missing_ok=True)
        raise ProposalActionError("proposal_action_conflict", "proposal action conflict", 409) from exc
    written = journal.model_copy(update={"status": JournalStatus.REPORT_WRITTEN})
    write_journal(paths, written)
    phase_hook("report_written")
    applied = terminal_record(applying, ProposalStatus.APPLIED, None)
    write_proposal(paths, applied)
    phase_hook("terminal")
    paths.journal(proposal.id).unlink(missing_ok=True)
    return proposal_projection(applied)


def get_proposal(paths: ProposalPaths, proposal_id: str) -> ProposalRecord | None:
    proposal_id = _validated_proposal_id(proposal_id)
    with proposal_lock(paths, proposal_id):
        return read_normalized(paths, proposal_id, persist_legacy=False)


def act_on_proposal(
    paths: ProposalPaths,
    proposal_id: str,
    action: ProposalAction,
    phase_hook: PhaseHook = NO_PHASE_HOOK,
) -> dict[str, JsonValue]:
    proposal_id = _validated_proposal_id(proposal_id)
    with proposal_lock(paths, proposal_id):
        proposal = read_normalized(paths, proposal_id)
        if proposal is None:
            raise ProposalActionError("proposal_not_found", "제안을 찾을 수 없습니다.", 404)
        if proposal.status == ProposalStatus.APPLYING:
            raise ProposalActionError("proposal_action_conflict", "적용 중인 제안입니다.", 409)
        if proposal.status == ProposalStatus.APPLIED and action == ProposalAction.APPROVE:
            return proposal_projection(proposal)
        if proposal.status == ProposalStatus.REJECTED and action == ProposalAction.REJECT:
            return proposal_projection(proposal)
        if proposal.status not in {ProposalStatus.PENDING, ProposalStatus.APPLYING}:
            raise ProposalActionError("proposal_action_conflict", f"이미 처리된 제안입니다({proposal.status.value}).", 409)
        if action == ProposalAction.REJECT:
            if proposal.status == ProposalStatus.APPLYING or read_journal(paths, proposal_id) is not None:
                raise ProposalActionError("proposal_action_conflict", "적용 중인 제안은 거절할 수 없습니다.", 409)
            rejected = terminal_record(proposal, ProposalStatus.REJECTED, None)
            write_proposal(paths, rejected)
            return proposal_projection(rejected)
        if action == ProposalAction.APPROVE:
            return _approve_locked(paths, proposal, phase_hook)
        assert_never(action)


def recover_all(paths: ProposalPaths, phase_hook: PhaseHook = NO_PHASE_HOOK) -> int:
    paths.proposals_dir.mkdir(parents=True, exist_ok=True)
    recovered = 0
    for journal_path in sorted(paths.proposals_dir.glob("*.apply.json")):
        proposal_id = journal_path.name.removesuffix(".apply.json")
        with proposal_lock(paths, proposal_id):
            proposal = read_normalized(paths, proposal_id)
            if proposal is None:
                continue
            try:
                _approve_locked(paths, proposal, phase_hook)
            except ProposalActionError as exc:
                if exc.code not in {"proposal_stale", "proposal_action_conflict"}:
                    raise
            recovered += 1
    return recovered


__all__ = [
    "NO_PHASE_HOOK",
    "ProposalActionError",
    "ProposalPaths",
    "act_on_proposal",
    "create_proposal",
    "get_proposal",
    "recover_all",
]
