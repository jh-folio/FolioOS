"""ChangeBasis decoration and authority projection facade."""
from __future__ import annotations

from pathlib import Path

from features.common.change_intelligence.adapters.briefing import build_briefing_basis
from features.common.change_intelligence.adapters.company import build_company_basis
from features.common.change_intelligence.adapters.market_memory import build_market_memory_basis
from features.common.change_intelligence.adapters.topic import build_topic_basis
from features.common.change_intelligence.baseline import select_report_baseline
from features.common.change_intelligence.basis import content_hash, normalize_basis
from features.common.change_intelligence.comparator import compare_basis
from features.common.change_intelligence.projection import invalidation_token, project_report

ADAPTERS = {
    "briefing": build_briefing_basis,
    "company_analysis": build_company_basis,
    "topic_report": build_topic_basis,
    "market_memory": build_market_memory_basis,
}


def build_basis(artifact_kind: str, candidate: dict, *, native_context: dict | None = None) -> dict:
    if artifact_kind not in ADAPTERS:
        raise ValueError("change_adapter_not_found")
    context = native_context or {}
    if artifact_kind == "briefing":
        return build_briefing_basis(candidate, generation_docs=context.get("generationDocs"))
    if artifact_kind == "company_analysis":
        return build_company_basis(candidate, materials=context.get("materials"))
    return ADAPTERS[artifact_kind](candidate)


def decorate_candidate(artifact_kind: str, candidate: dict, *, data_dir: Path, native_context: dict | None = None, generation_provenance: bool = True) -> dict:
    if not generation_provenance:
        return dict(candidate)
    decorated = dict(candidate)
    basis = normalize_basis(decorated["changeBasis"]) if isinstance(decorated.get("changeBasis"), dict) else build_basis(artifact_kind, decorated, native_context=native_context)
    previous, baseline_ref = select_report_baseline(Path(data_dir), basis) if artifact_kind != "market_memory" else (None, None)
    current_ref = {
        "storageKind": "json_report" if artifact_kind != "market_memory" else "market_state_snapshot",
        "id": basis.get("artifactId"), "revision": None, "contentHash": content_hash(basis),
    }
    summary = compare_basis(basis, previous, current_ref=current_ref, baseline_ref=baseline_ref)
    decorated["changeBasis"] = basis
    decorated["changeSummary"] = summary
    decorated["changeIntelligence"] = {
        "status": summary["status"], "authorityKind": current_ref["storageKind"],
        "projectionStatus": "pending", "invalidationToken": invalidation_token(summary),
    }
    return decorated


def project_committed_report(db_path: Path, report_path: Path) -> dict:
    return project_report(Path(db_path), Path(report_path))
