import json

from features.llm_settings import model_catalog


class FakeResponse:
    status = 200

    def __init__(self, body: str):
        self.body = body

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self):
        return self.body.encode("utf-8")


def test_openai_model_catalog_normalizes_remote_models_and_keeps_fallback(tmp_path, monkeypatch):
    monkeypatch.setattr(model_catalog, "CACHE_PATH", tmp_path / "llm-model-cache.json")

    def fake_urlopen(_request, timeout=0):
        assert timeout
        return FakeResponse('{"data":[{"id":"gpt-6.1"},{"id":"whisper-1"},{"id":"gpt-5.5"}]}')

    catalog = model_catalog.discover_api_models(
        "openai",
        api_key="sk-test",
        refresh=True,
        urlopen=fake_urlopen,
        fallback=[{"value": "gpt-5.5", "label": "GPT-5.5"}, {"value": "gpt-5.4", "label": "GPT-5.4"}],
    )

    assert catalog["source"] == "remote"
    assert [item["value"] for item in catalog["modelChoices"]][:3] == ["gpt-6.1", "gpt-5.5", "gpt-5.4"]
    assert "whisper-1" not in {item["value"] for item in catalog["modelChoices"]}


def test_api_model_catalog_falls_back_without_api_key():
    catalog = model_catalog.discover_api_models(
        "claude",
        api_key="",
        fallback=[{"value": "claude-sonnet-4-6", "label": "Claude Sonnet 4.6"}],
    )

    assert catalog["source"] == "fallback"
    assert catalog["status"] == "not_configured"
    assert catalog["modelChoices"] == [{"value": "claude-sonnet-4-6", "label": "Claude Sonnet 4.6"}]


def test_cli_model_catalog_parses_stdout_and_keeps_fallback(tmp_path, monkeypatch):
    monkeypatch.setattr(model_catalog, "CACHE_PATH", tmp_path / "llm-model-cache.json")

    class Completed:
      returncode = 0
      stdout = "gpt-6.1\n- gpt-5.5\n"
      stderr = ""

    catalog = model_catalog.discover_cli_models(
        "codex",
        executable="codex",
        refresh=True,
        runner=lambda *_args, **_kwargs: Completed(),
        fallback=[{"value": "gpt-5.5", "label": "GPT-5.5"}],
    )

    assert catalog["source"] == "remote"
    assert [item["value"] for item in catalog["modelChoices"]] == ["gpt-6.1", "gpt-5.5"]


def test_claude_cli_catalog_uses_help_model_hints_when_list_commands_are_missing(tmp_path, monkeypatch):
    monkeypatch.setattr(model_catalog, "CACHE_PATH", tmp_path / "llm-model-cache.json")

    class Completed:
        def __init__(self, returncode: int, stdout: str = ""):
            self.returncode = returncode
            self.stdout = stdout
            self.stderr = ""

    def runner(command, **_kwargs):
        if command == ["claude", "--help"]:
            return Completed(0, "--model <model> Provide an alias, e.g. 'fable', 'opus', or 'sonnet', or a full name like 'claude-fable-5'.")
        return Completed(1)

    catalog = model_catalog.discover_cli_models(
        "claude",
        executable="claude",
        refresh=True,
        runner=runner,
    )

    values = [item["value"] for item in catalog["modelChoices"]]
    assert catalog["source"] == "remote"
    assert "claude-fable-5" in values
    assert "claude-sonnet-5" in values


def test_model_catalog_uses_cached_models_without_refresh(tmp_path, monkeypatch):
    cache_path = tmp_path / "llm-model-cache.json"
    cache_path.write_text(json.dumps({
        "api:openai": {
            "provider": "openai",
            "transport": "api",
            "source": "remote",
            "status": "available",
            "message": "cached",
            "modelChoices": [{"value": "gpt-cached", "label": "GPT Cached"}],
            "checkedAt": "2020-01-01T00:00:00+00:00",
        }
    }), encoding="utf-8")
    monkeypatch.setattr(model_catalog, "CACHE_PATH", cache_path)

    def should_not_call(*_args, **_kwargs):
        raise AssertionError("model discovery should only run on manual refresh")

    catalog = model_catalog.discover_api_models(
        "openai",
        api_key="sk-test",
        urlopen=should_not_call,
        fallback=[{"value": "gpt-5.5", "label": "GPT-5.5"}],
    )

    assert catalog["source"] == "remote"
    assert [item["value"] for item in catalog["modelChoices"]] == ["gpt-cached"]


def test_model_catalog_does_not_discover_without_refresh_when_cache_missing(tmp_path, monkeypatch):
    monkeypatch.setattr(model_catalog, "CACHE_PATH", tmp_path / "missing-cache.json")

    def should_not_call(*_args, **_kwargs):
        raise AssertionError("model discovery should only run on manual refresh")

    catalog = model_catalog.discover_api_models(
        "openai",
        api_key="sk-test",
        urlopen=should_not_call,
        fallback=[{"value": "gpt-5.5", "label": "GPT-5.5"}],
    )

    assert catalog["source"] == "fallback"
    assert catalog["status"] == "cached_missing"
    assert [item["value"] for item in catalog["modelChoices"]] == ["gpt-5.5"]


def test_model_catalog_keeps_cached_models_when_manual_refresh_fails(tmp_path, monkeypatch):
    cache_path = tmp_path / "llm-model-cache.json"
    cache_path.write_text(json.dumps({
        "api:openai": {
            "provider": "openai",
            "transport": "api",
            "source": "remote",
            "status": "available",
            "message": "cached",
            "modelChoices": [{"value": "gpt-cached", "label": "GPT Cached"}],
            "checkedAt": "2020-01-01T00:00:00+00:00",
        }
    }), encoding="utf-8")
    monkeypatch.setattr(model_catalog, "CACHE_PATH", cache_path)

    def failing_urlopen(*_args, **_kwargs):
        raise TimeoutError("slow provider")

    catalog = model_catalog.discover_api_models(
        "openai",
        api_key="sk-test",
        refresh=True,
        urlopen=failing_urlopen,
        fallback=[{"value": "gpt-5.5", "label": "GPT-5.5"}],
    )

    assert catalog["source"] == "cache"
    assert catalog["status"] == "provider_error_cached"
    assert [item["value"] for item in catalog["modelChoices"]] == ["gpt-cached"]
