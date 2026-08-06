"""보고서를 실제로 쓴 모델의 표시 이름.

목록 카드가 `LLM`이라고만 적으면 세 보고서가 서로 다른 모델로 쓰였어도 구분이
안 된다. 어느 모델이 썼는지가 보고서를 다시 읽을 때 판단 근거가 된다.

이름은 저장된 값에서만 만든다. 없는 정보를 추측해 붙이지 않는다.
"""
from __future__ import annotations

import re

# 화면 표기. 내부 식별자를 그대로 노출하지 않는다.
PROVIDER_LABELS = {
    "openai": "OpenAI",
    "anthropic": "Claude",
    "claude": "Claude",
    "gemini": "Gemini",
    "google": "Gemini",
}
ADAPTER_LABELS = {
    "codex": "Codex",
    "claude": "Claude Code",
    "claude_code": "Claude Code",
    "antigravity": "Antigravity",
}
RULE_LABEL = "규칙"
AGENT_LABEL = "Agent"

# 모델 id 안에서 대문자로 읽는 토막. 나머지는 첫 글자만 올린다.
_ACRONYMS = {"gpt", "ai"}
# 모델명이 아니라 내부 표식인 값.
_NON_MODELS = {"current-agent-session", "unknown", "default"}


def model_label(model: str | None) -> str:
    """`gpt-5.6-sol` → `GPT 5.6 Sol`, `claude-fable-5` → `Claude Fable 5`."""
    text = str(model or "").strip()
    if not text or text.lower() in _NON_MODELS:
        return ""
    words = []
    for part in re.split(r"[-_\s]+", text):
        if not part:
            continue
        if re.fullmatch(r"[\d.]+", part):
            words.append(part)
        elif part.lower() in _ACRONYMS:
            words.append(part.upper())
        else:
            words.append(part[:1].upper() + part[1:])
    return " ".join(words)


def engine_label(generation: dict | None) -> str:
    """카드 배지에 넣을 이름. 모델명을 먼저 쓰고, 없으면 도구·제공자 이름."""
    generation = generation or {}
    mode = str(generation.get("mode") or "").strip().lower()
    adapter = str(generation.get("adapter") or "").strip().lower()
    provider = str(generation.get("provider") or "").strip().lower()

    if mode in {"rules", "rule", "fallback"}:
        return RULE_LABEL
    named_model = model_label(generation.get("model"))
    if named_model:
        return named_model
    # 모델이 안 남았으면 무엇으로 돌렸는지라도 알린다.
    if adapter:
        return ADAPTER_LABELS.get(adapter, adapter.replace("_", " ").title())
    if provider and provider not in {"external_agent", "external"}:
        return PROVIDER_LABELS.get(provider, provider.title())
    if mode == "agent" or provider in {"external_agent", "external"}:
        return AGENT_LABEL
    return ""


def engine_detail(generation: dict | None) -> str:
    """배지 뒤에 덧붙일 맥락. 모델이 배지를 차지하므로 여기는 도구·제공자다."""
    generation = generation or {}
    if not model_label(generation.get("model")):
        return ""
    adapter = str(generation.get("adapter") or "").strip().lower()
    if adapter:
        return ADAPTER_LABELS.get(adapter, adapter.replace("_", " ").title())
    provider = str(generation.get("provider") or "").strip().lower()
    if provider and provider not in {"external_agent", "external"}:
        return PROVIDER_LABELS.get(provider, provider.title())
    return ""
