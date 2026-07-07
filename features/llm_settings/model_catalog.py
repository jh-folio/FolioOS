"""Dynamic model catalog discovery for LLM API and CLI providers.

The catalog is best-effort and cache-first. Normal settings reads reuse the last
known catalog so UI startup never blocks on provider APIs or CLI subprocesses.
Manual refresh is the only path that reaches out to providers.
"""
from __future__ import annotations

import datetime as dt
import json
import re
import subprocess
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
CACHE_PATH = ROOT / "data" / "llm-model-cache.json"

API_MODEL_FALLBACKS = {
    "openai": [
        {"value": "gpt-5.5", "label": "GPT-5.5"},
        {"value": "gpt-5.4", "label": "GPT-5.4"},
        {"value": "gpt-5.4-mini", "label": "GPT-5.4-mini"},
    ],
    "gemini": [
        {"value": "gemini-3.5-flash", "label": "Gemini 3.5 Flash"},
        {"value": "gemini-3.1-pro", "label": "Gemini 3.1 Pro"},
    ],
    "claude": [
        {"value": "claude-fable-5", "label": "Claude Fable 5"},
        {"value": "claude-sonnet-5", "label": "Claude Sonnet 5"},
        {"value": "claude-opus-4-8", "label": "Claude Opus 4.8"},
        {"value": "claude-sonnet-4-6", "label": "Claude Sonnet 4.6"},
        {"value": "claude-haiku-4-5", "label": "Claude Haiku 4.5"},
    ],
}

CLI_MODEL_FALLBACKS = {
    "codex": API_MODEL_FALLBACKS["openai"],
    "claude": API_MODEL_FALLBACKS["claude"],
    "antigravity": [
        {"value": "gemini-3.5-pro", "label": "Gemini 3.5 Pro"},
        {"value": "gemini-3.5-flash", "label": "Gemini 3.5 Flash"},
        {"value": "gemini-3.1-pro", "label": "Gemini 3.1 Pro"},
    ],
}

GENERATION_MODEL_RE = re.compile(r"^(?:gpt|o\d|claude|gemini)[a-z0-9._:-]*(?:-[a-z0-9._:-]+)*$", re.I)


def _now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat()


def _label_for(model_id: str) -> str:
    pieces = str(model_id or "").replace("_", "-").split("-")
    return " ".join(piece.upper() if piece.lower() in {"gpt", "api"} else piece.capitalize() for piece in pieces if piece)


def _choice(model_id: str) -> dict:
    value = str(model_id or "").strip()
    return {"value": value, "label": _label_for(value)}


def _dedupe_choices(primary: list[dict], fallback: list[dict]) -> list[dict]:
    seen = set()
    out = []
    for item in [*primary, *fallback]:
        value = str((item or {}).get("value") or "").strip()
        if not value or value in seen:
            continue
        label = str((item or {}).get("label") or "").strip() or _label_for(value)
        out.append({"value": value, "label": label})
        seen.add(value)
    return out


def _fallback_result(provider: str, transport: str, fallback: list[dict], status: str, message: str = "") -> dict:
    return {
        "provider": provider,
        "transport": transport,
        "source": "fallback",
        "status": status,
        "message": message,
        "modelChoices": _dedupe_choices([], fallback),
        "checkedAt": _now_iso(),
    }


def _remote_result(provider: str, transport: str, models: list[str], fallback: list[dict]) -> dict:
    return {
        "provider": provider,
        "transport": transport,
        "source": "remote",
        "status": "available",
        "message": "모델 목록을 가져왔습니다.",
        "modelChoices": _dedupe_choices([_choice(model_id) for model_id in models], fallback),
        "checkedAt": _now_iso(),
    }


def _read_cache() -> dict:
    try:
        if CACHE_PATH.exists():
            payload = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
            return payload if isinstance(payload, dict) else {}
    except Exception:
        return {}
    return {}


