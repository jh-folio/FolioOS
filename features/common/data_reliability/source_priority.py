"""Source priority and reliability policy for Step 9.

The functions here are intentionally small and deterministic. They do not fetch
new data; they label existing sources so downstream report generation and
quality checks can prefer official material over news/RSS summaries.
"""
from __future__ import annotations

import re


COMPANY_THESIS_PRIORITY = [
    "filing",
    "companyfacts",
    "ranked_filing_paragraph",
    "ir",
    "report",
    "news",
    "rss",
    "user_note",
]

BRIEFING_PRIORITY = [
    "market_data",
    "macro_data",
    "news",
    "rss",
    "memory",
    "user_note",
]

TOPIC_PRIORITY = [
    "market_data",
    "macro_data",
    "filing",
    "report",
    "news",
    "rss",
    "memory",
    "user_note",
]

_PRIORITIES = {
    "company_analysis": COMPANY_THESIS_PRIORITY,
    "thesis_delta": COMPANY_THESIS_PRIORITY,
    "briefing": BRIEFING_PRIORITY,
    "topic_report": TOPIC_PRIORITY,
}

_OFFICIAL_PATTERNS = re.compile(r"\b(sec|edgar|10-k|10-q|8-k|companyfacts|dart|공시|사업보고서|분기보고서)\b", re.I)
_REPORT_PATTERNS = re.compile(r"\b(report|research|리포트|보고서|ir|presentation|earnings|실적발표)\b", re.I)


def classify_source_kind(item: dict) -> str:
    """Return a policy-level source kind for priority ranking."""
    item = item or {}
    raw_type = str(item.get("type") or item.get("evidenceType") or "").strip().lower()
    text = " ".join(
        str(item.get(k) or "")
        for k in ("source", "title", "url", "path", "reason", "snippet", "axis")
    )
    if raw_type == "user_note":
        return "user_note"
    if raw_type in {"market_data", "macro_data", "memory", "regime", "thesis", "rss", "news"}:
        return raw_type
    if raw_type == "filing" or _OFFICIAL_PATTERNS.search(text):
        if "companyfacts" in text.lower():
            return "companyfacts"
        if "paragraph" in str(item.get("axis") or "").lower():
            return "ranked_filing_paragraph"
        return "filing"
    if raw_type == "report" or _REPORT_PATTERNS.search(text):
        if re.search(r"\b(ir|presentation|earnings|실적발표)\b", text, re.I):
            return "ir"
        return "report"
    return raw_type or "news"


def source_priority_rank(artifact_type: str, item: dict) -> int:
    priority = _PRIORITIES.get(str(artifact_type or "").strip().lower(), TOPIC_PRIORITY)
    kind = classify_source_kind(item)
    try:
        return priority.index(kind)
    except ValueError:
        return len(priority)


def reliability_for_source(item: dict) -> str:
    kind = classify_source_kind(item)
    if kind in {"filing", "companyfacts", "ranked_filing_paragraph", "market_data", "macro_data"}:
        return "high"
    if kind in {"ir", "report", "news"}:
        return "medium"
    if kind in {"rss", "memory", "regime", "thesis"}:
        return "low"
    if kind == "user_note":
        return "unknown"
    return "medium"


def annotate_source_priority(items, *, artifact_type: str) -> list[dict]:
    rows: list[dict] = []
    for item in items or []:
        if not isinstance(item, dict):
            continue
        row = dict(item)
        row["sourceKind"] = classify_source_kind(row)
        row["sourcePriority"] = source_priority_rank(artifact_type, row)
        row["sourceReliability"] = reliability_for_source(row)
        rows.append(row)
    return sorted(rows, key=lambda x: (x.get("sourcePriority", 99), str(x.get("date") or ""), str(x.get("title") or "")))

