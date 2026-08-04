"""Small semantic cache with last-known-good and conditional metadata."""
from __future__ import annotations

import datetime as dt
import hashlib
import json
from pathlib import Path

from features.common.utils import read_json, write_json


def utcnow() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


def semantic_key(provider: str, operation: str, params: dict | None = None) -> str:
    canonical = json.dumps(params or {}, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    digest = hashlib.sha256(f"{provider}|{operation}|{canonical}".encode("utf-8")).hexdigest()
    return f"{provider}_{operation}_{digest[:24]}"


class SemanticCache:
    def __init__(self, root: Path, *, clock=utcnow):
        self.root = Path(root)
        self.clock = clock

    def path(self, key: str) -> Path:
        safe = "".join(ch for ch in str(key) if ch.isalnum() or ch in "_.-")[:120]
        return self.root / f"{safe}.json"

    def read(self, key: str, *, ttl_seconds: int) -> dict:
        row = read_json(self.path(key), {})
        if not isinstance(row, dict) or "value" not in row:
            return {"hit": False, "fresh": False, "value": None, "metadata": {}}
        try:
            fetched = dt.datetime.fromisoformat(str(row.get("fetchedAt") or "").replace("Z", "+00:00"))
            if fetched.tzinfo is None:
                fetched = fetched.replace(tzinfo=dt.timezone.utc)
            age = max(0.0, (self.clock() - fetched.astimezone(dt.timezone.utc)).total_seconds())
        except (TypeError, ValueError):
            age = float("inf")
        return {
            "hit": True,
            "fresh": age <= max(0, int(ttl_seconds)),
            "ageSeconds": None if age == float("inf") else int(age),
            "value": row.get("value"),
            "metadata": {
                "etag": str(row.get("etag") or ""),
                "lastModified": str(row.get("lastModified") or ""),
                "asOf": str(row.get("asOf") or ""),
                "fetchedAt": str(row.get("fetchedAt") or ""),
                "provider": str(row.get("provider") or ""),
            },
        }

    def write(self, key: str, value, *, provider: str, as_of: str = "", etag: str = "", last_modified: str = "") -> dict:
        fetched_at = self.clock().isoformat().replace("+00:00", "Z")
        row = {
            "schemaVersion": 1, "provider": str(provider), "asOf": str(as_of or fetched_at),
            "fetchedAt": fetched_at, "etag": str(etag or "")[:300],
            "lastModified": str(last_modified or "")[:300], "value": value,
        }
        self.root.mkdir(parents=True, exist_ok=True)
        write_json(self.path(key), row)
        return row
