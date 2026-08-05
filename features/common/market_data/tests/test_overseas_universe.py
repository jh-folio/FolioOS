"""Task 2.3 — Europe and Japan heatmap universes.

The gates are that coverage and provenance stay visible, and that market caps
are never summed across currencies without a stated basis.
"""
from __future__ import annotations

import json

import pytest

from features.common.market_data.europe_core_universe import (
    INDEX_SOURCES,
    collect_constituents,
    convert_caps_to_base,
    load_europe_core_constituents,
    parse_index_constituents,
    provider_symbol,
)
from features.common.market_data.market_universe import (
    build_europe_heatmap_snapshot,
    build_nikkei_heatmap_snapshot,
)
from features.common.market_data.nikkei225_universe import (
    load_nikkei225_constituents,
    parse_nikkei_constituents,
)
from features.common.markets import MARKET_REGISTRY, MarketCode

SESSION = "2026-08-04"


def _table(rows: str) -> str:
    return f'<table class="wikitable">{rows}</table>'


# --- membership parsing -------------------------------------------------


def test_ftse_tickers_gain_the_london_suffix():
    assert provider_symbol("AZN", ".L") == "AZN.L"
    # 클래스 구분 점은 yfinance에서 대시다.
    assert provider_symbol("RR.B", ".L") == "RR-B.L"
    # 이미 접미사를 단 티커는 그대로 둔다.
    assert provider_symbol("SAP.DE", "") == "SAP.DE"


def test_an_index_table_that_moves_its_columns_yields_nothing_rather_than_garbage():
    spec = {**INDEX_SOURCES[0], "table": 0}
    html = _table("<tr><th>Company</th></tr><tr><td>3i</td></tr>")
    assert parse_index_constituents(html, spec) == []


def test_a_company_in_two_indices_is_kept_once():
    """Airbus sits in both the DAX and the CAC 40; drawing it twice double-counts it."""
    pages = {
        INDEX_SOURCES[0]["url"]: _table("<tr><td>AstraZeneca</td><td>AZN</td><td>Health</td></tr>"),
        INDEX_SOURCES[1]["url"]: _table("<tr><td>AIR.PA</td><td></td><td>Airbus</td><td>Aero</td></tr>"),
        INDEX_SOURCES[2]["url"]: _table("<tr><td>Airbus</td><td>Ind</td><td>Aero</td><td>AIR.PA</td></tr>"),
        INDEX_SOURCES[3]["url"]: _table("<tr><td>ASML.AS</td><td>ASML</td><td>Tech</td><td>1</td></tr>"),
    }
    # wikitable 순번을 맞추기 위해 앞의 표들을 채운다.
    def fetch(url: str) -> str:
        spec = next(row for row in INDEX_SOURCES if row["url"] == url)
        return _table("<tr><td>filler</td></tr>") * spec["table"] + pages[url]

    rows, warnings = collect_constituents(fetch)
    symbols = [row["ticker"] for row in rows]
    assert symbols.count("AIR.PA") == 1
    airbus = next(row for row in rows if row["ticker"] == "AIR.PA")
    assert airbus["index"] == "DAX" and airbus["alsoInIndices"] == ["CAC 40"]
    # 표본 표는 정원보다 적으므로 각 지수가 경고를 남겨야 한다.
    assert len(warnings) == len(INDEX_SOURCES)


def test_japanese_alphanumeric_security_codes_are_not_dropped():
    """Japan issues codes like 285A since 2024; a digits-only rule loses them."""
    html = _table(
        "<tr><th>証券コード</th><th>銘柄</th></tr>"
        "<tr><td>7203</td><td>トヨタ自動車</td></tr>"
        "<tr><td>285A</td><td>キオクシアホールディングス</td></tr>"
    )
    rows = parse_nikkei_constituents(html)
    assert [row["providerSymbol"] for row in rows] == ["7203.T", "285A.T"]


def test_tables_without_a_security_code_column_are_ignored():
    html = _table("<tr><th>年</th><th>終値</th></tr><tr><td>2026</td><td>63957</td></tr>")
    assert parse_nikkei_constituents(html) == []


# --- currency basis -----------------------------------------------------


def test_pound_caps_are_restated_before_being_compared_with_euro_caps():
    rows = [
        {"ticker": "AZN.L", "marketCap": 100.0, "capCurrency": "GBP"},
        {"ticker": "SAP.DE", "marketCap": 100.0, "capCurrency": "EUR"},
    ]
    converted, unpriced = convert_caps_to_base(rows, {"GBP": 1.15})
    assert unpriced == []
    assert {row["ticker"]: row["marketCap"] for row in converted} == {"AZN.L": 115.0, "SAP.DE": 100.0}


def test_a_missing_rate_drops_the_company_instead_of_assuming_parity():
    """Treating an unknown rate as 1.0 would silently size a pound as a euro."""
    rows = [{"ticker": "AZN.L", "marketCap": 100.0, "capCurrency": "GBP"}]
    converted, unpriced = convert_caps_to_base(rows, {})
    assert converted == []
    assert unpriced == ["AZN.L (GBP)"]


# --- heatmap snapshots --------------------------------------------------


