"""Market Tape Lite.

Normalizes scattered market snapshots into a small freshness/status structure
for quality checks and investment review dashboards. This module does not add
new providers; it wraps existing snapshot/provider outputs.
"""
from __future__ import annotations

import datetime as dt
from zoneinfo import ZoneInfo

from features.common.research_schema.enums import normalize_market_tape_status
from features.common.data_reliability.provider_status import provider_status_from_market_tape

try:
    KST = ZoneInfo("Asia/Seoul")
except Exception:
    KST = dt.timezone(dt.timedelta(hours=9))


def _today() -> dt.date:
    return dt.datetime.now(tz=KST).date()


def _parse_date(value) -> dt.date | None:
    try:
        return dt.date.fromisoformat(str(value or "")[:10])
    except Exception:
        return None


def _status_for_date(as_of: str, *, target_date: str = "", estimated: bool = False, missing: bool = False) -> str:
    if missing:
        return "missing"
    if estimated:
        return "estimated"
    d = _parse_date(as_of)
    if not d:
        return "missing"
    anchor = _parse_date(target_date) or _today()
    age = max(0, (anchor - d).days)
    if age <= 2:
        return "fresh"
    if age <= 7:
        return "stale"
    return "stale"


def _safe_float(value):
    try:
        if value is None or value != value:
            return None
        return float(value)
    except Exception:
        return None


def _item(
    *,
    symbol: str,
    label: str,
    item_type: str,
    value=None,
    change_pct=None,
    source: str = "",
    as_of: str = "",
    status: str = "",
) -> dict:
    return {
        "symbol": symbol,
        "label": label,
        "type": item_type,
        "value": _safe_float(value),
        "changePct": _safe_float(change_pct),
        "source": source,
        "asOf": str(as_of or "")[:10],
        "status": normalize_market_tape_status(status or _status_for_date(as_of)),
    }


def build_market_tape(
    *,
    date: str = "",
    market_snapshot: dict | None = None,
    korea_market_data: dict | None = None,
    market_windows: dict | None = None,
    topic_market_data: dict | None = None,
) -> dict:
    date = str(date or _today().isoformat())[:10]
    market_windows = market_windows or {}
    items: list[dict] = []
    warnings: list[str] = []

    snapshot = market_snapshot or {}
    if snapshot.get("ok"):
        for symbol, data in (snapshot.get("tickers") or {}).items():
            if data.get("error"):
                warnings.append(f"{symbol}: {data.get('error')}")
                items.append(_item(
                    symbol=symbol,
                    label=data.get("label") or symbol,
                    item_type="market_data",
                    source="yfinance",
                    status="missing",
                ))
                continue
            as_of = data.get("asOfDate") or snapshot.get("latestUsEquityDate") or ""
            items.append(_item(
                symbol=symbol,
                label=data.get("label") or symbol,
                item_type="market_data",
                value=data.get("last"),
                change_pct=data.get("oneDayPct"),
                source="yfinance",
                as_of=as_of,
                status=_status_for_date(as_of, target_date=market_windows.get("usRegularSessionDate") or date),
            ))
    elif snapshot:
        warnings.append(f"market snapshot unavailable: {snapshot.get('error', 'unknown')}")

    kr = korea_market_data or {}
    if kr.get("ok"):
        provider = kr.get("provider") or "korea_market_provider"
        for symbol, data in (kr.get("indices") or {}).items():
            items.append(_item(
                symbol=symbol,
                label=data.get("label") or symbol,
                item_type="index",
                value=data.get("close"),
                change_pct=data.get("changePct"),
                source=provider,
                as_of=data.get("asOfDate") or kr.get("date") or "",
                status=_status_for_date(data.get("asOfDate") or kr.get("date"), target_date=market_windows.get("krCurrentSessionDate") or date),
            ))
        fx = (kr.get("fx") or {}).get("USDKRW") if isinstance(kr.get("fx"), dict) else None
        if fx:
            items.append(_item(
                symbol="USDKRW",
                label=fx.get("label") or "USD/KRW",
                item_type="fx",
                value=fx.get("close"),
                change_pct=fx.get("changePct"),
                source=fx.get("source") or "yfinance USDKRW=X",
                as_of=fx.get("asOfDate") or "",
                status=_status_for_date(fx.get("asOfDate"), target_date=date),
            ))
    elif kr:
        warnings.extend(str(w) for w in (kr.get("warnings") or [])[:5])

    topic = topic_market_data or {}
    if topic.get("ok"):
        for symbol, data in (topic.get("tickers") or {}).items():
            if data.get("error"):
                warnings.append(f"{symbol}: {data.get('error')}")
                continue
            items.append(_item(
                symbol=symbol,
                label=data.get("label") or symbol,
                item_type="topic_market_data",
                value=data.get("last"),
                change_pct=(data.get("changes") or {}).get("1d"),
                source="yfinance",
                as_of=str(topic.get("asOf") or "")[:10],
                status=_status_for_date(str(topic.get("asOf") or "")[:10], target_date=date, estimated=True),
            ))
    elif topic:
        warnings.append(f"topic market data unavailable: {topic.get('error', 'unknown')}")

    if not items:
        warnings.append("No market tape items available.")

    tape = {
        "asOf": dt.datetime.now(tz=KST).isoformat(),
        "session": {
            "us": market_windows.get("usRegularSessionDate") or "",
            "kr": market_windows.get("krCurrentSessionDate") or market_windows.get("krPreviousSessionDate") or "",
        },
        "items": items,
        "warnings": warnings,
    }
    tape["providerStatus"] = provider_status_from_market_tape(tape)
    return tape
