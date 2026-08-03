"""Fault-isolated signal collectors for approved public feeds."""
from __future__ import annotations

import datetime as dt
import json
import os
import re
import sqlite3
from pathlib import Path

from features.common.research_library.signals.adapters.benzinga import fetch_benzinga
from features.common.research_library.signals.adapters.generic_rss import SignalFeedThrottled
from features.common.research_library.signals.service import (
    default_db_path,
    purge_expired,
    record_provider_health,
    upsert_signal,
)
from features.common.research_library.signals.schema import normalize_signal
from features.common.research_library.signals.provider_settings import load_provider_settings
from features.common.utils import read_json, write_json
from features.llm_settings.client import load_dotenv

KR_FAST_ORIGIN_SOURCES = {"연합인포맥스", "연합뉴스"}
_RUNTIME = None


def _load_provider_config(config_path: Path, data_dir: Path | None = None) -> dict:
    if not config_path.exists():
        return {}
    try:
        import yaml  # type: ignore

        payload = yaml.safe_load(config_path.read_text(encoding="utf-8")) or {}
        rows = payload.get("fast_origin_sources") or {}
        rows = {key: dict(value or {}) for key, value in rows.items()} if isinstance(rows, dict) else {}
        if data_dir is not None:
            for provider, override in load_provider_settings(data_dir).items():
                rows.setdefault(provider, {}).update(override)
        return rows
    except Exception:
        return {}


def _http_state_path(data_dir: Path) -> Path:
    return data_dir / "signal-http-state.json"


def _safe_error_code(exc: Exception) -> str:
    text = str(exc or "").strip()
    lowered = text.lower()
    if re.fullmatch(r"[a-z0-9_]{1,80}", lowered):
        return lowered
    if any(token in lowered for token in ("401", "403", "unauthorized", "authentication")):
        return "provider_unauthorized"
    if "timeout" in lowered or "timed out" in lowered:
        return "provider_timeout"
    status = re.search(r"(?:http(?: error)?|status)\s*[:=]?\s*(\d{3})\b", lowered)
    if status:
        return f"http_{status.group(1)}"
    class_name = re.sub(r"[^a-z0-9]+", "_", exc.__class__.__name__.lower()).strip("_")
    return f"provider_{class_name or 'error'}"[:80]


def _collect_rss_provider(provider: str, cfg: dict, *, data_dir: Path, state: dict) -> int:
    feed_url = str(cfg.get("feed_url") or "").strip()
    if provider == "benzinga":
        load_dotenv()
        feed_url = str(os.environ.get("BENZINGA_RSS_URL") or feed_url).strip()
    if not cfg.get("enabled") or not feed_url:
        error_code = "provider_disabled" if not cfg.get("enabled") else "feed_not_configured"
        record_provider_health(data_dir, provider, {"sourceStatus": "disabled", "errorCode": error_code})
        return 0
    previous = state.get(provider) if isinstance(state.get(provider), dict) else {}
    if provider == "benzinga":
        signals, next_state = fetch_benzinga(feed_url, previous=previous)
    else:
        return 0
    count = 0
    latest = ""
    for signal in signals:
        upsert_signal(default_db_path(data_dir), signal)
        count += 1
        latest = max(latest, signal.provider_published_at)
    state[provider] = next_state
    record_provider_health(data_dir, provider, {
        "sourceStatus": "active", "itemCount": count, "latestItemAt": latest,
        "timestampValid": True,
    })
    return count


def promote_kr_rss_leads(data_dir: Path, *, max_age_hours: int = 24) -> int:
    db_path = default_db_path(data_dir)
    if not db_path.exists():
        return 0
    cutoff = (dt.datetime.now(dt.timezone.utc) - dt.timedelta(hours=max_age_hours)).isoformat()
    with sqlite3.connect(str(db_path)) as conn:
        conn.row_factory = sqlite3.Row
        sources = sorted(KR_FAST_ORIGIN_SOURCES)
        placeholders = ",".join("?" for _ in sources)
        rows = conn.execute(
            f"SELECT * FROM evidence_items WHERE intake_stage='evidence' AND source IN ({placeholders}) "
            "AND collected_at_utc>=? ORDER BY collected_at_utc DESC LIMIT 300",
            (*sources, cutoff),
        ).fetchall()
    count = 0
    for row in rows:
        try:
            tickers = json.loads(row["related_tickers"] or "[]")
            signal = normalize_signal({
                "id": "sig_kr_" + str(row["id"]),
                "provider": "kr_existing",
                "collector": "rss",
                "title": row["title"],
                "url": row["url"],
                "normalized_url": row["normalized_url"],
                "provider_published_at": row["published_at_utc"],
                "received_at": row["collected_at_utc"],
                "markets": ["KR"],
                "related_tickers": tickers,
                "reliability_tier": row["reliability_tier"],
                "source_status": "active",
            })
            upsert_signal(db_path, signal, watchlist_related=bool(tickers))
            count += 1
        except (ValueError, TypeError, json.JSONDecodeError):
            continue
    record_provider_health(data_dir, "kr_existing", {"sourceStatus": "active", "itemCount": count})
    return count


def collect_signals_once(data_dir: Path, config_path: Path) -> dict:
    data_dir = Path(data_dir)
    config = _load_provider_config(Path(config_path), data_dir)
    state_path = _http_state_path(data_dir)
    state = read_json(state_path, {})
    if not isinstance(state, dict):
        state = {}
    results: dict[str, dict] = {}
    for provider in ("benzinga",):
        try:
            count = _collect_rss_provider(provider, config.get(provider) or {}, data_dir=data_dir, state=state)
            results[provider] = {"status": "done", "count": count}
        except SignalFeedThrottled as exc:
            record_provider_health(data_dir, provider, {
                "sourceStatus": "delayed", "errorCode": "rate_limited",
                "retryAfterSeconds": exc.retry_after_seconds,
            })
            results[provider] = {"status": "throttled", "count": 0, "retryAfterSeconds": exc.retry_after_seconds}
        except PermissionError as exc:
            record_provider_health(data_dir, provider, {"sourceStatus": "unauthorized", "errorCode": _safe_error_code(exc)})
            results[provider] = {"status": "unauthorized", "count": 0}
        except Exception as exc:
            record_provider_health(data_dir, provider, {"sourceStatus": "unhealthy", "errorCode": _safe_error_code(exc)})
            results[provider] = {"status": "failed", "count": 0, "errorCode": _safe_error_code(exc)}
    try:
        kr_count = promote_kr_rss_leads(data_dir)
        results["kr_existing"] = {"status": "done", "count": kr_count}
    except Exception as exc:
        results["kr_existing"] = {"status": "failed", "count": 0, "errorCode": _safe_error_code(exc)}
    write_json(state_path, state)
    purged = purge_expired(default_db_path(data_dir))
    return {"ok": True, "providers": results, "purged": purged}


def start_signal_runtime(data_dir: Path, config_path: Path):
    """No-op. 승인된 provider가 모두 polling RSS라 상시 연결이 필요 없다.

    app lifespan 호출부 호환을 위해 함수는 유지한다.
    """
    return None


def stop_signal_runtime() -> None:
    return None
