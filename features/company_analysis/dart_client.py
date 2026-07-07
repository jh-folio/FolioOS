from __future__ import annotations

import datetime as dt
import json
import os
import re
import urllib.parse
import urllib.request
import zipfile
from io import BytesIO
from pathlib import Path
from xml.etree import ElementTree as ET


DART_CORP_CODE_URL = "https://opendart.fss.or.kr/api/corpCode.xml"
DART_FINANCIAL_ALL_URL = "https://opendart.fss.or.kr/api/fnlttSinglAcntAll.json"
DART_DISCLOSURE_LIST_URL = "https://opendart.fss.or.kr/api/list.json"

DART_REPORT_CODES = {
    "annual": "11011",
    "q1": "11013",
    "half": "11012",
    "q3": "11014",
}

ACCOUNT_PATTERNS = {
    "Revenue": ["매출액", "영업수익", "수익(매출액)", "revenue"],
    "Gross Profit": ["매출총이익", "gross profit"],
    "Operating Income": ["영업이익", "operating income"],
    "Net Income": ["당기순이익", "분기순이익", "반기순이익", "profit loss", "net income"],
    "Operating Cash Flow": ["영업활동 현금흐름", "영업활동으로 인한 현금흐름", "cash flows from operating"],
    "Capital Expenditure": ["유형자산의 취득", "유형자산 취득", "property plant and equipment"],
    "Cash & Equivalents": ["현금및현금성자산", "현금 및 현금성자산", "cash and cash equivalents"],
    "Total Assets": ["자산총계", "total assets"],
    "Total Liabilities": ["부채총계", "total liabilities"],
    "Long-Term Debt": ["장기차입금", "사채", "long-term borrowings", "long term debt"],
    "Current Assets": ["유동자산", "current assets"],
    "Current Liabilities": ["유동부채", "current liabilities"],
    "Inventory": ["재고자산", "inventories"],
    "Accounts Receivable": ["매출채권", "trade receivables"],
    "Accounts Payable": ["매입채무", "trade payables"],
    "EPS Diluted": ["희석주당이익", "diluted earnings per share"],
}


def dart_api_key() -> str:
    return os.environ.get("DART_API_KEY", "").strip()


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


def _fresh(path: Path, ttl_hours: int) -> bool:
    if not path.exists():
        return False
    age = dt.datetime.now(dt.timezone.utc) - dt.datetime.fromtimestamp(path.stat().st_mtime, tz=dt.timezone.utc)
    return age < dt.timedelta(hours=ttl_hours)


def _request_json(url: str, params: dict, cache_path: Path, ttl_hours: int = 12) -> tuple[dict | None, str]:
    if _fresh(cache_path, ttl_hours):
        cached = _read_json(cache_path, None)
        if cached is not None:
            return cached, ""
    query = urllib.parse.urlencode(params)
    try:
        req = urllib.request.Request(f"{url}?{query}", headers={"User-Agent": "MarketResearchArchive/0.1"})
        with urllib.request.urlopen(req, timeout=int(os.environ.get("DART_TIMEOUT_SECONDS", "30"))) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        _write_json(cache_path, data)
        return data, ""
    except Exception as exc:
        cached = _read_json(cache_path, None)
        if cached is not None:
            return cached, f"using cached DART data after fetch error: {exc}"
        return None, str(exc)


def load_corp_codes(cache_dir: Path, api_key: str | None = None) -> list[dict]:
    api_key = (api_key or dart_api_key()).strip()
    cache_path = cache_dir / "corp_codes.json"
    if _fresh(cache_path, ttl_hours=24 * 7):
        cached = _read_json(cache_path, [])
        if isinstance(cached, list):
            return cached
    if not api_key:
        return _read_json(cache_path, []) or []
    try:
        req = urllib.request.Request(
            f"{DART_CORP_CODE_URL}?{urllib.parse.urlencode({'crtfc_key': api_key})}",
            headers={"User-Agent": "MarketResearchArchive/0.1"},
        )
        with urllib.request.urlopen(req, timeout=int(os.environ.get("DART_TIMEOUT_SECONDS", "30"))) as resp:
            payload = resp.read()
        with zipfile.ZipFile(BytesIO(payload)) as zf:
            xml_bytes = zf.read(zf.namelist()[0])
        root = ET.fromstring(xml_bytes)
        rows = []
        for item in root.findall("list"):
            row = {child.tag: (child.text or "").strip() for child in item}
            if row.get("corp_code") and row.get("corp_name"):
                rows.append(row)
        _write_json(cache_path, rows)
        return rows
    except Exception:
        return _read_json(cache_path, []) or []


