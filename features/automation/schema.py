from __future__ import annotations

VALID_MARKET_SCOPES = {"us", "kr", "both"}
VALID_BRIEFING_TYPES = {"default", "market_focused", "concise"}
VALID_QUALITY_MODES = {"diagnose_only", "llm_section_improve", "strict"}


def _bool(value) -> bool:
    return bool(value)


def _int(value, default: int, minimum: int = 1) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return default
    return parsed if parsed >= minimum else default


def _time(value: str, default: str = "08:00") -> str:
    text = str(value or "").strip()
    parts = text.split(":")
    if len(parts) != 2:
        return default
    try:
        hour = int(parts[0])
        minute = int(parts[1])
    except ValueError:
        return default
    if not (0 <= hour <= 23 and 0 <= minute <= 59):
        return default
    return f"{hour:02d}:{minute:02d}"


def default_settings() -> dict:
    return {
        "rss": {"enabled": False, "intervalMinutes": 60, "saveFullText": True},
        "marketMemory": {"enabled": False, "intervalMinutes": 1440, "runAfterRss": True},
        "briefing": {
            "enabled": False,
            "time": "08:00",
            "marketScope": "both",
            "briefingType": "default",
            "qualityMode": "diagnose_only",
            "runPrerequisites": True,
        },
        "missedRuns": {"onStartup": "skip"},
    }


def _choice(value, choices: set[str], default: str) -> str:
    text = str(value or "").strip()
    return text if text in choices else default


def normalize_settings(raw: dict | None) -> dict:
    raw = raw or {}
    defaults = default_settings()
    rss = raw.get("rss") or {}
    memory = raw.get("marketMemory") or {}
    briefing = raw.get("briefing") or {}
    missed = raw.get("missedRuns") or {}
    return {
        "rss": {
            "enabled": _bool(rss.get("enabled", defaults["rss"]["enabled"])),
            "intervalMinutes": _int(rss.get("intervalMinutes"), defaults["rss"]["intervalMinutes"], 15),
            "saveFullText": _bool(rss.get("saveFullText", defaults["rss"]["saveFullText"])),
        },
        "marketMemory": {
            "enabled": _bool(memory.get("enabled", defaults["marketMemory"]["enabled"])),
            "intervalMinutes": _int(memory.get("intervalMinutes"), defaults["marketMemory"]["intervalMinutes"], 30),
            "runAfterRss": _bool(memory.get("runAfterRss", defaults["marketMemory"]["runAfterRss"])),
        },
        "briefing": {
            "enabled": _bool(briefing.get("enabled", defaults["briefing"]["enabled"])),
            "time": _time(briefing.get("time"), defaults["briefing"]["time"]),
            "marketScope": _choice(briefing.get("marketScope"), VALID_MARKET_SCOPES, "both"),
            "briefingType": _choice(briefing.get("briefingType"), VALID_BRIEFING_TYPES, "default"),
            "qualityMode": _choice(briefing.get("qualityMode"), VALID_QUALITY_MODES, "diagnose_only"),
            "runPrerequisites": _bool(briefing.get("runPrerequisites", defaults["briefing"]["runPrerequisites"])),
        },
        "missedRuns": {
            "onStartup": _choice(missed.get("onStartup"), {"skip", "catch_up"}, "skip"),
        },
    }
