import sys
import os
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import Mock, patch

import pytest

from features.agent_mode import bridge
from features.agent_mode import schema
from features.agent_mode.briefing_contract import briefing_contract_violations, briefing_output_contract


def _valid_briefing_output():
    contract = briefing_output_contract("both")
    dated_titles = {
        "US Market Briefing": "# US Market Briefing — 2099.12.31",
        "Korea Market Briefing": "# Korea Market Briefing — 2099.12.31",
        "3. 미국장을 주도한 기업 ①": "## 3. 미국장을 주도한 기업 ① — NVIDIA",
        "4. 미국장을 주도한 기업 ②": "## 4. 미국장을 주도한 기업 ② — Alphabet",
        "3. 한국장을 주도한 기업 ①": "## 3. 한국장을 주도한 기업 ① — Samsung Electronics",
        "4. 한국장을 주도한 기업 ②": "## 4. 한국장을 주도한 기업 ② — SK hynix",
    }
    headings = "\n\n".join(
        dated_titles.get(section, f"## {section}")
        for section in contract["requiredSections"]
    )
    conclusions = "\n".join(
        "**한 줄 결론:** 시장의 가격 반응과 내부 구조를 해석합니다."
        for _ in range(contract["minimumOneLineConclusions"])
    )
    bullets = "\n".join(
        "· 핵심 수치와 원인, 다음 확인점을 점검합니다."
        for _ in range(contract["minimumMiddleDotBullets"])
    )
    prose = "시장 흐름과 근거, 반대 신호, 체크포인트를 줄글로 설명합니다. " * 320
    return f"{headings}\n\n{conclusions}\n{bullets}\n\n{prose}"


def test_probe_requires_executable_to_run():
    version = Mock(returncode=0, stdout="codex-cli 1.0\n", stderr="")
    auth = Mock(returncode=0, stdout="Logged in\n", stderr="")
    with (
        patch.object(bridge, "_configured_executable", return_value=sys.executable),
        patch.object(bridge.subprocess, "run", side_effect=[version, auth]),
    ):
        status = bridge._probe_adapter("codex")
    assert status["available"] is True
    assert status["installed"] is True
    assert status["authenticated"] is True
    assert status["version"]


def test_antigravity_probe_available_on_non_windows():
    # macOS/Linux에서는 agy headless가 정상 동작한다. --version만 확인하고 사용 가능으로 본다.
    version = Mock(returncode=0, stdout="agy 1.0\n", stderr="")
    with (
        patch.object(bridge.os, "name", "posix"),
        patch.object(bridge, "_configured_executable", return_value="/usr/local/bin/agy"),
        patch.object(bridge.subprocess, "run", side_effect=[version]) as run,
    ):
        status = bridge._probe_adapter("antigravity")
    assert status["installed"] is True
    assert status["available"] is True
    assert status["bridgeSupported"] is True
    assert run.call_count == 1


def test_antigravity_probe_unavailable_on_windows():
    # agy 1.0.10 Windows headless는 결과를 반환하지 못하므로(업스트림 버그) 미지원으로 표시한다.
    version = Mock(returncode=0, stdout="agy 1.0\n", stderr="")
    with (
        patch.object(bridge.os, "name", "nt"),
        patch.object(bridge, "_configured_executable", return_value=r"C:\Apps\agy.exe"),
        patch.object(bridge.subprocess, "run", side_effect=[version]),
    ):
        status = bridge._probe_adapter("antigravity")
    assert status["installed"] is True
    assert status["available"] is False
    assert status["bridgeSupported"] is False
    assert "Windows" in status["error"]


def test_antigravity_command_uses_current_long_model_flag_and_print_prompt():
    adapter = {"id": "antigravity", "executable": "agy", "available": True}
    with patch("features.agent_mode.setup.configured_model", return_value="gemini-3.5-pro"):
        command = bridge._adapter_command(adapter, "PROMPT")
    assert command == ["agy", "--model", "gemini-3.5-pro", "--print", "PROMPT"]
    assert "-m" not in command


