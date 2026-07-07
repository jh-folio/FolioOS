"""Common Source Ledger schema."""
from __future__ import annotations

import hashlib
import re

from features.common.research_schema.enums import (
    normalize_artifact_type,
    normalize_evidence_role,
    normalize_reliability,
)


def _clean(value, limit: int = 360) -> str:
    text = re.sub(r"\s+", " ", str(value or "")).strip()
    if len(text) <= limit:
        return text
    return text[:limit].rsplit(" ", 1)[0].rstrip(".,;:") + "..."


def _stable_id(*parts: str) -> str:
    return "src_" + hashlib.sha256("|".join(str(p or "") for p in parts).encode("utf-8")).hexdigest()[:12]


def normalize_source_entry(
    item: dict,
    *,
    artifact_type: str,
    artifact_id: str = "",
    reliability: str = "medium",
) -> dict:
    src = item or {}
    artifact_type = normalize_artifact_type(src.get("artifactType") or src.get("artifact_type") or artifact_type)
    artifact_id = str(src.get("artifactId") or src.get("artifact_id") or artifact_id or "")
    title = _clean(src.get("title"), 220)
    source = _clean(src.get("source"), 120)
    date = str(src.get("date") or "")[:10]
    url = str(src.get("url") or "").strip()
    path = str(src.get("path") or "").strip()
    used = src.get("usedInSections") or src.get("used_in_sections") or []
    if not isinstance(used, list):
        used = [used] if used else []
    role = normalize_evidence_role(src.get("evidenceRole") or src.get("role"))
    rid = str(src.get("sourceId") or src.get("id") or "").strip() or _stable_id(
        artifact_type, artifact_id, title, source, date, url or path
    )
    entry = {
        "sourceId": rid,
        "artifactType": artifact_type,
        "artifactId": artifact_id,
        "title": title,
        "source": source,
        "date": date,
        "url": url,
        "path": path,
        "usedInSections": [_clean(x, 80) for x in used if _clean(x, 80)],
        "evidenceRole": role,
        "axisKey": _clean(src.get("axisKey") or src.get("axis"), 100),
        "reliability": normalize_reliability(src.get("reliability") or src.get("sourceReliability") or reliability),
    }
    if src.get("researchQuestionId"):
        entry["researchQuestionId"] = _clean(src.get("researchQuestionId"), 80)
    if src.get("researchRound"):
        try:
            entry["researchRound"] = int(src.get("researchRound"))
        except Exception:
            entry["researchRound"] = src.get("researchRound")
    return entry


def source_ledger_from_items(
    values,
    *,
    artifact_type: str,
    artifact_id: str = "",
    limit: int = 30,
) -> list[dict]:
    rows: list[dict] = []
    seen: set[str] = set()
    for value in values or []:
        if not isinstance(value, dict):
            continue
        entry = normalize_source_entry(value, artifact_type=artifact_type, artifact_id=artifact_id)
        key = entry["url"] or entry["path"] or f"{entry['title']}|{entry['source']}|{entry['date']}"
        if not key or key in seen:
            continue
        seen.add(key)
        rows.append(entry)
        if len(rows) >= limit:
            break
    return rows
