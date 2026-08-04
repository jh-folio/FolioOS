"""Persistence, health and query service for fast-origin leads."""
from __future__ import annotations

import base64
import datetime as dt
import json
import sqlite3
from pathlib import Path

from features.common.research_library.rss.store import ensure_evidence_store, save_evidence_item
from features.common.research_library.signals.schema import (
    PUBLIC_SOURCE_STATUSES,
    FastOriginSignal,
    latency_telemetry,
    normalize_signal,
)
from features.common.utils import read_json, write_json


def default_db_path(data_dir: Path) -> Path:
    return Path(data_dir) / "research-index.sqlite3"


def _decode_json(value, fallback):
    try:
        parsed = json.loads(str(value or ""))
        return parsed if isinstance(parsed, type(fallback)) else fallback
    except (TypeError, ValueError):
        return fallback


def _cursor(received_at: str, signal_id: str) -> str:
    raw = json.dumps([received_at, signal_id], separators=(",", ":")).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _parse_cursor(value: str) -> tuple[str, str] | None:
    try:
        raw = base64.urlsafe_b64decode(str(value or "") + "===")
        row = json.loads(raw.decode("utf-8"))
        if isinstance(row, list) and len(row) == 2:
            return str(row[0]), str(row[1])
    except Exception:
        return None
    return None


def upsert_signal(db_path: Path, signal: FastOriginSignal | dict, *, watchlist_related: bool = False) -> dict:
    normalized = signal if isinstance(signal, FastOriginSignal) else normalize_signal(signal, watchlist_related=watchlist_related)
    save_evidence_item(Path(db_path), normalized.to_store_dict())
    with sqlite3.connect(str(db_path)) as conn:
        ensure_evidence_store(conn)
        groups = {
            row[0]
            for row in conn.execute(
                "SELECT source FROM evidence_items WHERE intake_stage='lead' AND cluster_id=? "
                "AND signal_status NOT IN ('expired','retracted') AND source_status IN ('active','delayed')",
                (normalized.cluster_id,),
            ).fetchall()
            if row[0]
        }
        count = len(groups)
        status = "corroborated" if count >= 2 else normalized.signal_status
        conn.execute(
            "UPDATE evidence_items SET corroboration_count=?, independent_source_groups=?, signal_status=? "
            "WHERE intake_stage='lead' AND cluster_id=?",
            (count, json.dumps(sorted(groups), ensure_ascii=False), status, normalized.cluster_id),
        )
        conn.commit()
    return {**normalized.to_public_dict(), "corroborationCount": count, "independentSourceGroups": sorted(groups), "signalStatus": status}


def purge_expired(db_path: Path, *, now: dt.datetime | None = None) -> int:
    observed = (now or dt.datetime.now(dt.timezone.utc)).astimezone(dt.timezone.utc).isoformat().replace("+00:00", "Z")
    with sqlite3.connect(str(db_path)) as conn:
        ensure_evidence_store(conn)
        cursor = conn.execute(
            "DELETE FROM evidence_items WHERE intake_stage='lead' AND expires_at_utc<>'' AND expires_at_utc<?",
            (observed,),
        )
        conn.commit()
        return max(0, int(cursor.rowcount or 0))


def confirm_signal(db_path: Path, signal_id: str, *, confirmed_at: str, evidence_id: str = "") -> bool:
    with sqlite3.connect(str(db_path)) as conn:
        ensure_evidence_store(conn)
        cursor = conn.execute(
            "UPDATE evidence_items SET official_confirmed_at_utc=?, signal_status='corroborated', "
            "corroboration_count=MAX(corroboration_count, 1) WHERE id=? AND intake_stage='lead'",
            (confirmed_at, signal_id),
        )
        conn.commit()
        return cursor.rowcount == 1


