"""Daily briefing v2 contracts introduced by briefing upgrade Step 0.

This module is intentionally dependency-free.  Step 0 fixes the shape and enum
contracts before Step 1 changes selection or generation behavior.
"""

from __future__ import annotations

from copy import deepcopy
import re


MARKET_SCOPES = frozenset({"us", "kr", "both"})
BRIEFING_TYPES = frozenset({"default", "market_focused", "concise"})
US_SESSION_MODES = frozenset({"us_close", "us_intraday", "us_holiday", "us_off_session"})
KR_SESSION_MODES = frozenset({"kr_close", "kr_intraday", "kr_holiday", "kr_off_session"})
LINK_STATUSES = frozenset({
    "connected",
    "selectively_connected",
    "decoupled",
    "pending_time_lag",
    "independent",
    "insufficient_evidence",
})
FRESHNESS_STATUSES = frozenset({
    "live",
    "partial_live",
    "delayed",
    "close_snapshot",
    "snapshot",
    "stale",
    "unavailable",
})
BODY_AVAILABILITY = frozenset({"full", "summary_only", "headline_only"})
MARKET_IMPACT_STATUSES = frozenset({"measured", "partial", "unavailable"})
VISUAL_MARKETS = frozenset({"US", "KR", "BOTH"})
VISUAL_TYPES = frozenset({"price_series", "market_heatmap", "index_chart"})
VISUAL_FAMILIES = frozenset({"trend", "composition"})
MARKET_TAGS = {"us": "미국장", "kr": "한국장", "both": "종합"}
BRIEFING_TYPE_TAGS = {"default": "기본", "market_focused": "시황중심", "concise": "요약"}


def _scoped_file_stem(date, market_scope=None):
    date_text = str(date or "").strip()
    scope = str(market_scope or "").strip().lower()
    if scope in {"us", "kr"}:
        return f"{date_text}.{scope}"
    return date_text


def briefing_file_name(date, market_scope=None):
    """Return a briefing report filename.

    The no-scope form is kept for legacy read compatibility.  New writes should
    pass ``us`` or ``kr`` and produce one file per market.
    """
    return f"{_scoped_file_stem(date, market_scope)}.json"


def briefing_link_file_name(date):
    """Cross-market connection analysis sidecar for 종합(both) briefings."""
    return f"{_scoped_file_stem(date)}.link.json"


def visual_sidecar_file_name(date, market_scope=None):
    """Large visual constituents are stored beside the dated/scoped report."""
    return f"{_scoped_file_stem(date, market_scope)}.visuals.json"


def visual_sidecar_gzip_file_name(date, market_scope=None):
    """Compressed visual sidecar used by schema v2 reports."""
    return f"{_scoped_file_stem(date, market_scope)}.visuals.json.gz"


def _normalize_enum(value, allowed, default):
    text = str(value or "").strip().lower()
    return text if text in allowed else default


def normalize_market_scope(value):
    return _normalize_enum(value, MARKET_SCOPES, "both")


def normalize_briefing_type(value):
    return _normalize_enum(value, BRIEFING_TYPES, "default")


def briefing_type_instruction(value):
    """Return the shared editorial contract for API, CLI, and rules paths."""
    briefing_type = normalize_briefing_type(value)
    if briefing_type == "market_focused":
        return (
            "기존 섹션을 삭제하지 말고 전체 구성을 유지하세요. 시장 흐름과 핵심 변수의 비중을 높여 "
            "지수·금리·환율·수급·시장 폭·섹터 내부 흐름을 먼저 해석하고, 기업 뉴스도 시장 전체에 "
            "미친 영향과 연결하세요."
        )
    if briefing_type == "concise":
        return (
            "기존 섹션을 모두 유지하되 각 섹션의 한 줄 결론과 가운뎃점 요약 뒤 줄글을 짧게 "
            "압축하세요. 근거 수치, 인과관계, 반대 신호와 체크포인트는 생략하지 마세요."
        )
    return "현재 전체 구성과 분량을 유지하고 기존 섹션의 균형을 바꾸지 마세요."


def normalize_us_session_mode(value):
    return _normalize_enum(value, US_SESSION_MODES, "us_off_session")


def normalize_kr_session_mode(value):
    return _normalize_enum(value, KR_SESSION_MODES, "kr_off_session")


def normalize_link_status(value):
    return _normalize_enum(value, LINK_STATUSES, "insufficient_evidence")


def normalize_freshness(value):
    return _normalize_enum(value, FRESHNESS_STATUSES, "unavailable")


def normalize_body_availability(value):
    return _normalize_enum(value, BODY_AVAILABILITY, "headline_only")


def normalize_market_impact_status(value):
    return _normalize_enum(value, MARKET_IMPACT_STATUSES, "unavailable")


