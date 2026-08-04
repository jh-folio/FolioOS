"""Fast-origin lead collection.

승인된 fast-origin 경로는 이미 수집된 한국 RSS 행을 lead로 승격하는 것 하나다.
네트워크 호출도 자격증명도 쓰지 않으므로 polling 런타임과 provider 설정이
필요 없다. 새 provider를 다시 들일 때는 계획 변경으로 다룬다.
"""
from __future__ import annotations

import datetime as dt
import json
import re
import sqlite3
from pathlib import Path

from features.common.research_library.signals.service import (
    default_db_path,
    purge_expired,
    record_provider_health,
    upsert_signal,
)
from features.common.research_library.signals.schema import normalize_signal

KR_FAST_ORIGIN_SOURCES = {"연합인포맥스", "연합뉴스"}


def _safe_error_code(exc: Exception) -> str:
    """Normalize an exception into a code that can never echo a URL or secret.

    Provider errors routinely carry the request URL with its api key. Only a
    short allowlisted token, a recognized failure class, or the exception class
    name is allowed out.
    """
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
    """config_path는 호출부 호환을 위해 남긴다. 읽을 provider 설정이 없다."""
    data_dir = Path(data_dir)
    results: dict[str, dict] = {}
    try:
        kr_count = promote_kr_rss_leads(data_dir)
        results["kr_existing"] = {"status": "done", "count": kr_count}
    except Exception as exc:
        results["kr_existing"] = {"status": "failed", "count": 0, "errorCode": _safe_error_code(exc)}
    purged = purge_expired(default_db_path(data_dir))
    return {"ok": True, "providers": results, "purged": purged}


def start_signal_runtime(data_dir: Path, config_path: Path):
    """No-op. 상시 연결이 필요한 provider가 없다. lifespan 호출부 호환용."""
    return None


def stop_signal_runtime() -> None:
    return None
