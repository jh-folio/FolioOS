"""관심 시장 범위 — 필터가 아니라 제품의 바깥 테두리.

시장이 넷(US/KR/EUROPE/JP)이 되면서, 관심 없는 시장의 기사가 목록마다 섞이고
사용자는 화면마다 매번 좁혀야 했다. 여기서 고른 범위가 RSS 수집·목록, 브리핑
생성 선택지, 시장 캘린더, 내러티브 세그먼트의 상한이 된다. Task 1.4의 필터는
이 범위 **안에서** 더 좁힐 때만 쓴다.

결정 기록 (2026-08-07 사용자):
- 범위에서 꺼진 시장은 **수집까지 끈다**. 다시 켜면 그 시장 피드를 즉시, 나이
  제한 없이 수집한다. RSS는 피드가 내어주는 최근 항목까지만 받을 수 있으므로
  꺼져 있던 기간의 공백은 완전히는 메워지지 않는다 — 화면이 그 사실을 말한다.
- GLOBAL(유가·달러·공급망)과 UNKNOWN은 특정 시장 소유가 아니므로 항상 보인다.
- 기본값은 US/KR이다. 0.4 사용자가 쓰던 범위 그대로다.
"""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

from features.common.atomic_replace import write_bytes_atomic
from features.common.workspace import data_dir

MARKETS = ("US", "KR", "EUROPE", "JP")
DEFAULT_SELECTED = ("US", "KR")
# 어떤 범위를 골라도 남는 태그. 특정 시장 소유가 아니다.
ALWAYS_VISIBLE = ("GLOBAL", "UNKNOWN")

_ROOT = Path(__file__).resolve().parents[2]
SCOPE_PATH = data_dir() / "market-scope.json"

MARKET_LABELS = {"US": "미국", "KR": "한국", "EUROPE": "유럽", "JP": "일본"}


def _now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat()


def normalize_selected(values) -> list[str]:
    """알 수 없는 값은 버리고 순서를 고정한다. 전부 버려지면 기본값이다."""
    tokens = []
    for value in values or []:
        token = str(value or "").strip().upper()
        if token == "EU":
            token = "EUROPE"
        if token in MARKETS and token not in tokens:
            tokens.append(token)
    ordered = [market for market in MARKETS if market in tokens]
    return ordered or list(DEFAULT_SELECTED)


def load_market_scope(path: Path | None = None) -> dict:
    scope_path = path or SCOPE_PATH
    payload: dict = {}
    try:
        payload = json.loads(scope_path.read_text(encoding="utf-8"))
    except Exception:
        payload = {}
    selected = normalize_selected(payload.get("selected") or DEFAULT_SELECTED)
    enabled_at = payload.get("enabledAt") if isinstance(payload.get("enabledAt"), dict) else {}
    return {
        "selected": selected,
        "enabledAt": {k: str(v) for k, v in enabled_at.items() if k in MARKETS},
        "updatedAt": str(payload.get("updatedAt") or ""),
    }


def save_market_scope(selected, path: Path | None = None) -> tuple[dict, list[str]]:
    """범위를 저장하고 새로 켜진 시장 목록을 돌려준다.

    새로 켜진 시장은 호출자가 즉시 수집을 돌릴 대상이다. 언제 켰는지는
    `enabledAt`에 남아, 그 시장의 자료가 언제부터 있는지 화면이 말할 수 있다.
    """
    scope_path = path or SCOPE_PATH
    before = load_market_scope(scope_path)
    next_selected = normalize_selected(selected)
    newly_enabled = [m for m in next_selected if m not in before["selected"]]
    now = _now_iso()
    enabled_at = dict(before["enabledAt"])
    for market in newly_enabled:
        enabled_at[market] = now
    payload = {"selected": next_selected, "enabledAt": enabled_at, "updatedAt": now}
    scope_path.parent.mkdir(parents=True, exist_ok=True)
    write_bytes_atomic(scope_path, json.dumps(payload, ensure_ascii=False, indent=1).encode("utf-8"))
    return load_market_scope(scope_path), newly_enabled


def feed_in_scope(feed: dict, selected) -> bool:
    """피드가 범위 안인가. GLOBAL 피드는 어떤 범위에서도 수집한다."""
    market = str((feed or {}).get("default_market") or "").strip().upper()
    if not market or market == "GLOBAL":
        return True
    chosen = set(normalize_selected(selected))
    return market in chosen


def market_tags_visible(tags, selected) -> bool:
    """저장된 항목의 시장 태그가 범위 안에서 보이는가.

    태그가 없거나 GLOBAL/UNKNOWN이 섞여 있으면 보인다 — 특정 시장 소유가
    아닌 자료를 범위로 숨기면 유가·달러 뉴스가 통째로 사라진다.
    """
    tokens = {str(t or "").strip().upper() for t in (tags or []) if str(t or "").strip()}
    if not tokens:
        return True
    if tokens & set(ALWAYS_VISIBLE):
        return True
    return bool(tokens & set(normalize_selected(selected)))
