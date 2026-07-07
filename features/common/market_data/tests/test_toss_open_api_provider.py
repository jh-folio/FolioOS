import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features.common.market_data.providers import TossOpenApiKoreaMarketProvider
from features.llm_settings.settings_service import public_settings


def test_toss_open_api_provider_is_disabled_by_default(monkeypatch):
    monkeypatch.setenv("FOLIO_ENABLE_TOSS_OPEN_API", "0")
    monkeypatch.setenv("TOSS_OPEN_API_CLIENT_ID", "client-id")
    monkeypatch.setenv("TOSS_OPEN_API_CLIENT_SECRET", "client-secret")

    payload = TossOpenApiKoreaMarketProvider().fetch_korea_market("2026-06-23")

    assert payload["ok"] is False
    assert payload["provider"] == "toss_open_api"
    assert "disabled or key not configured" in payload["warnings"][0]


def test_toss_open_api_provider_is_safe_stub_until_endpoint_is_enabled(monkeypatch):
    monkeypatch.setenv("FOLIO_ENABLE_TOSS_OPEN_API", "1")
    monkeypatch.setenv("TOSS_OPEN_API_CLIENT_ID", "client-id")
    monkeypatch.setenv("TOSS_OPEN_API_CLIENT_SECRET", "client-secret")
    monkeypatch.setenv("TOSS_OPEN_API_BASE_URL", "https://example.invalid")

    payload = TossOpenApiKoreaMarketProvider().fetch_korea_market("2026-06-23")

    assert payload["ok"] is False
    assert payload["provider"] == "toss_open_api"
    assert "aggregate index endpoint is not documented" in payload["warnings"][0]
    assert "client-secret" not in repr(payload)


def test_public_settings_hides_toss_settings_without_release_flag(monkeypatch):
    monkeypatch.setenv("FOLIO_ENABLE_TOSS_OPEN_API", "0")
    monkeypatch.setenv("TOSS_OPEN_API_CLIENT_ID", "demo-client-value")
    monkeypatch.setenv("TOSS_OPEN_API_CLIENT_SECRET", "safe-holder-value")
    monkeypatch.setenv("TOSS_OPEN_API_BASE_URL", "https://example.invalid")

    settings = public_settings()

    assert "toss" not in settings
    assert "safe-holder-value" not in repr(settings)


def test_public_settings_reports_toss_key_without_exposing_secret_when_enabled(monkeypatch):
    monkeypatch.setenv("FOLIO_ENABLE_TOSS_OPEN_API", "1")
    monkeypatch.setenv("TOSS_OPEN_API_CLIENT_ID", "demo-client-value")
    monkeypatch.setenv("TOSS_OPEN_API_CLIENT_SECRET", "safe-holder-value")
    monkeypatch.setenv("TOSS_OPEN_API_BASE_URL", "https://example.invalid")

    settings = public_settings()

    assert settings["toss"]["hasApiKey"] is True
    assert settings["toss"]["ready"] is True
    assert settings["toss"]["baseUrl"] == "https://example.invalid"
    assert settings["toss"]["clientIdMasked"] == "dem...alue"
    assert settings["toss"]["clientSecretMasked"] == "saf...alue"
    assert "safe-holder-value" not in repr(settings)
