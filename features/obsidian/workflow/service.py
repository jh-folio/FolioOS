"""Obsidian workflow service facade."""
from __future__ import annotations

from features.obsidian.importer import note_index as idx
from features.obsidian.importer.service import scan_vault
from features.obsidian.workflow.note_factory import create_note, read_note
from features.obsidian.workflow.validator import validate_vault


def create_workflow_note(template_type: str, context: dict | None = None, *, overwrite: bool = False) -> dict:
    return create_note(template_type, context or {}, overwrite=overwrite)


def read_workflow_note(template_type: str, context: dict | None = None) -> dict:
    return read_note(template_type, context or {})


def validate_workflow_notes() -> dict:
    return validate_vault()


def linked_notes_payload(*, ticker: str = "", topic: str = "") -> dict:
    try:
        scan_vault()
    except Exception:
        pass
    conn = idx.connect()
    try:
        rows = idx.list_notes(conn, importable=True)
    finally:
        conn.close()
    ticker_u = str(ticker or "").strip().upper()
    topic_l = str(topic or "").strip().lower()
    linked = []
    for row in rows:
        text = " ".join([
            str(row.get("title") or ""),
            str(row.get("rel_path") or ""),
            str(row.get("ticker") or ""),
            str(row.get("company") or ""),
            " ".join(row.get("tags") or []),
        ]).lower()
        if ticker_u and (row.get("ticker") == ticker_u or ticker_u.lower() in text):
            linked.append(row)
            continue
        if topic_l and topic_l in text:
            linked.append(row)
    return {"ok": True, "count": len(linked), "notes": linked[:20]}
