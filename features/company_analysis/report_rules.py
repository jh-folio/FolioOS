#!/usr/bin/env python3
from __future__ import annotations

import datetime as dt
import json
import re
from pathlib import Path

from features.company_analysis import financial_engine
from features.company_analysis.style import analysis_style_label, normalize_analysis_style

try:
    from jinja2 import Template
except Exception:  # pragma: no cover - fallback for first run before dependency install
    Template = None


REPORT_TEMPLATE = """# ✅ {{ company.name }} ({{ company.ticker }})

## 1. 기업 개요

- **기업명**: {{ company.name }}
- **Ticker**: {{ company.ticker }}
- **섹터 / 산업**: {{ company.sector }}
- **상장 시장**: {{ company.market or "확인 필요" }}
- **공시 식별자**: {% if company.market == "KR" %}DART corp_code {{ company.corpCode or "확인 필요" }}{% else %}CIK {{ company.cik or "확인 필요" }}{% endif %}

{{ overview }}

## 2. 재무 요약

{{ financial_table }}

{{ financial_commentary }}

{{ financial_quality }}

## 3. 밸류에이션 지표

{{ valuation_metrics }}

## 4. 경쟁력 분석

{{ competitive_analysis }}

## 5. 리스크 요인

{{ risk_table }}

{{ risk_commentary }}

## 6. 성장 전망과 전략

{{ growth_outlook }}

## 7. 종합 판단

- **가격 대비 내재가치**: Valuation Metrics의 DCF 시나리오 참고
- **장기 투자 적합도**: {{ suitability }}
- **투자 의견**: 관심종목

{{ conclusion }}

## 8. 사용 자료

{% for source in sources -%}
- {{ source }}
{% endfor -%}
"""


def _fmt(value) -> str:
    return str(value or "").strip()


def _metric_row(sec_rows: list[dict], metric: str) -> dict:
    for row in sec_rows:
        if row.get("metric") == metric:
            return row
    return {"metric": metric, "annual": [], "quarterly": []}


METRIC_LABELS = {
    "Revenue": "매출",
    "Gross Profit": "매출총이익",
    "Operating Income": "영업이익",
    "Net Income": "순이익",
    "EPS Diluted": "희석 EPS",
    "Operating Cash Flow": "영업현금흐름",
    "Capital Expenditure": "설비투자",
    "Cash & Equivalents": "현금성자산",
    "Total Assets": "총자산",
    "Total Liabilities": "총부채",
    "Long-Term Debt": "장기부채",
    "Current Assets": "유동자산",
    "Current Liabilities": "유동부채",
    "Inventory": "재고",
    "Accounts Receivable": "매출채권",
    "Accounts Payable": "매입채무",
    "Shares Diluted": "희석주식수",
    "EBITDA": "EBITDA",
    "Depreciation & Amortization": "감가상각비",
    "Pretax Income": "세전이익",
    "Income Tax": "법인세",
    "Interest Expense": "이자비용",
    "Share Repurchases": "자사주 매입",
    "Dividends Paid": "배당 지급",
}

KEYWORD_LABELS = {
    "business": "사업 구조",
    "platform": "플랫폼",
    "segment": "사업부",
    "customer": "고객",
    "customers": "고객",
    "product": "제품",
    "service": "서비스",
    "competition": "경쟁",
    "scale": "규모",
    "network": "네트워크 효과",
    "technology": "기술",
    "data": "데이터",
    "brand": "브랜드",
    "risk": "리스크",
    "regulation": "규제",
    "liquidity": "유동성",
    "cybersecurity": "사이버보안",
    "insurance": "보험 비용",
    "legal": "법률 이슈",
    "growth": "성장",
    "strategy": "전략",
    "investment": "투자",
    "margin": "마진",
    "cash flow": "현금흐름",
    "ai": "AI",
    "international": "해외 확장",
    "new products": "신제품",
    "revenue": "매출",
    "margin": "마진",
    "cash flow": "현금흐름",
}


def _year(item: dict) -> str:
    return str(str(item.get("end", ""))[:4] or item.get("fy") or "확인 필요")


def _format_fact(item: dict, metric: str) -> str:
    from features.company_analysis.sec_companyfacts import format_value

    if not item:
        return "확인되지 않음"
    return format_value(item.get("val"), metric)


def _annual_items(sec_summary: dict, metric: str) -> list[dict]:
    return _metric_row(sec_summary.get("rows", []), metric).get("annual", [])


def _latest_number(sec_summary: dict, metric: str, offset: int = 0) -> float | None:
    return financial_engine.latest_value(sec_summary, metric, offset)


def _annual_numbers(sec_summary: dict, metric: str, limit: int = 5) -> list[float]:
    return financial_engine.annual_values(sec_summary, metric, limit)


def _ratio(numerator: float | None, denominator: float | None) -> float | None:
    if numerator is None or denominator in {None, 0}:
        return None
    try:
        return numerator / denominator
    except Exception:
        return None


def _pct(value: float | None) -> str:
    if value is None:
        return "확인 필요"
    return f"{value * 100:.1f}%"


def _money(value: float | None) -> str:
    if value is None:
        return "확인 필요"
    return _format_fact({"val": value}, "Revenue")


