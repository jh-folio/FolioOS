from __future__ import annotations

import datetime as dt
from typing import Any, Callable


INDEX_UNIVERSE = {
    "us": (
        {"ticker": "^GSPC", "label": "S&P 500"},
        {"ticker": "^IXIC", "label": "Nasdaq"},
        {"ticker": "^DJI", "label": "Dow Jones"},
    ),
    "kr": (
        {"ticker": "^KS11", "label": "KOSPI"},
        {"ticker": "^KS200", "label": "KOSPI 200"},
    ),
}


def _safe_float(value: Any) -> float | None:
    try:
        if value is None or value != value:
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def _download_yfinance_rows(symbol: str, *, start: str, end: str, interval: str) -> list[dict]:
    import yfinance as yf

    frame = yf.Ticker(symbol).history(
        start=start,
        end=end,
        interval=interval,
        auto_adjust=False,
        prepost=False,
    )
    if frame is None or frame.empty:
        return []
    rows = []
    for index, row in frame.iterrows():
        close = _safe_float(row.get("Close"))
        if close is None:
            continue
        try:
            time = index.isoformat() if interval == "5m" else index.date().isoformat()
        except Exception:
            time = str(index)
        rows.append({
            "time": time,
            "open": _safe_float(row.get("Open")),
            "high": _safe_float(row.get("High")),
            "low": _safe_float(row.get("Low")),
            "close": close,
            "volume": _safe_float(row.get("Volume")),
            "provider": "yfinance",
        })
    return rows


def _clip_rows(rows: list[dict] | None, target: dt.date, *, intraday: bool) -> list[dict]:
    target_text = target.isoformat()
    filtered = []
    for row in rows or []:
        time = str(row.get("time") or "")
        row_date = time[:10]
        if (intraday and row_date == target_text) or (not intraday and row_date <= target_text):
            filtered.append(dict(row))
    return sorted(filtered, key=lambda row: str(row.get("time") or ""))


def _provider_from_rows(rows: list[dict] | None, default: str = "custom") -> str:
    providers = []
    for row in rows or []:
        provider = str(row.get("provider") or "").strip()
        if provider and provider not in providers:
            providers.append(provider)
    return "+".join(providers) if providers else default


def _combined_provider(*providers: str) -> str:
    parts = []
    for provider in providers:
        for part in str(provider or "").split("+"):
            part = part.strip()
            if part and part not in parts:
                parts.append(part)
    return "+".join(parts) if parts else "custom"


def build_price_history(
    symbol: str,
    session_date: str,
    downloader: Callable[..., list[dict]] | None = None,
) -> dict:
    if downloader is not None:
        fetch = downloader
    else:
        def fetch(symbol: str, *, start: str, end: str, interval: str) -> list[dict]:
            try:
                from features.llm_settings.client import toss_open_api_enabled
                from features.common.market_data.toss_open_api import download_toss_candle_rows, toss_symbol_for
                if toss_open_api_enabled() and toss_symbol_for(symbol):
                    toss_rows = download_toss_candle_rows(symbol, start=start, end=end, interval=interval)
                    if toss_rows:
                        return toss_rows
            except Exception:
                pass
            return _download_yfinance_rows(symbol, start=start, end=end, interval=interval)
    target = dt.date.fromisoformat(str(session_date)[:10])
    intraday_raw = fetch(
        symbol,
        start=target.isoformat(),
        end=(target + dt.timedelta(days=1)).isoformat(),
        interval="5m",
    )
    daily_raw = fetch(
        symbol,
        start=(target - dt.timedelta(days=370)).isoformat(),
        end=(target + dt.timedelta(days=1)).isoformat(),
        interval="1d",
    )
    intraday = _clip_rows(intraday_raw, target, intraday=True)
    daily = _clip_rows(daily_raw, target, intraday=False)
    intraday_provider = _provider_from_rows(intraday_raw)
    daily_provider = _provider_from_rows(daily_raw)
    return {
        "provider": _combined_provider(intraday_provider, daily_provider),
        "sourceByInterval": {"intraday": intraday_provider, "daily": daily_provider},
        "intraday": {"interval": "5m", "points": intraday},
        "daily": {"interval": "1d", "points": daily},
    }
