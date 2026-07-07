"""Common Evidence Item schema.

User notes can appear as linked hypotheses, but ``user_note`` items are excluded
from evidence aggregation by ``is_countable_evidence``.
"""
from __future__ import annotations

import hashlib
import re

from features.common.research_schema.enums import (
    is_hypothesis_evidence_type,
    normalize_artifact_type,
    normalize_evidence_freshness,
    normalize_evidence_role,
    normalize_evidence_type,
)


_FRESHNESS_ALIASES = {
    "current": "recent",
    "dated": "stale",
}


def _clean(value, limit: int = 400) -> str:
    text = re.sub(r"\s+", " ", str(value or "")).strip()
    if len(text) <= limit:
        return text
    return text[:limit].rsplit(" ", 1)[0].rstrip(".,;:") + "..."


def _stable_id(*parts: str) -> str:
    return "ev_" + hashlib.sha256("|".join(str(p or "") for p in parts).encode("utf-8")).hexdigest()[:12]


def _freshness(value) -> str:
    raw = str(value or "").strip().lower()
    return normalize_evidence_freshness(_FRESHNESS_ALIASES.get(raw, raw))


def normalize_evidence_item(
    item: dict,
    *,
    artifact_type: str,
    artifact_id: str = "",
    default_type: str = "news",
) -> dict:
    src = item or {}
    artifact_type = normalize_artifact_type(src.get("artifactType") or src.get("artifact_type") or artifact_type)
    artifact_id = str(src.get("artifactId") or src.get("artifact_id") or artifact_id or "")
    evidence_type = normalize_evidence_type(src.get("type") or src.get("evidenceType") or default_type)
    role = normalize_evidence_role(src.get("role") or src.get("evidenceRole"))
    title = _clean(src.get("title"), 220)
    source = _clean(src.get("source"), 120)
    date = str(src.get("date") or src.get("evidenceDate") or "")[:10]
    url = str(src.get("url") or "").strip()
    path = str(src.get("path") or "").strip()
    axis = _clean(src.get("axis") or src.get("axisKey"), 100)
    confidence = str(src.get("confidence") or "medium").strip().lower()
    if confidence not in {"low", "medium", "high"}:
        confidence = "medium"
    eid = str(src.get("id") or src.get("evidenceId") or "").strip() or _stable_id(
        artifact_type, artifact_id, evidence_type, title, source, date, url or path
    )
    out = {
        "id": eid,
        "artifactType": artifact_type,
        "artifactId": artifact_id,
        "type": evidence_type,
        "source": source,
        "date": date,
        "title": title,
        "url": url,
        "path": path,
        "role": role,
        "axis": axis,
        "confidence": confidence,
        "freshness": _freshness(src.get("freshness")),
    }
    for key in ("sourceKind", "sourcePriority", "sourceReliability", "reliability"):
        if key in src:
            out[key] = src.get(key)
    return out


def evidence_items_from_list(
    values,
    *,
    artifact_type: str,
    artifact_id: str = "",
    default_type: str = "news",
    limit: int = 40,
) -> list[dict]:
    rows: list[dict] = []
    seen: set[str] = set()
    for value in values or []:
        if not isinstance(value, dict):
            continue
        item = normalize_evidence_item(
            value,
            artifact_type=artifact_type,
            artifact_id=artifact_id,
            default_type=default_type,
        )
        key = item["url"] or item["path"] or f"{item['title']}|{item['source']}|{item['date']}"
        if not key or key in seen:
            continue
        seen.add(key)
        rows.append(item)
        if len(rows) >= limit:
            break
    return rows


def is_countable_evidence(item: dict) -> bool:
    return not is_hypothesis_evidence_type((item or {}).get("type"))
