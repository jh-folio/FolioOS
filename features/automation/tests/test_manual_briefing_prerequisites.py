import app


def test_manual_briefing_runs_saved_prerequisites(monkeypatch):
    calls = []
    monkeypatch.setattr(app, "read_automation_settings", lambda: {"briefing": {"runPrerequisites": True}})
    monkeypatch.setattr(app, "run_briefing_prerequisites", lambda: calls.append("prerequisites") or {"rss": "ok"})
    monkeypatch.setattr(app, "request_generation_mode", lambda body: "rules")
    monkeypatch.setattr(app, "build_briefing", lambda *args, **kwargs: {"title": "Briefing"})

    result = app.api_create_briefing({"date": "2026-07-07", "marketScope": "us"})

    assert calls == ["prerequisites"]
    assert result["prerequisites"] == {"rss": "ok"}


def test_manual_briefing_skips_prerequisites_when_setting_is_off(monkeypatch):
    calls = []
    monkeypatch.setattr(app, "read_automation_settings", lambda: {"briefing": {"runPrerequisites": False}})
    monkeypatch.setattr(app, "run_briefing_prerequisites", lambda: calls.append("prerequisites") or {"rss": "ok"})
    monkeypatch.setattr(app, "request_generation_mode", lambda body: "rules")
    monkeypatch.setattr(app, "build_briefing", lambda *args, **kwargs: {"title": "Briefing"})

    result = app.api_create_briefing({"date": "2026-07-07", "marketScope": "us"})

    assert calls == []
    assert "prerequisites" not in result
