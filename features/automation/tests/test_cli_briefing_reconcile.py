"""CLI 제출 브리핑의 실행 기록·재시도 회귀 테스트.

submit_agent_task는 job을 띄우고 바로 돌아오는데, 그 제출을 `done`으로 적으면
job이 실패해도 그날 '성공'이 남아 30분 재시도가 한 번도 돌지 않던 버그를 고정한다.
"""

from __future__ import annotations

import datetime as dt

from features.automation import service
from features.automation.schema import normalize_settings


def _schedule(**overrides) -> dict:
    base = {
        "id": "sched-1",
        "enabled": True,
        "time": "08:00",
        "markets": ["us"],
        "days": [0, 1, 2, 3, 4],
        "briefingType": "default",
        "qualityMode": "diagnose_only",
        "runPrerequisites": False,
    }
    base.update(overrides)
    return base


def _submitted_row(finished_at: str = "2026-08-14T08:00:05") -> dict:
    return {
        "kind": "briefing",
        "status": "submitted",
        "jobId": "job-1",
        "scheduleId": "sched-1",
        "startedAt": "2026-08-14T08:00:00",
        "finishedAt": finished_at,
        "result": {"generationMode": "llm_cli"},
    }


def test_cli_submission_is_recorded_as_submitted_not_done(tmp_path, monkeypatch):
    monkeypatch.setattr(service, "RUNS_PATH", tmp_path / "automation-runs.json")
    monkeypatch.setattr(service, "default_generation_mode", lambda: "llm_cli")
    monkeypatch.setattr(service, "kst_date", lambda: "2026-08-14")
    monkeypatch.setattr(service, "load_market_scope", lambda: {"selected": ["US", "KR"]})
    monkeypatch.setattr(
        service, "submit_agent_task", lambda kind, payload: {"id": "job-1", "status": "queued"}
    )

    outcome = service.run_automation_once("briefing", schedule=_schedule())

    assert outcome["ok"] is True
    assert outcome["status"] == "submitted"
    assert outcome["jobId"] == "job-1"
    row = service.list_runs(1)[0]
    assert row["status"] == "submitted"
    assert row["jobId"] == "job-1"


def test_submitted_row_blocks_duplicate_submission_while_job_runs(tmp_path, monkeypatch):
    monkeypatch.setattr(service, "RUNS_PATH", tmp_path / "automation-runs.json")
    service.write_json(service.RUNS_PATH, [_submitted_row()])
    monkeypatch.setattr(service, "get_job", lambda job_id: {"status": "running"})

    service._reconcile_submitted_briefings()

    runs = service.list_runs(100)
    assert runs[0]["status"] == "submitted"
    now = dt.datetime(2026, 8, 14, 8, 40)
    assert service.schedule_due(_schedule(), settings=normalize_settings({}), now=now, runs=runs) is False


def test_failed_job_revives_retry_and_marks_run_failed(tmp_path, monkeypatch):
    monkeypatch.setattr(service, "RUNS_PATH", tmp_path / "automation-runs.json")
    service.write_json(service.RUNS_PATH, [_submitted_row()])
    monkeypatch.setattr(
        service,
        "get_job",
        lambda job_id: {"status": "failed", "finishedAt": "2026-08-14T08:03:00"},
    )

    service._reconcile_submitted_briefings()

    runs = service.list_runs(100)
    assert runs[0]["status"] == "failed"
    assert runs[0]["error"] == "briefing_job_failed"
    assert runs[0]["finishedAt"] == "2026-08-14T08:03:00"
    now = dt.datetime(2026, 8, 14, 8, 40)
    assert service.schedule_due(_schedule(), settings=normalize_settings({}), now=now, runs=runs) is True


def test_missing_job_marks_run_failed(tmp_path, monkeypatch):
    monkeypatch.setattr(service, "RUNS_PATH", tmp_path / "automation-runs.json")
    service.write_json(service.RUNS_PATH, [_submitted_row()])
    monkeypatch.setattr(service, "get_job", lambda job_id: None)

    service._reconcile_submitted_briefings()

    assert service.list_runs(1)[0]["status"] == "failed"
    assert service.list_runs(1)[0]["error"] == "briefing_job_not_found"


def test_successful_job_marks_run_done(tmp_path, monkeypatch):
    monkeypatch.setattr(service, "RUNS_PATH", tmp_path / "automation-runs.json")
    service.write_json(service.RUNS_PATH, [_submitted_row()])
    monkeypatch.setattr(
        service,
        "get_job",
        lambda job_id: {"status": "done", "finishedAt": "2026-08-14T08:05:00"},
    )

    service._reconcile_submitted_briefings()

    runs = service.list_runs(100)
    assert runs[0]["status"] == "done"
    assert "error" not in runs[0]
    now = dt.datetime(2026, 8, 14, 8, 40)
    assert service.schedule_due(_schedule(), settings=normalize_settings({}), now=now, runs=runs) is False


def test_concurrent_appends_do_not_lose_rows(tmp_path, monkeypatch):
    """실행 기록은 스케줄 상태다 — 데몬 스레드와 API 스레드가 겹쳐도 행이 사라지면 안 된다."""
    import threading

    monkeypatch.setattr(service, "RUNS_PATH", tmp_path / "automation-runs.json")

    def worker(prefix):
        for index in range(20):
            service._append_run({"kind": "rss", "status": "done", "id": f"{prefix}-{index}"})

    threads = [threading.Thread(target=worker, args=(name,)) for name in ("a", "b")]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()

    rows = service.list_runs(100)
    assert len(rows) == 40
    assert {row["id"] for row in rows} == {f"{p}-{i}" for p in ("a", "b") for i in range(20)}


def test_reconcile_holds_the_same_lock_as_append(tmp_path, monkeypatch):
    """reconcile의 읽기~쓰기 사이에 append가 끼어들어도 그 행이 살아남아야 한다."""
    monkeypatch.setattr(service, "RUNS_PATH", tmp_path / "automation-runs.json")
    service.write_json(service.RUNS_PATH, [_submitted_row()])

    def job_lookup_appends(_job_id):
        # 잠금이 없다면 이 시점의 append가 reconcile의 마지막 write_json에 덮여 사라진다.
        # 같은 잠금을 쓰므로 여기서 _append_run을 부르면 데드락이 나야 정상이고,
        # 별도 스레드의 append는 reconcile이 끝날 때까지 기다린다.
        appender = __import__("threading").Thread(
            target=service._append_run, args=({"kind": "rss", "status": "done", "id": "interleaved"},)
        )
        appender.start()
        appender.join(timeout=0.2)
        assert appender.is_alive(), "append가 reconcile 잠금을 기다리지 않았다"
        job_lookup_appends.pending = appender
        return {"status": "failed", "finishedAt": "2026-08-14T08:03:00"}

    monkeypatch.setattr(service, "get_job", job_lookup_appends)

    service._reconcile_submitted_briefings()
    job_lookup_appends.pending.join(timeout=2)

    rows = service.list_runs(100)
    ids = [row.get("id") for row in rows]
    statuses = [row.get("status") for row in rows]
    assert "interleaved" in ids
    assert "failed" in statuses
