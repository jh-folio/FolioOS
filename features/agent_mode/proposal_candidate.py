from __future__ import annotations

from collections.abc import Mapping, Sequence
from copy import deepcopy

from features.agent_mode.proposal_schema import ProposalApplyJournal, ProposalRecord
from features.agent_mode.proposal_support import ProposalActionError, sha256_text
from features.common.canonical_json import JsonValue
from features.common.canonical_report_state import revision
from features.common.canonical_reports import canonical_content_hash
from features.common.canonical_revisions import build_revision_candidate


def report_matches_target(report: Mapping[str, JsonValue], journal: ProposalApplyJournal) -> bool:
    revision_value = report.get("canonicalRevision")
    return isinstance(revision_value, dict) and (
        revision_value.get("number") == journal.targetRevision.number
        and revision_value.get("hash") == journal.targetRevision.hash
        and revision_value.get("lastOperationId") == journal.operationId
    )


def _freeze_generated_quality_time(candidate: dict[str, JsonValue], timestamp: str) -> None:
    quality = candidate.get("quality")
    if isinstance(quality, dict):
        frozen_quality = deepcopy(quality)
        frozen_quality["generatedAt"] = timestamp
        candidate["quality"] = frozen_quality
    generation = candidate.get("qualityGeneration")
    if not isinstance(generation, dict):
        return
    frozen_generation = deepcopy(generation)
    quality_after = frozen_generation.get("qualityAfter")
    if isinstance(quality_after, dict):
        frozen_quality_after = deepcopy(quality_after)
        frozen_quality_after["generatedAt"] = timestamp
        frozen_generation["qualityAfter"] = frozen_quality_after
    candidate["qualityGeneration"] = frozen_generation


def approval_candidate(
    proposal: ProposalRecord,
    current: dict[str, JsonValue],
    operation_id: str,
) -> tuple[dict[str, JsonValue], Sequence[Mapping[str, str]]]:
    if proposal.revisedMarkdown is None or proposal.allowedSourceRefs is None or proposal.summary is None:
        raise ProposalActionError("proposal_invalid", "제안 본문이 없습니다.", 500)
    allowed = tuple(item.model_dump(mode="json") for item in proposal.allowedSourceRefs)
    candidate = build_revision_candidate(proposal.reportKind, current, proposal.revisedMarkdown, allowed).candidate
    _freeze_generated_quality_time(candidate, proposal.createdAt)
    revisions = candidate.get("agentRevisions")
    revision_items = deepcopy(revisions) if isinstance(revisions, list) else []
    current_revision = revision(current)
    if current_revision is None:
        raise ProposalActionError("proposal_invalid", "보고서 revision이 없습니다.", 500)
    revision_items.append({
        "at": proposal.createdAt,
        "proposalId": proposal.id,
        "operationId": operation_id,
        "summaryHash": sha256_text(proposal.summary),
        "adapter": proposal.adapter or "",
        "model": proposal.model or "",
        "fromRevision": current_revision[0],
        "toRevision": current_revision[0] + (1 if canonical_content_hash(candidate) != current_revision[1] else 0),
    })
    candidate["agentRevisions"] = revision_items[-50:]
    return candidate, allowed
