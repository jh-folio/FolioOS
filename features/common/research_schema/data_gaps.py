"""Common Data Gap schema."""
from __future__ import annotations

import hashlib
import re

from features.common.research_schema.enums import normalize_artifact_type, normalize_data_gap_severity


_SUGGESTED_ACTIONS = {
    "market_data": "시장 데이터 provider 상태를 확인하거나 research-inbox/market-data/에 수동 CSV를 보강하세요.",
    "evidence": "관련 RSS/article 자료를 추가한 뒤 인덱스를 갱신하세요.",
    "checkpoint": "보고서의 체크포인트 섹션을 명시적으로 작성하거나 재생성하세요.",
}


def _clean(value, limit: int = 420) -> str:
    text = re.sub(r"\s+", " ", str(value or "")).strip()
    if len(text) <= limit:
        return text
    return text[:limit].rsplit(" ", 1)[0].rstrip(".,;:") + "..."


def _stable_id(*parts: str) -> str:
    return "gap_" + hashlib.sha256("|".join(str(p or "") for p in parts).encode("utf-8")).hexdigest()[:12]


def normalize_data_gap(
    item,
    *,
    artifact_type: str,
    artifact_id: str = "",
    category: str = "evidence",
    severity: str = "medium",
    source_section: str = "",
) -> dict:
    src = item if isinstance(item, dict) else {"message": item}
    artifact_type = normalize_artifact_type(src.get("artifactType") or src.get("artifact_type") or artifact_type)
    artifact_id = str(src.get("artifactId") or src.get("artifact_id") or artifact_id or "")
    category = _clean(src.get("category") or category, 80) or "evidence"
    message = _clean(src.get("message") or src.get("gap") or src.get("text"))
    severity = normalize_data_gap_severity(src.get("severity") or severity)
    suggested = _clean(src.get("suggestedAction") or src.get("suggested_action") or _SUGGESTED_ACTIONS.get(category, _SUGGESTED_ACTIONS["evidence"]))
    source_section = _clean(src.get("sourceSection") or src.get("source_section") or source_section, 120)
    gid = str(src.get("id") or "").strip() or _stable_id(artifact_type, artifact_id, category, message)
    return {
        "id": gid,
        "artifactType": artifact_type,
        "artifactId": artifact_id,
        "category": category,
        "message": message,
        "severity": severity,
        "suggestedAction": suggested,
        "sourceSection": source_section,
    }


def data_gaps_from_messages(
    values,
    *,
    artifact_type: str,
    artifact_id: str = "",
    category: str = "evidence",
    severity: str = "medium",
    source_section: str = "",
    limit: int = 12,
) -> list[dict]:
    rows: list[dict] = []
    seen: set[str] = set()
    source_values = values if isinstance(values, list) else ([values] if values else [])
    for value in source_values:
        gap = normalize_data_gap(
            value,
            artifact_type=artifact_type,
            artifact_id=artifact_id,
            category=category,
            severity=severity,
            source_section=source_section,
        )
        if not gap["message"] or gap["message"].lower() in seen:
            continue
        seen.add(gap["message"].lower())
        rows.append(gap)
        if len(rows) >= limit:
            break
    return rows
