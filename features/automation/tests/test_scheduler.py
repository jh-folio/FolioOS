import datetime as dt
import json

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


def test_a_failed_briefing_is_retried_the_same_day():
    """실패한 실행도 "오늘 실행함"으로 쳐서 그날 브리핑이 아예 없었다.

    `_last_run_for`가 상태를 보지 않고 최신 행을 돌려주고 `automation_due`는 날짜만
    비교했다. LLM이 한 번 타임아웃 나면 다음 날까지 브리핑이 만들어지지 않았고,
    실패했다는 사실을 볼 화면도 없었다.
    """
    settings = {"briefing": {"enabled": True, "time": "08:00"}, "missedRuns": {"catchUpHours": 3}}
    day = dt.date(2026, 8, 9)

    def at(hour, minute=0):
        return dt.datetime.combine(day, dt.time(hour, minute)).astimezone()

    def attempt(hour, minute, status="failed"):
        return {"kind": "briefing", "status": status, "finishedAt": at(hour, minute).isoformat()}

    def due(now, runs):
        return service.automation_due("briefing", settings=settings, now=now, runs=runs)

    # 실패 직후에는 곧바로 다시 돌지 않는다. 30분 뒤에 한 번 더 시도한다.
    assert due(at(8, 20), [attempt(8, 0)]) is False
    assert due(at(8, 40), [attempt(8, 0)]) is True
    # 하루 세 번까지만.
    assert due(at(10, 0), [attempt(9, 20), attempt(8, 40), attempt(8, 0)]) is False
    # 한 번이라도 성공했으면 끝이다.
    assert due(at(9, 0), [attempt(8, 0, "done")]) is False
    assert due(at(10, 0), [attempt(8, 40, "done"), attempt(8, 0)]) is False
    # 상태가 없는 옛 기록은 성공으로 본다. 실패로 보면 이미 만든 브리핑을 다시 만든다.
    assert due(at(9, 0), [{"kind": "briefing", "finishedAt": at(8, 0).isoformat()}]) is False


def test_catch_up_hours_replace_the_all_or_nothing_window():
    """`skip`은 10분, `catch_up`은 자정까지였다. 데스크톱 앱에 중간이 없었다."""
    day = dt.date(2026, 8, 9)

    def due(hours, hour, minute):
        settings = {"briefing": {"enabled": True, "time": "08:00"}, "missedRuns": {"catchUpHours": hours}}
        now = dt.datetime.combine(day, dt.time(hour, minute)).astimezone()
        return service.automation_due("briefing", settings=settings, now=now, runs=[])

    # 0시간을 골라도 스케줄러가 1분마다 도므로 10분 창은 바닥으로 남는다.
    assert due(0, 8, 5) is True
    assert due(0, 8, 15) is False
    # 기본 3시간이면 아침에 늦게 켜도 따라잡고, 밤에는 안 만든다.
    assert due(3, 9, 0) is True
    assert due(3, 11, 30) is False
    assert due(3, 23, 50) is False
    # 24시간은 예전 `catch_up`과 같다.
    assert due(24, 23, 50) is True
    # 예약 시각 전에는 어떤 설정에서도 돌지 않는다.
    assert due(24, 7, 59) is False


def test_saved_two_state_setting_keeps_its_behaviour():
    day = dt.date(2026, 8, 9)

    def due(missed, hour, minute):
        settings = {"briefing": {"enabled": True, "time": "08:00"}, "missedRuns": missed}
        now = dt.datetime.combine(day, dt.time(hour, minute)).astimezone()
        return service.automation_due("briefing", settings=settings, now=now, runs=[])

    assert due({"onStartup": "skip"}, 8, 15) is False
    assert due({"onStartup": "catch_up"}, 23, 50) is True


