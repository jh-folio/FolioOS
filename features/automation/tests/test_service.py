from features.automation import service


def test_save_and_read_settings_round_trip(tmp_path, monkeypatch):
    monkeypatch.setattr(service, "SETTINGS_PATH", tmp_path / "automation-settings.json")
    saved = service.save_settings({"rss": {"enabled": True, "intervalMinutes": 120}})
    loaded = service.read_settings()
    assert saved["rss"]["enabled"] is True
    assert loaded["rss"]["intervalMinutes"] == 120


def test_run_unknown_automation_returns_error():
    result = service.run_automation_once("unknown")
    assert result["ok"] is False
    assert "Unsupported automation" in result["error"]


def test_briefing_automation_uses_global_generation_policy(monkeypatch):
    monkeypatch.setattr(service, "default_generation_mode", lambda: "llm_cli")
    monkeypatch.setattr(service, "kst_date", lambda: "2026-07-04")
    monkeypatch.setattr(service, "submit_agent_task", lambda kind, payload: {"kind": kind, "payload": payload})

    result = service._run_briefing({
        "briefing": {
            "marketScope": "both",
            "briefingType": "default",
            "qualityMode": "diagnose_only",
            "generationMode": "rules",
            "runPrerequisites": False,
        }
    })

    assert result["generationMode"] == "llm_cli"
    assert result["briefing"]["kind"] == "briefing"


def test_briefing_prerequisites_skip_recent_market_memory(monkeypatch):
    calls = []
    monkeypatch.setattr(service, "import_rssarchive", lambda run_collection=True: calls.append("rss") or "rss-ok")
    monkeypatch.setattr(service, "run_rss_market_memory_update", lambda: calls.append("memory") or {"ok": True})
    monkeypatch.setattr(service, "_append_run", lambda row: calls.append(f"record:{row['kind']}"))
    monkeypatch.setattr(service, "list_runs", lambda limit=100: [{
        "kind": "marketMemory",
        "status": "done",
        "finishedAt": "2026-07-02T01:00:00",
    }])

    result = service.run_briefing_prerequisites(now=service.dt.datetime(2026, 7, 2, 12, 0, 0), memory_max_age_hours=12)

    assert calls == ["rss"]
    assert result["rss"] == "rss-ok"
    assert result["marketMemory"]["skipped"] is True
    assert result["marketMemory"]["reason"] == "recent"


def test_briefing_prerequisites_run_stale_market_memory(monkeypatch):
    calls = []
    monkeypatch.setattr(service, "import_rssarchive", lambda run_collection=True: calls.append("rss") or "rss-ok")
    monkeypatch.setattr(service, "run_rss_market_memory_update", lambda: calls.append("memory") or {"ok": True})
    monkeypatch.setattr(service, "_append_run", lambda row: calls.append(f"record:{row['kind']}"))
    monkeypatch.setattr(service, "list_runs", lambda limit=100: [{
        "kind": "marketMemory",
        "status": "done",
        "finishedAt": "2026-07-01T23:00:00",
    }])

    result = service.run_briefing_prerequisites(now=service.dt.datetime(2026, 7, 2, 12, 0, 0), memory_max_age_hours=12)

    assert calls == ["rss", "memory", "record:marketMemory"]
    assert result["marketMemory"] == {"ok": True}
