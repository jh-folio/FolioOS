"""Structured data-gap resolution metadata for company analysis."""

from __future__ import annotations

from typing import Any


def _truthy_mapping(value: Any) -> dict:
    return value if isinstance(value, dict) else {}


def _has_official_facts(materials: dict) -> tuple[bool, str]:
    sec = _truthy_mapping(materials.get("secFacts"))
    dart = _truthy_mapping(materials.get("dartFacts"))
    if sec.get("ok"):
        return True, "sec_companyfacts" if not sec.get("corpCode") else "dart"
    if dart.get("ok"):
        return True, "dart"
    return False, ""


def _has_filing_narrative(materials: dict) -> tuple[bool, str]:
    ranked = _truthy_mapping(materials.get("rankedFiling"))
    if ranked.get("ok") and ranked.get("paragraphs"):
        source = "local_filing" if _truthy_mapping(ranked.get("metadata")).get("localFallback") else "sec_10k_html"
        return True, source
    if materials.get("filingDocs"):
        return True, "local_filing"
    return False, ""


def _has_market_data(materials: dict) -> bool:
    market = _truthy_mapping(materials.get("marketFinancialData"))
    if market.get("ok") or market.get("available"):
        return True
    return any(market.get(key) not in (None, "", 0) for key in ("price", "marketCap", "pe", "ps", "evToEbitda"))


def _has_recent_operating_update(materials: dict) -> bool:
    for doc in materials.get("supportDocs") or []:
        hay = " ".join([
            str(doc.get("title") or ""),
            " ".join(str(item) for item in doc.get("analysisReasons") or []),
            str(doc.get("source") or ""),
        ]).lower()
        if any(token in hay for token in ["ir", "실적발표", "earnings", "investor", "transcript", "shareholder letter"]):
            return True
    return False


def _attempts(base: list[str], web_search_allowed: bool) -> list[str]:
    out = list(dict.fromkeys(base))
    if web_search_allowed:
        out.append("official_web_search")
    return out


def _gap(
    *,
    field: str,
    label: str,
    severity: str,
    status: str,
    resolved_by: str = "",
    attempts: list[str],
    message: str,
) -> dict:
    return {
        "field": field,
        "label": label,
        "severity": severity,
        "status": status,
        "resolvedBy": resolved_by,
        "attempts": attempts,
        "message": message,
    }


def resolve_company_analysis_gaps(materials: dict, web_search_allowed: bool = False) -> dict:
    """Return structured gap metadata without performing network calls."""

    official_ok, official_source = _has_official_facts(materials)
    filing_ok, filing_source = _has_filing_narrative(materials)
    market_ok = _has_market_data(materials)
    recent_ok = _has_recent_operating_update(materials)

    gaps = [
        _gap(
            field="official_financials",
            label="공식 재무 숫자",
            severity="high",
            status="resolved" if official_ok else "unresolved",
            resolved_by=official_source,
            attempts=_attempts(["sec_companyfacts", "dart"], web_search_allowed),
            message=(
                "SEC companyfacts 또는 DART 재무제표에서 핵심 재무 숫자를 확인했습니다."
                if official_ok
                else "SEC companyfacts와 DART 재무제표에서 핵심 재무 숫자를 확인하지 못했습니다."
            ),
        ),
        _gap(
            field="filing_narrative",
            label="사업·리스크 공시 서술",
            severity="high",
            status="resolved" if filing_ok else "unresolved",
            resolved_by=filing_source,
            attempts=_attempts(["sec_10k_html", "local_filings"], web_search_allowed),
            message=(
                "공식 공시 문단 또는 로컬 공식자료 발췌를 확인했습니다."
                if filing_ok
                else "10-K/DART 공시 문단과 로컬 공식자료 발췌를 확인하지 못했습니다."
            ),
        ),
        _gap(
            field="market_data",
            label="시장 가격·밸류에이션 데이터",
            severity="medium",
            status="resolved" if market_ok else "unresolved",
            resolved_by="market_data" if market_ok else "",
            attempts=_attempts(["market_data"], web_search_allowed),
            message=(
                "가격, 시가총액 또는 밸류에이션 보조 데이터를 확인했습니다."
                if market_ok
                else "가격, 시가총액 또는 밸류에이션 보조 데이터를 확인하지 못했습니다."
            ),
        ),
        _gap(
            field="recent_operating_update",
            label="최근 실적·IR 업데이트",
            severity="medium",
            status="resolved" if recent_ok else "partial",
            resolved_by="local_ir" if recent_ok else "",
            attempts=_attempts(["local_reports", "local_articles_rss"], web_search_allowed),
            message=(
                "로컬 IR, 실적발표, transcript 또는 investor 자료를 확인했습니다."
                if recent_ok
                else "로컬 자료에서 최근 실적·IR 업데이트가 제한적입니다."
            ),
        ),
        _gap(
            field="comparable_context",
            label="비교 기업·섹터 맥락",
            severity="low",
            status="partial",
            resolved_by="supporting_docs" if materials.get("supportDocs") else "",
            attempts=_attempts(["supporting_docs"], web_search_allowed),
            message="비교 기업과 섹터 맥락은 보조 자료가 있을 때만 제한적으로 사용합니다.",
        ),
    ]

    summary = {
        "resolved": sum(1 for gap in gaps if gap["status"] == "resolved"),
        "partial": sum(1 for gap in gaps if gap["status"] == "partial"),
        "unresolved": sum(1 for gap in gaps if gap["status"] == "unresolved"),
        "highSeverityUnresolved": sum(1 for gap in gaps if gap["severity"] == "high" and gap["status"] == "unresolved"),
    }
    return {"gaps": gaps, "summary": summary}
