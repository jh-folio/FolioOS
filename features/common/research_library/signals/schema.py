"""Schema and validation for metadata-only fast-origin leads."""
from __future__ import annotations

import dataclasses
import datetime as dt
import hashlib
import re
from typing import Any

SIGNAL_STATUSES = {"unconfirmed", "corroborated", "expired", "retracted"}
SOURCE_STATUSES = {"active", "delayed", "stale", "unhealthy", "disabled", "unauthorized"}
APPROVED_PROVIDERS = {"kr_existing"}
PUBLIC_SOURCE_STATUSES = {"active", "delayed"}
FORBIDDEN_INPUT_KEYS = {
    "body", "full_text", "fullText", "html", "image", "image_url", "imageUrl",
    "raw", "raw_payload", "rawPayload", "token", "api_key", "apiKey", "auth_url", "authUrl",
}


def _clean(value: Any, limit: int) -> str:
    text = re.sub(r"\s+", " ", str(value or "")).strip()
    return text[:limit]


def parse_time(value: Any) -> dt.datetime | None:
    if isinstance(value, dt.datetime):
        parsed = value
    else:
        raw = str(value or "").strip()
        if not raw:
            return None
        try:
            parsed = dt.datetime.fromisoformat(raw.replace("Z", "+00:00"))
        except ValueError:
            return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=dt.timezone.utc)
    return parsed.astimezone(dt.timezone.utc)


def iso(value: Any) -> str:
    parsed = parse_time(value)
    return parsed.isoformat().replace("+00:00", "Z") if parsed else ""


def normalized_provider(value: Any) -> str:
    provider = re.sub(r"[^a-z0-9]+", "_", str(value or "").strip().lower()).strip("_")
    aliases = {
        "yonhap": "kr_existing",
        "yonhap_infomax": "kr_existing",
    }
    return aliases.get(provider, provider)


def _headline_key(title: str) -> str:
    tokens = re.findall(r"[0-9A-Za-z가-힣]{2,}", title.lower())
    return " ".join(tokens[:16])


def signal_cluster_id(*, normalized_url: str, title: str, tickers: list[str], published_at: Any) -> str:
    published = parse_time(published_at)
    bucket = ""
    if published:
        minute = published.minute - published.minute % 15
        bucket = published.replace(minute=minute, second=0, microsecond=0).isoformat()
    material = "|".join([normalized_url, ",".join(sorted(tickers)), _headline_key(title), bucket])
    return "sigcl_" + hashlib.sha256(material.encode("utf-8")).hexdigest()[:16]


@dataclasses.dataclass(frozen=True)
class FastOriginSignal:
    schema_version: int
    id: str
    provider: str
    collector: str
    source_type: str
    intake_stage: str
    title: str
    url: str
    normalized_url: str
    event_at: str
    provider_published_at: str
    received_at: str
    official_confirmed_at: str
    markets: tuple[str, ...]
    related_tickers: tuple[str, ...]
    reliability_tier: int
    signal_status: str
    source_status: str
    cluster_id: str
    corroboration_count: int
    independent_source_groups: tuple[str, ...]
    expires_at: str
    policy_version: str

    def to_store_dict(self) -> dict:
        return {
            "id": self.id,
            "provider": self.provider,
            "source": self.provider,
            "collector": self.collector,
            "source_type": self.source_type,
            "intake_stage": self.intake_stage,
            "title": self.title,
            "url": self.url,
            "normalized_url": self.normalized_url,
            "event_at_utc": self.event_at,
            "published_at_utc": self.provider_published_at,
            "provider_published_at_utc": self.provider_published_at,
            "collected_at_utc": self.received_at,
            "received_at_utc": self.received_at,
            "official_confirmed_at_utc": self.official_confirmed_at,
            "markets": list(self.markets),
            "related_tickers": list(self.related_tickers),
            "reliability_tier": self.reliability_tier,
            "signal_status": self.signal_status,
            "source_status": self.source_status,
            "cluster_id": self.cluster_id,
            "corroboration_count": self.corroboration_count,
            "independent_source_groups": list(self.independent_source_groups),
            "expires_at_utc": self.expires_at,
            "policy_version": self.policy_version,
            "query": "",
            "query_source": "fast_origin",
            "summary": "",
            "collection_status": "metadata_only",
            "relevance_score": 0,
            "search_score": None,
            "related_themes": [],
            "event_id": "",
            "narrative_ids": [],
            "markdown_path": "",
        }

    def to_public_dict(self) -> dict:
        return {
            "schemaVersion": self.schema_version,
            "id": self.id,
            "provider": self.provider,
            "collector": self.collector,
            "sourceType": self.source_type,
            "intakeStage": "lead",
            "title": self.title,
            "url": self.url,
            "normalizedUrl": self.normalized_url,
            "eventAt": self.event_at or None,
            "providerPublishedAt": self.provider_published_at,
            "receivedAt": self.received_at,
            "officialConfirmedAt": self.official_confirmed_at or None,
            "markets": list(self.markets),
            "relatedTickers": list(self.related_tickers),
            "reliabilityTier": self.reliability_tier,
            "signalStatus": self.signal_status,
            "sourceStatus": self.source_status,
            "clusterId": self.cluster_id,
            "corroborationCount": self.corroboration_count,
            "independentSourceGroups": list(self.independent_source_groups),
            "expiresAt": self.expires_at,
            "policyVersion": self.policy_version,
        }


