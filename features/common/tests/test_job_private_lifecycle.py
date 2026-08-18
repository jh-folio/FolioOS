from __future__ import annotations

from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from features.common import jobs


NOW = datetime(2026, 7, 17, 0, 0, tzinfo=UTC)


def _queued(clock):
    return jobs.new_shared_job(
        kind="agent_bridge",
        task_type="companion",
        generation_mode="llm_cli",
        adapter="codex",
        requested_mode="cli",
        mode="answer",
        attempted_engine="cli",
        clock=clock,
    )


def test_terminal_cleanup_scrubs_private_state_before_job_is_readable(tmp_path: Path) -> None:
    # Given: a running job with private input and a job-owned pack
    store = jobs.SharedJobStore(tmp_path / "jobs-v2.json", tmp_path / "jobs.json", clock=lambda: NOW)
    lifecycle = jobs.JobPrivateLifecycle(tmp_path / "job-context", clock=lambda: NOW)
    job = _queued(lambda: NOW)
    store.add(job)
    store.transition(job.id, jobs.JobStatus.RUNNING)
    lifecycle.set_private(job.id, {"prompt": "PRIVATE_CANARY"})
    pack = lifecycle.write_pack(job.id, "pack_1", {"prompt": "PACK_CANARY"})
    assert pack.exists()

    # When: the job terminalizes
    lifecycle.terminalize(
        store,
        job.id,
        jobs.JobStatus.DONE,
        result={"proposalId": None},
        live_detail={"noticeCode": None, "optionCodes": [], "reply": "safe reply", "proposalId": None},
    )

    # Then: owner context/private canaries are gone before terminal visibility.
    assert not (tmp_path / "job-context" / job.id).exists()
    assert lifecycle.has_private(job.id) is False
    assert store.get(job.id).status == jobs.JobStatus.DONE
    assert "PRIVATE_CANARY" not in store.path.read_text(encoding="utf-8")


def test_cleanup_failure_keeps_job_nonterminal_and_endpoints_fail_closed(tmp_path: Path, monkeypatch) -> None:
    # Given: a running job whose owner cleanup fails
    store = jobs.SharedJobStore(tmp_path / "jobs-v2.json", tmp_path / "jobs.json", clock=lambda: NOW)
    lifecycle = jobs.JobPrivateLifecycle(tmp_path / "job-context", clock=lambda: NOW)
    job = _queued(lambda: NOW)
    store.add(job)
    store.transition(job.id, jobs.JobStatus.RUNNING)
    lifecycle.write_pack(job.id, "pack_1", {"prompt": "PACK_CANARY"})
    cleanup_owner = lifecycle.cleanup_owner
    monkeypatch.setattr(lifecycle, "cleanup_owner", lambda _job_id: False)

    # When / Then: terminalization fails closed without exposing terminal status.
    with pytest.raises(jobs.PrivateCleanupError):
        lifecycle.terminalize(store, job.id, jobs.JobStatus.FAILED, error_code="internal_error")
    current = store.get(job.id)
    assert current is not None and current.status == jobs.JobStatus.RUNNING
    assert current.errorCode is jobs.ErrorCode.PRIVATE_CLEANUP_FAILED
    with pytest.raises(jobs.JobsStoreUnavailableError):
        lifecycle.assert_readable()

    # When: the exact cleanup is retried after the filesystem failure clears.
    monkeypatch.setattr(lifecycle, "cleanup_owner", cleanup_owner)
    lifecycle.terminalize(store, job.id, jobs.JobStatus.FAILED, error_code="internal_error")

    # Then: the retry terminalizes, clears fail-closed state, and replaces the transient code.
    terminal = store.get(job.id)
    assert terminal is not None and terminal.status is jobs.JobStatus.FAILED
    assert terminal.errorCode is jobs.ErrorCode.INTERNAL_ERROR
    lifecycle.assert_readable()


