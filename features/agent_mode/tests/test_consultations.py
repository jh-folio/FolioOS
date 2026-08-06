from __future__ import annotations

import json
import sqlite3
import time

import pytest
from fastapi import HTTPException

from features.agent_mode import consultation_store as store
from features.agent_mode.consultation_context import assemble_consultation_context
from features.agent_mode.consultation_prompt import build_consultation_prompt
from features.agent_mode.job_runtime import run_consultation_job
from features.investment_notes.service import normalize_note


CANARY = "CONSULTATION_CANARY_MUST_NEVER_BECOME_EVIDENCE"


def test_atomic_session_idempotency_and_hypothesis_boundary(tmp_path):
    session = store.create_session(tmp_path, {"scope": {"kind": "portfolio"}})
    first = store.append_user_message(tmp_path, session["id"], CANARY, operation_id="op-fixed")
    second = store.append_user_message(tmp_path, session["id"], "different", operation_id="op-fixed")
    assert first["message"]["id"] == second["message"]["id"]
    loaded = store.get_session(tmp_path, session["id"])
    assert loaded["layer"] == "hypothesis"
    assert loaded["sourceLayer"] == "user_consultation"
    assert loaded["reuseAsEvidence"] is False
    assert not list(store.sessions_dir(tmp_path).glob("*.tmp"))


def test_100_turn_context_is_bounded_and_valid_json(tmp_path):
    session = store.create_session(tmp_path, {"scope": {"kind": "watchlist", "tickers": ["NVDA"]}})
    for index in range(105):
        row = store.append_user_message(tmp_path, session["id"], f"question {index} " + ("x" * 200), operation_id=f"op-{index}")
        store.append_assistant_message(tmp_path, session["id"], row["message"]["id"], f"answer {index} " + ("y" * 200))
    samples = []
    for _ in range(30):
        started = time.perf_counter()
        context = assemble_consultation_context(tmp_path, session["id"])
        samples.append((time.perf_counter() - started) * 1000)
    assert sorted(samples)[27] <= 300
    assert len(context["serialized"]) <= 32_000
    assert json.loads(context["serialized"])["rules"]["consultationIsEvidence"] is False
    assert len(context["pack"]["recentMessages"]) <= 20


def test_context_reads_latest_market_snapshot_by_as_of(tmp_path):
    session = store.create_session(tmp_path, {"scope": {"kind": "portfolio"}})
    db = tmp_path / "market-memory.sqlite3"
    with sqlite3.connect(db) as connection:
        connection.execute("CREATE TABLE market_state_snapshots (snapshot_id TEXT PRIMARY KEY, as_of TEXT, payload_json TEXT)")
        connection.execute("INSERT INTO market_state_snapshots VALUES (?,?,?)", ("older", "2026-07-01T00:00:00Z", json.dumps({"id": "older", "asOf": "2026-07-01T00:00:00Z", "marketRegime": "old"})))
        connection.execute("INSERT INTO market_state_snapshots VALUES (?,?,?)", ("latest", "2026-08-01T00:00:00Z", json.dumps({"id": "latest", "asOf": "2026-08-01T00:00:00Z", "marketRegime": "risk_on"})))
        connection.commit()
    context = assemble_consultation_context(tmp_path, session["id"])
    assert context["pack"]["sourceContext"]["marketState"]["id"] == "latest"


def test_report_scope_cannot_escape_report_directory(tmp_path):
    (tmp_path.parent / "private.json").write_text(json.dumps({"markdown": CANARY}), encoding="utf-8")
    session = store.create_session(tmp_path, {"scope": {"kind": "topic_report", "id": "../../private"}})
    context = assemble_consultation_context(tmp_path, session["id"])
    assert CANARY not in context["serialized"]
    assert context["pack"]["sourceContext"].get("report") is None


def test_message_limit_creates_linked_continuation(tmp_path):
    session = store.create_session(tmp_path, {"title": "Long session"})
    path = store.sessions_dir(tmp_path) / f"{session['id']}.json"
    private = json.loads(path.read_text(encoding="utf-8"))
    private["messages"] = [{"id": f"msg-{index}", "role": "user", "content": "x", "createdAt": "2026-08-01T00:00:00Z", "status": "answered"} for index in range(500)]
    private["messageCount"] = 500
    store._atomic_write(path, private)
    appended = store.append_user_message(tmp_path, session["id"], "continue", operation_id="op-next")
    assert appended["session"]["continuationOf"] == session["id"]
    assert store.get_session(tmp_path, session["id"])["continuedBy"] == appended["session"]["id"]


