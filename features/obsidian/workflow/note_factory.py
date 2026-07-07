"""Create user-synthesis notes in the configured Obsidian Vault."""
from __future__ import annotations

import re
from pathlib import Path

from features.obsidian.export.service import get_vault_settings
from features.obsidian.workflow.templates import build_template

ROOT = Path(__file__).resolve().parents[3]

FOLDERS = {
    "company_thesis": "Thesis",
    "market_memo": "Narratives",
    "topic_review": "Personal Reviews",
    "investment_note": "Investment Notes",
}

INVESTMENT_NOTE_MARKER = "## 메모"


def _require_vault() -> Path:
    settings = get_vault_settings()
    vault_path = str(settings.get("vaultPath") or "").strip()
    if not vault_path:
        raise ValueError("Obsidian vault 경로가 설정되지 않았습니다.")
    vault = Path(vault_path)
    if not vault.exists():
        raise ValueError(f"Vault 경로가 존재하지 않습니다: {vault_path}")
    return vault


def safe_filename(value: str) -> str:
    cleaned = re.sub(r'[\\/:*?"<>|#^[\]]', "", str(value or "")).strip()
    return cleaned or "Untitled"


def _filename(template_type: str, context: dict) -> str:
    if template_type == "company_thesis":
        label = str(context.get("ticker") or context.get("company") or "Company").strip()
        return safe_filename(f"{label.upper()} Company Thesis") + ".md"
    if template_type == "market_memo":
        return safe_filename(str(context.get("topic") or "Market Memo")) + ".md"
    if template_type == "topic_review":
        topic = str(context.get("topic") or "Topic Review").strip()
        return safe_filename(f"{topic} Review") + ".md"
    if template_type == "investment_note":
        label = str(context.get("label") or context.get("ticker") or context.get("topic") or "투자").strip()
        return safe_filename(f"{label} 투자 노트") + ".md"
    raise ValueError(f"지원하지 않는 Obsidian 노트 템플릿입니다: {template_type}")


def create_note(template_type: str, context: dict | None = None, *, overwrite: bool = False) -> dict:
    context = context or {}
    template_type = str(template_type or "").strip()
    vault = _require_vault()
    folder = vault / FOLDERS.get(template_type, "Personal Reviews")
    folder.mkdir(parents=True, exist_ok=True)
    filename = _filename(template_type, context)
    path = folder / filename
    if path.exists() and not overwrite:
        return {
            "ok": True,
            "created": False,
            "exists": True,
            "path": str(path),
            "filename": filename,
            "message": "이미 같은 노트가 있어 새로 만들지 않았습니다.",
        }
    body = build_template(template_type, context)
    path.write_text(body, encoding="utf-8")
    return {
        "ok": True,
        "created": True,
        "exists": False,
        "path": str(path),
        "filename": filename,
        "message": "노트를 저장했습니다." if overwrite else "노트를 생성했습니다.",
    }


def read_note(template_type: str, context: dict | None = None) -> dict:
    """Read an existing user-synthesis note's editable body (the `## 메모`
    section for investment notes) so the in-app panel can keep editing it."""
    context = context or {}
    template_type = str(template_type or "").strip()
    vault = _require_vault()
    folder = vault / FOLDERS.get(template_type, "Personal Reviews")
    path = folder / _filename(template_type, context)
    if not path.exists():
        return {"ok": True, "exists": False, "body": "", "path": str(path)}
    text = path.read_text(encoding="utf-8")
    body = ""
    if template_type == "investment_note" and INVESTMENT_NOTE_MARKER in text:
        body = text.split(INVESTMENT_NOTE_MARKER, 1)[1].lstrip("\n").rstrip()
    return {"ok": True, "exists": True, "body": body, "path": str(path), "filename": path.name}
