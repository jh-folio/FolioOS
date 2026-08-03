"""Additive Portfolio document contract for revision-safe writes."""
from __future__ import annotations


def revision(value: object, default: int = 0) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return default
    return max(0, parsed)


def expected_revision(value: dict | None) -> int | None:
    if not isinstance(value, dict) or "expectedRevision" not in value:
        return None
    return revision(value.get("expectedRevision"))


def portfolio_document(value: dict | None) -> dict:
    value = value if isinstance(value, dict) else {}
    return {
        "schemaVersion": 2,
        "revision": revision(value.get("revision")),
        "positions": value.get("positions") if isinstance(value.get("positions"), list) else [],
        "cash": value.get("cash") if isinstance(value.get("cash"), list) else [],
        "updatedAt": str(value.get("updatedAt") or ""),
    }
