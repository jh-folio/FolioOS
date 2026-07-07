"""Obsidian Vault → note index 스캔 서비스.

- Vault 경로는 기존 Obsidian export 설정(`data/obsidian-settings.json`)을 재사용한다.
  새 경로/설정을 만들지 않는다 (export와 같은 Vault를 양방향으로 사용).
- research-inbox는 절대 건드리지 않는다 — 인덱서(research-index.sqlite3)와 독립된 read 경로다.
  Vault 노트를 research-inbox로 인덱싱하면 hypothesis가 evidence로 빨려 들어가 원칙 2·5를 위반한다.
- 사용자 hypothesis 노트만 importable로 적재하고, Folio OS가 내보낸 노트는 self_generated로 표시해 건너뛴다.
"""
from __future__ import annotations

import hashlib
from pathlib import Path

from features.obsidian.export.service import get_vault_settings
from features.obsidian.importer import note_index as idx
from features.obsidian.importer import parser as P


def _vault_path() -> Path:
    settings = get_vault_settings()
    vault_path = (settings.get("vaultPath") or "").strip()
    if not vault_path:
        raise ValueError("Obsidian vault 경로가 설정되지 않았습니다.")
    p = Path(vault_path)
    if not p.exists():
        raise ValueError(f"Vault 경로가 존재하지 않습니다: {vault_path}")
    return p


def scan_vault(db_path=None, vault=None) -> dict:
    """Vault의 모든 .md를 파싱·분류해 note index에 적재하고 요약을 반환한다."""
    vault = Path(vault) if vault else _vault_path()
    conn = idx.connect(db_path)
    summary = {
        "scanned": 0, "hypotheses": 0, "self_generated": 0, "unknown": 0,
        "vault": str(vault),
    }
    try:
        for md in sorted(vault.rglob("*.md")):
            try:
                text = md.read_text(encoding="utf-8")
            except Exception:
                continue
            note = P.parse_note(text)
            rel = md.relative_to(vault).as_posix()
            content_hash = hashlib.sha1(text.encode("utf-8")).hexdigest()[:16]
            try:
                mtime = md.stat().st_mtime
            except Exception:
                mtime = 0.0
            idx.upsert_note(conn, rel_path=rel, path=str(md), note=note,
                            content_hash=content_hash, mtime=mtime)
            summary["scanned"] += 1
            if note.layer == P.LAYER_HYPOTHESIS:
                summary["hypotheses"] += 1
            elif note.layer == P.LAYER_SELF_GENERATED:
                summary["self_generated"] += 1
            else:
                summary["unknown"] += 1
        return summary
    finally:
        conn.close()


def list_hypotheses(db_path=None, ticker=None) -> list:
    """downstream(Personal Overlay / Thesis Tracker)에서 쓸 import 가능한 hypothesis 노트."""
    conn = idx.connect(db_path)
    try:
        return idx.list_notes(conn, importable=True, ticker=ticker)
    finally:
        conn.close()