def test_codex_command_uses_current_exec_flags_without_removed_approval_option():
    adapter = {"id": "codex", "executable": "codex", "available": True}
    with patch("features.agent_mode.setup.configured_model", return_value="gpt-5.4"):
        command = bridge._adapter_command(adapter, "PROMPT")
    assert command == [
        "codex", "exec", "--skip-git-repo-check", "--ephemeral", "--sandbox", "read-only",
        "--model", "gpt-5.4", "-",
    ]
    assert "--ask-for-approval" not in command


def test_bridge_parses_fenced_json_object():
    payload = bridge._json_payload('```json\n{"verdict":"maintained"}\n```')
    assert payload["verdict"] == "maintained"


def test_configured_provider_does_not_fall_back_to_another_cli():
    adapters = {
        "codex": {"id": "codex", "label": "Codex CLI", "installed": True, "authenticated": False, "available": False},
        "claude": {"id": "claude", "label": "Claude Code CLI", "installed": True, "authenticated": True, "available": True},
        "antigravity": {"id": "antigravity", "label": "Antigravity CLI", "installed": False, "authenticated": False, "available": False},
    }
    bridge.invalidate_bridge_status()
    with (
        patch.dict(os.environ, {"AGENT_CLI_PROVIDER": "codex"}),
        patch.object(bridge, "_probe_adapter", side_effect=lambda adapter: adapters[adapter]),
    ):
        status = bridge.bridge_status(refresh=True)
    bridge.invalidate_bridge_status()
    assert status["available"] is False
    assert status["selectedAdapter"] == ""


def test_agent_preflight_reports_auth_and_workspace_checks():
    status = {
        "available": False,
        "selectedAdapter": "codex",
        "message": "로그인이 필요합니다.",
        "adapters": [{
            "id": "codex",
            "label": "Codex CLI",
            "installed": True,
            "authenticated": False,
            "available": False,
            "bridgeSupported": True,
            "executable": sys.executable,
            "version": "codex 1.0",
            "error": "로그인이 필요합니다.",
        }],
    }
    with patch.object(bridge, "bridge_status", return_value=status):
        preflight = bridge.agent_preflight("codex")
    checks = {item["id"]: item for item in preflight["checks"]}
    assert preflight["ok"] is False
    assert checks["workspace"]["ok"] is True
    assert checks["adapter_installed"]["ok"] is True
    assert checks["adapter_version"]["message"] == "버전: codex 1.0"
    assert checks["adapter_auth"]["ok"] is False
    assert "로그인" in checks["adapter_auth"]["message"]


def test_agent_preflight_reports_no_selected_adapter():
    status = {
        "available": False,
        "selectedAdapter": "",
        "message": "실행 가능한 Codex/Claude CLI가 없습니다.",
        "adapters": [],
    }
    with patch.object(bridge, "bridge_status", return_value=status):
        preflight = bridge.agent_preflight()
    assert preflight["ok"] is False
    assert preflight["checks"][-1]["id"] == "adapter_selected"
    assert "CLI" in preflight["checks"][-1]["message"]


def test_run_agent_task_captures_output_and_delegates_writeback():
    with TemporaryDirectory() as tmp:
        pack = schema.build_pack(
            task_type="briefing",
            artifact_type="briefing",
            artifact_id="2099-12-31",
            title="Test Briefing",
            prompt="prompt",
            context="context",
            output_contract={"format": "markdown"},
            write_back_contract={"method": "write_markdown"},
            save_target=str(Path(tmp) / "briefing.json"),
            draft_artifact={"date": "2099-12-31"},
        )
        pack_path = Path(tmp) / "pack.json"
        pack_path.write_text("{}", encoding="utf-8")
        adapter = {"id": "codex", "label": "Codex CLI", "executable": sys.executable, "available": True}
        command = [sys.executable, "-c", "print('## Test Briefing\\n\\nAgent output')"]
        with (
            patch.object(bridge, "_select_adapter", return_value=adapter),
            patch.object(bridge, "_adapter_command", return_value=command),
            patch.object(bridge.agent_service, "prepare_pack", return_value=(pack, pack_path)),
            patch.object(bridge.agent_service, "writeback_pack", return_value={"date": "2099-12-31", "title": "Test Briefing"}) as writeback,
            patch.object(bridge.schema, "update_pack_status"),
        ):
            result = bridge.run_agent_task("briefing", {}, job_id="test-job")
        assert result["generationMode"] == "llm_cli"
        assert result["date"] == "2099-12-31"
        assert "Agent output" in writeback.call_args.kwargs["markdown"]


