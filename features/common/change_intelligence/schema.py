"""ChangeSummary validation constants."""
from __future__ import annotations

CHANGE_STATUSES = {
    "baseline_created", "major_change", "developing_signal", "conflicting_uncertain",
    "no_material_change", "insufficient_basis",
}
STORAGE_KINDS = {"json_report", "market_state_snapshot"}


def validate_change_summary(value: dict) -> dict:
    row = value or {}
    if row.get("status") not in CHANGE_STATUSES:
        raise ValueError("change_summary_status_invalid")
    if row.get("basisStatus") not in {"ready", "partial", "insufficient"}:
        raise ValueError("change_summary_basis_invalid")
    for ref_name in ("baselineRef", "currentRef"):
        ref = row.get(ref_name)
        if ref is not None and ref.get("storageKind") not in STORAGE_KINDS:
            raise ValueError("change_summary_storage_kind_invalid")
    return row