def _write_cache(cache: dict) -> None:
    try:
        CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
        CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception:
        return


def _get_cached(key: str, *, refresh: bool) -> dict | None:
    if refresh:
        return None
    return _get_any_cached(key)


def _get_any_cached(key: str) -> dict | None:
    entry = _read_cache().get(key)
    if isinstance(entry, dict):
        return entry
    return None


def _cached_after_refresh_failure(key: str, status: str, message: str) -> dict | None:
    cached = _get_any_cached(key)
    if not cached:
        return None
    return {
        **cached,
        "source": "cache",
        "status": status,
        "message": message,
    }


def _set_cached(key: str, entry: dict) -> dict:
    cache = _read_cache()
    cache[key] = entry
    _write_cache(cache)
    return entry


def _api_request(provider: str, api_key: str) -> urllib.request.Request:
    if provider == "openai":
        return urllib.request.Request(
            "https://api.openai.com/v1/models",
            headers={"Authorization": f"Bearer {api_key}"},
            method="GET",
        )
    if provider == "gemini":
        return urllib.request.Request(
            "https://generativelanguage.googleapis.com/v1beta/models",
            headers={"x-goog-api-key": api_key},
            method="GET",
        )
    if provider == "claude":
        return urllib.request.Request(
            "https://api.anthropic.com/v1/models",
            headers={"x-api-key": api_key, "anthropic-version": "2023-06-01"},
            method="GET",
        )
    raise ValueError(f"Unsupported LLM API provider: {provider}")


def _generation_model_ids(provider: str, payload: dict) -> list[str]:
    if provider == "openai":
        rows = payload.get("data") if isinstance(payload, dict) else []
        ids = [str(row.get("id") or "").strip() for row in rows or [] if isinstance(row, dict)]
        return [model_id for model_id in ids if GENERATION_MODEL_RE.match(model_id)]
    if provider == "gemini":
        rows = payload.get("models") if isinstance(payload, dict) else []
        out = []
        for row in rows or []:
            if not isinstance(row, dict):
                continue
            methods = row.get("supportedGenerationMethods") or []
            if methods and "generateContent" not in methods:
                continue
            name = str(row.get("name") or "").strip().removeprefix("models/")
            if name and GENERATION_MODEL_RE.match(name):
                out.append(name)
        return out
    rows = payload.get("data") if isinstance(payload, dict) else []
    ids = [str(row.get("id") or "").strip() for row in rows or [] if isinstance(row, dict)]
    return [model_id for model_id in ids if GENERATION_MODEL_RE.match(model_id)]


def discover_api_models(
    provider: str,
    *,
    api_key: str = "",
    refresh: bool = False,
    timeout: int = 12,
    urlopen=urllib.request.urlopen,
    fallback: list[dict] | None = None,
) -> dict:
    provider = str(provider or "").strip().lower()
    fallback_choices = fallback if fallback is not None else API_MODEL_FALLBACKS.get(provider, [])
    if provider not in API_MODEL_FALLBACKS:
        raise ValueError(f"Unsupported LLM API provider: {provider}")
    if not api_key:
        return _fallback_result(provider, "api", fallback_choices, "not_configured", "저장된 API Key가 없어 기본 모델 목록을 사용합니다.")
    key = f"api:{provider}"
    cached = _get_cached(key, refresh=refresh)
    if cached:
        return cached
    if not refresh:
        return _fallback_result(provider, "api", fallback_choices, "cached_missing", "저장된 모델 목록이 없어 기본 모델 목록을 사용합니다.")
    try:
        with urlopen(_api_request(provider, api_key), timeout=timeout) as response:
            payload = json.loads(response.read().decode("utf-8"))
        models = _generation_model_ids(provider, payload)
        if not models:
            cached = _cached_after_refresh_failure(key, "empty_cached", "Provider가 생성 모델을 반환하지 않아 저장된 모델 목록을 유지합니다.")
            if cached:
                return cached
            return _fallback_result(provider, "api", fallback_choices, "empty", "Provider가 사용 가능한 생성 모델을 반환하지 않았습니다.")
        return _set_cached(key, _remote_result(provider, "api", models, fallback_choices))
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, OSError, ValueError, json.JSONDecodeError) as exc:
        cached = _cached_after_refresh_failure(key, "provider_error_cached", f"모델 목록 조회 실패로 저장된 모델 목록을 유지합니다: {type(exc).__name__}")
        if cached:
            return cached
        return _fallback_result(provider, "api", fallback_choices, "provider_error", f"모델 목록 조회 실패: {type(exc).__name__}")


