from __future__ import annotations

import json
import unicodedata
from dataclasses import dataclass, replace
from typing import Mapping, assert_never

from features.market_memory.market_state_ref import (
    JsonValue,
    MarketStateContractError,
    MarketStateRefQuery,
    MarketStateResolution,
    Policy,
    Scope,
    load_market_state_snapshot,
    resolve_market_state_ref,
    resolve_market_state_scope,
)


@dataclass(frozen=True, slots=True)
class MarketStateSelection:
    policy: str
    requested_scope: str
    regions: tuple[str, ...] = ()
    collection_market: str | None = None


@dataclass(frozen=True, slots=True)
class MarketStateProjection:
    resolution: MarketStateResolution
    context: dict[str, JsonValue] | None


def _token(value: str) -> str:
    return unicodedata.normalize("NFKC", value).strip().casefold()


def _bounded_context(snapshot: Mapping[str, JsonValue], scope: Scope) -> dict[str, JsonValue]:
    views = snapshot.get("marketViews")
    key = {"GLOBAL": "overall", "US": "us", "KR": "kr"}[scope]
    view = views.get(key) if isinstance(views, dict) and isinstance(views.get(key), dict) else snapshot
    drivers = view.get("keyDrivers")
    bounded_drivers = [
        {field: str(driver.get(field) or "")[:700] for field in ("title", "summary", "marketImpact", "nextMemoryCheck")}
        for driver in (drivers if isinstance(drivers, list) else [])[:5]
        if isinstance(driver, dict)
    ]
    return {
        "layer": "source-grounded",
        "evidenceRole": "context_only",
        "scope": scope,
        "headline": str(view.get("headline") or snapshot.get("headline") or "")[:160],
        "summary": str(view.get("marketInterpretation") or snapshot.get("oneLineSummary") or "")[:700],
        "drivers": bounded_drivers,
        "counterEvidence": [str(item)[:300] for item in (view.get("counterEvidence") or snapshot.get("counterEvidence") or [])[:5]],
        "uncertainties": [str(item)[:300] for item in (view.get("uncertainties") or snapshot.get("uncertainties") or [])[:5]],
    }


def project_market_state(selection: MarketStateSelection, query: MarketStateRefQuery) -> MarketStateProjection:
    policies: dict[str, Policy] = {"exclude": "exclude", "include_current": "include_current"}
    policy = policies.get(_token(selection.policy))
    if policy is None:
        raise MarketStateContractError("policy", selection.policy)
    scope = resolve_market_state_scope(
        selection.requested_scope,
        regions=selection.regions,
        collection_market=selection.collection_market,
    )
    requested = _token(selection.requested_scope).upper()
    match policy:
        case "exclude":
            resolution: MarketStateResolution = {
                "policy": "exclude",
                "requestedScope": requested,
                "resolvedScope": scope,
                "injected": False,
                "reason": "policy_excluded",
                "ref": None,
            }
            return MarketStateProjection(resolution, None)
        case "include_current":
            pass
        case unreachable:
            assert_never(unreachable)
    scoped_query = replace(query, scope=scope)
    ref = resolve_market_state_ref(scoped_query)
    reason = {
        "current": "current_injected",
        "stale": "stale_not_injected",
        "fallback": "fallback_not_injected",
        "empty": "empty_not_injected",
    }[str(ref["status"])]
    resolution = {
        "policy": "include_current",
        "requestedScope": requested,
        "resolvedScope": scope,
        "injected": ref["status"] == "current",
        "reason": reason,
        "ref": ref,
    }
    snapshot = load_market_state_snapshot(scoped_query.market_db_path)
    context = _bounded_context(snapshot, scope) if snapshot is not None and ref["status"] == "current" else None
    return MarketStateProjection(resolution, context)


def render_market_state_projection(projection: MarketStateProjection) -> str:
    ref = projection.resolution["ref"]
    ref_dict = ref if isinstance(ref, dict) else None
    status = ref_dict["status"] if ref_dict else "excluded"
    as_of = ref_dict["asOf"] if ref_dict and ref_dict["asOf"] else "null"
    lines = [
        "## Market State Reference",
        f"- status: {status}",
        f"- asOf: {as_of}",
        f"- reason: {projection.resolution['reason']}",
        f"- scope: {projection.resolution['resolvedScope']}",
    ]
    if ref_dict is not None:
        lines.extend([
            f"- freshnessReason: {ref_dict['freshnessReason']}",
            f"- sourceKind: {ref_dict['sourceKind']}",
            f"- resolvedAt: {ref_dict['resolvedAt']}",
        ])
    context = projection.context
    if context is None:
        return "\n".join(lines)
    lines.extend([
        "",
        "## Market State Context",
        "- evidenceRole: context_only",
        f"- headline: {context['headline']}",
        f"- summary: {context['summary']}",
    ])
    for section, label in (
        ("drivers", "Drivers"),
        ("counterEvidence", "Counter Evidence"),
        ("uncertainties", "Uncertainties"),
    ):
        items = context[section]
        if not isinstance(items, list) or not items:
            continue
        lines.extend(["", f"### {label}"])
        lines.extend(
            f"- {json.dumps(item, ensure_ascii=False, sort_keys=True) if isinstance(item, dict) else item}"
            for item in items
        )
    return "\n".join(lines)


def attach_market_state_resolution(
    artifact: Mapping[str, JsonValue], resolution: MarketStateResolution,
) -> dict[str, JsonValue]:
    attached = dict(artifact)
    attached["marketStateResolution"] = resolution
    return attached