def normalize_briefing_contract(report):
    """Return a backward-compatible v2 view without mutating the saved report.

    Legacy reports keep their canonical markdown and Personal Overlay byte-for-
    byte at the value level.  New structured fields are empty defaults until
    the corresponding implementation Step populates them.
    """
    if not isinstance(report, dict):
        return {}
    out = deepcopy(report)
    out["marketScope"] = normalize_market_scope(out.get("marketScope"))
    out["briefingType"] = normalize_briefing_type(out.get("briefingType"))
    out.setdefault("briefings", {})
    out.setdefault("visualRecommendations", [])
    out.setdefault("visualSnapshots", [])
    out.setdefault("issueCoverage", [])
    return out


def _plain_excerpt(value, limit=240):
    text = re.sub(r"[`*_>#\[\]()-]+", " ", str(value or ""))
    return re.sub(r"\s+", " ", text).strip()[:limit]


def briefing_market_metadata(report, market_scope, section=None):
    source = section if isinstance(section, dict) else {}
    report_date = str(report.get("date") or "").strip()
    scope = normalize_market_scope(market_scope)
    report_scope = normalize_market_scope(report.get("marketScope"))
    briefing_type = normalize_briefing_type(source.get("briefingType") or report.get("briefingType"))
    default_title = {
        "us": f"US Market Briefing — {report_date}",
        "kr": f"KR Market Briefing — {report_date}",
        "both": report.get("title") or f"시장 브리핑 — {report_date}",
    }[scope]
    summary = source.get("summary") or report.get("summary") or _plain_excerpt(
        source.get("markdown") or report.get("markdown")
    )
    # `generationScope` is only written on per-market files produced by a 종합(both)
    # generation; legacy combined `{date}.json` files don't carry it. Explicit
    # (non-normalized) check so a missing field never defaults to "both".
    combined_generation = str(report.get("generationScope") or "").strip().lower() == "both"
    return {
        "id": f"{report_date}:{scope}",
        "reportDate": report_date,
        "reportScope": report_scope,
        "marketScope": scope,
        "briefingType": briefing_type,
        "generatedAt": source.get("generatedAt") or report.get("generatedAt") or "",
        "sessionDate": source.get("sessionDate") or source.get("marketSessionDate") or "",
        "title": str(source.get("title") or default_title),
        "summary": _plain_excerpt(summary),
        "tags": [MARKET_TAGS[scope], BRIEFING_TYPE_TAGS[briefing_type]],
        "combinedGeneration": combined_generation,
    }


def enrich_briefing_sections(
    sections, *, report_date, report_scope, briefing_type, generated_at, report_summary="",
):
    report = {
        "date": report_date,
        "marketScope": report_scope,
        "briefingType": briefing_type,
        "generatedAt": generated_at,
        "summary": report_summary,
    }
    enriched = {}
    for scope, raw in deepcopy(sections or {}).items():
        if scope not in {"us", "kr"} or not isinstance(raw, dict):
            enriched[scope] = deepcopy(raw)
            continue
        section = deepcopy(raw)
        metadata = briefing_market_metadata(report, scope, section)
        section.update({key: metadata[key] for key in (
            "marketScope", "briefingType", "generatedAt", "sessionDate", "title", "summary", "tags",
        )})
        enriched[scope] = section
    return enriched


def briefing_archive_items(report):
    normalized = normalize_briefing_contract(report)
    sections = normalized.get("briefings") or {}
    scopes = [scope for scope in ("us", "kr") if isinstance(sections.get(scope), dict)]
    if scopes:
        return [briefing_market_metadata(normalized, scope, sections[scope]) for scope in scopes]
    return [briefing_market_metadata(normalized, normalized.get("marketScope", "both"), normalized)]


def briefing_export_units(report):
    """Return immutable destination units for market-safe report exports."""
    normalized = normalize_briefing_contract(report)
    sections = normalized.get("briefings") or {}
    report_scope = normalized.get("marketScope", "both")
    if report_scope in {"us", "kr"}:
        scopes = [report_scope]
    else:
        scopes = [scope for scope in ("us", "kr") if isinstance(sections.get(scope), dict)]
    if not scopes:
        scopes = [report_scope]

    units = []
    for scope in scopes:
        source = sections.get(scope) if isinstance(sections.get(scope), dict) else normalized
        unit = briefing_scope_view(normalized, scope)
        unit.update(briefing_market_metadata(normalized, scope, source))
        units.append(unit)
    return units


def briefing_scope_view(report, market_scope=None):
    out = normalize_briefing_contract(report)
    scope = normalize_market_scope(market_scope or out.get("marketScope"))
    if scope == "both" or not out.get("briefings"):
        return out
    scoped = out.get("briefings", {}).get(scope)
    if not isinstance(scoped, dict):
        return out
    view = deepcopy(out)
    view["marketScope"] = scope
    view["markdown"] = scoped.get("markdown", view.get("markdown", ""))
    view["sources"] = scoped.get("sources", view.get("sources", []))
    view["generation"] = scoped.get("generation", view.get("generation", {}))
    return view


