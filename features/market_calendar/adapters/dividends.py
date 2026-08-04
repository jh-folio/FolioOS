from __future__ import annotations

import datetime as dt

from features.market_calendar.adapters._ticker_market import market_for_ticker
from features.market_calendar.schema import normalize_event


def estimated_dividend_events(tickers: list[str]) -> list[dict]:
    try:
        import yfinance as yf
    except Exception:
        return []
    events = []
    now = dt.datetime.now(dt.timezone.utc)
    for ticker in tickers[:30]:
        try:
            info = yf.Ticker(ticker).get_info()
            timestamp = info.get("exDividendDate")
            if not timestamp:
                continue
            starts = dt.datetime.fromtimestamp(float(timestamp), tz=dt.timezone.utc).isoformat()
            if starts < (now - dt.timedelta(days=2)).isoformat():
                continue
            market, _timezone = market_for_ticker(ticker)
            events.append(normalize_event({"kind": "dividend", "title": f"{ticker} 배당락 예정", "tickers": [ticker], "startsAt": starts, "timezone": "UTC", "allDay": True, "status": "estimated", "source": "yfinance", "provider": "yfinance", "market": market}))
        except Exception:
            continue
    return events
