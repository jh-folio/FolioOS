from __future__ import annotations

from collections.abc import Callable, Iterable

try:
    import polars as pl
except Exception:  # pragma: no cover - optional dependency fallback
    pl = None


def polars_enabled() -> bool:
    return pl is not None


def sort_records(records: Iterable[dict], fields: list[str], descending: bool | list[bool] = True) -> list[dict]:
    rows = list(records or [])
    if not rows:
        return []
    if pl is None:
        return sorted(rows, key=lambda row: tuple(row.get(field, 0) or 0 for field in fields), reverse=bool(descending))
    try:
        sort_rows = []
        for idx, row in enumerate(rows):
            sort_row = {"_idx": idx}
            for field in fields:
                value = row.get(field)
                if value is None:
                    value = "" if field.lower().endswith(("date", "time")) else 0
                sort_row[field] = value
            sort_rows.append(sort_row)
        frame = pl.DataFrame(sort_rows)
        if isinstance(descending, list):
            reverse_flags = descending
        else:
            reverse_flags = [bool(descending)] * len(fields)
        order = frame.sort(fields, descending=reverse_flags).get_column("_idx").to_list()
        return [rows[int(idx)] for idx in order]
    except Exception:
        return sorted(rows, key=lambda row: tuple(row.get(field, 0) or 0 for field in fields), reverse=True)


def top_records(records: Iterable[dict], fields: list[str], limit: int, descending: bool | list[bool] = True) -> list[dict]:
    return sort_records(records, fields, descending=descending)[: max(0, int(limit or 0))]


def filter_archive_records(records: Iterable[dict], start_iso: str = "", end_iso: str = "", source: str = "") -> list[dict]:
    rows = list(records or [])
    if not rows:
        return []
    if pl is None:
        out = []
        for row in rows:
            value = row.get("timestampSort") or ""
            if (start_iso or end_iso) and not value:
                continue
            if start_iso and value and value < start_iso:
                continue
            if end_iso and value and value > end_iso:
                continue
            if source and row.get("source") != source:
                continue
            out.append(row)
        return out
    try:
        frame = pl.DataFrame([
            {
                "_idx": row.get("_idx"),
                "timestampSort": row.get("timestampSort") or "",
                "source": row.get("source") or "",
            }
            for row in rows
        ])
        expr = pl.lit(True)
        if start_iso or end_iso:
            expr = expr & pl.col("timestampSort").cast(pl.Utf8).str.len_chars().gt(0)
        if start_iso:
            expr = expr & (pl.col("timestampSort") >= start_iso)
        if end_iso:
            expr = expr & (pl.col("timestampSort") <= end_iso)
        if source:
            expr = expr & (pl.col("source") == source)
        idxs = frame.filter(expr).get_column("_idx").to_list()
        by_idx = {row["_idx"]: row for row in rows}
        return [by_idx[idx] for idx in idxs if idx in by_idx]
    except Exception:
        out = []
        for row in rows:
            value = row.get("timestampSort") or ""
            if (start_iso or end_iso) and not value:
                continue
            if start_iso and value and value < start_iso:
                continue
            if end_iso and value and value > end_iso:
                continue
            if source and row.get("source") != source:
                continue
            out.append(row)
        return out


def aggregate_portfolio(rows: Iterable[dict]) -> dict:
    items = list(rows or [])
    if not items:
        return {"rows": [], "summary": []}
    if pl is None:
        totals = {}
        costs = {}
        counts = {}
        for row in items:
            currency = row.get("quoteCurrency") or row.get("currency") or "USD"
            market_value = row.get("marketValue")
            cost = row.get("cost")
            if market_value is not None:
                totals[currency] = totals.get(currency, 0.0) + float(market_value)
                counts[currency] = counts.get(currency, 0) + 1
            if cost is not None:
                costs[currency] = costs.get(currency, 0.0) + float(cost)
        for row in items:
            currency = row.get("quoteCurrency") or row.get("currency") or "USD"
            total = totals.get(currency, 0.0)
            row["weight"] = (row.get("marketValue") / total) if total and row.get("marketValue") is not None else None
        summary = []
        for currency, total in totals.items():
            cost = costs.get(currency, 0.0)
            summary.append({
                "currency": currency,
                "marketValue": total,
                "cost": cost,
                "pnl": total - cost if cost else None,
                "pnlPct": ((total - cost) / cost) if cost else None,
                "positions": counts.get(currency, 0),
            })
        return {"rows": items, "summary": summary}
    try:
        frame = pl.DataFrame(items)
        frame = frame.with_columns([
            pl.col("quoteCurrency").fill_null(pl.col("currency")).fill_null("USD").alias("_currency"),
            pl.col("marketValue").cast(pl.Float64, strict=False).alias("_marketValue"),
            pl.col("cost").cast(pl.Float64, strict=False).alias("_cost"),
        ])
        totals = frame.group_by("_currency").agg([
            pl.col("_marketValue").sum().alias("_total"),
            pl.col("_cost").sum().alias("_costTotal"),
            pl.col("_marketValue").is_not_null().sum().alias("_positions"),
        ])
        frame = frame.join(totals.select(["_currency", "_total"]), on="_currency", how="left")
        frame = frame.with_columns(
            pl.when((pl.col("_total") > 0) & pl.col("_marketValue").is_not_null())
            .then(pl.col("_marketValue") / pl.col("_total"))
            .otherwise(None)
            .alias("weight")
        )
        out_rows = frame.drop(["_currency", "_marketValue", "_cost", "_total"]).to_dicts()
        summary = []
        for row in totals.to_dicts():
            total = row.get("_total") or 0.0
            cost = row.get("_costTotal") or 0.0
            summary.append({
                "currency": row.get("_currency") or "USD",
                "marketValue": total,
                "cost": cost,
                "pnl": total - cost if cost else None,
                "pnlPct": ((total - cost) / cost) if cost else None,
                "positions": int(row.get("_positions") or 0),
            })
        return {"rows": out_rows, "summary": summary}
    except Exception:
        saved = pl
        try:
            globals()["pl"] = None
            return aggregate_portfolio(items)
        finally:
            globals()["pl"] = saved


def aggregate_counts(records: Iterable[dict], key_fn: Callable[[dict], str], latest_field: str = "date") -> list[dict]:
    rows = []
    for idx, record in enumerate(records or []):
        key = key_fn(record)
        if not key:
            continue
        rows.append({"_idx": idx, "key": key, "latest": record.get(latest_field, "")})
    if not rows:
        return []
    if pl is None:
        counts = {}
        for row in rows:
            entry = counts.setdefault(row["key"], {"key": row["key"], "count": 0, "latest": ""})
            entry["count"] += 1
            entry["latest"] = max(entry["latest"], row["latest"])
        return sorted(counts.values(), key=lambda item: (item["count"], item["latest"]), reverse=True)
    try:
        return (
            pl.DataFrame(rows)
            .group_by("key")
            .agg([pl.len().alias("count"), pl.col("latest").max().alias("latest")])
            .sort(["count", "latest"], descending=True)
            .to_dicts()
        )
    except Exception:
        saved = pl
        try:
            globals()["pl"] = None
            return aggregate_counts(records, key_fn, latest_field=latest_field)
        finally:
            globals()["pl"] = saved

