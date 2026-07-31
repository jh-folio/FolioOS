"""Validated public contract for the Pixel Office summary endpoint."""

from __future__ import annotations

from enum import Enum
from typing import Any


class OfficeObjectId(str, Enum):
    NEWS_DESK = "news_desk"
    MARKET_BOARD = "market_board"
    RESEARCH_DESK = "research_desk"
    REPORT_SHELF = "report_shelf"
    MEMO_BOARD = "memo_board"
    PORTFOLIO_MONITOR = "portfolio_monitor"
    AGENT_SEAT = "agent_seat"


class OfficeObjectState(str, Enum):
    LOADING = "loading"
    READY = "ready"
    BUSY = "busy"
    ATTENTION = "attention"
    EMPTY = "empty"
    STALE = "stale"
    UNAVAILABLE = "unavailable"
    ERROR = "error"


OBJECT_ORDER = tuple(item.value for item in OfficeObjectId)
OBJECT_FIELDS = frozenset({"id", "state", "summary", "count", "asOf", "stale", "notice"})
AGENT_FIELDS = frozenset({"attentionCount", "latestJobId", "latestJobStatus"})
PAYLOAD_FIELDS = frozenset({"version", "generatedAt", "objects", "agent"})


def _exact_fields(value: dict[str, Any], allowed: frozenset[str], label: str) -> None:
    unknown = set(value) - allowed
    missing = allowed - set(value)
    if unknown or missing:
        raise ValueError(f"{label} fields are invalid")


def validate_pixel_office_payload(payload: dict[str, Any]) -> dict[str, Any]:
    """Reject unknown fields so private source values cannot leak by accident."""
    if not isinstance(payload, dict):
        raise ValueError("Pixel Office payload must be an object")
    _exact_fields(payload, PAYLOAD_FIELDS, "payload")
    if payload.get("version") != 1:
        raise ValueError("Pixel Office payload version must be 1")
    if not isinstance(payload.get("generatedAt"), str) or not payload["generatedAt"]:
        raise ValueError("generatedAt is required")

    objects = payload.get("objects")
    if not isinstance(objects, list) or len(objects) != len(OBJECT_ORDER):
        raise ValueError("Pixel Office must contain every object")
    if [row.get("id") for row in objects if isinstance(row, dict)] != list(OBJECT_ORDER):
        raise ValueError("Pixel Office objects are missing or out of order")

    valid_states = {item.value for item in OfficeObjectState}
    for row in objects:
        if not isinstance(row, dict):
            raise ValueError("Pixel Office object must be an object")
        _exact_fields(row, OBJECT_FIELDS, "object")
        if row["state"] not in valid_states:
            raise ValueError("Pixel Office object state is invalid")
        if not isinstance(row["summary"], str) or not isinstance(row["notice"], str):
            raise ValueError("Pixel Office object text fields are invalid")
        if not isinstance(row["count"], int) or row["count"] < 0:
            raise ValueError("Pixel Office object count is invalid")
        if not isinstance(row["asOf"], str) or not isinstance(row["stale"], bool):
            raise ValueError("Pixel Office object freshness fields are invalid")
        if row["state"] == OfficeObjectState.STALE.value and not row["stale"]:
            raise ValueError("Pixel Office stale state is inconsistent")

    agent = payload.get("agent")
    if not isinstance(agent, dict):
        raise ValueError("Pixel Office agent summary must be an object")
    _exact_fields(agent, AGENT_FIELDS, "agent")
    if not isinstance(agent["attentionCount"], int) or agent["attentionCount"] < 0:
        raise ValueError("Pixel Office attention count is invalid")
    if not isinstance(agent["latestJobId"], str) or not isinstance(agent["latestJobStatus"], str):
        raise ValueError("Pixel Office agent fields are invalid")
    return payload
