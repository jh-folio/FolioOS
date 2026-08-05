"""오늘 시장에서 떠다니는 이야기의 보도량 비중.

수집된 뉴스(articles/rss) 전체를 동인별로 묶어 "어떤 이야기가 그날 장을
이끌었나"를 규칙으로 계산한다. 브리핑과 독립이다 — 브리핑을 생성하지 않아도
매일 계산되고, 브리핑용으로 상한까지 추려낸 부분집합이 아니라 그날 수집된
시장 관련 문서 전체를 쓴다.

비중 이동은 보도량 변화일 뿐 내용 변화가 아니다. 내용 판정은 Change
Intelligence의 의미 비교가 담당하고, 이 모듈은 LLM을 호출하지 않는다.
"""
from __future__ import annotations

import datetime as dt
import threading
import time

from features.common.market_calendar import latest_trading_day_on_or_before, previous_trading_day
from features.common.markets import PRODUCT_MARKETS
from features.daily_briefing.issue_selection import documents_for_scope
from features.daily_briefing.selection import infer_drivers
from features.daily_briefing.service import news_documents, select_briefing_docs

TOP_STORY_LIMIT = 4
OTHER_LABEL = "그 외 이야기"
# 분류 실패 묶음은 이야기가 아니라 나머지다.
UNCLASSIFIED_DRIVERS = {"시장 전반"}

_CACHE_TTL_SECONDS = 600
_cache_lock = threading.Lock()
_cache: dict[tuple[str, str], tuple[float, dict]] = {}


def _story_counts(docs: list[dict]) -> tuple[dict[str, int], int]:
    """동인별 언급 문서 수. 한 문서가 여러 이야기에 속할 수 있으므로
    비중의 분모는 문서 수가 아니라 언급 수다."""
    counts: dict[str, int] = {}
    for doc in docs:
        drivers = [d for d in infer_drivers(doc) if d not in UNCLASSIFIED_DRIVERS]
        for driver in drivers or [OTHER_LABEL]:
            counts[driver] = counts.get(driver, 0) + 1
    return counts, len(docs)


# 시장은 계약에서 파생한다. 유럽·일본 수집량이 적어 비중이 흔들리므로
# 표본이 이 수 미만이면 그 사실을 함께 내보낸다.
STORY_SHARE_MARKETS = tuple(market.value.lower() for market in PRODUCT_MARKETS)
MIN_CONFIDENT_SAMPLE = 12


def _normalized_scope(scope: str) -> str:
    token = str(scope or "us").strip().lower()
    return token if token in STORY_SHARE_MARKETS else "us"


def _scoped_docs(documents: list[dict], date: str, scope: str) -> list[dict]:
    # strict: 두 날짜를 같은 잣대로 비교해야 하므로 시장 window 날짜의 문서만 쓴다.
    # 기본(비-strict) 모드는 pool을 오늘까지 확장해 직전 거래일 계산을 오염시킨다.
    selected, _, _windows = select_briefing_docs(documents, date, strict=True)
    return documents_for_scope(selected, scope)


def _share_rows(counts: dict[str, int]) -> list[dict]:
    total = sum(counts.values())
    if not total:
        return []
    ranked = sorted(
        ((label, count) for label, count in counts.items() if label != OTHER_LABEL),
        key=lambda row: (-row[1], row[0]),
    )
    top = ranked[:TOP_STORY_LIMIT]
    other_count = counts.get(OTHER_LABEL, 0) + sum(count for _, count in ranked[TOP_STORY_LIMIT:])
    rows = [
        {"label": label, "count": count, "share": round(count / total, 3), "isOther": False}
        for label, count in top
    ]
    if other_count:
        rows.append({"label": OTHER_LABEL, "count": other_count, "share": round(other_count / total, 3), "isOther": True})
    return rows


def build_story_share(documents: list[dict], date: str, scope: str) -> dict:
    """오늘·직전 거래일의 이야기 비중과 %p 델타. 순수 함수(주입식)라 DB 없이 테스트한다."""
    scope = _normalized_scope(scope)
    market = scope.upper()
    today_docs = _scoped_docs(documents, date, scope)
    counts, doc_count = _story_counts(today_docs)
    rows = _share_rows(counts)

    day = dt.date.fromisoformat(date)
    # 오늘이 휴장일이면 "직전"은 최근 거래일의 그 이전 거래일이다.
    anchor = latest_trading_day_on_or_before(day, market)
    previous_day = previous_trading_day(anchor if anchor < day else day, market)
    previous_date = previous_day.isoformat()
    previous_counts, previous_doc_count = _story_counts(_scoped_docs(documents, previous_date, scope))
    previous_total = sum(previous_counts.values())
    for row in rows:
        if row["isOther"]:
            continue
        previous_share = (previous_counts.get(row["label"], 0) / previous_total) if previous_total else None
        row["previousShare"] = round(previous_share, 3) if previous_share is not None else None
        row["deltaPp"] = round((row["share"] - previous_share) * 100) if previous_share is not None else None

    warnings = []
    if not doc_count:
        warnings.append("no_collected_news_for_date")
    if not previous_total:
        warnings.append("no_previous_session_news")
    # 표본이 적으면 기사 한두 건이 비중을 수십 %p 움직인다. 그 델타를 그대로
    # 보여주면 수집량 변동이 내용 변화처럼 읽히므로, 표본 부족을 함께 밝힌다.
    if 0 < doc_count < MIN_CONFIDENT_SAMPLE:
        warnings.append("small_sample")
    if 0 < previous_total < MIN_CONFIDENT_SAMPLE:
        warnings.append("small_previous_sample")
    return {
        "schemaVersion": 1,
        "date": date,
        "market": scope,
        "collectedCount": doc_count,
        "previousDate": previous_date,
        "previousCollectedCount": previous_doc_count,
        "items": rows,
        "warnings": warnings,
        "smallSample": bool({"small_sample", "small_previous_sample"} & set(warnings)),
        "minConfidentSample": MIN_CONFIDENT_SAMPLE,
        # 규칙 계산 표시용 계약: 비중 이동은 보도량 변화이지 내용 변화가 아니다.
        "basis": "collected_news_volume",
    }


def story_share_payload(date: str | None, scope: str) -> dict:
    """캐시 있는 API 진입점. 인덱스 로드가 비싸 10분 캐시한다."""
    from features.common.research_library.indexing.service import load_index

    date = date or dt.datetime.now(dt.timezone.utc).astimezone(dt.timezone(dt.timedelta(hours=9))).date().isoformat()
    scope = _normalized_scope(scope)
    key = (date, scope)
    now = time.monotonic()
    with _cache_lock:
        cached = _cache.get(key)
        if cached and now - cached[0] < _CACHE_TTL_SECONDS:
            return cached[1]
    documents = news_documents(load_index())
    payload = build_story_share(documents, date, scope)
    with _cache_lock:
        _cache[key] = (now, payload)
    return payload


def invalidate_story_share_cache() -> None:
    """RSS 수집 직후 다음 조회가 새 문서를 반영하도록 캐시를 비운다."""
    with _cache_lock:
        _cache.clear()
