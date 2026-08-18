import json

import pytest

from features.common import jobs


def test_load_jobs_marks_queued_and_running_jobs_failed_after_restart(monkeypatch, tmp_path):
    """좀비 잡 방지는 API가 읽는 경로에서 성립해야 한다(§서버 재시작).

    `/api/jobs`와 `/api/jobs/{id}`는 모듈 전역 `JOBS` 캐시가 아니라 매 요청
    `_store().merged()`를 다시 읽고, merged()는 legacy `data/jobs.json` 행을 그대로
    싣는다. 캐시만 고치면 구버전에서 남은 running 행이 영원히 실행 중으로 보인다.
    """
    jobs_path = tmp_path / "jobs.json"
    jobs_path.write_text(json.dumps({
        "queued-job": {"id": "queued-job", "status": "queued", "message": "waiting"},
        "running-job": {"id": "running-job", "status": "running", "progress": 40, "message": "working"},
        "cancelling-job": {"id": "cancelling-job", "status": "cancel_requested", "message": "cancelling"},
        "done-job": {"id": "done-job", "status": "done", "message": "ok"},
    }), encoding="utf-8")
    monkeypatch.setattr(jobs, "JOBS_PATH", jobs_path)
    monkeypatch.setattr(jobs, "JOBS", {})
    jobs._LIFECYCLES.clear()

    jobs.load_jobs()

    listed = {row["id"]: row for row in jobs.recent_jobs()}
    assert listed["queued-job"]["status"] == "failed_restart"
    assert listed["running-job"]["status"] == "failed_restart"
    assert listed["cancelling-job"]["status"] == "failed_restart"
    assert listed["done-job"]["status"] == "done"
    assert "서버 재시작" in jobs.get_job("running-job")["message"]
    assert jobs.JOBS["running-job"]["status"] == "failed_restart"

    # 전환이 파일에 남아야 다음 실행에서도 좀비가 되살아나지 않는다.
    assert json.loads(jobs_path.read_text(encoding="utf-8"))["running-job"]["status"] == "failed_restart"
    jobs.load_jobs()
    assert jobs.get_job("running-job")["status"] == "failed_restart"


def test_load_jobs_leaves_unrelated_legacy_rows_untouched(monkeypatch, tmp_path):
    """좀비만 종료시킨다. 다른 행과 다른 필드는 사용자 기록이라 그대로 둔다."""
    jobs_path = tmp_path / "jobs.json"
    jobs_path.write_text(json.dumps({
        "done-job": {"id": "done-job", "status": "done", "kind": "index", "result": {"count": 3}},
        "running-job": {"id": "running-job", "status": "running", "kind": "rss", "createdAt": "2026-07-01T00:00:00Z"},
    }), encoding="utf-8")
    monkeypatch.setattr(jobs, "JOBS_PATH", jobs_path)
    monkeypatch.setattr(jobs, "JOBS", {})
    jobs._LIFECYCLES.clear()

    jobs.load_jobs()

    raw = json.loads(jobs_path.read_text(encoding="utf-8"))
    assert raw["done-job"] == {"id": "done-job", "status": "done", "kind": "index", "result": {"count": 3}}
    assert raw["running-job"]["kind"] == "rss"
    assert raw["running-job"]["createdAt"] == "2026-07-01T00:00:00Z"


def test_load_jobs_starts_the_server_even_when_a_private_pack_stays_locked(monkeypatch, tmp_path):
    """pack 삭제가 막혀도 기동은 막지 않는다 — 잡 조회만 fail-closed로 닫힌다.

    예전에는 `PrivateCleanupError`가 `load_jobs()`를 그대로 통과해 uvicorn까지 가지
    못했고, 백신이 pack을 잡고 있는 동안 앱이 아예 켜지지 않았다.
    """
    monkeypatch.setattr(jobs, "JOBS_PATH", tmp_path / "jobs.json")
    monkeypatch.setattr(jobs, "JOBS", {})
    jobs._LIFECYCLES.clear()
    job = jobs.new_shared_job(
        kind="rss",
        task_type="rss",
        generation_mode="none",
        adapter="none",
        requested_mode=None,
        mode="collect",
        attempted_engine=None,
        clock=jobs._clock,
    )
    jobs.shared_store().add(job)
    monkeypatch.setattr(jobs.private_lifecycle(), "cleanup_owner", lambda _job_id: False)

    jobs.load_jobs()

    assert jobs.shared_store().get(job.id).errorCode is jobs.ErrorCode.PRIVATE_CLEANUP_FAILED
    with pytest.raises(jobs.JobsStoreUnavailableError):
        jobs.recent_jobs()


