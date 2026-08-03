from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from features.market_calendar.schema import normalize_event


def local_filing_events(db_path: Path, *, limit: int = 200) -> list[dict]:
    if not Path(db_path).exists():
        return []
    with sqlite3.connect(str(db_path)) as conn:
        conn.row_factory = sqlite3.Row
        try:
            rows = conn.execute("SELECT id,title,url,published_at_utc,related_tickers,source FROM evidence_items WHERE intake_stage='evidence' AND source_type='official_filing' ORDER BY published_at_utc DESC LIMIT ?", (limit,)).fetchall()
        except sqlite3.Error:
            return []
    events = []
    for row in rows:
        try:
            tickers = json.loads(row["related_tickers"] or "[]")
            events.append(normalize_event({"id": f"filing_{row['id']}", "kind": "filing", "title": row["title"], "tickers": tickers, "startsAt": row["published_at_utc"], "status": "actual", "source": row["source"], "sourceUrl": row["url"], "provider": "official_filing", "market": "GLOBAL"}))
        except Exception:
            continue
    return events
