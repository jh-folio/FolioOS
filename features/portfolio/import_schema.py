"""Broker-neutral position import normalization."""
from __future__ import annotations

import re

IMPORT_STATUSES = {"confirmed", "needs_review", "unresolved"}
IMPORT_ACTIONS = {"skip", "merge", "replace"}


def number(value: object) -> float | None:
    text = re.sub(r"[^0-9.\-]", "", str(value or "").replace(",", ""))
    if not text or text in {"-", ".", "-."}:
        return None
    try:
        parsed = float(text)
    except ValueError:
        return None
    return parsed if parsed == parsed else None


def ticker(value: object) -> str:
    text = str(value or "").strip().upper()
    return text if re.fullmatch(r"(?:[A-Z][A-Z0-9.-]{0,11}|\d{6})(?:\.(?:KS|KQ))?", text) else ""


def normalize_draft(row: dict, existing: set[str] | None = None) -> dict:
    existing = existing or set()
    symbol = ticker(row.get("ticker") or row.get("symbol"))
    quantity = number(row.get("quantity"))
    average_price = number(row.get("averagePrice") or row.get("average_price"))
    status = "confirmed" if symbol and quantity is not None and quantity > 0 else "unresolved"
    if status == "confirmed" and average_price is None:
        status = "needs_review"
    return {
        "ticker": symbol,
        "name": str(row.get("name") or "").strip()[:120],
        "quantity": quantity,
        "averagePrice": average_price,
        "currency": str(row.get("currency") or "").strip().upper()[:8],
        "status": status,
        "action": "skip" if symbol in existing else "merge",
        "issues": (["ticker_or_quantity_unresolved"] if not symbol or quantity is None or quantity <= 0 else []) + (["average_price_review"] if symbol and quantity and average_price is None else []),
    }


def import_preview(rows: list[dict], existing_positions: list[dict], *, engine: str, notices: list[str] | None = None) -> dict:
    existing = {ticker(row.get("ticker") or row.get("symbol")) for row in existing_positions}
    drafts = [normalize_draft(row, existing) for row in rows[:100] if isinstance(row, dict)]
    return {
        "schemaVersion": 1,
        "engine": engine,
        "drafts": drafts,
        "counts": {status: sum(row["status"] == status for row in drafts) for status in sorted(IMPORT_STATUSES)},
        "notices": list(notices or []),
        "persisted": False,
    }
