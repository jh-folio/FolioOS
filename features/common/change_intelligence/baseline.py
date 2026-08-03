"""Comparable baseline selectors for report JSON and Market Memory snapshots."""
from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from features.common.change_intelligence.basis import content_hash


REPORT_DIRS = {
    "briefing": "briefings",
    "company_analysis": "company-analysis",
    "topic_report": "topic-reports",
}


def _matches(current: dict, candidate: dict) -> bool:
    if current.get("artifactKind") != candidate.get("artifactKind"):
        return False
    if current.get("lineageId") != candidate.get("lineageId"):
        return False
    if current.get("artifactId") == candidate.get("artifactId"):
        return False
    current_as_of = str(current.get("asOf") or "")
    candidate_as_of = str(candidate.get("asOf") or "")
    return not current_as_of or not candidate_as_of or candidate_as_of < current_as_of


def select_report_baseline(data_dir: Path, current_basis: dict) -> tuple[dict | None, dict | None]:
    directory = Path(data_dir) / REPORT_DIRS.get(current_basis.get("artifactKind"), "")
    if not directory.is_dir():
        return None, None
    candidates = []
    for path in directory.glob("*.json"):
        if path.name.endswith(".visuals.json") or path.name.endswith(".link.json"):
            continue
        try:
            report = json.loads(path.read_text(encoding="utf-8"))
            basis = report.get("changeBasis") if isinstance(report, dict) else None
            if isinstance(basis, dict) and _matches(current_basis, basis):
                candidates.append((str(basis.get("asOf") or report.get("generatedAt") or ""), path, report, basis))
        except Exception:
            continue
    if not candidates:
        return None, None
    _as_of, path, report, basis = sorted(candidates, key=lambda row: row[0], reverse=True)[0]
    return basis, {
        "storageKind": "json_report", "id": report.get("id") or basis.get("artifactId"),
        "revision": (report.get("canonicalRevision") or {}).get("number"), "contentHash": content_hash(basis),
        "committedAt": report.get("savedAt") or report.get("generatedAt") or basis.get("asOf"), "path": str(path),
    }


def select_market_memory_baseline(connection: sqlite3.Connection, current_basis: dict) -> tuple[dict | None, dict | None]:
    try:
        rows = connection.execute("SELECT snapshot_id,as_of,payload_json FROM market_state_snapshots ORDER BY as_of DESC").fetchall()
    except sqlite3.Error:
        return None, None
    for row in rows:
        try:
            payload = json.loads(row["payload_json"])
            basis = payload.get("changeBasis") if isinstance(payload, dict) else None
        except Exception:
            continue
        if isinstance(basis, dict) and _matches(current_basis, basis):
            return basis, {
                "storageKind": "market_state_snapshot", "id": row["snapshot_id"],
                "revision": None, "contentHash": content_hash(basis), "committedAt": row["as_of"],
            }
    return None, None
