"""Server-authoritative, bounded consultation context assembly."""
from __future__ import annotations

import json
import re
import sqlite3
import time
from pathlib import Path

from features.agent_mode.consultation_store import get_session
from features.common.change_intelligence.projection import list_change_events
from features.common.research_library.signals.service import default_db_path, query_signals
from features.common.utils import read_json
from features.portfolio.service import get_portfolio
from features.watchlist_notes.service import get_watchlist

MAX_CONTEXT_CHARS = 32_000


def _report(data_dir: Path, scope: dict) -> dict:
    kind = scope.get("kind")
    report_id = str(scope.get("id") or "")
    directory = {"briefing": "briefings", "company_analysis": "company-analysis", "topic_report": "topic-reports"}.get(kind)
    if not directory or not re.fullmatch(r"[A-Za-z0-9가-힣._:-]{1,160}", report_id) or ".." in report_id:
        return {}
    root = Path(data_dir) / directory
    candidates = [root / f"{report_id}.json"] + list(root.glob(f"{report_id}.*.json"))
    for path in candidates:
        value = read_json(path, {})
        if isinstance(value, dict) and value:
            return {
                "kind": kind,
                "id": value.get("id") or report_id,
                "title": value.get("title") or value.get("headline") or "",
                "generatedAt": value.get("generatedAt") or value.get("date") or "",
                "changeSummary": value.get("changeSummary") or {},
                "checkpoints": (value.get("checkpoints") or [])[:20],
                "dataGaps": (value.get("dataGaps") or [])[:12],
                "markdownExcerpt": str(value.get("markdown") or "")[:12_000],
                "layer": "source-grounded",
            }
    return {}


def _market_state(data_dir: Path) -> dict:
    path = Path(data_dir) / "market-memory.sqlite3"
    if not path.exists():
        return {}
    try:
        with sqlite3.connect(str(path)) as connection:
            row = connection.execute("SELECT payload_json FROM market_state_snapshots ORDER BY as_of DESC LIMIT 1").fetchone()
        payload = json.loads(row[0]) if row else {}
    except (sqlite3.Error, json.JSONDecodeError):
        return {}
    return {
        "id": payload.get("id") or payload.get("stateId") or "",
        "asOf": payload.get("asOf") or payload.get("createdAt") or "",
        "marketRegime": payload.get("marketRegime") or payload.get("regime") or "",
        "keyDrivers": (payload.get("keyDrivers") or [])[:12],
        "counterEvidence": (payload.get("counterEvidence") or [])[:12],
        "uncertainties": (payload.get("uncertainties") or [])[:12],
        "layer": "source-grounded",
    }


def _scope_context(data_dir: Path, session: dict) -> dict:
    scope = session.get("scope") or {}
    tickers = [str(ticker).upper() for ticker in scope.get("tickers") or []]
    if scope.get("kind") == "portfolio":
        portfolio = get_portfolio(data_dir)
        if not tickers:
            tickers = [str(row.get("ticker") or row.get("symbol") or "").upper() for row in portfolio.get("positions") or []]
        primary = {"portfolio": {"revision": portfolio.get("revision"), "positions": (portfolio.get("positions") or [])[:40], "cash": (portfolio.get("cash") or [])[:10], "layer": "hypothesis_input"}}
    elif scope.get("kind") == "watchlist":
        watchlist = get_watchlist(data_dir)
        if not tickers:
            tickers = [str(item).upper() for item in watchlist[:30]]
        primary = {"watchlist": watchlist[:40], "layer": "hypothesis_input"}
    else:
        report = _report(data_dir, scope)
        primary = {"report": report} if report else {}
    changes = list_change_events(Path(data_dir) / "market-memory.sqlite3", limit=20)
    signals = []
    for ticker in tickers[:8]:
        signals.extend(query_signals(default_db_path(data_dir), ticker=ticker, limit=5).get("items") or [])
    return {
        **primary,
        "marketState": _market_state(data_dir),
        "recentChanges": changes[:20],
        "fastSignals": signals[:20],
        "signalNotice": "fastSignals are unconfirmed metadata-only leads and are not evidence",
    }


def assemble_consultation_context(data_dir: Path, session_id: str) -> dict:
    started = time.perf_counter()
    session = get_session(data_dir, session_id)
    if not session:
        raise KeyError("consultation_not_found")
    messages = session.get("messages") or []
    pack = {
        "schemaVersion": 1,
        "session": {"id": session["id"], "scope": session.get("scope") or {}, "title": session.get("title") or ""},
        "consultationMemory": {**(session.get("memory") or {}), "layer": "hypothesis", "sourceLayer": "user_consultation", "reuseAsEvidence": False},
        "recentMessages": [{"role": row.get("role"), "content": str(row.get("content") or "")[:6000], "sourceLayer": row.get("sourceLayer"), "reuseAsEvidence": False} for row in messages[-20:]],
        "sourceContext": _scope_context(Path(data_dir), session),
        "rules": {"canonicalWriteback": False, "proposalIntent": False, "noteActionOnly": True, "consultationIsEvidence": False},
    }
    serialized = json.dumps(pack, ensure_ascii=False, separators=(",", ":"))
    if len(serialized) > MAX_CONTEXT_CHARS:
        report = (pack.get("sourceContext") or {}).get("report") or {}
        if isinstance(report, dict):
            report["markdownExcerpt"] = str(report.get("markdownExcerpt") or "")[:3000]
        pack["recentMessages"] = pack["recentMessages"][-10:]
        serialized = json.dumps(pack, ensure_ascii=False, separators=(",", ":"))
    if len(serialized) > MAX_CONTEXT_CHARS:
        pack["sourceContext"]["fastSignals"] = []
        pack["sourceContext"]["recentChanges"] = (pack["sourceContext"].get("recentChanges") or [])[:5]
        pack["consultationMemory"]["summary"] = str(pack["consultationMemory"].get("summary") or "")[-1500:]
        pack["recentMessages"] = pack["recentMessages"][-5:]
        serialized = json.dumps(pack, ensure_ascii=False, separators=(",", ":"))
    if len(serialized) > MAX_CONTEXT_CHARS:
        pack["sourceContext"] = {"notice": "source context exceeded bound; ask a narrower follow-up", "signalNotice": "fast signals are not evidence"}
        pack["consultationMemory"]["summary"] = str(pack["consultationMemory"].get("summary") or "")[-500:]
        pack["recentMessages"] = [{**row, "content": str(row.get("content") or "")[:2000]} for row in pack["recentMessages"][-4:]]
        serialized = json.dumps(pack, ensure_ascii=False, separators=(",", ":"))
    return {
        "pack": pack,
        "serialized": serialized,
        "telemetry": {"assemblyMs": round((time.perf_counter() - started) * 1000, 2), "serializedChars": len(serialized)},
    }
