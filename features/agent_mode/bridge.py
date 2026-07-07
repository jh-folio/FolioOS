from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import threading
import time
from pathlib import Path

from features.agent_mode import schema
from features.agent_mode import service as agent_service
from features.agent_mode.briefing_contract import briefing_contract_violations
from features.common.jobs import cancel_job, get_job, submit_job
from features.llm_settings.client import load_dotenv

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_TIMEOUT_SECONDS = 1800
MAX_OUTPUT_CHARS = 4_000_000
ADAPTERS = ("codex", "claude", "antigravity")
STATUS_ADAPTERS = ADAPTERS
# adapter id → 실제 실행 바이너리 이름.
BINARY_NAMES = {"codex": "codex", "claude": "claude", "antigravity": "agy"}

_STATUS_CACHE: tuple[float, dict] | None = None
_STATUS_LOCK = threading.Lock()
_PROCESS_LOCK = threading.Lock()
_RUNNING_PROCESSES: dict[str, subprocess.Popen] = {}
_RUN_SEMAPHORE = threading.Semaphore(1)


def _creation_flags() -> int:
    return subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0


def _configured_executable(adapter: str) -> str:
    load_dotenv()
    env_name = f"FOLIO_AGENT_{adapter.upper()}_COMMAND"
    configured = str(os.environ.get(env_name, "") or "").strip().strip('"')
    if configured:
        return configured
    discovered = shutil.which(BINARY_NAMES.get(adapter, adapter)) or ""
    if adapter == "codex" and "\\windowsapps\\openai.codex_" in discovered.lower():
        # The desktop app bundles a private codex.exe that is not the standalone
        # CLI and can fail with Access denied when invoked by the bridge.
        return ""
    return discovered


