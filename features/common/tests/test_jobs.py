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
