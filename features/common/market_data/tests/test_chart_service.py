from __future__ import annotations

import pytest

from features.common.data_reliability.fetch_runtime import ProviderFetchRuntime
from features.common.market_data import chart_service


def test_chart_request_enum_and_intraday_guard():
    assert chart_service.normalize_chart_request("nvda", "3m", "1d") == ("NVDA", "3m", "1d")
    with pytest.raises(ValueError, match="chart_symbol_invalid"):
        chart_service.normalize_chart_request("<bad>", "3m", "1d")
    with pytest.raises(ValueError, match="chart_intraday_range_invalid"):
        chart_service.normalize_chart_request("NVDA", "1y", "5m")


def test_chart_uses_semantic_cache_and_explicit_delay(tmp_path, monkeypatch):
    calls = []
    monkeypatch.setattr(
        chart_service,
        "_download",
        lambda symbol, range_key, interval: calls.append((symbol, range_key, interval)) or {
            "symbol": symbol,
            "range": range_key,
            "interval": interval,
            "series": [{"time": "2026-08-01", "close": 100}],
            "asOf": "2026-08-01",
            "provider": "fixture",
        },
    )
    runtime = ProviderFetchRuntime(tmp_path / "cache")
    first = chart_service.get_chart(tmp_path, symbol="NVDA", runtime=runtime)
    second = chart_service.get_chart(tmp_path, symbol="NVDA", runtime=runtime)
    assert first["delayed"] is True
    assert second["freshness"] == "cached"
    assert calls == [("NVDA", "3m", "1d")]
