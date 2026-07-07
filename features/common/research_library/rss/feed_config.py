"""RSS feed configuration loader.

The loader accepts the small YAML subset used by ``config/rss_feeds.yaml`` and
uses PyYAML when available. Keeping the fallback local lets Folio OS run without
an extra dependency.
"""
from __future__ import annotations

from pathlib import Path


def _coerce_scalar(value: str):
    text = str(value or "").strip()
    if not text:
        return ""
    if (text.startswith('"') and text.endswith('"')) or (text.startswith("'") and text.endswith("'")):
        return text[1:-1]
    low = text.lower()
    if low == "true":
        return True
    if low == "false":
        return False
    if low in {"null", "none"}:
        return None
    try:
        return int(text)
    except ValueError:
        return text


def _fallback_yaml_feeds(text: str) -> list[dict]:
    feeds = []
    current = None
    in_feeds = False
    for raw_line in str(text or "").splitlines():
        line = raw_line.rstrip()
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if stripped == "feeds:":
            in_feeds = True
            continue
        if not in_feeds:
            continue
        if stripped.startswith("- "):
            if current:
                feeds.append(current)
            current = {}
            rest = stripped[2:].strip()
            if rest and ":" in rest:
                key, value = rest.split(":", 1)
                current[key.strip()] = _coerce_scalar(value)
            continue
        if current is not None and ":" in stripped:
            key, value = stripped.split(":", 1)
            current[key.strip()] = _coerce_scalar(value)
    if current:
        feeds.append(current)
    return feeds


def _load_yaml(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    try:
        import yaml  # type: ignore

        data = yaml.safe_load(text) or {}
        return data if isinstance(data, dict) else {}
    except Exception:
        return {"feeds": _fallback_yaml_feeds(text)}


def normalize_feed(row: dict) -> dict | None:
    if not isinstance(row, dict):
        return None
    url = str(row.get("url") or "").strip()
    media = str(row.get("media") or "").strip()
    if not url or not media:
        return None
    enabled = row.get("enabled", True)
    if enabled is False or str(enabled).strip().lower() == "false":
        return None
    default_market = str(row.get("default_market") or "").strip().upper()
    if default_market not in {"US", "KR", "GLOBAL"}:
        default_market = ""
    return {
        "url": url,
        "media": media,
        "category": str(row.get("category") or "").strip(),
        "priority": int(row.get("priority") or 3),
        "allow_full_text": bool(row.get("allow_full_text", False)),
        "reliability_tier": int(row.get("reliability_tier") or 2),
        "default_market": default_market,
    }


def load_rss_feeds(path: str | Path) -> list[dict]:
    config_path = Path(path)
    if not config_path.exists():
        return []
    data = _load_yaml(config_path)
    feeds = []
    for row in data.get("feeds") or []:
        feed = normalize_feed(row)
        if feed:
            feeds.append(feed)
    feeds.sort(key=lambda item: (-int(item.get("priority") or 0), item.get("media", ""), item.get("url", "")))
    return feeds
