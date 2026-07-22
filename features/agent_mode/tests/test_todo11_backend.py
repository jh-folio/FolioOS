from __future__ import annotations

import hashlib
import json
from datetime import UTC, datetime
from pathlib import Path
from uuid import UUID

import pytest
from fastapi import HTTPException

import app
from features.agent_mode import chat, proposal_candidate, proposal_service
from features.agent_mode.proposal_schema import ProposalAction, ProposalActionRequest, ProposalStatus, RevisionRef
from features.agent_mode.proposal_service import ProposalActionError
from features.agent_mode.proposal_store import read_proposal, write_proposal
from features.agent_mode.work_log import WorkLogService
from features.agent_mode.work_log_schema import WORK_LOG_ENTRY_KEYS
from features.common.canonical_json import JsonValue
from features.common.canonical_reports import ReportKind, WriteKind, commit_sync, prepare, storage_hash
from features.common.jcs import sha256_hex
from features.common.shared_jobs_projection import new_shared_job
from features.common.shared_jobs_store import SharedJobStore


NOW = datetime(2026, 7, 22, 3, 4, 5, tzinfo=UTC)


def _clock() -> datetime:
    return NOW


def _patch_dirs(monkeypatch: pytest.MonkeyPatch, root: Path) -> None:
    monkeypatch.setattr(chat, "DATA_DIR", root)
    monkeypatch.setattr(chat, "PROPOSALS_DIR", root / "agent-proposals")
    monkeypatch.setattr(chat, "BRIEFINGS_DIR", root / "briefings")
    monkeypatch.setattr(chat, "ANALYSIS_DIR", root / "company-analysis")
    monkeypatch.setattr(chat, "TOPIC_DIR", root / "topic-reports")


