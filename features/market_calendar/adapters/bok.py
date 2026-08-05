"""Bank of Korea calendar events.

Korea had a normalizer here but no collector, and nothing in ``service.py`` ever
called it — so the calendar carried zero Korean central-bank and macro entries
while the US side had FOMC and, with a key, FRED releases.

ECOS publishes the statistics themselves, not a release-date calendar, so the
schedule is derived from what has actually been published: the latest observation
month of a series shows the cadence and where the next one falls. Those derived
dates are marked ``estimated``, never ``confirmed`` — the project reserves
``confirmed`` for dates an official operator published as a schedule.
"""
from __future__ import annotations

import datetime as dt
import json as _json
import urllib.parse
import urllib.request

from features.market_calendar.schema import normalize_event

ECOS_BASE = "https://ecos.bok.or.kr/api/StatisticSearch"

# ECOS 통계표 → (표시명, 주기, item1, 중요도).
# 한국은행·통계청 공표는 08:00 KST 관행을 따른다.
BOK_RELEASES: dict[str, tuple[str, str, str, int]] = {
    "722Y001": ("한국은행 기준금리 결정", "M", "0101000", 3),
    "901Y009": ("한국 소비자물가지수 (CPI)", "M", "0", 3),
    "901Y014": ("한국 생산자물가지수 (PPI)", "M", "*AA", 2),
}
_ECOS_DOC = "https://ecos.bok.or.kr/api/"


def normalize_bok_events(rows: list[dict]) -> list[dict]:
    return [
        normalize_event({
            **row,
            "kind": row.get("kind") or "central_bank",
            "provider": "bok",
            "source": row.get("source") or "Bank of Korea",
            "status": row.get("status") or "confirmed",
        })
        for row in rows
        if isinstance(row, dict)
    ]


def _parse_ecos_month(raw: str) -> dt.date | None:
    text = str(raw or "").strip()
    if len(text) != 6 or not text.isdigit():
        return None
    try:
        return dt.date(int(text[:4]), int(text[4:]), 1)
    except ValueError:
        return None


def _add_months(day: dt.date, months: int) -> dt.date:
    total = day.year * 12 + (day.month - 1) + months
    return dt.date(total // 12, total % 12 + 1, 1)


def fetch_bok_macro_events(api_key: str, *, start: str, end: str, timeout: float = 8.0) -> list[dict]:
    """Project upcoming Korean release dates from ECOS publication history.

    Returns ``[]`` without a key, matching the FRED adapter — a missing key is a
    reported coverage gap, not an error.
    """
    if not str(api_key or "").strip():
        return []
    try:
        start_date = dt.date.fromisoformat(start)
        end_date = dt.date.fromisoformat(end)
    except ValueError:
        return []

    lookback = _add_months(start_date, -6).strftime("%Y%m")
    horizon = _add_months(end_date, 1).strftime("%Y%m")
    rows: list[dict] = []

    for stat_code, (title, cycle, item1, importance) in BOK_RELEASES.items():
        parts = [api_key, "json", "kr", "1", "20", stat_code, cycle, lookback, horizon]
        if item1:
            parts.append(item1)
        path = "/".join(urllib.parse.quote(str(part), safe="") for part in parts)
        try:
            with urllib.request.urlopen(f"{ECOS_BASE}/{path}", timeout=timeout) as response:
                payload = _json.loads(response.read().decode("utf-8"))
        except Exception:
            continue

        observations = (payload.get("StatisticSearch") or {}).get("row") or []
        months = sorted({m for m in (_parse_ecos_month(o.get("TIME")) for o in observations) if m})
        if not months:
            continue

        # 마지막 관측월 다음 달부터 월 단위로 투영한다. ECOS가 공표 일정을 주지 않으므로
        # 일자는 해당 월 중순으로 두고 estimated로 표시한다.
        cursor = _add_months(months[-1], 1)
        while cursor <= end_date:
            release = cursor.replace(day=15)
            if start_date <= release <= end_date:
                rows.append({
                    "title": title,
                    "market": "KR",
                    "country": "KR",
                    "kind": "central_bank" if stat_code == "722Y001" else "macro",
                    "startsAt": f"{release.isoformat()}T08:00:00",
                    "timezone": "Asia/Seoul",
                    "importance": importance,
                    "status": "estimated",
                    "source": "Bank of Korea ECOS",
                    "sourceUrl": _ECOS_DOC,
                })
            cursor = _add_months(cursor, 1)

    return normalize_bok_events(rows)
