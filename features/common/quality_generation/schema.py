"""Schema helpers for quality-improving generation."""
from __future__ import annotations

from features.common.utils import now_iso

QUALITY_MODES = {"diagnose_only", "llm_section_improve", "strict"}
QUALITY_MODE_ALIASES = {
    "improve_once": "llm_section_improve",
    "section_improve": "llm_section_improve",
    "llm_improve": "llm_section_improve",
}


def normalize_quality_mode(value: str | None) -> str:
    mode = str(value or "diagnose_only").strip().lower()
    mode = QUALITY_MODE_ALIASES.get(mode, mode)
    return mode if mode in QUALITY_MODES else "diagnose_only"


def status_from_risks(risks: list[str], blocking: bool = False) -> str:
    if blocking:
        return "fail"
    return "warn" if risks else "pass"


def loop_shell(mode: str, preflight: dict | None = None) -> dict:
    return {
        "mode": normalize_quality_mode(mode),
        "preflight": preflight or {},
        "repairApplied": False,
        "repairCount": 0,
        "repairReason": "",
        "repairType": "",
        "changedSections": [],
        "weakSectionsBefore": [],
        "weakSectionsAfter": [],
        "telemetry": {},
        "qualityBefore": None,
        "qualityAfter": None,
        "warnings": [],
        "generatedAt": now_iso(),
    }
