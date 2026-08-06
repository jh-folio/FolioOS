import datetime as dt
import json as _json
import urllib.parse
import urllib.request

from features.market_calendar.schema import normalize_event

# FRED release id → (표시명, 중요도). 발표 시각은 BLS/BEA/Census 공식 고정 시각 08:30 ET.
# https://fred.stlouisfed.org/docs/api/fred/release_dates.html
# 릴리즈 하나에는 시리즈가 여럿 들어 있다. 헤드라인 숫자로 읽히는 대표 시리즈를
# 하나씩만 지정해 발표 결과를 채운다. 없는 릴리즈는 일정만 남는다.
FRED_HEADLINE_SERIES: dict[int, tuple[str, str]] = {
    10: ("CPIAUCSL", "지수"),
    50: ("PAYEMS", "천 명"),
    53: ("GDPC1", "십억 달러"),
    54: ("PCEPI", "지수"),
    46: ("PPIACO", "지수"),
    9: ("RSAFS", "백만 달러"),
    192: ("JTSJOL", "천 건"),
    13: ("INDPRO", "지수"),
    51: ("BOPGSTB", "백만 달러"),
}

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
                "_releaseId": release_id,
                "title": title, "market": "US", "startsAt": f"{date}T08:30:00",
                "timezone": "America/New_York", "importance": importance,
                "sourceUrl": f"https://fred.stlouisfed.org/release?rid={release_id}",
            })
    _attach_observations(rows, api_key, timeout=timeout)
    return normalize_fred_releases(rows)


_FRED_OBSERVATIONS = "https://api.stlouisfed.org/fred/series/observations"


def _attach_observations(rows: list[dict], api_key: str, *, timeout: float) -> None:
    """Fill released figures for dates that have already passed.

    예정만 보여주면 발표 뒤에 캘린더를 다시 열 이유가 없다. 아직 오지 않은 일정은
    값이 없는 것이 정상이므로 건드리지 않는다.
    """
    today = dt.date.today().isoformat()
    cache: dict[str, list[dict]] = {}
    for row in rows:
        release_id = row.get("_releaseId")
        series = FRED_HEADLINE_SERIES.get(release_id or 0)
        if not series or str(row.get("startsAt") or "")[:10] > today:
            continue
        series_id, unit = series
        if series_id not in cache:
            params = urllib.parse.urlencode({
                "series_id": series_id, "api_key": api_key, "file_type": "json",
                "sort_order": "desc", "limit": 2,
            })
            try:
                with urllib.request.urlopen(f"{_FRED_OBSERVATIONS}?{params}", timeout=timeout) as response:
                    payload = _json.loads(response.read().decode("utf-8"))
                cache[series_id] = payload.get("observations") or []
            except Exception:
                cache[series_id] = []
        points = [p for p in cache[series_id] if str(p.get("value") or ".") != "."]
        if not points:
            continue
        row["status"] = "actual"
        row["actualValue"] = points[0].get("value")
        row["previousValue"] = points[1].get("value") if len(points) > 1 else ""
        row["unit"] = unit
        row["observedAt"] = points[0].get("date") or ""
