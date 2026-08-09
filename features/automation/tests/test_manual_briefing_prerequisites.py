import app


def _settings(run_prerequisites: bool) -> dict:
    """저장 형태 그대로. 스케줄 목록이 되었어도 수동 브리핑 동작은 같아야 한다."""
    return {"briefingSchedules": [{"id": "s1", "enabled": True, "runPrerequisites": run_prerequisites}]}


def test_manual_briefing_runs_saved_prerequisites(monkeypatch):
    calls = []
    monkeypatch.setattr(app, "read_automation_settings", lambda: _settings(True))
    monkeypatch.setattr(app, "run_briefing_prerequisites", lambda: calls.append("prerequisites") or {"rss": "ok"})
    monkeypatch.setattr(app, "request_generation_mode", lambda body: "rules")
    monkeypatch.setattr(app, "build_briefing", lambda *args, **kwargs: {"title": "Briefing"})

    result = app.api_create_briefing({"date": "2026-07-07", "marketScope": "us"})

    assert calls == ["prerequisites"]
    assert result["prerequisites"] == {"rss": "ok"}


def test_manual_briefing_skips_prerequisites_when_setting_is_off(monkeypatch):
    calls = []
    monkeypatch.setattr(app, "read_automation_settings", lambda: _settings(False))
    monkeypatch.setattr(app, "run_briefing_prerequisites", lambda: calls.append("prerequisites") or {"rss": "ok"})
    monkeypatch.setattr(app, "request_generation_mode", lambda body: "rules")
    monkeypatch.setattr(app, "build_briefing", lambda *args, **kwargs: {"title": "Briefing"})

    result = app.api_create_briefing({"date": "2026-07-07", "marketScope": "us"})

    assert calls == []
    assert "prerequisites" not in result


def test_a_disabled_schedule_does_not_trigger_manual_prerequisites(monkeypatch):
    """꺼 둔 스케줄의 설정이 손으로 만드는 브리핑을 끌고 가면 안 된다."""
    calls = []
    monkeypatch.setattr(app, "read_automation_settings",
                        lambda: {"briefingSchedules": [{"id": "s1", "enabled": False, "runPrerequisites": True}]})
    monkeypatch.setattr(app, "run_briefing_prerequisites", lambda: calls.append("prerequisites") or {"rss": "ok"})
    monkeypatch.setattr(app, "request_generation_mode", lambda body: "rules")
    monkeypatch.setattr(app, "build_briefing", lambda *args, **kwargs: {"title": "Briefing"})

    app.api_create_briefing({"date": "2026-07-07", "marketScope": "us"})

    assert calls == []
