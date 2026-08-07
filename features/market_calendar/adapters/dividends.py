from __future__ import annotations

import datetime as dt

from features.market_calendar.adapters._company_name import company_name
from features.market_calendar.adapters._ticker_market import market_for_ticker
from features.market_calendar.adapters.earnings import MAX_TICKERS
from features.market_calendar.schema import normalize_event


def estimated_dividend_events(tickers: list[str]) -> tuple[list[dict], set[str]]:
    """(일정, provider가 답을 준 티커 집합). 두 번째 값의 이유는 `earnings.py` 참조."""
    try:
        import yfinance as yf
    except Exception:
        return [], set()
    events: list[dict] = []
    queried: set[str] = set()
    now = dt.datetime.now(dt.timezone.utc)
    for ticker in tickers[:MAX_TICKERS]:
        try:
            info = yf.Ticker(ticker).get_info()
        except Exception:
            continue
        queried.add(str(ticker).strip().upper())
        try:
            timestamp = info.get("exDividendDate")
            if not timestamp:
                continue
            starts = dt.datetime.fromtimestamp(float(timestamp), tz=dt.timezone.utc).isoformat()
            if starts < (now - dt.timedelta(days=2)).isoformat():
                continue
            market, _timezone = market_for_ticker(ticker)
            # 배당락도 실적과 같은 표에 서므로 이름을 함께 싣는다. 여기만 빠져
            # 있어 배당 줄만 티커로 남았다(`AAPL 배당락 예정`).
            events.append(normalize_event({
                "kind": "dividend", "title": f"{ticker} 배당락 예정", "tickers": [ticker],
                "startsAt": starts, "timezone": "UTC", "allDay": True, "status": "estimated",
                "source": "yfinance", "provider": "yfinance", "market": market,
                "companyName": company_name(ticker, lambda _s: info.get("longName") or info.get("shortName") or ""),
            }))
        except Exception:
            continue
    return events, queried
