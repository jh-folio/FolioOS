import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[4]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features.common.market_data.sp500_universe import (
    join_market_caps,
    load_sp500_constituents,
    parse_wikipedia_constituents,
    provider_symbol,
)


SAMPLE_HTML = """
<table id="constituents">
<tbody>
<tr><th>Symbol</th><th>Security</th><th>GICS Sector</th><th>GICS Sub-Industry</th><th>HQ</th></tr>
<tr>
  <td><a href="/x">MMM</a></td><td><a>3M</a></td>
  <td>Industrials</td><td>Industrial Conglomerates</td><td>St. Paul</td>
</tr>
<tr>
  <td><a href="/y">BRK.B</a></td><td><a>Berkshire Hathaway</a></td>
  <td>Financials</td><td>Multi-Sector Holdings</td><td>Omaha</td>
</tr>
<tr>
  <td>AMP&amp;T</td><td>Amp &amp; T</td><td>Utilities</td><td>Electric Utilities</td><td>NY</td>
</tr>
</tbody>
</table>
"""


def test_parse_extracts_ticker_name_gics_sector_and_sub_industry():
    rows = parse_wikipedia_constituents(SAMPLE_HTML)
    assert len(rows) == 3
    assert rows[0] == {
        "ticker": "MMM",
        "providerSymbol": "MMM",
        "label": "3M",
        "sector": "Industrials",
        "industry": "Industrial Conglomerates",
    }
    # dotted tickers keep their display form but expose a yfinance provider symbol
    assert rows[1]["ticker"] == "BRK.B"
    assert rows[1]["providerSymbol"] == "BRK-B"
    # html entities are unescaped
    assert rows[2]["ticker"] == "AMP&T"
    assert rows[2]["label"] == "Amp & T"


def test_provider_symbol_normalizes_separators():
    assert provider_symbol("BRK.B") == "BRK-B"
    assert provider_symbol("BF/B") == "BF-B"
    assert provider_symbol("aapl") == "AAPL"


def test_join_market_caps_matches_on_separator_insensitive_key():
    constituents = [
        {"ticker": "AAPL", "providerSymbol": "AAPL", "label": "Apple", "sector": "Information Technology", "industry": "Tech HW"},
        {"ticker": "BRK.B", "providerSymbol": "BRK-B", "label": "Berkshire", "sector": "Financials", "industry": "Holdings"},
        {"ticker": "ZZZZ", "providerSymbol": "ZZZZ", "label": "Missing", "sector": "Energy", "industry": "Oil"},
    ]
    caps = {"AAPL": "4362291605560.00", "BRK/B": "1078202303894.00"}
    joined, missing = join_market_caps(constituents, caps)
    by_ticker = {row["ticker"]: row for row in joined}
    assert by_ticker["AAPL"]["marketCap"] == 4362291605560.0
    assert by_ticker["BRK.B"]["marketCap"] == 1078202303894.0
    # rows without a cap match are reported and excluded
    assert "ZZZZ" not in by_ticker
    assert missing == ["ZZZZ"]


def test_load_sp500_constituents_reads_companies(tmp_path):
    path = tmp_path / "sp500.json"
    path.write_text(
        '{"asOf":"2026-06-23","companies":[{"ticker":"AAPL","marketCap":1.0}]}',
        encoding="utf-8",
    )
    rows = load_sp500_constituents(path)
    assert rows == [{"ticker": "AAPL", "marketCap": 1.0}]