def _parse_cli_models(stdout: str) -> list[str]:
    out = []
    for line in str(stdout or "").splitlines():
        text = line.strip().strip("-*•").strip()
        if not text:
            continue
        candidate = text.split()[0].strip("`'\",")
        if GENERATION_MODEL_RE.match(candidate):
            out.append(candidate)
    return out


def _parse_claude_help_models(stdout: str) -> list[str]:
    text = str(stdout or "")
    out = []
    for model_id in re.findall(r"\bclaude-[a-z0-9._:-]+(?:-[a-z0-9._:-]+)*\b", text, re.I):
        if GENERATION_MODEL_RE.match(model_id):
            out.append(model_id)
    if re.search(r"\bfable\b", text, re.I):
        out.append("claude-fable-5")
    if re.search(r"\bsonnet\b", text, re.I):
        out.append("claude-sonnet-5")
    return list(dict.fromkeys(out))


def discover_cli_models(
    adapter: str,
    *,
    executable: str = "",
    refresh: bool = False,
    timeout: int = 8,
    runner=subprocess.run,
    fallback: list[dict] | None = None,
) -> dict:
    adapter = str(adapter or "").strip().lower()
    fallback_choices = fallback if fallback is not None else CLI_MODEL_FALLBACKS.get(adapter, [])
    if adapter not in CLI_MODEL_FALLBACKS:
        raise ValueError(f"Unsupported CLI provider: {adapter}")
    if not executable:
        return _fallback_result(adapter, "cli", fallback_choices, "not_configured", "실행 파일을 찾지 못해 기본 모델 목록을 사용합니다.")
    key = f"cli:{adapter}:{executable}"
    cached = _get_cached(key, refresh=refresh)
    if cached:
        return cached
    if not refresh:
        return _fallback_result(adapter, "cli", fallback_choices, "cached_missing", "저장된 모델 목록이 없어 기본 모델 목록을 사용합니다.")
    commands = [[executable, "models"], [executable, "model", "list"]]
    for command in commands:
        try:
            proc = runner(command, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=timeout)
            if getattr(proc, "returncode", 1) != 0:
                continue
            models = _parse_cli_models(getattr(proc, "stdout", ""))
            if models:
                return _set_cached(key, _remote_result(adapter, "cli", models, fallback_choices))
        except (OSError, subprocess.SubprocessError, TimeoutError):
            continue
    if adapter == "claude":
        try:
            proc = runner([executable, "--help"], capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=timeout)
            if getattr(proc, "returncode", 1) == 0:
                models = _parse_claude_help_models(getattr(proc, "stdout", ""))
                if models:
                    return _set_cached(key, _remote_result(adapter, "cli", models, fallback_choices))
        except (OSError, subprocess.SubprocessError, TimeoutError):
            pass
    cached = _cached_after_refresh_failure(key, "unsupported_cached", "CLI 모델 조회에 실패해 저장된 모델 목록을 유지합니다.")
    if cached:
        return cached
    return _fallback_result(adapter, "cli", fallback_choices, "unsupported", "CLI가 모델 목록 명령을 제공하지 않아 기본 모델 목록을 사용합니다.")


def choices_from_catalog(catalog: dict) -> list[dict]:
    return list(catalog.get("modelChoices") or [])
