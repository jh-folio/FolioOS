"""Prompt/rule hints derived from preflight results."""
from __future__ import annotations


def render_prompt_hints(preflight: dict | None) -> str:
    preflight = preflight or {}
    hints = [str(x).strip() for x in preflight.get("promptHints") or [] if str(x).strip()]
    risks = [str(x).strip() for x in preflight.get("risks") or [] if str(x).strip()]
    if not hints and not risks:
        return ""
    lines = ["## 품질 Preflight 지시", "아래 지시는 보고서 품질 개선을 위한 제약입니다. 근거 없는 새 주장이나 숫자를 만들지 마세요."]
    if risks:
        lines.append("")
        lines.append("### 생성 전 위험")
        lines.extend(f"- {risk}" for risk in risks[:8])
    if hints:
        lines.append("")
        lines.append("### 작성 지시")
        lines.extend(f"- {hint}" for hint in hints[:8])
    return "\n".join(lines)
