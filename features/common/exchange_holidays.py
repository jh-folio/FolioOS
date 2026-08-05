"""Exchange holiday tables for the 0.5 markets.

`market_open_status` only knew NYSE and KRX, so Europe and Japan resolved to
`unsupported_market` and every day read as closed — which would have made every
European and Japanese briefing think the market never traded.

These are transcribed from each operator's published annual calendar, the same
approach the project already uses for NYSE, KRX and FOMC. They are `confirmed`
because an operator published them, but they expire: a year with no table must
report that rather than silently treating every weekday as a trading day.

Europe is deliberately not one calendar. London and the continent diverge — UK
bank holidays in May and August close the LSE while Euronext trades, and Boxing
Day differs again — so a single "Europe closed" flag would be wrong roughly a
dozen times a year. Each venue keeps its own table and the region reports the
union of what is open.
"""
from __future__ import annotations

import datetime as dt

# 각 거래소가 공시한 연간 휴장일. 새 연도 공시가 나오면 이 표만 갱신한다.
# LSE: https://www.londonstockexchange.com/trade/trading-access/business-days
# Xetra: https://www.xetra.com/xetra-en/trading/trading-calendar-and-trading-hours
# Euronext: https://www.euronext.com/en/trading/trading-hours-holidays
# BME: https://www.bolsasymercados.es/en/bme-exchange/trading/trading-calendar.html
# JPX: https://www.jpx.co.jp/english/corporate/about-jpx/calendar/
# 주말에 걸치는 공휴일은 넣지 않는다. 세션 판정에는 영향이 없지만 캘린더에
# 토요일 휴장 일정이 뜨기 때문이다.
EXCHANGE_HOLIDAYS: dict[str, dict[int, tuple[tuple[str, str], ...]]] = {
    "LSE": {
        2026: (
            ("2026-01-01", "New Year's Day"), ("2026-04-03", "Good Friday"),
            ("2026-04-06", "Easter Monday"), ("2026-05-04", "Early May bank holiday"),
            ("2026-05-25", "Spring bank holiday"), ("2026-08-31", "Summer bank holiday"),
            ("2026-12-25", "Christmas Day"), ("2026-12-28", "Boxing Day (substitute)"),
        ),
    },
    "XETRA": {
        2026: (
            ("2026-01-01", "Neujahr"), ("2026-04-03", "Karfreitag"),
            ("2026-04-06", "Ostermontag"), ("2026-05-01", "Tag der Arbeit"),
            ("2026-12-24", "Heiligabend"), ("2026-12-25", "1. Weihnachtstag"),
            ("2026-12-31", "Silvester"),
        ),
    },
    "EURONEXT": {  # 파리·암스테르담·브뤼셀 공통
        2026: (
            ("2026-01-01", "New Year's Day"), ("2026-04-03", "Good Friday"),
            ("2026-04-06", "Easter Monday"), ("2026-05-01", "Labour Day"),
            ("2026-12-25", "Christmas Day"),
        ),
    },
    "BORSA_ITALIANA": {
        2026: (
            ("2026-01-01", "Capodanno"), ("2026-04-03", "Venerdì Santo"),
            ("2026-04-06", "Lunedì dell'Angelo"), ("2026-05-01", "Festa del Lavoro"),
            ("2026-12-24", "Vigilia di Natale"), ("2026-12-25", "Natale"),
            ("2026-12-31", "Ultimo dell'anno"),
        ),
    },
    "BME": {
        2026: (
            ("2026-01-01", "Año Nuevo"), ("2026-04-03", "Viernes Santo"),
            ("2026-04-06", "Lunes de Pascua"), ("2026-05-01", "Día del Trabajo"),
            ("2026-12-25", "Navidad"),
        ),
    },
    "JPX": {
        2026: (
            ("2026-01-01", "元日"), ("2026-01-02", "年始休業"), ("2026-01-12", "成人の日"),
            ("2026-02-11", "建国記念の日"), ("2026-02-23", "天皇誕生日"), ("2026-03-20", "春分の日"),
            ("2026-04-29", "昭和の日"), ("2026-05-04", "みどりの日"), ("2026-05-05", "こどもの日"),
            ("2026-05-06", "憲法記念日 振替休日"), ("2026-07-20", "海の日"), ("2026-08-11", "山の日"),
            ("2026-09-21", "敬老の日"), ("2026-09-22", "国民の休日"), ("2026-09-23", "秋分の日"),
            ("2026-10-12", "スポーツの日"), ("2026-11-03", "文化の日"), ("2026-11-23", "勤労感謝の日"),
            ("2026-12-31", "大納会翌日 休業"),
        ),
    },
}

