from __future__ import annotations

import json
import os
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from features.agent_mode.work_log import WorkLogConflictError, WorkLogService
from features.agent_mode.work_log_schema import (
    WORK_LOG_ENTRY_KEYS,
    MigrationJournal,
    TokenStatus,
)
from features.common import jobs


NOW = datetime(2026, 7, 17, 0, 0, tzinfo=UTC)


class Clock:
    def __init__(self) -> None:
        self.now = NOW

    def __call__(self) -> datetime:
        return self.now


def _done_companion(store: jobs.SharedJobStore, clock: Clock):
    job = jobs.new_shared_job(
        kind="agent_bridge",
        task_type="companion",
        generation_mode="llm_cli",
        adapter="codex",
        requested_mode="cli",
        mode="answer",
        attempted_engine="cli",
        clock=clock,
    )
    store.add(job)
    store.transition(job.id, jobs.JobStatus.RUNNING)
    store.transition(job.id, jobs.JobStatus.DONE, result={"proposalId": None})
    return job


def test_work_log_is_exact_metadata_only_derived_projection(tmp_path: Path) -> None:
    # Given: one companion job and one excluded index job
    clock = Clock()
    store = jobs.SharedJobStore(tmp_path / "jobs-v2.json", tmp_path / "jobs.json", clock=clock)
    companion_job = _done_companion(store, clock)
    index = jobs.new_shared_job(kind="index", task_type="index", generation_mode="none", adapter="none", requested_mode=None, mode="index", attempted_engine=None, clock=clock)
    store.add(index)
    service = WorkLogService(store, tmp_path / "agent-work-log.json", tmp_path / "agent-proposals", clock=clock)

    # When: the derived log is read
    payload = service.list(limit=200, offset=0, kind="all")

    # Then: exact safe keys are returned and excluded kinds never appear.
    assert payload["total"] == 1
    entry = payload["entries"][0]
    assert entry["jobId"] == companion_job.id
    assert set(entry) == WORK_LOG_ENTRY_KEYS
    forbidden = {"operationId", "commitIntent", "resultProjection", "title", "reportId", "reply", "path"}
    assert forbidden.isdisjoint(entry)


def test_proposal_status_join_is_read_time_and_missing_is_unavailable(tmp_path: Path) -> None:
    # Given: an artifact job referencing a proposal
    clock = Clock()
    store = jobs.SharedJobStore(tmp_path / "jobs-v2.json", tmp_path / "jobs.json", clock=clock)
    proposal_id = "a" * 32
    job = jobs.new_shared_job(kind="agent_bridge", task_type="quality_repair", generation_mode="llm_cli", adapter="codex", requested_mode="cli", mode="revise", attempted_engine="cli", proposal_id=proposal_id, clock=clock)
    store.add(job)
    service = WorkLogService(store, tmp_path / "agent-work-log.json", tmp_path / "agent-proposals", clock=clock)

    # When / Then: missing proposal status is unavailable without an error body.
    assert service.list(limit=20, offset=0, kind="task")["entries"][0]["proposalStatus"] == "unavailable"

    # Given / When / Then: a status-only corrupt file is never treated as authoritative.
    proposal_dir = tmp_path / "agent-proposals"
    proposal_dir.mkdir()
    (proposal_dir / f"{proposal_id}.json").write_text(json.dumps({"status": "pending"}), encoding="utf-8")
    assert service.list(limit=20, offset=0, kind="task")["entries"][0]["proposalStatus"] == "unavailable"

    # Given / When / Then: a complete schema-valid proposal is joined on the next read.
    valid = {
        "schemaVersion": 2,
        "id": proposal_id,
        "reportKind": "topic_report",
        "reportId": "topic-01",
        "marketScope": "none",
        "status": "pending",
        "createdAt": "2026-07-17T00:00:00Z",
        "updatedAt": "2026-07-17T00:00:00Z",
        "finishedAt": None,
        "baseRevision": {"number": 1, "hash": "b" * 64},
        "targetRevision": None,
        "operationId": None,
        "errorCode": None,
        "requestHash": "c" * 64,
        "revisedMarkdownHash": "d" * 64,
        "diffHash": "e" * 64,
        "legacyNormalizationHash": None,
        "userRequest": "QA request",
        "summary": "QA summary",
        "revisedMarkdown": "# Revised",
        "diff": "+ revised",
        "adapter": "codex",
        "model": "qa-model",
        "allowedSourceRefs": [],
    }
    (proposal_dir / f"{proposal_id}.json").write_text(json.dumps(valid), encoding="utf-8")
    assert service.list(limit=20, offset=0, kind="task")["entries"][0]["proposalStatus"] == "pending"