def _probe_adapter(adapter: str) -> dict:
    executable = _configured_executable(adapter)
    labels = {
        "codex": "Codex CLI",
        "claude": "Claude Code CLI",
        "antigravity": "Antigravity CLI",
    }
    result = {
        "id": adapter,
        "label": labels.get(adapter, f"{adapter.capitalize()} CLI"),
        "available": False,
        "installed": False,
        "authenticated": False,
        "executable": executable,
        "version": "",
        "error": "",
        "bridgeSupported": True,
    }
    if not executable:
        result["error"] = "CLI를 찾을 수 없습니다."
        return result
    try:
        proc = subprocess.run(
            [executable, "--version"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=8,
            creationflags=_creation_flags(),
        )
        version = (proc.stdout or proc.stderr or "").strip().splitlines()
        result["version"] = version[0][:200] if version else ""
        if proc.returncode == 0:
            result["installed"] = True
        else:
            result["error"] = f"버전 확인 실패 (exit {proc.returncode})"
            return result

        if adapter == "antigravity":
            # agy 1.0.10의 Windows headless(--print)는 모델 응답을 stdout으로 내보내지 못한다
            # (transcript.jsonl을 /Users\... POSIX 경로로 열려다 실패하는 agy 버그). 대화는 완료돼도
            # 출력이 사라져 브리핑 생성이 항상 빈 결과로 끝난다. 따라서 Windows에서는 브리지 미지원으로
            # 표시하고 Codex/Claude를 안내한다. macOS(/Users 홈이 실제 경로)에서는 정상 동작한다.
            if os.name == "nt":
                result["installed"] = True
                result["available"] = False
                result["bridgeSupported"] = False
                result["error"] = (
                    "agy의 Windows headless 모드는 결과를 반환하지 못합니다(agy 업스트림 버그). "
                    "Codex 또는 Claude CLI를 사용하세요."
                )
                return result
            # agy는 비대화형 로그인 상태 확인 서브커맨드를 제공하지 않는다. 설치되어 있으면
            # 사용 가능으로 보고, 실제 인증 여부는 실행 시점의 오류로 사용자에게 노출한다.
            result["authenticated"] = True
            result["available"] = True
            return result

        auth_command = [executable, "login", "status"] if adapter == "codex" else [executable, "auth", "status"]

        auth = subprocess.run(
            auth_command,
            cwd=ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=8,
            creationflags=_creation_flags(),
        )
        if auth.returncode == 0:
            result["authenticated"] = True
            result["available"] = True
        else:
            detail = (auth.stdout or auth.stderr or "로그인이 필요합니다.").strip().splitlines()
            result["error"] = detail[-1][:300] if detail else "로그인이 필요합니다."
    except Exception as exc:
        result["error"] = str(exc)[:300]
    return result


def invalidate_bridge_status() -> None:
    global _STATUS_CACHE
    with _STATUS_LOCK:
        _STATUS_CACHE = None


def bridge_status(*, refresh: bool = False) -> dict:
    global _STATUS_CACHE
    load_dotenv()
    with _STATUS_LOCK:
        if not refresh and _STATUS_CACHE and time.monotonic() - _STATUS_CACHE[0] < 15:
            return _STATUS_CACHE[1]
        adapters = [_probe_adapter(adapter) for adapter in STATUS_ADAPTERS]
        preferred = str(os.environ.get("AGENT_CLI_PROVIDER", "auto") or "auto").strip().lower()
        available = [item for item in adapters if item["available"]]
        selected = next((item for item in available if item["id"] == preferred), None)
        if preferred == "auto" and not selected and available:
            selected = available[0]
        installed = [item for item in adapters if item.get("installed")]
        payload = {
            "available": bool(selected),
            "selectedAdapter": selected["id"] if selected else "",
            "adapters": adapters,
            "message": (
                f"{selected['label']} 사용 가능"
                if selected
                else (
                    f"선택한 {preferred} CLI를 사용할 수 없습니다. 설치 및 로그인 상태를 확인하세요."
                    if preferred in ADAPTERS
                    else "CLI가 설치되어 있지만 로그인이 필요합니다."
                    if installed
                    else "실행 가능한 Codex/Claude CLI가 없습니다. CLI 설치 상태를 확인하세요."
                )
            ),
        }
        _STATUS_CACHE = (time.monotonic(), payload)
        return payload


def agent_preflight(adapter: str = "") -> dict:
    """Return structured readiness checks for the CLI bridge.

    `bridge_status()` is optimized for quick availability display.  Preflight is
    a release-facing diagnostic contract: every failure should map to something
    the UI can show without exposing shell logs or secrets.
    """
    requested = str(adapter or "").strip().lower()
    if requested and requested not in ADAPTERS:
        raise ValueError(f"Unsupported agent adapter: {requested}")
    status = bridge_status(refresh=True)
    checks: list[dict] = []

    def add(check_id: str, label: str, ok: bool, message: str, *, severity: str = "error", detail: str = "") -> None:
        checks.append({
            "id": check_id,
            "label": label,
            "ok": bool(ok),
            "severity": "info" if ok else severity,
            "message": message,
            "detail": str(detail or "")[:500],
        })

    data_dir = ROOT / "data"
    add(
        "workspace",
        "Workspace",
        ROOT.exists() and (ROOT / "app.py").exists(),
        "Folio OS workspace를 확인했습니다." if ROOT.exists() else "Folio OS workspace를 찾을 수 없습니다.",
        detail=str(ROOT),
    )
    add(
        "data_dir",
        "Data Directory",
        data_dir.exists() or os.access(str(ROOT), os.W_OK),
        "data 폴더를 사용할 수 있습니다." if data_dir.exists() else "첫 실행 시 data 폴더를 생성할 수 있습니다.",
        detail=str(data_dir),
    )

    selected_id = requested or str(status.get("selectedAdapter") or "")
    selected = next((item for item in status.get("adapters") or [] if item.get("id") == selected_id), None)
    if not selected:
        add(
            "adapter_selected",
            "CLI Provider",
            False,
            status.get("message") or "사용 가능한 Agent CLI가 없습니다.",
        )
        return {
            "ok": False,
            "adapter": selected_id,
            "selectedAdapter": selected_id,
            "checks": checks,
            "status": status,
        }

    add(
        "adapter_installed",
        "CLI Installed",
        bool(selected.get("installed")),
        f"{selected.get('label') or selected_id} 설치를 확인했습니다."
        if selected.get("installed")
        else f"{selected.get('label') or selected_id} 설치가 필요합니다.",
        detail=selected.get("executable", ""),
    )
    add(
        "adapter_version",
        "CLI Version",
        bool(selected.get("version")),
        f"버전: {selected.get('version')}" if selected.get("version") else "CLI 버전을 확인하지 못했습니다.",
    )
    add(
        "adapter_auth",
        "CLI Auth",
        bool(selected.get("authenticated")),
        "CLI 로그인 상태를 확인했습니다." if selected.get("authenticated") else "CLI 로그인이 필요합니다.",
        detail=selected.get("error", ""),
    )
    add(
        "bridge_supported",
        "Bridge Support",
        bool(selected.get("bridgeSupported", True)),
        "이 CLI는 Folio OS Direct Bridge에서 지원됩니다."
        if selected.get("bridgeSupported", True)
        else selected.get("error") or "이 CLI는 현재 Direct Bridge에서 지원되지 않습니다.",
    )

    ok = all(item["ok"] for item in checks)
    return {
        "ok": ok,
        "adapter": selected_id,
        "selectedAdapter": selected_id,
        "checks": checks,
        "status": status,
    }


def _select_adapter(requested: str = "") -> dict:
    status = bridge_status(refresh=True)
    requested = str(requested or "").strip().lower()
    if requested and requested not in ADAPTERS:
        raise ValueError(f"Unsupported agent adapter: {requested}")
    if requested:
        selected = next((item for item in status["adapters"] if item["id"] == requested), None)
        if not selected or not selected["available"]:
            detail = (selected or {}).get("error") or "CLI를 사용할 수 없습니다."
            raise RuntimeError(f"{requested} adapter unavailable: {detail}")
        return selected
    selected_id = status.get("selectedAdapter")
    selected = next((item for item in status["adapters"] if item["id"] == selected_id), None)
    if not selected:
        raise RuntimeError(status.get("message") or "Agent CLI를 사용할 수 없습니다.")
    return selected


def _agent_prompt(pack_path: Path, pack: dict) -> str:
    contract = pack.get("outputContract") or {}
    output_format = contract.get("format", "markdown")
    lines = [
        "Act as the final Folio OS report author for this single task.",
        f"Read the UTF-8 Agent Context Pack at: {pack_path}",
        "Follow agentInstructions, prompt, context, evidence boundaries, outputContract, and writeBackContract in that pack.",
        "Do not modify files, run the Folio OS writeback command, or expose credentials.",
    ]
    required = contract.get("requiredSections") or []
    if required:
        lines.extend([
            "Do not summarize, shorten, merge, or omit required report sections (필수 섹션을 축약하지 마세요).",
            f"Minimum report length: {int(contract.get('minimumCharacters') or 0)} characters.",
            f"Minimum '**한 줄 결론:**' count: {int(contract.get('minimumOneLineConclusions') or 0)}.",
            f"Minimum middle-dot summary line count: {int(contract.get('minimumMiddleDotBullets') or 0)}.",
            "Each market title must be an H1 with a date, exactly like '# US Market Briefing — YYYY.MM.DD' and/or '# Korea Market Briefing — YYYY.MM.DD'.",
            "After each market title, start immediately with the matching '## 0. 오늘의 ... 성격' section. Do not add market-scope notes, source-date explanations, blockquotes, or any preamble.",
            "Leading company headings must include the concrete company name after an em dash, e.g. '## 3. 미국장을 주도한 기업 ① — NVIDIA'. Never leave '[기업명]' or omit the company name.",
            "Required Markdown heading fragments, in contract order:",
            *(f"- {section}" for section in required),
        ])
    lines.append(f"Return only the final {output_format} payload. Do not wrap it in commentary or Markdown fences.")
    return "\n".join(lines)


def _adapter_command(adapter: dict, prompt: str = "", model_override: str = "") -> list[str]:
    from features.agent_mode.setup import configured_model

    executable = adapter["executable"]
    model = str(model_override or "").strip() or configured_model(adapter["id"])
    if adapter["id"] == "antigravity":
        # agy는 단일 프롬프트를 인자(--print <prompt>)로 받아 비대화형 실행한다. 단, Windows
        # headless는 출력을 stdout으로 내지 못하므로 _invoke_agent_cli에서 Windows를 사전 차단한다.
        command = [executable]
        if model:
            command.extend(["--model", model])
        command.extend(["--print", prompt])
        return command
    if adapter["id"] == "codex":
        command = [
            executable,
            "exec",
            "--skip-git-repo-check",
            "--ephemeral",
            "--sandbox",
            "read-only",
        ]
        if model:
            command.extend(["--model", model])
        command.append("-")
        return command
    if adapter["id"] == "claude":
        command = [
            executable,
            "--print",
            "--output-format",
            "text",
            "--permission-mode",
            "plan",
        ]
        if model:
            command.extend(["--model", model])
        return command
    raise ValueError(f"Unsupported adapter: {adapter['id']}")


def _child_environment() -> dict:
    env = dict(os.environ)
    for key in [
        "OPENAI_API_KEY",
        "ANTHROPIC_API_KEY",
        "GEMINI_API_KEY",
        "GOOGLE_API_KEY",
        "CODEX_API_KEY",
    ]:
        env.pop(key, None)
    env["PYTHONIOENCODING"] = "utf-8"
    return env


def _strip_outer_fence(text: str) -> str:
    value = str(text or "").strip()
    match = re.fullmatch(r"```(?:markdown|md|json)?\s*\n?(.*?)\n?```", value, re.I | re.S)
    return match.group(1).strip() if match else value


def _json_payload(text: str) -> dict:
    value = _strip_outer_fence(text)
    try:
        payload = json.loads(value)
    except json.JSONDecodeError:
        start = value.find("{")
        end = value.rfind("}")
        if start < 0 or end <= start:
            raise ValueError("Agent CLI did not return a JSON object")
        payload = json.loads(value[start:end + 1])
    if not isinstance(payload, dict):
        raise ValueError("Agent CLI JSON output must be an object")
    return payload


def _result_summary(task_type: str, pack: dict, result: dict, adapter: str) -> dict:
    draft = pack.get("draftArtifact") or {}
    summary = {
        "generationMode": "llm_cli",
        "adapter": adapter,
        "artifactType": pack.get("artifactType") or task_type,
        "artifactId": result.get("id") or pack.get("artifactId"),
        "title": result.get("title") or result.get("headline") or pack.get("title"),
    }
    if task_type == "briefing":
        summary["date"] = result.get("date") or draft.get("date") or pack.get("artifactId")
    elif task_type == "company_analysis":
        summary["reportId"] = result.get("id") or pack.get("artifactId")
        summary["filename"] = result.get("filename", "")
        summary["analysisStyle"] = draft.get("analysisStyle") or (pack.get("metadata") or {}).get("analysisStyle", "")
    elif task_type == "topic_report":
        summary["reportId"] = result.get("id") or pack.get("artifactId")
        summary["filename"] = result.get("filename", "")
    elif task_type == "personal_overlay":
        internal = pack.get("internal") or {}
        summary["reportKind"] = internal.get("reportKind", "")
        summary["reportId"] = (draft.get("canonical") or {}).get("id", "")
    elif task_type == "thesis_delta":
        summary["ticker"] = ((pack.get("internal") or {}).get("thesis") or {}).get("ticker", "")
    elif task_type == "market_memory_llm":
        summary["savedCount"] = len(result.get("saved") or [])
        summary["date"] = pack.get("artifactId")
    elif task_type == "market_state_snapshot":
        snapshot = result.get("snapshot") or {}
        summary["snapshotId"] = snapshot.get("id", "")
        summary["title"] = snapshot.get("headline") or summary.get("title")
        summary["date"] = pack.get("artifactId")
        summary["statusMessage"] = "AI Agent 시장 상태 스냅샷을 저장했습니다."
    elif task_type == "quality_repair":
        internal = pack.get("internal") or {}
        summary["targetArtifactType"] = internal.get("targetArtifactType", "")
        summary["targetArtifactId"] = internal.get("targetArtifactId", "")
    elif task_type == "investment_review":
        summary["date"] = result.get("date") or pack.get("artifactId")
    return summary


def _invoke_agent_cli(selected: dict, prompt: str, timeout: int, job_id: str = "", model_override: str = "") -> str:
    is_antigravity = selected.get("id") == "antigravity"
    if is_antigravity and os.name == "nt":
        # agy 1.0.10 Windows headless(--print)는 모델 응답을 stdout으로 반환하지 못한다
        # (transcript.jsonl을 /Users\... 경로로 열려다 실패하는 agy 버그). 기본 --print-timeout
        # 5분을 기다린 뒤 빈 결과로 실패하므로, 5분 대기 없이 즉시 명확한 안내로 실패시킨다.
        raise RuntimeError(
            "Antigravity(agy)는 Windows headless 모드에서 브리핑 결과를 반환하지 못합니다(agy 업스트림 버그). "
            "Codex 또는 Claude CLI를 선택해 생성하세요."
        )
    command = _adapter_command(selected, prompt, model_override=model_override)
    proc = subprocess.Popen(
        command,
        cwd=ROOT,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
        errors="replace",
        env=_child_environment(),
        creationflags=_creation_flags(),
    )
    if job_id:
        with _PROCESS_LOCK:
            _RUNNING_PROCESSES[job_id] = proc
    try:
        # antigravity는 프롬프트를 명령 인자(--print <prompt>)로 받으므로 stdin으로 중복 전달하지
        # 않는다(중복 입력 시 빈 출력). codex/claude는 stdin으로 받는다.
        stdin_data = None if is_antigravity else prompt
        stdout, stderr = proc.communicate(stdin_data, timeout=timeout)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.communicate()
        raise TimeoutError(f"Agent CLI 실행 시간이 {timeout}초를 초과했습니다.")
    finally:
        if job_id:
            with _PROCESS_LOCK:
                _RUNNING_PROCESSES.pop(job_id, None)
    if proc.returncode != 0:
        error = (stderr or stdout or f"exit {proc.returncode}").strip()[-2000:]
        raise RuntimeError(f"Agent CLI 실행 실패 (exit {proc.returncode}): {error}")
    output = _strip_outer_fence(stdout)
    if not output:
        detail = (stderr or "").strip()[-500:]
        raise RuntimeError(
            "Agent CLI가 최종 결과를 반환하지 않았습니다." + (f" (stderr: {detail})" if detail else "")
        )
    if len(output) > MAX_OUTPUT_CHARS:
        raise RuntimeError("Agent CLI 결과가 허용 크기를 초과했습니다.")
    return output


def _briefing_correction_prompt(base_prompt: str, violations: list[str], contract: dict) -> str:
    required = "\n".join(f"- {section}" for section in contract.get("requiredSections") or [])
    problems = "\n".join(f"- {violation}" for violation in violations)
    return "\n".join([
        base_prompt,
        "",
        "The previous briefing output violated the Folio OS API-parity contract.",
        "Regenerate the complete report from the same context pack. Do not patch or 축약하지 마세요.",
        "Contract violations:",
        problems,
        "Hard format reminders:",
        "- Market titles must be '# US Market Briefing — YYYY.MM.DD' and/or '# Korea Market Briefing — YYYY.MM.DD'.",
        "- The line after each market title must be the matching '## 0. 오늘의 ... 성격' heading; no preamble or blockquote.",
        "- Section 3 and 4 leading-company headings must include a concrete company name after '—'.",
        "Required heading fragments:",
        required,
        "Return a complete replacement Markdown report only.",
    ])


def run_agent_prompt(prompt: str, *, adapter: str = "", model: str = "", timeout: int = 0, job_id: str = "") -> dict:
    """단일 프롬프트를 Agent CLI로 실행하고 텍스트 결과만 돌려준다(파일 쓰기 없음).

    Agent 채팅처럼 context pack/writeback이 필요 없는 read-only 호출용이다.
    """
    effective_timeout = timeout or max(30, int(os.environ.get("AGENT_CHAT_TIMEOUT_SECONDS", 300)))
    with _RUN_SEMAPHORE:
        selected = _select_adapter(adapter)
        output = _invoke_agent_cli(selected, prompt, effective_timeout, job_id, model_override=model)
    return {"output": output, "adapter": selected["id"]}


def run_agent_task(
    task_type: str,
    params: dict | None = None,
    *,
    adapter: str = "",
    progress=None,
    job_id: str = "",
) -> dict:
    params = params if isinstance(params, dict) else {}
    progress = progress or (lambda *args, **kwargs: None)
    with _RUN_SEMAPHORE:
        if job_id and (get_job(job_id) or {}).get("status") == "cancelled":
            return {"cancelled": True, "artifactType": task_type}
        selected = _select_adapter(adapter)
        progress("Agent context pack을 구성하고 있습니다.", 10, adapter=selected["id"])
        pack, pack_path = agent_service.prepare_pack(task_type, **params)
        progress("Agent CLI를 실행하고 있습니다.", 25, contextPackPath=str(pack_path), adapter=selected["id"])
        agent_prompt = _agent_prompt(pack_path, pack)
        timeout = max(30, int(os.environ.get("AGENT_CLI_TIMEOUT_SECONDS", DEFAULT_TIMEOUT_SECONDS)))
        try:
            output = _invoke_agent_cli(selected, agent_prompt, timeout, job_id)
            output_format = (pack.get("outputContract") or {}).get("format", "markdown")
            if task_type == "briefing" and output_format == "markdown":
                contract = pack.get("outputContract") or {}
                violations = briefing_contract_violations(output, contract)
                retries = max(0, int(contract.get("retryOnViolation") or 0))
                if violations and retries:
                    progress("CLI 브리핑 구조를 보완해 다시 작성하고 있습니다.", 60, adapter=selected["id"])
                    correction_prompt = _briefing_correction_prompt(agent_prompt, violations, contract)
                    output = _invoke_agent_cli(selected, correction_prompt, timeout, job_id)
                    violations = briefing_contract_violations(output, contract)
                if violations:
                    raise RuntimeError(
                        "Agent CLI 브리핑이 출력 계약을 충족하지 못했습니다: "
                        + "; ".join(violations)
                    )
        except Exception as exc:
            schema.update_pack_status(pack_path, status="failed", result={"error": str(exc)[:2000]})
            raise
        progress("Agent 결과를 기존 저장소에 반영하고 있습니다.", 85, adapter=selected["id"])
        output_format = (pack.get("outputContract") or {}).get("format", "markdown")
        if output_format == "json":
            result = agent_service.writeback_pack(pack, payload=_json_payload(output))
        else:
            result = agent_service.writeback_pack(pack, markdown=output)
        summary = _result_summary(task_type, pack, result, selected["id"])
        schema.update_pack_status(pack_path, status="done", result=summary)
        progress("Agent 결과 저장을 완료했습니다.", 100, **summary)
        return summary


def _phase_progress(progress, label: str, start: int, end: int):
    span = max(0, end - start)

    def _progress(message, progress_value=None, **extra):
        scaled = None
        if progress_value is not None:
            try:
                scaled = start + int(round((float(progress_value) / 100.0) * span))
            except (TypeError, ValueError):
                scaled = start
        progress(f"{label} {message}", scaled, **extra)

    return _progress


def run_market_memory_update_task(
    params: dict | None = None,
    *,
    adapter: str = "",
    progress=None,
    job_id: str = "",
) -> dict:
    params = params if isinstance(params, dict) else {}
    date = str(params.get("date") or "").strip()
    task_params = {"date": date} if date else {}
    progress = progress or (lambda *args, **kwargs: None)
    memory = run_agent_task(
        "market_memory_llm",
        task_params,
        adapter=adapter,
        progress=_phase_progress(progress, "1/2 중기 메모리:", 0, 50),
        job_id=job_id,
    )
    snapshot = run_agent_task(
        "market_state_snapshot",
        task_params,
        adapter=adapter,
        progress=_phase_progress(progress, "2/2 시장 상태:", 50, 100),
        job_id=job_id,
    )
    return {
        "generationMode": "llm_cli",
        "adapter": snapshot.get("adapter") or memory.get("adapter") or adapter or "auto",
        "artifactType": "market_memory_update",
        "artifactId": date or snapshot.get("date") or memory.get("date") or "",
        "title": snapshot.get("title") or "Market Memory Update",
        "date": date or snapshot.get("date") or memory.get("date") or "",
        "savedCount": memory.get("savedCount", 0),
        "snapshotId": snapshot.get("snapshotId", ""),
        "memory": memory,
        "snapshot": snapshot,
        "message": "시장 메모리와 화면용 시장 상태 스냅샷을 모두 업데이트했습니다.",
    }


def submit_agent_task(task_type: str, params: dict | None = None, *, adapter: str = "") -> dict:
    label = {
        "briefing": "LLM CLI 브리핑 생성",
        "company_analysis": "LLM CLI 기업 분석",
        "topic_report": "LLM CLI 테마 분석",
        "personal_overlay": "LLM CLI Personal Overlay",
        "thesis_delta": "LLM CLI Thesis Delta",
        "market_memory_llm": "LLM CLI 시장 내러티브 정리",
        "market_state_snapshot": "LLM CLI 시장 상태 정리",
        "quality_repair": "LLM CLI 품질 개선",
        "investment_review": "LLM CLI 투자 리뷰",
    }.get(task_type, f"LLM CLI {task_type}")
    job = submit_job(
        "agent_bridge",
        label,
        run_agent_task,
        task_type,
        params or {},
        adapter=adapter,
        pass_job_id=True,
        dedicated_thread=True,
    )
    job["generationMode"] = "llm_cli"
    job["adapter"] = adapter or "auto"
    return job


def submit_market_memory_update(params: dict | None = None, *, adapter: str = "") -> dict:
    job = submit_job(
        "agent_bridge",
        "LLM CLI 시장 메모리 업데이트",
        run_market_memory_update_task,
        params or {},
        adapter=adapter,
        pass_job_id=True,
        dedicated_thread=True,
    )
    job["generationMode"] = "llm_cli"
    job["adapter"] = adapter or "auto"
    return job


def cancel_agent_task(job_id: str) -> dict:
    with _PROCESS_LOCK:
        proc = _RUNNING_PROCESSES.get(str(job_id))
    if proc and proc.poll() is None:
        proc.terminate()
    return cancel_job(job_id)
