"""Non-secret provider kill switches stored separately from credentials."""
from __future__ import annotations

from pathlib import Path

from features.common.utils import read_json, write_json

PROVIDERS = ("benzinga",)


def path_for(data_dir: Path) -> Path:
    return Path(data_dir) / "signal-provider-settings.json"


def normalize_provider_settings(value: dict | None) -> dict:
    """Optional per-provider overrides. Missing rows keep the config default (not off)."""
    value = value if isinstance(value, dict) else {}
    normalized: dict[str, dict] = {}
    for provider in PROVIDERS:
        row = value.get(provider)
        if isinstance(row, dict) and "enabled" in row:
            normalized[provider] = {"enabled": bool(row.get("enabled"))}
    return normalized


def load_provider_settings(data_dir: Path) -> dict:
    return normalize_provider_settings(read_json(path_for(data_dir), {}))


def save_provider_settings(data_dir: Path, value: dict | None) -> dict:
    normalized = normalize_provider_settings(value)
    write_json(path_for(data_dir), normalized)
    return normalized
