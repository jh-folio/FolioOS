from __future__ import annotations

import os
import shutil
import subprocess
from pathlib import Path

from features.common.jobs import submit_job
from features.llm_settings.client import load_dotenv, write_env_values
from features.llm_settings.model_catalog import CLI_MODEL_FALLBACKS, choices_from_catalog, discover_cli_models

ROOT = Path(__file__).resolve().parents[2]
ADAPTERS = {"codex", "claude", "antigravity"}
ADAPTER_ORDER = ("codex", "claude", "antigravity")

# adapter id → 실제 실행 바이너리 이름(PATH 탐색용).
BINARY_NAMES = {"codex": "codex", "claude": "claude", "antigravity": "agy"}

MODEL_CHOICES = CLI_MODEL_FALLBACKS

INSTALL_INFO = {
    "codex": {
        "label": "Codex CLI",
        "docsUrl": "https://developers.openai.com/codex/cli/",
        "windowsCommand": "$env:CODEX_NON_INTERACTIVE=1; irm https://chatgpt.com/codex/install.ps1 | iex",
    },
    "claude": {
        "label": "Claude Code CLI",
        "docsUrl": "https://code.claude.com/docs/en/setup",
        "windowsCommand": "irm https://claude.ai/install.ps1 | iex",
    },
    "antigravity": {
        "label": "Antigravity CLI",
        "docsUrl": "https://antigravity.google/product/antigravity-cli",
        "windowsCommand": "irm https://antigravity.google/cli/install.ps1 | iex",
    },
}


def normalize_adapter(value: str) -> str:
    adapter = str(value or "").strip().lower()
    if adapter not in ADAPTERS:
        raise ValueError(f"Unsupported CLI provider: {value}")
    return adapter


def configured_model(adapter: str) -> str:
    load_dotenv()
    adapter = normalize_adapter(adapter)
    configured = str(os.environ.get(f"FOLIO_AGENT_{adapter.upper()}_MODEL", "") or "").strip()
    if configured:
        return configured
    return MODEL_CHOICES[adapter][0]["value"]


def configured_provider() -> str:
    load_dotenv()
    value = str(os.environ.get("AGENT_CLI_PROVIDER", "auto") or "auto").strip().lower()
    return value if value in {"auto", *ADAPTERS} else "auto"


def settings_payload(*, refresh: bool = False) -> dict:
    from features.agent_mode.bridge import bridge_status

    status = bridge_status(refresh=refresh)
    adapters = []
    for item in status.get("adapters") or []:
        adapter = item.get("id")
        bridge_supported = adapter in ADAPTERS and item.get("bridgeSupported") is not False
        catalog = discover_cli_models(adapter, executable=str(item.get("executable") or ""), refresh=refresh) if bridge_supported else {}
        adapters.append({
            **item,
            "model": configured_model(adapter) if bridge_supported else "",
            "modelChoices": choices_from_catalog(catalog) if bridge_supported else [],
            "modelDiscovery": {k: v for k, v in catalog.items() if k != "modelChoices"} if bridge_supported else {},
            "docsUrl": INSTALL_INFO.get(adapter, {}).get("docsUrl", ""),
            "installCommand": INSTALL_INFO.get(adapter, {}).get("windowsCommand", "") if bridge_supported and os.name == "nt" else "",
            "bridgeSupported": bridge_supported,
            "installSupported": bridge_supported and os.name == "nt",
            "loginSupported": bridge_supported,
        })
    return {
        **status,
        "provider": configured_provider(),
        "adapters": adapters,
        "platform": os.name,
    }


def _saved_settings_payload(provider: str, models: dict) -> dict:
    adapters = []
    for adapter in ADAPTER_ORDER:
        catalog = discover_cli_models(adapter, executable="", refresh=False)
        adapters.append({
            "id": adapter,
            "label": INSTALL_INFO[adapter]["label"],
            "available": False,
            "installed": False,
            "authenticated": False,
            "executable": "",
            "error": "저장되었습니다. 설치/로그인 상태와 최신 모델은 새로고침으로 확인하세요.",
            "model": str(models.get(adapter) or configured_model(adapter)),
            "modelChoices": choices_from_catalog(catalog),
            "modelDiscovery": {k: v for k, v in catalog.items() if k != "modelChoices"},
            "docsUrl": INSTALL_INFO[adapter]["docsUrl"],
            "installCommand": INSTALL_INFO[adapter]["windowsCommand"] if os.name == "nt" else "",
            "bridgeSupported": True,
            "installSupported": os.name == "nt",
            "loginSupported": True,
        })
    return {
        "available": False,
        "selectedAdapter": provider if provider in ADAPTERS else "",
        "provider": provider,
        "adapters": adapters,
        "platform": os.name,
        "message": "AI Agent 설정을 저장했습니다. 최신 CLI 상태와 모델 목록은 새로고침으로 확인하세요.",
    }