def resolve_dart_company(query: str, cache_dir: Path, api_key: str | None = None) -> dict | None:
    token = str(query or "").strip()
    if not token:
        return None
    token_upper = token.upper().replace(".KS", "").replace(".KQ", "")
    token_norm = re.sub(r"\s+", "", token).lower()
    exact_stock = None
    exact_name = None
    contains_name = None
    for row in load_corp_codes(cache_dir, api_key):
        stock_code = str(row.get("stock_code") or "").strip()
        corp_name = str(row.get("corp_name") or "").strip()
        corp_code = str(row.get("corp_code") or "").strip()
        if not stock_code or not corp_name or not corp_code:
            continue
        candidate = {
            "name": corp_name,
            "ticker": stock_code,
            "sector": "Unclassified",
            "market": "KR",
            "cik": "",
            "corpCode": corp_code,
            "aliases": [corp_name, stock_code, f"{stock_code}.KS", f"{stock_code}.KQ"],
        }
        if token_upper == stock_code:
            exact_stock = candidate
            break
        name_norm = re.sub(r"\s+", "", corp_name).lower()
        if token_norm == name_norm:
            exact_name = candidate
        elif len(token_norm) >= 2 and token_norm in name_norm and contains_name is None:
            contains_name = candidate
    return exact_stock or exact_name or contains_name


def _num(value) -> float | None:
    text = str(value or "").strip().replace(",", "")
    if not text or text in {"-", "nan", "None"}:
        return None
    negative = text.startswith("(") and text.endswith(")")
    text = text.strip("()")
    try:
        number = float(text)
        return -number if negative else number
    except Exception:
        return None


def _account_matches(account: str, patterns: list[str]) -> bool:
    hay = re.sub(r"\s+", "", str(account or "")).lower()
    return any(re.sub(r"\s+", "", pattern).lower() in hay for pattern in patterns)


def _metric_for_account(account_name: str, account_id: str = "") -> str | None:
    hay = f"{account_name} {account_id}"
    for metric, patterns in ACCOUNT_PATTERNS.items():
        if _account_matches(hay, patterns):
            return metric
    return None


def _select_statement_rows(rows: list[dict]) -> list[dict]:
    consolidated = [row for row in rows if row.get("fs_div") == "CFS"]
    return consolidated or rows


def fetch_financial_rows(corp_code: str, cache_dir: Path, api_key: str, years: list[int]) -> tuple[list[dict], list[str]]:
    warnings = []
    metric_rows: dict[str, dict] = {}
    for year in years:
        data, error = _request_json(
            DART_FINANCIAL_ALL_URL,
            {
                "crtfc_key": api_key,
                "corp_code": corp_code,
                "bsns_year": str(year),
                "reprt_code": DART_REPORT_CODES["annual"],
                "fs_div": "CFS",
            },
            cache_dir / "financials" / f"{corp_code}_{year}_annual.json",
            ttl_hours=12,
        )
        if error:
            warnings.append(error)
        if not data or data.get("status") not in {"000", "013"}:
            if data and data.get("message"):
                warnings.append(f"{year}: {data.get('message')}")
            continue
        for row in _select_statement_rows(data.get("list") or []):
            metric = _metric_for_account(row.get("account_nm", ""), row.get("account_id", ""))
            value = _num(row.get("thstrm_amount"))
            if not metric or value is None:
                continue
            item = {
                "val": value,
                "end": f"{year}-12-31",
                "fy": str(year),
                "form": "DART",
                "fp": "FY",
                "account": row.get("account_nm", ""),
            }
            metric_row = metric_rows.setdefault(metric, {"metric": metric, "concept": row.get("account_nm", ""), "annual": [], "quarterly": [], "recent": []})
            if not any(existing.get("fy") == str(year) for existing in metric_row["annual"]):
                metric_row["annual"].append(item)
    for row in metric_rows.values():
        row["annual"].sort(key=lambda item: item.get("end", ""), reverse=True)
        row["annual"] = row["annual"][:3]
        row["recent"] = row["annual"][:3]
    return list(metric_rows.values()), warnings