def _plain_number(value: float | None) -> str:
    if value is None:
        return "확인 필요"
    if abs(value) >= 1_000_000_000:
        return f"{value / 1_000_000_000:.2f}B"
    if abs(value) >= 1_000_000:
        return f"{value / 1_000_000:.1f}M"
    return f"{value:,.0f}"


def _multiple(value: float | None) -> str:
    if value is None:
        return "확인 필요"
    return f"{value:.1f}x"


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


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


def _market_cache_dir() -> Path:
    return Path(__file__).resolve().parents[2] / "data" / "company-analysis" / "market-cache"


def fetch_market_valuation_data(company: dict, ttl_hours: int = 6) -> dict:
    ticker = str(company.get("ticker") or "").strip().upper()
    if not ticker:
        return {"ok": False, "reason": "market_price_unavailable_for_ticker"}
    yf_symbol = f"{ticker}.KS" if company.get("market") == "KR" and re.fullmatch(r"\d{6}", ticker) else ticker
    cache_path = _market_cache_dir() / f"{yf_symbol.replace('.', '_')}.json"
    cached = _read_json(cache_path, None)
    if cached and cached.get("fetchedAt"):
        try:
            fetched = dt.datetime.fromisoformat(cached["fetchedAt"])
            cached_data = cached.get("data", cached)
            cache_is_fresh = dt.datetime.now(dt.timezone.utc) - fetched < dt.timedelta(hours=ttl_hours)
            # Older cache files did not include yfinance cashflow rows. Refetch those once so
            # FCF, CapEx, and CFO fallback data can populate financial summary and DCF sections.
            if cache_is_fresh and (cached_data.get("cashflowRows") or not cached_data.get("ok")):
                return cached_data
        except Exception:
            pass
    try:
        import yfinance as yf

        stock = yf.Ticker(yf_symbol)
        fast = getattr(stock, "fast_info", {}) or {}
        info = {}
        try:
            info = stock.get_info() or {}
        except Exception:
            try:
                info = stock.info or {}
            except Exception:
                info = {}

        def pick(*names):
            for name in names:
                value = None
                try:
                    if hasattr(fast, name):
                        value = getattr(fast, name)
                    elif isinstance(fast, dict):
                        value = fast.get(name)
                except Exception:
                    value = None
                if value is None:
                    value = info.get(name)
                try:
                    if value is not None:
                        return float(value)
                except Exception:
                    continue
            return None

        def cashflow_rows():
            try:
                frame = stock.cashflow
                if frame is None or getattr(frame, "empty", True):
                    try:
                        frame = stock.get_cash_flow(freq="yearly")
                    except Exception:
                        frame = None
                if frame is None or getattr(frame, "empty", True):
                    return []
                rows = []
                wanted = {
                    "Operating Cash Flow": ["Operating Cash Flow", "Total Cash From Operating Activities", "Net Cash Provided By Operating Activities"],
                    "Capital Expenditure": ["Capital Expenditure", "Capital Expenditures", "Capital Spending"],
                    "Free Cash Flow": ["Free Cash Flow"],
                }
                index_labels = {str(label).strip().lower(): label for label in getattr(frame, "index", [])}
                for column in list(getattr(frame, "columns", []))[:4]:
                    year = str(column)[:4]
                    if not re.fullmatch(r"\d{4}", year):
                        continue
                    row = {"year": year, "end": str(column)[:10], "source": "yfinance cashflow"}
                    for metric, labels in wanted.items():
                        value = None
                        for label in labels:
                            actual = index_labels.get(label.lower())
                            if actual is None:
                                continue
                            try:
                                raw_value = frame.loc[actual, column]
                                if raw_value is not None:
                                    value = float(raw_value)
                                    break
                            except Exception:
                                continue
                        if metric == "Capital Expenditure" and value is not None:
                            value = abs(value)
                        row[metric] = value
                    cfo = row.get("Operating Cash Flow")
                    capex = row.get("Capital Expenditure")
                    if row.get("Free Cash Flow") is None and cfo is not None and capex is not None:
                        row["Free Cash Flow"] = cfo - capex
                    if any(row.get(metric) is not None for metric in wanted):
                        rows.append(row)
                rows.sort(key=lambda item: item.get("year", ""), reverse=True)
                return rows
            except Exception:
                return []

        data = {
            "ok": True,
            "ticker": yf_symbol,
            "price": pick("last_price", "lastPrice", "currentPrice", "regularMarketPrice", "previousClose"),
            "marketCap": pick("market_cap", "marketCap"),
            "enterpriseValue": pick("enterprise_value", "enterpriseValue"),
            "sharesOutstanding": pick("shares", "sharesOutstanding", "impliedSharesOutstanding"),
            "ebitda": pick("ebitda", "trailingEbitda"),
            "currency": info.get("currency") or "USD",
            "source": "yfinance",
            "cashflowRows": cashflow_rows(),
        }
        _write_json(cache_path, {"fetchedAt": dt.datetime.now(dt.timezone.utc).isoformat(), "data": data})
        return data
    except Exception as exc:
        fallback = cached.get("data") if cached else None
        if fallback:
            fallback = dict(fallback)
            fallback["warning"] = f"using cached market data after yfinance error: {exc}"
            return fallback
        return {"ok": False, "reason": str(exc)}