def test_market_state_snapshot_progress_does_not_conflict_with_message_key():
    with TemporaryDirectory() as tmp:
        pack = schema.build_pack(
            task_type="market_state_snapshot",
            artifact_type="market_state_snapshot",
            artifact_id="2099-12-31",
            title="Market State",
            prompt="prompt",
            context="context",
            output_contract={"format": "json"},
            write_back_contract={"method": "write_json"},
            save_target=str(Path(tmp) / "snapshot.json"),
        )
        pack_path = Path(tmp) / "pack.json"
        pack_path.write_text("{}", encoding="utf-8")
        adapter = {"id": "codex", "label": "Codex CLI", "executable": "codex", "available": True}
        progress_calls = []

        def progress(message, progress=None, **extra):
            progress_calls.append({"message": message, "progress": progress, **extra})

        with (
            patch.object(bridge, "_select_adapter", return_value=adapter),
            patch.object(bridge.agent_service, "prepare_pack", return_value=(pack, pack_path)),
            patch.object(bridge, "_invoke_agent_cli", return_value='{"headline":"AI 반도체 장"}'),
            patch.object(bridge.agent_service, "writeback_pack", return_value={"snapshot": {"id": "snap_1", "headline": "AI 반도체 장"}}),
            patch.object(bridge.schema, "update_pack_status"),
        ):
            result = bridge.run_agent_task("market_state_snapshot", {}, progress=progress, job_id="snapshot-job")
        assert result["snapshotId"] == "snap_1"
        assert result["statusMessage"] == "AI Agent 시장 상태 스냅샷을 저장했습니다."
        assert progress_calls[-1]["message"] == "Agent 결과 저장을 완료했습니다."
        assert "message" not in {key for key in progress_calls[-1] if key != "message"}


def test_market_memory_update_task_runs_memory_then_snapshot():
    calls = []
    progress_calls = []

    def fake_run_agent_task(task_type, params, *, adapter="", progress=None, job_id=""):
        calls.append((task_type, params, adapter, job_id))
        if progress:
            progress(f"{task_type} 진행", 50, artifactType=task_type)
        if task_type == "market_memory_llm":
            return {"artifactType": "market_memory", "savedCount": 3, "date": params["date"]}
        if task_type == "market_state_snapshot":
            return {"artifactType": "market_state_snapshot", "snapshotId": "snap_1", "title": "최신 시장 상태", "date": params["date"]}
        raise AssertionError(task_type)

    def progress(message, progress=None, **extra):
        progress_calls.append({"message": message, "progress": progress, **extra})

    with patch.object(bridge, "run_agent_task", side_effect=fake_run_agent_task):
        result = bridge.run_market_memory_update_task(
            {"date": "2026-07-07"},
            adapter="codex",
            progress=progress,
            job_id="update-job",
        )

    assert [call[0] for call in calls] == ["market_memory_llm", "market_state_snapshot"]
    assert all(call[1] == {"date": "2026-07-07"} for call in calls)
    assert all(call[2] == "codex" for call in calls)
    assert all(call[3] == "update-job" for call in calls)
    assert result["artifactType"] == "market_memory_update"
    assert result["savedCount"] == 3
    assert result["snapshotId"] == "snap_1"
    assert result["title"] == "최신 시장 상태"
    assert result["memory"]["artifactType"] == "market_memory"
    assert result["snapshot"]["artifactType"] == "market_state_snapshot"
    assert progress_calls[0]["message"].startswith("1/2")
    assert progress_calls[-1]["message"].startswith("2/2")
    assert progress_calls[0]["progress"] < progress_calls[-1]["progress"]