def test_clear_preview_token_is_revision_count_bound_and_replay_safe(tmp_path: Path) -> None:
    # Given: one visible companion entry and an injected deterministic token source
    clock = Clock()
    store = jobs.SharedJobStore(tmp_path / "jobs-v2.json", tmp_path / "jobs.json", clock=clock)
    _done_companion(store, clock)
    service = WorkLogService(store, tmp_path / "agent-work-log.json", tmp_path / "agent-proposals", clock=clock, token_bytes=lambda: b"x" * 32)
    preview = service.clear_preview("companion")

    # When: the exact preview is consumed
    cleared = service.clear("companion", preview["previewToken"])

    # Then: visibility alone is hidden and token replay is rejected.
    assert cleared["hiddenCount"] == 1
    assert service.list(limit=20, offset=0, kind="all")["total"] == 0
    assert len(store.load().jobs) == 1
    with pytest.raises(WorkLogConflictError) as replay:
        service.clear("companion", preview["previewToken"])
    assert replay.value.code == "preview_token_replayed"


def test_token_expiry_is_inclusive_and_stale_revision_is_rejected(tmp_path: Path) -> None:
    # Given: a clear preview
    clock = Clock()
    store = jobs.SharedJobStore(tmp_path / "jobs-v2.json", tmp_path / "jobs.json", clock=clock)
    _done_companion(store, clock)
    service = WorkLogService(store, tmp_path / "agent-work-log.json", tmp_path / "agent-proposals", clock=clock, token_bytes=lambda: b"z" * 32)
    preview = service.clear_preview("all")

    # When / Then: now == expiresAt is expired.
    clock.now += timedelta(minutes=10)
    with pytest.raises(WorkLogConflictError) as expired:
        service.clear("all", preview["previewToken"])
    assert expired.value.code == "preview_token_expired"

    # Given / When / Then: a jobs mutation invalidates a fresh preview.
    clock.now = NOW
    preview = service.clear_preview("all")
    store.add(jobs.new_shared_job(kind="index", task_type="index", generation_mode="none", adapter="none", requested_mode=None, mode="index", attempted_engine=None, clock=clock))
    with pytest.raises(WorkLogConflictError) as stale:
        service.clear("all", preview["previewToken"])
    assert stale.value.code == "jobs_revision_changed"


def test_migration_preview_confirm_keep_original_and_rollback(tmp_path: Path, monkeypatch) -> None:
    # Given: one legacy job and a migration preview
    clock = Clock()
    legacy = tmp_path / "jobs.json"
    legacy.write_text(json.dumps({"legacy": {"id": "legacy", "kind": "index", "status": "done", "createdAt": "2026-07-17T00:00:00Z", "updatedAt": "2026-07-17T00:00:00Z", "finishedAt": "2026-07-17T00:00:00Z", "result": {"count": 1, "generatedAt": "2026-07-17T00:00:00Z", "incremental": True, "sqlite": "x"}}}), encoding="utf-8")
    store = jobs.SharedJobStore(tmp_path / "jobs-v2.json", legacy, clock=clock)
    service = WorkLogService(store, tmp_path / "agent-work-log.json", tmp_path / "agent-proposals", clock=clock, token_bytes=lambda: b"m" * 32)
    preview = service.migration_preview()

    # When: keep-original migration succeeds
    migrated = service.migration_confirm(preview["previewToken"], "migrate_keep_original")

    # Then: v2 exists, legacy bytes remain, and Work Log remains derived.
    assert migrated["migratedJobs"] == 1
    assert migrated["keptOriginal"] is True
    assert legacy.exists()

    # Given: another legacy file and an injected v2 write failure
    other = tmp_path / "other-jobs.json"
    other.write_text(legacy.read_text(encoding="utf-8").replace("legacy", "legacy2"), encoding="utf-8")
    failing_store = jobs.SharedJobStore(tmp_path / "other-v2.json", other, clock=clock)
    failing = WorkLogService(failing_store, tmp_path / "other-work-log.json", tmp_path / "agent-proposals", clock=clock, token_bytes=lambda: b"n" * 32)
    token = failing.migration_preview()["previewToken"]
    before = other.read_bytes()
    monkeypatch.setattr(failing_store, "write_migrated", lambda _jobs: (_ for _ in ()).throw(OSError("injected")))

    # When / Then: failure restores the legacy path/bytes and no v2 partial remains.
    with pytest.raises(OSError):
        failing.migration_confirm(token, "migrate_delete_original")
    assert other.read_bytes() == before
    assert not failing_store.path.exists()


