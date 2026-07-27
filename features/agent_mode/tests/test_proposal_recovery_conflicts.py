from __future__ import annotations

import json
from collections.abc import Callable, Mapping
from contextlib import AbstractContextManager
from dataclasses import dataclass
from pathlib import Path

import pytest
from fastapi import HTTPException

import app
from features.agent_mode import chat, proposal_service, proposal_store
from features.agent_mode.proposal_schema import ProposalIdError
from features.agent_mode.proposal_service import ProposalActionError, ProposalPaths, get_proposal, recover_all
from features.agent_mode.proposal_store import ProposalStoreError
from features.common.canonical_identity import ReportKind
from features.common.canonical_json import JsonValue
from features.common.canonical_reports import WriteKind, commit_sync, prepare


class InjectedCrash(Exception):
    pass


class UnexpectedFilesystemLookup(Exception):
    pass


@dataclass(frozen=True, slots=True)
class UuidValue:
    hex: str


class UuidSequence:
    def __init__(self, values: tuple[UuidValue, ...]) -> None:
        self._values = iter(values)

    def uuid4(self) -> UuidValue:
        return next(self._values)


def _patch_dirs(monkeypatch: pytest.MonkeyPatch, root: Path) -> None:
    monkeypatch.setattr(chat, "DATA_DIR", root)
    monkeypatch.setattr(chat, "PROPOSALS_DIR", root / "agent-proposals")
    monkeypatch.setattr(chat, "BRIEFINGS_DIR", root / "briefings")
    monkeypatch.setattr(chat, "ANALYSIS_DIR", root / "company-analysis")
    monkeypatch.setattr(chat, "TOPIC_DIR", root / "topic-reports")


def _seed_briefing(root: Path, date: str) -> Path:
    path = root / "briefings" / f"{date}.us.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps({
        "date": date,
        "marketScope": "us",
        "markdown": "# Canonical\n\n## Evidence\n\n[source](https://example.com/source)",
        "sources": [{"url": "https://example.com/source"}],
    }), encoding="utf-8")
    return path


def _proposal(path: Path, date: str) -> Mapping[str, JsonValue]:
    current = json.loads(path.read_text(encoding="utf-8"))["markdown"]
    return chat.create_revision_proposal(
        kind="briefing",
        report_id=date,
        market_scope="us",
        message="추가",
        summary="추가",
        revised_markdown=current + "\n\n추가",
        current_markdown=current,
    )


def _advance(path: Path, operation_id: str) -> None:
    current = json.loads(path.read_text(encoding="utf-8"))
    commit_sync(prepare(
        report_kind=ReportKind.BRIEFING,
        exact_path=path,
        write_kind=WriteKind.CANONICAL,
        candidate={**current, "markdown": str(current["markdown"]) + "\n\nexternal"},
        operation_id=operation_id,
    ))


def _crash_at(target: str) -> Callable[[str], None]:
    def hook(phase: str) -> None:
        if phase == target:
            raise InjectedCrash

    return hook


