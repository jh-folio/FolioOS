"""Largest listed companies per market, for calendar coverage that does not
depend on what the user happened to add to a watchlist.

"주요 실적"은 사용자가 관심 등록을 했는지와 무관해야 한다. NVDA 실적을 워치리스트에
넣지 않았다는 이유로 놓치면 캘린더가 제 역할을 못한다.

순위는 **시장 안에서** 매긴다. 시장을 가로질러 한 줄로 세우면 결과가 거의 전부 미국
종목이 되고, 한국 투자자 화면의 `주요 실적`에 한국 기업이 하나도 없게 된다. 시장별
순위라 환율 환산도 필요 없다 — 각 목록은 자기 통화 안에서만 비교된다.
"""
from __future__ import annotations

from functools import lru_cache

from features.common.config_bootstrap import resolve_config
from features.common.markets import MarketCode
from features.common.utils import read_json

# 시장별 상위 개수. 미국은 종목 수도 많고 실적이 다른 시장을 함께 움직이므로 더 넓게 본다.
MAJOR_COMPANY_LIMITS: dict[MarketCode, int] = {
    MarketCode.US: 20,
    MarketCode.KR: 10,
    MarketCode.EUROPE: 10,
    MarketCode.JP: 10,
}

_UNIVERSE_FILES: dict[MarketCode, str] = {
    MarketCode.US: "sp500_constituents.json",
    MarketCode.KR: "kospi200_constituents.json",
    MarketCode.EUROPE: "europe_core_constituents.json",
    MarketCode.JP: "nikkei225_constituents.json",
}


def _rows(market: MarketCode) -> list[dict]:
    name = _UNIVERSE_FILES.get(market)
    if not name:
        return []
    try:
        payload = read_json(resolve_config(name), {})
    except Exception:
        return []
    rows = payload.get("companies") if isinstance(payload, dict) else None
    return [row for row in rows or [] if isinstance(row, dict)]


def _provider_symbol(row: dict, market: MarketCode) -> str:
    """The symbol a price/earnings provider will accept.

    Korea stores bare six-digit codes, so the exchange suffix has to be added
    back or yfinance resolves nothing.
    """
    symbol = str(row.get("providerSymbol") or "").strip().upper()
    if symbol:
        return symbol
    ticker = str(row.get("ticker") or "").strip().upper()
    if not ticker:
        return ""
    if market is MarketCode.KR and ticker.isdigit():
        return f"{ticker}.KS"
    return ticker


@lru_cache(maxsize=8)
def major_companies(market: MarketCode, limit: int | None = None) -> tuple[dict, ...]:
    """Top companies of one market by that market's own market cap.

    Rows without a cap cannot be ranked, so they are left out rather than
    sorted to the bottom — a missing cap is unknown size, not zero.
    """
    count = MAJOR_COMPANY_LIMITS.get(market, 10) if limit is None else max(0, int(limit))
    ranked = sorted(
        (row for row in _rows(market) if isinstance(row.get("marketCap"), (int, float)) and row["marketCap"] > 0),
        key=lambda row: -float(row["marketCap"]),
    )
    out = []
    for row in ranked[:count]:
        symbol = _provider_symbol(row, market)
        if not symbol:
            continue
        out.append({
            "symbol": symbol,
            "ticker": str(row.get("ticker") or "").strip().upper(),
            "label": str(row.get("label") or "").strip(),
            "market": market.value,
        })
    return tuple(out)


def major_company_symbols(markets=None) -> list[str]:
    """Provider symbols for the largest companies across the requested markets."""
    codes = list(markets) if markets is not None else list(MAJOR_COMPANY_LIMITS)
    seen: dict[str, None] = {}
    for market in codes:
        for row in major_companies(market):
            seen.setdefault(row["symbol"], None)
    return list(seen)