def _judge(value: float | None, good: float, okay: float, reverse: bool = False) -> str:
    if value is None:
        return "확인 필요"
    if reverse:
        if value <= good:
            return "양호"
        if value <= okay:
            return "보통"
        return "취약"
    if value >= good:
        return "양호"
    if value >= okay:
        return "보통"
    return "취약"


def _clean_sentence(text: str, limit: int = 420) -> str:
    text = re.sub(r"\s+", " ", str(text or "")).strip()
    text = re.sub(r"Table of Contents", "", text, flags=re.I).strip()
    if not text:
        return ""
    parts = re.split(r"(?<=[.!?])\s+", text)
    out = " ".join(parts[:2]).strip() or text
    if len(out) > limit:
        out = out[:limit].rsplit(" ", 1)[0].rstrip(".,;:") + "..."
    return out


def _keyword_text(row: dict, limit: int = 5) -> str:
    labels = [KEYWORD_LABELS.get(str(k).lower(), str(k)) for k in row.get("keywords", [])[:limit]]
    return ", ".join(dict.fromkeys(labels)) or "핵심 키워드"


def _market_cashflow_by_year(market_data: dict | None, metric: str) -> dict[str, dict]:
    out = {}
    for row in (market_data or {}).get("cashflowRows", []) or []:
        year = str(row.get("year") or str(row.get("end", ""))[:4])
        if not re.fullmatch(r"\d{4}", year):
            continue
        value = row.get(metric)
        try:
            value = float(value) if value is not None else None
        except Exception:
            value = None
        if value is not None:
            out[year] = {"val": value, "end": row.get("end") or year, "source": row.get("source") or "yfinance cashflow"}
    return out


def _annual_value_map(sec_summary: dict, metric: str) -> dict[str, dict]:
    row = _metric_row(sec_summary.get("rows", []), metric)
    out = {}
    for item in row.get("annual", []) or []:
        year = _year(item)
        if re.fullmatch(r"\d{4}", year):
            out.setdefault(year, item)
    return out


def _derived_fcf_by_year(sec_summary: dict, market_data: dict | None = None) -> tuple[dict[str, dict], str]:
    cfo = _annual_value_map(sec_summary, "Operating Cash Flow")
    capex = _annual_value_map(sec_summary, "Capital Expenditure")
    fcf = {}
    for year in sorted(set(cfo) & set(capex), reverse=True):
        try:
            fcf[year] = {"val": float(cfo[year].get("val")) - float(capex[year].get("val")), "end": cfo[year].get("end") or capex[year].get("end") or year, "source": "SEC CFO - SEC CapEx"}
        except Exception:
            continue
    source = "SEC CFO - SEC CapEx" if fcf else ""
    if not fcf:
        y_fcf = _market_cashflow_by_year(market_data, "Free Cash Flow")
        if y_fcf:
            fcf = y_fcf
            source = "yfinance cashflow FCF"
    return fcf, source


def _latest_metric_value(sec_summary: dict, market_data: dict | None, metric: str, offset: int = 0) -> float | None:
    if metric == "Free Cash Flow":
        values, _ = _derived_fcf_by_year(sec_summary, market_data)
        ordered = [values[year].get("val") for year in sorted(values, reverse=True)]
    else:
        ordered = [item.get("val") for _, item in sorted(_annual_value_map(sec_summary, metric).items(), reverse=True)]
        if not ordered and metric in {"Operating Cash Flow", "Capital Expenditure"}:
            fallback = _market_cashflow_by_year(market_data, metric)
            ordered = [fallback[year].get("val") for year in sorted(fallback, reverse=True)]
    try:
        return float(ordered[offset]) if len(ordered) > offset and ordered[offset] is not None else None
    except Exception:
        return None


def _fcf_series_with_fallback(sec_summary: dict, market_data: dict | None = None, limit: int = 5) -> list[float]:
    values, _ = _derived_fcf_by_year(sec_summary, market_data)
    out = []
    for year in sorted(values, reverse=True)[:limit]:
        try:
            out.append(float(values[year].get("val")))
        except Exception:
            pass
    return out


