"""Deterministic, public-safe ticker research-context links.

All inputs are injected projections. Portfolio and watchlist rows contribute
membership only; private position values and note bodies are never copied.
"""
from __future__ import annotations

import hashlib
import re
import unicodedata
from collections.abc import Mapping, Sequence
from typing import Any

from features.investment_review.context_schema import (
    CollectionContextLink,
    DueCheckpointLink,
    InvestmentStance,
    LinkedReport,
    MarketDriverLink,
    ThesisVerdict,
    TickerContextSource,
    TickerResearchContext,
)


_KOREAN_TICKER = re.compile(r"^(\d{6})(?:\.(?:KS|KQ))?$")
_SAFE_TICKER = re.compile(r"^[A-Z0-9-]{1,12}$")
_REFERENCE_ID = re.compile(r"^[A-Za-z0-9:._-]{1,200}$")
_MOMENTUM = {"strengthening", "stable", "fading", "turning", "conflicted"}
_REPORT_TYPES = {"briefing", "analysis", "topic"}
_VERDICTS = {item.value for item in ThesisVerdict}


def normalize_research_ticker(value: object) -> str:
    text = unicodedata.normalize("NFKC", str(value or "")).strip().upper().lstrip("$")
    korean = _KOREAN_TICKER.fullmatch(text)
    if korean:
        return korean.group(1)
    text = text.replace(".", "-")
    return text if _SAFE_TICKER.fullmatch(text) else ""


def _ticker_from_row(row: object) -> str:
    if isinstance(row, Mapping):
        return normalize_research_ticker(
            row.get("ticker") or row.get("symbol") or row.get("keyword")
        )
    return normalize_research_ticker(row)


def _membership(
    positions: Sequence[object] | None,
    watchlist: Sequence[object] | None,
) -> dict[str, set[str]]:
    members: dict[str, set[str]] = {}
    for source, rows in (("portfolio", positions or ()), ("watchlist", watchlist or ())):
        for row in rows:
            ticker = _ticker_from_row(row)
            if ticker:
                members.setdefault(ticker, set()).add(source)
    return members


def _source(values: set[str]) -> TickerContextSource:
    if values == {"portfolio", "watchlist"}:
        return TickerContextSource.BOTH
    if "portfolio" in values:
        return TickerContextSource.PORTFOLIO
    return TickerContextSource.WATCHLIST


def _market_drivers(regime_states: Sequence[object], ticker: str) -> tuple[MarketDriverLink, ...]:
    rows: list[MarketDriverLink] = []
    for state in regime_states:
        if not isinstance(state, Mapping):
            continue
        linked = {
            normalize_research_ticker(value)
            for value in (state.get("linkedCompanies") or ())
        }
        if ticker not in linked:
            continue
        label = str(
            state.get("stateLabel")
            or state.get("storyFamily")
            or state.get("story")
            or state.get("stateKey")
            or ""
        ).strip()[:160]
        state_id = str(
            state.get("id") or state.get("stateId") or state.get("stateKey") or label
        ).strip()[:200]
        if not label or not state_id:
            continue
        if _REFERENCE_ID.fullmatch(state_id) is None:
            state_id = "reg_" + hashlib.sha256(label.encode("utf-8")).hexdigest()[:16]
        momentum = str(state.get("momentum") or "").strip().lower()
        rows.append(
            MarketDriverLink(
                stateId=state_id,
                label=label,
                momentum=momentum if momentum in _MOMENTUM else "unknown",
            )
        )
    return tuple(sorted(set(rows), key=lambda row: (row.label.casefold(), row.stateId))[:6])


def _latest_verdict(thesis_deltas: Sequence[object], ticker: str) -> ThesisVerdict:
    candidates: list[tuple[str, str]] = []
    for delta in thesis_deltas:
        if not isinstance(delta, Mapping) or _ticker_from_row(delta) != ticker:
            continue
        generated_at = str(delta.get("generatedAt") or delta.get("generated_at") or "")
        verdict = str(delta.get("verdict") or "").strip().lower()
        candidates.append((generated_at, verdict))
    if not candidates:
        return ThesisVerdict.UNKNOWN
    verdict = max(candidates, key=lambda row: (row[0], row[1]))[1]
    return ThesisVerdict(verdict if verdict in _VERDICTS else ThesisVerdict.INSUFFICIENT_EVIDENCE)


