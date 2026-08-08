"""첫 실행 판정과 안내 완료 기록.

**첫 실행은 "안내 파일이 없다"가 아니다.** 그렇게 잡으면 0.5.0을 쓰던 사람이 0.5.1로
올릴 때 그 파일이 없어 처음 쓰는 사람 취급을 받는다 — 브리핑 50개와 기사 22,548개를
가진 사람에게 "환영합니다, 시작해 볼까요"를 띄우는 셈이다.

그래서 **사용자가 만든 것이 하나라도 있으면 첫 실행이 아니다.** 서버는 처음 켤 때
스스로 파일 10개를 만들지만(설정 기본값, 빈 DB, SEC 캐시) 그중 사용자 자료는 없다.
실측으로 갓 만든 워크스페이스와 쓰던 워크스페이스가 이 목록으로 깨끗이 갈린다.
"""
from __future__ import annotations

import json
from pathlib import Path

from features.common.atomic_replace import write_bytes_atomic
from features.common.utils import now_iso, read_json
from features.common.workspace import data_dir, research_inbox_dir

STATE_NAME = "onboarding-state.json"

# 사용자가 손대야만 생기는 것들. 서버가 스스로 만드는 파일은 넣지 않는다.
USER_FILES = ("portfolio.json", "watchlist.json", "market-scope.json", "obsidian-settings.json")
USER_DIRS = ("briefings", "company-analysis", "topic-reports", "notes", "agent-threads")
INBOX_DIRS = ("rss", "articles", "reports", "filings")


def state_path() -> Path:
    return data_dir() / STATE_NAME


def _has_any(directory: Path) -> bool:
    try:
        return any(directory.iterdir())
    except OSError:
        return False


def has_user_data() -> bool:
    """사용자가 이 워크스페이스에서 무언가를 한 적이 있는가."""
    data = data_dir()
    if any((data / name).is_file() for name in USER_FILES):
        return True
    if any(_has_any(data / name) for name in USER_DIRS):
        return True
    inbox = research_inbox_dir()
    return any(_has_any(inbox / name) for name in INBOX_DIRS)


def onboarding_status() -> dict:
    """화면이 위저드를 띄울지 정하는 데 쓰는 값."""
    saved = read_json(state_path(), None)
    completed = isinstance(saved, dict)
    used = has_user_data()
    if completed:
        reason = "completed"
    elif used:
        reason = "existing_workspace"
    else:
        reason = "fresh"
    return {
        "firstRun": not completed and not used,
        "completed": completed,
        "reason": reason,
        "completedAt": (saved or {}).get("completedAt") if completed else None,
    }


def complete_onboarding(*, skipped: bool = False) -> dict:
    """안내를 끝냈다고 기록한다. 건너뛰어도 기록한다 — 다시 띄우지 않기 위해서다."""
    payload = {"completedAt": now_iso(), "skipped": bool(skipped)}
    write_bytes_atomic(
        state_path(),
        (json.dumps(payload, ensure_ascii=False, indent=2) + "\n").encode("utf-8"),
    )
    return {**onboarding_status(), **payload}
