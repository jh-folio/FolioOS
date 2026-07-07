"""Application settings — read public view and save env-backed configuration."""
from pathlib import Path

from features.llm_settings.client import (
    ai_agent_enabled,
    ai_agent_mode,
    dart_api_key,
    fred_api_key,
    bok_api_key,
    mask_secret,
    openai_config,
    toss_open_api_base_url,
    toss_open_api_client_id,
    toss_open_api_client_secret,
    toss_open_api_enabled,
    toss_open_api_key,
    use_llm_analysis,
    write_env_values,
)
from features.notion_export.service import public_notion_settings
from features.llm_settings.provider_status import PROVIDER_INFO
from features.llm_settings.model_catalog import API_MODEL_FALLBACKS, choices_from_catalog, discover_api_models

ROOT = Path(__file__).resolve().parent.parent.parent
FEATURES_DIR = ROOT / "features"
MARKET_MEMORY_PROMPT_PATH = FEATURES_DIR / "market_memory" / "prompt.md"

API_MODEL_CHOICES = API_MODEL_FALLBACKS


def read_market_memory_prompt():
    try:
        return MARKET_MEMORY_PROMPT_PATH.read_text(encoding="utf-8")
    except Exception:
        return ""


def public_settings(*, refresh: bool = False):
    cfg = openai_config()
    openai_catalog = discover_api_models("openai", api_key=cfg["apiKey"], refresh=refresh)
    gemini_catalog = discover_api_models("gemini", api_key=cfg["geminiApiKey"], refresh=refresh)
    claude_catalog = discover_api_models("claude", api_key=cfg["anthropicApiKey"], refresh=refresh)
    payload = {
        "agent": {
            "enabled": ai_agent_enabled(),
            "mode": ai_agent_mode(),
        },
        "llm": {
            "provider": cfg["provider"],
            "enabled": cfg["enabled"],
            "envPath": str(ROOT / ".env"),
            "providers": {
                "openai": {"hasApiKey": bool(cfg["apiKey"]), "apiKeyMasked": mask_secret(cfg["apiKey"]), "model": cfg["model"], "modelChoices": choices_from_catalog(openai_catalog), "modelDiscovery": {k: v for k, v in openai_catalog.items() if k != "modelChoices"}, **PROVIDER_INFO["openai"]},
                "gemini": {"hasApiKey": bool(cfg["geminiApiKey"]), "apiKeyMasked": mask_secret(cfg["geminiApiKey"]), "model": cfg["geminiModel"], "modelChoices": choices_from_catalog(gemini_catalog), "modelDiscovery": {k: v for k, v in gemini_catalog.items() if k != "modelChoices"}, **PROVIDER_INFO["gemini"]},
                "claude": {"hasApiKey": bool(cfg["anthropicApiKey"]), "apiKeyMasked": mask_secret(cfg["anthropicApiKey"]), "model": cfg["anthropicModel"], "modelChoices": choices_from_catalog(claude_catalog), "modelDiscovery": {k: v for k, v in claude_catalog.items() if k != "modelChoices"}, **PROVIDER_INFO["claude"]},
            },
        },
        "analysis": {
            "enabled": use_llm_analysis(),
        },
        "dart": {
            "hasApiKey": bool(dart_api_key()),
            "apiKeyMasked": mask_secret(dart_api_key()),
        },
        "fred": {
            "hasApiKey": bool(fred_api_key()),
            "apiKeyMasked": mask_secret(fred_api_key()),
        },
        "bok": {
            "hasApiKey": bool(bok_api_key()),
            "apiKeyMasked": mask_secret(bok_api_key()),
        },
        "openai": {
            "hasApiKey": bool(cfg["apiKey"]),
            "apiKeyMasked": mask_secret(cfg["apiKey"]),
            "model": cfg["model"],
            "enabled": cfg["enabled"],
            "envPath": str(ROOT / ".env"),
        },
        "notion": public_notion_settings(),
    }
    if toss_open_api_enabled():
        toss_client_id = toss_open_api_client_id()
        toss_client_secret = toss_open_api_client_secret()
        toss_legacy_key = toss_open_api_key()
        payload["toss"] = {
            "hasApiKey": bool(toss_client_secret or toss_legacy_key),
            "apiKeyMasked": mask_secret(toss_client_secret or toss_legacy_key),
            "hasClientId": bool(toss_client_id),
            "clientIdMasked": mask_secret(toss_client_id),
            "hasClientSecret": bool(toss_client_secret),
            "clientSecretMasked": mask_secret(toss_client_secret),
            "baseUrl": toss_open_api_base_url(),
            "ready": bool(toss_client_id and toss_client_secret),
        }
    return payload