def test_queued_job_that_never_started_still_ends_terminal(monkeypatch, tmp_path):
    """시작 전이 쓰기가 한 번 실패해도 잡은 종료되고 잡 조회는 열려 있어야 한다.

    QUEUED→RUNNING 쓰기가 실패하면 잡은 QUEUED로 남는데, 예전에는 전이 표에
    QUEUED→FAILED가 없어 `run_job`의 예외 처리가 JobTransitionError로 되튕겼다.
    그 시점에는 pack이 이미 지워진 뒤라 잡이 `cleanup_blocked`에 영구히 남고
    `/api/jobs`와 Work Log가 프로세스 수명 내내 503이 됐다.
    """
    monkeypatch.setattr(jobs, "JOBS_PATH", tmp_path / "jobs.json")
    monkeypatch.setattr(jobs, "JOBS", {})
    jobs._LIFECYCLES.clear()
    job = jobs.new_shared_job(
        kind="index",
        task_type="index",
        generation_mode="none",
        adapter="none",
        requested_mode=None,
        mode="index",
        attempted_engine=None,
        clock=jobs._clock,
    )
    jobs.shared_store().add(job)
    jobs.private_lifecycle().set_private(job.id, {})
    pending_failures = [jobs.JobsStoreUnavailableError()]

    class _FlakyStore(jobs.SharedJobStore):
        def transition(self, job_id, target, **kwargs):
            if target is jobs.JobStatus.RUNNING and pending_failures:
                raise pending_failures.pop()
            return super().transition(job_id, target, **kwargs)

    monkeypatch.setattr(
        jobs,
        "_store",
        lambda: _FlakyStore(jobs.JOBS_PATH.with_name("jobs-v2.json"), jobs.JOBS_PATH, clock=jobs._clock),
    )

    jobs.run_job(job.id, lambda *, progress: {"count": 1})

    terminal = jobs.shared_store().get(job.id)
    assert terminal is not None
    assert terminal.status is jobs.JobStatus.FAILED
    assert terminal.errorCode is jobs.ErrorCode.INTERNAL_ERROR
    assert not jobs.private_lifecycle().cleanup_blocked
    assert jobs.get_job(job.id)["status"] == "failed"
    assert [row["id"] for row in jobs.recent_jobs()] == [job.id]


def test_progress_only_update_preserves_non_nullable_job_identity(monkeypatch, tmp_path):
    jobs_path = tmp_path / "jobs.json"
    monkeypatch.setattr(jobs, "JOBS_PATH", jobs_path)
    jobs._LIFECYCLES.clear()
    job = jobs.new_shared_job(
        kind="rss",
        task_type="rss",
        generation_mode="none",
        adapter="none",
        requested_mode=None,
        mode="collect",
        attempted_engine=None,
        clock=jobs._clock,
    )
    jobs.shared_store().add(job)
    jobs.shared_store().transition(job.id, jobs.JobStatus.RUNNING)

    jobs.job_progress(job.id)(
        "RSS 피드 캐시 갱신",
        progress=5,
        engine=None,
        adapter=None,
    )

    current = jobs.shared_store().get(job.id)
    assert current is not None
    assert current.progress == 5
    assert current.engine is jobs.Engine.NONE
    assert current.adapter is jobs.Adapter.NONE


def test_public_job_projection_exposes_task_type_for_reload_recovery(monkeypatch, tmp_path):
    monkeypatch.setattr(jobs, "JOBS_PATH", tmp_path / "jobs.json")
    jobs._LIFECYCLES.clear()
    job = jobs.new_shared_job(
        kind="rss",
        task_type="rss",
        generation_mode="none",
        adapter="none",
        requested_mode=None,
        mode="collect",
        attempted_engine=None,
        clock=jobs._clock,
    )
    jobs.shared_store().add(job)

    assert jobs.get_job(job.id)["taskType"] == "rss"


def test_index_job_normalizes_utc_offset_before_terminal_projection(monkeypatch, tmp_path):
    monkeypatch.setattr(jobs, "JOBS_PATH", tmp_path / "jobs.json")
    jobs._LIFECYCLES.clear()
    job = jobs.new_shared_job(
        kind="index",
        task_type="index",
        generation_mode="none",
        adapter="none",
        requested_mode=None,
        mode="index",
        attempted_engine=None,
        clock=jobs._clock,
    )
    jobs.shared_store().add(job)
    jobs.private_lifecycle().set_private(job.id, {})

    jobs.run_job(
        job.id,
        lambda *, progress: {
            "count": 1,
            "generatedAt": "2026-07-21T04:15:56.214760+00:00",
            "incremental": {"enabled": True},
            "sqlite": {"documents": 1},
        },
    )

    terminal = jobs.shared_store().get(job.id)
    assert terminal is not None
    assert terminal.status is jobs.JobStatus.DONE
    assert terminal.resultProjection is not None
    assert terminal.resultProjection.generatedAt == "2026-07-21T04:15:56.214760Z"
