"""agy headless가 파일 읽기를 거부할 때 무엇을 하는가."""
from types import SimpleNamespace

import pytest

import features.agent_mode.agy_capability as agy_capability
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
def _clean_state(tmp_path, monkeypatch):
    monkeypatch.setattr(agy_capability, "CACHE_PATH", tmp_path / "agent-cli-capability.json")
    monkeypatch.setattr(agy_capability, "PROBE_DIR", tmp_path / "agent-context")
    bridge.reset_agy_permission_state()
    yield
    bridge.reset_agy_permission_state()


def test_the_real_stderr_is_recognised():
    assert bridge.AGY_PERMISSION_DENIED_MARK in REAL_STDERR


def test_only_pack_prompts_are_blocked():
    """대화는 파일을 읽지 않아 권한 없이도 된다. 그것까지 막으면 도크가 통째로 죽는다."""
    assert bridge._prompt_needs_file_read("Read the UTF-8 Agent Context Pack at: C:/x.json") is True
    assert bridge._prompt_needs_file_read("Reply with exactly: PONG") is False


def test_a_blocked_adapter_reports_why_instead_of_looking_healthy(monkeypatch):
    """설치·로그인은 멀쩡하다. 막힌 것은 파일 읽기라 Agent task만 못 만든다.

    실제로 거부당한 것(`fileReads: false`)과 아직 안 재본 것(`None`)은 다른 문구를 낸다 —
    전자는 무엇이 막혔는지, 후자는 어떻게 확인하는지 말해야 한다.

    **agy가 깔려 있는지에 기대지 않는다.** 처음에는 실제 `_probe_adapter`가 돌려주는
    버전을 썼는데, agy가 없는 기계에서는 `installed: False`라 CI에서만 실패했다 —
    내 PC에 깔려 있다는 사실이 테스트 통과의 조건이 되면 안 된다.
    """
    version = "1.1.12"
    probe = SimpleNamespace(returncode=0, stdout="agy " + version, stderr="")
    monkeypatch.setattr(bridge, "_configured_executable", lambda adapter: "/usr/local/bin/agy")
    monkeypatch.setattr(bridge.subprocess, "run", lambda *a, **k: probe)
    bridge._mark_agy_file_reads_blocked(version, "denied")

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


def test_an_unmeasured_version_is_blocked_not_assumed_working():
    """**모르는 것을 된다고 가정하지 않는다.**

    지난 실수가 정확히 그것이다 — 버전 숫자가 기준을 넘었다는 이유로 브리지를 열었고,
    그 뒤 실행된 Agent 잡 두 건이 모두 실패했다(그전까지 antigravity로 성공한 잡은
    한 건도 없다). 버전 비교는 권한 문제를 구조적으로 볼 수 없다.
    """
    assert agy_capability.cached_file_reads("1.1.12") is None

    row = bridge._probe_adapter("antigravity")

    if row.get("installed"):
        assert row["bridgeSupported"] is False
        assert "확인하지 않았습니다" in row["error"]


def test_a_measured_pass_opens_the_bridge_and_a_fail_keeps_it_shut():
    agy_capability.record("9.9.9", True)
    assert agy_capability.cached_file_reads("9.9.9") is True

    agy_capability.record("9.9.9", False, "denied")
    assert agy_capability.cached_file_reads("9.9.9") is False

    # 판올림하면 다시 재야 한다. 고쳐졌을 수도, 새로 깨졌을 수도 있다.
    assert agy_capability.cached_file_reads("9.9.10") is None


def test_the_probe_file_sits_where_real_packs_do():
    """**위치가 판정을 가른다.**

    실측: 프로젝트 안 12바이트 파일은 권한 거부, `%TEMP%`의 5.2MB 파일은 성공.
    바깥에 만든 파일로 재면 "된다"는 답을 받고 브리지를 열게 되는데, 그것이 지난
    실수의 반복이다.
    """
    import inspect

    source = inspect.getsource(agy_capability.probe_file_reads)

    assert "PROBE_DIR" in source
    assert "tempfile" not in source
    assert agy_capability.PROBE_DIR.name == "agent-context"


def test_a_real_denial_survives_a_restart(tmp_path, monkeypatch):
    """모듈 플래그만 두면 다음 실행이 또 한 번 실패한다."""
    class FakeProc:
        returncode = 0

        def communicate(self, data=None, timeout=None):
            return "", REAL_STDERR

    monkeypatch.setattr(bridge.subprocess, "Popen", lambda *a, **k: FakeProc())
    monkeypatch.setattr(bridge, "_adapter_command", lambda *a, **k: ["agy"])

    with pytest.raises(RuntimeError):
        bridge._invoke_agent_cli(
            {"id": "antigravity", "version": "1.1.12", "executable": "agy"},
            "Read the UTF-8 Agent Context Pack at: C:/x.json",
            60,
        )

    # 재시작해도 캐시가 막아 준다.
    assert agy_capability.cached_file_reads("1.1.12") is False