def save_settings(body):
    data = body if isinstance(body, dict) else {}
    llm = data.get("llm", {})
    agent = data.get("agent", {}) if isinstance(data.get("agent", {}), dict) else {}
    openai = data.get("openai", {})
    updates = {}
    if "enabled" in agent:
        updates["AI_AGENT_ENABLED"] = "1" if bool(agent.get("enabled")) else "0"
        # Keep legacy switches aligned so older code paths and tools read the same policy.
        updates["USE_LLM_BRIEFING"] = updates["AI_AGENT_ENABLED"]
        updates["USE_LLM_ANALYSIS"] = updates["AI_AGENT_ENABLED"]
    agent_mode = str(agent.get("mode", "") or "").strip().lower().replace("-", "_")
    if agent_mode in {"cli", "llm_cli", "agent"}:
        updates["AI_AGENT_MODE"] = "cli"
    elif agent_mode in {"api", "llm_api"}:
        updates["AI_AGENT_MODE"] = "api"
    provider = str(llm.get("provider", "") or "").strip().lower()
    if provider in {"openai", "gemini", "claude"}:
        updates["LLM_PROVIDER"] = provider
    dart = data.get("dart", {}) if isinstance(data.get("dart", {}), dict) else {}
    dart_key = str(dart.get("apiKey", "") or "").strip()
    if dart_key:
        updates["DART_API_KEY"] = dart_key

    fred = data.get("fred", {}) if isinstance(data.get("fred", {}), dict) else {}
    fred_key = str(fred.get("apiKey", "") or "").strip()
    if fred_key:
        updates["FRED_API_KEY"] = fred_key

    bok = data.get("bok", {}) if isinstance(data.get("bok", {}), dict) else {}
    bok_key = str(bok.get("apiKey", "") or "").strip()
    if bok_key:
        updates["BOK_API_KEY"] = bok_key

    if toss_open_api_enabled():
        toss = data.get("toss", {}) if isinstance(data.get("toss", {}), dict) else {}
        toss_key = str(toss.get("apiKey", "") or "").strip()
        if toss_key:
            updates["TOSS_OPEN_API_KEY"] = toss_key
        toss_client_id = str(toss.get("clientId", "") or "").strip()
        if toss_client_id:
            updates["TOSS_OPEN_API_CLIENT_ID"] = toss_client_id
        toss_client_secret = str(toss.get("clientSecret", "") or "").strip()
        if toss_client_secret:
            updates["TOSS_OPEN_API_CLIENT_SECRET"] = toss_client_secret
        toss_base_url = str(toss.get("baseUrl", "") or "").strip()
        if toss_base_url:
            updates["TOSS_OPEN_API_BASE_URL"] = toss_base_url

    providers = llm.get("providers", {}) if isinstance(llm.get("providers", {}), dict) else {}
    openai_data = providers.get("openai", openai) or {}
    gemini_data = providers.get("gemini", {}) or {}
    claude_data = providers.get("claude", {}) or {}

    for key, model_key, env_key in [
        (openai_data, "model", "OPENAI_MODEL"),
        (gemini_data, "model", "GEMINI_MODEL"),
        (claude_data, "model", "ANTHROPIC_MODEL"),
    ]:
        model = str(key.get(model_key, "") or "").strip()
        if model:
            updates[env_key] = model

    for key, api_key_env in [
        (openai_data, "OPENAI_API_KEY"),
        (gemini_data, "GEMINI_API_KEY"),
        (claude_data, "ANTHROPIC_API_KEY"),
    ]:
        api_key = str(key.get("apiKey", "") or "").strip()
        if api_key:
            updates[api_key_env] = api_key

    notion = data.get("notion", {}) if isinstance(data.get("notion", {}), dict) else {}
    notion_token = str(notion.get("token", "") or "").strip()
    if notion_token:
        updates["NOTION_TOKEN"] = notion_token
    notion_db_id = str(notion.get("dbId", "") or "").strip()
    if notion_db_id:
        updates["NOTION_DB_ID"] = notion_db_id

    if updates:
        write_env_values(updates)
    return public_settings()