def _seed_briefing(root: Path) -> Path:
    path = root / "briefings" / "2026-07-22.us.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(
            {
                "date": "2026-07-22",
                "marketScope": "us",
                "markdown": (
                    "# Canonical\n\n## Evidence\n[source](https://example.test/source)"
                    "\n\n## 체크포인트\n- OLD_CHECKPOINT"
                ),
                "sources": [{"url": "https://example.test/source"}],
                "checkpoints": [{"checkpoint": "OLD_CHECKPOINT"}],
                "quality": {"score": 1, "grade": "F", "status": "fail"},
                "qualityGeneration": {"mode": "initial", "repairApplied": False},
                "personalOverlay": {"stale": False, "markdown": "PRIVATE_OVERLAY"},
                "immutableContext": {"canary": "KEEP_EXACT"},
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    return path


def _proposal(root: Path, monkeypatch: pytest.MonkeyPatch, *, line_endings: str = "\n") -> tuple[Path, dict]:
    _patch_dirs(monkeypatch, root)
    path = _seed_briefing(root)
    current = json.loads(path.read_text(encoding="utf-8"))["markdown"]
    revised = (
        "# Canonical\n\n## Evidence\n[source](https://example.test/source)"
        "\n\n## 체크포인트\n- NEW_CHECKPOINT with twelve characters"
    ).replace("\n", line_endings)
    proposal = chat.create_revision_proposal(
        kind="briefing",
        report_id="2026-07-22",
        market_scope="us",
        message="체크포인트를 최신화해 주세요",
        summary="체크포인트 최신화",
        revised_markdown=revised,
        current_markdown=current,
        adapter="codex",
        model="test-model",
    )
    return path, proposal


def _sha_bytes(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def test_proposal_request_hash_matches_normative_jcs_preimage(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    _path, proposal = _proposal(tmp_path, monkeypatch, line_endings="\r\n")
    request_preimage: dict[str, JsonValue] = {
        "reportKind": proposal["reportKind"],
        "reportId": proposal["reportId"],
        "marketScope": proposal["marketScope"],
        "userRequest": proposal["userRequest"],
        "summary": proposal["summary"],
        "baseRevision": proposal["baseRevision"],
        "adapter": proposal["adapter"],
        "model": proposal["model"],
        "allowedSourceRefs": sorted(
            proposal["allowedSourceRefs"],
            key=lambda item: (item["kind"], item["value"]),
        ),
    }
    assert proposal["requestHash"] == sha256_hex(request_preimage)


def test_proposal_text_hashes_use_lf_normalized_preimages(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    _path, proposal = _proposal(tmp_path, monkeypatch, line_endings="\r\n")
    normalized_markdown = proposal["revisedMarkdown"].replace("\r\n", "\n").replace("\r", "\n")
    normalized_diff = proposal["diff"].replace("\r\n", "\n").replace("\r", "\n")

    assert proposal["revisedMarkdownHash"] == hashlib.sha256(normalized_markdown.encode()).hexdigest()
    assert proposal["diffHash"] == hashlib.sha256(normalized_diff.encode()).hexdigest()


def test_diff_hash_binds_the_exact_bounded_stored_diff(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    _patch_dirs(monkeypatch, tmp_path)
    path = _seed_briefing(tmp_path)
    current = json.loads(path.read_text(encoding="utf-8"))["markdown"]
    proposal = chat.create_revision_proposal(
        kind="briefing",
        report_id="2026-07-22",
        market_scope="us",
        message="긴 수정",
        summary="긴 수정",
        revised_markdown=current + "\n" + ("x" * 120_000),
        current_markdown=current,
    )

    assert len(proposal["diff"]) == 100_000
    assert proposal["diffHash"] == hashlib.sha256(proposal["diff"].encode()).hexdigest()


def test_approve_has_exact_action_projection(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    _path, proposal = _proposal(tmp_path, monkeypatch)

    result = chat.apply_proposal(proposal["id"])

    assert set(result) == {
        "proposalId",
        "status",
        "reportKind",
        "reportId",
        "marketScope",
        "targetRevision",
    }


def test_approve_recomputes_structured_metadata(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    path, proposal = _proposal(tmp_path, monkeypatch)
    before = json.loads(path.read_text(encoding="utf-8"))

    chat.apply_proposal(proposal["id"])

    saved = json.loads(path.read_text(encoding="utf-8"))
    assert saved["checkpoints"] != before["checkpoints"]
    assert "NEW_CHECKPOINT" in saved["checkpoints"][0]["checkpoint"]
    assert saved["quality"] != before["quality"]
    assert saved["qualityGeneration"]["mode"] == "agent_proposal_revision"
    assert saved["qualityGeneration"]["qualityBefore"] == before["quality"]
    assert saved["qualityGeneration"]["qualityAfter"] == saved["quality"]
    assert saved["immutableContext"] == before["immutableContext"]
    assert saved["personalOverlay"]["stale"] is True
    assert saved["personalOverlay"]["staleReason"] == "canonical_revision_changed"


def test_applying_action_is_conflict_and_recovery_remains_separate(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    _path, proposal = _proposal(tmp_path, monkeypatch)
    paths = chat._proposal_paths()
    stored = read_proposal(paths, proposal["id"])
    assert stored is not None
    applying = stored.model_copy(
        update={
            "status": ProposalStatus.APPLYING,
            "operationId": "proposal_in_progress",
            "targetRevision": RevisionRef(number=2, hash="f" * 64),
        }
    )
    write_proposal(paths, applying)

    with pytest.raises(ProposalActionError) as raised:
        proposal_service.act_on_proposal(paths, proposal["id"], ProposalAction.APPROVE)

    assert raised.value.status_code == 409
    assert raised.value.code == "proposal_action_conflict"
    assert read_proposal(paths, proposal["id"]) == applying


def test_http_get_is_read_only_for_applying_proposal_until_startup_recovery(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    path, proposal = _proposal(tmp_path, monkeypatch)

    def crash_at_applying(phase: str) -> None:
        if phase == "applying":
            raise RuntimeError("injected applying interruption")

    monkeypatch.setattr(chat, "PROPOSAL_PHASE_HOOK", crash_at_applying)
    with pytest.raises(RuntimeError, match="applying interruption"):
        chat.apply_proposal(proposal["id"])

    paths = chat._proposal_paths()
    state_paths = (path, paths.proposal(proposal["id"]), paths.journal(proposal["id"]))
    before = {state_path: state_path.read_bytes() for state_path in state_paths}
    with pytest.raises(ProposalActionError) as raised:
        chat.apply_proposal(proposal["id"])
    assert raised.value.status_code == 409

    monkeypatch.setattr(chat, "PROPOSAL_PHASE_HOOK", lambda _phase: None)
    observed = app.api_agent_proposal(proposal["id"])

    assert observed["status"] == "applying"
    assert {state_path: state_path.read_bytes() for state_path in state_paths} == before
    recovered = chat.recover_proposals()
    assert recovered == 1
    assert chat.get_proposal(proposal["id"])["status"] == "applied"


def test_repeated_recovery_interruptions_keep_one_deterministic_target(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    path, proposal = _proposal(tmp_path, monkeypatch)
    generated_times = iter(
        (
            "2026-07-22T03:04:06Z",
            "2026-07-22T03:04:07Z",
        )
    )
    original_builder = proposal_candidate.build_revision_candidate

    def volatile_builder(*args, **kwargs):
        built = original_builder(*args, **kwargs)
        generated_at = next(generated_times)
        built.candidate["quality"]["generatedAt"] = generated_at
        built.candidate["qualityGeneration"]["qualityAfter"]["generatedAt"] = generated_at
        return built

    monkeypatch.setattr(proposal_candidate, "build_revision_candidate", volatile_builder)

    def crash_at(target: str):
        def hook(phase: str) -> None:
            if phase == target:
                raise RuntimeError(f"injected {target} interruption")

        return hook

    monkeypatch.setattr(chat, "PROPOSAL_PHASE_HOOK", crash_at("applying"))
    with pytest.raises(RuntimeError, match="applying interruption"):
        chat.apply_proposal(proposal["id"])

    monkeypatch.setattr(chat, "PROPOSAL_PHASE_HOOK", crash_at("report_written"))
    with pytest.raises(RuntimeError, match="report_written interruption"):
        chat.recover_proposals()

    monkeypatch.setattr(chat, "PROPOSAL_PHASE_HOOK", lambda _phase: None)
    recovered = chat.recover_proposals()
    saved = json.loads(path.read_text(encoding="utf-8"))

    assert recovered == 1
    assert chat.get_proposal(proposal["id"])["status"] == "applied"
    assert saved["canonicalRevision"]["number"] == 2
    assert len(saved["agentRevisions"]) == 1
    assert not list((tmp_path / "agent-proposals").glob("*.apply.json"))


def test_reject_and_stale_preserve_exact_report_bytes_and_hashes(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    reject_root = tmp_path / "reject"
    reject_path, reject_proposal = _proposal(reject_root, monkeypatch)
    reject_before = (reject_path.read_bytes(), _sha_bytes(reject_path), storage_hash(json.loads(reject_path.read_text(encoding="utf-8"))))

    rejected = chat.reject_proposal(reject_proposal["id"])

    assert rejected["status"] == "rejected"
    assert (reject_path.read_bytes(), _sha_bytes(reject_path), storage_hash(json.loads(reject_path.read_text(encoding="utf-8")))) == reject_before

    stale_root = tmp_path / "stale"
    stale_path, stale_proposal = _proposal(stale_root, monkeypatch)
    current = json.loads(stale_path.read_text(encoding="utf-8"))
    advanced = dict(current)
    advanced["markdown"] = current["markdown"] + "\n\nExternal canonical advance"
    commit_sync(
        prepare(
            report_kind=ReportKind.BRIEFING,
            exact_path=stale_path,
            write_kind=WriteKind.CANONICAL,
            candidate=advanced,
            operation_id="external_advance",
        )
    )
    stale_before = (stale_path.read_bytes(), _sha_bytes(stale_path), storage_hash(json.loads(stale_path.read_text(encoding="utf-8"))))

    with pytest.raises(ProposalActionError) as raised:
        chat.apply_proposal(stale_proposal["id"])

    assert raised.value.code == "proposal_stale"
    assert chat.get_proposal(stale_proposal["id"])["status"] == "stale"
    assert (stale_path.read_bytes(), _sha_bytes(stale_path), storage_hash(json.loads(stale_path.read_text(encoding="utf-8")))) == stale_before


def test_unexpected_apply_exception_is_safe_and_terminal(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    _path, proposal = _proposal(tmp_path, monkeypatch)
    canary = "PRIVATE_EXCEPTION_CANARY"
    monkeypatch.setattr(
        proposal_service,
        "approval_candidate",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(RuntimeError(canary)),
    )
    with pytest.raises(HTTPException) as raised:
        app.api_agent_proposal_action(proposal["id"], ProposalActionRequest(action="approve"))

    assert raised.value.status_code == 500
    assert canary not in json.dumps(raised.value.detail)
    assert raised.value.detail == {"code": "proposal_apply_failed"}
    terminal = chat.get_proposal(proposal["id"])
    assert terminal is not None
    assert terminal["status"] == "failed_apply"
    assert terminal["errorCode"] == "internal_error"
    assert "revisedMarkdown" not in terminal and "diff" not in terminal


def test_work_log_tracks_real_terminal_action_without_body_leak(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    _path, proposal = _proposal(tmp_path, monkeypatch)
    store = SharedJobStore(tmp_path / "jobs-v2.json", tmp_path / "jobs.json", clock=_clock)
    job = new_shared_job(
        kind="agent_bridge",
        task_type="companion",
        generation_mode="llm_cli",
        adapter="codex",
        requested_mode="cli",
        mode="answer",
        attempted_engine="cli",
        proposal_id=proposal["id"],
        clock=_clock,
    ).model_copy(update={"id": f"job_{UUID(int=1, version=4)}"})
    store.add(job)
    service = WorkLogService(
        store,
        tmp_path / "agent-work-log.json",
        tmp_path / "agent-proposals",
        clock=_clock,
    )
    pending = service.list(limit=20, offset=0, kind="all")["entries"][0]
    assert pending["proposalStatus"] == "pending"

    chat.reject_proposal(proposal["id"])
    terminal = service.list(limit=20, offset=0, kind="all")["entries"][0]
    serialized = json.dumps(terminal, ensure_ascii=False)

    assert set(terminal) == WORK_LOG_ENTRY_KEYS
    assert terminal["proposalId"] == proposal["id"]
    assert terminal["proposalStatus"] == "rejected"
    assert proposal["summary"] not in serialized
    assert proposal["diff"] not in serialized
    assert proposal["revisedMarkdown"] not in serialized
