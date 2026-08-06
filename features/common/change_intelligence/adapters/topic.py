from __future__ import annotations

from features.common.change_intelligence.basis import content_hash, normalize_basis, stable_id
from features.common.research_schema.data_gaps import data_gap_rows


def build_topic_basis(report: dict) -> dict:
    report = report or {}
    evidence = report.get("evidenceItems") or []
    ledger = report.get("sourceLedger") or []
    source_rows = ledger or evidence
    refs = []
    for index, row in enumerate(source_rows[:32], 1):
        if not isinstance(row, dict):
            continue
        refs.append({
            "id": row.get("sourceId") or row.get("id") or stable_id("topicsrc", row.get("url") or row.get("path"), index),
            "title": row.get("title"), "url": row.get("url"), "path": row.get("path"), "source": row.get("source"),
            "sourceType": row.get("sourceType") or row.get("type") or "document",
            "reliabilityTier": row.get("reliabilityTier") or row.get("sourcePriority") or 2,
            "independentGroup": row.get("independentGroup") or row.get("source"),
            "intakeStage": row.get("intakeStage") or "evidence", "signalStatus": row.get("signalStatus"),
            "publishedAt": row.get("date") or row.get("publishedAt"),
            "contentHash": row.get("contentHash") or content_hash({"title": row.get("title"), "url": row.get("url"), "path": row.get("path")}),
        })
    units = []
    for index, checkpoint in enumerate(report.get("checkpoints") or [], 1):
        if isinstance(checkpoint, dict):
            subject = checkpoint.get("title") or checkpoint.get("question") or checkpoint.get("condition") or checkpoint.get("id")
            units.append({
                "id": checkpoint.get("id") or stable_id("topiccp", subject, index), "kind": "checkpoint", "subject": subject,
                "currentValue": {key: checkpoint.get(key) for key in ("status", "condition", "value", "dueAt") if checkpoint.get(key) is not None},
                "direction": "tracked", "magnitude": 0.45, "horizon": "medium_term", "sourceRefIds": [row["id"] for row in refs][:8],
            })
    resolution = report.get("researchResolution") or {}
    if isinstance(resolution, dict):
        for key in ("status", "verdict", "confidence", "answer"):
            if resolution.get(key) is not None:
                units.append({"id": stable_id("resolution", key), "kind": "research_resolution", "subject": key, "currentValue": resolution.get(key), "direction": "resolved", "magnitude": 0.6, "horizon": "long_term", "sourceRefIds": [row["id"] for row in refs][:12]})
    counter = []
    for item in evidence:
        if isinstance(item, dict) and str(item.get("role") or item.get("evidenceRole") or "").lower() in {"challenging", "counter", "contradiction"}:
            counter.append(item.get("title") or item.get("summary") or item.get("id"))
    lineage = report.get("researchLineageId") or (report.get("topicPlan") or {}).get("researchLineageId") or report.get("topicKey") or report.get("id")
    return normalize_basis({
        "artifactKind": "topic_report", "artifactId": report.get("id"), "lineageId": lineage,
        "scope": {"reportType": report.get("reportType")}, "asOf": report.get("generatedAt"),
        "changeUnits": units, "sourceRefs": refs, "counterSignals": counter,
        "uncertainties": [str(row.get("message") or row.get("title") or row.get("id")) for row in data_gap_rows(report.get("dataGaps"))],
        "metrics": (report.get("marketTape") or {}).get("items") or [], "coverage": {"comparison": 1 if units else 0, "market": 1 if report.get("marketTape") else 0},
    })
