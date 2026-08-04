import datetime as dt

from features.automation import service


def test_rss_due_when_interval_elapsed():
    settings = {"rss": {"enabled": True, "intervalMinutes": 60}}
    runs = [{"kind": "rss", "finishedAt": "2026-07-02T08:00:00"}]
    now = dt.datetime(2026, 7, 2, 9, 5, 0)

    assert service.automation_due("rss", settings=settings, now=now, runs=runs) is True


def test_rss_not_due_when_utc_run_finished_one_minute_ago_in_kst():
    settings = {"rss": {"enabled": True, "intervalMinutes": 60}}
    runs = [{"kind": "rss", "finishedAt": "2026-07-31T12:09:00+00:00"}]
    now = dt.datetime(2026, 7, 31, 21, 10, 0, tzinfo=dt.timezone(dt.timedelta(hours=9)))

    assert service.automation_due("rss", settings=settings, now=now, runs=runs) is False


def test_rss_due_when_utc_run_finished_over_an_hour_ago_in_kst():
    settings = {"rss": {"enabled": True, "intervalMinutes": 60}}
    runs = [{"kind": "rss", "finishedAt": "2026-07-31T11:00:00+00:00"}]
    now = dt.datetime(2026, 7, 31, 21, 10, 0, tzinfo=dt.timezone(dt.timedelta(hours=9)))

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
        # 이 테스트는 rss→marketMemory 연쇄만 검증하므로 기본 on인 signals는 명시적으로 끈다.
        "signals": {"enabled": False},
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


def test_signals_collection_is_on_by_default_without_user_setup():
    """공개 피드만 쓰므로 사용자가 설정하지 않아도 빠른 신호가 수집돼야 한다."""
    defaults = service.normalize_settings({})
    assert defaults["signals"]["enabled"] is True
    assert defaults["signals"]["intervalMinutes"] == 5


def test_rss_run_also_promotes_kr_leads(monkeypatch):
    """signals 자동화를 꺼도 RSS만 돌리면 한국 lead는 표시돼야 한다(네트워크 없음)."""
    monkeypatch.setattr(service, "import_rssarchive", lambda **_kwargs: {"ok": True})
    monkeypatch.setattr(service, "promote_kr_rss_leads", lambda _data_dir: 7)
    monkeypatch.setattr(service, "_append_run", lambda *_args, **_kwargs: None)
    result = service.run_automation_once("rss")
    assert result["result"]["krFastOriginLeads"] == 7
