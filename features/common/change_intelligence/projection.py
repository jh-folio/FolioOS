"""Derived Change Feed projection and dual-authority repair."""
from __future__ import annotations

import datetime as dt
import json
import re
import sqlite3
from pathlib import Path

from features.common.change_intelligence.basis import content_hash
from features.common.change_intelligence.migrations import ensure_change_projection_tables
from features.common.change_intelligence.schema import validate_change_summary


def invalidation_token(summary: dict) -> str:
    return content_hash({"artifactKind": summary.get("artifactKind"), "artifactId": summary.get("artifactId"), "status": summary.get("status"), "generatedAt": summary.get("generatedAt")})[:24]


def upsert_change_projection(connection: sqlite3.Connection, summary: dict, *, authority_kind: str, authority_id: str) -> str:
    validate_change_summary(summary)
    ensure_change_projection_tables(connection)
    token = invalidation_token(summary)
    connection.execute(
        """INSERT INTO change_event_index
           (artifact_kind,artifact_id,lineage_id,authority_kind,authority_id,status,materiality,reliability,summary_json,generated_at,invalidation_token)
           VALUES (?,?,?,?,?,?,?,?,?,?,?)
           ON CONFLICT(artifact_kind,artifact_id) DO UPDATE SET
             lineage_id=excluded.lineage_id,authority_kind=excluded.authority_kind,authority_id=excluded.authority_id,
             status=excluded.status,materiality=excluded.materiality,reliability=excluded.reliability,
             summary_json=excluded.summary_json,generated_at=excluded.generated_at,invalidation_token=excluded.invalidation_token""",
        (
            summary.get("artifactKind"), summary.get("artifactId"), summary.get("lineageId"), authority_kind,
            authority_id, summary.get("status"), float(summary.get("materiality") or 0), float(summary.get("reliability") or 0),
            json.dumps(summary, ensure_ascii=False), summary.get("generatedAt") or "", token,
        ),
    )
    connection.execute("DELETE FROM change_projection_repair_queue WHERE authority_kind=? AND authority_id=?", (authority_kind, authority_id))
    return token


def queue_projection_repair(connection: sqlite3.Connection, *, authority_kind: str, authority_id: str, error_code: str) -> None:
    ensure_change_projection_tables(connection)
    connection.execute(
        "INSERT OR REPLACE INTO change_projection_repair_queue (authority_kind,authority_id,error_code,queued_at) VALUES (?,?,?,?)",
        (authority_kind, authority_id, str(error_code)[:120], dt.datetime.now(dt.timezone.utc).isoformat()),
    )


def project_report(db_path: Path, report_path: Path) -> dict:
    try:
        report = json.loads(Path(report_path).read_text(encoding="utf-8"))
        summary = report.get("changeSummary") if isinstance(report, dict) else None
        if not isinstance(summary, dict):
            return {"status": "skipped", "reason": "no_change_summary"}
        with sqlite3.connect(str(db_path)) as conn:
            token = upsert_change_projection(conn, summary, authority_kind="json_report", authority_id=str(report_path))
            conn.commit()
        return {"status": "projected", "invalidationToken": token}
    except Exception:
        with sqlite3.connect(str(db_path)) as conn:
            queue_projection_repair(conn, authority_kind="json_report", authority_id=str(report_path), error_code="projection_failed")
            conn.commit()
        return {"status": "repair_queued", "reason": "projection_failed"}


def list_change_events(db_path: Path, *, ticker: str = "", limit: int = 50) -> list[dict]:
    if not Path(db_path).exists():
        return []
    with sqlite3.connect(str(db_path)) as conn:
        conn.row_factory = sqlite3.Row
        ensure_change_projection_tables(conn)
        rows = conn.execute("SELECT * FROM change_event_index ORDER BY generated_at DESC LIMIT ?", (max(1, min(int(limit), 100)),)).fetchall()
    events = []
    for row in rows:
        try:
            summary = json.loads(row["summary_json"])
        except Exception:
            continue
        if ticker and not lineage_matches_ticker(summary.get("lineageId"), ticker):
            continue
        events.append({**summary, "authorityKind": row["authority_kind"], "authorityId": row["authority_id"], "invalidationToken": row["invalidation_token"]})
    return events


def lineage_matches_ticker(lineage_id, ticker: str) -> bool:
    """Whether a change event's lineage is scoped to ``ticker``.

    Substring matching on a lineage id (or on a stringified ref that carries a
    sha256 hash) false-positives on short tickers: "F" appears in "BRIEFING",
    "T" in "BOTH", and both appear in almost every hex digest. Company lineages
    are compared whole, and other kinds only by exact token.
    """
    ticker = str(ticker or "").strip().upper()
    if not ticker:
        return False
    text = str(lineage_id or "").strip()
    if not text:
        return False
    kind, _, rest = text.partition(":")
    if kind.strip().lower() == "company":
        return rest.strip().upper() == ticker
    # Keep "." so 005930.KS survives; split on "-" so topic:NVDA-supply-chain still
    # yields NVDA. Hyphenated tickers are matched whole by the company branch above.
    return ticker in {token for token in re.split(r"[^0-9A-Za-z.]+", text.upper()) if token}


def repair_change_projection(data_dir: Path, db_path: Path) -> dict:
    repaired = 0
    skipped = 0
    for dirname in ("briefings", "company-analysis", "topic-reports"):
        for path in (Path(data_dir) / dirname).glob("*.json") if (Path(data_dir) / dirname).is_dir() else []:
            result = project_report(db_path, path)
            repaired += result.get("status") == "projected"
            skipped += result.get("status") != "projected"
    if Path(db_path).exists():
        with sqlite3.connect(str(db_path)) as conn:
            conn.row_factory = sqlite3.Row
            ensure_change_projection_tables(conn)
            try:
                rows = conn.execute("SELECT snapshot_id,payload_json FROM market_state_snapshots").fetchall()
            except sqlite3.Error:
                rows = []
            for row in rows:
                try:
                    payload = json.loads(row["payload_json"])
                    summary = payload.get("changeSummary")
                    if not isinstance(summary, dict) or not payload.get("updateAttemptRef"):
                        skipped += 1
                        continue
                    upsert_change_projection(conn, summary, authority_kind="market_state_snapshot", authority_id=row["snapshot_id"])
                    repaired += 1
                except Exception:
                    skipped += 1
            conn.commit()
    return {"repaired": repaired, "skipped": skipped}
