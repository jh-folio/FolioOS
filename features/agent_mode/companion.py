from __future__ import annotations

from features.agent_mode.schema import scrub_secrets

SAFE_CONTEXT_FIELDS = {
    "surface",
    "viewId",
    "reportKind",
    "reportId",
    "marketScope",
    "selectedText",
    "visibleSection",
    "portfolioLinked",
}

TASK_VERBS = (
    "수정",
    "추가",
    "다시 써",
    "재작성",
    "보강",
    "생성",
    "업데이트",
    "정리해줘",
    "설정",
    "자동화",
    "writeback",
    "rewrite",
    "revise",
    "update",
    "create",
    "schedule",
)


def normalize_agent_context(raw: dict | None) -> dict:
    raw = scrub_secrets(raw or {})
    out = {}
    for field in SAFE_CONTEXT_FIELDS:
        value = raw.get(field)
        if field == "portfolioLinked":
            out[field] = bool(value)
        else:
            out[field] = str(value or "").strip()[:2000]
    out.setdefault("portfolioLinked", False)
    return {
        "surface": out.get("surface", ""),
        "viewId": out.get("viewId", ""),
        "reportKind": out.get("reportKind", ""),
        "reportId": out.get("reportId", ""),
        "marketScope": out.get("marketScope", ""),
        "selectedText": out.get("selectedText", ""),
        "visibleSection": out.get("visibleSection", ""),
        "portfolioLinked": bool(out.get("portfolioLinked")),
    }


def classify_agent_intent(message: str) -> str:
    text = str(message or "").strip().lower()
    if any(verb in text for verb in TASK_VERBS):
        return "task"
    return "companion"


VALID_EFFORT_LEVELS = {"low", "medium", "high", "max"}


def normalize_agent_options(raw: dict | None) -> dict:
    """채팅 도구 옵션(모델 버전·노력 단계·첨부파일)을 코드에서 정규화한다.

    첨부파일 본문은 hypothesis/참고 입력일 뿐 evidence로 승격하지 않는다.
    """
    raw = raw if isinstance(raw, dict) else {}
    effort = str(raw.get("effort") or "medium").strip().lower()
    attachments = []
    for item in (raw.get("attachments") or [])[:5]:
        if not isinstance(item, dict):
            continue
        name = str(item.get("name") or "").strip()[:120]
        if not name:
            continue
        try:
            size = max(0, int(item.get("size") or 0))
        except (TypeError, ValueError):
            size = 0
        attachments.append({
            "name": name,
            "size": size,
            "content": str(item.get("content") or "")[:4000],
        })
    return {
        "model": str(raw.get("model") or "").strip()[:80],
        "effort": effort if effort in VALID_EFFORT_LEVELS else "medium",
        "attachments": attachments,
    }


def _surface_actions(context: dict) -> list[dict]:
    report_kind = context.get("reportKind", "")
    view_id = context.get("viewId", "")
    actions = [
        {"id": "explain_counterpoints", "label": "반대 근거 보기", "requiresApproval": False},
        {"id": "portfolio_impact", "label": "포트폴리오 영향 보기", "requiresApproval": False},
    ]
    if report_kind in {"briefing", "company_analysis", "topic_report"}:
        actions.append({"id": "create_personal_overlay", "label": "Personal Overlay 생성", "requiresApproval": True})
    if view_id in {"memory", "market_memory"}:
        actions.append({"id": "refresh_market_memory_digest", "label": "Market Memory 최신화", "requiresApproval": True})
    return actions


def agent_companion_reply(message: str, context: dict | None = None, options: dict | None = None) -> dict:
    normalized = normalize_agent_context(context)
    normalized_options = normalize_agent_options(options)
    mode = classify_agent_intent(message)
    if mode == "task":
        return {
            "ok": True,
            "mode": "task",
            "message": "작업 요청으로 이해했습니다. 실행 전에 계획과 저장될 대상을 먼저 확인해야 합니다.",
            "context": normalized,
            "options": normalized_options,
            "actions": _surface_actions(normalized),
            "requiresApproval": True,
            "writeback": None,
        }
    return {
        "ok": True,
        "mode": "companion",
        "message": "현재 화면을 기준으로 질문에 답할 준비가 되어 있습니다. 저장된 보고서나 메모리는 사용자가 승인하기 전에는 변경하지 않습니다.",
        "context": normalized,
        "options": normalized_options,
        "actions": _surface_actions(normalized),
        "requiresApproval": False,
        "writeback": None,
    }
