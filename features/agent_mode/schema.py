from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any

from features.common.utils import now_iso

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data"
CONTEXT_DIR = DATA_DIR / "agent-context"

TASK_TYPES = {
    "briefing",
    "company_analysis",
    "topic_report",
    "personal_overlay",
    "thesis_delta",
    "market_memory_llm",
    "market_state_snapshot",
    "quality_repair",
    "investment_review",
}

TASK_DIR_NAMES = {
    "briefing": "briefing",
    "company_analysis": "company-analysis",
    "topic_report": "topic-report",
    "personal_overlay": "personal-overlay",
    "thesis_delta": "thesis-delta",
    "market_memory_llm": "market-memory",
    "market_state_snapshot": "market-state",
    "quality_repair": "quality-repair",
    "investment_review": "investment-review",
}

SECRET_KEY_RE = re.compile(r"(api[_-]?key|token|secret|password|authorization|notion[_-]?token)", re.I)
SECRET_VALUE_RE = re.compile(
    r"(sk-[A-Za-z0-9_\-]{12,}|sk-proj-[A-Za-z0-9_\-]{12,}|gh[opsu]_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9\-]{20,})"
)


def safe_slug(value: str, fallback: str = "item") -> str:
    slug = re.sub(r"[^A-Za-z0-9_.-]+", "_", str(value or "").strip()).strip("._-")
    return slug[:120] or fallback


def task_dir(task_type: str) -> Path:
    normalized = normalize_task_type(task_type)
    path = CONTEXT_DIR / TASK_DIR_NAMES[normalized]
    path.mkdir(parents=True, exist_ok=True)
    return path


def normalize_task_type(task_type: str) -> str:
    value = str(task_type or "").strip().lower().replace("-", "_")
    if value not in TASK_TYPES:
        raise ValueError(f"Unsupported agent task type: {task_type}")
    return value


def scrub_secrets(value: Any) -> Any:
    if isinstance(value, dict):
        out = {}
        for key, item in value.items():
            if SECRET_KEY_RE.search(str(key)):
                out[key] = "[redacted]"
            else:
                out[key] = scrub_secrets(item)
        return out
    if isinstance(value, list):
        return [scrub_secrets(item) for item in value]
    if isinstance(value, str):
        return SECRET_VALUE_RE.sub("[redacted]", value)
    return value


def pack_id(task_type: str, artifact_id: str) -> str:
    raw = f"{normalize_task_type(task_type)}:{artifact_id}:{now_iso()}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]


def build_pack(
    *,
    task_type: str,
    artifact_id: str,
    title: str,
    prompt: str,
    context: str,
    output_contract: dict,
    write_back_contract: dict,
    save_target: str,
    artifact_type: str = "",
    metadata: dict | None = None,
    draft_artifact: dict | None = None,
    sources: list | None = None,
    source_ledger: list | None = None,
    evidence_items: list | None = None,
    checkpoints: list | None = None,
    data_gaps: list | None = None,
    market_tape: dict | None = None,
    internal: dict | None = None,
    warnings: list | None = None,
) -> dict:
    task_type = normalize_task_type(task_type)
    artifact_id = str(artifact_id or "").strip() or task_type
    pack = {
        "packId": pack_id(task_type, artifact_id),
        "taskType": task_type,
        "artifactType": artifact_type or task_type,
        "artifactId": artifact_id,
        "title": title,
        "createdAt": now_iso(),
        "status": "prepared",
        "prompt": prompt or "",
        "context": context or "",
        "agentInstructions": agent_instructions(task_type),
        "outputContract": output_contract or {},
        "writeBackContract": write_back_contract or {},
        "saveTarget": save_target,
        "metadata": metadata or {},
        "draftArtifact": draft_artifact or {},
        "sources": sources or [],
        "sourceLedger": source_ledger or [],
        "evidenceItems": evidence_items or [],
        "checkpoints": checkpoints or [],
        "dataGaps": data_gaps or [],
        "marketTape": market_tape or {},
        "internal": internal or {},
        "warnings": warnings or [],
    }
    return scrub_secrets(pack)


def agent_instructions(task_type: str) -> str:
    task_type = normalize_task_type(task_type)
    base = [
        "You are the current AI agent acting as the final Folio OS author.",
        "Use only the provided prompt/context plus clearly cited local/web material you explicitly inspect.",
        "Do not use .env, API keys, tokens, or private credentials.",
        "Respect Folio OS layers: external evidence is evidence, Folio OS reports are source-grounded, user notes are hypotheses only.",
        "Include counter-evidence, uncertainties, and concrete next checkpoints when the task asks for judgment.",
        "Do not invent unavailable numbers. State data gaps and suggested verification routes.",
    ]
    if task_type in {"briefing", "company_analysis", "topic_report", "quality_repair"}:
        base.append("Return polished Markdown for the canonical report body. Do not include Personal Overlay content.")
    elif task_type == "investment_review":
        base.append("Return polished Markdown for a Personal Overlay investment review while keeping hypotheses separate from evidence.")
    elif task_type == "personal_overlay":
        base.append("Return JSON matching the overlay contract. Do not modify the canonical report markdown.")
    elif task_type == "thesis_delta":
        base.append("Return JSON matching the Thesis Delta contract. Validate the thesis; do not defend it by default.")
    elif task_type == "market_memory_llm":
        base.append("Return JSON with an entries array matching the market-memory contract. Use only source-grounded candidate issues.")
    elif task_type == "market_state_snapshot":
        base.append("Return JSON matching the MarketStateSnapshot contract. Synthesize one market-wide medium-term state, not individual memory rows.")
    return "\n".join(f"- {line}" for line in base)


def write_pack(pack: dict) -> Path:
    task_type = normalize_task_type(pack.get("taskType"))
    artifact_id = safe_slug(pack.get("artifactId"), fallback=task_type)
    path = task_dir(task_type) / f"{artifact_id}_{pack.get('packId')}.json"
    path.write_text(json.dumps(scrub_secrets(pack), ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def read_pack(path: str | Path) -> dict:
    p = Path(path)
    if not p.is_absolute():
        p = ROOT / p
    resolved = p.resolve()
    resolved.relative_to(ROOT)
    return json.loads(resolved.read_text(encoding="utf-8"))


def update_pack_status(path: str | Path, *, status: str, result: dict | None = None) -> dict:
    p = Path(path)
    if not p.is_absolute():
        p = ROOT / p
    pack = read_pack(p)
    pack["status"] = status
    pack["updatedAt"] = now_iso()
    if result is not None:
        pack["result"] = scrub_secrets(result)
    p.write_text(json.dumps(pack, ensure_ascii=False, indent=2), encoding="utf-8")
    return pack


def agent_generation(source_count: int = 0, *, status: str = "ok_agent_authored", message: str = "") -> dict:
    return {
        "mode": "agent",
        "status": status,
        "provider": "external_agent",
        "model": "current-agent-session",
        "message": message or "AI 에이전트가 Folio OS context pack을 읽고 생성했습니다.",
        "sourceCount": int(source_count or 0),
    }
