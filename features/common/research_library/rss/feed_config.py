"""RSS feed configuration loader.

The loader accepts the small YAML subset used by ``config/rss_feeds.yaml`` and
uses PyYAML when available. Keeping the fallback local lets Folio OS run without
an extra dependency.
"""
from __future__ import annotations

import datetime as dt
from functools import lru_cache
from pathlib import Path

from features.common.config_bootstrap import resolve_config
from features.common.markets import MarketCode


class FeedConfigError(ValueError):
    """Raised when an enabled feed violates the checked config contract."""


TARGET_COUNTRIES = frozenset({"GB", "DE", "FR", "NL", "IT", "ES", "JP"})
TARGET_LANGUAGES = frozenset({"en", "de", "fr", "nl", "it", "es", "ja"})
TARGET_MARKETS = frozenset({MarketCode.EUROPE.value, MarketCode.JP.value})
DEFAULT_MARKETS = frozenset(
    market.value for market in MarketCode if market is not MarketCode.UNKNOWN
)
SOURCE_TYPES = frozenset({"news", "press_release"})
COUNTRY_MARKETS = {
    "GB": MarketCode.EUROPE.value,
    "DE": MarketCode.EUROPE.value,
    "FR": MarketCode.EUROPE.value,
    "NL": MarketCode.EUROPE.value,
    "IT": MarketCode.EUROPE.value,
    "ES": MarketCode.EUROPE.value,
    "JP": MarketCode.JP.value,
}


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


def _required_text(row: dict, key: str) -> str:
    value = str(row.get(key) or "").strip()
    if not value:
        raise FeedConfigError(f"missing_{key}")
    return value


def _probe_datetime(row: dict, key: str) -> dt.datetime:
    raw = _required_text(row, key)
    try:
        value = dt.datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError as exc:
        raise FeedConfigError(f"invalid_{key}:{raw}") from exc
    if value.tzinfo is None:
        raise FeedConfigError(f"timezone_required_{key}")
    return value.astimezone(dt.timezone.utc)


def _target_metadata(row: dict, default_market: str) -> dict[str, object]:
    """Validate the Europe/Japan selection record, including observed freshness."""
    if default_market not in TARGET_MARKETS:
        if row.get("country") or row.get("language"):
            raise FeedConfigError("country_language_only_supported_for_europe_japan")
        return {
            "country": "",
            "language": "",
            "freshness_checked_at": "",
            "freshness_latest_at": "",
            "freshness_item_count": 0,
        }

    country = _required_text(row, "country").upper()
    language = _required_text(row, "language").lower()
    if country not in TARGET_COUNTRIES:
        raise FeedConfigError(f"invalid_country:{country}")
    if language not in TARGET_LANGUAGES:
        raise FeedConfigError(f"invalid_language:{language}")
    if COUNTRY_MARKETS[country] != default_market:
        raise FeedConfigError(f"country_market_mismatch:{country}:{default_market}")

    checked_at = _probe_datetime(row, "freshness_checked_at")
    latest_at = _probe_datetime(row, "freshness_latest_at")
    try:
        item_count = int(row.get("freshness_item_count") or 0)
    except (TypeError, ValueError) as exc:
        raise FeedConfigError("invalid_freshness_item_count") from exc
    age = checked_at - latest_at
    if item_count <= 0:
        raise FeedConfigError("freshness_probe_has_no_items")
    if age < dt.timedelta(0) or age > dt.timedelta(hours=72):
        raise FeedConfigError("freshness_probe_is_stale")
    return {
        "country": country,
        "language": language,
        "freshness_checked_at": checked_at.isoformat().replace("+00:00", "Z"),
        "freshness_latest_at": latest_at.isoformat().replace("+00:00", "Z"),
        "freshness_item_count": item_count,
    }


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
    if default_market not in DEFAULT_MARKETS:
        raise FeedConfigError(f"invalid_default_market:{default_market or '<empty>'}")
    target_metadata = _target_metadata(row, default_market)
    source_type = str(row.get("source_type") or "news").strip().lower() or "news"
    if source_type not in SOURCE_TYPES:
        raise FeedConfigError(f"invalid_source_type:{source_type}")
    try:
        reliability_tier = int(row.get("reliability_tier") or 2)
    except (TypeError, ValueError) as exc:
        raise FeedConfigError("invalid_reliability_tier") from exc
    if reliability_tier not in {1, 2, 3}:
        raise FeedConfigError(f"invalid_reliability_tier:{reliability_tier}")
    # Aggregating feeds carry many outlets. When set, only items whose feed-declared
    # publisher matches are kept, and the item is re-tagged with that publisher name.
    raw_publishers = row.get("only_publishers")
    only_publishers = [
        str(v).strip() for v in raw_publishers if str(v or "").strip()
    ] if isinstance(raw_publishers, list) else []
    return {
        "url": url,
        "media": media,
        "category": str(row.get("category") or "").strip(),
        "priority": int(row.get("priority") or 3),
        "allow_full_text": bool(row.get("allow_full_text", False)),
        "reliability_tier": reliability_tier,
        "default_market": default_market,
        **target_metadata,
        "only_publishers": only_publishers,
        # "news"는 브리핑 입력에 포함되고, "press_release"는 기업 자료 전용으로 분리된다.
        "source_type": source_type,
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


@lru_cache(maxsize=8)
def _feed_identity_index(path_text: str, mtime_ns: int) -> dict[str, dict[str, str]]:
    del mtime_ns  # cache key only; the file timestamp invalidates stale mappings
    candidates: dict[str, list[dict[str, str]]] = {}
    for feed in load_rss_feeds(path_text):
        url = str(feed.get("url") or "").strip()
        if not url:
            continue
        candidates.setdefault(url, []).append({
            "language": str(feed.get("language") or ""),
            "country": str(feed.get("country") or ""),
        })
    return {
        url: rows[0]
        for url, rows in candidates.items()
        if len(rows) == 1 and (rows[0]["language"] or rows[0]["country"])
    }


def feed_metadata_for_query(query: object, *, config_path: str | Path | None = None) -> dict[str, str]:
    """Return metadata only for an exact, unambiguous configured feed URL."""
    feed_url = str(query or "").strip()
    if not feed_url:
        return {}
    path = Path(config_path) if config_path is not None else resolve_config("rss_feeds.yaml")
    if not path.exists():
        return {}
    row = _feed_identity_index(str(path.resolve()), path.stat().st_mtime_ns).get(feed_url)
    return dict(row) if row else {}