def _universe() -> list[dict]:
    return [
        {"providerSymbol": "AZN.L", "label": "AstraZeneca", "sector": "Healthcare", "marketCap": 200.0},
        {"providerSymbol": "SAP.DE", "label": "SAP", "sector": "Technology", "marketCap": 180.0},
        {"providerSymbol": "AIR.PA", "label": "Airbus", "sector": "Industrials", "marketCap": 150.0},
    ]


def _prices(symbols, date):
    return {
        symbol: {"close": 100.0, "previousClose": 98.0, "asOf": date, "provider": "yfinance"}
        for symbol in symbols
    }


def test_a_heatmap_keeps_the_exchange_suffix_on_every_symbol():
    """`SAP.DE` must not be rewritten to `SAP-DE` — the suffix is the exchange."""
    seen: list[str] = []

    def fetcher(symbols, date):
        seen.extend(symbols)
        return _prices(symbols, date)

    snapshot = build_europe_heatmap_snapshot(
        SESSION, constituents=_universe(), price_fetcher=fetcher,
    )
    assert seen == ["AZN.L", "SAP.DE", "AIR.PA"]
    assert [row["ticker"] for row in snapshot["rows"]] == ["AZN.L", "SAP.DE", "AIR.PA"]


def test_a_heatmap_says_where_its_membership_came_from():
    """The price provider is not the source of the 199 names — the file is."""
    snapshot = build_europe_heatmap_snapshot(SESSION, constituents=_universe(), price_fetcher=_prices)
    universe = snapshot["universe"]
    assert "wikipedia" in universe["source"].lower()
    assert universe["indices"] == ["FTSE 100", "DAX", "CAC 40", "AEX"]
    assert universe["asOf"]
    assert universe["baseCurrency"] == "EUR"


def test_a_heatmap_states_what_its_box_sizes_mean():
    snapshot = build_europe_heatmap_snapshot(SESSION, constituents=_universe(), price_fetcher=_prices)
    assert snapshot["weightBasis"] == "market_cap_eur"
    assert snapshot["market"] == "EUROPE"
    assert snapshot["coverage"]["status"] == "complete"
    assert snapshot["freshness"] == "close_snapshot"

    japan = build_nikkei_heatmap_snapshot(
        SESSION,
        constituents=[{"providerSymbol": "7203.T", "label": "トヨタ", "sector": "Consumer Cyclical", "marketCap": 1.0}],
        price_fetcher=_prices,
    )
    assert japan["weightBasis"] == "market_cap_jpy"
    assert japan["market"] == "JP"


def test_an_empty_universe_reports_unavailable_rather_than_an_empty_map():
    """A blank heatmap and a flat market look identical to a reader."""
    snapshot = build_europe_heatmap_snapshot(SESSION, constituents=[], price_fetcher=_prices)
    assert snapshot["freshness"] == "unavailable"
    assert snapshot["rows"] == []
    assert snapshot["warnings"]


def test_a_provider_failure_without_a_cache_reports_the_gap():
    def failing(symbols, date):
        raise RuntimeError("network down")

    snapshot = build_europe_heatmap_snapshot(SESSION, constituents=_universe(), price_fetcher=failing)
    assert snapshot["freshness"] == "unavailable"
    assert snapshot["coverage"]["requested"] == 3
    assert snapshot["weightBasis"] == "market_cap_eur"


def test_a_stale_session_falls_back_instead_of_showing_partial_rows(tmp_path):
    good = build_europe_heatmap_snapshot(
        SESSION, cache_dir=tmp_path, constituents=_universe(), price_fetcher=_prices,
    )
    assert good["rows"]

    def wrong_day(symbols, date):
        return {symbol: {"close": 1.0, "previousClose": 1.0, "asOf": "2026-01-01"} for symbol in symbols}

    stale = build_europe_heatmap_snapshot(
        "2026-08-05", cache_dir=tmp_path, constituents=_universe(), price_fetcher=wrong_day,
    )
    assert stale["freshness"] == "stale"
    assert stale["rows"]
    assert any("last-good" in text for text in stale["warnings"])


# --- packaged files -----------------------------------------------------


@pytest.mark.parametrize("loader,minimum,basis", [
    (load_europe_core_constituents, 180, "market_cap_eur"),
    (load_nikkei225_constituents, 200, "market_cap_jpy"),
])
def test_the_packaged_universes_are_present_and_sized(loader, minimum, basis):
    companies = loader()
    assert len(companies) >= minimum
    assert all(row.get("providerSymbol") for row in companies)
    assert all((row.get("marketCap") or 0) > 0 for row in companies)
    assert all(row.get("sector") for row in companies)


def test_the_packaged_files_record_where_they_came_from():
    from features.common.config_bootstrap import resolve_config

    for name in ("europe_core_constituents.json", "nikkei225_constituents.json"):
        payload = json.loads(resolve_config(name).read_text(encoding="utf-8"))
        assert payload["source"]
        assert payload["asOf"]
        assert payload["weightBasis"]
        assert payload["baseCurrency"]


def test_europe_and_japan_now_declare_heatmap_capability():
    for market in (MarketCode.EUROPE, MarketCode.JP):
        assert MARKET_REGISTRY[market].capabilities.heatmap is True
