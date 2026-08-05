import json as _json
import urllib.parse
import urllib.request

from features.market_calendar.schema import normalize_event

# FRED release id → (표시명, 중요도). 발표 시각은 BLS/BEA/Census 공식 고정 시각 08:30 ET.
# https://fred.stlouisfed.org/docs/api/fred/release_dates.html
FRED_RELEASES = {
    10: ("미국 CPI", 3),
    50: ("미국 고용보고서", 3),
    53: ("미국 GDP", 2),
    54: ("미국 개인소득·지출 (PCE)", 3),
    46: ("미국 PPI", 2),
    # `8`은 FRED 릴리즈 목록에 없는 번호라 소매판매가 한 번도 들어온 적이 없다.
    # 실제 번호는 9(Advance Monthly Sales for Retail and Food Services)다.
    9: ("미국 소매판매", 2),
    192: ("미국 JOLTS 구인·이직", 2),
    13: ("미국 산업생산", 2),
    51: ("미국 무역수지", 2),
}
_FRED_API = "https://api.stlouisfed.org/fred/release/dates"


def normalize_fred_releases(rows: list[dict]) -> list[dict]:
    return [normalize_event({**row, "kind": "macro", "provider": "fred", "source": row.get("source") or "FRED", "status": row.get("status") or "confirmed"}) for row in rows if isinstance(row, dict)]


def fetch_fred_macro_events(api_key: str, *, start: str, end: str, timeout: float = 8.0) -> list[dict]:
    """Fetch scheduled release dates for the allowlisted FRED releases. Returns [] without a key."""
    if not str(api_key or "").strip():
        return []
    rows = []
    for release_id, (title, importance) in FRED_RELEASES.items():
        params = urllib.parse.urlencode({
            "release_id": release_id, "api_key": api_key, "file_type": "json",
            "include_release_dates_with_no_data": "true", "sort_order": "asc",
            "realtime_start": start, "realtime_end": end, "limit": 30,
        })
        try:
            with urllib.request.urlopen(f"{_FRED_API}?{params}", timeout=timeout) as response:
                payload = _json.loads(response.read().decode("utf-8"))
        except Exception:
            continue
        for entry in payload.get("release_dates", []):
            date = str(entry.get("date") or "")
            if not (start <= date <= end):
                continue
            rows.append({
                "title": title, "market": "US", "startsAt": f"{date}T08:30:00",
                "timezone": "America/New_York", "importance": importance,
                "sourceUrl": f"https://fred.stlouisfed.org/release?rid={release_id}",
            })
    return normalize_fred_releases(rows)
