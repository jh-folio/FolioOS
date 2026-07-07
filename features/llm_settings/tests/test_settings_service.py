from unittest.mock import patch

from features.llm_settings import settings_service


def test_public_settings_exposes_provider_model_choices():
    config = {
        "provider": "openai",
        "enabled": True,
        "apiKey": "",
        "geminiApiKey": "",
        "anthropicApiKey": "",
        "model": "gpt-5.5",
        "geminiModel": "gemini-2.5-flash",
        "anthropicModel": "claude-sonnet-5",
    }
    with (
        patch.object(settings_service, "openai_config", return_value=config),
        patch.object(settings_service, "use_llm_analysis", return_value=True),
        patch.object(settings_service, "dart_api_key", return_value=""),
        patch.object(settings_service, "fred_api_key", return_value=""),
        patch.object(settings_service, "bok_api_key", return_value=""),
        patch.object(settings_service, "public_notion_settings", return_value={}),
        patch.object(settings_service, "ai_agent_enabled", return_value=True),
        patch.object(settings_service, "ai_agent_mode", return_value="cli"),
    ):
        result = settings_service.public_settings()
    providers = result["llm"]["providers"]
    assert providers["openai"]["setupUrl"] == "https://platform.openai.com/api-keys"
    assert providers["gemini"]["setupUrl"] == "https://aistudio.google.com/app/apikey"
    assert providers["claude"]["setupUrl"] == "https://console.anthropic.com/settings/keys"
    assert [item["value"] for item in providers["openai"]["modelChoices"]] == [
        "gpt-5.5", "gpt-5.4", "gpt-5.4-mini",
    ]
    assert [item["value"] for item in providers["claude"]["modelChoices"]] == [
        "claude-fable-5", "claude-sonnet-5", "claude-opus-4-8", "claude-sonnet-4-6", "claude-haiku-4-5",
    ]
    assert result["agent"] == {"enabled": True, "mode": "cli"}


def test_save_settings_persists_ai_agent_policy(monkeypatch):
    updates = {}

    def fake_write_env_values(next_updates):
        updates.update(next_updates)

    monkeypatch.setattr(settings_service, "write_env_values", fake_write_env_values)
    monkeypatch.setattr(settings_service, "public_settings", lambda refresh=False: {"ok": True})

    result = settings_service.save_settings({"agent": {"enabled": False, "mode": "api"}})

    assert result == {"ok": True}
    assert updates["AI_AGENT_ENABLED"] == "0"
    assert updates["USE_LLM_BRIEFING"] == "0"
    assert updates["USE_LLM_ANALYSIS"] == "0"
    assert updates["AI_AGENT_MODE"] == "api"


def test_save_settings_ignores_toss_payload_without_hidden_feature_flag(monkeypatch):
    updates = {}

    monkeypatch.setattr(settings_service, "write_env_values", lambda next_updates: updates.update(next_updates))
    monkeypatch.setattr(settings_service, "public_settings", lambda refresh=False: {"ok": True})
    monkeypatch.setattr(settings_service, "toss_open_api_enabled", lambda: False)

    settings_service.save_settings({
        "toss": {
            "clientId": "client-id",
            "clientSecret": "secret-value",
            "baseUrl": "https://example.invalid",
        }
    })

    assert "TOSS_OPEN_API_CLIENT_ID" not in updates
    assert "TOSS_OPEN_API_CLIENT_SECRET" not in updates
    assert "TOSS_OPEN_API_BASE_URL" not in updates


def test_save_settings_accepts_toss_payload_only_when_hidden_feature_flag_is_on(monkeypatch):
    updates = {}

    monkeypatch.setattr(settings_service, "write_env_values", lambda next_updates: updates.update(next_updates))
    monkeypatch.setattr(settings_service, "public_settings", lambda refresh=False: {"ok": True})
    monkeypatch.setattr(settings_service, "toss_open_api_enabled", lambda: True)

    settings_service.save_settings({
        "toss": {
            "clientId": "client-id",
            "clientSecret": "secret-value",
            "baseUrl": "https://example.invalid",
        }
    })

    assert updates["TOSS_OPEN_API_CLIENT_ID"] == "client-id"
    assert updates["TOSS_OPEN_API_CLIENT_SECRET"] == "secret-value"
    assert updates["TOSS_OPEN_API_BASE_URL"] == "https://example.invalid"


if __name__ == "__main__":
    test_public_settings_exposes_provider_model_choices()