def build_financial_table(sec_summary: dict, market_data: dict | None = None) -> str:
    rows = sec_summary.get("rows", []) if sec_summary.get("ok") else []
    metrics = [
        "Revenue",
        "Gross Profit",
        "Operating Income",
        "Net Income",
        "EPS Diluted",
        "Operating Cash Flow",
        "Capital Expenditure",
        "Free Cash Flow",
        "Cash & Equivalents",
        "Total Liabilities",
        "Long-Term Debt",
    ]
    years = set()
    for row in rows:
        for item in row.get("annual", []):
            year = _year(item)
            if re.fullmatch(r"\d{4}", year):
                years.add(year)
    for row in (market_data or {}).get("cashflowRows", []) or []:
        year = str(row.get("year") or str(row.get("end", ""))[:4])
        if re.fullmatch(r"\d{4}", year):
            years.add(year)
    years = sorted(years, reverse=True)[:3]
    while len(years) < 3:
        years.append("확인 필요")
    lines = [f"| 항목 | {years[0]} | {years[1]} | {years[2]} | 비고 |", "| --- | --- | --- | --- | --- |"]
    fcf_by_year, fcf_source = _derived_fcf_by_year(sec_summary, market_data)
    for metric in metrics:
        row = _metric_row(rows, metric)
        values_by_year = {}
        source_note = row.get("concept") or ""
        if metric == "Free Cash Flow":
            values_by_year = {year: _money(item.get("val")) for year, item in fcf_by_year.items()}
            source_note = fcf_source or "CFO/CapEx 확인 필요"
        else:
            for item in row.get("annual", []) or []:
                year = _year(item)
                values_by_year.setdefault(year, _format_fact(item, metric))
            if metric in {"Operating Cash Flow", "Capital Expenditure"}:
                fallback = _market_cashflow_by_year(market_data, metric)
                for year, item in fallback.items():
                    if year not in values_by_year:
                        values_by_year[year] = _money(item.get("val"))
                if fallback and not source_note:
                    source_note = "yfinance cashflow fallback"
        lines.append(
            f"| {METRIC_LABELS.get(metric, metric)} | {values_by_year.get(years[0], '확인되지 않음')} | "
            f"{values_by_year.get(years[1], '확인되지 않음')} | "
            f"{values_by_year.get(years[2], '확인되지 않음')} | {source_note} |"
        )
    return "\n".join(lines)

def build_financial_quality_analysis(sec_summary: dict, market_data: dict | None = None) -> str:
    revenue = _latest_number(sec_summary, "Revenue")
    revenue_prior = _latest_number(sec_summary, "Revenue", 1)
    operating_income = _latest_number(sec_summary, "Operating Income")
    operating_income_prior = _latest_number(sec_summary, "Operating Income", 1)
    net_income = _latest_number(sec_summary, "Net Income")
    cfo = _latest_metric_value(sec_summary, market_data, "Operating Cash Flow")
    cfo_prior = _latest_metric_value(sec_summary, market_data, "Operating Cash Flow", 1)
    capex = _latest_metric_value(sec_summary, market_data, "Capital Expenditure")
    cash = _latest_number(sec_summary, "Cash & Equivalents")
    assets = _latest_number(sec_summary, "Total Assets")
    liabilities = _latest_number(sec_summary, "Total Liabilities")
    long_term_debt = _latest_number(sec_summary, "Long-Term Debt")
    derived = financial_engine.derived_financials(sec_summary)
    buybacks = _latest_number(sec_summary, "Share Repurchases")
    dividends = _latest_number(sec_summary, "Dividends Paid")

    fcf = _latest_metric_value(sec_summary, market_data, "Free Cash Flow")
    if fcf is None and cfo is not None and capex is not None:
        fcf = cfo - capex
    fcf_margin = _ratio(fcf, revenue)
    cfo_to_operating_income = _ratio(cfo, operating_income)
    cfo_to_net_income = _ratio(cfo, net_income)
    capex_to_cfo = _ratio(capex, cfo)
    operating_income_to_assets = _ratio(operating_income, assets)
    liabilities_to_cash = _ratio(liabilities, cash)
    debt_to_cfo = _ratio(long_term_debt, cfo)

    revenue_growth = _ratio(revenue - revenue_prior, revenue_prior) if revenue is not None and revenue_prior not in {None, 0} else None
    operating_growth = _ratio(operating_income - operating_income_prior, operating_income_prior) if operating_income is not None and operating_income_prior not in {None, 0} else None
    cfo_growth = _ratio(cfo - cfo_prior, cfo_prior) if cfo is not None and cfo_prior not in {None, 0} else None

    cash_conversion_judgment = _judge(cfo_to_operating_income, 0.9, 0.6)
    fcf_judgment = "확인 필요" if fcf is None else ("양호" if fcf > 0 and (fcf_margin or 0) >= 0.08 else "보통" if fcf > 0 else "취약")
    growth_quality = "확인 필요"
    if revenue_growth is not None and operating_growth is not None:
        if revenue_growth >= 0 and operating_growth >= revenue_growth * 0.7:
            growth_quality = "양호"
        elif revenue_growth >= 0 or operating_growth >= 0:
            growth_quality = "보통"
        else:
            growth_quality = "취약"

    stability_judgment = "확인 필요"
    if debt_to_cfo is not None:
        stability_judgment = _judge(debt_to_cfo, 1.5, 3.0, reverse=True)
    elif liabilities_to_cash is not None:
        stability_judgment = _judge(liabilities_to_cash, 4.0, 8.0, reverse=True)

    capital_allocation = "확인 필요"
    if capex_to_cfo is not None and fcf is not None:
        if 0.05 <= capex_to_cfo <= 0.45 and fcf > 0:
            capital_allocation = "양호"
        elif fcf > 0:
            capital_allocation = "보통"
        else:
            capital_allocation = "취약"

    rows = [
        (
            "자본수익성",
            _judge(operating_income_to_assets, 0.10, 0.05),
            f"영업이익/총자산 대용 지표는 {_pct(operating_income_to_assets)}입니다.",
            "ROIC, WACC, 투하자본 세부 구성",
        ),
        (
            "현금전환",
            cash_conversion_judgment,
            f"영업현금흐름/영업이익은 {_pct(cfo_to_operating_income)}, 영업현금흐름/순이익은 {_pct(cfo_to_net_income)}입니다.",
            "EBITDA, 운전자본 변화",
        ),
        (
            "자유현금흐름",
            fcf_judgment,
            f"영업현금흐름 {_money(cfo)}에서 설비투자 {_money(capex)}를 차감한 단순 FCF는 {_money(fcf)}이며, FCF/매출은 {_pct(fcf_margin)}입니다.",
            "리스, 일회성 현금흐름, 유지/성장 CapEx 구분",
        ),
        (
            "성장의 질",
            growth_quality,
            f"매출 성장률은 {_pct(revenue_growth)}, 영업이익 성장률은 {_pct(operating_growth)}, 영업현금흐름 성장률은 {_pct(cfo_growth)}입니다.",
            "세그먼트별 성장, 가격/물량 효과",
        ),
        (
            "재무 안정성",
            stability_judgment,
            f"현금성자산은 {_money(cash)}, 총부채는 {_money(liabilities)}, 장기부채/영업현금흐름은 {_pct(debt_to_cfo)}, 유동비율은 {_multiple(derived.get('currentRatio'))}입니다.",
            "순부채, 만기 구조",
        ),
        (
            "자본배분",
            capital_allocation,
            f"설비투자/영업현금흐름은 {_pct(capex_to_cfo)}이며, 자사주 매입은 {_money(buybacks)}, 배당 지급은 {_money(dividends)}로 확인됩니다.",
            "M&A 수익률, 유지/성장 CapEx 구분",
        ),
    ]

    table = [
        "### 재무 품질 분석",
        "",
        "| 항목 | 예비 판단 | 근거 | 추가 확인 포인트 |",
        "| --- | --- | --- | --- |",
        *[f"| {name} | {judgment} | {basis} | {needed} |" for name, judgment, basis, needed in rows],
        "",
    ]
    commentary = []
    if cash_conversion_judgment in {"양호", "보통"} and fcf_judgment in {"양호", "보통"}:
        commentary.append("현재 확인 가능한 수치 기준으로 이익의 현금 전환은 일정 수준 이상 유지되고 있습니다.")
    elif cash_conversion_judgment == "취약" or fcf_judgment == "취약":
        commentary.append("현재 확인 가능한 수치 기준으로 회계상 이익과 실제 현금흐름 사이의 괴리를 추가로 점검해야 합니다.")
    else:
        commentary.append("현금전환 품질은 EBITDA, 운전자본, 일회성 현금흐름 자료가 추가로 있어야 더 정확히 판단할 수 있습니다.")
    if growth_quality == "양호":
        commentary.append("성장 과정에서 수익성과 현금흐름이 함께 뒷받침되는지 계속 확인하면 됩니다.")
    elif growth_quality == "취약":
        commentary.append("외형 성장보다 수익성 또는 현금흐름이 약해지는지 확인하는 것이 더 중요합니다.")
    if stability_judgment == "취약":
        commentary.append("부채와 유동성 지표는 단순 잔액보다 만기 구조와 이자비용을 함께 봐야 합니다.")
    if derived.get("taxRate") is not None or derived.get("debtCost") is not None:
        commentary.append(f"세율은 {_pct(derived.get('taxRate'))}, 이자비용/장기부채 대용 지표는 {_pct(derived.get('debtCost'))}로 추정됩니다.")
    commentary.append("이 평가는 가격 매력도가 아니라 기업의 재무 체력을 보기 위한 예비 점검입니다.")
    return "\n".join(table + [" ".join(commentary)])


