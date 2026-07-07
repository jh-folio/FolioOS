"""Legacy rule-only repair helpers.

Quality modes no longer call this module directly; `llm_section_improve` uses
`llm_section_rewrite.py`. Keep this file only for compatibility with older
imports or ad-hoc local scripts.
"""
from __future__ import annotations

import re

from features.common.research_schema.checkpoints import checkpoints_from_markdown


def should_repair(quality: dict | None, preflight: dict | None, mode: str) -> bool:
    if mode != "legacy_safety_repair":
        return False
    quality = quality or {}
    preflight = preflight or {}
    if preflight.get("status") == "fail":
        return True
    return quality.get("status") in {"warn", "fail"} or int(quality.get("score") or 0) < 75 or bool(preflight.get("risks"))


def _has_heading(markdown: str, marker: str) -> bool:
    return bool(re.search(rf"(?im)^##\s+.*{re.escape(marker)}", str(markdown or "")))


def _gap_lines(gaps: list[dict]) -> list[str]:
    rows = []
    for gap in gaps[:6]:
        if not isinstance(gap, dict):
            continue
        message = str(gap.get("message") or "").strip()
        action = str(gap.get("suggestedAction") or "").strip()
        if message:
            rows.append(f"- {message}" + (f" 해결 경로: {action}" if action else ""))
    return rows


def repair_markdown(artifact_type: str, artifact: dict, quality: dict | None, preflight: dict | None) -> dict:
    artifact = dict(artifact or {})
    markdown = str(artifact.get("markdown") or "").rstrip()
    preflight = preflight or {}
    quality = quality or {}
    gaps = list(artifact.get("dataGaps") or []) + list(preflight.get("derivedDataGaps") or [])
    risks = [str(x).strip() for x in preflight.get("risks") or [] if str(x).strip()]
    fixes = [str(x).strip() for x in quality.get("suggestedFixes") or [] if str(x).strip()]

    additions: list[str] = []
    if not _has_heading(markdown, "반론") and not _has_heading(markdown, "리스크"):
        additions.extend([
            "## 반론과 리스크",
            "- 현재 판단은 확보된 sourceLedger/evidenceItems와 본문 참고자료 범위 안에서만 유효합니다.",
            "- 반대 방향의 가격·수급·공식 공시가 확인되면 결론을 재점검해야 합니다.",
        ])
    if not _has_heading(markdown, "체크포인트"):
        additions.extend([
            "## 다음 체크포인트",
            "- 본문에서 언급한 주요 변수의 가격 반응, 거래대금, 공식 공시 또는 실적 업데이트가 같은 방향으로 이어지는지 확인합니다.",
            "- 반대 신호가 나타나면 현재 해석을 보류하고 원자료를 보강합니다.",
        ])
    if gaps or risks or fixes or not _has_heading(markdown, "Source & Data"):
        additions.append("## Source & Data Notes")
        gap_rows = _gap_lines(gaps)
        if gap_rows:
            additions.extend(gap_rows)
        for risk in risks[:4]:
            additions.append(f"- Preflight: {risk}")
        for fix in fixes[:3]:
            additions.append(f"- 개선 필요: {fix}")
        additions.append("- 위 항목은 새 근거를 추가한 것이 아니라, 현재 자료 범위의 한계와 보완 경로를 명시한 것입니다.")

    if not additions:
        return {"markdown": markdown, "repairApplied": False, "repairReason": ""}

    repaired = f"{markdown}\n\n" + "\n".join(additions)
    updated = {**artifact, "markdown": repaired}
    if not updated.get("checkpoints"):
        updated["checkpoints"] = checkpoints_from_markdown(
            repaired,
            artifact_type=artifact_type,
            artifact_id=str(updated.get("id") or updated.get("date") or ""),
            headings=["다음 체크포인트", "앞으로 확인할 체크포인트", "체크포인트"],
            scope="company" if artifact_type == "company_analysis" else "market",
            topic=str(updated.get("title") or updated.get("headline") or updated.get("topicLabel") or ""),
        )
    return {"markdown": repaired, "artifact": updated, "repairApplied": True, "repairReason": "limited_gap_risk_checkpoint_notes"}
