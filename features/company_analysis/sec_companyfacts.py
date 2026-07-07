#!/usr/bin/env python3
from __future__ import annotations

import datetime as dt
import gzip
import json
import os
import re
import urllib.request
from pathlib import Path

SEC_TICKERS_URL = "https://www.sec.gov/files/company_tickers.json"
SEC_FACTS_URL = "https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json"

METRIC_CANDIDATES = {
    "Revenue": ["Revenues", "RevenueFromContractWithCustomerExcludingAssessedTax", "SalesRevenueNet"],
    "Gross Profit": ["GrossProfit"],
    "Operating Income": ["OperatingIncomeLoss"],
    "Net Income": ["NetIncomeLoss", "ProfitLoss"],
    "EPS Diluted": ["EarningsPerShareDiluted"],
    "Operating Cash Flow": ["NetCashProvidedByUsedInOperatingActivities", "NetCashProvidedByUsedInOperatingActivitiesContinuingOperations", "CashProvidedByUsedInOperatingActivities", "NetCashProvidedByUsedInOperatingActivitiesNetOfAcquisitionsAndDispositions"],
    "Capital Expenditure": ["PaymentsToAcquirePropertyPlantAndEquipment", "PaymentsToAcquireProductiveAssets", "PaymentsToAcquirePropertyPlantAndEquipmentAndIntangibleAssets", "PaymentsToAcquirePropertyPlantAndEquipmentIntangibleAssetsAndOtherAssets", "CapitalExpenditures", "CapitalExpenditure", "PaymentsForCapitalImprovements"],
    "Cash & Equivalents": ["CashAndCashEquivalentsAtCarryingValue", "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents"],
    "Total Assets": ["Assets"],
    "Total Liabilities": ["Liabilities"],
    "Long-Term Debt": ["LongTermDebtAndFinanceLeaseObligations", "LongTermDebt"],
    "Current Assets": ["AssetsCurrent"],
    "Current Liabilities": ["LiabilitiesCurrent"],
    "Inventory": ["InventoryNet"],
    "Accounts Receivable": ["AccountsReceivableNetCurrent", "AccountsReceivableNet"],
    "Accounts Payable": ["AccountsPayableCurrent", "AccountsPayable"],
    "Shares Diluted": ["WeightedAverageNumberOfDilutedSharesOutstanding", "WeightedAverageNumberOfShareDiluted"],
    "EBITDA": ["EarningsBeforeInterestTaxesDepreciationAndAmortization", "EarningsBeforeInterestTaxesDepreciationAmortization"],
    "Depreciation & Amortization": ["DepreciationDepletionAndAmortization", "DepreciationDepletionAndAmortizationExpense", "DepreciationAndAmortization"],
    "Pretax Income": ["IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest", "IncomeLossFromContinuingOperationsBeforeIncomeTaxes"],
    "Income Tax": ["IncomeTaxExpenseBenefit"],
    "Interest Expense": ["InterestExpenseNonOperating", "InterestExpense"],
    "Share Repurchases": ["PaymentsForRepurchaseOfCommonStock", "PaymentsForRepurchaseOfEquity"],
    "Dividends Paid": ["PaymentsOfDividends", "PaymentsOfDividendsCommonStock"],
}

POINT_IN_TIME_METRICS = {"Cash & Equivalents", "Total Assets", "Total Liabilities", "Long-Term Debt", "Current Assets", "Current Liabilities", "Inventory", "Accounts Receivable", "Accounts Payable"}
PER_SHARE_METRICS = {"EPS Diluted"}
SHARE_COUNT_METRICS = {"Shares Diluted"}


def normalize_ticker(ticker: str) -> str:
    return str(ticker or "").strip().upper().replace(".", "-")


def normalize_cik(cik: str | int) -> str:
    digits = re.sub(r"\D", "", str(cik or ""))
    return digits.zfill(10) if digits else ""


def sec_user_agent() -> str:
    return os.environ.get("SEC_USER_AGENT", "MarketResearchArchive/0.1 contact@example.com").strip()