@pytest.mark.parametrize(
    "case",
    ((timedelta(), TokenStatus.ISSUED), (timedelta(minutes=10), TokenStatus.IN_PROGRESS)),
)
def test_migration_store_unavailable_rolls_back_immediately(
    tmp_path: Path,
    monkeypatch,
    case: tuple[timedelta, TokenStatus],
) -> None:
    # Given: prior v2 bytes, legacy bytes, peer SQLite sentinels, and a deterministic preview token.
    elapsed, expected_status = case
    clock = Clock()
    legacy = tmp_path / "jobs.json"
    legacy.write_text(json.dumps({"legacy": {"id": "legacy", "kind": "index", "status": "done", "createdAt": "2026-07-17T00:00:00Z", "updatedAt": "2026-07-17T00:00:00Z", "finishedAt": "2026-07-17T00:00:00Z", "result": {"count": 1, "generatedAt": "2026-07-17T00:00:00Z", "incremental": True, "sqlite": "x"}}}), encoding="utf-8")
    store = jobs.SharedJobStore(tmp_path / "jobs-v2.json", legacy, clock=clock)
    store.add(jobs.new_shared_job(kind="index", task_type="index", generation_mode="none", adapter="none", requested_mode=None, mode="index", attempted_engine=None, clock=clock))
    service = WorkLogService(store, tmp_path / "work-log.json", tmp_path / "proposals", clock=clock, token_bytes=lambda: b"d" * 32)
    preview = service.migration_preview()
    legacy_before = legacy.read_bytes()
    v2_before = store.path.read_bytes()
    peer_files = {
        tmp_path / "market-memory.sqlite3": b"SQLITE_SENTINEL",
        tmp_path / "market-memory.sqlite3-wal": b"WAL_SENTINEL",
        tmp_path / "market-memory.sqlite3-shm": b"SHM_SENTINEL",
    }
    for path, content in peer_files.items():
        path.write_bytes(content)
    real_replace = os.replace
    injected = False

    def fail_first_v2_replace(source, destination) -> None:
        nonlocal injected
        if not injected and Path(destination) == store.path:
            injected = True
            clock.now += elapsed
            raise OSError("injected v2 replace failure")
        real_replace(source, destination)

    monkeypatch.setattr(os, "replace", fail_first_v2_replace)

    # When: the production replace seam is wrapped as the exact domain store error.
    with pytest.raises(jobs.JobsStoreUnavailableError) as raised:
        service.migration_confirm(preview["previewToken"], "migrate_delete_original")

    # Then: rollback is complete before recreation and only an unexpired token is reissued.
    assert raised.value.code == "jobs_store_unavailable"
    assert legacy.read_bytes() == legacy_before
    assert not list(tmp_path.glob("jobs.json.quarantine.*"))
    assert not list(tmp_path.glob("job-migration-*.json"))
    assert store.path.read_bytes() == v2_before
    assert service.store.load().tokens[-1].status == expected_status
    assert all(path.read_bytes() == content for path, content in peer_files.items())

    # Then: restart observes the already-rolled-back state without recovery work.
    restarted = WorkLogService(store, tmp_path / "work-log.json", tmp_path / "proposals", clock=clock)
    assert restarted.store.load().tokens[-1].status == expected_status


