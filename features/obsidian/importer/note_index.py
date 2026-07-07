"""Obsidian note index — market-memory.sqlite3에 사용자 노트 인덱스를 적재.

지식그래프 데이터이므로 별도 파일을 만들지 않고 market-memory.sqlite3를 확장한다
(IMPLEMENTATION_PLAN §1·§4 저장소 모델). thesis·Regime 테이블과 같은 DB에서 join한다.
"""
from __future__ import annotations

import datetime as dt
import hashlib
import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
DEFAULT_DB = ROOT / "data" / "market-memory.sqlite3"


def connect(db_path=None) -> sqlite3.Connection:
    """market-memory.sqlite3(또는 지정 경로/':memory:')에 연결하고 스키마를 보장한다."""
    if db_path == ":memory:":
        conn = sqlite3.connect(":memory:")
    else:
        path = Path(db_path or DEFAULT_DB)
        path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    init_db(conn)
    return conn


def init_db(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS obsidian_note_index (
            note_id TEXT PRIMARY KEY,
            rel_path TEXT NOT NULL DEFAULT '',
            path TEXT NOT NULL DEFAULT '',
            note_type TEXT NOT NULL DEFAULT 'unknown',
            layer TEXT NOT NULL DEFAULT 'unknown',
            importable INTEGER NOT NULL DEFAULT 0,
            ticker TEXT NOT NULL DEFAULT '',
            company TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT '',
            title TEXT NOT NULL DEFAULT '',
            source_layer TEXT NOT NULL DEFAULT '',
            reuse_as_hypothesis INTEGER NOT NULL DEFAULT 0,
            reuse_as_evidence INTEGER NOT NULL DEFAULT 0,
            tags_json TEXT NOT NULL DEFAULT '[]',
            content_hash TEXT NOT NULL DEFAULT '',
            mtime REAL NOT NULL DEFAULT 0,
            first_seen TEXT NOT NULL DEFAULT '',
            last_seen TEXT NOT NULL DEFAULT ''
        )
        """
    )
    conn.execute("CREATE INDEX IF NOT EXISTS idx_obs_note_type ON obsidian_note_index(note_type)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_obs_note_ticker ON obsidian_note_index(ticker)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_obs_note_layer ON obsidian_note_index(layer, importable)")
    conn.commit()


def make_note_id(rel_path: str) -> str:
    return hashlib.sha1(rel_path.encode("utf-8")).hexdigest()[:16]


def _now() -> str:
    return dt.datetime.now().isoformat(timespec="seconds")


def upsert_note(conn, *, rel_path: str, path: str, note, content_hash: str = "", mtime: float = 0.0) -> str:
    """ParsedNote(note)를 인덱스에 upsert하고 note_id를 반환한다."""
    note_id = make_note_id(rel_path)
    now = _now()
    row = conn.execute("SELECT first_seen FROM obsidian_note_index WHERE note_id=?", (note_id,)).fetchone()
    first_seen = row["first_seen"] if row else now
    conn.execute(
        """
        INSERT INTO obsidian_note_index
            (note_id, rel_path, path, note_type, layer, importable, ticker, company,
             status, title, source_layer, reuse_as_hypothesis, reuse_as_evidence,
             tags_json, content_hash, mtime, first_seen, last_seen)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(note_id) DO UPDATE SET
            rel_path=excluded.rel_path, path=excluded.path, note_type=excluded.note_type,
            layer=excluded.layer, importable=excluded.importable, ticker=excluded.ticker,
            company=excluded.company, status=excluded.status, title=excluded.title,
            source_layer=excluded.source_layer, reuse_as_hypothesis=excluded.reuse_as_hypothesis,
            reuse_as_evidence=excluded.reuse_as_evidence, tags_json=excluded.tags_json,
            content_hash=excluded.content_hash, mtime=excluded.mtime, last_seen=excluded.last_seen
        """,
        (
            note_id, rel_path, path, note.note_type, note.layer, int(note.importable),
            note.ticker, note.company, note.status, note.title, note.source_layer,
            int(note.reuse_as_hypothesis), int(note.reuse_as_evidence),
            json.dumps(note.tags, ensure_ascii=False), content_hash, float(mtime),
            first_seen, now,
        ),
    )
    conn.commit()
    return note_id


def _row_to_dict(row) -> dict:
    d = dict(row)
    d["importable"] = bool(d.get("importable"))
    d["reuse_as_hypothesis"] = bool(d.get("reuse_as_hypothesis"))
    d["reuse_as_evidence"] = bool(d.get("reuse_as_evidence"))
    try:
        d["tags"] = json.loads(d.pop("tags_json", "[]"))
    except Exception:
        d.pop("tags_json", None)
        d["tags"] = []
    return d


def list_notes(conn, *, note_type=None, importable=None, ticker=None, layer=None) -> list:
    q = "SELECT * FROM obsidian_note_index WHERE 1=1"
    args: list = []
    if note_type is not None:
        q += " AND note_type=?"; args.append(note_type)
    if importable is not None:
        q += " AND importable=?"; args.append(int(importable))
    if ticker is not None:
        q += " AND ticker=?"; args.append(ticker.upper())
    if layer is not None:
        q += " AND layer=?"; args.append(layer)
    q += " ORDER BY last_seen DESC, rel_path ASC"
    return [_row_to_dict(r) for r in conn.execute(q, args).fetchall()]


def get_note(conn, note_id: str):
    row = conn.execute("SELECT * FROM obsidian_note_index WHERE note_id=?", (note_id,)).fetchone()
    return _row_to_dict(row) if row else None
