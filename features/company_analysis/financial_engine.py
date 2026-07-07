from __future__ import annotations

try:
    import polars as pl
except Exception:  # pragma: no cover - optional dependency fallback
    pl = None


def annual_metric_frame(sec_summary: dict):
    rows = []
    for metric_row in sec_summary.get("rows", []) or []:
        metric = metric_row.get("metric", "")
        concept = metric_row.get("concept", "")
        for item in metric_row.get("annual", []) or []:
            try:
                value = float(item.get("val"))
            except Exception:
                continue
            year = str(str(item.get("end", ""))[:4] or item.get("fy") or "")
            if not year:
                continue
            rows.append({
                "metric": metric,
                "concept": concept,
                "year": year,
                "end": item.get("end", ""),
                "value": value,
            })
    if pl is not None:
        return pl.DataFrame(rows) if rows else pl.DataFrame(schema={"metric": pl.Utf8, "concept": pl.Utf8, "year": pl.Utf8, "end": pl.Utf8, "value": pl.Float64})
    return rows


def latest_value(sec_summary: dict, metric: str, offset: int = 0) -> float | None:
    frame = annual_metric_frame(sec_summary)
    if pl is not None:
        rows = (
            frame
            .filter(pl.col("metric") == metric)
            .sort(["end", "year"], descending=True)
            .select("value")
            .to_series()
            .to_list()
        )
    else:
        rows = [r["value"] for r in sorted([r for r in frame if r["metric"] == metric], key=lambda r: (r["end"], r["year"]), reverse=True)]
    if len(rows) <= offset:
        return None
    return rows[offset]


def annual_values(sec_summary: dict, metric: str, limit: int = 5) -> list[float]:
    frame = annual_metric_frame(sec_summary)
    if pl is not None:
        return (
            frame
            .filter(pl.col("metric") == metric)
            .sort(["end", "year"], descending=True)
            .select("value")
            .head(limit)
            .to_series()
            .to_list()
        )
    return [r["value"] for r in sorted([r for r in frame if r["metric"] == metric], key=lambda r: (r["end"], r["year"]), reverse=True)[:limit]]


def fcf_series(sec_summary: dict, limit: int = 5) -> list[float]:
    cfo = annual_values(sec_summary, "Operating Cash Flow", limit)
    capex = annual_values(sec_summary, "Capital Expenditure", limit)
    return [a - b for a, b in zip(cfo, capex)]


def derived_financials(sec_summary: dict) -> dict:
    cfo = latest_value(sec_summary, "Operating Cash Flow")
    capex = latest_value(sec_summary, "Capital Expenditure")
    revenue = latest_value(sec_summary, "Revenue")
    pretax = latest_value(sec_summary, "Pretax Income")
    tax = latest_value(sec_summary, "Income Tax")
    interest = latest_value(sec_summary, "Interest Expense")
    debt = latest_value(sec_summary, "Long-Term Debt")
    cash = latest_value(sec_summary, "Cash & Equivalents")
    current_assets = latest_value(sec_summary, "Current Assets")
    current_liabilities = latest_value(sec_summary, "Current Liabilities")
    fcf = cfo - capex if cfo is not None and capex is not None else None
    tax_rate = tax / pretax if tax is not None and pretax not in {None, 0} and pretax > 0 else None
    debt_cost = interest / debt if interest is not None and debt not in {None, 0} and debt > 0 else None
    current_ratio = current_assets / current_liabilities if current_assets is not None and current_liabilities not in {None, 0} else None
    return {
        "revenue": revenue,
        "cfo": cfo,
        "capex": capex,
        "fcf": fcf,
        "fcfMargin": fcf / revenue if fcf is not None and revenue not in {None, 0} else None,
        "taxRate": tax_rate,
        "debtCost": debt_cost,
        "currentRatio": current_ratio,
        "cash": cash,
        "debt": debt,
    }


def growth_rate(values: list[float], fallback: float = 0.04) -> float:
    positives = [v for v in values if v and v > 0]
    if len(positives) < 2:
        return fallback
    recent = positives[0]
    old = positives[min(len(positives) - 1, 2)]
    if old <= 0:
        return fallback
    periods = min(len(positives) - 1, 2)
    try:
        cagr = (recent / old) ** (1 / periods) - 1
    except Exception:
        return fallback
    return max(-0.03, min(0.10, cagr))


def dcf_value(base_fcf: float, net_debt: float, shares: float, near_growth: float, discount_rate: float, terminal_growth: float, years: int = 5) -> dict:
    if base_fcf <= 0 or shares <= 0 or discount_rate <= terminal_growth:
        return {"ok": False}
    projected = []
    pv_fcf = 0.0
    for year in range(1, years + 1):
        fcf = base_fcf * ((1 + near_growth) ** year)
        pv = fcf / ((1 + discount_rate) ** year)
        projected.append({"year": year, "fcf": fcf, "pv": pv})
        pv_fcf += pv
    terminal_fcf = projected[-1]["fcf"] * (1 + terminal_growth)
    terminal_value = terminal_fcf / (discount_rate - terminal_growth)
    pv_terminal = terminal_value / ((1 + discount_rate) ** years)
    enterprise_value = pv_fcf + pv_terminal
    equity_value = enterprise_value - net_debt
    return {
        "ok": True,
        "pvFcf": pv_fcf,
        "terminalValue": terminal_value,
        "pvTerminal": pv_terminal,
        "enterpriseValue": enterprise_value,
        "equityValue": equity_value,
        "perShare": equity_value / shares,
    }


def dcf_scenarios(base_fcf: float, net_debt: float, shares: float, base_growth: float) -> list[dict]:
    scenarios = [
        {"name": "보수", "growth": max(-0.02, base_growth - 0.03), "discount": 0.10, "terminal": 0.015},
        {"name": "기준", "growth": base_growth, "discount": 0.09, "terminal": 0.025},
        {"name": "낙관", "growth": min(0.12, base_growth + 0.03), "discount": 0.08, "terminal": 0.03},
    ]
    return [{**s, **dcf_value(base_fcf, net_debt, shares, s["growth"], s["discount"], s["terminal"])} for s in scenarios]

