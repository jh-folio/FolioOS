from __future__ import annotations

import datetime as dt
import hashlib
import re
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

KINDS = {"macro", "central_bank", "holiday", "earnings", "filing", "dividend"}
STATUSES = {"confirmed", "estimated", "tentative", "actual"}


def _number(value) -> str:
    """Released figures stay as text: a missing reading is unknown, not zero."""
    if value is None or value == "":
        return ""
    try:
        return f"{float(value):g}"
    except (TypeError, ValueError):
        return _text(value, 24)


def _text(value, limit=300):
    return re.sub(r"\s+", " ", str(value or "")).strip()[:limit]


def _timezone(value: object) -> str:
    name = _text(value or "UTC", 60)
    try:
        ZoneInfo(name)
    except ZoneInfoNotFoundError as exc:
        raise ValueError("calendar_timezone_invalid") from exc
    return name


def _iso_time(value: object, *, all_day: bool, timezone: str) -> str:
    text = _text(value, 50)
    if not text:
        raise ValueError("calendar_starts_at_required")
    if all_day and re.fullmatch(r"\d{4}-\d{2}-\d{2}", text):
        dt.date.fromisoformat(text)
        return text
    try:
        parsed = dt.datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError("calendar_starts_at_invalid") from exc
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=ZoneInfo(timezone))
    return parsed.isoformat()


def normalize_event(value: dict) -> dict:
    row = value or {}
    kind = _text(row.get("kind"), 30)
    if kind not in KINDS:
        raise ValueError("calendar_kind_invalid")
    status = _text(row.get("status") or "tentative", 20)
    if status not in STATUSES:
        status = "tentative"
    all_day = bool(row.get("allDay") or row.get("all_day"))
    timezone = _timezone(row.get("timezone") or "UTC")
    starts = _iso_time(row.get("startsAt") or row.get("starts_at"), all_day=all_day, timezone=timezone)
    ends_raw = row.get("endsAt") or row.get("ends_at")
    ends = _iso_time(ends_raw, all_day=all_day, timezone=timezone) if ends_raw else ""
    provider = _text(row.get("provider") or row.get("source"), 80)
    title = _text(row.get("title"), 220)
    event_id = _text(row.get("id"), 120) or "cal_" + hashlib.sha256(f"{kind}|{provider}|{title}|{starts}".encode("utf-8")).hexdigest()[:18]
    tickers = row.get("tickers") if isinstance(row.get("tickers"), list) else []
    return {
        "id": event_id, "kind": kind, "title": title, "market": _text(row.get("market") or "GLOBAL", 20).upper(),
        "country": _text(row.get("country"), 30).upper(), "tickers": [_text(t, 24).upper() for t in tickers if _text(t, 24)][:20],
        "startsAt": starts, "endsAt": ends,
        "timezone": timezone, "allDay": all_day, "cancelled": bool(row.get("cancelled") or row.get("isCancelled")),
        "status": status, "importance": max(0, min(int(row.get("importance") or 1), 3)),
        "source": _text(row.get("source") or provider, 120), "sourceUrl": _text(row.get("sourceUrl") or row.get("source_url"), 1200),
        "asOf": _text(row.get("asOf") or row.get("as_of") or starts, 50),
        "fetchedAt": _text(row.get("fetchedAt") or row.get("fetched_at") or dt.datetime.now(dt.timezone.utc).isoformat(), 50),
        "updatedAt": _text(row.get("updatedAt") or row.get("updated_at") or row.get("fetchedAt") or row.get("fetched_at") or dt.datetime.now(dt.timezone.utc).isoformat(), 50),
        "provider": provider, "parserVersion": _text(row.get("parserVersion") or "0.4.0", 30),
        # 발표된 지표의 실제 결과. 예정만 보여주면 캘린더를 다시 열 이유가 없다.
        # 값이 없으면 빈 문자열이며, 없는 것을 0으로 바꾸지 않는다.
        "actualValue": _number(row.get("actualValue")),
        # 시장 예상치. 발표된 숫자는 예상 대비로 읽어야 의미가 생긴다 — 직전 대비만
        # 보면 서프라이즈인지 예정된 흐름인지 구분되지 않는다. 제공처가 줄 때만 찬다.
        "forecastValue": _number(row.get("forecastValue")),
        "previousValue": _number(row.get("previousValue")),
        "unit": _text(row.get("unit"), 24),
        # 격자는 좁아 티커로 두고, 아래 표에서 이름을 펼친다. `8306.T`만으로는
        # 어느 회사 실적인지 알 수 없다.
        "companyName": _text(row.get("companyName"), 120),
        "observedAt": _text(row.get("observedAt"), 30),
    }
