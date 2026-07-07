import datetime as dt
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features.common.market_data import toss_open_api


def test_toss_symbol_normalization_supports_us_and_kr_stocks_but_skips_indices():
    assert toss_open_api.toss_symbol_for("AAPL") == "AAPL"
    assert toss_open_api.toss_symbol_for("005930.KS") == "005930"
    assert toss_open_api.toss_symbol_for("035720.KQ") == "035720"
    assert toss_open_api.toss_symbol_for("^GSPC") == ""
    assert toss_open_api.toss_symbol_for("CL=F") == ""
    assert toss_open_api.toss_symbol_for("BTC-USD") == ""


def test_fetch_toss_prices_uses_oauth_token_and_normalizes_decimal_fields(monkeypatch):
    monkeypatch.setenv("FOLIO_ENABLE_TOSS_OPEN_API", "1")
    monkeypatch.setenv("TOSS_OPEN_API_CLIENT_ID", "client-id")
    monkeypatch.setenv("TOSS_OPEN_API_CLIENT_SECRET", "client-secret")
    toss_open_api._TOKEN_CACHE.clear()
    calls = []

    def fake_transport(method, url, *, headers=None, data=None, timeout=10):
        calls.append({"method": method, "url": url, "headers": headers or {}, "data": data})
        if url.endswith("/oauth2/token"):
            return {"access_token": "token-1", "token_type": "Bearer", "expires_in": 3600}
        assert headers["Authorization"] == "Bearer token-1"
        return {"result": [
            {"symbol": "AAPL", "timestamp": "2026-06-22T16:00:00-04:00", "lastPrice": "201.50", "currency": "USD"},
            {"symbol": "005930", "timestamp": "2026-06-23T15:30:00+09:00", "lastPrice": "72000", "currency": "KRW"},
        ]}

    rows = toss_open_api.fetch_toss_prices(["AAPL", "005930.KS"], transport=fake_transport)

    assert [row["symbol"] for row in rows] == ["AAPL", "005930"]
    assert rows[0]["lastPrice"] == 201.5
    assert rows[1]["lastPrice"] == 72000.0
    assert calls[0]["method"] == "POST" and calls[1]["method"] == "GET"
    assert "client-secret" not in repr(rows)


def test_download_toss_candle_rows_maps_ohlcv_and_filters_to_date_window(monkeypatch):
    monkeypatch.setenv("FOLIO_ENABLE_TOSS_OPEN_API", "1")
    monkeypatch.setenv("TOSS_OPEN_API_CLIENT_ID", "client-id")
    monkeypatch.setenv("TOSS_OPEN_API_CLIENT_SECRET", "client-secret")
    toss_open_api._TOKEN_CACHE.clear()

    def fake_transport(method, url, *, headers=None, data=None, timeout=10):
        if url.endswith("/oauth2/token"):
            return {"access_token": "token-1", "token_type": "Bearer", "expires_in": 3600}
        return {"result": {"candles": [
            {"timestamp": "2026-06-21T00:00:00+09:00", "openPrice": "98", "highPrice": "101", "lowPrice": "97", "closePrice": "100", "volume": "10", "currency": "USD"},
            {"timestamp": "2026-06-22T00:00:00+09:00", "openPrice": "100", "highPrice": "105", "lowPrice": "99", "closePrice": "104", "volume": "20", "currency": "USD"},
            {"timestamp": "2026-06-24T00:00:00+09:00", "openPrice": "104", "highPrice": "106", "lowPrice": "103", "closePrice": "105", "volume": "30", "currency": "USD"},
        ], "nextBefore": None}}

    rows = toss_open_api.download_toss_candle_rows(
        "AAPL",
        start="2026-06-22",
        end="2026-06-23",
        interval="1d",
        transport=fake_transport,
    )

    assert rows == [{
        "time": "2026-06-22",
        "open": 100.0,
        "high": 105.0,
        "low": 99.0,
        "close": 104.0,
        "volume": 20.0,
        "provider": "toss_open_api",
    }]


def test_toss_credentials_are_disabled_without_release_flag(monkeypatch):
    monkeypatch.setenv("FOLIO_ENABLE_TOSS_OPEN_API", "0")
    monkeypatch.setenv("TOSS_OPEN_API_CLIENT_ID", "client-id")
    monkeypatch.setenv("TOSS_OPEN_API_CLIENT_SECRET", "client-secret")
    toss_open_api._TOKEN_CACHE.clear()

    assert toss_open_api.toss_credentials_available() is False
    assert toss_open_api.download_toss_candle_rows(
        "AAPL",
        start="2026-06-22",
        end="2026-06-23",
        interval="1d",
    ) == []
