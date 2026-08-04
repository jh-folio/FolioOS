"""Native chart series service with semantic cache and explicit freshness."""
from __future__ import annotations

import datetime as dt
import re
from pathlib import Path

from features.common.data_reliability.fetch_runtime import FetchPolicy, ProviderFetchRuntime

RANGES = {"5d": 7, "1m": 35, "3m": 100, "6m": 190, "1y": 370, "5y": 1830}
INTERVALS = {"5m", "1d", "1wk"}


def normalize_chart_request(symbol: str, range_key: str, interval: str) -> tuple[str, str, str]:
    symbol = str(symbol or "").strip().upper()
    if not re.fullmatch(r"(?:\^|[0-9A-Z])[0-9A-Z.^=-]{0,23}", symbol):
        raise ValueError("chart_symbol_invalid")
    range_key = str(range_key or "3m").lower()
    interval = str(interval or "1d").lower()
    if range_key not in RANGES or interval not in INTERVALS:
        raise ValueError("chart_range_or_interval_invalid")
    if interval == "5m" and range_key != "5d":
        raise ValueError("chart_intraday_range_invalid")
    return symbol, range_key, interval


def _download(symbol: str, range_key: str, interval: str) -> dict:
    import yfinance as yf

    end = dt.datetime.now(dt.timezone.utc)
    start = end - dt.timedelta(days=RANGES[range_key])
    frame = yf.Ticker(symbol).history(start=start.date().isoformat(), end=(end + dt.timedelta(days=1)).date().isoformat(), interval=interval, auto_adjust=False, prepost=False)
    rows = []
    if frame is not None and not frame.empty:
        for index, row in frame.tail(2000).iterrows():
            try:
                close = float(row.get("Close"))
            except (TypeError, ValueError):
                continue
            if close != close:
                continue
            time_value = index.isoformat() if interval == "5m" else index.date().isoformat()
            def number(key):
                try:
                    value = float(row.get(key))
                    return None if value != value else value
                except (TypeError, ValueError):
                    return None
            rows.append({"time": time_value, "open": number("Open"), "high": number("High"), "low": number("Low"), "close": close, "volume": number("Volume")})
    return {"symbol": symbol, "range": range_key, "interval": interval, "series": rows, "asOf": rows[-1]["time"] if rows else "", "provider": "yfinance"}


def get_chart(data_dir: Path, *, symbol: str, range_key: str = "3m", interval: str = "1d", runtime: ProviderFetchRuntime | None = None) -> dict:
    symbol, range_key, interval = normalize_chart_request(symbol, range_key, interval)
    runtime = runtime or ProviderFetchRuntime(Path(data_dir) / "provider-cache" / "charts", max_workers=3)
    ttl = 60 if interval == "5m" else 900
    result = runtime.fetch(
        "yfinance", "chart_series", {"symbol": symbol, "range": range_key, "interval": interval},
        lambda: _download(symbol, range_key, interval),
        policy=FetchPolicy(ttl_seconds=ttl, timeout_seconds=20, stale_while_revalidate_seconds=86400),
        background_refresh=True,
    )
    value = result.get("value") if isinstance(result.get("value"), dict) else {"symbol": symbol, "range": range_key, "interval": interval, "series": [], "asOf": "", "provider": "yfinance"}
    return {
        **value, "freshness": result.get("status"), "fetchedAt": result.get("fetchedAt") or "",
        "fallbackReason": result.get("fallbackReason") or "", "delayed": True,
        "notice": "yfinance 일봉/분봉은 실시간 체결가가 아닙니다.",
    }