def test_failure_is_classified_rather_than_quoted():
    """`automation_failed` 한 마디로는 왜 실패했는지 알 수 없었다.

    그렇다고 예외 원문을 실을 수는 없다 — 반환값과 실행 기록이 모두 HTTP로 나가고,
    메시지에는 요청 URL·헤더·프롬프트 조각이 실릴 수 있다. 예외 **종류**만 읽어
    사람이 행동할 수 있는 원인으로 옮긴다.
    """
    assert service.failure_reason(TimeoutError("...")) == "시간이 초과되었습니다"
    assert service.failure_reason(PermissionError("...")) == "파일에 접근하지 못했습니다"
    # 부모 클래스에서도 걸린다. requests·urllib 계열은 이름이 제각각이다.
    class SomeTransportError(ConnectionError):
        pass

    assert service.failure_reason(SomeTransportError()) == "네트워크에 연결하지 못했습니다"
    assert service.failure_reason(RuntimeError("...")) == service.UNKNOWN_FAILURE_REASON


def test_a_failed_run_never_carries_the_exception_text(monkeypatch):
    """실행 기록도 `/api/automation/runs`로 나간다. 반환값만 막아서는 부족하다."""
    marker = "PRIVATE-PROMPT-FRAGMENT-AND-KEY"
    rows = []
    monkeypatch.setattr(service, "import_rssarchive", lambda **_k: (_ for _ in ()).throw(TimeoutError(marker)))
    monkeypatch.setattr(service, "_append_run", rows.append)

    payload = service.run_automation_once("rss")

    assert marker not in json.dumps(payload, ensure_ascii=False)
    assert marker not in json.dumps(rows, ensure_ascii=False)
    assert payload["errorType"] == "TimeoutError"
    assert payload["errorReason"] == "시간이 초과되었습니다"


def test_markets_outside_the_watched_scope_are_dropped(monkeypatch):
    """관심 시장은 제품의 바깥 테두리다. 자동화가 그걸 몰라서 끈 시장이 계속 생성됐다."""
    monkeypatch.setattr(service, "load_market_scope", lambda: {"selected": ["US", "KR"]})
    assert service.markets_in_scope("all") == (["us", "kr"], ["europe", "jp"])
    assert service.markets_in_scope(["us", "europe"]) == (["us"], ["europe"])
    # 전부 꺼져 있으면 실행할 것이 없다. 러너가 이 경우를 건너뛴 이유로 남긴다.
    assert service.markets_in_scope(["europe"]) == ([], ["europe"])


def test_market_scope_failure_does_not_stop_generation(monkeypatch):
    """설정 파일 하나가 안 읽힌다고 브리핑이 통째로 멈추는 쪽이 더 나쁘다."""
    def boom():
        raise OSError("scope file unreadable")

    monkeypatch.setattr(service, "load_market_scope", boom)
    assert service.markets_in_scope(["us", "europe"]) == (["us", "europe"], [])


def _two_schedules():
    from features.automation.schema import normalize_settings

    return normalize_settings({"briefingSchedules": [
        {"id": "morning", "enabled": True, "time": "08:00", "markets": ["us", "europe"]},
        {"id": "evening", "enabled": True, "time": "18:00", "markets": ["kr", "jp"], "briefingType": "concise"},
    ]})


def test_each_schedule_runs_at_its_own_time():
    """시각 하나짜리 모델로는 네 시장을 다룰 수 없다.

    마감이 전부 다르다 — 유럽 01:30 · 미국 05~06 · 일본 15:00 · 한국 15:30 (KST).
    08:00 한 번으로는 미국 마감은 잘 담지만 한국·일본은 개장 전이다.
    """
    settings = _two_schedules()
    day = dt.date(2026, 8, 9)

    def due_at(hour):
        now = dt.datetime.combine(day, dt.time(hour, 5)).astimezone()
        return [s["id"] for s in settings["briefingSchedules"]
                if service.schedule_due(s, settings=settings, now=now, runs=[])]

    assert due_at(7) == []
    assert due_at(8) == ["morning"]
    assert due_at(12) == []          # 아침 스케줄의 유예 3시간을 지났다
    assert due_at(18) == ["evening"]


