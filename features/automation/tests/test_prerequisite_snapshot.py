"""사전작업은 화면이 보여주는 시장 내러티브까지 갱신한다."""
from __future__ import annotations

import pytest

import features.automation.service as service


@pytest.fixture(autouse=True)
def _no_side_effects(monkeypatch):
    monkeypatch.setattr(service, "import_rssarchive", lambda **kw: {"ok": True})
    monkeypatch.setattr(service, "run_rss_market_memory_update", lambda *a, **k: {"ok": True, "promotedCount": 2})
    monkeypatch.setattr(service, "_append_run", lambda row: None)
    monkeypatch.setattr(service, "market_memory_recently_run", lambda **kw: False)


def test_the_rule_based_pass_alone_is_not_enough(monkeypatch):
    """**규칙 기반 갱신은 화면을 바꾸지 않는다.**

    시장 내러티브 탭은 `market_state_snapshots`를 읽는데 `run_rss_market_memory_update()`는
    그것을 만들지 않는다 — `market_memory` 행과 regime 카운트만 갱신한다. 실측으로
    스냅샷 이력이 08-12·08-07·08-06으로 띄엄띄엄했고 그 시각에 자동화 기록이 없었다.
    전부 사용자가 버튼을 누른 것이었다.
    """
    calls = []
    monkeypatch.setattr(service, "_refresh_market_state_snapshot", lambda: calls.append("snapshot") or {"ok": True})

    out = service.run_briefing_prerequisites()

    assert calls == ["snapshot"]
    assert out["marketMemory"]["stateSnapshot"] == {"ok": True}


def test_a_fresh_snapshot_is_not_rebuilt(monkeypatch):
    """최근에 돌았으면 건너뛴다. 예약마다 CLI를 다시 부르면 브리핑이 그만큼 늦어진다."""
    monkeypatch.setattr(service, "market_memory_recently_run", lambda **kw: True)
    calls = []
    monkeypatch.setattr(service, "_refresh_market_state_snapshot", lambda: calls.append("snapshot"))

    out = service.run_briefing_prerequisites()

    assert calls == []
    assert out["marketMemory"]["skipped"] is True


def test_a_failed_snapshot_does_not_take_the_briefing_down(monkeypatch):
    """브리핑이 오늘의 결과물이고 스냅샷은 그 앞의 준비다."""
    def boom():
        raise RuntimeError("engine down")

    monkeypatch.setattr(service, "_refresh_market_state_snapshot", service._refresh_market_state_snapshot)
    monkeypatch.setattr(service, "default_generation_mode", lambda: "llm_cli")
    import features.agent_mode.bridge as bridge

    monkeypatch.setattr(bridge, "run_market_memory_update_task", lambda *a, **k: boom())

    out = service.run_briefing_prerequisites()

    assert out["marketMemory"]["stateSnapshot"]["ok"] is False
    assert out["marketMemory"]["stateSnapshot"]["errorType"] == "RuntimeError"


def test_rules_mode_says_why_instead_of_pretending(monkeypatch):
    """LLM이 시장 해석 문장을 쓰는 산출물이라 규칙으로 대신할 수 있는 것이 아니다."""
    monkeypatch.setattr(service, "default_generation_mode", lambda: "rules")

    result = service._refresh_market_state_snapshot()

    assert result == {"ok": False, "skipped": True, "reason": "rules_mode"}


def test_the_cli_path_uses_the_same_two_step_task_as_the_button(monkeypatch):
    """버튼과 다른 경로를 만들면 둘이 서로 다른 스냅샷을 만들게 된다."""
    monkeypatch.setattr(service, "default_generation_mode", lambda: "llm_cli")
    seen = {}
    import features.agent_mode.bridge as bridge

    def fake(params=None, **kw):
        seen["params"] = params
        return {"snapshotId": "snap-1"}

    monkeypatch.setattr(bridge, "run_market_memory_update_task", fake)

    result = service._refresh_market_state_snapshot()

    assert result["ok"] is True
    assert result["snapshotId"] == "snap-1"
    assert "date" in seen["params"]


def test_the_manual_prerequisite_path_shares_one_definition():
    """예약 경로만 스냅샷을 만들고 다른 경로는 안 만드는 식으로 갈라지면 안 된다.

    다만 사용자가 직접 부르는 경로는 신선도로 건너뛰지 않는다 — 눌러도 아무 일이
    없는 버튼이 되면 안 된다.
    """
    import inspect

    source = inspect.getsource(service.run_automation_once)

    assert "result = run_briefing_prerequisites(force=True)" in source
    assert "rss = import_rssarchive(run_collection=True)\n            memory = run_rss" not in source


def test_an_explicit_run_ignores_the_freshness_guard(monkeypatch):
    monkeypatch.setattr(service, "market_memory_recently_run", lambda **kw: True)
    calls = []
    monkeypatch.setattr(service, "_refresh_market_state_snapshot", lambda: calls.append("snapshot") or {"ok": True})

    skipped = service.run_briefing_prerequisites()
    forced = service.run_briefing_prerequisites(force=True)

    assert skipped["marketMemory"].get("skipped") is True
    assert forced["marketMemory"].get("skipped") is not True
    assert calls == ["snapshot"]