def test_recovery_terminalizes_prepared_journal_when_base_became_stale(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    _patch_dirs(monkeypatch, tmp_path)
    path = _seed_briefing(tmp_path, "2026-07-17")
    proposal = _proposal(path, "2026-07-17")
    monkeypatch.setattr(chat, "PROPOSAL_PHASE_HOOK", _crash_at("prepared"))
    with pytest.raises(InjectedCrash):
        chat.apply_proposal(proposal["id"])
    _advance(path, "external_stale")
    monkeypatch.setattr(chat, "PROPOSAL_PHASE_HOOK", lambda _phase: None)

    recovered = chat.recover_proposals()

    stored = chat.get_proposal(proposal["id"])
    assert recovered == 1
    assert stored is not None and stored["status"] == "stale"
    assert not list((tmp_path / "agent-proposals").glob("*.apply.json"))
    assert chat.recover_proposals() == 0


def test_report_written_conflict_is_retired_and_next_journal_recovers(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    _patch_dirs(monkeypatch, tmp_path)
    uuid_values = UuidSequence((
        UuidValue("11111111111111111111111111111111"),
        UuidValue("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
        UuidValue("22222222222222222222222222222222"),
        UuidValue("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"),
    ))
    monkeypatch.setattr(proposal_service, "uuid", uuid_values)
    conflict_path = _seed_briefing(tmp_path, "2026-07-17")
    conflict = _proposal(conflict_path, "2026-07-17")
    monkeypatch.setattr(chat, "PROPOSAL_PHASE_HOOK", _crash_at("report_written"))
    with pytest.raises(InjectedCrash):
        chat.apply_proposal(conflict["id"])
    _advance(conflict_path, "external_conflict")
    healthy_path = _seed_briefing(tmp_path, "2026-07-18")
    healthy = _proposal(healthy_path, "2026-07-18")
    monkeypatch.setattr(chat, "PROPOSAL_PHASE_HOOK", _crash_at("prepared"))
    with pytest.raises(InjectedCrash):
        chat.apply_proposal(healthy["id"])
    monkeypatch.setattr(chat, "PROPOSAL_PHASE_HOOK", lambda _phase: None)

    recovered = chat.recover_proposals()

    conflict_stored = chat.get_proposal(conflict["id"])
    healthy_stored = chat.get_proposal(healthy["id"])
    assert recovered == 2
    assert conflict_stored is not None and conflict_stored["status"] == "conflict"
    assert healthy_stored is not None and healthy_stored["status"] == "applied"
    assert not list((tmp_path / "agent-proposals").glob("*.apply.json"))
    assert chat.recover_proposals() == 0
    assert json.loads(conflict_path.read_text(encoding="utf-8"))["canonicalRevision"]["number"] == 3
    assert json.loads(healthy_path.read_text(encoding="utf-8"))["canonicalRevision"]["number"] == 2


@pytest.mark.parametrize("proposal_id", ["not-hex", "..\\outside", "C:\\temp\\proposal", "../outside"])
def test_malformed_proposal_id_is_rejected_before_lock_or_lookup(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
    proposal_id: str,
) -> None:
    paths = ProposalPaths(tmp_path / "agent-proposals", tmp_path)

    def unexpected_lock(_path: Path) -> AbstractContextManager[None]:
        raise UnexpectedFilesystemLookup

    monkeypatch.setattr(proposal_store, "artifact_lock", unexpected_lock)
    with pytest.raises(ProposalActionError) as raised:
        get_proposal(paths, proposal_id)

    assert raised.value.status_code == 422
    assert raised.value.code == "proposal_id_invalid"


@pytest.mark.parametrize("proposal_id", ["not-hex", "..\\outside"])
def test_http_get_rejects_malformed_proposal_id(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
    proposal_id: str,
) -> None:
    _patch_dirs(monkeypatch, tmp_path)

    with pytest.raises(HTTPException) as raised:
        app.api_agent_proposal(proposal_id)

    assert raised.value.status_code == 422
    assert raised.value.detail["code"] == "proposal_id_invalid"


def test_recovery_does_not_swallow_invalid_journal_json(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    _patch_dirs(monkeypatch, tmp_path)
    path = _seed_briefing(tmp_path, "2026-07-17")
    proposal = _proposal(path, "2026-07-17")
    journal_path = tmp_path / "agent-proposals" / f"{proposal['id']}.apply.json"
    journal_path.write_text("{", encoding="utf-8")

    with pytest.raises(ProposalStoreError) as raised:
        recover_all(ProposalPaths(tmp_path / "agent-proposals", tmp_path))

    assert raised.value.code == "proposal_store_invalid"


def test_recovery_parses_journal_id_before_lock(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    proposals_dir = tmp_path / "agent-proposals"
    proposals_dir.mkdir()
    (proposals_dir / "not-hex.apply.json").write_text("{}", encoding="utf-8")

    def unexpected_lock(_path: Path) -> AbstractContextManager[None]:
        raise UnexpectedFilesystemLookup

    monkeypatch.setattr(proposal_store, "artifact_lock", unexpected_lock)
    with pytest.raises(ProposalIdError):
        recover_all(ProposalPaths(proposals_dir, tmp_path))