def _fcf_series(sec_summary: dict, market_data: dict | None = None) -> list[float]:
    values = _fcf_series_with_fallback(sec_summary, market_data, 5)
    return values or financial_engine.fcf_series(sec_summary, 5)


def _growth_rate(values: list[float], fallback: float = 0.04) -> float:
    return financial_engine.growth_rate(values, fallback)


def _dcf_value(base_fcf: float, net_debt: float, shares: float, near_growth: float, discount_rate: float, terminal_growth: float, years: int = 5) -> dict:
    return financial_engine.dcf_value(base_fcf, net_debt, shares, near_growth, discount_rate, terminal_growth, years)


def build_valuation_metrics(company: dict, sec_summary: dict, market_data: dict | None = None) -> str:
    market = market_data or fetch_market_valuation_data(company)
    revenue = _latest_number(sec_summary, "Revenue")
    eps = _latest_number(sec_summary, "EPS Diluted")
    cfo = _latest_metric_value(sec_summary, market, "Operating Cash Flow")
    capex = _latest_metric_value(sec_summary, market, "Capital Expenditure")
    cash = _latest_number(sec_summary, "Cash & Equivalents") or 0.0
    debt = _latest_number(sec_summary, "Long-Term Debt")
    liabilities = _latest_number(sec_summary, "Total Liabilities")
    ebitda = market.get("ebitda") if market.get("ok") else None
    if ebitda is None:
        ebitda = _latest_number(sec_summary, "EBITDA")
    shares = market.get("sharesOutstanding") if market.get("ok") else None
    if shares is None:
        shares = _latest_number(sec_summary, "Shares Diluted")
    price = market.get("price") if market.get("ok") else None
    market_cap = market.get("marketCap") if market.get("ok") else None
    if market_cap is None and price is not None and shares is not None:
        market_cap = price * shares
    net_debt = (debt if debt is not None else 0.0) - cash
    enterprise_value = market.get("enterpriseValue") if market.get("ok") else None
    if enterprise_value is None and market_cap is not None:
        enterprise_value = market_cap + net_debt

    fcf = _latest_metric_value(sec_summary, market, "Free Cash Flow")
    if fcf is None and cfo is not None and capex is not None:
        fcf = cfo - capex
    psr = _ratio(market_cap, revenue)
    per = _ratio(price, eps) if eps and eps > 0 else None
    ev_ebitda = _ratio(enterprise_value, ebitda) if ebitda and ebitda > 0 else None
    fcf_yield = _ratio(fcf, market_cap)
    fcf_margin = _ratio(fcf, revenue)

    fcf_values = _fcf_series(sec_summary, market)
    near_growth = _growth_rate(fcf_values)
    discount_rate = 0.09
    terminal_growth = 0.025
    dcf = _dcf_value(fcf or 0.0, net_debt, shares or 0.0, near_growth, discount_rate, terminal_growth)
    scenarios = financial_engine.dcf_scenarios(fcf or 0.0, net_debt, shares or 0.0, near_growth)

    table = [
        "| 지표 | 계산값 | 사용 입력/계산식 |",
        "| --- | ---: | --- |",
        f"| 현재 주가 | {_money(price)} | yfinance {market.get('ticker', company.get('ticker', ''))} |",
        f"| 시가총액 | {_money(market_cap)} | 주가 × 주식수 또는 yfinance marketCap |",
        f"| 순부채 | {_money(net_debt)} | 장기부채 {_money(debt)} - 현금 {_money(cash)} |",
        f"| PER | {_multiple(per)} | 주가 / 희석 EPS {_plain_number(eps)} |",
        f"| PSR | {_multiple(psr)} | 시가총액 / 매출 {_money(revenue)} |",
        f"| EV/EBITDA | {_multiple(ev_ebitda)} | 기업가치 / EBITDA {_money(ebitda)} |",
        f"| FCF Yield | {_pct(fcf_yield)} | FCF {_money(fcf)} / 시가총액 |",
        f"| FCF Margin | {_pct(fcf_margin)} | FCF / 매출 |",
    ]

    lines = ["### Valuation Metrics", "", *table, ""]
    if dcf.get("ok"):
        lines += [
            "### DCF 기반 내재가치",
            "",
            "| 시나리오 | FCF 성장률 | 할인율 | 영구성장률 | 자기자본가치 | 내재가치/주 | 현재가 대비 |",
            "| --- | ---: | ---: | ---: | ---: | ---: | ---: |",
        ]
        for scenario in scenarios:
            if scenario.get("ok"):
                upside = _ratio(scenario["perShare"] - price, price) if price else None
                lines.append(
                    f"| {scenario['name']} | {_pct(scenario['growth'])} | {_pct(scenario['discount'])} | {_pct(scenario['terminal'])} | "
                    f"{_money(scenario['equityValue'])} | {_money(scenario['perShare'])} | {_pct(upside)} |"
                )
            else:
                lines.append(f"| {scenario['name']} | {_pct(scenario['growth'])} | {_pct(scenario['discount'])} | {_pct(scenario['terminal'])} | 계산 불가 | 계산 불가 | 계산 불가 |")
        lines += [
            "",
            "| 항목 | 값 |",
            "| --- | ---: |",
            f"| 기준 FCF | {_money(fcf)} |",
            f"| 순부채 차감 후 자기자본가치 | {_money(dcf['equityValue'])} |",
            f"| DCF 내재가치/주 | {_money(dcf['perShare'])} |",
            "",
            "| 민감도: 내재가치/주 | 영구성장 2.0% | 영구성장 2.5% | 영구성장 3.0% |",
            "| --- | ---: | ---: | ---: |",
        ]
        for dr in [0.085, 0.09, 0.095]:
            cells = []
            for tg in [0.02, 0.025, 0.03]:
                case = _dcf_value(fcf or 0.0, net_debt, shares or 0.0, near_growth, dr, tg)
                cells.append(_money(case.get("perShare") if case.get("ok") else None))
            lines.append(f"| 할인율 {_pct(dr)} | {cells[0]} | {cells[1]} | {cells[2]} |")
        lines += [
            "",
            "DCF는 최근 연간 FCF를 기준으로 한 단순 예비 모델입니다. 유지/성장 CapEx, 운전자본 정상화, 경기 사이클, 세율, WACC는 별도 검증이 필요합니다.",
        ]
    else:
        missing = []
        if not fcf or fcf <= 0:
            missing.append("양의 기준 FCF")
        if not shares:
            missing.append("희석주식수")
        if price is None:
            missing.append("현재 주가")
        if not missing:
            missing.append("할인율/성장률 조건")
        lines += [
            "### DCF 기반 내재가치",
            "",
            f"DCF 계산에는 {', '.join(missing)}가 필요합니다. 현재 확인 가능한 SEC/companyfacts와 시장가격 데이터만으로는 신뢰할 수 있는 내재가치를 산출하지 않았습니다.",
        ]
    if not market.get("ok"):
        lines.append(f"\n시장가격 데이터 참고: yfinance 데이터를 가져오지 못했습니다({market.get('reason', 'unknown')}). SEC 기반 재무 지표만 표시했습니다.")
    elif market.get("warning"):
        lines.append(f"\n시장가격 데이터 참고: {market['warning']}")
    return "\n".join(lines)


