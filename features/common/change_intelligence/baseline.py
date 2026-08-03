"""Comparable baseline selectors for report JSON and Market Memory snapshots."""
from __future__ import annotations

import datetime as dt
import json
import sqlite3
from pathlib import Path

from features.common.change_intelligence.basis import content_hash


REPORT_DIRS = {
    "briefing": "briefings",
    "company_analysis": "company-analysis",
    "topic_report": "topic-reports",
}

# 직전 산출물이 이보다 오래됐으면 비교하지 않는다. 일일 브리핑을 몇 주 전 브리핑과 견주면
# 사실상 모든 항목이 "변했다"로 나와 중대한 변화 판정이 의미를 잃는다. 비교 대상이 없으면
# 없다고 말하는 편이 정확하다(baseline_created).
COMPARABLE_WINDOW_DAYS = {
    "briefing": 10,
    "company_analysis": 120,
    "topic_report": 120,
    "market_memory": 30,
}
DEFAULT_COMPARABLE_WINDOW_DAYS = 30


def _parse_as_of(value: str):
    text = str(value or "").strip()
    if not text:
        return None
    try:
        parsed = dt.datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError:
        try:
            parsed = dt.datetime.fromisoformat(text[:10])
        except ValueError:
            return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=dt.timezone.utc)


def _within_comparable_window(artifact_kind, current_as_of: str, candidate_as_of: str) -> bool:
    current = _parse_as_of(current_as_of)
    candidate = _parse_as_of(candidate_as_of)
    if current is None or candidate is None:
        return False
    window = COMPARABLE_WINDOW_DAYS.get(str(artifact_kind or ""), DEFAULT_COMPARABLE_WINDOW_DAYS)
    return (current - candidate) <= dt.timedelta(days=window)


def _matches(current: dict, candidate: dict) -> bool:
    if current.get("artifactKind") != candidate.get("artifactKind"):
        return False
    if current.get("lineageId") != candidate.get("lineageId"):
        return False
    if current.get("artifactId") == candidate.get("artifactId"):
        return False
    current_as_of = str(current.get("asOf") or "")
    candidate_as_of = str(candidate.get("asOf") or "")
    # 순서를 확인할 수 없으면 기준선으로 쓰지 않는다. 예전에는 asOf가 비면 아무 후보나
    # 통과시켜, 6월 보고서를 8월 보고서와 비교하는 미래 기준선이 만들어졌다.
    if not current_as_of or not candidate_as_of:
        return False
    if candidate_as_of >= current_as_of:
        return False
    return _within_comparable_window(current.get("artifactKind"), current_as_of, candidate_as_of)


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
