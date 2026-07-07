from features.agent_mode.companion import (
    agent_companion_reply,
    classify_agent_intent,
    normalize_agent_context,
    normalize_agent_options,
)


def test_normalize_agent_context_keeps_safe_fields_only():
    raw = {
        "surface": "briefing_reader",
        "viewId": "briefing",
        "reportKind": "briefing",
        "reportId": "2026-07-02.us",
        "marketScope": "us",
        "selectedText": "AI capex remains central",
        "visibleSection": "leading_companies",
        "apiKey": "sk-proj-secret",
        "token": "secret",
    }
    ctx = normalize_agent_context(raw)
    assert ctx == {
        "surface": "briefing_reader",
        "viewId": "briefing",
        "reportKind": "briefing",
        "reportId": "2026-07-02.us",
        "marketScope": "us",
        "selectedText": "AI capex remains central",
        "visibleSection": "leading_companies",
        "portfolioLinked": False,
    }


def test_classify_agent_intent_starts_as_companion_for_questions():
    assert classify_agent_intent("이 브리핑에서 제일 중요한 게 뭐야?") == "companion"
    assert classify_agent_intent("내 포트폴리오에 어떤 의미야?") == "companion"


def test_classify_agent_intent_switches_to_task_for_mutating_requests():
    assert classify_agent_intent("이 기업분석에 bear case 섹션 추가해줘") == "task"
    assert classify_agent_intent("최신 RSS로 Market Memory 업데이트해줘") == "task"
    assert classify_agent_intent("내일 아침 브리핑 자동화 설정해줘") == "task"


def test_companion_reply_never_writes_state():
    result = agent_companion_reply(
        "이 브리핑에서 반대로 볼 근거는?",
        {"surface": "briefing_reader", "reportKind": "briefing", "reportId": "2026-07-02.us"},
    )
    assert result["mode"] == "companion"
    assert result["requiresApproval"] is False
    assert result["writeback"] is None
    assert any(action["id"] == "create_personal_overlay" for action in result["actions"])


def test_normalize_agent_options_clamps_effort_and_attachments():
    options = normalize_agent_options({
        "model": "gpt-5.3-codex",
        "effort": "extreme",
        "attachments": [
            {"name": "memo.md", "size": "12", "content": "x" * 9000},
            {"name": "", "size": 1},
            "not-a-dict",
        ],
    })
    assert options["model"] == "gpt-5.3-codex"
    assert options["effort"] == "medium"
    assert len(options["attachments"]) == 1
    assert options["attachments"][0]["name"] == "memo.md"
    assert len(options["attachments"][0]["content"]) == 4000


def test_companion_reply_echoes_normalized_options():
    result = agent_companion_reply(
        "이 화면 요약해줘?",
        {"surface": "briefing_reader"},
        {"model": "claude-opus", "effort": "high", "attachments": [{"name": "notes.txt", "size": 10}]},
    )
    assert result["options"]["model"] == "claude-opus"
    assert result["options"]["effort"] == "high"
    assert result["options"]["attachments"][0]["name"] == "notes.txt"
