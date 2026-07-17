from __future__ import annotations

import json
from pathlib import Path

import pytest

from features.agent_mode import chat


class InjectedCrash(Exception):
    pass


def _patch_dirs(monkeypatch: pytest.MonkeyPatch, root: Path) -> None:
    monkeypatch.setattr(chat, "DATA_DIR", root)
    monkeypatch.setattr(chat, "PROPOSALS_DIR", root / "agent-proposals")
    monkeypatch.setattr(chat, "BRIEFINGS_DIR", root / "briefings")
    monkeypatch.setattr(chat, "ANALYSIS_DIR", root / "company-analysis")
    monkeypatch.setattr(chat, "TOPIC_DIR", root / "topic-reports")


def _seed_briefing(root: Path) -> Path:
    path = root / "briefings" / "2026-07-17.us.json"
    path.parent.mkdir(parents=True)
    path.write_text(json.dumps({
        "date": "2026-07-17",
        "marketScope": "us",
        "markdown": "# Canonical\n\n## Evidence\n\n[source](https://example.com/source)",
        "sources": [{"url": "https://example.com/source"}],
    }), encoding="utf-8")
    return path


@pytest.mark.parametrize("crash_phase", ["prepared", "applying", "report_written", "terminal"])
def test_recovery_terminalizes_every_apply_journal_boundary(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
    crash_phase: str,
) -> None:
    _patch_dirs(monkeypatch, tmp_path)
    path = _seed_briefing(tmp_path)
    current = json.loads(path.read_text(encoding="utf-8"))["markdown"]
    proposal = chat.create_revision_proposal(
        kind="briefing",
        report_id="2026-07-17",
        market_scope="us",
        message="추가",
        summary="추가",
        revised_markdown=current + "\n\n추가",
        current_markdown=current,
    )
    monkeypatch.setattr(
        chat,
        "PROPOSAL_PHASE_HOOK",
        lambda phase: (_ for _ in ()).throw(InjectedCrash()) if phase == crash_phase else None,
    )

    with pytest.raises(InjectedCrash):
        chat.apply_proposal(proposal["id"])
    monkeypatch.setattr(chat, "PROPOSAL_PHASE_HOOK", lambda _phase: None)
    recovered = chat.recover_proposals()

    stored = chat.get_proposal(proposal["id"])
    assert recovered == 1
    assert stored is not None and stored["status"] == "applied"
    assert json.loads(path.read_text(encoding="utf-8"))["canonicalRevision"]["number"] == 2
    assert not list((tmp_path / "agent-proposals").glob("*.apply.json"))


def test_pin_valid_proposal_id_reads_its_exact_store_file(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    _patch_dirs(monkeypatch, tmp_path)
    path = _seed_briefing(tmp_path)
    current = json.loads(path.read_text(encoding="utf-8"))["markdown"]
    proposal = chat.create_revision_proposal(
        kind="briefing",
        report_id="2026-07-17",
        market_scope="us",
        message="추가",
        summary="추가",
        revised_markdown=current + "\n\n추가",
        current_markdown=current,
    )

    stored = chat.get_proposal(proposal["id"])

    assert stored is not None and stored["id"] == proposal["id"]
    assert (tmp_path / "agent-proposals" / f"{proposal['id']}.json").is_file()
