"""세션 수치를 받아 검증하고 캐시한다. 정책은 여기 한 곳에만 둔다.

이 모듈이 생긴 이유는 실측 사고다. `korea-market-data-2026-08-10.json`이 08-10 08:02
(KRX 개장 한 시간 전)에 만들어졌고, 그 안에는 이런 것이 들어 있었다.

    date: "2026-08-10"
    KOSPI  asOfDate 2026-08-07   close 6258.77
    USDKRW asOfDate 2026-08-09
    warnings: ["KOSPI: market_data_unavailable", ...]

조회가 실패한 것을 코드가 **알고 있으면서** 08-10 수치로 저장했다. 그리고 그 파일이
영원히 재사용됐다 — Agent 경로의 캐시가 `ttl_seconds`를 인자로 받고 한 번도 쓰지
않았기 때문이다. 그 결과 다음 날 저녁에 다시 만든 브리핑도 금요일 종가를 받았고,
모델은 제공된 수치를 버리고 기사 본문의 숫자를 썼다.

그래서 세 가지를 강제한다.

1. **틀린 것을 캐시하지 않는다.** 대표지수 `asOfDate`가 대상 세션과 다르면 저장하지
   않는다. 다음 실행이 다시 시도한다.
2. **실패가 성공을 덮지 않는다.** 이미 유효한 캐시가 있으면 실패 응답으로 바꾸지 않는다.
3. **확정된 과거는 오래 두고, 진행 중인 장은 짧게 둔다.** 마감 세션의 종가는 바뀌지
   않지만 장중 값은 몇 분이면 낡는다.

캐시 키에 **세션 상태가 들어간다.** 같은 세션이라도 장중 스냅샷과 마감 종가는 다른
값이고, 상태를 키에서 빼면 장중에 받은 값이 마감 값으로 굳는다.
"""
from __future__ import annotations

import datetime as dt
from pathlib import Path

from features.common.utils import now_iso, read_json, write_json
from features.common.workspace import data_dir

SCHEMA_VERSION = 1

# 캐시 키에 들어가는 세션 상태. `daily_briefing.target`의 같은 값과 문자열이 같아야 한다.
CLOSED = "closed"
INTRADAY = "intraday"

# 장중 값은 몇 분이면 낡는다. 마감 종가는 바뀌지 않으므로 다시 받을 이유가 없다.
INTRADAY_TTL_SECONDS = 300
CLOSED_TTL_SECONDS: int | None = None

CACHE_DIR = data_dir() / "market-session-cache"


def cache_path(dataset: str, market: str, session_date: str, state: str) -> Path:
    """`{dataset}-{market}-{sessionDate}.{state}.json`.

    상태가 파일명에 들어간다. 예전 `korea-market-data-{date}.json`은 상태가 없어서
    개장 전에 받은 값이 그 세션의 확정 수치로 굳었다.
    """
    stem = f"{dataset}-{market}-{session_date}.{state}"
    return CACHE_DIR / f"{stem}.json"


def _fresh_enough(row: dict, state: str) -> bool:
    ttl = INTRADAY_TTL_SECONDS if state == "intraday" else CLOSED_TTL_SECONDS
    if ttl is None:
        return True
    try:
        cached_at = dt.datetime.fromisoformat(str(row.get("cachedAt") or ""))
    except ValueError:
        return False
    age = dt.datetime.now(dt.timezone.utc) - cached_at
    return age.total_seconds() < ttl


def primary_as_of_dates(payload: dict) -> set[str]:
    """대표지수가 말하는 기준일. 비어 있으면 검증할 근거가 없다는 뜻이다."""
    indices = (payload or {}).get("indices") or {}
    return {
        str((row or {}).get("asOfDate") or "")[:10]
        for row in indices.values()
        if isinstance(row, dict) and (row or {}).get("asOfDate")
    }


def validate(payload: dict, session_date: str) -> tuple[bool, str]:
    """대상 세션의 수치가 맞는지. 맞지 않으면 이유를 돌려준다.

    `ok: True`만 보고 통과시키면 안 된다 — 사고 당시 payload가 정확히 그 모양이었다.
    """
    if not isinstance(payload, dict) or not payload.get("ok"):
        return False, "fetch_failed"
    as_of = primary_as_of_dates(payload)
    if not as_of:
        return False, "no_primary_anchor"
    mismatched = sorted(value for value in as_of if value != session_date)
    if mismatched:
        return False, f"as_of_mismatch:{','.join(mismatched)}"
    return True, ""


def load(dataset: str, market: str, session_date: str, state: str) -> dict | None:
    """유효하고 신선한 캐시만 돌려준다. 아니면 `None`이라 호출부가 다시 받는다."""
    row = read_json(cache_path(dataset, market, session_date, state), None)
    if not isinstance(row, dict):
        return None
    if int(row.get("schemaVersion") or 0) != SCHEMA_VERSION:
        return None
    payload = row.get("payload")
    if not isinstance(payload, dict):
        return None
    ok, _reason = validate(payload, session_date)
    if not ok:
        # 예전 형식이나 예전 사고로 남은 잘못된 값. 읽지 않는다.
        return None
    if not _fresh_enough(row, state):
        return None
    return payload


def store(dataset: str, market: str, session_date: str, state: str, payload: dict) -> tuple[bool, str]:
    """검증을 통과한 것만 저장한다. `(저장했는가, 이유)`."""
    ok, reason = validate(payload, session_date)
    if not ok:
        return False, reason
    write_json(cache_path(dataset, market, session_date, state), {
        "schemaVersion": SCHEMA_VERSION,
        "dataset": dataset,
        "market": market,
        "sessionDate": session_date,
        "state": state,
        "provider": str((payload or {}).get("provider") or ""),
        "cachedAt": now_iso(),
        "payload": payload,
    })
    return True, ""


def session_market_data(dataset: str, market: str, session_date: str, state: str, fetcher):
    """캐시 → 조회 → 검증 → 저장. 검증에 실패하면 `None`과 이유를 돌려준다.

    **`None`을 빈 수치로 메우지 않는다.** 그 세션 수치가 없으면 없는 것이고, 그 판단은
    실행 가능 게이트(Phase 3)가 쓴다. 여기서 직전 세션 값으로 대신하면 사고가 반복된다.
    """
    cached = load(dataset, market, session_date, state)
    if cached is not None:
        return cached, ""
    try:
        payload = fetcher(session_date)
    except Exception as exc:
        return None, f"fetch_error:{type(exc).__name__}"
    ok, reason = validate(payload, session_date)
    if not ok:
        # 실패는 캐시하지 않는다. 기존 유효 캐시도 건드리지 않는다 — `store`를 부르지
        # 않으므로 덮어쓸 일 자체가 없다.
        return None, reason
    store(dataset, market, session_date, state, payload)
    return payload, ""
