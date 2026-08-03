"""Atomic JSON-per-session store isolated from evidence and Canonical artifacts."""
from __future__ import annotations

import datetime as dt
import json
import os
import tempfile
import threading
import uuid
from pathlib import Path

from features.agent_mode.consultation_schema import (
    MAX_MESSAGE_CHARS,
    MAX_MESSAGES,
    MAX_SESSION_BYTES,
    clean_id,
    clean_text,
    normalize_scope,
    public_session,
)

_LOCKS: dict[str, threading.RLock] = {}
_LOCKS_GUARD = threading.Lock()
_ASSISTANT_RESERVE_BYTES = 100_000


def _now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat()


def sessions_dir(data_dir: Path) -> Path:
    return Path(data_dir) / "agent-consultations"


def _path(data_dir: Path, session_id: str) -> Path:
    safe = clean_id(session_id)
    if not safe:
        raise ValueError("consultation_id_invalid")
    return sessions_dir(data_dir) / f"{safe}.json"


def _lock(path: Path) -> threading.RLock:
    key = str(path.resolve())
    with _LOCKS_GUARD:
        return _LOCKS.setdefault(key, threading.RLock())


def _read(path: Path) -> dict:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    return payload if isinstance(payload, dict) else {}


def _atomic_write(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    encoded = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
    if len(encoded) > MAX_SESSION_BYTES:
        raise ValueError("consultation_session_size_limit")
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(prefix=f".{path.stem}.", suffix=".tmp", dir=path.parent, delete=False) as handle:
            temporary = Path(handle.name)
            handle.write(encoded)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
    finally:
        if temporary and temporary.exists():
            temporary.unlink(missing_ok=True)


def create_session(data_dir: Path, payload: dict | None = None) -> dict:
    payload = payload if isinstance(payload, dict) else {}
    session_id = "consult-" + uuid.uuid4().hex
    now = _now()
    session = {
        "schemaVersion": 1,
        "id": session_id,
        "title": clean_text(payload.get("title") or "새 투자 상담", 120),
        "scope": normalize_scope(payload.get("scope")),
        "status": "active",
        "revision": 1,
        "messages": [],
        "messageCount": 0,
        "memory": {"summary": "", "updatedAt": "", "sourceLayer": "user_consultation", "reuseAsEvidence": False},
        "operationIds": [],
        "continuationOf": clean_id(payload.get("continuationOf")),
        "continuedBy": "",
        "createdAt": now,
        "updatedAt": now,
        "layer": "hypothesis",
        "sourceLayer": "user_consultation",
        "reuseAsHypothesis": True,
        "reuseAsEvidence": False,
    }
    _atomic_write(_path(data_dir, session_id), session)
    return public_session(session)


def get_session(data_dir: Path, session_id: str) -> dict:
    path = _path(data_dir, session_id)
    with _lock(path):
        return public_session(_read(path)) if path.exists() else {}


def _private_session(data_dir: Path, session_id: str) -> tuple[Path, dict]:
    path = _path(data_dir, session_id)
    value = _read(path)
    if not value:
        raise KeyError("consultation_not_found")
    return path, value


def list_sessions(data_dir: Path, *, scope: str = "", status: str = "", cursor: str = "", limit: int = 30) -> dict:
    rows = []
    directory = sessions_dir(data_dir)
    for path in directory.glob("*.json") if directory.exists() else []:
        value = _read(path)
        if not value or (scope and (value.get("scope") or {}).get("kind") != scope) or (status and value.get("status") != status):
            continue
        key = f"{value.get('updatedAt','')}|{value.get('id','')}"
        if cursor and key >= cursor:
            continue
        rows.append((key, public_session(value, include_messages=False)))
    rows.sort(key=lambda item: item[0], reverse=True)
    selected = rows[: max(1, min(int(limit), 100))]
    return {"items": [row for _, row in selected], "nextCursor": selected[-1][0] if len(rows) > len(selected) else None}


def _update_memory(session: dict) -> None:
    messages = session.get("messages") or []
    if len(messages) < 20 or len(messages) % 10:
        return
    older = messages[:-12]
    snippets = []
    for message in older[-24:]:
        content = clean_text(message.get("content"), 220).replace("\n", " ")
        if content:
            snippets.append(f"{message.get('role')}: {content}")
    session["memory"] = {
        "summary": "\n".join(snippets)[-5000:],
        "updatedAt": _now(),
        "sourceLayer": "user_consultation",
        "reuseAsEvidence": False,
    }


def _new_continuation(data_dir: Path, session: dict) -> dict:
    created = create_session(data_dir, {"title": f"{session.get('title') or '투자 상담'} (계속)", "scope": session.get("scope"), "continuationOf": session.get("id")})
    path, current = _private_session(data_dir, str(session.get("id") or ""))
    current["continuedBy"] = created["id"]
    current["revision"] = int(current.get("revision") or 0) + 1
    current["updatedAt"] = _now()
    _atomic_write(path, current)
    return created


def append_user_message(data_dir: Path, session_id: str, content: str, *, operation_id: str = "", retry_message_id: str = "") -> dict:
    path = _path(data_dir, session_id)
    with _lock(path):
        path, session = _private_session(data_dir, session_id)
        if session.get("status") != "active":
            raise ValueError("consultation_archived")
        # Keep one slot and enough encoded space for the paired assistant reply.
        if len(session.get("messages") or []) >= MAX_MESSAGES - 1:
            continuation = _new_continuation(data_dir, session)
            return append_user_message(data_dir, continuation["id"], content, operation_id=operation_id, retry_message_id=retry_message_id)
        operation_id = clean_id(operation_id) or "op-" + uuid.uuid4().hex
        for message in session.get("messages") or []:
            if message.get("operationId") == operation_id:
                return {"session": public_session(session), "message": message, "idempotent": True}
        if retry_message_id:
            for message in session.get("messages") or []:
                if message.get("id") == retry_message_id and message.get("role") == "user":
                    message["status"] = "awaiting_agent"
                    session["revision"] = int(session.get("revision") or 0) + 1
                    session["updatedAt"] = _now()
                    _atomic_write(path, session)
                    return {"session": public_session(session), "message": message, "idempotent": False}
        text = clean_text(content, MAX_MESSAGE_CHARS)
        if not text:
            raise ValueError("consultation_message_required")
        message = {"id": "msg-" + uuid.uuid4().hex, "role": "user", "content": text, "createdAt": _now(), "status": "awaiting_agent", "operationId": operation_id, "sourceLayer": "user_consultation", "reuseAsEvidence": False}
        session.setdefault("messages", []).append(message)
        session["messageCount"] = len(session["messages"])
        session["operationIds"] = (session.get("operationIds") or [])[-199:] + [operation_id]
        session["revision"] = int(session.get("revision") or 0) + 1
        session["updatedAt"] = _now()
        _update_memory(session)
        try:
            encoded_size = len(json.dumps(session, ensure_ascii=False, indent=2).encode("utf-8"))
            if encoded_size > MAX_SESSION_BYTES - _ASSISTANT_RESERVE_BYTES:
                raise ValueError("consultation_session_size_limit")
            _atomic_write(path, session)
        except ValueError as exc:
            if str(exc) != "consultation_session_size_limit":
                raise
            session["messages"].pop()
            continuation = _new_continuation(data_dir, session)
            return append_user_message(data_dir, continuation["id"], text, operation_id=operation_id)
        return {"session": public_session(session), "message": message, "idempotent": False}


def append_assistant_message(data_dir: Path, session_id: str, user_message_id: str, content: str, *, engine: str = "rules") -> dict:
    path = _path(data_dir, session_id)
    with _lock(path):
        path, session = _private_session(data_dir, session_id)
        for message in session.get("messages") or []:
            if message.get("role") == "assistant" and message.get("inReplyTo") == user_message_id:
                return message
        for message in session.get("messages") or []:
            if message.get("id") == user_message_id:
                message["status"] = "answered"
        assistant = {"id": "msg-" + uuid.uuid4().hex, "role": "assistant", "content": clean_text(content, 24_000), "createdAt": _now(), "status": "complete", "inReplyTo": user_message_id, "engine": clean_text(engine, 30), "sourceLayer": "source_grounded_consultation", "reuseAsEvidence": False}
        session.setdefault("messages", []).append(assistant)
        session["messageCount"] = len(session["messages"])
        session["revision"] = int(session.get("revision") or 0) + 1
        session["updatedAt"] = _now()
        _update_memory(session)
        try:
            _atomic_write(path, session)
        except ValueError as exc:
            if str(exc) != "consultation_session_size_limit":
                raise
            # Legacy sessions may not have reserved reply space. Preserve a bounded
            # answer in place instead of losing the already-saved user turn.
            original = assistant["content"]
            for limit in (12_000, 6_000, 3_000, 1_000, 400):
                assistant["content"] = clean_text(original, limit)
                try:
                    _atomic_write(path, session)
                    break
                except ValueError as nested:
                    if str(nested) != "consultation_session_size_limit":
                        raise
            else:
                session["messages"].pop()
                for message in session.get("messages") or []:
                    if message.get("id") == user_message_id:
                        message["status"] = "awaiting_agent"
                raise
        return assistant


def update_session(data_dir: Path, session_id: str, payload: dict) -> dict:
    path = _path(data_dir, session_id)
    with _lock(path):
        path, session = _private_session(data_dir, session_id)
        if "title" in payload:
            session["title"] = clean_text(payload.get("title"), 120) or session.get("title")
        if payload.get("status") in {"active", "archived"}:
            session["status"] = payload["status"]
        session["revision"] = int(session.get("revision") or 0) + 1
        session["updatedAt"] = _now()
        _atomic_write(path, session)
        return public_session(session)


def delete_session(data_dir: Path, session_id: str, *, confirmed: bool) -> bool:
    if not confirmed:
        raise PermissionError("consultation_delete_confirmation_required")
    path = _path(data_dir, session_id)
    with _lock(path):
        if not path.exists():
            return False
        path.unlink()
        return True