def test_briefing_agent_prompt_embeds_full_output_contract():
    contract = briefing_output_contract("both")
    prompt = bridge._agent_prompt(Path("pack.json"), {"outputContract": contract})
    assert "0. 오늘의 미국장 성격" in prompt
    assert "6. 다음 한국장 체크포인트" in prompt
    assert "10000" in prompt
    assert "축약" in prompt
    assert "# US Market Briefing — YYYY.MM.DD" in prompt
    assert "기업명" in prompt


def test_briefing_contract_rejects_missing_title_date_and_company_names():
    contract = briefing_output_contract("us")
    markdown = (
        "# US Market Briefing\n\n"
        "## 0. 오늘의 미국장 성격\n\n"
        "## 1. 미국장 시장 흐름\n\n"
        "## 2. 미국장을 움직인 핵심 변수\n\n"
        "## 3. 미국장을 주도한 기업 ① — [기업명]\n\n"
        "## 4. 미국장을 주도한 기업 ②\n\n"
        "## 5. 일반 투자자 관점\n\n"
        "## 6. 다음 미국장 체크포인트\n\n"
        "## 오늘의 결론\n\n"
        "## Source & Data Notes\n"
        + ("**한 줄 결론:** 요약\n" * 7)
        + ("· 요약 항목\n" * 18)
        + ("본문 " * 3000)
    )
    violations = briefing_contract_violations(markdown, contract)
    assert any("시장별 제목 날짜 누락" in item for item in violations)
    assert any("주도 기업명 누락" in item for item in violations)


def test_briefing_contract_rejects_preamble_between_title_and_section_zero():
    contract = briefing_output_contract("us")
    markdown = _valid_briefing_output().split("# Korea Market Briefing", 1)[0].strip()
    markdown = markdown.replace(
        "# US Market Briefing — 2099.12.31\n\n## 0. 오늘의 미국장 성격",
        "# US Market Briefing — 2099.12.31\n\n> 시장 범위: us\n\n## 0. 오늘의 미국장 성격",
    )
    violations = briefing_contract_violations(markdown, contract)
    assert any("제목 다음 프리앰블 금지" in item for item in violations)


def test_run_agent_task_retries_invalid_briefing_once_before_writeback():
    with TemporaryDirectory() as tmp:
        pack = {
            "taskType": "briefing",
            "artifactType": "briefing",
            "artifactId": "2099-12-31",
            "title": "Test Briefing",
            "outputContract": briefing_output_contract("both"),
            "draftArtifact": {"date": "2099-12-31"},
        }
        pack_path = Path(tmp) / "pack.json"
        pack_path.write_text("{}", encoding="utf-8")
        adapter = {"id": "codex", "label": "Codex CLI", "executable": "codex", "available": True}
        invalid = "# Daily Market Briefing\n\n## US Market Briefing\n짧은 요약"
        with (
            patch.object(bridge, "_select_adapter", return_value=adapter),
            patch.object(bridge.agent_service, "prepare_pack", return_value=(pack, pack_path)),
            patch.object(bridge, "_invoke_agent_cli", side_effect=[invalid, _valid_briefing_output()]) as invoke,
            patch.object(bridge.agent_service, "writeback_pack", return_value={"date": "2099-12-31", "title": "Test Briefing"}) as writeback,
            patch.object(bridge.schema, "update_pack_status"),
        ):
            result = bridge.run_agent_task("briefing", {}, job_id="retry-job")
        assert result["date"] == "2099-12-31"
        assert invoke.call_count == 2
        assert writeback.call_count == 1
        correction_prompt = invoke.call_args_list[1].args[1]
        assert "필수 제목 누락" in correction_prompt
        assert "축약하지" in correction_prompt


