"""Provider status records for market-data reliability."""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = ROOT / "data"
STATUS_PATH = DATA_DIR / "provider-status.json"

STATUS_CHOICES = {"ok", "degraded", "failed", "unknown"}


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")


def normalize_status(value: str) -> str:
    raw = str(value or "").strip().lower()
    return raw if raw in STATUS_CHOICES else "unknown"


def provider_status_from_result(provider: str, result: dict | None, *, warnings: list[str] | None = None) -> dict:
    result = result or {}
    warnings = list(warnings or result.get("warnings") or [])
    ok = bool(result.get("ok")) if "ok" in result else not warnings
    status = "ok" if ok and not warnings else ("degraded" if ok else "failed")
    timestamp = now_iso()
    return {
        "provider": str(provider or result.get("provider") or "unknown"),
        "status": status,
        "lastSuccess": timestamp if ok else "",
        "lastFailure": "" if ok else timestamp,
        "warnings": warnings[:8],
    }


def provider_status_from_market_tape(market_tape: dict | None) -> list[dict]:
    tape = market_tape or {}
    by_provider: dict[str, dict] = {}
    for item in tape.get("items") or []:
        if not isinstance(item, dict):
            continue
        provider = str(item.get("source") or "unknown")
        status = str(item.get("status") or "missing")
        row = by_provider.setdefault(provider, {"provider": provider, "fresh": 0, "stale": 0, "missing": 0, "warnings": []})
        if status == "fresh":
            row["fresh"] += 1
        elif status in {"stale", "estimated", "conflicting"}:
            row["stale"] += 1
        else:
            row["missing"] += 1
    records: list[dict] = []
    timestamp = now_iso()
    for provider, row in by_provider.items():
        if row["fresh"] and not row["missing"]:
            status = "ok" if not row["stale"] else "degraded"
        elif row["fresh"] or row["stale"]:
            status = "degraded"
        else:
            status = "failed"
        records.append({
            "provider": provider,
            "status": status,
            "lastSuccess": timestamp if status in {"ok", "degraded"} else "",
            "lastFailure": timestamp if status == "failed" else "",
            "warnings": row["warnings"],
        })
    return records


def load_provider_status(path: Path = STATUS_PATH) -> dict:
    if not path.exists():
        return {"providers": {}, "updatedAt": ""}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {"providers": {}, "updatedAt": ""}
    except Exception:
        return {"providers": {}, "updatedAt": ""}


def save_provider_status(records: list[dict], path: Path = STATUS_PATH) -> dict:
    data = load_provider_status(path)
    providers = data.setdefault("providers", {})
    timestamp = now_iso()
    for record in records or []:
        if not isinstance(record, dict):
            continue
        provider = str(record.get("provider") or "unknown")
        existing = providers.get(provider, {})
        merged = {
            "provider": provider,
            "status": normalize_status(record.get("status")),
            "lastSuccess": record.get("lastSuccess") or existing.get("lastSuccess", ""),
            "lastFailure": record.get("lastFailure") or existing.get("lastFailure", ""),
            "warnings": list(record.get("warnings") or [])[:8],
            "updatedAt": timestamp,
        }
        providers[provider] = merged
    data["updatedAt"] = timestamp
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return data
