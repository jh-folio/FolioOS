"""Europe heatmap universe, composed from four national index memberships.

There is no broad-Europe constituent set this project can redistribute, so the
universe is the documented country-index composite the plan allows: FTSE 100 +
DAX 40 + CAC 40 + AEX 25, the same four indices the Europe price chart draws.
Membership comes from Wikipedia, exactly as the S&P 500 and KOSPI 200 universes
already do; sector and market cap come from the price provider.

Market caps arrive in the listing currency, and Europe has two. Summing GBP and
EUR as if they were the same unit would inflate every London name by whatever
the rate happens to be, so caps are converted to a single basis and the rate
used is written into the file. Nothing reads a cap without also reading the
`weightBasis` that says what it is denominated in.

Refresh with ``py -3 -m features.common.market_data.europe_core_universe``.
"""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path
import re
from typing import Callable

from features.common.config_bootstrap import resolve_config
from features.common.market_data.overseas_wikipedia import (
    enrich_with_provider_metadata,
    fetch_wikipedia_html,
    table_rows,
    wikitables,
)

CONFIG_NAME = "europe_core_constituents.json"
WEIGHT_BASIS = "market_cap_eur"
BASE_CURRENCY = "EUR"

# 각 지수 위키백과 문서의 구성종목 표. `table`은 wikitable 순번,
# `columns`는 (회사명, 티커) 열 위치, `suffix`는 티커에 붙일 거래소 코드다.
# 티커 열이 이미 접미사를 달고 있으면(`SAP.DE`) suffix는 빈 값이다.
INDEX_SOURCES = (
    {
        "index": "FTSE 100", "country": "GB", "exchange": "LSE",
        "url": "https://en.wikipedia.org/wiki/FTSE_100_Index",
        "table": 3, "label": 0, "ticker": 1, "suffix": ".L", "expect": 100,
    },
    {
        "index": "DAX", "country": "DE", "exchange": "XETRA",
        "url": "https://en.wikipedia.org/wiki/DAX",
        "table": 3, "label": 2, "ticker": 0, "suffix": "", "expect": 40,
    },
    {
        "index": "CAC 40", "country": "FR", "exchange": "EURONEXT_PARIS",
        "url": "https://en.wikipedia.org/wiki/CAC_40",
        "table": 3, "label": 0, "ticker": 3, "suffix": "", "expect": 40,
    },
    {
        "index": "AEX", "country": "NL", "exchange": "EURONEXT_AMSTERDAM",
        "url": "https://en.wikipedia.org/wiki/AEX_index",
        "table": 2, "label": 1, "ticker": 0, "suffix": "", "expect": 25,
    },
)


def provider_symbol(ticker: str, suffix: str) -> str:
    """Wikipedia tickers use dots for share classes; yfinance uses dashes."""
    text = str(ticker or "").strip().upper()
    if not text:
        return ""
    if suffix and "." not in text:
        return f"{text.replace('.', '-')}{suffix}"
    if suffix:
        head, _, tail = text.rpartition(".")
        return f"{head.replace('.', '-')}-{tail}{suffix}" if head else f"{text}{suffix}"
    return text


def parse_index_constituents(html_text: str, spec: dict) -> list[dict]:
    tables = wikitables(html_text)
    if len(tables) <= spec["table"]:
        return []
    rows = []
    for cells in table_rows(tables[spec["table"]]):
        if len(cells) <= max(spec["label"], spec["ticker"]):
            continue
        ticker = cells[spec["ticker"]]
        label = cells[spec["label"]]
        symbol = provider_symbol(ticker, spec["suffix"])
        if not symbol or not label:
            continue
        rows.append({
            "ticker": symbol,
            "providerSymbol": symbol,
            "label": label,
            "index": spec["index"],
            "country": spec["country"],
            "exchange": spec["exchange"],
        })
    return rows


def collect_constituents(html_fetcher: Callable[[str], str] | None = None) -> tuple[list[dict], list[str]]:
    """Membership across the four indices, deduplicated by provider symbol.

    Airbus sits in both the DAX and the CAC 40. Keeping both rows would draw the
    same company twice and double-count its weight, so the first index to claim
    a symbol keeps it and the other index is recorded alongside.
    """
    fetch = html_fetcher or fetch_wikipedia_html
    seen: dict[str, dict] = {}
    warnings: list[str] = []
    for spec in INDEX_SOURCES:
        rows = parse_index_constituents(fetch(spec["url"]), spec)
        if not rows:
            warnings.append(f"{spec['index']}: constituent table returned no rows")
            continue
        if len(rows) != spec["expect"]:
            warnings.append(f"{spec['index']}: expected {spec['expect']} members, parsed {len(rows)}")
        for row in rows:
            existing = seen.get(row["ticker"])
            if existing:
                existing.setdefault("alsoInIndices", []).append(row["index"])
                continue
            seen[row["ticker"]] = row
    return list(seen.values()), warnings


_LEGAL_FORM_RE = re.compile(r"\b(plc|nv|n\.v\.|sa|s\.a\.|se|ag|group)\b", re.IGNORECASE)


def _company_key(row: dict) -> str:
    label = _LEGAL_FORM_RE.sub(" ", str(row.get("label") or ""))
    return re.sub(r"[^a-z0-9]", "", label.lower())