def _read_json(path: Path, default=None):
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def _write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def fetch_json(url: str, cache_path: Path, ttl_hours: int = 24):
    cached = _read_json(cache_path, None)
    if cached and cached.get("fetchedAt") and cached.get("data") is not None:
        try:
            fetched = dt.datetime.fromisoformat(cached["fetchedAt"])
            if dt.datetime.now(dt.timezone.utc) - fetched < dt.timedelta(hours=ttl_hours):
                return cached.get("data"), cached.get("error", "")
        except Exception:
            pass
    req = urllib.request.Request(url, headers={"User-Agent": sec_user_agent(), "Accept-Encoding": "gzip, deflate"})
    try:
        with urllib.request.urlopen(req, timeout=int(os.environ.get("SEC_TIMEOUT_SECONDS", "30"))) as resp:
            raw = resp.read()
            if resp.headers.get("Content-Encoding", "").lower() == "gzip" or raw[:2] == b"\x1f\x8b":
                raw = gzip.decompress(raw)
            data = json.loads(raw.decode("utf-8"))
        _write_json(cache_path, {"fetchedAt": dt.datetime.now(dt.timezone.utc).isoformat(), "data": data, "error": ""})
        return data, ""
    except Exception as exc:
        if cached and cached.get("data"):
            return cached.get("data"), f"using cached SEC data after fetch error: {exc}"
        _write_json(cache_path, {"fetchedAt": dt.datetime.now(dt.timezone.utc).isoformat(), "data": None, "error": str(exc)})
        return None, str(exc)


def load_ticker_cik_map(cache_dir: Path) -> dict[str, str]:
    data, _ = fetch_json(SEC_TICKERS_URL, cache_dir / "company_tickers.json", ttl_hours=24 * 7)
    out = {}
    if isinstance(data, dict):
        rows = data.values()
    elif isinstance(data, list):
        rows = data
    else:
        rows = []
    for row in rows:
        ticker = normalize_ticker(row.get("ticker", ""))
        cik = normalize_cik(row.get("cik_str", ""))
        if ticker and cik:
            out[ticker] = cik
    return out


def resolve_cik(company: dict, cache_dir: Path) -> str:
    cik = normalize_cik(company.get("cik", ""))
    if cik:
        return cik
    ticker = normalize_ticker(company.get("ticker", ""))
    if not ticker or company.get("market") == "KR" or re.fullmatch(r"\d{6}", ticker):
        return ""
    return load_ticker_cik_map(cache_dir).get(ticker, "")


def _facts_for_metric(us_gaap: dict, metric: str) -> tuple[str, list[dict]]:
    candidates = []
    point_in_time = metric in POINT_IN_TIME_METRICS
    for concept in METRIC_CANDIDATES.get(metric, []):
        units = (us_gaap.get(concept) or {}).get("units", {})
        if metric in SHARE_COUNT_METRICS:
            facts = units.get("shares") or units.get("Shares") or next(iter(units.values()), [])
        elif "USD" in units:
            facts = units["USD"]
        elif "USD/shares" in units:
            facts = units["USD/shares"]
        elif units:
            facts = next(iter(units.values()))
        else:
            facts = []
        if not facts:
            continue
        annual = _best_rows(facts, "10-K", point_in_time)
        quarterly = _best_rows(facts, "10-Q", point_in_time)
        latest_end = max([r.get("end", "") for r in annual + quarterly] or [""])
        candidates.append((latest_end, len(annual), len(quarterly), concept, facts))
    if candidates:
        candidates.sort(reverse=True)
        _, _, _, concept, facts = candidates[0]
        return concept, facts
    for concept in METRIC_CANDIDATES.get(metric, []):
        units = (us_gaap.get(concept) or {}).get("units", {})
        if units:
            first = next(iter(units.values()))
            return concept, first
    return "", []


def _duration_days(row: dict) -> int:
    try:
        start = dt.date.fromisoformat(row.get("start", ""))
        end = dt.date.fromisoformat(row.get("end", ""))
        return max(0, (end - start).days)
    except Exception:
        return 0


