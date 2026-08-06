"""주요 실적은 관심 등록 여부와 무관해야 한다.

캘린더의 실적 일정 대상이 포트폴리오+워치리스트뿐이라, 워치리스트에 넣지 않은
기업의 실적은 존재 자체가 보이지 않았다. NVDA 실적을 놓치는 캘린더는 제 역할을
못한다. 순위는 시장 안에서 매긴다 — 시장을 가로질러 한 줄로 세우면 결과가 거의
전부 미국 종목이 되고 한국 투자자 화면에 한국 기업이 하나도 없게 된다.
"""
from __future__ import annotations

import pytest

from features.common.market_data.major_companies import (
    MAJOR_COMPANY_LIMITS,
    major_companies,
    major_company_symbols,
)
from features.common.markets import PRODUCT_MARKETS, MarketCode


@pytest.mark.parametrize("market", list(PRODUCT_MARKETS))
def test_every_product_market_yields_major_companies(market):
    rows = major_companies(market)
    assert rows, f"{market.value} 구성종목에서 상위 기업을 뽑지 못했다"
    assert len(rows) == MAJOR_COMPANY_LIMITS[market]


@pytest.mark.parametrize("market", list(PRODUCT_MARKETS))
def test_rows_are_ordered_by_that_markets_own_cap(market):
    rows = major_companies(market)
    assert all(row["market"] == market.value for row in rows)
    assert all(row["symbol"] for row in rows), "provider 심볼 없는 행은 조회에 쓸 수 없다"


def test_a_korean_code_gets_its_exchange_suffix_back():
    """한국은 6자리 코드로 저장돼 있어 접미사를 붙이지 않으면 provider가 못 찾는다."""
    rows = major_companies(MarketCode.KR)
    assert any(row["symbol"].endswith(".KS") for row in rows)
    assert not any(row["symbol"].isdigit() for row in rows)


def test_the_home_market_is_never_crowded_out():
    """시장별로 뽑으므로 한 시장이 다른 시장을 밀어내지 않는다."""
    symbols = major_company_symbols()
    per_market = {market: major_companies(market) for market in PRODUCT_MARKETS}
    assert len(symbols) == sum(len(rows) for rows in per_market.values())
    for market, rows in per_market.items():
        assert rows, f"{market.value}가 비었다"


def test_us_gets_the_widest_view():
    assert MAJOR_COMPANY_LIMITS[MarketCode.US] > MAJOR_COMPANY_LIMITS[MarketCode.KR]


def test_calendar_targets_include_majors_without_any_watchlist():
    from features.market_calendar.service import _calendar_target_tickers
    from pathlib import Path
    from tempfile import TemporaryDirectory

    with TemporaryDirectory() as tmp:
        tickers = set(_calendar_target_tickers(Path(tmp)))
    assert set(major_company_symbols()) <= tickers, "빈 워치리스트에서도 주요 기업은 대상이어야 한다"
