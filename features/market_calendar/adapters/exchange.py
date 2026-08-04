from features.market_calendar.schema import normalize_event

# 공식 발표 연간 휴장일 전사. 새 연도 일정이 공시되면 아래 표만 갱신한다.
# NYSE: https://www.nyse.com/markets/hours-calendars
# KRX:  https://open.krx.co.kr (연간 휴장일 안내)
NYSE_HOLIDAYS = {
    2026: [
        ("2026-01-01", "New Year's Day"), ("2026-01-19", "Martin Luther King Jr. Day"),
        ("2026-02-16", "Washington's Birthday"), ("2026-04-03", "Good Friday"),
        ("2026-05-25", "Memorial Day"), ("2026-06-19", "Juneteenth"),
        ("2026-07-03", "Independence Day (observed)"), ("2026-09-07", "Labor Day"),
        ("2026-11-26", "Thanksgiving Day"), ("2026-12-25", "Christmas Day"),
    ],
}
KRX_HOLIDAYS = {
    2026: [
        ("2026-01-01", "신정"), ("2026-02-16", "설 연휴"), ("2026-02-17", "설날"), ("2026-02-18", "설 연휴"),
        ("2026-03-02", "삼일절 대체휴일"), ("2026-05-05", "어린이날"), ("2026-05-25", "부처님오신날 대체휴일"),
        ("2026-08-17", "광복절 대체휴일"), ("2026-09-24", "추석 연휴"), ("2026-09-25", "추석"),
        ("2026-09-28", "추석 대체휴일"), ("2026-10-05", "개천절 대체휴일"), ("2026-10-09", "한글날"),
        ("2026-12-25", "성탄절"), ("2026-12-31", "연말 휴장"),
    ],
}
_SOURCE_URLS = {"nyse": "https://www.nyse.com/markets/hours-calendars", "krx": "https://open.krx.co.kr"}


def normalize_exchange_holidays(rows: list[dict], *, provider: str) -> list[dict]:
    if provider not in {"nyse", "krx"}:
        raise ValueError("calendar_exchange_provider_invalid")
    return [normalize_event({**row, "kind": "holiday", "provider": provider, "source": row.get("source") or provider.upper(), "status": row.get("status") or "confirmed", "allDay": True}) for row in rows if isinstance(row, dict)]


def official_holiday_events(years: list[int]) -> list[dict]:
    events = []
    for provider, table, market, tz in (("nyse", NYSE_HOLIDAYS, "US", "America/New_York"), ("krx", KRX_HOLIDAYS, "KR", "Asia/Seoul")):
        rows = []
        for year in years:
            for date, title in table.get(year, []):
                rows.append({
                    "title": f"{'NYSE' if provider == 'nyse' else 'KRX'} 휴장 — {title}",
                    "market": market, "startsAt": f"{date}T00:00:00", "timezone": tz,
                    "importance": 1, "sourceUrl": _SOURCE_URLS[provider],
                })
        events.extend(normalize_exchange_holidays(rows, provider=provider))
    return events
