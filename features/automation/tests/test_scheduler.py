import datetime as dt

from features.automation import service


def test_rss_due_when_interval_elapsed():
    settings = {"rss": {"enabled": True, "intervalMinutes": 60}}
    runs = [{"kind": "rss", "finishedAt": "2026-07-02T08:00:00"}]
    now = dt.datetime(2026, 7, 2, 9, 5, 0)

    assert service.automation_due("rss", settings=settings, now=now, runs=runs) is True


def test_briefing_skip_missed_default_window():
    settings = {"briefing": {"enabled": True, "time": "08:00"}, "missedRuns": {"onStartup": "skip"}}
    now = dt.datetime(2026, 7, 2, 9, 0, 0)

    assert service.automation_due("briefing", settings=settings, now=now, runs=[]) is False


def test_briefing_due_inside_window_once_per_day():
    settings = {"briefing": {"enabled": True, "time": "08:00"}, "missedRuns": {"onStartup": "skip"}}
    now = dt.datetime(2026, 7, 2, 8, 4, 0)

    assert service.automation_due("briefing", settings=settings, now=now, runs=[]) is True
    assert service.automation_due(
        "briefing",
        settings=settings,
        now=now,
        runs=[{"kind": "briefing", "finishedAt": "2026-07-02T08:02:00"}],
    ) is False


def test_run_due_automations_chains_memory_after_rss(monkeypatch):
    settings = {
        "rss": {"enabled": True, "intervalMinutes": 60},
        "marketMemory": {"enabled": True, "intervalMinutes": 240, "runAfterRss": True},
        "briefing": {"enabled": False},
    }
    monkeypatch.setattr(service, "read_settings", lambda: service.normalize_settings(settings))
    monkeypatch.setattr(service, "list_runs", lambda limit=100: [])
    calls = []

    def fake_run(kind):
        calls.append(kind)
        return {"ok": True, "kind": kind}

    monkeypatch.setattr(service, "run_automation_once", fake_run)

    result = service.run_due_automations(now=dt.datetime(2026, 7, 2, 8, 0, 0))

    assert result["ok"] is True
    assert calls == ["rss", "marketMemory"]