def _growth_phrase(sec_summary: dict, metric: str) -> str:
    row = _metric_row(sec_summary.get("rows", []), metric)
    annual = row.get("annual", [])
    if len(annual) < 2:
        label = METRIC_LABELS.get(metric, metric)
        return f"{label} 추세는 추가 확인이 필요합니다."
    try:
        recent = float(annual[0]["val"])
        prior = float(annual[1]["val"])
        if prior == 0:
            return f"{METRIC_LABELS.get(metric, metric)}은 최근 연도 기준 확인되지만 증가율 계산은 어렵습니다."
        rate = (recent / prior - 1) * 100
        direction = "증가" if rate >= 0 else "감소"
        return f"{METRIC_LABELS.get(metric, metric)}은 최근 연도에 전년 대비 약 {abs(rate):.1f}% {direction}했습니다."
    except Exception:
        return f"{METRIC_LABELS.get(metric, metric)} 추세는 추가 확인이 필요합니다."


def paragraphs_by_theme(paragraphs: list[dict], keywords: list[str], limit: int = 3) -> list[dict]:
    wanted = [kw.lower() for kw in keywords]
    rows = []
    for row in paragraphs:
        blob = f"{row.get('text', '')} {' '.join(row.get('keywords', []))}".lower()
        score = sum(1 for kw in wanted if kw in blob) + int(row.get("score", 0)) / 20
        if score > 0:
            rows.append((score, row))
    rows.sort(key=lambda item: item[0], reverse=True)
    return [row for _, row in rows[:limit]]