def test_the_retry_budget_is_per_schedule():
    """아침이 세 번 실패했다고 저녁까지 막히면 안 된다."""
    settings = _two_schedules()
    day = dt.date(2026, 8, 9)

    def at(hour, minute=0):
        return dt.datetime.combine(day, dt.time(hour, minute)).astimezone()

    spent = [
        {"kind": "briefing", "scheduleId": "morning", "status": "failed", "finishedAt": at(h, m).isoformat()}
        for h, m in ((8, 0), (8, 40), (9, 20))
    ]
    evening = settings["briefingSchedules"][1]
    assert service.schedule_due(evening, settings=settings, now=at(18, 5), runs=spent) is True


def test_old_run_records_without_a_schedule_id_still_count():
    """싱글톤 시절 기록에는 `scheduleId`가 없다. 그걸 무시하면 오늘 것을 또 만든다."""
    settings = _two_schedules()
    day = dt.date(2026, 8, 9)
    now = dt.datetime.combine(day, dt.time(8, 30)).astimezone()
    legacy = [{"kind": "briefing", "status": "done",
               "finishedAt": dt.datetime.combine(day, dt.time(8, 0)).astimezone().isoformat()}]

    assert service.schedule_due(settings["briefingSchedules"][0], settings=settings, now=now, runs=legacy) is False


def test_run_due_automations_runs_every_ready_schedule(monkeypatch):
    settings = _two_schedules()
    monkeypatch.setattr(service, "read_settings", lambda: settings)
    monkeypatch.setattr(service, "list_runs", lambda limit=100: [])
    monkeypatch.setattr(service, "markets_in_scope", lambda markets: (list(markets), []))
    calls = []

    def fake_run(kind, schedule=None):
        calls.append((kind, (schedule or {}).get("id")))
        return {"ok": True, "kind": kind}

    monkeypatch.setattr(service, "run_automation_once", fake_run)
    # 두 스케줄의 유예 창이 모두 열려 있도록 24시간으로 둔다.
    settings["missedRuns"]["catchUpHours"] = 24
    service.run_due_automations(now=dt.datetime(2026, 8, 9, 19, 0).astimezone())

    assert [call for call in calls if call[0] == "briefing"] == [("briefing", "morning"), ("briefing", "evening")]


def test_two_schedules_with_the_same_markets_produce_one_briefing(monkeypatch):
    """시각이 가까운 스케줄 둘이 같은 시장을 보면 같은 보고서를 두 번 만든다."""
    from features.automation.schema import normalize_settings

    settings = normalize_settings({"briefingSchedules": [
        {"id": "a", "enabled": True, "time": "08:00", "markets": ["us"]},
        {"id": "b", "enabled": True, "time": "08:05", "markets": ["us"]},
    ]})
    monkeypatch.setattr(service, "read_settings", lambda: settings)
    monkeypatch.setattr(service, "list_runs", lambda limit=100: [])
    monkeypatch.setattr(service, "markets_in_scope", lambda markets: (list(markets), []))
    calls = []

    def fake_run(kind, schedule=None):
        # marketCalendar는 설정 없이 항상 도는 자동화라 함께 실행된다. 여기서는 제외한다.
        if kind == "briefing":
            calls.append((schedule or {}).get("id"))
        return {"ok": True, "kind": kind}

    monkeypatch.setattr(service, "run_automation_once", fake_run)

    service.run_due_automations(now=dt.datetime(2026, 8, 9, 8, 6).astimezone())

    assert calls == ["a"]


def test_a_schedule_whose_markets_are_all_switched_off_is_recorded_not_silent(monkeypatch):
    monkeypatch.setattr(service, "load_market_scope", lambda: {"selected": ["US", "KR"]})
    monkeypatch.setattr(service, "read_settings", lambda: {"briefingSchedules": []})
    result = service._run_briefing(
        settings={"briefingSchedules": []},
        schedule={"id": "eu", "enabled": True, "time": "08:00", "markets": ["europe"]},
    )
    assert result["skipped"] is True
    assert result["reason"] == "markets_out_of_scope"
    assert result["droppedMarkets"] == ["europe"]
