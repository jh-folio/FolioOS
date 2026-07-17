from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

import uvicorn

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import app as folio_app
from features.agent_mode import chat
from features.common import jobs


def configure(data_root: Path, fault_phase: str) -> None:
    chat.DATA_DIR = data_root
    chat.PROPOSALS_DIR = data_root / "agent-proposals"
    chat.BRIEFINGS_DIR = data_root / "briefings"
    chat.ANALYSIS_DIR = data_root / "company-analysis"
    chat.TOPIC_DIR = data_root / "topic-reports"
    chat.bridge.bridge_status = lambda **_kwargs: {"available": False, "message": "QA CLI disabled"}

    def phase_hook(phase: str) -> None:
        if phase == fault_phase:
            os._exit(91)

    chat.PROPOSAL_PHASE_HOOK = phase_hook
    jobs.DATA_DIR = data_root
    jobs.JOBS_PATH = data_root / "jobs.json"
    jobs.JOBS.clear()

    folio_app.DATA_DIR = data_root
    folio_app.CONFIG_DIR = data_root / "config"
    folio_app.INBOX_DIR = data_root / "research-inbox"
    folio_app.RSS_INBOX_DIR = folio_app.INBOX_DIR / "rss"
    folio_app.BRIEFINGS_DIR = chat.BRIEFINGS_DIR
    folio_app.NOTES_DIR = data_root / "notes"
    folio_app.ANALYSIS_REPORTS_DIR = chat.ANALYSIS_DIR
    folio_app.TOPIC_REPORTS_DIR = chat.TOPIC_DIR
    folio_app.SEC_CACHE_DIR = data_root / "sec-cache"
    folio_app.MARKET_MEMORY_DB_PATH = data_root / "market-memory.sqlite3"
    folio_app.ensure_company_files = lambda: None
    folio_app.schedule_startup_regime_refresh = lambda _path: None
    folio_app.schedule_automation_loop = lambda: None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-root", type=Path, required=True)
    parser.add_argument("--port", type=int, required=True)
    parser.add_argument("--fault-phase", default="")
    args = parser.parse_args()
    configure(args.data_root.resolve(), args.fault_phase)
    uvicorn.run(folio_app.fastapi_app, host="127.0.0.1", port=args.port, log_level="warning")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
