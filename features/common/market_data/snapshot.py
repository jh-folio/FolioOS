#!/usr/bin/env python3
from __future__ import annotations

import datetime as dt
from zoneinfo import ZoneInfo


try:
    KST = ZoneInfo("Asia/Seoul")
except Exception:
    KST = dt.timezone(dt.timedelta(hours=9))

MARKET_TICKERS = {
    "SPY": "S&P 500 ETF",
    "QQQ": "Nasdaq 100 ETF",
    "IWM": "Russell 2000 ETF",
    "RSP": "S&P 500 Equal Weight",
    "^VIX": "VIX",
    "^TNX": "US 10Y Yield",
    "TLT": "Long Treasury ETF",
    "HYG": "High Yield Credit",
    "LQD": "Investment Grade Credit",
    "DX-Y.NYB": "DXY",
    "CL=F": "WTI Crude",
    "GC=F": "Gold",
    "BTC-USD": "Bitcoin",
}


def pct_change(first: float | None, last: float | None) -> float | None:
    if first is None or last is None or first == 0:
        return None
    return (last / first - 1.0) * 100.0


def safe_float(value) -> float | None:
    try:
        if value != value:
            return None
        return float(value)
    except Exception:
        return None


def fetch_market_snapshot(period: str = "1mo") -> dict:
    try:
        import yfinance as yf
    except Exception as exc:
        return {
            "ok": False,
            "error": f"yfinance unavailable: {exc}",
            "asOfKst": dt.datetime.now(tz=KST).isoformat(),
            "tickers": {},
            "signals": [],
        }

    tickers = {}
    for ticker, label in MARKET_TICKERS.items():
        try:
            hist = yf.Ticker(ticker).history(period=period, interval="1d", auto_adjust=False)
        except Exception as exc:
            tickers[ticker] = {"label": label, "error": str(exc)}
            continue
        if hist is None or hist.empty or "Close" not in hist:
            tickers[ticker] = {"label": label, "error": "no price data"}
            continue
        # 종가와 해당 일봉 날짜를 함께 보관한 뒤 NaN을 버린다. 이렇게 해야
        # last(최근값)가 실제로 며칠 종가인지(asOfDate)를 알 수 있다. yfinance가
        # 당일 EOD 일봉을 아직 안 주면 그 날짜는 NaN으로 빠지고, last는 그 전
        # 거래일 종가가 된다 — 이 경우 asOfDate로 그 사실이 드러난다.
        def _bar_date(idx_value):
            try:
                return idx_value.date().isoformat()
            except Exception:
                return str(idx_value)[:10]
        pairs = [
            (_bar_date(idx), safe_float(x))
            for idx, x in zip(hist.index, hist["Close"].tolist())
        ]
        pairs = [(d, x) for d, x in pairs if x is not None]
        if not pairs:
            tickers[ticker] = {"label": label, "error": "no close data"}
            continue
        closes = [x for _, x in pairs]
        last = closes[-1]
        last_date = pairs[-1][0]
        prev = closes[-2] if len(closes) >= 2 else None
        five = closes[-6] if len(closes) >= 6 else closes[0]
        twenty = closes[0]
        tickers[ticker] = {
            "label": label,
            "last": last,
            "asOfDate": last_date,
            "oneDayPct": pct_change(prev, last),
            "fiveDayPct": pct_change(five, last),
            "periodPct": pct_change(twenty, last),
        }

    def val(ticker: str, key: str) -> float | None:
        value = tickers.get(ticker, {}).get(key)
        return value if isinstance(value, (int, float)) else None

    spy_1d = val("SPY", "oneDayPct")
    qqq_1d = val("QQQ", "oneDayPct")
    vix_1d = val("^VIX", "oneDayPct")
    hyg_5d = val("HYG", "fiveDayPct")
    lqd_5d = val("LQD", "fiveDayPct")
    tlt_5d = val("TLT", "fiveDayPct")
    oil_5d = val("CL=F", "fiveDayPct")
    signals = []
    if spy_1d is not None and vix_1d is not None:
        if spy_1d >= 0 and vix_1d <= 0:
            signals.append("주식 상승과 변동성 하락이 동시에 나타난 리스크온 신호")
        if spy_1d < 0 and vix_1d > 0:
            signals.append("주식 하락과 변동성 상승이 동시에 나타난 리스크오프 신호")
    if hyg_5d is not None and lqd_5d is not None and (hyg_5d - lqd_5d) < 0:
        signals.append("하이일드가 IG 대비 약해 크레딧 내부는 방어적으로 움직임")
    if tlt_5d is not None and tlt_5d > 1:
        signals.append("장기채 강세가 동반되어 금리/성장 기대 변화 확인 필요")
    if oil_5d is not None and abs(oil_5d) >= 4:
        signals.append("유가 변동성이 커져 에너지·인플레이션 경로 점검 필요")
    if qqq_1d is not None and spy_1d is not None and qqq_1d > spy_1d:
        signals.append("나스닥/성장주가 S&P 500 대비 우위")

    # 미국 정규장 데이터가 며칠 종가까지 반영됐는지 — 24시간 거래되는 선물/암호화폐가
    # 아니라 미국 주식 ETF/지수 기준으로 판단한다(스냅샷 stale 여부 판정용).
    us_equity_dates = [
        tickers.get(t, {}).get("asOfDate")
        for t in ("SPY", "QQQ", "IWM", "RSP", "^TNX")
    ]
    us_equity_dates = [d for d in us_equity_dates if d]
    latest_us_equity_date = max(us_equity_dates) if us_equity_dates else None

    return {
        "ok": True,
        "asOfKst": dt.datetime.now(tz=KST).isoformat(),
        "dataNote": "yfinance daily data; delayed/end-of-day data may be mixed.",
        "latestUsEquityDate": latest_us_equity_date,
        "tickers": tickers,
        "signals": signals,
    }


def snapshot_to_markdown(snapshot: dict) -> str:
    if not snapshot.get("ok"):
        return f"시장 스냅샷을 불러오지 못했습니다: {snapshot.get('error', 'unknown error')}"
    rows = [
        "| 지표 | 기준일 | 최근값 | 1D | 5D | 기간 |",
        "| --- | --- | ---: | ---: | ---: | ---: |",
    ]
    for ticker, data in snapshot.get("tickers", {}).items():
        if data.get("error"):
            continue
        def fmt(value):
            if value is None:
                return "-"
            return f"{value:.2f}"
        def pct(value):
            if value is None:
                return "-"
            return f"{value:+.2f}%"
        rows.append(
            f"| {ticker} {data.get('label', '')} | {data.get('asOfDate', '-')} | {fmt(data.get('last'))} | {pct(data.get('oneDayPct'))} | {pct(data.get('fiveDayPct'))} | {pct(data.get('periodPct'))} |"
        )
    signals = "\n".join(f"- {item}" for item in snapshot.get("signals", [])) or "- 뚜렷한 규칙 기반 신호 없음"
    latest_us = snapshot.get("latestUsEquityDate")
    return "\n".join([
        f"as of KST: {snapshot.get('asOfKst', '')}",
        f"data note: {snapshot.get('dataNote', '')}",
        (f"미국 주가 데이터 기준일: {latest_us} 종가까지 반영" if latest_us else ""),
        "",
        *rows,
        "",
        "규칙 기반 신호:",
        signals,
    ])

