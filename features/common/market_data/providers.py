from __future__ import annotations

"""Market data provider interfaces and Korea market implementations.

The provider boundary keeps briefing logic independent from the concrete data
source.  yfinance supplies Korean index levels and USD/KRW.

**pykrx was removed (2026-08-12).**  From 1.2.x its index endpoints require KRX
account credentials (``KRX_ID`` / ``KRX_PW``), so every call failed and the chain
silently fell back to yfinance — twelve of twelve cached payloads on this machine.
Asking users for another set of credentials to restore it is not worth it, and the
heatmap universe already made the same call for the same reason (see
``kospi200_universe``).  The practical effect is honest rather than lossy: investor
flows, sector index moves, and trading value were empty in every briefing already.
"""

import datetime as dt
from abc import ABC, abstractmethod
from typing import Any


class MarketDataProvider(ABC):
    name = "base"

    @abstractmethod
    def fetch_korea_market(self, date: str) -> dict:
        """Return Korea market data for YYYY-MM-DD."""


def _ymd(date: str) -> str:
    return str(date or "")[:10].replace("-", "")


def _iso_date(value: Any) -> str:
    try:
        if hasattr(value, "date"):
            return value.date().isoformat()
    except Exception:
        pass
    return str(value)[:10]


def _safe_float(value: Any) -> float | None:
    try:
        if value is None:
            return None
        if value != value:
            return None
        return float(value)
    except Exception:
        return None


def _pick(row: Any, names: list[str]) -> float | None:
    for name in names:
        try:
            value = row.get(name)
        except Exception:
            value = None
        parsed = _safe_float(value)
        if parsed is not None:
            return parsed
    return None


def _index_payload(label: str, row: Any, as_of: str) -> dict:
    return {
        "label": label,
        "asOfDate": as_of,
        "close": _pick(row, ["종가", "Close", "close"]),
        "changePct": _pick(row, ["등락률", "변동률", "Change", "changePct"]),
        "tradingValue": _pick(row, ["거래대금", "Value", "tradingValue"]),
    }


def _empty_payload(date: str, provider: str, error: str = "") -> dict:
    return {
        "ok": False,
        "date": str(date or "")[:10],
        "provider": provider,
        "indices": {},
        "investorFlows": {},
        "sectors": [],
        "fx": {},
        "warnings": [error] if error else [],
    }


class YFinanceKoreaMarketProvider(MarketDataProvider):
    name = "yfinance"

    TICKERS = {
        "KOSPI": "^KS11",
        "KOSDAQ": "^KQ11",
        "KOSPI200": "^KS200",
    }

    def fetch_korea_market(self, date: str) -> dict:
        try:
            import yfinance as yf
        except Exception:
            return _empty_payload(date, self.name, "yfinance_unavailable")

        payload = _empty_payload(date, self.name)
        indices = {}
        target = dt.date.fromisoformat(str(date)[:10])
        start = (target - dt.timedelta(days=14)).isoformat()
        end = (target + dt.timedelta(days=1)).isoformat()

        for label, ticker in self.TICKERS.items():
            try:
                hist = yf.Ticker(ticker).history(start=start, end=end, interval="1d", auto_adjust=False)
            except Exception:
                payload["warnings"].append(f"{label}: market_data_unavailable")
                continue
            if hist is None or hist.empty or "Close" not in hist:
                continue
            rows = []
            for idx, close in zip(hist.index, hist["Close"].tolist()):
                as_of = _iso_date(idx)
                if as_of <= str(date)[:10]:
                    rows.append((as_of, _safe_float(close)))
            rows = [(d, c) for d, c in rows if c is not None]
            if not rows:
                continue
            as_of, close = rows[-1]
            prev = rows[-2][1] if len(rows) >= 2 else None
            change_pct = (close / prev - 1.0) * 100.0 if prev else None
            indices[label] = {
                "label": label,
                "ticker": ticker,
                "asOfDate": as_of,
                "close": close,
                "changePct": change_pct,
                "tradingValue": None,
            }
        payload["indices"] = indices
        payload["ok"] = bool(indices)
        if not payload["ok"] and not payload["warnings"]:
            payload["warnings"].append("no yfinance Korea index data returned")
        return payload


