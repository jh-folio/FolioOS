"""Source grounding checks for Step 7.

MVP grounding is section/artifact level, not sentence-level citation matching.
"""
from __future__ import annotations

import re

from features.common.research_schema.evidence import is_countable_evidence
from features.common.research_quality.schema import level_from_ratio


def _numbers(markdown: str) -> int:
    return len(re.findall(r"\d+(?:\.\d+)?%?", str(markdown or "")))


def _fresh_market_items(market_tape: dict | None) -> int:
    return sum(1 for item in (market_tape or {}).get("items") or [] if item.get("status") == "fresh")


def evaluate_source_grounding(
    markdown: str,
    *,
    source_ledger: list | None = None,
    evidence_items: list | None = None,
    market_tape: dict | None = None,
    data_gaps: list | None = None,
) -> dict:
    ledger = [x for x in (source_ledger or []) if isinstance(x, dict)]
    evidence = [x for x in (evidence_items or []) if isinstance(x, dict) and is_countable_evidence(x)]
    gaps = [x for x in (data_gaps or []) if isinstance(x, dict)]
    numbers = _numbers(markdown)
    fresh_market = _fresh_market_items(market_tape)

    warnings: list[str] = []
    score = 0.0
    if ledger:
        score += min(0.35, len(ledger) / 8 * 0.35)
    else:
        warnings.append("sourceLedger가 비어 있어 본문-출처 연결을 확인하기 어렵습니다.")
    if evidence:
        score += min(0.25, len(evidence) / 8 * 0.25)
    if fresh_market:
        score += 0.18
    elif numbers >= 8:
        warnings.append("수치 주장이 있지만 fresh marketTape 항목이 부족합니다.")
    if any("source" in str(x).lower() or "데이터" in str(x) for x in ledger):
        score += 0.07
    if re.search(r"(?im)^#{1,3}\s*(?:\d+\.\s*)?(?:Source & Data Notes|참고자료|데이터 한계)", str(markdown or "")):
        score += 0.15
    if gaps:
        high = [g for g in gaps if g.get("severity") in {"high", "blocking"}]
        score -= 0.12 if high else 0.06
        actions = [g.get("suggestedAction", "") for g in gaps if g.get("suggestedAction")]
        suffix = f" 보완 경로: {actions[0]}" if actions else ""
        warnings.append(f"dataGaps가 있어 coverage/freshness 해석에 주의가 필요합니다.{suffix}")

    score = max(0.0, min(1.0, score))
    return {
        "score": round(score, 2),
        "level": level_from_ratio(score),
        "sourceCount": len(ledger),
        "evidenceCount": len(evidence),
        "freshMarketItems": fresh_market,
        "warnings": warnings[:4],
    }
