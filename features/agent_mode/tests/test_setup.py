from unittest.mock import patch

from features.agent_mode import setup


def test_save_settings_persists_provider_and_models():
    with (
        patch.object(setup, "write_env_values") as write_values,
        patch("features.agent_mode.bridge.invalidate_bridge_status"),
        patch.object(setup, "settings_payload", side_effect=AssertionError("save should not refresh bridge status")),
    ):
        result = setup.save_settings({
            "provider": "codex",
            "models": {"codex": "gpt-6.1", "claude": "claude-sonnet-4-6"},
        })
    assert result["provider"] == "codex"
    assert result["available"] is False
    assert [item["id"] for item in result["adapters"]] == ["codex", "claude", "antigravity"]
    assert next(item for item in result["adapters"] if item["id"] == "codex")["model"] == "gpt-6.1"
    write_values.assert_called_once_with({
        "AGENT_CLI_PROVIDER": "codex",
        "FOLIO_AGENT_CLAUDE_MODEL": "claude-sonnet-4-6",
        "FOLIO_AGENT_CODEX_MODEL": "gpt-6.1",
    })


def test_save_settings_ignores_empty_model_values_from_unavailable_adapters():
    with (
        patch.object(setup, "write_env_values") as write_values,
        patch("features.agent_mode.bridge.invalidate_bridge_status"),
    ):
        result = setup.save_settings({
            "provider": "codex",
            "models": {"codex": "gpt-6.1", "antigravity": ""},
        })
    assert result["provider"] == "codex"
    assert next(item for item in result["adapters"] if item["id"] == "codex")["model"] == "gpt-6.1"
    write_values.assert_called_once_with({
        "AGENT_CLI_PROVIDER": "codex",
        "FOLIO_AGENT_CODEX_MODEL": "gpt-6.1",
    })


def test_save_settings_rejects_space_containing_model():
    try:
        setup.save_settings({"provider": "codex", "models": {"codex": "gpt latest"}})
    except ValueError as exc:
        assert "Unsupported codex model" in str(exc)
    else:
        raise AssertionError("space-containing model should be rejected")


def test_settings_payload_preserves_unsupported_antigravity_status():
    status = {
        "available": False,
        "selectedAdapter": "",
        "adapters": [{
            "id": "antigravity",
            "label": "Antigravity CLI",
            "installed": True,
            "available": False,
            "authenticated": False,
            "executable": r"C:\Users\me\AppData\Local\agy\bin\agy.exe",
            "error": "Windows headless mode is unsupported.",
            "bridgeSupported": False,
        }],
    }
    with (
        patch("features.agent_mode.bridge.bridge_status", return_value=status),
        patch.object(setup, "discover_cli_models", side_effect=AssertionError("unsupported adapter should not refresh models")),
    ):
        result = setup.settings_payload(refresh=True)
    row = result["adapters"][0]
    assert row["bridgeSupported"] is False
    assert row["loginSupported"] is False
    assert row["installSupported"] is False
    assert row["modelChoices"] == []
    assert row["model"] == ""


if __name__ == "__main__":
    test_save_settings_persists_provider_and_models()
    test_save_settings_ignores_empty_model_values_from_unavailable_adapters()
    test_save_settings_rejects_space_containing_model()
    test_settings_payload_preserves_unsupported_antigravity_status()
