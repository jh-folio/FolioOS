import json

from features.agent_mode import chat


def _patch_dirs(monkeypatch, tmp_path):
    monkeypatch.setattr(chat, "PROPOSALS_DIR", tmp_path / "agent-proposals")
    monkeypatch.setattr(chat, "BRIEFINGS_DIR", tmp_path / "briefings")
    monkeypatch.setattr(chat, "ANALYSIS_DIR", tmp_path / "company-analysis")
    monkeypatch.setattr(chat, "TOPIC_DIR", tmp_path / "topic-reports")


def _write_briefing(tmp_path, date="2026-07-02", scope="us", markdown="# US Market Briefing — 2026.07.02\n\n본문"):
    path = tmp_path / "briefings" / f"{date}.{scope}.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps({"date": date, "marketScope": scope, "markdown": markdown, "personalOverlay": {"keep": True}}, ensure_ascii=False), encoding="utf-8")
    return path


def test_build_chat_prompt_includes_effort_report_and_hypothesis_rule():
    prompt = chat.build_chat_prompt(
        "이 브리핑 요약해줘",
        {"surface": "briefing_reader", "reportKind": "briefing", "reportId": "2026-07-02", "marketScope": "us"},
        {"effort": "high", "attachments": [{"name": "memo.md", "size": 3, "content": "내 가설"}], "model": ""},
        markdown="# 본문",
    )
    assert chat.EFFORT_HINTS["high"] in prompt
    assert "<report>" in prompt and "# 본문" in prompt
    assert "memo.md" in prompt and "내 가설" in prompt
    assert "hypothesis" in prompt


def test_build_revision_prompt_requires_full_json_document():
    prompt = chat.build_revision_prompt("bear case 추가", {}, {"effort": "medium", "attachments": [], "model": ""}, "# 기존 본문")
    assert '"revisedMarkdown"' in prompt
    assert "COMPLETE document" in prompt
    assert "# 기존 본문" in prompt


def test_proposal_apply_updates_markdown_and_preserves_other_fields(monkeypatch, tmp_path):
    _patch_dirs(monkeypatch, tmp_path)
    path = _write_briefing(tmp_path)
    original = json.loads(path.read_text(encoding="utf-8"))
    proposal = chat.create_revision_proposal(
        kind="briefing", report_id="2026-07-02", market_scope="us",
        message="bear case 추가", summary="bear case 섹션 추가",
        revised_markdown=original["markdown"] + "\n\n## Bear case\n하락 리스크",
        current_markdown=original["markdown"],
    )
    assert proposal["status"] == "pending"
    assert "+## Bear case" in proposal["diff"]

    result = chat.apply_proposal(proposal["id"])
    assert result["status"] == "applied"
    saved = json.loads(path.read_text(encoding="utf-8"))
    assert "## Bear case" in saved["markdown"]
    assert saved["personalOverlay"] == {"keep": True}
    assert saved["agentRevisions"][0]["proposalId"] == proposal["id"]


def test_proposal_apply_rejects_when_report_changed(monkeypatch, tmp_path):
    _patch_dirs(monkeypatch, tmp_path)
    path = _write_briefing(tmp_path)
    original = json.loads(path.read_text(encoding="utf-8"))
    proposal = chat.create_revision_proposal(
        kind="briefing", report_id="2026-07-02", market_scope="us",
        message="수정", summary="수정",
        revised_markdown=original["markdown"] + "\n추가",
        current_markdown=original["markdown"],
    )
    changed = dict(original)
    changed["markdown"] = "다른 내용으로 바뀜"
    path.write_text(json.dumps(changed, ensure_ascii=False), encoding="utf-8")
    try:
        chat.apply_proposal(proposal["id"])
        assert False, "hash mismatch must raise"
    except ValueError as exc:
        assert "변경되어" in str(exc)
    assert chat.get_proposal(proposal["id"])["status"] == "stale"


def test_reject_proposal(monkeypatch, tmp_path):
    _patch_dirs(monkeypatch, tmp_path)
    _write_briefing(tmp_path)
    proposal = chat.create_revision_proposal(
        kind="briefing", report_id="2026-07-02", market_scope="us",
        message="m", summary="s", revised_markdown="new", current_markdown="old",
    )
    result = chat.reject_proposal(proposal["id"])
    assert result["status"] == "rejected"


def test_run_agent_chat_falls_back_to_rules_without_cli(monkeypatch):
    monkeypatch.setattr(chat.bridge, "bridge_status", lambda **kwargs: {"available": False, "message": "CLI 없음"})
    result = chat.run_agent_chat("이 화면 요약해줘", {"surface": "briefing_reader"}, {})
    assert result["engine"] == "rules"
    assert result["reply"]
    assert result["notice"] == "CLI 없음"


def test_run_agent_chat_task_creates_proposal_with_fake_cli(monkeypatch, tmp_path):
    _patch_dirs(monkeypatch, tmp_path)
    _write_briefing(tmp_path)
    monkeypatch.setattr(chat.bridge, "bridge_status", lambda **kwargs: {"available": True})
    monkeypatch.setattr(chat.bridge, "run_agent_prompt", lambda prompt, **kwargs: {
        "output": json.dumps({"summary": "bear case 추가", "revisedMarkdown": "# US Market Briefing — 2026.07.02\n\n본문\n\n## Bear case"}, ensure_ascii=False),
        "adapter": "codex",
    })
    result = chat.run_agent_chat(
        "이 브리핑에 bear case 섹션 추가해줘",
        {"surface": "briefing_reader", "reportKind": "briefing", "reportId": "2026-07-02", "marketScope": "us"},
        {"effort": "high"},
    )
    assert result["mode"] == "task"
    assert result["proposal"]["id"]
    assert "+## Bear case" in result["proposal"]["diff"]
    stored = chat.get_proposal(result["proposal"]["id"])
    assert stored["status"] == "pending"


def test_run_agent_chat_companion_falls_back_when_cli_errors(monkeypatch):
    monkeypatch.setattr(chat.bridge, "bridge_status", lambda **kwargs: {"available": True})

    def _boom(prompt, **kwargs):
        raise RuntimeError("banner\n\x1b[1m\x1b[31mERROR:\x1b[0m You've hit your usage limit. try again tomorrow.")

    monkeypatch.setattr(chat.bridge, "run_agent_prompt", _boom)
    result = chat.run_agent_chat("이 화면 요약해줘", {"surface": "briefing_reader"}, {})
    assert result["engine"] == "rules"
    assert "usage limit" in result["notice"]
    assert "\x1b" not in result["notice"]


def test_run_agent_chat_companion_uses_cli_reply(monkeypatch):
    monkeypatch.setattr(chat.bridge, "bridge_status", lambda **kwargs: {"available": True})
    monkeypatch.setattr(chat.bridge, "run_agent_prompt", lambda prompt, **kwargs: {"output": "핵심은 금리입니다.", "adapter": "claude"})
    result = chat.run_agent_chat("이 화면 요약해줘", {"surface": "briefing_reader"}, {"effort": "low"})
    assert result["mode"] == "companion"
    assert result["engine"] == "cli"
    assert result["adapter"] == "claude"
    assert result["reply"] == "핵심은 금리입니다."
