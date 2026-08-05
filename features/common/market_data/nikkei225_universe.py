"""Nikkei 225 universe for the Japan heatmap.

The English Wikipedia article carries no constituent table; the Japanese one
lists all 225 names, grouped under sector headings, as 証券コード / 銘柄 pairs.
Membership comes from there and sector/market cap from the price provider, the
same split the S&P 500 and KOSPI 200 universes use.

Japan needs no FX basis — every member is JPY — but the file records the basis
anyway so a consumer never has to assume which currency the caps are in.

Refresh with ``py -3 -m features.common.market_data.nikkei225_universe``.
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
)

CONFIG_NAME = "nikkei225_constituents.json"
WEIGHT_BASIS = "market_cap_jpy"
BASE_CURRENCY = "JPY"
WIKIPEDIA_URL = "https://ja.wikipedia.org/wiki/%E6%97%A5%E7%B5%8C%E5%B9%B3%E5%9D%87%E6%A0%AA%E4%BE%A1"
EXPECTED_MEMBERS = 225

# 일본 증권코드는 2024년부터 영숫자를 쓴다(키오시아 285A). 숫자 4자리만 받으면
# 신규 상장 종목이 조용히 빠진다.
_CODE_RE = re.compile(r"^[0-9][0-9A-Z]{3}$")


def parse_nikkei_constituents(html_text: str) -> list[dict]:
    """Every 証券コード table on the page, in document order.

    The page also carries weighting and index-history tables; keying off the
    security-code header is what separates constituents from those.
    """
    rows: list[dict] = []
    seen: set[str] = set()
    for table_html in re.findall(r"<table[^>]*wikitable.*?</table>", html_text or "", re.S):
        if "証券コード" not in table_html:
            continue
        for cells in table_rows(table_html):
            if len(cells) < 2:
                continue
            code, label = cells[0].strip(), cells[1].strip()
            if not _CODE_RE.fullmatch(code) or not label or code in seen:
                continue
            seen.add(code)
            rows.append({
                "ticker": code,
                "providerSymbol": f"{code}.T",
                "label": label,
                "index": "Nikkei 225",
                "country": "JP",
                "exchange": "JPX",
            })
    return rows


def build_nikkei225_constituents_file(
    path: Path | str | None = None,
    *,
    html_fetcher: Callable[[], str] | None = None,
    info_fetcher: Callable[[str], dict] | None = None,
) -> dict:
    html_text = (html_fetcher or (lambda: fetch_wikipedia_html(WIKIPEDIA_URL)))()
    members = parse_nikkei_constituents(html_text)
    if not members:
        raise ValueError("nikkei constituent tables returned no rows")
    warnings = []
    if len(members) != EXPECTED_MEMBERS:
        warnings.append(f"expected {EXPECTED_MEMBERS} members, parsed {len(members)}")
    companies, missing = enrich_with_provider_metadata(members, info_fetcher=info_fetcher)
    payload = {
        "asOf": dt.date.today().isoformat(),
        "source": "wikipedia(ja): 日経平均株価 constituents + yfinance sector and cap",
        "market": "JP",
        "indices": ["Nikkei 225"],
        "weightBasis": WEIGHT_BASIS,
        "baseCurrency": BASE_CURRENCY,
        "count": len(companies),
        "missingCap": missing,
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


def load_nikkei225_constituents(path: Path | str | None = None) -> list[dict]:
    target = Path(path) if path is not None else resolve_config(CONFIG_NAME)
    try:
        payload = json.loads(target.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return []
    companies = payload.get("companies") if isinstance(payload, dict) else None
    return companies if isinstance(companies, list) else []


if __name__ == "__main__":  # pragma: no cover - manual refresh entry point
    result = build_nikkei225_constituents_file()
    print(f"wrote {result['count']} companies, missing caps: {len(result['missingCap'])}")
    for warning in result["warnings"]:
        print(f"  warning: {warning}")