def _public_row(row: sqlite3.Row) -> dict:
    signal = normalize_signal({
        "id": row["id"],
        "provider": row["source"],
        "collector": row["collector"],
        "title": row["title"],
        "url": row["url"],
        "normalized_url": row["normalized_url"],
        "event_at": row["event_at_utc"],
        "provider_published_at": row["provider_published_at_utc"] or row["published_at_utc"],
        "received_at": row["received_at_utc"] or row["collected_at_utc"],
        "official_confirmed_at": row["official_confirmed_at_utc"],
        "markets": _decode_json(row["markets"], []),
        "related_tickers": _decode_json(row["related_tickers"], []),
        "reliability_tier": row["reliability_tier"],
        "signal_status": row["signal_status"],
        "source_status": row["source_status"],
        "cluster_id": row["cluster_id"],
        "corroboration_count": row["corroboration_count"],
        "independent_source_groups": _decode_json(row["independent_source_groups"], []),
        "expires_at": row["expires_at_utc"],
        "policy_version": row["policy_version"],
    })
    return {**signal.to_public_dict(), "latency": latency_telemetry(signal)}


def query_signals(
    db_path: Path,
    *,
    ticker: str = "",
    market: str = "",
    status: str = "",
    provider: str = "",
    cursor: str = "",
    limit: int = 50,
    include_unhealthy: bool = False,
) -> dict:
    limit = max(1, min(int(limit or 50), 100))
    if not Path(db_path).exists():
        return {"items": [], "nextCursor": None, "count": 0}
    clauses = ["intake_stage='lead'"]
    params: list = []
    if not include_unhealthy:
        clauses.append("source_status IN ('active','delayed')")
    if ticker:
        clauses.append("related_tickers LIKE ?")
        params.append(f'%"{str(ticker).strip().upper()}"%')
    if market:
        clauses.append("markets LIKE ?")
        params.append(f'%"{str(market).strip().upper()}"%')
    if status:
        clauses.append("signal_status=?")
        params.append(str(status).strip().lower())
    if provider:
        clauses.append("source=?")
        params.append(str(provider).strip().lower())
    decoded = _parse_cursor(cursor)
    if decoded:
        clauses.append("(received_at_utc < ? OR (received_at_utc = ? AND id < ?))")
        params.extend([decoded[0], decoded[0], decoded[1]])
    with sqlite3.connect(str(db_path)) as conn:
        conn.row_factory = sqlite3.Row
        ensure_evidence_store(conn)
        rows = conn.execute(
            f"SELECT * FROM evidence_items WHERE {' AND '.join(clauses)} "
            "ORDER BY received_at_utc DESC, id DESC LIMIT ?",
            (*params, limit + 1),
        ).fetchall()
    more = len(rows) > limit
    rows = rows[:limit]
    items = [_public_row(row) for row in rows]
    next_cursor = _cursor(rows[-1]["received_at_utc"], rows[-1]["id"]) if more and rows else None
    return {"items": items, "nextCursor": next_cursor, "count": len(items)}


def provider_health_path(data_dir: Path) -> Path:
    return Path(data_dir) / "signal-provider-health.json"


def record_provider_health(data_dir: Path, provider: str, payload: dict) -> dict:
    path = provider_health_path(data_dir)
    state = read_json(path, {})
    if not isinstance(state, dict):
        state = {}
    safe = {
        "provider": str(provider),
        "sourceStatus": str(payload.get("sourceStatus") or "unhealthy"),
        "checkedAt": str(payload.get("checkedAt") or dt.datetime.now(dt.timezone.utc).isoformat()),
        "latestItemAt": str(payload.get("latestItemAt") or ""),
        "itemCount": max(0, int(payload.get("itemCount") or 0)),
        "duplicateRatio": max(0.0, min(float(payload.get("duplicateRatio") or 0), 1.0)),
        "timestampValid": bool(payload.get("timestampValid", True)),
        "errorCode": str(payload.get("errorCode") or "")[:120],
        "delayMinutes": payload.get("delayMinutes"),
    }
    state[str(provider)] = safe
    write_json(path, state)
    return safe


def provider_health(data_dir: Path) -> dict:
    state = read_json(provider_health_path(data_dir), {})
    return state if isinstance(state, dict) else {}