def test_run_agent_task_never_writes_briefing_after_two_invalid_outputs():
    with TemporaryDirectory() as tmp:
        pack = {
            "taskType": "briefing",
            "artifactType": "briefing",
            "artifactId": "2099-12-31",
            "title": "Test Briefing",
            "outputContract": briefing_output_contract("both"),
            "draftArtifact": {"date": "2099-12-31"},
        }
        pack_path = Path(tmp) / "pack.json"
        pack_path.write_text("{}", encoding="utf-8")
        adapter = {"id": "codex", "label": "Codex CLI", "executable": "codex", "available": True}
        invalid = "# Daily Market Briefing\n\n## US Market Briefing\n짧은 요약"
        with (
            patch.object(bridge, "_select_adapter", return_value=adapter),
            patch.object(bridge.agent_service, "prepare_pack", return_value=(pack, pack_path)),
            patch.object(bridge, "_invoke_agent_cli", side_effect=[invalid, invalid]) as invoke,
            patch.object(bridge.agent_service, "writeback_pack") as writeback,
            patch.object(bridge.schema, "update_pack_status"),
        ):
            with pytest.raises(RuntimeError, match="출력 계약을 충족하지 못했습니다"):
                bridge.run_agent_task("briefing", {}, job_id="retry-fail-job")
        assert invoke.call_count == 2
        writeback.assert_not_called()


def test_antigravity_invoke_does_not_send_prompt_to_stdin_on_non_windows():
    # macOS/Linux: 프롬프트는 --print 인자로 전달하므로 stdin으로 중복 전달하지 않는다.
    selected = {"id": "antigravity", "executable": "agy", "available": True}
    proc = Mock()
    proc.communicate.return_value = ("RESULT", "")
    proc.returncode = 0
    with patch.object(bridge.os, "name", "posix"), \
         patch.object(bridge, "_adapter_command", return_value=["agy", "--print"]), \
         patch("subprocess.Popen", return_value=proc):
        out = bridge._invoke_agent_cli(selected, "PROMPT", timeout=30)
    assert out == "RESULT"
    sent = proc.communicate.call_args
    assert (sent.args[0] if sent.args else sent.kwargs.get("input")) is None


def test_antigravity_invoke_fails_fast_on_windows():
    # agy Windows headless는 빈 결과를 반환하므로 5분 대기 없이 즉시 명확한 오류로 실패한다.
    selected = {"id": "antigravity", "executable": "agy", "available": True}
    with patch.object(bridge.os, "name", "nt"), \
         patch("subprocess.Popen") as popen:
        with pytest.raises(RuntimeError, match="Windows headless"):
            bridge._invoke_agent_cli(selected, "PROMPT", timeout=30)
    popen.assert_not_called()  # agy를 실행조차 하지 않는다


def test_codex_invoke_sends_prompt_to_stdin():
    selected = {"id": "codex", "executable": "codex", "available": True}
    proc = Mock()
    proc.communicate.return_value = ("RESULT", "")
    proc.returncode = 0
    with patch.object(bridge, "_adapter_command", return_value=["codex", "exec", "-"]), \
         patch("subprocess.Popen", return_value=proc):
        bridge._invoke_agent_cli(selected, "PROMPT", timeout=30)
    sent = proc.communicate.call_args
    assert (sent.args[0] if sent.args else sent.kwargs.get("input")) == "PROMPT"


if __name__ == "__main__":
    test_probe_requires_executable_to_run()
    test_antigravity_probe_available_on_non_windows()
    test_antigravity_probe_unavailable_on_windows()
    test_antigravity_command_uses_current_long_model_flag_and_print_prompt()
    test_antigravity_invoke_does_not_send_prompt_to_stdin_on_non_windows()
    test_antigravity_invoke_fails_fast_on_windows()
    test_codex_invoke_sends_prompt_to_stdin()
    test_bridge_parses_fenced_json_object()
    test_configured_provider_does_not_fall_back_to_another_cli()
    test_run_agent_task_captures_output_and_delegates_writeback()
