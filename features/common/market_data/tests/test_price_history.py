import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[4]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features.common.market_data.price_history import INDEX_UNIVERSE, build_price_history


def test_build_price_history_separates_intraday_and_daily_and_clips_session():
    calls = []

    def downloader(symbol, *, start, end, interval):
        calls.append((symbol, start, end, interval))
        if interval == "5m":
            return [
                {"time": "2026-06-19T15:55:00-04:00", "open": 100, "high": 102, "low": 99, "close": 101, "volume": 10},
                {"time": "2026-06-22T09:30:00-04:00", "open": 103, "high": 104, "low": 102, "close": 103, "volume": 12},
            ]
        return [
            {"time": "2025-06-20", "open": 80, "high": 82, "low": 79, "close": 81, "volume": 20},
            {"time": "2026-06-19", "open": 100, "high": 102, "low": 99, "close": 101, "volume": 30},
            {"time": "2026-06-22", "open": 102, "high": 104, "low": 101, "close": 103, "volume": 40},
        ]

    result = build_price_history("^GSPC", "2026-06-19", downloader=downloader)

    assert result["intraday"]["interval"] == "5m"
    assert [row["time"] for row in result["intraday"]["points"]] == ["2026-06-19T15:55:00-04:00"]
    assert result["daily"]["interval"] == "1d"
    assert result["daily"]["points"][-1]["time"] == "2026-06-19"
    assert [call[-1] for call in calls] == ["5m", "1d"]


def test_build_price_history_reports_actual_provider_from_rows():
    def downloader(symbol, *, start, end, interval):
        return [{
            "time": "2026-06-19T15:55:00-04:00" if interval == "5m" else "2026-06-19",
            "open": 100,
            "high": 102,
            "low": 99,
            "close": 101,
            "volume": 10,
            "provider": "toss_open_api",
        }]

    result = build_price_history("AAPL", "2026-06-19", downloader=downloader)

    assert result["provider"] == "toss_open_api"
    assert result["sourceByInterval"] == {"intraday": "toss_open_api", "daily": "toss_open_api"}


def test_build_price_history_skips_toss_without_release_flag(monkeypatch):
    monkeypatch.setenv("FOLIO_ENABLE_TOSS_OPEN_API", "0")
    monkeypatch.setenv("TOSS_OPEN_API_CLIENT_ID", "client-id")
    monkeypatch.setenv("TOSS_OPEN_API_CLIENT_SECRET", "client-secret")
    toss_calls = []

    def fake_toss_rows(symbol, *, start, end, interval):
        toss_calls.append((symbol, interval))
        return [{
            "time": "2026-06-19T15:55:00-04:00" if interval == "5m" else "2026-06-19",
            "open": 100,
            "high": 102,
            "low": 99,
            "close": 101,
            "volume": 10,
            "provider": "toss_open_api",
        }]

    def fake_yfinance_rows(symbol, *, start, end, interval):
        return [{
            "time": "2026-06-19T15:55:00-04:00" if interval == "5m" else "2026-06-19",
            "open": 100,
            "high": 102,
            "low": 99,
            "close": 101,
            "volume": 10,
            "provider": "yfinance",
        }]

    monkeypatch.setattr("features.common.market_data.toss_open_api.download_toss_candle_rows", fake_toss_rows)
    monkeypatch.setattr("features.common.market_data.price_history._download_yfinance_rows", fake_yfinance_rows)

    result = build_price_history("AAPL", "2026-06-19")

    assert toss_calls == []
    assert result["provider"] == "yfinance"


def test_index_universe_uses_exact_requested_indices():
    assert [row["ticker"] for row in INDEX_UNIVERSE["us"]] == ["^GSPC", "^IXIC", "^DJI"]
    assert [row["label"] for row in INDEX_UNIVERSE["us"]] == ["S&P 500", "Nasdaq", "Dow Jones"]
    assert [row["ticker"] for row in INDEX_UNIVERSE["kr"]] == ["^KS11", "^KS200"]
