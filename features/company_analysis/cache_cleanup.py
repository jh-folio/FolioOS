"""SEC and DART per-company cache cleanup.

Global list files (company_tickers.json, corp_codes.json) are never deleted.
Only per-company files in companyfacts/, submissions/, html_10k/,
financials/, disclosures/ are subject to TTL enforcement.
"""
from __future__ import annotations

import datetime as dt
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent.parent / "data"
SEC_CACHE_DIR = DATA_DIR / "sec-cache"
DART_CACHE_DIR = DATA_DIR / "dart-cache"

# (directory, glob, max_age_days)
# max_age_days is a generous multiple of the fetch TTL hardcoded in the clients:
#   companyfacts / submissions / financials / disclosures: fetch TTL = 12 h → keep 30 days
#   html_10k: fetch TTL = 30 days → keep 90 days
_TARGETS = [
    (SEC_CACHE_DIR / "companyfacts", "*.json", 30),
    (SEC_CACHE_DIR / "submissions", "*.json", 30),
    (SEC_CACHE_DIR / "html_10k", "*.json", 90),
    (DART_CACHE_DIR / "financials", "*.json", 30),
    (DART_CACHE_DIR / "disclosures", "*.json", 30),
]


def cache_stats() -> dict:
    """Return current sizes and stale-file counts without deleting anything."""
    now = dt.datetime.now(dt.timezone.utc)
    rows = []
    for directory, pattern, max_age_days in _TARGETS:
        if not directory.exists():
            continue
        files = list(directory.glob(pattern))
        cutoff = now - dt.timedelta(days=max_age_days)
        stale = [
            f for f in files
            if dt.datetime.fromtimestamp(f.stat().st_mtime, tz=dt.timezone.utc) < cutoff
        ]
        rows.append({
            "directory": str(directory.relative_to(DATA_DIR)),
            "files": len(files),
            "total_mb": round(sum(f.stat().st_size for f in files) / 1024 / 1024, 2),
            "stale_files": len(stale),
            "stale_mb": round(sum(f.stat().st_size for f in stale) / 1024 / 1024, 2),
            "max_age_days": max_age_days,
        })
    total_mb = round(sum(r["total_mb"] for r in rows), 2)
    stale_mb = round(sum(r["stale_mb"] for r in rows), 2)
    return {"stats": rows, "total_mb": total_mb, "stale_mb": stale_mb}


def cleanup_cache() -> dict:
    """Delete per-company cache files older than their folder's max_age_days threshold."""
    now = dt.datetime.now(dt.timezone.utc)
    deleted = 0
    freed_bytes = 0
    details = []

    for directory, pattern, max_age_days in _TARGETS:
        if not directory.exists():
            continue
        cutoff = now - dt.timedelta(days=max_age_days)
        for path in directory.glob(pattern):
            mtime = dt.datetime.fromtimestamp(path.stat().st_mtime, tz=dt.timezone.utc)
            if mtime < cutoff:
                size = path.stat().st_size
                path.unlink()
                deleted += 1
                freed_bytes += size
                details.append({
                    "path": str(path.relative_to(DATA_DIR)),
                    "age_days": (now - mtime).days,
                })

    return {
        "deleted": deleted,
        "freed_mb": round(freed_bytes / 1024 / 1024, 2),
        "details": details,
    }
