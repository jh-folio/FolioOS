"""Source Ledger — 보고서가 사용한 출처 목록 관리 (설계 04 §7.3).

Evidence Pack 아이템에서 중복을 제거한 출처 원장을 만든다.
보고서 JSON의 `sourceLedger` 필드로 저장된다.
"""
from __future__ import annotations

from features.common.research_schema.source_ledger import source_ledger_from_items


def build_source_ledger(evidence_items: list[dict], *, limit: int = 30) -> list[dict]:
    # Keep this topic_report API stable while using the Step 6 common schema.
    rows = source_ledger_from_items(evidence_items, artifact_type="topic_report", limit=limit)
    for idx, row in enumerate(rows, 1):
        row["sourceId"] = f"src_{idx:03d}"
        source = (evidence_items or [])[idx - 1] if idx - 1 < len(evidence_items or []) else {}
        if isinstance(source, dict) and source.get("axisKey"):
            row["axisKey"] = source.get("axisKey", "")
        if isinstance(source, dict) and source.get("researchQuestionId"):
            row["researchQuestionId"] = source.get("researchQuestionId", "")
        if isinstance(source, dict) and source.get("researchRound"):
            row["researchRound"] = source.get("researchRound")
    return rows
