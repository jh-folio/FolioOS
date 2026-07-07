"""Topic Report v2 스키마 — report_type/evidenceRole enum과 TopicPlan 정규화.

설계 원칙 4(결론은 enum으로 통제): LLM이 무엇을 돌려주든 최종 reportType과
evidenceRole은 코드에서 검증한다. 자유 텍스트 분류를 그대로 신뢰하지 않는다.
"""
from __future__ import annotations

REPORT_TYPE_CHOICES = {
    "macro_analysis",
    "cross_asset_analysis",
    "industry_theme",
    "supply_chain_theme",
    "policy_regulation",
    "geopolitical_risk",
    "earnings_theme",
    "factor_style",
    "company_basket",
    "country_market",
    "portfolio_implication",
    "custom_research",
}
REPORT_TYPE_DEFAULT = "custom_research"

REPORT_TYPE_LABELS = {
    "macro_analysis": "거시 분석",
    "cross_asset_analysis": "크로스에셋 분석",
    "industry_theme": "산업 테마",
    "supply_chain_theme": "공급망 테마",
    "policy_regulation": "정책·규제",
    "geopolitical_risk": "지정학 리스크",
    "earnings_theme": "실적 테마",
    "factor_style": "팩터·스타일",
    "company_basket": "기업군 비교",
    "country_market": "국가 시장",
    "portfolio_implication": "포트폴리오 영향",
    "custom_research": "자유 리서치",
}

# 기존 프리셋의 legacy report_type → v2 enum 매핑 (backward compat)
LEGACY_REPORT_TYPE_MAP = {
    "macro_analysis": "macro_analysis",
    "earnings_analysis": "earnings_theme",
    "weekly_summary": "cross_asset_analysis",
    "industry_analysis": "industry_theme",
    "custom": "custom_research",
}

EVIDENCE_ROLE_CHOICES = {"supporting", "challenging", "neutral", "background", "data_point"}
EVIDENCE_ROLE_DEFAULT = "neutral"

TIME_HORIZON_DEFAULT = "1~2 quarters"

# 설계 §9 보고서 구조 (v2 공통 섹션)
EXPECTED_SECTIONS_V2 = [
    "Executive Summary",
    "질문 정의와 분석 범위",
    "핵심 데이터 대시보드",
    "현재 상황",
    "작동 경로",
    "수혜/피해 자산과 기업",
    "반론과 리스크",
    "시나리오",
    "앞으로 확인할 체크포인트",
    "결론",
    "Source & Data Notes",
]


def normalize_report_type(value, default: str = REPORT_TYPE_DEFAULT) -> str:
    value = str(value or "").strip().lower()
    if value in REPORT_TYPE_CHOICES:
        return value
    return LEGACY_REPORT_TYPE_MAP.get(value, default)


def normalize_evidence_role(value, default: str = EVIDENCE_ROLE_DEFAULT) -> str:
    value = str(value or "").strip().lower()
    return value if value in EVIDENCE_ROLE_CHOICES else default


def _str_list(value, limit: int = 20) -> list[str]:
    if not isinstance(value, list):
        return []
    out = []
    for item in value:
        text = str(item or "").strip()
        if text and text not in out:
            out.append(text)
        if len(out) >= limit:
            break
    return out


def _ticker_map(value, limit: int = 14) -> dict[str, str]:
    if not isinstance(value, dict):
        return {}
    out: dict[str, str] = {}
    for key, label in value.items():
        ticker = str(key or "").strip()
        if not ticker:
            continue
        out[ticker] = str(label or ticker).strip() or ticker
        if len(out) >= limit:
            break
    return out


def normalize_axis(value, index: int = 0) -> dict | None:
    if not isinstance(value, dict):
        return None
    label = str(value.get("label") or "").strip()
    if not label:
        return None
    key = str(value.get("key") or "").strip() or f"axis_{index + 1}"
    return {
        "key": key[:60],
        "label": label[:160],
        "questions": _str_list(value.get("questions"), limit=4),
        "requiredData": _str_list(value.get("requiredData"), limit=8),
        "searchQueries": _str_list(value.get("searchQueries"), limit=6),
    }


def normalize_topic_plan(plan: dict | None, *, topic: str = "", topic_label: str = "") -> dict:
    """TopicPlan을 스키마에 맞게 강제 정규화한다. 누락 필드는 빈 값으로 보장."""
    plan = plan if isinstance(plan, dict) else {}
    axes = []
    for i, axis in enumerate(plan.get("analysisAxes") or []):
        normalized = normalize_axis(axis, i)
        if normalized:
            axes.append(normalized)
        if len(axes) >= 6:
            break
    return {
        "topic": str(plan.get("topic") or topic or "").strip()[:300],
        "topicLabel": str(plan.get("topicLabel") or topic_label or topic or "").strip()[:200],
        "reportType": normalize_report_type(plan.get("reportType")),
        "regions": _str_list(plan.get("regions"), limit=6),
        "assetClasses": _str_list(plan.get("assetClasses"), limit=6),
        "timeHorizon": str(plan.get("timeHorizon") or TIME_HORIZON_DEFAULT).strip()[:60],
        "userIntent": str(plan.get("userIntent") or "investment implication").strip()[:120],
        "researchQuestions": _str_list(plan.get("researchQuestions"), limit=6),
        "analysisAxes": axes,
        "requiredMarketData": _str_list(plan.get("requiredMarketData"), limit=14),
        "requiredMacroData": _str_list(plan.get("requiredMacroData"), limit=10),
        "searchQueries": _str_list(plan.get("searchQueries"), limit=12),
        "memoryQueries": _str_list(plan.get("memoryQueries"), limit=10),
        "candidateTickers": _ticker_map(plan.get("candidateTickers")),
        "expectedSections": _str_list(plan.get("expectedSections"), limit=12) or list(EXPECTED_SECTIONS_V2),
        "dataGapsLikely": _str_list(plan.get("dataGapsLikely"), limit=8),
    }
