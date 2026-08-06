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
    # marketCalendar는 설정 없이 항상 도는 유일한 자동화라 이력이 없으면 함께 실행된다.
    assert "marketCalendar" in calls
    # 검증 대상인 연쇄 순서는 그대로다.
    assert [kind for kind in calls if kind != "marketCalendar"] == ["rss", "marketMemory"]


def test_the_signals_automation_is_gone():
    """별도 자동화로 둘 이유가 없어졌다. 승격은 RSS 수집에 함께 실린다."""
    assert "signals" not in service.normalize_settings({})


def test_rss_run_still_promotes_kr_leads(monkeypatch):
    """설정을 없앤 뒤에도 한국 lead 승격은 RSS 수집으로 계속된다(네트워크 없음)."""
    monkeypatch.setattr(service, "import_rssarchive", lambda **_kwargs: {"ok": True})
    monkeypatch.setattr(service, "promote_kr_rss_leads", lambda _data_dir: 7)
    monkeypatch.setattr(service, "_append_run", lambda *_args, **_kwargs: None)
    result = service.run_automation_once("rss")
    assert result["result"]["krFastOriginLeads"] == 7


def test_market_calendar_runs_without_any_setting(monkeypatch):
    """캘린더 갱신은 사용자 설정 항목이 아니다.

    이 설정이 꺼진 채로 남아 CPI·고용지표가 한 건도 등록되지 않은 상태가 지속됐다.
    Agent를 호출하지 않고 비용도 없으므로 항상 6시간마다 돈다.
    """
    from features.automation.schema import MARKET_CALENDAR_INTERVAL_MINUTES, default_settings, normalize_settings

    assert "marketCalendar" not in default_settings()
    # 옛 설정 파일에 남아 있어도 무시한다.
    assert "marketCalendar" not in normalize_settings({"marketCalendar": {"enabled": False}})

    settings = normalize_settings({})
    now = dt.datetime(2026, 7, 2, 8, 0, 0, tzinfo=dt.timezone.utc)
    assert service.automation_due("marketCalendar", settings=settings, now=now, runs=[]) is True

    recent = [{"kind": "marketCalendar", "finishedAt": (now - dt.timedelta(hours=1)).isoformat()}]
    assert service.automation_due("marketCalendar", settings=settings, now=now, runs=recent) is False

    stale = [{
        "kind": "marketCalendar",
        "finishedAt": (now - dt.timedelta(minutes=MARKET_CALENDAR_INTERVAL_MINUTES + 1)).isoformat(),
    }]
    assert service.automation_due("marketCalendar", settings=settings, now=now, runs=stale) is True
