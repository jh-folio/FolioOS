import json

from features.common import jobs


def test_load_jobs_marks_queued_and_running_jobs_failed_after_restart(monkeypatch, tmp_path):
    jobs_path = tmp_path / "jobs.json"
    jobs_path.write_text(json.dumps({
        "queued-job": {"id": "queued-job", "status": "queued", "message": "waiting"},
        "running-job": {"id": "running-job", "status": "running", "message": "working"},
        "done-job": {"id": "done-job", "status": "done", "message": "ok"},
    }), encoding="utf-8")
    monkeypatch.setattr(jobs, "JOBS_PATH", jobs_path)
    monkeypatch.setattr(jobs, "JOBS", {})

    jobs.load_jobs()

    assert jobs.JOBS["queued-job"]["status"] == "failed"
    assert jobs.JOBS["running-job"]["status"] == "failed"
    assert jobs.JOBS["done-job"]["status"] == "done"
    assert "서버 재시작" in jobs.JOBS["running-job"]["message"]


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
