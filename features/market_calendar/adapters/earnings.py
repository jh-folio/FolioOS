from __future__ import annotations

import datetime as dt

from features.market_calendar.adapters._ticker_market import market_for_ticker
from features.market_calendar.schema import normalize_event


def estimated_earnings_events(tickers: list[str]) -> list[dict]:
    try:
        import yfinance as yf
    except Exception:
        return []
    events = []
    for ticker in tickers[:30]:
        try:
            calendar = yf.Ticker(ticker).calendar
            dates = calendar.get("Earnings Date") if isinstance(calendar, dict) else None
            value = dates[0] if isinstance(dates, (list, tuple)) and dates else dates
            if hasattr(value, "isoformat"):
                starts = value.isoformat()
            else:
                starts = str(value or "")
            if not starts:
                continue
            market, timezone = market_for_ticker(ticker)
            events.append(normalize_event({"kind": "earnings", "title": f"{ticker} 실적 발표 예정", "tickers": [ticker], "startsAt": starts, "timezone": timezone, "status": "estimated", "source": "yfinance", "provider": "yfinance", "market": market, "importance": 2}))
        except Exception:
            continue
    return events
