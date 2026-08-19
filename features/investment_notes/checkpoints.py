"""Deterministic projections for user-owned checkpoint notes.

Checkpoint text is hypothesis. This module normalizes only structured metadata
and never turns note content into evidence or mutates a source document.
"""
from __future__ import annotations

from collections.abc import Callable, Iterable, Mapping
from datetime import UTC, date, datetime, timedelta, timezone
from enum import StrEnum
import re

from features.investment_notes.intelligence_schema import CheckpointState


_KST = timezone(timedelta(hours=9))
_REFERENCE_ID = re.compile(r"^[A-Za-z0-9:._-]{1,200}$")
_DUE_ORDER = {
    "overdue": 0,
    "due": 1,
    "upcoming": 2,
    "unknown": 3,
    "checked": 4,
    "invalidated": 5,
}


class CheckpointDueState(StrEnum):
    UNKNOWN = "unknown"
    UPCOMING = "upcoming"
    DUE = "due"
    OVERDUE = "overdue"
    CHECKED = "checked"
    INVALIDATED = "invalidated"


def _value(payload: Mapping[str, object], existing: Mapping[str, object], *keys: str):
    for key in keys:
        if key in payload:
            return payload[key]
    for key in keys:
        if key in existing:
            return existing[key]
    return None


def _date_text(value: object) -> str:
    text = str(value or "").strip()
    try:
        return date.fromisoformat(text).isoformat() if text else ""
    except ValueError:
        return ""


def _reference_ids(value: object, *, limit: int = 20) -> list[str]:
    values = [value] if isinstance(value, str) else value
    if not isinstance(values, (list, tuple)):
        return []
    rows: list[str] = []
    seen: set[str] = set()
    for item in values:
        reference_id = str(item or "").strip()
        if not _REFERENCE_ID.fullmatch(reference_id) or reference_id in seen:
            continue
        rows.append(reference_id)
        seen.add(reference_id)
        if len(rows) >= limit:
            break
    return rows


def normalize_checkpoint_fields(
    payload: Mapping[str, object] | None,
    existing: Mapping[str, object] | None = None,
) -> dict:
    candidate = payload if isinstance(payload, Mapping) else {}
    previous = existing if isinstance(existing, Mapping) else {}
    raw_state = str(
        _value(candidate, previous, "checkpointState", "checkpoint_state") or "open"
    ).strip().lower()
    states = {state.value for state in CheckpointState}
    checkpoint_state = raw_state if raw_state in states else CheckpointState.OPEN.value
    return {
        "checkpointState": checkpoint_state,
        "dueDate": _date_text(_value(candidate, previous, "dueDate", "due_date")),
        "lastCheckedDate": _date_text(
            _value(candidate, previous, "lastCheckedDate", "last_checked_date")
        ),
        "linkedCollectionIds": _reference_ids(
            _value(
                candidate,
                previous,
                "linkedCollectionIds",
                "linked_collection_ids",
                "linkedCollections",
            )
        ),
    }


def _clock_date(clock: Callable[[], datetime | date]) -> date:
    """오늘 날짜는 KST 기준이다.

    사용자에게 보이는 마감일은 한국 날짜이므로 UTC 날짜로 비교하면 KST 00~09시
    (장 시작 전)에 overdue/due가 하루 이르게 판정된다. 시계는 계속 주입받고
    시간대만 서울로 옮긴다(naive 시계는 예전처럼 UTC로 읽는다).
    """
    observed = clock()
    if isinstance(observed, datetime):
        if observed.utcoffset() is None:
            observed = observed.replace(tzinfo=UTC)
        return observed.astimezone(_KST).date()
    return observed


def checkpoint_due_state(
    note: Mapping[str, object],
    *,
    clock: Callable[[], datetime | date],
) -> CheckpointDueState:
    fields = normalize_checkpoint_fields(note)
    state = fields["checkpointState"]
    if state == CheckpointState.CHECKED.value:
        return CheckpointDueState.CHECKED
    if state == CheckpointState.INVALIDATED.value:
        return CheckpointDueState.INVALIDATED
    if state == CheckpointState.DUE.value:
        return CheckpointDueState.DUE
    due_text = fields["dueDate"]
    if not due_text:
        return CheckpointDueState.UNKNOWN
    due_date = date.fromisoformat(due_text)
    today = _clock_date(clock)
    if due_date < today:
        return CheckpointDueState.OVERDUE
    if due_date == today:
        return CheckpointDueState.DUE
    return CheckpointDueState.UPCOMING


def checkpoint_projection(
    note: Mapping[str, object],
    *,
    clock: Callable[[], datetime | date],
) -> dict:
    row = dict(note)
    row.update(normalize_checkpoint_fields(row))
    row["dueState"] = checkpoint_due_state(row, clock=clock).value
    row["layer"] = "hypothesis"
    row["sourceLayer"] = "user_synthesis"
    row["reuseAsHypothesis"] = True
    row["reuseAsEvidence"] = False
    return row


def _public_checkpoint(note: Mapping[str, object], *, clock: Callable[[], datetime | date]) -> dict:
    projected = checkpoint_projection(note, clock=clock)
    return {
        "id": str(projected.get("id") or "")[:96],
        "noteType": "checkpoint",
        "title": str(projected.get("title") or "")[:160],
        "ticker": str(projected.get("ticker") or "")[:12],
        "checkpointState": projected["checkpointState"],
        "dueState": projected["dueState"],
        "dueDate": projected["dueDate"],
        "lastCheckedDate": projected["lastCheckedDate"],
        "linkedReports": _reference_ids(projected.get("linkedReports")),
        "linkedCollectionIds": projected["linkedCollectionIds"],
        "layer": "hypothesis",
        "sourceLayer": "user_synthesis",
        "reuseAsHypothesis": True,
        "reuseAsEvidence": False,
        "updatedAt": str(projected.get("updatedAt") or "")[:48],
    }


def project_checkpoint_notes(
    notes: Iterable[object],
    *,
    clock: Callable[[], datetime | date],
    ticker: str = "",
    limit: int = 20,
) -> list[dict]:
    normalized_ticker = str(ticker or "").strip().upper()
    rows = [
        _public_checkpoint(note, clock=clock)
        for note in notes
        if isinstance(note, Mapping)
        and str(note.get("noteType") or "") == "checkpoint"
        and (not normalized_ticker or str(note.get("ticker") or "").upper() == normalized_ticker)
    ]
    rows.sort(
        key=lambda row: (
            _DUE_ORDER[row["dueState"]],
            row["dueDate"] or "9999-12-31",
            row["title"].casefold(),
            row["id"],
        )
    )
    return rows[: max(1, min(int(limit or 20), 100))]


__all__ = [
    "CheckpointDueState",
    "checkpoint_due_state",
    "checkpoint_projection",
    "normalize_checkpoint_fields",
    "project_checkpoint_notes",
]
