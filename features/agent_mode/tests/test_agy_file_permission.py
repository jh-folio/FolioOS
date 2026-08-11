"""agy headless가 파일 읽기를 거부할 때 무엇을 하는가."""
import pytest

import features.agent_mode.bridge as bridge

# agy 1.1.12가 실제로 낸 stderr. exit 0에 stdout이 비어 있어 일반 "빈 결과"와 구분되지 않았고,
# 예약 브리핑이 며칠 동안 `internal_error`로만 남았다(실측 한 번에 8분 30초를 버렸다).
REAL_STDERR = (
    'jetski: no output produced — a tool required the "read_file" permission that headless '
    "mode cannot prompt for, so it was auto-denied. Add an allow-rule under permissions.allow "
    "in settings.json (e.g. read_file(<target>)). Alternatively, re-run with "
    "--dangerously-skip-permissions to auto-approve all tools."
)


@pytest.fixture(autouse=True)
def _clean_state():
    bridge.reset_agy_permission_state()
    yield
    bridge.reset_agy_permission_state()


def test_the_real_stderr_is_recognised():
    assert bridge.AGY_PERMISSION_DENIED_MARK in REAL_STDERR


def test_only_pack_prompts_are_blocked():
    """대화는 파일을 읽지 않아 권한 없이도 된다. 그것까지 막으면 도크가 통째로 죽는다."""
    assert bridge._prompt_needs_file_read("Read the UTF-8 Agent Context Pack at: C:/x.json") is True
    assert bridge._prompt_needs_file_read("Reply with exactly: PONG") is False


def test_a_blocked_adapter_reports_why_instead_of_looking_healthy():
    """설치·로그인은 멀쩡하다. 막힌 것은 파일 읽기라 Agent task만 못 만든다."""
    bridge._mark_agy_file_reads_blocked()

    row = bridge._probe_adapter("antigravity")

    assert row["installed"] is True
    assert row["available"] is False
    assert row["bridgeSupported"] is False
    assert "read_file" in row["error"] or "파일 읽기" in row["error"]
    # 무엇을 해야 하는지 말한다.
    assert "settings.json" in row["error"]
    assert "Codex" in row["error"] or "Claude" in row["error"]


def test_a_refresh_lets_the_user_try_again():
    """고치고도 되돌릴 방법이 화면에 없으면 안 된다."""
    bridge._mark_agy_file_reads_blocked()
    assert bridge._AGY_FILE_READS_BLOCKED is True

    bridge.reset_agy_permission_state()

    assert bridge._AGY_FILE_READS_BLOCKED is False


def test_the_second_attempt_fails_before_building_anything(monkeypatch):
    """이미 거부당한 것을 알고 있으면 팩을 만들고 수 분을 버리지 않는다."""
    bridge._mark_agy_file_reads_blocked()
    started = []
    monkeypatch.setattr(bridge.subprocess, "Popen", lambda *a, **k: started.append(a) or None)

    with pytest.raises(RuntimeError) as caught:
        bridge._invoke_agent_cli(
            {"id": "antigravity", "version": "1.1.12", "executable": "agy"},
            "Read the UTF-8 Agent Context Pack at: C:/x.json",
            60,
        )

    assert "권한" in str(caught.value)
    assert started == []


def test_a_conversation_still_runs_while_blocked(monkeypatch):
    """파일을 안 읽는 호출까지 막으면 안 된다."""
    bridge._mark_agy_file_reads_blocked()
    calls = []

    class FakeProc:
        returncode = 0

        def communicate(self, data=None, timeout=None):
            calls.append(data)
            return "PONG", ""

    monkeypatch.setattr(bridge.subprocess, "Popen", lambda *a, **k: FakeProc())
    monkeypatch.setattr(bridge, "_adapter_command", lambda *a, **k: ["agy"])

    out = bridge._invoke_agent_cli(
        {"id": "antigravity", "version": "1.1.12", "executable": "agy"}, "Reply with PONG", 60
    )

    assert out == "PONG"


def test_an_empty_result_with_that_stderr_says_what_to_fix(monkeypatch):
    class FakeProc:
        returncode = 0

        def communicate(self, data=None, timeout=None):
            return "", REAL_STDERR

    monkeypatch.setattr(bridge.subprocess, "Popen", lambda *a, **k: FakeProc())
    monkeypatch.setattr(bridge, "_adapter_command", lambda *a, **k: ["agy"])

    with pytest.raises(RuntimeError) as caught:
        bridge._invoke_agent_cli(
            {"id": "antigravity", "version": "1.1.12", "executable": "agy"},
            "Read the UTF-8 Agent Context Pack at: C:/x.json",
            60,
        )

    message = str(caught.value)
    assert "settings.json" in message
    # 다음 시도는 즉시 막힌다.
    assert bridge._AGY_FILE_READS_BLOCKED is True
