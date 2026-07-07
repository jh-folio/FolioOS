"""Detect report sections that need focused improvement."""
from __future__ import annotations


CHECK_TO_SECTION = {
    "topic_answered": ("executive_summary", "핵심 결론/현재 판단"),
    "scope_defined": ("scope", "분석 범위"),
    "data_coverage": ("evidence_coverage", "근거 커버리지"),
    "source_coverage": ("source_notes", "Source & Data Notes"),
    "numeric_support": ("numeric_support", "수치 근거"),
    "counterargument_present": ("counterarguments", "반론과 리스크"),
    "scenario_quality": ("scenarios", "시나리오"),
    "checkpoint_quality": ("checkpoints", "체크포인트"),
    "source_grounding": ("source_grounding", "출처 연결"),
    "hallucination_risk": ("data_limits", "데이터 한계"),
    "personal_bias_risk": ("counterarguments", "확증편향 방지"),
}


def detect_weak_sections(quality: dict | None, preflight: dict | None = None) -> list[dict]:
    quality = quality or {}
    preflight = preflight or {}
    checks = quality.get("checks") or {}
    warnings = [str(x).strip() for x in quality.get("warnings") or [] if str(x).strip()]
    fixes = [str(x).strip() for x in quality.get("suggestedFixes") or [] if str(x).strip()]
    risks = [str(x).strip() for x in preflight.get("risks") or [] if str(x).strip()]
    rows: dict[str, dict] = {}

    def add(section: str, label: str, reason: str, priority: int = 2, action: str = ""):
        current = rows.get(section)
        item = {
            "section": section,
            "label": label,
            "reason": reason,
            "priority": priority,
            "action": action,
        }
        if not current or priority < int(current.get("priority", 9)):
            rows[section] = item

    for key, value in checks.items():
        try:
            score = float(value)
        except (TypeError, ValueError):
            continue
        if score >= 0.55:
            continue
        section, label = CHECK_TO_SECTION.get(key, (key, key))
        add(section, label, f"{key} 점수가 낮습니다({score:.2f}).", 1 if score < 0.35 else 2)

    for warning in warnings:
        low = warning.lower()
        if "반론" in warning or "리스크" in warning or "counter" in low:
            add("counterarguments", "반론과 리스크", warning, 1, "반대 근거와 판단이 틀릴 조건을 구체화")
        elif "체크포인트" in warning:
            add("checkpoints", "체크포인트", warning, 1, "관찰 가능한 지표와 조건으로 재작성")
        elif "숫자" in warning or "수치" in warning:
            add("numeric_support", "수치 근거", warning, 2, "확인된 숫자만 남기고 미확인 수치는 한계로 표시")
        elif "자료" in warning or "source" in low or "근거" in warning:
            add("source_notes", "Source & Data Notes", warning, 2, "근거 범위와 dataGap을 명시")

    for risk in risks:
        if "dataGap" in risk or "자료" in risk or "marketTape" in risk:
            add("source_notes", "Source & Data Notes", risk, 2, "현재 자료 부족과 확인 경로를 명시")
        if "반론" in risk:
            add("counterarguments", "반론과 리스크", risk, 1, "challenging evidence 또는 반증 조건을 추가")
        if "체크포인트" in risk:
            add("checkpoints", "체크포인트", risk, 1, "구조화 체크포인트를 추가")

    for fix in fixes[:4]:
        add("source_notes", "Source & Data Notes", fix, 3, fix)

    return sorted(rows.values(), key=lambda item: (item["priority"], item["section"]))[:6]