def _best_rows(rows: list[dict], form: str, point_in_time: bool) -> list[dict]:
    filtered = [r for r in rows if r.get("form") == form and r.get("val") is not None and r.get("end")]
    if not point_in_time:
        if form == "10-K":
            filtered = [r for r in filtered if _duration_days(r) >= 250]
        else:
            filtered = [r for r in filtered if 45 <= _duration_days(r) <= 120]
    filtered.sort(key=lambda r: (r.get("end", ""), r.get("filed", "")), reverse=True)
    deduped = []
    seen = set()
    for row in filtered:
        key = row.get("end")
        if key in seen:
            continue
        seen.add(key)
        deduped.append(row)
        if len(deduped) >= 4:
            break
    return deduped


def format_value(value, metric: str) -> str:
    try:
        num = float(value)
    except Exception:
        return str(value)
    if metric in PER_SHARE_METRICS:
        return f"{num:.2f}"
    if metric in SHARE_COUNT_METRICS:
        if num >= 1_000_000_000:
            return f"{num / 1_000_000_000:.2f}B shares"
        if num >= 1_000_000:
            return f"{num / 1_000_000:.1f}M shares"
        return f"{num:,.0f} shares"
    sign = "-" if num < 0 else ""
    num = abs(num)
    if num >= 1_000_000_000:
        return f"{sign}${num / 1_000_000_000:.2f}B"
    if num >= 1_000_000:
        return f"{sign}${num / 1_000_000:.1f}M"
    return f"{sign}${num:,.0f}"


def build_companyfacts_summary(company: dict, cache_dir: Path) -> dict:
    cik = resolve_cik(company, cache_dir)
    if not cik:
        return {"ok": False, "reason": "no_cik", "company": company, "markdown": "SEC companyfacts: CIK를 찾지 못했습니다."}
    data, error = fetch_json(SEC_FACTS_URL.format(cik=cik), cache_dir / "companyfacts" / f"CIK{cik}.json", ttl_hours=12)
    if not data:
        return {"ok": False, "reason": "fetch_failed", "cik": cik, "error": error, "markdown": f"SEC companyfacts fetch failed: {error}"}
    us_gaap = ((data.get("facts") or {}).get("us-gaap") or {})
    rows = []
    for metric in METRIC_CANDIDATES:
        concept, facts = _facts_for_metric(us_gaap, metric)
        annual = _best_rows(facts, "10-K", metric in POINT_IN_TIME_METRICS)
        quarterly = _best_rows(facts, "10-Q", metric in POINT_IN_TIME_METRICS)
        recent = annual[:3] if annual else quarterly[:3]
        rows.append(
            {
                "metric": metric,
                "concept": concept,
                "annual": annual[:3],
                "quarterly": quarterly[:4],
                "recent": recent,
            }
        )
    markdown = companyfacts_to_markdown({"ok": True, "cik": cik, "entityName": data.get("entityName", ""), "rows": rows, "warning": error})
    return {"ok": True, "cik": cik, "entityName": data.get("entityName", ""), "rows": rows, "warning": error, "markdown": markdown}


def _row_values(items: list[dict], metric: str) -> str:
    if not items:
        return "확인되지 않음"
    return " / ".join(f"{item.get('end')}: {format_value(item.get('val'), metric)}" for item in items[:3])


def companyfacts_to_markdown(summary: dict) -> str:
    if not summary.get("ok"):
        return summary.get("markdown", "SEC companyfacts unavailable.")
    lines = [
        f"SEC companyfacts structured data: {summary.get('entityName') or ''} (CIK {summary.get('cik')})",
    ]
    if summary.get("warning"):
        lines.append(f"주의: {summary['warning']}")
    lines += [
        "",
        "| Metric | Recent Annual / Point-in-time | Recent Quarter | SEC Concept |",
        "| --- | --- | --- | --- |",
    ]
    for row in summary.get("rows", []):
        metric = row["metric"]
        lines.append(
            f"| {metric} | {_row_values(row.get('annual', []), metric)} | {_row_values(row.get('quarterly', []), metric)} | {row.get('concept') or 'n/a'} |"
        )
    return "\n".join(lines)


