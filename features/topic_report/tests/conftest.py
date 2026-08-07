"""테스트는 Agent CLI를 부르지 않는다.

계획 미리보기가 기본적으로 엔진을 쓰게 되면서, 아무것도 stub하지 않은 테스트가
실제 Claude Code CLI를 실행하기 시작했다. 한 번에 48초가 걸려 스위트가 멈춰 섰고,
멈춘 이유가 코드 문제인지 CLI 문제인지 구분되지 않았다.

여기서 막으면 실수로 CLI를 부르는 테스트는 느려지는 대신 즉시 실패한다. CLI 경로를
실제로 확인하려는 테스트는 `run_agent_prompt`를 자기 손으로 monkeypatch한다.
"""
from __future__ import annotations

import pytest


@pytest.fixture(autouse=True)
def no_agent_cli(monkeypatch):
    from features.agent_mode import bridge

    def refuse(*_args, **_kwargs):
        raise AssertionError(
            "테스트가 Agent CLI를 호출했습니다. 필요하면 run_agent_prompt를 stub하세요."
        )

    monkeypatch.setattr(bridge, "run_agent_prompt", refuse)
    monkeypatch.setattr(bridge, "bridge_status", lambda *a, **k: {"available": False})