# Folio 시장 → 그 시장을 구성하는 거래소. 유럽은 여러 venue의 합집합이다.
MARKET_EXCHANGES: dict[str, tuple[str, ...]] = {
    "EUROPE": ("LSE", "XETRA", "EURONEXT", "BORSA_ITALIANA", "BME"),
    "JP": ("JPX",),
}

EXCHANGE_TIMEZONES: dict[str, str] = {
    "LSE": "Europe/London",
    "XETRA": "Europe/Berlin",
    "EURONEXT": "Europe/Paris",
    "BORSA_ITALIANA": "Europe/Rome",
    "BME": "Europe/Madrid",
    "JPX": "Asia/Tokyo",
}

EXCHANGE_LABELS: dict[str, str] = {
    "LSE": "런던증권거래소",
    "XETRA": "Xetra (프랑크푸르트)",
    "EURONEXT": "Euronext (파리·암스테르담)",
    "BORSA_ITALIANA": "Borsa Italiana (밀라노)",
    "BME": "BME (마드리드)",
    "JPX": "일본거래소그룹 (도쿄)",
}


def has_coverage(exchange: str, year: int) -> bool:
    """Whether a transcribed table exists for this exchange and year."""
    return year in EXCHANGE_HOLIDAYS.get(exchange, {})


def exchange_holiday_rows(exchange: str, year: int) -> tuple[tuple[dt.date, str], ...]:
    """Dated holidays with their published names, for calendar events."""
    return tuple(
        (dt.date.fromisoformat(text), title)
        for text, title in EXCHANGE_HOLIDAYS.get(exchange, {}).get(year, ())
    )


def exchange_holidays(exchange: str, year: int) -> set[dt.date]:
    return {day for day, _ in exchange_holiday_rows(exchange, year)}


def exchange_open_on(exchange: str, day: dt.date) -> bool | None:
    """``None`` when the year has no table — never guess a trading day."""
    if not has_coverage(exchange, day.year):
        return None
    if day.weekday() >= 5:
        return False
    return day not in exchange_holidays(exchange, day.year)


def market_exchange_status(market: str, day: dt.date) -> dict:
    """Per-venue open state for a market, plus the region-level summary.

    ``isOpen`` is true when any constituent venue trades, because a briefing for
    Europe still has a market to report when London is shut but Frankfurt is not.
    ``divergent`` marks exactly those days so callers can say so instead of
    implying the whole region behaved alike.
    """
    exchanges = MARKET_EXCHANGES.get(market, ())
    if not exchanges:
        return {"market": market, "isOpen": False, "coverage": "unsupported_market", "venues": {}}

    venues: dict[str, bool | None] = {name: exchange_open_on(name, day) for name in exchanges}
    known = [state for state in venues.values() if state is not None]
    if not known:
        # 표가 만료됐다. 평일을 개장으로 간주하지 않고 공백으로 보고한다.
        return {"market": market, "isOpen": False, "coverage": "coverage_expired", "venues": venues}

    return {
        "market": market,
        "isOpen": any(known),
        "coverage": "confirmed" if len(known) == len(exchanges) else "partial",
        "divergent": len(set(known)) > 1,
        "venues": venues,
        "openVenues": sorted(name for name, state in venues.items() if state),
        "closedVenues": sorted(name for name, state in venues.items() if state is False),
    }