def summarize_paragraphs(rows: list[dict], fallback: str) -> str:
    if not rows:
        return fallback
    out = []
    for row in rows:
        keyword_text = _keyword_text(row)
        item = row.get("item") or "공시"
        snippet = _clean_sentence(row.get("text", ""))
        if snippet:
            out.append(f"- **Item {item}**: {snippet} 핵심 논점은 {keyword_text}입니다.")
        else:
            out.append(f"- **Item {item}**: 해당 공시 문단은 {keyword_text}와 관련된 내용을 포함합니다.")
    return "\n".join(out)


def render_report(context: dict) -> str:
    company = context["company"]
    sources = "\n".join(f"- {source}" for source in context.get("sources", []))
    filing_id = f"DART corp_code {company.get('corpCode') or '확인 필요'}" if company.get("market") == "KR" else f"CIK {company.get('cik') or '확인 필요'}"
    style_label = context.get("styleLabel") or "기업 분석"
    return f"""# ✅ {company.get("name", "")} ({company.get("ticker", "")})

> 분석 모드: {style_label}

## 1. 기업 개요

- **기업명**: {company.get("name", "")}
- **Ticker**: {company.get("ticker", "")}
- **섹터 / 산업**: {company.get("sector") or "확인 필요"}
- **상장 시장**: {company.get("market") or "확인 필요"}
- **공시 식별자**: {filing_id}

{context["overview"]}

## 2. 재무 요약

{context["financial_table"]}

{context["financial_commentary"]}

{context["financial_quality"]}

## 3. 밸류에이션 지표

{context["valuation_metrics"]}

## 4. 경쟁력 분석

{context["competitive_analysis"]}

## 5. 리스크 요인

{context["risk_table"]}

{context["risk_commentary"]}

## 6. 성장 전망과 전략

{context["growth_outlook"]}

## 7. 종합 판단

- **가격 대비 내재가치**: Valuation Metrics의 DCF 시나리오 참고
- **장기 투자 적합도**: {context["suitability"]}
- **투자 의견**: 관심종목

{context["conclusion"]}

## 8. 사용 자료

{sources}
"""


