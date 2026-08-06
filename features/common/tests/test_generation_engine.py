"""목록 배지는 어느 모델이 썼는지 말해야 한다.

"LLM"만 적으면 세 보고서가 서로 다른 모델로 쓰였어도 구분되지 않는다.
"""
from __future__ import annotations

from features.common.generation_engine import engine_detail, engine_label, model_label


def test_model_ids_read_as_names():
    assert model_label("gpt-5.6-sol") == "GPT 5.6 Sol"
    assert model_label("claude-fable-5") == "Claude Fable 5"
    assert model_label("gemini-2.5-flash") == "Gemini 2.5 Flash"
    assert model_label("gpt-5.4-mini") == "GPT 5.4 Mini"


def test_the_badge_shows_the_model():
    assert engine_label({"mode": "llm", "provider": "openai", "model": "gpt-5.4"}) == "GPT 5.4"
    assert engine_label({"mode": "llm", "provider": "gemini", "model": "gemini-2.5-flash"}) == "Gemini 2.5 Flash"


def test_the_tool_is_named_when_no_model_was_recorded():
    """CLI 경로는 provider가 external_agent로만 남는다. 도구 이름은 adapter가 갖는다."""
    assert engine_label({"mode": "agent", "provider": "external_agent", "adapter": "codex"}) == "Codex"
    assert engine_label({"mode": "agent", "provider": "external_agent", "adapter": "claude"}) == "Claude Code"


def test_internal_markers_are_not_a_model_name():
    generation = {"mode": "agent", "provider": "external_agent", "model": "current-agent-session"}
    assert model_label("current-agent-session") == ""
    assert engine_label(generation) == "Agent"


def test_a_rule_based_report_says_so():
    assert engine_label({"mode": "rules"}) == "규칙"


def test_nothing_is_invented_when_nothing_was_stored():
    assert engine_label({}) == ""
    assert engine_label(None) == ""


def test_the_detail_carries_the_tool_behind_the_model():
    assert engine_detail({"model": "gpt-5.4", "provider": "openai"}) == "OpenAI"
    assert engine_detail({"model": "gpt-5.6", "adapter": "codex"}) == "Codex"
    # 배지가 이미 도구 이름이면 같은 말을 두 번 적지 않는다.
    assert engine_detail({"model": "current-agent-session", "adapter": "codex"}) == ""