def split_market_markdown(markdown, market_scope="both"):
    """Split an agent/LLM combined response into stored market sections."""
    text = str(markdown or "").strip()
    scope = normalize_market_scope(market_scope)
    if scope in {"us", "kr"}:
        return {scope: {"markdown": text}}
    starts = []
    for key, pattern in (
        ("us", r"(?m)^#\s+US Market Briefing\b"),
        ("kr", r"(?m)^#\s+Korea Market Briefing\b"),
        ("link", r"(?m)^##\s+한미 시장 연결 요약\b"),
    ):
        match = re.search(pattern, text)
        if match:
            starts.append((match.start(), key))
    starts.sort()
    if not starts:
        return {}
    result = {}
    for index, (start, key) in enumerate(starts):
        end = starts[index + 1][0] if index + 1 < len(starts) else len(text)
        result[key] = {"markdown": text[start:end].strip()}
    return result


def merge_briefing_report(report, existing, market_scope="both"):
    """Merge one regenerated market without discarding its sibling scope."""
    if not isinstance(existing, dict):
        return report
    merged = deepcopy(report)
    scope = normalize_market_scope(market_scope)
    if scope != "both":
        scopes = deepcopy(existing.get("briefings") or {})
        incoming_sections = deepcopy(report.get("briefings") or {})
        if incoming_sections:
            scopes.update(incoming_sections)
        elif scopes and report.get("markdown"):
            scopes[scope] = {
                **deepcopy(scopes.get(scope) or {}),
                "markdown": report.get("markdown", ""),
                "sources": deepcopy(report.get("sources") or []),
                "generation": deepcopy(report.get("generation") or {}),
            }
        if incoming_sections or scopes:
            merged["briefings"] = scopes
        if incoming_sections:
            ordered = [scopes.get("us", {}).get("markdown", ""), scopes.get("kr", {}).get("markdown", "")]
            link = scopes.get("link", {}).get("markdown", "")
            merged["markdown"] = "\n\n---\n\n".join(part for part in ordered + [link] if part)
        target_market = scope.upper()
        for field in ("visualRecommendations", "visualSnapshots"):
            preserved = [
                item for item in deepcopy(existing.get(field) or [])
                if str(item.get("market") or "").upper() != target_market
            ]
            incoming = deepcopy(report.get(field) or [])
            merged[field] = preserved + incoming
    if existing.get("personalOverlay"):
        overlay = deepcopy(existing["personalOverlay"])
        if existing.get("markdown") != merged.get("markdown"):
            overlay["stale"] = True
        merged["personalOverlay"] = overlay
    return merged


def visual_snapshot_errors(snapshot):
    """Validate the minimum reproducibility metadata for a stored visual."""
    if not isinstance(snapshot, dict):
        return ["snapshot must be an object"]
    errors = []
    for field in ("id", "type", "market", "asOf", "provider", "freshness", "coverage"):
        if not snapshot.get(field):
            errors.append(f"missing {field}")
    market = str(snapshot.get("market") or "").upper()
    if market and market not in VISUAL_MARKETS:
        errors.append("invalid market")
    freshness = str(snapshot.get("freshness") or "").lower()
    if freshness and freshness not in FRESHNESS_STATUSES:
        errors.append("invalid freshness")
    visual_type = str(snapshot.get("type") or "").lower()
    if visual_type and visual_type not in VISUAL_TYPES:
        errors.append("invalid type")
    if visual_type in {"price_series", "market_heatmap"}:
        for field in ("marketSessionDate", "timezone", "currency"):
            if not snapshot.get(field):
                errors.append(f"missing {field}")
        coverage = snapshot.get("coverage")
        if not isinstance(coverage, dict):
            errors.append("coverage must be an object")
        elif coverage.get("status") not in {"complete", "partial", "unavailable"}:
            errors.append("invalid coverage status")
        if str(snapshot.get("asOf") or "")[:10] > str(snapshot.get("marketSessionDate") or "")[:10]:
            errors.append("asOf exceeds marketSessionDate")
    return errors


def visual_recommendation_errors(recommendation):
    if not isinstance(recommendation, dict):
        return ["recommendation must be an object"]
    errors = []
    for field in ("id", "snapshotId", "market", "role", "family", "variant", "title", "renderer"):
        if not recommendation.get(field):
            errors.append(f"missing {field}")
    if recommendation.get("family") not in VISUAL_FAMILIES:
        errors.append("invalid family")
    if str(recommendation.get("market") or "").upper() not in VISUAL_MARKETS:
        errors.append("invalid market")
    return errors