def test_startup_maps_interrupted_jobs_and_preserves_manual_pack(tmp_path: Path) -> None:
    # Given: queued/running jobs, their owner packs, and an unrelated manual sentinel
    current = NOW
    store = jobs.SharedJobStore(tmp_path / "jobs-v2.json", tmp_path / "jobs.json", clock=lambda: current)
    lifecycle = jobs.JobPrivateLifecycle(tmp_path / "job-context", clock=lambda: current)
    manual = tmp_path / "agent-context" / "manual.json"
    manual.parent.mkdir()
    manual.write_bytes(b"MANUAL_SENTINEL")
    jobs_to_recover = [_queued(lambda: current), _queued(lambda: current)]
    for index, job in enumerate(jobs_to_recover):
        store.add(job)
        if index:
            store.transition(job.id, jobs.JobStatus.RUNNING)
        lifecycle.write_pack(job.id, "pack_1", {"prompt": "CANARY"})

    # When: startup recovery runs
    lifecycle.recover_startup(store)

    # Then: both are failed_restart, owned packs are removed, manual bytes unchanged.
    assert {store.get(job.id).status for job in jobs_to_recover} == {jobs.JobStatus.FAILED_RESTART}
    assert list((tmp_path / "job-context").glob("job_*")) == []
    assert manual.read_bytes() == b"MANUAL_SENTINEL"


def test_terminalize_forwards_explicit_startup_recovery_transition(tmp_path: Path) -> None:
    # Given: a running job whose recovery-only target is not a normal transition.
    store = jobs.SharedJobStore(tmp_path / "jobs-v2.json", tmp_path / "jobs.json", clock=lambda: NOW)
    lifecycle = jobs.JobPrivateLifecycle(tmp_path / "job-context", clock=lambda: NOW)
    job = _queued(lambda: NOW)
    store.add(job)
    store.transition(job.id, jobs.JobStatus.RUNNING)
    lifecycle.set_private(job.id, {"prompt": "PRIVATE_CANARY"})

    # When: the private lifecycle terminalizes it through the startup recovery seam.
    lifecycle.terminalize_recovery(
        store,
        job.id,
        jobs.JobStatus.FAILED_RESTART,
    )

    # Then: private state is scrubbed before the exact recovery terminal is persisted.
    current = store.get(job.id)
    assert current is not None and current.status == jobs.JobStatus.FAILED_RESTART
    assert lifecycle.has_private(job.id) is False


def test_a_briefly_locked_pack_folder_is_retried_not_abandoned(tmp_path: Path, monkeypatch) -> None:
    """백신이 pack을 잠깐 잡은 것은 실패가 아니라 기다릴 일이다(§파일 저장).

    쓰기는 물러났다 다시 쓰는데 삭제만 한 번에 포기하면, 그 수십 밀리초 때문에
    잡이 종료되지 못하고 잡 조회가 프로세스 끝날 때까지 503으로 닫힌다.
    """
    from features.common import shared_jobs_private

    store = jobs.SharedJobStore(tmp_path / "jobs-v2.json", tmp_path / "jobs.json", clock=lambda: NOW)
    lifecycle = jobs.JobPrivateLifecycle(tmp_path / "job-context", clock=lambda: NOW)
    job = _queued(lambda: NOW)
    store.add(job)
    store.transition(job.id, jobs.JobStatus.RUNNING)
    lifecycle.write_pack(job.id, "pack_1", {"prompt": "PACK_CANARY"})
    real_rmtree = shared_jobs_private.shutil.rmtree
    calls = {"n": 0}

    def flaky(path):
        calls["n"] += 1
        if calls["n"] < 3:
            raise PermissionError(32, "The process cannot access the file")
        return real_rmtree(path)

    monkeypatch.setattr(shared_jobs_private.shutil, "rmtree", flaky)
    monkeypatch.setattr(shared_jobs_private.time, "sleep", lambda _seconds: None)

    lifecycle.terminalize(store, job.id, jobs.JobStatus.FAILED, error_code="internal_error")

    assert calls["n"] == 3, "재시도 없이 한 번에 포기하면 안 된다"
    assert not (tmp_path / "job-context" / job.id).exists()
    assert store.get(job.id).status is jobs.JobStatus.FAILED
    lifecycle.assert_readable()


