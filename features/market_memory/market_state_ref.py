from __future__ import annotations

import json
import re
import sqlite3
import unicodedata
from contextlib import closing
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Literal, Mapping, TypeAlias

JsonValue: TypeAlias = str | int | float | bool | None | list["JsonValue"] | dict[str, "JsonValue"]

Scope = Literal["GLOBAL", "US", "KR"]
Status = Literal["current", "stale", "fallback", "empty"]
Policy = Literal["exclude", "include_current"]
MarketStateRef: TypeAlias = dict[str, JsonValue]
MarketStateResolution: TypeAlias = dict[str, JsonValue]

_INSTANT = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|\+00:00)$")


@dataclass(frozen=True, slots=True)
class MarketStateContractError(ValueError):
    field: str
    value: str

    def __str__(self) -> str:
        return f"invalid {self.field}: {self.value}"


@dataclass(frozen=True, slots=True)
class MarketStateRefQuery:
    market_db_path: Path
    research_db_path: Path
    scope: str
    now: datetime
    failed_attempts: tuple[Mapping[str, JsonValue], ...] = ()

def _instant(value: JsonValue) -> datetime | None:
    if not isinstance(value, str) or not _INSTANT.fullmatch(value):
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed if parsed.utcoffset() == timedelta(0) else None


