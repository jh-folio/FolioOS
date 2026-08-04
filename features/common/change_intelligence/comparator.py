"""Rules-only comparator; never reads report Markdown."""
from __future__ import annotations

import datetime as dt

from features.common.change_intelligence.basis import content_hash
from features.common.change_intelligence.schema import validate_change_summary


def _unit_map(basis: dict | None) -> dict[str, dict]:
    return {str(row.get("id")): row for row in (basis or {}).get("changeUnits") or [] if isinstance(row, dict) and row.get("id")}


def _changed(current: dict, previous: dict | None) -> list[dict]:
    current_units = _unit_map(current)
    previous_units = _unit_map(previous)
    rows = []
    for uid, row in current_units.items():
        before = previous_units.get(uid)
        if before is None:
            rows.append({"id": uid, "kind": row.get("kind"), "subject": row.get("subject"), "change": "added", "previousValue": None, "currentValue": row.get("currentValue"), "horizon": row.get("horizon"), "magnitude": row.get("magnitude"), "contextDocs": row.get("contextDocs") or [], "previousContextDocs": []})
        elif content_hash(before.get("currentValue")) != content_hash(row.get("currentValue")):
            rows.append({"id": uid, "kind": row.get("kind"), "subject": row.get("subject"), "change": "changed", "previousValue": before.get("currentValue"), "currentValue": row.get("currentValue"), "horizon": row.get("horizon"), "magnitude": row.get("magnitude"), "contextDocs": row.get("contextDocs") or [], "previousContextDocs": before.get("contextDocs") or []})
    for uid, row in previous_units.items():
        if uid not in current_units:
            rows.append({"id": uid, "kind": row.get("kind"), "subject": row.get("subject"), "change": "removed", "previousValue": row.get("currentValue"), "currentValue": None, "horizon": row.get("horizon"), "magnitude": row.get("magnitude"), "contextDocs": [], "previousContextDocs": row.get("contextDocs") or []})
    return rows[:24]


def _evidence_gate(basis: dict) -> tuple[float, int, list[str], int]:
    countable = [
        row for row in basis.get("sourceRefs") or []
        if row.get("intakeStage") != "lead" and row.get("sourceType") not in {"user_note", "user_consultation"}
    ]
    tier1 = sum(1 for row in countable if int(row.get("reliabilityTier") or 4) == 1)
    tier2_groups = {
        row.get("independentGroup") for row in countable
        if int(row.get("reliabilityTier") or 4) <= 2 and row.get("independentGroup")
    }
    reliability = 1.0 if tier1 else (0.85 if len(tier2_groups) >= 2 else (0.55 if countable else 0.0))
    return reliability, tier1, sorted(tier2_groups), len(countable)


def _signal_refs(basis: dict) -> list[dict]:
    rows = []
    for ref in basis.get("sourceRefs") or []:
        if ref.get("intakeStage") != "lead":
            continue
        rows.append({
            "id": ref.get("id"), "provider": ref.get("source"), "displayTitle": str(ref.get("title") or "")[:220],
            "publishedAt": ref.get("publishedAt"), "receivedAt": ref.get("receivedAt"),
            "signalStatus": ref.get("signalStatus") or "unconfirmed", "titleHash": content_hash(ref.get("title"))[:20],
        })
    return rows[:8]


def compare_basis(current: dict, previous: dict | None, *, current_ref: dict, baseline_ref: dict | None = None) -> dict:
    # The comparison is part of the Canonical document. Tie its timestamp to the
    # generation artifact instead of wall-clock comparison time so an identical
    # regeneration remains a canonical no-op.
    now = str(current.get("asOf") or "").strip() or dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z")
    if current.get("basisStatus") == "insufficient":
        return validate_change_summary({
            "schemaVersion": 1, "comparatorVersion": "0.4.0", "basisAdapterVersion": current.get("adapterVersion"),
            "status": "insufficient_basis", "artifactKind": current.get("artifactKind"), "artifactId": current.get("artifactId"),
            "lineageId": current.get("lineageId"), "basisStatus": "insufficient", "basisCoverage": current.get("coverage"),
            "baselineRef": baseline_ref, "currentRef": current_ref, "horizonSignals": {"shortTerm": [], "mediumTerm": [], "longTerm": []},
            "changedItems": [], "materiality": 0.0, "reliability": 0.0, "corroboration": {"tier1": 0, "independentTier2": 0, "countableSources": 0},
            "counterEvidence": current.get("counterSignals") or [], "uncertainties": current.get("uncertainties") or [], "signalRefs": _signal_refs(current), "generatedAt": now,
        })
    reliability, tier1, tier2_groups, source_count = _evidence_gate(current)
    if previous is None:
        status = "baseline_created"
        changed = []
    else:
        changed = _changed(current, previous)
        magnitudes = [float(row.get("magnitude") or 0) for row in changed]
        materiality = min(1.0, (max(magnitudes) if magnitudes else 0.0) + min(0.25, len(changed) * 0.04))
        has_conflict = bool(current.get("counterSignals")) and reliability >= 0.55 and bool(changed)
        major_gate = materiality >= 0.7 and (tier1 >= 1 or len(tier2_groups) >= 2)
        if has_conflict and materiality >= 0.45:
            status = "conflicting_uncertain"
        elif major_gate:
            status = "major_change"
        elif changed and (materiality >= 0.3 or reliability >= 0.55):
            status = "developing_signal"
        else:
            status = "no_material_change"
    materiality = 0.0 if not changed else min(1.0, max(float(row.get("magnitude") or 0) for row in changed) + min(0.25, len(changed) * 0.04))
    horizons = {"shortTerm": [], "mediumTerm": [], "longTerm": []}
    keys = {"short_term": "shortTerm", "medium_term": "mediumTerm", "long_term": "longTerm"}
    for row in changed:
        horizons[keys.get(row.get("horizon"), "mediumTerm")].append({"id": row.get("id"), "subject": row.get("subject"), "change": row.get("change")})
    return validate_change_summary({
        "schemaVersion": 1, "comparatorVersion": "0.4.0", "basisAdapterVersion": current.get("adapterVersion"),
        "status": status, "artifactKind": current.get("artifactKind"), "artifactId": current.get("artifactId"),
        "lineageId": current.get("lineageId"), "basisStatus": current.get("basisStatus"), "basisCoverage": current.get("coverage"),
        "baselineRef": baseline_ref, "currentRef": current_ref, "horizonSignals": horizons,
        "changedItems": changed, "materiality": round(materiality, 3), "reliability": round(reliability, 3),
        "corroboration": {"tier1": tier1, "independentTier2": len(tier2_groups), "independentGroups": tier2_groups, "countableSources": source_count},
        "counterEvidence": current.get("counterSignals") or [], "uncertainties": current.get("uncertainties") or [],
        "signalRefs": _signal_refs(current), "generatedAt": now,
    })