def test_startup_recovers_prepared_migration_by_rollback_or_completion(tmp_path: Path) -> None:
    # Given: a claimed migration journal stopped after the legacy rename
    clock = Clock()
    legacy = tmp_path / "jobs.json"
    payload = {"legacy": {"id": "legacy", "kind": "index", "status": "done", "createdAt": "2026-07-17T00:00:00Z", "updatedAt": "2026-07-17T00:00:00Z", "finishedAt": "2026-07-17T00:00:00Z", "result": {"count": 1, "generatedAt": "2026-07-17T00:00:00Z", "incremental": True, "sqlite": "x"}}}
    legacy.write_text(json.dumps(payload), encoding="utf-8")
    store = jobs.SharedJobStore(tmp_path / "jobs-v2.json", legacy, clock=clock)
    service = WorkLogService(store, tmp_path / "work-log.json", tmp_path / "proposals", clock=clock, token_bytes=lambda: b"r" * 32)
    service.migration_preview()
    state = service.store.load()
    token = state.tokens[-1]
    operation_id = "1" * 32
    claimed = token.model_copy(update={"status": TokenStatus.IN_PROGRESS, "operationId": operation_id})
    service.store.write(state.hidden_jobs, (claimed,), state.store_revision + 1)
    additions = store.migration_additions()
    journal = MigrationJournal(
        operationId=operation_id,
        action="migrate_delete_original",
        tokenHash=token.nonceHash,
        beforeHash=store.content_hash(),
        targetHash=store.content_hash(additions),
        hadV2=False,
    )
    journal_path = tmp_path / f"job-migration-{operation_id}.json"
    journal_path.write_text(journal.model_dump_json(), encoding="utf-8")
    quarantine = legacy.with_name(legacy.name + f".quarantine.{operation_id}")
    legacy.rename(quarantine)

    # When: startup recovery sees no target write
    recovered = WorkLogService(store, tmp_path / "work-log.json", tmp_path / "proposals", clock=clock)

    # Then: it rolls back the rename and makes the unexpired token issued again.
    assert legacy.exists()
    assert not quarantine.exists()
    assert not journal_path.exists()
    assert recovered.store.load().tokens[-1].status == TokenStatus.ISSUED

    # Given: the same boundary stopped after the exact v2 target write
    next_service = WorkLogService(store, tmp_path / "work-log.json", tmp_path / "proposals", clock=clock, token_bytes=lambda: b"s" * 32)
    next_service.migration_preview()
    next_state = next_service.store.load()
    next_token = next_state.tokens[-1]
    next_operation = "2" * 32
    next_claimed = next_token.model_copy(update={"status": TokenStatus.IN_PROGRESS, "operationId": next_operation})
    next_tokens = tuple(next_claimed if item.nonceHash == next_token.nonceHash else item for item in next_state.tokens)
    next_service.store.write(next_state.hidden_jobs, next_tokens, next_state.store_revision + 1)
    next_additions = store.migration_additions()
    target_hash = store.content_hash(next_additions)
    next_journal = MigrationJournal(
        operationId=next_operation,
        action="migrate_delete_original",
        tokenHash=next_token.nonceHash,
        beforeHash=store.content_hash(),
        targetHash=target_hash,
        hadV2=False,
    )
    next_path = tmp_path / f"job-migration-{next_operation}.json"
    next_path.write_text(next_journal.model_dump_json(), encoding="utf-8")
    next_quarantine = legacy.with_name(legacy.name + f".quarantine.{next_operation}")
    legacy.rename(next_quarantine)
    original = store.legacy_path
    store.legacy_path = next_quarantine
    try:
        store.write_migrated(store.migration_additions())
    finally:
        store.legacy_path = original

    # When / Then: startup finalizes the exact target and consumes the token.
    completed = WorkLogService(store, tmp_path / "work-log.json", tmp_path / "proposals", clock=clock)
    assert not next_path.exists()
    assert not next_quarantine.exists()
    assert completed.store.load().tokens[-1].status == TokenStatus.USED