class TossOpenApiKoreaMarketProvider(MarketDataProvider):
    """Toss Open API readiness check for Korea aggregate market data.

    Toss exposes stock/ETF prices and calendars for KR/US.  It does not expose
    a documented KOSPI/KOSDAQ index aggregate in the current OpenAPI contract,
    so this provider contributes readiness/warnings only.  Stock/ETF price
    snapshots use the Toss client from the price-history and heatmap modules.
    """

    name = "toss_open_api"

    def fetch_korea_market(self, date: str) -> dict:
        from features.common.market_data.toss_open_api import toss_credentials_available

        if not toss_credentials_available():
            return _empty_payload(date, self.name, "Toss Open API disabled or key not configured")
        return _empty_payload(
            date,
            self.name,
            "Toss Open API configured; Korean aggregate index endpoint is not documented, falling back to yfinance",
        )


def _fetch_usdkrw(date: str) -> dict:
    try:
        from features.llm_settings.client import toss_open_api_enabled
        from features.common.market_data.toss_open_api import fetch_usdkrw_exchange_rate
        if toss_open_api_enabled():
            toss_rate = fetch_usdkrw_exchange_rate()
            if toss_rate:
                return toss_rate
    except Exception:
        pass
    try:
        import yfinance as yf
    except Exception:
        return {"error": "yfinance_unavailable"}
    try:
        target = dt.date.fromisoformat(str(date)[:10])
        hist = yf.Ticker("USDKRW=X").history(
            start=(target - dt.timedelta(days=14)).isoformat(),
            end=(target + dt.timedelta(days=1)).isoformat(),
            interval="1d",
            auto_adjust=False,
        )
    except Exception:
        return {"error": "market_data_unavailable"}
    if hist is None or hist.empty or "Close" not in hist:
        return {"error": "no USD/KRW data returned"}
    rows = []
    for idx, close in zip(hist.index, hist["Close"].tolist()):
        as_of = _iso_date(idx)
        if as_of <= str(date)[:10]:
            rows.append((as_of, _safe_float(close)))
    rows = [(d, c) for d, c in rows if c is not None]
    if not rows:
        return {"error": "no USD/KRW close data"}
    as_of, close = rows[-1]
    prev = rows[-2][1] if len(rows) >= 2 else None
    return {
        "USDKRW": {
            "label": "원·달러 환율",
            "asOfDate": as_of,
            "close": close,
            "changePct": (close / prev - 1.0) * 100.0 if prev else None,
            "source": "yfinance USDKRW=X",
        }
    }


def fetch_korea_market_data(date: str) -> dict:
    warnings: list[str] = []
    tried: list[str] = []
    providers: list[MarketDataProvider] = [YFinanceKoreaMarketProvider()]
    try:
        from features.llm_settings.client import toss_open_api_enabled
        if toss_open_api_enabled():
            providers.insert(0, TossOpenApiKoreaMarketProvider())
    except Exception:
        pass
    for provider in providers:
        tried.append(provider.name)
        data = provider.fetch_korea_market(date)
        warnings.extend(data.get("warnings") or [])
        if data.get("ok"):
            data["providersTried"] = tried
            data["warnings"] = warnings
            data["fx"] = _fetch_usdkrw(date)
            return data
    return {
        "ok": False,
        "date": str(date or "")[:10],
        "provider": "",
        "providersTried": tried,
        "indices": {},
        "investorFlows": {},
        "sectors": [],
        "fx": _fetch_usdkrw(date),
        "warnings": warnings or ["no Korea market provider returned data"],
    }
