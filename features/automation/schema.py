from __future__ import annotations

# 자동화 기본값은 네 시장(`all`)이다. 저장된 `both` 설정은 그대로 두 시장으로 남긴다.
VALID_MARKET_SCOPES = {"us", "kr", "europe", "jp", "all", "both"}
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


# 시장 일정 갱신은 사용자 선택 항목이 아니다. 끄면 지표 발표일이 조용히 비어 있게 되고,
# 화면은 "이번 주에 일정이 없음"과 구분되지 않는다. 실제로 이 설정이 꺼진 채로 남아
# CPI·고용지표가 한 건도 등록되지 않은 상태가 지속됐다. Agent를 호출하지 않고 비용도
# 없으므로 항상 6시간마다 돈다.
MARKET_CALENDAR_INTERVAL_MINUTES = 360


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