def test_startup_recovery_finishes_every_job_even_when_one_pack_stays_locked(
    tmp_path: Path, monkeypatch
) -> None:
    """한 잡의 pack 삭제가 막혀도 나머지 좀비 잡은 그 회차에 정리된다.

    예전에는 첫 실패에서 raise해 뒤의 잡이 running으로 남았고, 그 예외가
    `load_jobs()`를 타고 올라가 서버가 아예 켜지지 않았다.
    """
    current = NOW
    store = jobs.SharedJobStore(tmp_path / "jobs-v2.json", tmp_path / "jobs.json", clock=lambda: current)
    lifecycle = jobs.JobPrivateLifecycle(tmp_path / "job-context", clock=lambda: current)
    blocked, recoverable = _queued(lambda: current), _queued(lambda: current)
    for job in (blocked, recoverable):
        store.add(job)
        lifecycle.write_pack(job.id, "pack_1", {"prompt": "CANARY"})
    real_cleanup = lifecycle.cleanup_owner
    monkeypatch.setattr(
        lifecycle,
        "cleanup_owner",
        lambda job_id: False if job_id == blocked.id else real_cleanup(job_id),
    )

    with pytest.raises(jobs.PrivateCleanupError):
        lifecycle.recover_startup(store)

    assert store.get(recoverable.id).status is jobs.JobStatus.FAILED_RESTART
    assert store.get(blocked.id).status is jobs.JobStatus.QUEUED
    assert store.get(blocked.id).errorCode is jobs.ErrorCode.PRIVATE_CLEANUP_FAILED
    assert (tmp_path / "job-context" / blocked.id).exists(), "지우지 못한 pack을 지웠다고 하면 안 된다"
    with pytest.raises(jobs.JobsStoreUnavailableError):
        lifecycle.assert_readable()


def test_a_locked_orphan_folder_does_not_break_startup_recovery(tmp_path: Path, monkeypatch) -> None:
    """orphan 정리는 위생 작업이다. 지금 잠겨 있으면 다음 시작에서 지운다."""
    from features.common import shared_jobs_private

    current = NOW
    lifecycle = jobs.JobPrivateLifecycle(tmp_path / "job-context", clock=lambda: current)
    orphan = "job_22222222-2222-4222-8222-222222222222"
    lifecycle.write_pack(orphan, "p", {"x": "y"})
    timestamp = (current - timedelta(hours=48)).timestamp()
    import os

    os.utime(tmp_path / "job-context" / orphan, (timestamp, timestamp))
    monkeypatch.setattr(
        shared_jobs_private.shutil,
        "rmtree",
        lambda _path: (_ for _ in ()).throw(PermissionError(5, "denied")),
    )
    monkeypatch.setattr(shared_jobs_private.time, "sleep", lambda _seconds: None)

    assert lifecycle.cleanup_orphans(set()) == []
    assert (tmp_path / "job-context" / orphan).exists()


def test_orphan_cleanup_obeys_strict_id_and_24_hour_boundary(tmp_path: Path) -> None:
    # Given: strict orphan directories immediately below and at the age boundary
    current = NOW
    lifecycle = jobs.JobPrivateLifecycle(tmp_path / "job-context", clock=lambda: current)
    young = "job_11111111-1111-4111-8111-111111111111"
    old = "job_22222222-2222-4222-8222-222222222222"
    lifecycle.write_pack(young, "p", {"x": "y"})
    lifecycle.write_pack(old, "p", {"x": "y"})
    young_path = tmp_path / "job-context" / young
    old_path = tmp_path / "job-context" / old
    timestamp = (current - timedelta(hours=24)).timestamp()
    import os

    os.utime(old_path, (timestamp, timestamp))

    # When: orphan cleanup runs at the exact 24h boundary
    removed = lifecycle.cleanup_orphans(set())

    # Then: only the boundary-old strict orphan is removed.
    assert removed == [old]
    assert young_path.exists()
