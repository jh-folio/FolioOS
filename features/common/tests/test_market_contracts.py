from __future__ import annotations

import json
from datetime import date

import pytest

from features.common.instruments.registry import (
    InstrumentRegistryError,
    build_instrument_identity,
    infer_market,
)
from features.common.market_calendar import market_open_status
from features.common.markets import (
    EVIDENCE_MARKETS,
    MARKET_REGISTRY,
    MarketCode,
    MarketContractError,
    legacy_scope_compatibility,
    market_keys_for_scope,
    normalize_market_code,
    normalize_requested_market_scope,
    normalize_saved_market_scope,
)


def test_market_registry_is_closed_ordered_and_complete() -> None:
    assert tuple(code.value for code in EVIDENCE_MARKETS) == (
        "US", "KR", "EUROPE", "JP", "GLOBAL", "UNKNOWN",
    )
    for code in EVIDENCE_MARKETS:
        definition = MARKET_REGISTRY[code]
        assert definition.code is code
        assert definition.label_ko and definition.label_en and definition.timezone
    assert MARKET_REGISTRY[MarketCode.EUROPE].countries == ("GB", "DE", "FR", "NL", "IT", "ES")


@pytest.mark.parametrize(("raw", "expected"), [
    ("usa", MarketCode.US), ("한국", MarketCode.KR), ("EU", MarketCode.EUROPE),
    ("United Kingdom", MarketCode.EUROPE), ("日本", MarketCode.JP), ("world", MarketCode.GLOBAL),
])
def test_market_aliases_normalize_to_canonical_values(raw: str, expected: MarketCode) -> None:
    assert normalize_market_code(raw) is expected


def test_invalid_market_fails_closed_or_strict() -> None:
    assert normalize_market_code("MARS") is MarketCode.UNKNOWN
    with pytest.raises(MarketContractError, match="invalid_market"):
        normalize_market_code("MARS", strict=True)

    status = market_open_status(date(2026, 8, 4), "MARS", lambda *_args: None)
    assert status == {
        "date": "2026-08-04", "market": "UNKNOWN", "isOpen": False,
        "provider": "unsupported_market", "source": "unavailable",
    }


def test_requested_and_saved_scope_keep_legacy_both_meanings_separate() -> None:
    assert normalize_requested_market_scope("both").value == "all"
    assert normalize_saved_market_scope("both").value == "both"
    assert normalize_saved_market_scope("EU").value == "europe"
    assert tuple(code.value for code in market_keys_for_scope("all")) == ("US", "KR", "EUROPE", "JP")
    assert tuple(code.value for code in market_keys_for_scope("both", saved=True)) == ("US", "KR")
    assert legacy_scope_compatibility("both") == {
        "savedScope": "both", "requestedScope": "all", "marketKeys": ("US", "KR"),
        "legacyUsKrAggregate": True,
    }


def test_legacy_both_contract_does_not_mutate_canonical_or_overlay_bytes() -> None:
    report = {
        "marketScope": "both",
        "markdown": "# 종합 브리핑\n\n미국장과 한국장",
        "personalOverlay": {"markdown": "# 내 메모\n\n가설", "stale": False},
    }
    before = json.dumps(report, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    compatibility = legacy_scope_compatibility(report["marketScope"])
    after = json.dumps(report, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    assert compatibility["legacyUsKrAggregate"] is True
    assert after == before
    assert report["markdown"] == "# 종합 브리핑\n\n미국장과 한국장"
    assert report["personalOverlay"] == {"markdown": "# 내 메모\n\n가설", "stale": False}


@pytest.mark.parametrize(("ticker", "exchange", "expected"), [
    ("005930.KS", "", MarketCode.KR), ("7203.T", "", MarketCode.JP),
    ("SHEL.L", "", MarketCode.EUROPE), ("AIR.PA", "", MarketCode.EUROPE),
    ("NVDA", "NASDAQ", MarketCode.US), ("SAP", "XETRA", MarketCode.EUROPE),
    ("NVDA", "", MarketCode.UNKNOWN),
])
def test_instrument_market_inference_is_suffix_or_exchange_driven(
    ticker: str, exchange: str, expected: MarketCode,
) -> None:
    assert infer_market(ticker, exchange) is expected


def test_instrument_identity_preserves_official_identifiers() -> None:
    identity = build_instrument_identity(
        ticker="7203", name="Toyota Motor Corporation", exchange="TSE",
        country="jp", currency="jpy", isin="JP3633400001", lei="353800279ADEFGKNTV65",
        edinet_code="e02144", aliases=["トヨタ自動車", "Toyota"],
    )
    assert identity.instrumentId == "JP:EDINET:E02144"
    assert identity.market is MarketCode.JP
    assert identity.country == "JP" and identity.currency == "JPY"
    assert identity.isin == "JP3633400001" and identity.edinetCode == "E02144"
    assert identity.providerSymbol == "7203.T"


def test_instrument_identity_rejects_market_conflicts() -> None:
    with pytest.raises(InstrumentRegistryError, match="instrument_market_conflict"):
        build_instrument_identity(ticker="7203.T", exchange="TSE", market="EU")

    with pytest.raises(InstrumentRegistryError, match="instrument_exchange_unknown"):
        build_instrument_identity(ticker="NVDA", exchange="MARS", market="US")


def test_instrument_identity_rejects_country_and_currency_conflicts() -> None:
    with pytest.raises(ValueError, match="instrument_country_market_conflict"):
        build_instrument_identity(ticker="7203", exchange="TSE", country="GB")
    with pytest.raises(ValueError, match="instrument_currency_market_conflict"):
        build_instrument_identity(ticker="7203", exchange="TSE", country="JP", currency="EUR")
