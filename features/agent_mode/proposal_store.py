from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

from pydantic import ValidationError

from features.agent_mode.proposal_schema import ProposalApplyJournal, ProposalRecord, parse_proposal_id
from features.common.canonical_json import JsonValue
from features.common.canonical_report_io import artifact_lock, atomic_write


@dataclass(frozen=True, slots=True)
class ProposalPaths:
    proposals_dir: Path
    data_root: Path

    def proposal(self, proposal_id: str) -> Path:
        return self.proposals_dir / f"{parse_proposal_id(proposal_id)}.json"

    def journal(self, proposal_id: str) -> Path:
        return self.proposals_dir / f"{parse_proposal_id(proposal_id)}.apply.json"


class ProposalStoreError(Exception):
    __slots__ = ("code", "detail")

    def __init__(self, code: str, detail: str) -> None:
        super().__init__(detail)
        self.code = code
        self.detail = detail

    def __str__(self) -> str:
        return self.detail


def _read_json(path: Path) -> dict[str, JsonValue] | None:
    if not path.exists():
        return None
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ProposalStoreError("proposal_store_invalid", f"invalid proposal JSON: {path.name}") from exc
    if not isinstance(value, dict):
        raise ProposalStoreError("proposal_store_invalid", f"proposal JSON must be an object: {path.name}")
    return value


def read_raw(paths: ProposalPaths, proposal_id: str) -> dict[str, JsonValue] | None:
    return _read_json(paths.proposal(proposal_id))


def read_proposal(paths: ProposalPaths, proposal_id: str) -> ProposalRecord | None:
    value = read_raw(paths, proposal_id)
    if value is None:
        return None
    try:
        return ProposalRecord.model_validate(value)
    except ValidationError as exc:
        raise ProposalStoreError("proposal_store_invalid", f"invalid proposal record: {proposal_id}") from exc


def write_proposal(paths: ProposalPaths, proposal: ProposalRecord) -> None:
    path = paths.proposal(proposal.id)
    path.parent.mkdir(parents=True, exist_ok=True)
    atomic_write(path, (proposal.model_dump_json(indent=2) + "\n").encode("utf-8"))
    reread = read_proposal(paths, proposal.id)
    if reread != proposal:
        raise ProposalStoreError("proposal_save_failed", f"proposal reread mismatch: {proposal.id}")


def read_journal(paths: ProposalPaths, proposal_id: str) -> ProposalApplyJournal | None:
    value = _read_json(paths.journal(proposal_id))
    if value is None:
        return None
    try:
        return ProposalApplyJournal.model_validate(value)
    except ValidationError as exc:
        raise ProposalStoreError("proposal_journal_invalid", f"invalid proposal journal: {proposal_id}") from exc


def write_journal(paths: ProposalPaths, journal: ProposalApplyJournal) -> None:
    path = paths.journal(journal.proposalId)
    path.parent.mkdir(parents=True, exist_ok=True)
    atomic_write(path, (journal.model_dump_json(indent=2) + "\n").encode("utf-8"))
    reread = read_journal(paths, journal.proposalId)
    if reread != journal:
        raise ProposalStoreError("proposal_journal_save_failed", f"proposal journal reread mismatch: {journal.proposalId}")


def proposal_lock(paths: ProposalPaths, proposal_id: str):
    return artifact_lock(paths.proposal(proposal_id))