def build_rule_report(analysis: dict, analysis_style: str = "beginner") -> str:
    style = normalize_analysis_style(analysis_style)
    company = analysis["company"]
    sec_summary = analysis.get("secFacts", {})
    ranked = analysis.get("rankedFiling", {})
    paragraphs = ranked.get("paragraphs", [])
    sources = []

    metadata = ranked.get("metadata", {}) or {}
    if metadata.get("url"):
        sources.append(f"SEC 10-K HTML: {metadata.get('url')}")
    elif metadata.get("path"):
        sources.append(f"Local official filing fallback ({metadata.get('form', 'filing')}): {metadata.get('path')}")
    if analysis.get("dartFacts", {}).get("ok"):
        sources.append(f"DART Open API: corp_code {analysis['dartFacts'].get('corpCode')}")
    if sec_summary.get("ok"):
        if sec_summary.get("corpCode"):
            sources.append(f"DART financial statements: corp_code {sec_summary.get('corpCode')}")
        else:
            sources.append(f"SEC companyfacts: CIK {sec_summary.get('cik')}")
    for doc in analysis.get("filingDocs", [])[:4]:
        sources.append(f"Local filing · {doc.get('date')} · {doc.get('title')} · {doc.get('url') or doc.get('path')}")
    for doc in analysis.get("supportDocs", [])[:8]:
        sources.append(f"{doc.get('source')} · {doc.get('date')} · {doc.get('title')} · {doc.get('url') or doc.get('path')}")
    if not sources:
        sources.append("로컬 research-inbox 자료 및 사용 가능한 캐시")

    overview = summarize_paragraphs(
        paragraphs_by_theme(paragraphs, ["business", "platform", "segment", "customer", "product", "service"], 3),
        "사업 개요 문단이 충분히 구조화되지 않았습니다. 10-K Item 1 또는 회사 IR 자료를 추가하면 보강할 수 있습니다.",
    )
    financial_commentary = " ".join(
        [
            _growth_phrase(sec_summary, "Revenue"),
            _growth_phrase(sec_summary, "Operating Income"),
            _growth_phrase(sec_summary, "Operating Cash Flow"),
            "CapEx와 현금/부채 항목은 현금흐름의 질과 재무 유연성을 판단하는 보조 지표로 확인해야 합니다.",
        ]
    )
    competitive_analysis = summarize_paragraphs(
        paragraphs_by_theme(paragraphs, ["competition", "scale", "network", "customer", "technology", "data", "brand"], 4),
        "경쟁우위 관련 문단이 제한적입니다. 규모, 네트워크 효과, 고객 전환비용, 기술/데이터 우위를 중심으로 추가 확인이 필요합니다.",
    )
    risks = paragraphs_by_theme(paragraphs, ["risk", "regulation", "competition", "liquidity", "cybersecurity", "insurance", "legal"], 5)
    risk_table = "\n".join(
        [
            "| 리스크 | 설명 | 영향도 |",
            "| --- | --- | --- |",
            *[
                f"| {', '.join(KEYWORD_LABELS.get(str(k).lower(), str(k)) for k in row.get('keywords', [])[:3]) or '리스크'} | Item {row.get('item') or '공시'}에서 해당 리스크 키워드가 반복적으로 감지되었습니다. | 중간 |"
                for row in risks[:5]
            ],
        ]
    )
    if len(risk_table.splitlines()) <= 2:
        risk_table += "\n| 추가 확인 필요 | 10-K Item 1A 발췌가 충분하지 않습니다. | 중간 |"
    risk_commentary = "규칙 기반 리스크 평가는 문단 키워드와 공식 공시 Item 출처를 기준으로 합니다. 실제 투자 판단 전에는 소송, 규제, 재무 레버리지, 경쟁 강도에 대한 최신 공시를 함께 확인해야 합니다."
    growth_outlook = summarize_paragraphs(
        paragraphs_by_theme(paragraphs, ["growth", "strategy", "investment", "margin", "cash flow", "ai", "international", "new products"], 4),
        "성장 전략 관련 문단이 충분하지 않습니다. 경영진 가이던스, 실적발표 transcript, IR deck를 추가하면 성장 전망을 더 정교하게 만들 수 있습니다.",
    )
    suitability = "보통" if sec_summary.get("ok") and paragraphs else "낮음"
    if style == "advanced":
        conclusion = (
            f"{company.get('name')} 분석은 SEC 또는 DART 공식 숫자 데이터와 핵심 공시 문단을 기반으로 구성했습니다. "
            "규칙 기반 고급 모드는 매출 성장, 마진, 현금전환, 밸류에이션 입력값, 리스크 문단의 존재 여부를 압축적으로 연결합니다. "
            "LLM 분석처럼 정성적 경쟁구도와 세그먼트별 민감도를 깊게 확장하지는 못하지만, 확인 가능한 근거와 미확인 gap을 분리해 판단의 출발점을 제공합니다. "
            "다음 단계에서는 최신 실적발표 자료, IR deck, transcript, 비교기업 valuation 자료를 함께 넣으면 risk/reward 판단이 더 정교해집니다."
        )
    else:
        conclusion = (
            f"{company.get('name')} 분석은 SEC 또는 DART 공식 숫자 데이터와 핵심 공시 문단을 기반으로 구성했습니다. "
            "규칙 기반 초심자 모드는 어려운 투자 용어보다 매출, 이익, 현금흐름, 리스크가 왜 중요한지 이해하는 데 초점을 둡니다. "
            "빈 보고서를 내는 대신, 확인 가능한 숫자와 공시 문단에 기반해 투자자가 다음에 확인해야 할 지점을 쉽게 정리합니다. "
            "다음 단계에서는 최신 실적발표 자료, IR deck, 주가/밸류에이션 데이터를 함께 넣으면 결론의 실전성이 높아집니다."
        )

    market_data = analysis.get("marketFinancialData") or fetch_market_valuation_data(company)
    context = {
        "company": company,
        "overview": overview,
        "financial_table": build_financial_table(sec_summary, market_data),
        "financial_commentary": financial_commentary,
        "financial_quality": build_financial_quality_analysis(sec_summary, market_data),
        "valuation_metrics": build_valuation_metrics(company, sec_summary, market_data),
        "competitive_analysis": competitive_analysis,
        "risk_table": risk_table,
        "risk_commentary": risk_commentary,
        "growth_outlook": growth_outlook,
        "suitability": suitability,
        "conclusion": conclusion,
        "sources": sources,
        "styleLabel": analysis_style_label(style),
    }
    return render_report(context)








