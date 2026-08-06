"""Economic release dates for markets FRED does not schedule.

FRED publishes confirmed release dates, but only for US series. Japan and Europe
had no macro calendar at all, and the plan needs one for the 0.5 markets.

yfinance 1.4.x exposes an economic events calendar covering many countries with
no API key — in a live probe it returned 13 Japanese, 21 UK, 8 German and 7
Korean entries alongside 57 US ones. It is a third-party aggregation with terse
event names and repeated rows, so everything here is `estimated`.

It also doubles as the US fallback for anyone without a FRED key: FRED wins when
a key exists, since it publishes the authoritative dates, but without one this is
the difference between a macro calendar and an empty screen.
"""
from __future__ import annotations

import datetime as dt

from features.common.markets import MarketCode
from features.market_calendar.schema import normalize_event

# yfinance Region → (Folio 시장, 국가).
# 미국은 FRED 키가 있으면 그쪽이 confirmed 날짜를 주므로 기본 대상에서 빠지고,
# 키가 없을 때만 호출자가 `include_us=True`로 폴백을 켠다.
REGION_MARKETS: dict[str, tuple[str, str]] = {
    "US": (MarketCode.US.value, "US"),
    "JP": (MarketCode.JP.value, "JP"),
    "GB": (MarketCode.EUROPE.value, "GB"),
    "DE": (MarketCode.EUROPE.value, "DE"),
    "FR": (MarketCode.EUROPE.value, "FR"),
    "NL": (MarketCode.EUROPE.value, "NL"),
    "IT": (MarketCode.EUROPE.value, "IT"),
    "ES": (MarketCode.EUROPE.value, "ES"),
    "KR": (MarketCode.KR.value, "KR"),
}

# 브리핑에서 실제로 쓰이는 지표만 통과시킨다. 이 필터가 없으면 한 지역에서만
# 수십 건이 들어와 캘린더가 지표 나열로 덮인다.
IMPORTANT_EVENT_TERMS = (
    "cpi", "inflation", "ppi", "gdp", "unemployment", "employment", "payroll",
    "interest rate", "rate decision", "boj", "ecb", "retail sales", "trade balance",
    "industrial", "pmi", "ifo", "zew", "consumer confidence", "consumer sentiment",
    "machinery orders", "tankan", "export", "import", "wage", "earnings",
)


def normalize_yf_economic_events(rows: list[dict]) -> list[dict]:
    return [
        normalize_event({
            **row,
            "kind": "macro",
            "provider": "yfinance_economic",
            "source": row.get("source") or "Yahoo Finance economic calendar",
            # 제3자 집계다. 공식 기관이 발표한 일정이 아니므로 confirmed로 올리지 않는다.
            "status": "estimated",
        })
        for row in rows
        if isinstance(row, dict)
    ]


def _is_important(name: str) -> bool:
    text = str(name or "").lower()
    return any(term in text for term in IMPORTANT_EVENT_TERMS)


def _clean_title(name: str) -> str:
    # 집계 원본은 "Industrial O/P Rev MM SA *" 처럼 별표·약어를 단다. 별표만 떼고
    # 나머지는 그대로 둔다 — 임의로 풀어 쓰면 원본과 대조가 어려워진다.
    return " ".join(str(name or "").replace("*", " ").split())


def fetch_yf_economic_events(
    *, start: str, end: str, limit: int = 400, include_us: bool = False
) -> list[dict]:
    """Collect macro releases for the 0.5 markets.

    ``include_us`` is the FRED fallback. With a FRED key the US comes from there
    with confirmed dates, so including it here would only duplicate rows under a
    weaker status. Without a key the US would otherwise have no macro calendar at
    all, and the dates line up — a live comparison put yfinance's PPI and retail
    sales on the same days FRED reports.
    """
    try:
        import yfinance as yf
    except Exception:
        return []
    try:
        start_date = dt.date.fromisoformat(start)
        end_date = dt.date.fromisoformat(end)
    except ValueError:
        return []

    try:
        calendars = yf.Calendars(start=start_date, end=end_date)
    except Exception:
        return []

    frames = []
    for offset in range(0, max(100, limit), 100):
        try:
            frame = calendars.get_economic_events_calendar(limit=100, offset=offset)
        except Exception:
            break
        if frame is None or getattr(frame, "empty", True):
            break
        frames.append(frame)

    seen: set[tuple] = set()
    rows: list[dict] = []
    for frame in frames:
        for name, record in zip(frame.index, frame.to_dict("records")):
            region = str(record.get("Region") or "").strip().upper()
            if region == "US" and not include_us:
                continue
            target = REGION_MARKETS.get(region)
            if not target:
                continue
            if not _is_important(name):
                continue
            stamp = record.get("Event Time")
            if stamp is None or not hasattr(stamp, "isoformat"):
                continue
            market, country = target
            title = _clean_title(name)
            # 같은 이벤트가 여러 날짜에 반복돼 들어온다(실측 중복률 35%).
            # 지역·이벤트·날짜로 접어 하루 한 건만 남긴다.
            key = (region, title, stamp.date().isoformat())
            if key in seen:
                continue
            seen.add(key)
            rows.append({
                "title": f"{country} {title}",
                "market": market,
                "country": country,
                "startsAt": stamp.isoformat(),
                "timezone": "UTC",
                "importance": 2,
                # 링크를 붙이지 않는다. yfinance는 수집 경로일 뿐 사용자가 읽을
                # 원문이 아니라, 클릭하면 제3자 캘린더 페이지로 나가버린다.
            })
    return normalize_yf_economic_events(rows)
