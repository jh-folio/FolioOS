"""Persistent investment consultation session contract."""
from __future__ import annotations

import re

SESSION_STATUSES = {"active", "archived"}
SCOPE_KINDS = {"watchlist", "portfolio", "briefing", "company_analysis", "topic_report", "market_memory", "change"}
NOTE_TYPES = {"company_thesis", "portfolio_decision", "investment_note"}
MAX_MESSAGES = 500
MAX_SESSION_BYTES = 2 * 1024 * 1024
MAX_MESSAGE_CHARS = 12_000


def clean_id(value: object) -> str:
    text = str(value or "").strip()
    return text if re.fullmatch(r"[A-Za-z0-9_-]{1,96}", text) else ""


def clean_text(value: object, limit: int) -> str:
    return str(value or "").strip()[:limit]


def normalize_scope(value: dict | None) -> dict:
    value = value if isinstance(value, dict) else {}
    kind = clean_text(value.get("kind") or value.get("surface") or "portfolio", 40).lower()
    if kind not in SCOPE_KINDS:
        kind = "portfolio"
    tickers = value.get("tickers") if isinstance(value.get("tickers"), list) else []
    return {
        "kind": kind,
        "id": clean_text(value.get("id") or value.get("reportId"), 160),
        "marketScope": clean_text(value.get("marketScope"), 16).lower(),
        "tickers": [clean_text(ticker, 24).upper() for ticker in tickers if clean_text(ticker, 24)][:20],
    }


def public_session(value: dict, *, include_messages: bool = True) -> dict:
    allowed = {
        "id", "title", "scope", "status", "revision", "messages", "messageCount", "memory",
        "continuationOf", "continuedBy", "createdAt", "updatedAt", "layer", "sourceLayer",
        "reuseAsHypothesis", "reuseAsEvidence",
    }
    row = {key: value.get(key) for key in allowed if key in value}
    if not include_messages:
        row.pop("messages", None)
        row.pop("memory", None)
    return row