def recent_disclosures(corp_code: str, cache_dir: Path, api_key: str, limit: int = 5) -> tuple[list[dict], str]:
    today = dt.datetime.now().strftime("%Y%m%d")
    start = (dt.datetime.now() - dt.timedelta(days=365 * 2)).strftime("%Y%m%d")
    data, error = _request_json(
        DART_DISCLOSURE_LIST_URL,
        {
            "crtfc_key": api_key,
            "corp_code": corp_code,
            "bgn_de": start,
            "end_de": today,
            "page_count": str(limit),
        },
        cache_dir / "disclosures" / f"{corp_code}_recent.json",
        ttl_hours=12,
    )
    if not data or data.get("status") not in {"000", "013"}:
        return [], error or (data or {}).get("message", "")
    return (data.get("list") or [])[:limit], error


def dart_summary_to_markdown(summary: dict) -> str:
    if not summary.get("ok"):
        return summary.get("markdown", "DART financials unavailable.")
    lines = [
        f"DART structured financial data: {summary.get('entityName') or ''} (corp_code {summary.get('corpCode')})",
    ]
    if summary.get("warning"):
        lines.append(f"주의: {summary['warning']}")
    lines += [
        "",
        "| Metric | Recent Annual | DART Account |",
        "| --- | --- | --- |",
    ]
    for row in summary.get("rows", []):
        values = " / ".join(f"{item.get('end')}: {item.get('val'):,.0f}" for item in row.get("annual", [])[:3])
        lines.append(f"| {row.get('metric')} | {values or '확인되지 않음'} | {row.get('concept') or ''} |")
    return "\n".join(lines)


def build_dart_summary(company: dict, cache_dir: Path, api_key: str | None = None) -> dict:
    api_key = (api_key or dart_api_key()).strip()
    if not api_key:
        return {"ok": False, "reason": "missing_dart_api_key", "company": company, "markdown": "DART: API 키가 설정되지 않았습니다."}
    corp_code = str(company.get("corpCode") or "").strip()
    resolved = None
    if not corp_code:
        resolved = resolve_dart_company(company.get("ticker") or company.get("name"), cache_dir, api_key)
        corp_code = str((resolved or {}).get("corpCode") or "").strip()
    if not corp_code:
        return {"ok": False, "reason": "no_corp_code", "company": company, "markdown": "DART: corp_code를 찾지 못했습니다."}
    fiscal_year = dt.datetime.now().year - 1
    years = [fiscal_year - offset for offset in range(3)]
    rows, warnings = fetch_financial_rows(corp_code, cache_dir, api_key, years)
    disclosures, disclosure_warning = recent_disclosures(corp_code, cache_dir, api_key)
    if disclosure_warning:
        warnings.append(disclosure_warning)
    entity_name = company.get("name") or (resolved or {}).get("name") or ""
    summary = {
        "ok": bool(rows),
        "corpCode": corp_code,
        "entityName": entity_name,
        "rows": rows,
        "disclosures": disclosures,
        "warning": "; ".join(dict.fromkeys([w for w in warnings if w]))[:800],
        "source": "DART Open API",
    }
    if not rows:
        summary["reason"] = "no_financial_rows"
        summary["markdown"] = f"DART: 재무제표 주요 계정을 찾지 못했습니다. {summary.get('warning', '')}".strip()
        return summary
    summary["markdown"] = dart_summary_to_markdown(summary)
    return summary

