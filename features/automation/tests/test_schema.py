from features.automation.schema import normalize_settings


def test_normalize_settings_defaults_to_disabled():
    settings = normalize_settings({})
    assert settings["rss"]["enabled"] is False
    assert settings["rss"]["saveFullText"] is True
    assert settings["marketMemory"]["enabled"] is False
    assert settings["briefing"]["enabled"] is False
    assert settings["briefing"]["marketScope"] == "both"


def test_normalize_settings_respects_save_full_text_opt_out():
    settings = normalize_settings({"rss": {"enabled": True, "saveFullText": False}})
    assert settings["rss"]["saveFullText"] is False


def test_normalize_settings_clamps_bad_values():
    settings = normalize_settings({
        "rss": {"enabled": True, "intervalMinutes": -5},
        "briefing": {"enabled": True, "time": "99:99", "marketScope": "bad", "generationMode": "bad"},
    })
    assert settings["rss"]["intervalMinutes"] == 60
    assert settings["briefing"]["time"] == "08:00"
    assert settings["briefing"]["marketScope"] == "both"
    assert "generationMode" not in settings["briefing"]
