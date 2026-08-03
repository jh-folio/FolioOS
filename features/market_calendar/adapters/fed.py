from features.market_calendar.schema import normalize_event

# Fed 공식 발표 FOMC 연간 일정 전사(성명서는 2일차 14:00 ET).
# https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
FOMC_MEETINGS = {
    2026: [
        ("2026-01-27", "2026-01-28"), ("2026-03-17", "2026-03-18"),
        ("2026-04-28", "2026-04-29"), ("2026-06-16", "2026-06-17"),
        ("2026-07-28", "2026-07-29"), ("2026-09-15", "2026-09-16"),
        ("2026-10-27", "2026-10-28"), ("2026-12-08", "2026-12-09"),
    ],
}
_FOMC_URL = "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm"


def normalize_fed_events(rows: list[dict]) -> list[dict]:
    return [normalize_event({**row, "kind": "central_bank", "provider": "federal_reserve", "source": row.get("source") or "Federal Reserve", "status": row.get("status") or "confirmed"}) for row in rows if isinstance(row, dict)]


def official_fomc_events(years: list[int]) -> list[dict]:
    rows = []
    for year in years:
        for start, end in FOMC_MEETINGS.get(year, []):
            rows.append({
                "title": "FOMC 금리 결정 (성명서 14:00 ET)", "market": "US",
                "startsAt": f"{end}T14:00:00", "timezone": "America/New_York",
                "endsAt": f"{end}T14:30:00", "importance": 3, "sourceUrl": _FOMC_URL,
            })
            rows.append({
                "title": "FOMC 회의 1일차", "market": "US",
                "startsAt": f"{start}T09:00:00", "timezone": "America/New_York",
                "importance": 2, "sourceUrl": _FOMC_URL,
            })
    return normalize_fed_events(rows)