def test_message_limit_reserves_room_for_paired_assistant_reply(tmp_path):
    session = store.create_session(tmp_path, {"title": "Almost full"})
    path = store.sessions_dir(tmp_path) / f"{session['id']}.json"
    private = json.loads(path.read_text(encoding="utf-8"))
    private["messages"] = [{"id": f"msg-{index}", "role": "user", "content": "x", "createdAt": "2026-08-01T00:00:00Z", "status": "answered"} for index in range(499)]
    private["messageCount"] = 499
    store._atomic_write(path, private)

    appended = store.append_user_message(tmp_path, session["id"], "last turn", operation_id="op-pair")
    assert appended["session"]["continuationOf"] == session["id"]
    store.append_assistant_message(tmp_path, appended["session"]["id"], appended["message"]["id"], "paired answer")
    continued = store.get_session(tmp_path, appended["session"]["id"])
    assert continued["messageCount"] == 2


def test_saved_user_turn_can_be_retried_after_restart_without_proposal(tmp_path, monkeypatch):
    from features.agent_mode import bridge

    session = store.create_session(tmp_path, {"scope": {"kind": "portfolio"}})
    appended = store.append_user_message(tmp_path, session["id"], "장기 thesis와 최근 뉴스의 관계는?", operation_id="op-restart")
    monkeypatch.setattr(bridge, "bridge_status", lambda: {"available": False})
    result = run_consultation_job(tmp_path, session["id"], appended["message"]["id"])
    loaded = store.get_session(tmp_path, session["id"])
    assert result["status"] == "answered"
    assert loaded["messages"][-1]["role"] == "assistant"
    assert loaded["messages"][-1]["engine"] == "rules"
    assert not (tmp_path / "agent-proposals").exists()


def test_prompt_is_answer_first_and_note_snapshot_stays_hypothesis():
    prompt = build_consultation_prompt("{}", "질문")
    assert "Answer the user's current question or request first" in prompt
    assert "Do not force a questionnaire" in prompt
    note = normalize_note({"noteType": "portfolio_decision", "title": "상담 정리", "consultationRef": "consult-abc", "body": CANARY})
    assert note["sourceLayer"] == "user_consultation"
    assert note["reuseAsEvidence"] is False
    assert note["consultationRef"] == "consult-abc"


def test_consultation_canary_remains_outside_research_and_canonical_paths(tmp_path):
    session = store.create_session(tmp_path, {"scope": {"kind": "portfolio"}})
    store.append_user_message(tmp_path, session["id"], CANARY, operation_id="op-canary")
    forbidden = [
        tmp_path / "research-index.sqlite3",
        tmp_path / "market-memory.sqlite3",
        tmp_path / "briefings",
        tmp_path / "company-analysis",
        tmp_path / "topic-reports",
    ]
    assert all(not path.exists() for path in forbidden)


def test_consultation_http_contract_and_explicit_delete(tmp_path, monkeypatch):
    from features.agent_mode import routes

    monkeypatch.setattr(routes, "submit_consultation_job", lambda _data, session_id, message_id: {"id": "job-1", "status": "queued", "sessionId": session_id, "messageId": message_id})
    boundary = routes.AgentCompanionBoundary(object(), data_dir=tmp_path)
    created = boundary.create_consultation({"title": "NVDA 상담", "scope": {"kind": "watchlist", "id": "NVDA", "tickers": ["NVDA"]}})
    session_id = created["id"]
    message = boundary.add_consultation_message(session_id, {"message": "무엇이 바뀌었나?", "operationId": "op-http"})
    assert message["job"]["id"] == "job-1"
    note = boundary.consultation_note(session_id, {"preview": True, "noteType": "company_thesis"})
    assert note["persisted"] is False
    assert note["note"]["consultationRef"] == session_id
    with pytest.raises(HTTPException) as error:
        boundary.delete_consultation(session_id, {"confirm": False})
    assert error.value.status_code == 400
    assert boundary.delete_consultation(session_id, {"confirm": True})["deleted"] is True


def test_delete_requires_json_true_not_truthy_string(tmp_path, monkeypatch):
    """삭제는 복구 불가라 "false" 같은 문자열이 동의로 통과하면 안 된다."""
    from features.agent_mode import routes

    monkeypatch.setattr(routes, "submit_consultation_job", lambda *_a, **_k: {"id": "j", "status": "queued"})
    boundary = routes.AgentCompanionBoundary(object(), data_dir=tmp_path)
    created = boundary.create_consultation({"title": "t", "scope": {"kind": "portfolio"}})
    for value in ("false", "no", "0", 1, "true"):
        with pytest.raises(HTTPException) as error:
            boundary.delete_consultation(created["id"], {"confirm": value})
        assert error.value.status_code == 400
    assert boundary.delete_consultation(created["id"], {"confirm": True})["deleted"] is True
