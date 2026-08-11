"""이 세션 브리핑이 읽어야 할 기사 날짜를 세션에서 파생한다.

지금은 자료 창이 **발행일 하나**에 걸려 있다. `briefing_market_windows()`가 앵커 날짜로
`sourceDates`를 만들고, 그 안에 미국·한국 세션이 union으로 섞인다. 그래서 시장별
브리핑이 서로의 자료 창을 공유하고, 앵커를 세션일로 옮기는 순간 그 union이 깨진다.

**창은 세션과 세션 사이다.** 직전 세션이 끝난 뒤부터 이 세션이 끝날 때까지 나온 기사가
이 세션의 이야기다. 이 정의는 주말·휴장을 따로 다룰 필요가 없다 — 금요일 마감과 월요일
마감 사이에는 토·일이 들어 있으므로, 주말 뉴스가 자동으로 월요일 세션 브리핑에 들어간다.
예전에는 `analysis_mode`가 `weekend`/`kr_holiday`인지 보고 off-session 구간을 따로
계산했는데, 그 분기가 앵커를 옮기면 성립하지 않는다.

**날짜는 KST 달력 기준이다.** 기사 날짜가 KST이기 때문이다. 그래서 시장마다 "그 세션이
KST로 며칠에 끝나는가"가 다르다.

    한국·일본   세션 S는 S일 15:30 KST에 끝난다        -> 마감 KST 날짜 = S
    미국·유럽   세션 S는 S+1일 새벽 KST에 끝난다        -> 마감 KST 날짜 = S+1

이 값은 `publication_date_for_session()`과 다르다. 그쪽은 **다음 거래일**이라 금요일
미국장이 월요일이 되지만, 여기서는 마감이 실제로 걸치는 달력 날짜라 토요일이다.
"""
from __future__ import annotations

import datetime as dt

from features.common.market_calendar import previous_trading_day

# 한국시간 자정 이후에 마감하는 시장. 그 세션의 기사는 다음 달력 날짜까지 걸친다.
OVERNIGHT_MARKETS = {"us", "europe"}

_MARKET_CODES = {"us": "US", "kr": "KR", "europe": "EUROPE", "jp": "JP"}


def kst_close_date(market: str, session_date: str) -> dt.date:
    """그 세션이 KST 달력으로 며칠에 끝나는가."""
    day = dt.date.fromisoformat(str(session_date)[:10])
    return day + dt.timedelta(days=1) if market in OVERNIGHT_MARKETS else day


def scope_session_state(scope: str, market_windows) -> str:
    """그 시장 세션이 진행 중인가. 창에서 읽는다.

    미국·유럽은 `phase`가 없다 — 한국시간 자정 이후에 마감하므로 브리핑 시점에는 언제나
    직전 완료 세션이다.
    """
    windows = market_windows or {}
    if scope == "kr":
        phase = windows.get("krSessionPhase")
    else:
        phase = ((windows.get("marketSessions") or {}).get(scope) or {}).get("phase")
    return "intraday" if phase == "intraday" else "closed"


def scope_session_documents(documents, scope, market_windows, *, today: str = "", session_date: str = ""):
    """그 시장 세션의 창에 드는 기사만 고른다.

    예전에는 한 번 고른 문서 풀을 모든 시장이 공유했다. 창이 발행일 하나에서 나왔기
    때문인데, 그 union에는 미국·한국 세션이 섞여 있어 시장별 브리핑이 서로의 자료를 봤다.

    **창이 비면 호출부가 기존 풀로 되돌아간다.** 여기서 빈 목록을 돌려주면 예전에는
    만들어지던 브리핑이 자료 없이 나온다 — 자료 창을 좁히는 변경이 브리핑을 지우는
    결과로 이어지면 안 된다.
    """
    session = str(session_date or "")[:10]
    if not session:
        return []
    dates = set(target_source_dates(scope, session, scope_session_state(scope, market_windows), today=today))
    return [row for row in (documents or []) if str(row.get("date") or "") in dates]


def target_source_dates(
    market: str,
    session_date: str,
    state: str,
    *,
    today: str = "",
    calendar_fetcher=None,
) -> list[str]:
    """이 세션 브리핑의 기사 날짜 목록(KST, 오름차순).

    마감 세션이면 직전 세션 마감일부터 이 세션 마감일까지. 장중이면 아직 끝나지 않았으므로
    오늘까지 연다 — 장중 브리핑은 지금까지 나온 이야기를 다룬다.
    """
    session_day = dt.date.fromisoformat(str(session_date)[:10])
    previous = previous_trading_day(session_day, _MARKET_CODES[market], calendar_fetcher)
    start = kst_close_date(market, previous.isoformat())
    end = kst_close_date(market, session_date)
    if state == "intraday" and today:
        # 아직 마감하지 않았다. 이 세션의 이야기는 지금까지 나온 것이 전부다.
        end = max(dt.date.fromisoformat(today[:10]), session_day)
    if end < start:
        return [start.isoformat()]
    return [
        (start + dt.timedelta(days=offset)).isoformat()
        for offset in range((end - start).days + 1)
    ]