def collapse_dual_listings(rows: list[dict]) -> list[dict]:
    """Fold a company listed on two of the four exchanges into one entry.

    Shell, Unilever and RELX each sit in both the FTSE 100 and the AEX. Left
    alone they occupy two boxes of nearly identical size, doubling the company's
    area in the treemap and its sector's apparent weight. The larger listing
    wins and the other symbol is recorded rather than discarded.
    """
    groups: dict[str, list[dict]] = {}
    for row in rows:
        key = _company_key(row) or str(row.get("ticker") or "")
        groups.setdefault(key, []).append(row)
    collapsed = []
    for members in groups.values():
        ordered = sorted(members, key=lambda row: float(row.get("marketCap") or 0), reverse=True)
        primary = dict(ordered[0])
        if len(ordered) > 1:
            primary["dualListings"] = [str(row.get("ticker")) for row in ordered[1:]]
            primary.setdefault("alsoInIndices", [])
            primary["alsoInIndices"] = sorted({
                *primary["alsoInIndices"],
                *(str(row.get("index")) for row in ordered[1:]),
            })
        collapsed.append(primary)
    return collapsed


def convert_caps_to_base(rows: list[dict], rates: dict[str, float]) -> tuple[list[dict], list[str]]:
    """Restate every cap in the base currency, or drop it if the rate is unknown.

    A missing rate cannot be treated as 1.0: that would silently size a London
    company as though a pound were a euro.
    """
    converted: list[dict] = []
    unpriced: list[str] = []
    for row in rows:
        currency = str(row.get("capCurrency") or "").upper() or BASE_CURRENCY
        rate = 1.0 if currency == BASE_CURRENCY else rates.get(currency)
        if not rate or rate <= 0:
            unpriced.append(f"{row.get('ticker')} ({currency})")
            continue
        converted.append({**row, "marketCap": round(float(row["marketCap"]) * rate, 2)})
    return converted, unpriced


def _yfinance_fx_rates(currencies: list[str]) -> dict[str, float]:  # pragma: no cover - network
    import yfinance as yf

    rates = {}
    for currency in currencies:
        if currency == BASE_CURRENCY:
            continue
        try:
            frame = yf.Ticker(f"{currency}{BASE_CURRENCY}=X").history(period="5d", interval="1d")
            if frame is not None and not frame.empty:
                rates[currency] = float(frame["Close"].iloc[-1])
        except Exception:
            continue
    return rates


def build_europe_core_constituents_file(
    path: Path | str | None = None,
    *,
    html_fetcher: Callable[[str], str] | None = None,
    info_fetcher: Callable[[str], dict] | None = None,
    fx_fetcher: Callable[[list[str]], dict[str, float]] | None = None,
) -> dict:
    members, warnings = collect_constituents(html_fetcher)
    if not members:
        raise ValueError("europe constituent tables returned no rows")
    enriched, missing = enrich_with_provider_metadata(members, info_fetcher=info_fetcher)
    currencies = sorted({str(row.get("capCurrency") or BASE_CURRENCY).upper() for row in enriched})
    rates = (fx_fetcher or _yfinance_fx_rates)([c for c in currencies if c != BASE_CURRENCY])
    companies, unpriced = convert_caps_to_base(enriched, rates)
    companies = collapse_dual_listings(companies)
    payload = {
        "asOf": dt.date.today().isoformat(),
        "source": "wikipedia: FTSE 100 / DAX / CAC 40 / AEX + yfinance sector, cap, FX",
        "market": "EUROPE",
        "indices": [spec["index"] for spec in INDEX_SOURCES],
        "weightBasis": WEIGHT_BASIS,
        "baseCurrency": BASE_CURRENCY,
        "fxRates": {currency: round(rate, 6) for currency, rate in sorted(rates.items())},
        "count": len(companies),
        "missingCap": missing,
        "missingFx": unpriced,
        "warnings": warnings,
        "companies": sorted(companies, key=lambda row: row.get("marketCap") or 0, reverse=True),
    }
    target = Path(path) if path is not None else resolve_config(CONFIG_NAME)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return payload


def universe_metadata(path=None) -> dict:
    """Where the membership came from and when, for the snapshot to carry."""
    target = Path(path) if path is not None else resolve_config(CONFIG_NAME)
    try:
        payload = json.loads(target.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    if not isinstance(payload, dict):
        return {}
    return {
        "source": str(payload.get("source") or ""),
        "asOf": str(payload.get("asOf") or ""),
        "indices": list(payload.get("indices") or []),
        "weightBasis": str(payload.get("weightBasis") or ""),
        "baseCurrency": str(payload.get("baseCurrency") or ""),
        "count": int(payload.get("count") or 0),
    }


def load_europe_core_constituents(path: Path | str | None = None) -> list[dict]:
    target = Path(path) if path is not None else resolve_config(CONFIG_NAME)
    try:
        payload = json.loads(target.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return []
    companies = payload.get("companies") if isinstance(payload, dict) else None
    return companies if isinstance(companies, list) else []


if __name__ == "__main__":  # pragma: no cover - manual refresh entry point
    result = build_europe_core_constituents_file()
    print(f"wrote {result['count']} companies; missing cap {len(result['missingCap'])}, missing fx {len(result['missingFx'])}")
    for warning in result["warnings"]:
        print(f"  warning: {warning}")