def _utc_text(value: datetime) -> str:
    if value.utcoffset() != timedelta(0):
        raise MarketStateContractError("now", str(value))
    return value.astimezone(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def _token(value: str) -> str:
    return unicodedata.normalize("NFKC", value).strip().casefold()


def _scope(value: str, field: str = "scope") -> Scope:
    scopes: dict[str, Scope] = {"GLOBAL": "GLOBAL", "US": "US", "KR": "KR"}
    parsed = scopes.get(_token(value).upper())
    if parsed is None:
        raise MarketStateContractError(field, value)
    return parsed


def resolve_market_state_scope(
    requested_scope: str, *, regions: tuple[str, ...] = (), collection_market: str | None = None,
) -> Scope:
    requested = _token(requested_scope).upper()
    if requested != "AUTO":
        return _scope(requested, "requestedScope")
    us_tokens = {"us", "usa", "united states", "미국"}
    kr_tokens = {"kr", "kor", "south korea", "korea", "대한민국", "한국"}
    normalized = {_token(region) for region in regions}
    has_us, has_kr = bool(normalized & us_tokens), bool(normalized & kr_tokens)
    if has_us and has_kr:
        return "GLOBAL"
    if has_us:
        return "US"
    if has_kr:
        return "KR"
    collection = _token(collection_market or "").upper()
    collection_scopes: dict[str, Scope] = {"US": "US", "KR": "KR"}
    return collection_scopes.get(collection, "GLOBAL")


def load_market_state_snapshot(path: Path) -> dict[str, JsonValue] | None:
    if not path.is_file():
        return None
    try:
        with closing(sqlite3.connect(f"file:{path.as_posix()}?mode=ro", uri=True)) as connection:
            row = connection.execute(
                "SELECT payload_json FROM market_state_snapshots WHERE status != 'archived' ORDER BY as_of DESC LIMIT 1"
            ).fetchone()
        payload = json.loads(str(row[0])) if row else None
    except (json.JSONDecodeError, OSError, sqlite3.Error, TypeError):
        return None
    return payload if isinstance(payload, dict) else None


def _fallback_as_of(path: Path) -> str | None:
    if not path.is_file():
        return None
    try:
        with closing(sqlite3.connect(f"file:{path.as_posix()}?mode=ro", uri=True)) as connection:
            rows = connection.execute(
                "SELECT updated_at FROM market_narrative_states WHERE status IN ('active','watch')"
            ).fetchall()
    except (OSError, sqlite3.Error):
        return None
    valid = [(parsed, str(row[0])) for row in rows if (parsed := _instant(str(row[0])))]
    return max(valid)[1] if valid else ("" if rows else None)


def _markets(raw: str) -> set[str]:
    try:
        metadata = json.loads(raw or "{}")
    except (json.JSONDecodeError, TypeError):
        return {"UNKNOWN"}
    if not isinstance(metadata, dict):
        return {"UNKNOWN"}
    value = metadata.get("markets", metadata.get("market"))
    values = value if isinstance(value, list) else [value]
    markets = {_token(item).upper() for item in values if isinstance(item, str) and item.strip()}
    return markets or {"UNKNOWN"}


def _watermark(path: Path, scope: Scope) -> tuple[str | None, int]:
    if not path.is_file():
        return None, 0
    try:
        with closing(sqlite3.connect(f"file:{path.as_posix()}?mode=ro", uri=True)) as connection:
            rows = connection.execute(
                "SELECT path,metadata_json,content_updated_at FROM documents WHERE type='article' AND market_relevance>0"
            ).fetchall()
    except (OSError, sqlite3.Error):
        return None, 0
    valid: list[tuple[datetime, str]] = []
    invalid = 0
    for row in rows:
        normalized_path = str(row[0] or "").replace("\\", "/")
        if not normalized_path.startswith(("research-inbox/rss/", "research-inbox/articles/")):
            continue
        markets = _markets(str(row[1] or "{}"))
        if scope != "GLOBAL" and not ({scope, "GLOBAL"} & markets):
            continue
        timestamp = str(row[2] or "")
        parsed = _instant(timestamp)
        if parsed is None:
            invalid += 1
        else:
            valid.append((parsed, timestamp))
    return (max(valid)[1] if valid else None), invalid


def capture_input_watermarks(path: Path) -> dict[str, JsonValue]:
    return {scope: _watermark(path, scope)[0] for scope in ("GLOBAL", "US", "KR")}


def _base_ref(query: MarketStateRefQuery, source: str, status: Status, reason: str) -> MarketStateRef:
    scope = _parse_scope(query.scope)
    return {
        "snapshotId": None, "sourceKind": source, "scope": scope, "asOf": None, "status": status,
        "freshnessReason": reason, "inputWatermark": None, "relevantEvidenceWatermark": None,
        "invalidWatermarkRows": 0, "resolvedAt": _utc_text(query.now), "layer": "source-grounded",
    }


def _parse_scope(value: str) -> Scope:
    return _scope(value)


def _snapshot_ref(query: MarketStateRefQuery, snapshot: Mapping[str, JsonValue]) -> MarketStateRef:
    ref = _base_ref(query, "snapshot", "stale", "invalid_as_of")
    ref["snapshotId"] = str(snapshot.get("id") or "") or None
    ref["asOf"] = str(snapshot.get("asOf") or "") or None
    live, invalid = _watermark(query.research_db_path, ref["scope"])
    ref["relevantEvidenceWatermark"], ref["invalidWatermarkRows"] = live, invalid
    as_of = _instant(snapshot.get("asOf"))
    if as_of is None:
        return ref
    if as_of > query.now:
        ref["freshnessReason"] = "future_as_of"
        return ref
    raw_watermarks = snapshot.get("inputWatermarks")
    raw_input = raw_watermarks.get(ref["scope"]) if isinstance(raw_watermarks, dict) and ref["scope"] in raw_watermarks else False
    if raw_input is False or (raw_input is None and live is not None):
        ref["freshnessReason"] = "missing_input_watermark"
        return ref
    input_at = _instant(raw_input) if raw_input is not None else None
    if raw_input is not None and input_at is None:
        ref["freshnessReason"] = "missing_input_watermark"
        return ref
    ref["inputWatermark"] = str(raw_input) if raw_input is not None else None
    if query.now - as_of > timedelta(hours=72):
        ref["freshnessReason"] = "age_exceeded"
        return ref
    live_at = _instant(live) if live else None
    if live_at and input_at and live_at > input_at:
        ref["freshnessReason"] = "new_relevant_evidence"
        return ref
    for attempt in query.failed_attempts:
        finished = _instant(attempt.get("finishedAt"))
        attempt_scope = str(attempt.get("scope") or "").upper()
        if attempt.get("status") == "failed" and attempt_scope in {ref["scope"], "GLOBAL"} and finished and finished > as_of:
            ref["freshnessReason"] = "update_failed"
            return ref
    ref["status"], ref["freshnessReason"] = "current", "within_window"
    return ref


def resolve_market_state_ref(query: MarketStateRefQuery) -> MarketStateRef:
    snapshot = load_market_state_snapshot(query.market_db_path)
    if snapshot is not None:
        return _snapshot_ref(query, snapshot)
    fallback = _fallback_as_of(query.market_db_path)
    if fallback is None:
        return _base_ref(query, "none", "empty", "no_state")
    ref = _base_ref(query, "state_fallback", "fallback", "state_fallback")
    ref["asOf"] = fallback or None
    ref["relevantEvidenceWatermark"], ref["invalidWatermarkRows"] = _watermark(query.research_db_path, ref["scope"])
    return ref
