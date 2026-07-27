"""Personal Overlay 스키마 — 확증편향 방지 필드를 항상 보장한다(원칙 3).

normalize_overlay()는 LLM이 어떤 JSON을 주든(또는 누락하든) 아래를 보장한다:
- 모든 LIST_FIELDS 키가 list로 존재 (counterEvidence/contradictions/uncertainties 포함)
- stance가 enum(STANCE_CHOICES) 중 하나 (자유 텍스트 결론 금지, 원칙 4)
"""
from __future__ import annotations

from copy import deepcopy

# 항상 존재해야 하는 리스트 필드
LIST_FIELDS = [
    "linkedNotes",
    "supportingEvidence",
    "counterEvidence",
    "contradictions",
    "uncertainties",
    "personalQuestions",
]

# 종합 신호 enum (overlay는 자유 결론을 내지 않고 enum으로만 표시)
STANCE_CHOICES = {"reinforced", "unchanged", "weakened", "conflicted", "insufficient"}
STANCE_DEFAULT = "insufficient"
STANCE_LABELS = {
    "reinforced": "강화",
    "unchanged": "유지",
    "weakened": "약화",
    "conflicted": "충돌",
    "insufficient": "판단 보류",
}


def empty_overlay() -> dict:
    o = {f: [] for f in LIST_FIELDS}
    o["stance"] = STANCE_DEFAULT
    o["markdown"] = ""
    return o


def _as_list(v) -> list:
    """문자열/단일값을 list로 정규화. dict 항목(linkedNotes/evidence item)은 보존."""
    if v is None:
        return []
    if isinstance(v, (str, dict)):
        v = [v]
    if not isinstance(v, (list, tuple)):
        return []
    out = []
    for item in v:
        if isinstance(item, dict):
            out.append(item)
        else:
            s = str(item).strip()
            if s:
                out.append(s)
    return out


def normalize_overlay(raw, *, linked_notes=None, markdown=None) -> dict:
    """raw(LLM JSON 등)를 안전한 overlay 구조로 정규화한다."""
    raw = raw if isinstance(raw, dict) else {}
    o = empty_overlay()
    for f in LIST_FIELDS:
        o[f] = _as_list(raw.get(f))
    if linked_notes is not None:
        o["linkedNotes"] = linked_notes  # 인자가 신뢰 소스
    stance = str(raw.get("stance", "") or "").strip().lower()
    o["stance"] = stance if stance in STANCE_CHOICES else STANCE_DEFAULT
    o["markdown"] = markdown if markdown is not None else str(raw.get("markdown", "") or "")
    return o


def _revision(value) -> dict | None:
    if not isinstance(value, dict):
        return None
    number = value.get("number")
    revision_hash = value.get("hash")
    if not isinstance(number, int) or isinstance(number, bool) or number < 1:
        return None
    if not isinstance(revision_hash, str) or not revision_hash:
        return None
    return {"number": number, "hash": revision_hash}


def public_projection(raw, *, canonical_revision=None) -> dict:
    """Return the shared reader-safe Personal Overlay projection."""
    normalized = normalize_overlay(raw)
    raw = raw if isinstance(raw, dict) else {}
    overlay_revision = _revision(raw.get("canonicalRevision"))
    current_revision = _revision(canonical_revision)
    mismatch = bool(
        overlay_revision
        and current_revision
        and (
            overlay_revision["number"] != current_revision["number"]
            or overlay_revision["hash"] != current_revision["hash"]
        )
    )
    stale = bool(raw.get("stale")) or raw.get("staleReason") == "canonical_revision_changed" or mismatch
    revision_state = "stale" if stale else "current" if overlay_revision and current_revision else "legacy_unknown"
    return {
        "markdown": normalized["markdown"],
        "linkedNotes": deepcopy(normalized["linkedNotes"]),
        "counterEvidence": deepcopy(normalized["counterEvidence"]),
        "contradictions": deepcopy(normalized["contradictions"]),
        "uncertainties": deepcopy(normalized["uncertainties"]),
        "personalQuestions": deepcopy(normalized["personalQuestions"]),
        "canonicalRevision": overlay_revision,
        "stale": stale,
        "staleReason": "canonical_revision_changed" if stale else "",
        "revisionState": revision_state,
    }
