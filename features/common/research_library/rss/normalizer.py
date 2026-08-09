"""Normalize collector-specific rows into Folio OS intake evidence items."""
from __future__ import annotations

import datetime as dt
import hashlib

from features.common.market_calendar import infer_doc_markets
from features.common.markets import PRODUCT_MARKETS
from features.common.research_library.rss.policy import normalize_url


# feed가 선언한 기본 시장. 시장 계약에서 파생한다 — {US, KR, GLOBAL}로 적어두면
# 유럽·일본 피드가 본문 신호를 못 찾았을 때 UNKNOWN으로 남는다.
EXPLICIT_FEED_MARKETS = frozenset({market.value for market in PRODUCT_MARKETS} | {"GLOBAL"})


def markets_with_feed_fallback(markets, default_market) -> list:
    """Fill in the feed's declared market, but only when nothing else spoke.

    본문/제목에서 아무 시장 신호도 못 찾았을 때만 feed 단위 기본 시장을 약한 힌트로 쓴다.
    발행사=시장 신호 금지 원칙(세션 레인 오분류 방지)은 실제 신호가 있는 경우 feed 힌트가
    절대 이기지 못하는 구조로 지킨다 — 한국 매체가 쓴 월가 기사 3,002건이 `US,KR,GLOBAL`로
    남아 있는 것이 그 덕이다. 그래서 이 값을 `infer_doc_markets()`의 입력 dict에 넣으면 안
    된다. 거기서는 사다리 3단계로 걸려 키워드 추론을 통째로 덮는다.

    수집·캐시 재구성·아카이브 쓰기 세 경로가 같은 규칙을 쓰도록 여기 한 곳에 둔다.
    예전에는 수집 경로에만 있어서, 표를 고쳐도 저장된 자료가 따라오지 않았다.
    """
    if list(markets or []) != ["UNKNOWN"]:
        return list(markets or [])
    hint = str(default_market or "").strip().upper()
    return [hint] if hint in EXPLICIT_FEED_MARKETS else ["UNKNOWN"]


def stable_evidence_id(*parts: str) -> str:
    digest = hashlib.sha256("|".join(str(part or "") for part in parts).encode("utf-8")).hexdigest()[:16]
    return f"rss_{digest}"


def rss_item_to_evidence(
    *,
    item: dict,
    source: str,
    feed: dict | None = None,
    collected_at_utc: dt.datetime | None = None,
) -> dict:
    feed = feed or {}
    published_at = item.get("published_at_utc")
    if isinstance(published_at, dt.datetime) and published_at.tzinfo is None:
        published_at = published_at.replace(tzinfo=dt.timezone.utc)
    if not isinstance(published_at, dt.datetime):
        published_at = None
    collected_at = collected_at_utc or dt.datetime.now(dt.timezone.utc)
    # Defensive guard: a published time after collection is impossible and usually
    # signals a feed timezone/parse error. Cap it at collection time so the archive
    # never shows future-dated articles.
    if isinstance(published_at, dt.datetime) and published_at > collected_at:
        published_at = collected_at
    url = str(item.get("link") or item.get("url") or "").strip()
    normalized = normalize_url(url)
    title = str(item.get("title") or "").strip()
    summary = str(item.get("summary") or item.get("description") or "").strip()
    evidence_id = stable_evidence_id("rss", normalized or url, title, source, str(published_at or ""))
    markets = infer_doc_markets({
        "title": title,
        "summary": summary,
        "content": str(item.get("full_text") or ""),
        "url": url,
        "source": source,
    })
    markets = markets_with_feed_fallback(markets, feed.get("default_market"))
    # 보도자료 와이어는 기업 자료이지 편집된 뉴스가 아니다. source_type으로 갈라 두면
    # 브리핑 입력에서만 제외하고 워치리스트·기업분석에서는 그대로 쓸 수 있다.
    source_type = str((feed or {}).get("source_type") or "news").strip() or "news"
    return {
        "id": evidence_id,
        "collector": "rss",
        "source_type": source_type,
        "source": source,
        "title": title,
        "url": url,
        "normalized_url": normalized,
        "published_at_utc": published_at,
        "collected_at_utc": collected_at,
        "query": str(feed.get("url") or ""),
        "query_source": "rss_feed",
        "language": str(feed.get("language") or "").strip().lower(),
        "description": str(item.get("description") or "").strip(),
        "summary": summary,
        "full_text": str(item.get("full_text") or "").strip(),
        "collection_status": str(item.get("status") or "metadata_only").strip(),
        "error": str(item.get("error") or "").strip(),
        "relevance_score": float(item.get("relevance_score") or 0),
        "search_score": None,
        "related_tickers": [],
        "related_themes": [],
        "markets": markets,
        "event_id": None,
        "narrative_ids": [],
        "reliability_tier": int(feed.get("reliability_tier") or 2),
        "markdown_path": "",
    }
