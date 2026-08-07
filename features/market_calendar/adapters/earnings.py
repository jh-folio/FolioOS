from __future__ import annotations

from features.market_calendar.adapters._company_name import company_name
from features.market_calendar.adapters._ticker_market import market_for_ticker
from features.market_calendar.schema import normalize_event

# provider 호출이 티커당 한 번이라 상한을 둔다. 상한 밖 티커는 "일정이 없다"가
# 아니라 "안 물어봤다"이며, 그 구분이 정리(prune)의 안전장치다.
MAX_TICKERS = 30


def estimated_earnings_events(tickers: list[str]) -> tuple[list[dict], set[str]]:
    """(일정, provider가 답을 준 티커 집합).

    두 번째 값이 있어야 정리가 안전하다. 티커별 예외를 삼키고 상한에서 자르므로,
    결과에 없는 티커는 "일정이 없다"가 아니라 "안 물어봤거나 실패했다"일 수 있다.
    그 둘을 구분하지 않으면 정리가 멀쩡한 행을 지운다 — 실측으로 대상 53개 중
    앞 30개만 조회되어 `GEV`의 유효한 실적 행이 삭제 대상에 올라 있었다.
    """
    try:
        import yfinance as yf
    except Exception:
        return [], set()
    events: list[dict] = []
    queried: set[str] = set()
    for ticker in tickers[:MAX_TICKERS]:
        try:
            calendar = yf.Ticker(ticker).calendar
        except Exception:
            continue
        # 여기까지 왔으면 provider가 이 티커에 답을 했다. `일정이 없다`도 답이라
        # 옛 행을 지워도 된다. 예외로 빠진 티커만 손대지 않는다.
        queried.add(str(ticker).strip().upper())
        try:
            dates = calendar.get("Earnings Date") if isinstance(calendar, dict) else None
            value = dates[0] if isinstance(dates, (list, tuple)) and dates else dates
            starts = value.isoformat() if hasattr(value, "isoformat") else str(value or "")
            if not starts:
                continue
            market, timezone = market_for_ticker(ticker)
            events.append(normalize_event({
                "kind": "earnings", "title": f"{ticker} 실적 발표 예정", "tickers": [ticker],
                "startsAt": starts, "timezone": timezone, "status": "estimated",
                "source": "yfinance", "provider": "yfinance", "market": market,
                "companyName": company_name(ticker), "importance": 2,
            }))
        except Exception:
            continue
    return events, queried
