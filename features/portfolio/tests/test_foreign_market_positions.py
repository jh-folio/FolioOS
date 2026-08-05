"""Task 7.3 — a Europe or Japan holding must not be valued as if it were American.

`portfolio_symbol` rewrote every dot as a dash, which is right for a US share
class (`BRK.B` -> `BRK-B`) and wrong for an exchange suffix (`7203.T` -> `7203-T`).
The bad symbol found no quote, so the row fell through to the US/USD default and
a Toyota position was priced in dollars with no error shown.
"""
from __future__ import annotations

import pytest

from features.common.instruments.registry import quote_currency, suffix_currency
from features.portfolio.service import (
    fallback_currency,
    infer_portfolio_market,
    portfolio_symbol,
    portfolio_symbol_candidates,
)
from features.watchlist_notes.service import tradingview_symbol_for_query

FOREIGN = [
    ("7203.T", "JP", "JPY", "TSE:7203"),
    ("ASML.AS", "EUROPE", "EUR", "EURONEXT:ASML"),
    ("SAP.DE", "EUROPE", "EUR", "XETR:SAP"),
    ("SHEL.L", "EUROPE", "GBP", "LSE:SHEL"),
    ("ENI.MI", "EUROPE", "EUR", "MIL:ENI"),
    ("SAN.MC", "EUROPE", "EUR", "BME:SAN"),
]


@pytest.mark.parametrize("ticker,market,currency,tradingview", FOREIGN)
def test_an_exchange_suffix_survives_symbol_building(ticker, market, currency, tradingview):
    assert portfolio_symbol(ticker) == ticker
    assert infer_portfolio_market(ticker) == market
    assert fallback_currency(ticker) == currency
    assert tradingview_symbol_for_query(ticker) == tradingview


@pytest.mark.parametrize("ticker,expected", [("BRK.B", "BRK-B"), ("BF.B", "BF-B"), ("AAPL", "AAPL")])
def test_a_us_share_class_still_becomes_a_dash(ticker, expected):
    assert portfolio_symbol(ticker) == expected
    assert infer_portfolio_market(expected) == "US"
    assert fallback_currency(expected) == "USD"


def test_korean_handling_is_unchanged():
    assert portfolio_symbol("005930") == "005930.KS"
    assert portfolio_symbol("005930", "KQ") == "005930.KQ"
    assert infer_portfolio_market("005930.KS") == "KR"
    assert fallback_currency("005930.KS") == "KRW"


@pytest.mark.parametrize("ticker", ["SHEL.L", "7203.T"])
def test_an_ambiguous_suffix_keeps_the_us_reading_as_a_second_try(ticker):
    """".L" and ".T" could also be share classes, so both readings stay available."""
    candidates = portfolio_symbol_candidates(ticker)
    assert candidates[0] == ticker
    assert ticker.replace(".", "-") in candidates


@pytest.mark.parametrize("exchange,market", [
    ("JPX", "JP"), ("Tokyo", "JP"), ("LSE", "EUROPE"), ("AMS", "EUROPE"),
    ("XETRA", "EUROPE"), ("NasdaqGS", "US"), ("KSC", "KR"),
])
def test_a_reported_exchange_names_its_market(exchange, market):
    assert infer_portfolio_market("XYZ", {"exchange": exchange}) == market


class TestLondonPence:
    """Yahoo quotes London in GBp. Reading pence as pounds overstates by 100x."""

    def test_pence_is_reported_as_pounds_at_one_hundredth(self):
        assert quote_currency("GBp") == ("GBP", 0.01)

    def test_pounds_stay_pounds(self):
        assert quote_currency("GBP") == ("GBP", 1.0)

    @pytest.mark.parametrize("code", ["JPY", "EUR", "USD", "KRW"])
    def test_a_major_unit_is_never_rescaled(self, code):
        assert quote_currency(code) == (code, 1.0)

    def test_a_missing_currency_is_left_empty_rather_than_guessed(self):
        assert quote_currency("") == ("", 1.0)


def test_the_suffix_currency_table_matches_the_market_registry():
    for ticker, _market, currency, _tv in FOREIGN:
        suffix = ticker[ticker.rindex("."):]
        assert suffix_currency(ticker) == currency, suffix


class TestBacktestCurrencyConversion:
    """The backtest fetched one KRW=X series and passed every other currency through.

    A yen or euro series therefore entered a USD-based run at its face value —
    about 150x too large for Tokyo — and nothing in the result said so.
    """

    FX = {"KRW": {"d1": 1400.0}, "JPY": {"d1": 150.0}, "EUR": {"d1": 0.90}}

    @pytest.mark.parametrize("currency,price", [("JPY", 150.0), ("EUR", 0.90), ("KRW", 1400.0)])
    def test_a_foreign_price_reaches_dollars(self, currency, price):
        from features.portfolio.service import _convert_price_series

        assert _convert_price_series({"d1": price}, currency, "USD", self.FX) == {"d1": 1.0}

    def test_a_dollar_price_reaches_a_korean_base(self):
        from features.portfolio.service import _convert_price_series

        assert _convert_price_series({"d1": 1.0}, "USD", "KRW", self.FX) == {"d1": 1400.0}

    def test_two_foreign_currencies_route_through_dollars(self):
        from features.portfolio.service import _convert_price_series

        assert _convert_price_series({"d1": 150.0}, "JPY", "KRW", self.FX) == {"d1": 1400.0}

    def test_a_missing_rate_yields_nothing_rather_than_an_unconverted_price(self):
        from features.portfolio.service import _convert_price_series

        assert _convert_price_series({"d1": 150.0}, "JPY", "USD", {}) == {}

    def test_one_currency_needs_no_rate_at_all(self):
        from features.portfolio.service import _convert_price_series

        assert _convert_price_series({"d1": 7.0}, "JPY", "JPY", {}) == {"d1": 7.0}

    @pytest.mark.parametrize("currency,symbol", [("JPY", "JPY=X"), ("EUR", "EUR=X"), ("KRW", "KRW=X"), ("USD", None)])
    def test_every_rate_symbol_follows_the_same_usd_per_unit_form(self, currency, symbol):
        from features.portfolio.service import _fx_symbol_for_currency

        assert _fx_symbol_for_currency(currency) == symbol
