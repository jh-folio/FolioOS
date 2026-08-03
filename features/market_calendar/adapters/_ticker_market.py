"""Infer the listing market for an estimated-calendar ticker.

yfinance suffixes carry the exchange, so a KRX symbol must not be stored with US
metadata: `GET /api/market-calendar?market=KR` filters on the stored column and
would otherwise miss the event while the US segment shows it wrongly.
"""
from __future__ import annotations

KR_SUFFIXES = (".KS", ".KQ")


def market_for_ticker(ticker: str) -> tuple[str, str]:
    """Return (market, timezone) for a yfinance symbol."""
    symbol = str(ticker or "").strip().upper()
    if symbol.endswith(KR_SUFFIXES):
        return "KR", "Asia/Seoul"
    return "US", "America/New_York"
