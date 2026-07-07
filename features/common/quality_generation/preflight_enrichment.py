"""Preflight-derived evidence context for generation and rewrite passes."""
from __future__ import annotations

from features.common.quality_generation.telemetry import evidence_coverage


def _clip(value: str, limit: int = 260) -> str:
    text = " ".join(str(value or "").split())
    return text[:limit]


def _source_rows(items: list, limit: int = 10) -> list[str]:
    rows: list[str] = []
    for item in items[:limit]:
        if not isinstance(item, dict):
            continue
        title = _clip(item.get("title") or item.get("name") or item.get("source") or "source", 120)
        source = _clip(item.get("source") or item.get("provider") or "", 80)
        role = item.get("role") or item.get("evidenceRole") or item.get("type") or ""
        date = str(item.get("date") or item.get("asOfDate") or "")[:10]
        rows.append(f"- {date} {source} [{role}] {title}".strip())
    return rows


def build_preflight_evidence_context(
    artifact_type: str,
    *,
    preflight: dict | None = None,
    artifact: dict | None = None,
    source_ledger: list | None = None,
    evidence_items: list | None = None,
    data_gaps: list | None = None,
) -> str:
    """Render a compact evidence coverage block for LLM inputs.

    This does not create new evidence. It makes the current source mix, gaps,
    and preflight risks explicit so the model writes within the known boundary.
    """
    preflight = preflight or {}
    artifact = dict(artifact or {})
    if source_ledger is not None:
        artifact["sourceLedger"] = source_ledger
    if evidence_items is not None:
        artifact["evidenceItems"] = evidence_items
    if data_gaps is not None:
        artifact["dataGaps"] = data_gaps
    coverage = evidence_coverage(artifact)
    risks = [str(x).strip() for x in preflight.get("risks") or [] if str(x).strip()]
    required = preflight.get("requiredInputs") or {}
    gaps = list(artifact.get("dataGaps") or []) + list(preflight.get("derivedDataGaps") or [])
    ledger = list(artifact.get("sourceLedger") or artifact.get("sources") or [])
    evidence = list(artifact.get("evidenceItems") or [])

    lines = [
        "## Evidence Coverage Preflight",
        f"artifactType: {artifact_type}",
        f"sourceLedgerCount: {coverage['sourceLedgerCount']}",
        f"evidenceItemCount: {coverage['evidenceItemCount']}",
        f"dataGapCount: {coverage['dataGapCount']}",
        f"roleCounts: {coverage['roleCounts']}",
        f"typeCounts: {coverage['typeCounts']}",
        "",
        "### 현재 입력 상태",
    ]
    if required:
        lines.extend(f"- {key}: {value}" for key, value in required.items())
    else:
        lines.append("- requiredInputs: not available")
    if risks:
        lines += ["", "### 생성 전 리스크"]
        lines.extend(f"- {risk}" for risk in risks[:8])
    if gaps:
        lines += ["", "### 남은 dataGap"]
        for gap in gaps[:6]:
            if isinstance(gap, dict):
                msg = _clip(gap.get("message"), 220)
                action = _clip(gap.get("suggestedAction"), 180)
                lines.append(f"- {msg}" + (f" / suggestedAction: {action}" if action else ""))
    rows = _source_rows(evidence or ledger, limit=12)
    if rows:
        lines += ["", "### 대표 근거 목록"]
        lines.extend(rows)
    lines += [
        "",
        "작성 지침: 위 커버리지에 없는 새 출처·새 숫자·새 사실을 만들지 말고, 부족한 부분은 dataGap 또는 확인 경로로 표시하세요.",
    ]
    return "\n".join(lines)
