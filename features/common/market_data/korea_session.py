"""한국장 세션 수치를 받는 유일한 경로.

예전에는 같은 파일을 두 구현이 서로 다른 규칙으로 다뤘다. 규칙 경로(`builder`)에는
60분 TTL이 있었고, Agent 경로(`agent_mode`)는 `ttl_seconds`를 인자로 받아 **한 번도
쓰지 않았다** — 그래서 한 번 저장된 값이 영원히 재사용됐다. 사고 당시 저장된 것이
개장 한 시간 전에 받은 금요일 종가였고, 그것이 08-10 수치로 굳었다.

정책은 `session_cache`가 갖는다. 여기서는 그 정책에 세션을 맞춰 넘기기만 한다.

**수치가 없으면 `None`이다.** 직전 세션 값으로 메우지 않는다. 그 자리는 브리핑이
"확인되지 않는다"고 적는 자리이며(§한국장 규칙), 게이트로 발행을 막지 않는다는
결정과도 맞는다 — 없는 것을 없다고 쓰고 발행은 한다.
"""
from __future__ import annotations

from features.common.market_data import session_cache
from features.common.market_data.providers import fetch_korea_market_data

DATASET = "korea-market"
MARKET = "kr"


def session_state(market_windows) -> str:
    """창에서 그 세션이 진행 중인지 읽는다.

    장중 값과 마감 종가는 다른 값이므로 캐시 키가 갈려야 한다. 상태를 빼면 장중에
    받은 값이 그 세션의 확정 수치로 굳는다.
    """
    phase = str((market_windows or {}).get("krSessionPhase") or "")
    return session_cache.INTRADAY if phase == "intraday" else session_cache.CLOSED


def korea_market_data(session_date: str, state: str = session_cache.CLOSED):
    """대상 세션의 한국장 수치. 없으면 `(None, 사유)`."""
    return session_cache.session_market_data(
        DATASET, MARKET, str(session_date or "")[:10], state, fetch_korea_market_data,
    )