def save_settings(body: dict | None = None) -> dict:
    from features.agent_mode.bridge import invalidate_bridge_status

    data = body if isinstance(body, dict) else {}
    provider = str(data.get("provider") or "auto").strip().lower()
    if provider not in {"auto", *ADAPTERS}:
        raise ValueError(f"Unsupported CLI provider: {provider}")
    updates = {"AGENT_CLI_PROVIDER": provider}
    models = data.get("models") if isinstance(data.get("models"), dict) else {}
    for adapter in ADAPTERS:
        if adapter not in models:
            continue
        model = str(models.get(adapter, "") or "").strip()
        if not model:
            continue
        if len(model) > 120 or any(ch.isspace() for ch in model):
            raise ValueError(f"Unsupported {adapter} model: {model}")
        updates[f"FOLIO_AGENT_{adapter.upper()}_MODEL"] = model
    write_env_values(updates)
    invalidate_bridge_status()
    return _saved_settings_payload(provider, models)


def _windows_install_command(adapter: str) -> list[str]:
    adapter = normalize_adapter(adapter)
    if os.name != "nt":
        raise RuntimeError("웹 설치는 현재 Windows에서만 지원합니다. 공식 설치 문서를 이용하세요.")
    script = INSTALL_INFO[adapter]["windowsCommand"]
    powershell = shutil.which("pwsh") or shutil.which("powershell")
    if not powershell:
        raise RuntimeError("PowerShell을 찾을 수 없습니다.")
    return [powershell, "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script]


def _installed_path_candidates(adapter: str) -> list[Path]:
    local = Path(os.environ.get("LOCALAPPDATA", ""))
    home = Path.home()
    if adapter == "codex":
        return [local / "Programs" / "OpenAI" / "Codex" / "bin" / "codex.exe"]
    if adapter == "antigravity":
        # 설치 경로가 공개되어 있지 않으므로 PATH의 `agy`를 우선 사용한다.
        return [home / ".local" / "bin" / "agy.exe", local / "Programs" / "Antigravity" / "agy.exe"]
    return [home / ".local" / "bin" / "claude.exe", local / "Programs" / "Claude" / "claude.exe"]


def install_cli(adapter: str, *, progress=None, job_id: str = "") -> dict:
    from features.agent_mode.bridge import invalidate_bridge_status

    adapter = normalize_adapter(adapter)
    progress = progress or (lambda *args, **kwargs: None)
    progress(f"{INSTALL_INFO[adapter]['label']} 공식 설치 스크립트를 실행하고 있습니다.", 10)
    command = _windows_install_command(adapter)
    proc = subprocess.run(
        command,
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=600,
        creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
    )
    if proc.returncode != 0:
        error = (proc.stderr or proc.stdout or "installation failed").strip()[-3000:]
        raise RuntimeError(f"{INSTALL_INFO[adapter]['label']} 설치 실패: {error}")
    updates = {}
    candidates = list(_installed_path_candidates(adapter))
    discovered = shutil.which(BINARY_NAMES.get(adapter, adapter))
    if discovered:
        candidates.append(Path(discovered))
    for candidate in candidates:
        if candidate.exists():
            updates[f"FOLIO_AGENT_{adapter.upper()}_COMMAND"] = str(candidate)
            break
    if updates:
        write_env_values(updates)
    invalidate_bridge_status()
    progress("설치가 완료되었습니다. 로그인 상태를 확인하세요.", 100)
    return {
        "ok": True,
        "adapter": adapter,
        "message": f"{INSTALL_INFO[adapter]['label']} 설치가 완료되었습니다.",
        "settings": settings_payload(refresh=True),
    }


def submit_install(adapter: str) -> dict:
    adapter = normalize_adapter(adapter)
    return submit_job(
        "agent_cli_install",
        f"{INSTALL_INFO[adapter]['label']} 설치",
        install_cli,
        adapter,
        pass_job_id=True,
        dedicated_thread=True,
    )


def launch_login(adapter: str) -> dict:
    from features.agent_mode.bridge import bridge_status, invalidate_bridge_status

    adapter = normalize_adapter(adapter)
    status = bridge_status(refresh=True)
    item = next((row for row in status.get("adapters") or [] if row.get("id") == adapter), None)
    executable = str((item or {}).get("executable") or "")
    if not executable or not (item or {}).get("installed"):
        raise RuntimeError(f"{INSTALL_INFO[adapter]['label']}가 설치되어 있지 않거나 실행할 수 없습니다.")
    if adapter == "codex":
        args = [executable, "login"]
    elif adapter == "antigravity":
        # agy는 인자 없이 실행하면 브라우저 OAuth 로그인 흐름을 연다.
        args = [executable]
    else:
        args = [executable, "auth", "login"]
    creationflags = subprocess.CREATE_NEW_CONSOLE if os.name == "nt" else 0
    subprocess.Popen(args, cwd=ROOT, creationflags=creationflags)
    invalidate_bridge_status()
    return {
        "ok": True,
        "adapter": adapter,
        "message": "로그인 창을 열었습니다. 로그인 완료 후 상태 새로고침을 누르세요.",
    }
