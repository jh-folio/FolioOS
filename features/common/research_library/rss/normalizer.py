"""Normalize collector-specific rows into Folio OS intake evidence items."""
from __future__ import annotations

import datetime as dt
import hashlib

from features.common.market_calendar import infer_doc_markets
from features.common.research_library.rss.policy import normalize_url


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
    # 본문/제목에서 아무 시장 신호도 못 찾았을 때만 feed 단위 기본 시장을
    # 약한 힌트로 쓴다. 발행사=시장 신호 금지 원칙(세션 레인 오분류 방지)은
    # 실제 신호가 있는 경우 feed 힌트가 절대 이기지 못하는 구조로 지킨다.
    if markets == ["UNKNOWN"]:
        default_market = str((feed or {}).get("default_market") or "").strip().upper()
        if default_market in {"US", "KR", "GLOBAL"}:
            markets = [default_market]
    return {
        "id": evidence_id,
        "collector": "rss",
        "source_type": "news",
        "source": source,
        "title": title,
        "url": url,
        "normalized_url": normalized,
        "published_at_utc": published_at,
        "collected_at_utc": collected_at,
        "query": str(feed.get("url") or ""),
        "query_source": "rss_feed",
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