def _due_checkpoints(rows: Sequence[object], ticker: str) -> tuple[DueCheckpointLink, ...]:
    projected: dict[str, DueCheckpointLink] = {}
    for row in rows:
        if not isinstance(row, Mapping) or _ticker_from_row(row) != ticker:
            continue
        label = str(
            row.get("checkpoint") or row.get("label") or row.get("title") or ""
        ).strip()[:240]
        checkpoint_id = str(row.get("id") or "").strip()[:200]
        if not label or not checkpoint_id:
            continue
        due_at = row.get("dueAt") or row.get("due_at")
        projected[checkpoint_id] = DueCheckpointLink(
            id=checkpoint_id,
            label=label,
            dueAt=str(due_at) if due_at else None,
        )
    return tuple(
        sorted(
            projected.values(),
            key=lambda row: (row.dueAt or "9999-12-31T23:59:59Z", row.label.casefold(), row.id),
        )[:8]
    )


def _report_tickers(row: Mapping[str, Any]) -> set[str]:
    values: list[object] = []
    values.extend(row.get("tickers") or ())
    if row.get("ticker"):
        values.append(row["ticker"])
    company = row.get("company")
    if isinstance(company, Mapping) and company.get("ticker"):
        values.append(company["ticker"])
    custom = row.get("customTickers")
    if isinstance(custom, Mapping):
        values.extend(custom.keys())
    return {ticker for value in values if (ticker := normalize_research_ticker(value))}


def _linked_reports(rows: Sequence[object], ticker: str) -> tuple[LinkedReport, ...]:
    candidates: list[tuple[str, LinkedReport]] = []
    for row in rows:
        if not isinstance(row, Mapping) or ticker not in _report_tickers(row):
            continue
        report_id = str(row.get("id") or row.get("reportId") or "").strip()[:200]
        title = str(
            row.get("title") or row.get("topicLabel") or row.get("headline") or report_id
        ).strip()[:240]
        if not report_id or not title:
            continue
        raw_type = str(row.get("type") or row.get("reportType") or "").strip().lower()
        report_type = raw_type if raw_type in _REPORT_TYPES else "unknown"
        sort_time = str(row.get("generatedAt") or row.get("date") or "")
        candidates.append(
            (
                sort_time,
                LinkedReport(
                    id=report_id,
                    title=title,
                    reportType=report_type,
                ),
            )
        )
    candidates.sort(key=lambda item: (item[0], item[1].id), reverse=True)
    return tuple(item[1] for item in candidates[:8])


def build_ticker_research_contexts(
    *,
    positions: Sequence[object] | None,
    watchlist: Sequence[object] | None,
    regime_states: Sequence[object] | None,
    thesis_deltas: Sequence[object] | None,
    due_checkpoints: Sequence[object] | None,
    reports: Sequence[object] | None,
    collections: Sequence[object] | None,
    collection_results: Sequence[object] | None,
    collection_health: Mapping[str, object] | None,
    observed_at: str | None,
) -> tuple[TickerResearchContext, ...]:
    from features.investment_review.service import _impact_for
    from features.smart_collections.service import project_ticker_collection_links

    members = _membership(positions, watchlist)
    collection_links = (
        project_ticker_collection_links(
            collections,
            external_results=collection_results or (),
            health_by_collection=collection_health or {},
        )
        if collections is not None
        else {}
    )
    unavailable = tuple(
        code
        for source, code in (
            (regime_states, "market_memory_unavailable"),
            (thesis_deltas, "thesis_unavailable"),
            (due_checkpoints, "checkpoints_unavailable"),
            (reports, "reports_unavailable"),
            (collections, "collections_unavailable"),
        )
        if source is None
    )

    contexts: list[TickerResearchContext] = []
    for ticker in sorted(members):
        drivers = _market_drivers(regime_states or (), ticker)
        verdict = (
            _latest_verdict(thesis_deltas or (), ticker)
            if thesis_deltas is not None
            else ThesisVerdict.UNKNOWN
        )
        stance = (
            InvestmentStance.UNKNOWN
            if regime_states is None or thesis_deltas is None
            else InvestmentStance(
                _impact_for(
                    [driver.model_dump(mode="json") for driver in drivers],
                    verdict.value if verdict is not ThesisVerdict.UNKNOWN else "",
                )
            )
        )
        links = tuple(
            CollectionContextLink.model_validate(link)
            for link in collection_links.get(ticker, ())[:8]
        )
        contexts.append(
            TickerResearchContext(
                ticker=ticker,
                source=_source(members[ticker]),
                stance=stance,
                observedAt=observed_at,
                reasonCodes=unavailable,
                marketDrivers=drivers,
                latestThesisVerdict=verdict,
                dueCheckpoints=_due_checkpoints(due_checkpoints or (), ticker),
                linkedReports=_linked_reports(reports or (), ticker),
                collections=links,
            )
        )
    return tuple(contexts)


__all__ = ["build_ticker_research_contexts", "normalize_research_ticker"]