def normalize_signal(raw: dict, *, now: dt.datetime | None = None, watchlist_related: bool = False) -> FastOriginSignal:
    raw = raw or {}
    forbidden = sorted(key for key in FORBIDDEN_INPUT_KEYS if raw.get(key) not in (None, "", [], {}))
    if forbidden:
        raise ValueError("signal_forbidden_payload_fields")
    provider = normalized_provider(raw.get("provider") or raw.get("source"))
    if provider not in APPROVED_PROVIDERS:
        raise ValueError("signal_provider_not_allowed")
    title = _clean(raw.get("title"), 220)
    url = _clean(raw.get("url"), 1200)
    normalized_url = _clean(raw.get("normalizedUrl") or raw.get("normalized_url") or url, 1200)
    published = parse_time(raw.get("providerPublishedAt") or raw.get("provider_published_at") or raw.get("published_at_utc"))
    received = parse_time(raw.get("receivedAt") or raw.get("received_at") or raw.get("collected_at_utc")) or now or dt.datetime.now(dt.timezone.utc)
    received = received.astimezone(dt.timezone.utc)
    if not title or not normalized_url or published is None:
        raise ValueError("signal_required_fields_missing")
    status = str(raw.get("signalStatus") or raw.get("signal_status") or "unconfirmed").strip().lower()
    source_status = str(raw.get("sourceStatus") or raw.get("source_status") or "active").strip().lower()
    if status not in SIGNAL_STATUSES or source_status not in SOURCE_STATUSES:
        raise ValueError("signal_status_invalid")
    tickers = tuple(dict.fromkeys(_clean(v, 24).upper() for v in raw.get("relatedTickers", raw.get("related_tickers", [])) if _clean(v, 24)))
    markets = tuple(dict.fromkeys(_clean(v, 12).upper() for v in raw.get("markets", []) if _clean(v, 12))) or ("UNKNOWN",)
    independent = tuple(dict.fromkeys(_clean(v, 80) for v in raw.get("independentSourceGroups", raw.get("independent_source_groups", [])) if _clean(v, 80)))
    retention_days = 30 if status == "corroborated" else (14 if watchlist_related else 3)
    expires = parse_time(raw.get("expiresAt") or raw.get("expires_at")) or (received + dt.timedelta(days=retention_days))
    cluster_id = _clean(raw.get("clusterId") or raw.get("cluster_id"), 80) or signal_cluster_id(
        normalized_url=normalized_url,
        title=title,
        tickers=list(tickers),
        published_at=published,
    )
    sid = _clean(raw.get("id"), 100)
    if not sid:
        sid = "sig_" + hashlib.sha256(f"{provider}|{normalized_url}|{published.isoformat()}".encode("utf-8")).hexdigest()[:20]
    return FastOriginSignal(
        schema_version=1,
        id=sid,
        provider=provider,
        collector=_clean(raw.get("collector") or "rss", 40),
        source_type="fast_origin_news",
        intake_stage="lead",
        title=title,
        url=url,
        normalized_url=normalized_url,
        event_at=iso(raw.get("eventAt") or raw.get("event_at")),
        provider_published_at=iso(published),
        received_at=iso(received),
        official_confirmed_at=iso(raw.get("officialConfirmedAt") or raw.get("official_confirmed_at")),
        markets=markets,
        related_tickers=tickers,
        reliability_tier=max(1, min(int(raw.get("reliabilityTier") or raw.get("reliability_tier") or 3), 4)),
        signal_status=status,
        source_status=source_status,
        cluster_id=cluster_id,
        corroboration_count=max(0, int(raw.get("corroborationCount") or raw.get("corroboration_count") or 0)),
        independent_source_groups=independent,
        expires_at=iso(expires),
        policy_version=_clean(raw.get("policyVersion") or raw.get("policy_version") or "fast-origin-v1", 40),
    )


def latency_telemetry(signal: FastOriginSignal, *, max_clock_skew_seconds: int = 300) -> dict:
    event = parse_time(signal.event_at)
    published = parse_time(signal.provider_published_at)
    received = parse_time(signal.received_at)
    confirmed = parse_time(signal.official_confirmed_at)

    invalid_order = False

    def seconds(later: dt.datetime | None, earlier: dt.datetime | None) -> int | None:
        nonlocal invalid_order
        if later is None or earlier is None:
            return None
        delta = int((later - earlier).total_seconds())
        if delta < -max_clock_skew_seconds:
            invalid_order = True
            return None
        return delta

    origin = seconds(published, event)
    collection = seconds(received, published)
    advantage = seconds(confirmed, received)
    valid = not invalid_order and all(value is None or value >= 0 for value in (origin, collection, advantage))
    return {
        "originLatencySeconds": origin if origin is not None and origin >= 0 else None,
        "collectionLagSeconds": collection if collection is not None and collection >= 0 else None,
        "leadAdvantageSeconds": advantage if advantage is not None and advantage >= 0 else None,
        "timestampAvailability": {
            "eventAt": bool(event), "providerPublishedAt": bool(published),
            "receivedAt": bool(received), "officialConfirmedAt": bool(confirmed),
        },
        "valid": valid,
    }
