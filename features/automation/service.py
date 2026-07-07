from __future__ import annotations

import datetime as dt
import threading
import time
from pathlib import Path

from features.automation.schema import normalize_settings
from features.agent_mode.bridge import submit_agent_task
from features.agent_mode.generation_mode import llm_override_for_mode
from features.common.research_library.rss.service import import_rssarchive
from features.common.utils import kst_date, now_iso, read_json, write_json
from features.daily_briefing.builder import build_briefing
from features.llm_settings.client import default_generation_mode
from features.market_memory.digest import run_rss_market_memory_update

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data"
SETTINGS_PATH = DATA_DIR / "automation-settings.json"
RUNS_PATH = DATA_DIR / "automation-runs.json"
_LOOP_STARTED = False


def read_settings() -> dict:
    return normalize_settings(read_json(SETTINGS_PATH, {}))


def save_settings(raw: dict) -> dict:
    settings = normalize_settings(raw)
    SETTINGS_PATH.parent.mkdir(parents=True, exist_ok=True)
    write_json(SETTINGS_PATH, settings)
    return settings


def _append_run(row: dict) -> None:
    runs = read_json(RUNS_PATH, [])
    if not isinstance(runs, list):
        runs = []
    runs.insert(0, row)
    write_json(RUNS_PATH, runs[:50])


def list_runs(limit: int = 20) -> list[dict]:
    runs = read_json(RUNS_PATH, [])
    return runs[: int(limit or 20)] if isinstance(runs, list) else []


def _parse_iso(value: str) -> dt.datetime | None:
    try:
        return dt.datetime.fromisoformat(str(value or "").replace("Z", "+00:00")).replace(tzinfo=None)
    except ValueError:
        return None


def _last_run_for(kind: str, runs: list[dict] | None = None) -> dict | None:
    for row in runs if runs is not None else list_runs(100):
        if row.get("kind") == kind:
            return row
    return None


def _minutes_from_time(value: str) -> int:
    hour, minute = str(value or "08:00").split(":")[:2]
    return int(hour) * 60 + int(minute)


def automation_due(kind: str, settings: dict | None = None, now: dt.datetime | None = None, runs: list[dict] | None = None) -> bool:
    settings = normalize_settings(settings or read_settings())
    now = now or dt.datetime.now()
    runs = list_runs(100) if runs is None else runs
    if kind == "rss":
        cfg = settings["rss"]
        if not cfg.get("enabled"):
            return False
        last = _last_run_for("rss", runs)
        finished = _parse_iso((last or {}).get("finishedAt", ""))
        return finished is None or now - finished >= dt.timedelta(minutes=int(cfg["intervalMinutes"]))
    if kind == "marketMemory":
        cfg = settings["marketMemory"]
        if not cfg.get("enabled"):
            return False
        last = _last_run_for("marketMemory", runs)
        finished = _parse_iso((last or {}).get("finishedAt", ""))
        return finished is None or now - finished >= dt.timedelta(minutes=int(cfg["intervalMinutes"]))
    if kind == "briefing":
        cfg = settings["briefing"]
        if not cfg.get("enabled"):
            return False
        target = _minutes_from_time(cfg.get("time", "08:00"))
        current = now.hour * 60 + now.minute
        if current < target:
            return False
        if settings.get("missedRuns", {}).get("onStartup") != "catch_up" and current - target > 10:
            return False
        last = _last_run_for("briefing", runs)
        finished = _parse_iso((last or {}).get("finishedAt", ""))
        return finished is None or finished.date() != now.date()
    return False


def market_memory_recently_run(*, now: dt.datetime | None = None, max_age_hours: int = 12, runs: list[dict] | None = None) -> bool:
    now = now or dt.datetime.now()
    last = _last_run_for("marketMemory", list_runs(100) if runs is None else runs)
    if (last or {}).get("status") not in {"done", "ok", ""}:
        return False
    finished = _parse_iso((last or {}).get("finishedAt", ""))
    if finished is None:
        return False
    return now - finished < dt.timedelta(hours=max(1, int(max_age_hours or 12)))


def run_briefing_prerequisites(*, now: dt.datetime | None = None, memory_max_age_hours: int = 12) -> dict:
    prerequisites = {"rss": import_rssarchive(run_collection=True)}
    if market_memory_recently_run(now=now, max_age_hours=memory_max_age_hours):
        prerequisites["marketMemory"] = {
            "ok": True,
            "skipped": True,
            "reason": "recent",
            "maxAgeHours": int(memory_max_age_hours or 12),
        }
    else:
        started = now_iso()
        try:
            memory = run_rss_market_memory_update()
            status = "failed" if isinstance(memory, dict) and memory.get("ok") is False else "done"
            _append_run({
                "kind": "marketMemory",
                "status": status,
                "startedAt": started,
                "finishedAt": now_iso(),
                "result": memory,
            })
            prerequisites["marketMemory"] = memory
        except Exception as exc:
            _append_run({
                "kind": "marketMemory",
                "status": "failed",
                "startedAt": started,
                "finishedAt": now_iso(),
                "error": str(exc),
            })
            raise
    return prerequisites


def _run_briefing(settings: dict | None = None) -> dict:
    settings = normalize_settings(settings or read_settings())
    cfg = settings["briefing"]
    prerequisites = {}
    if cfg.get("runPrerequisites"):
        prerequisites = run_briefing_prerequisites()
    date = kst_date()
    generation_mode = default_generation_mode()
    if generation_mode == "llm_cli":
        briefing = submit_agent_task("briefing", {
            "date": date,
            "strict_date": False,
            "quality_mode": cfg.get("qualityMode", "diagnose_only"),
            "market_scope": cfg.get("marketScope", "both"),
            "briefing_type": cfg.get("briefingType", "default"),
        })
    else:
        briefing = build_briefing(
            date=date,
            strict_date=False,
            llm_override=llm_override_for_mode(generation_mode),
            quality_mode=cfg.get("qualityMode", "diagnose_only"),
            market_scope=cfg.get("marketScope", "both"),
            briefing_type=cfg.get("briefingType", "default"),
        )
    return {
        "date": date,
        "generationMode": generation_mode,
        "marketScope": cfg.get("marketScope", "both"),
        "prerequisites": prerequisites,
        "briefing": briefing,
    }


def run_automation_once(kind: str) -> dict:
    kind = str(kind or "").strip()
    started = now_iso()
    try:
        if kind == "rss":
            result = import_rssarchive(run_collection=True)
        elif kind == "marketMemory":
            result = run_rss_market_memory_update()
        elif kind == "briefingPrerequisites":
            rss = import_rssarchive(run_collection=True)
            memory = run_rss_market_memory_update()
            result = {"rss": rss, "marketMemory": memory}
        elif kind == "briefing":
            result = _run_briefing()
        else:
            return {"ok": False, "error": f"Unsupported automation: {kind}"}
        row = {"kind": kind, "status": "done", "startedAt": started, "finishedAt": now_iso(), "result": result}
        _append_run(row)
        return {"ok": True, **row}
    except Exception as exc:
        row = {"kind": kind, "status": "failed", "startedAt": started, "finishedAt": now_iso(), "error": str(exc)}
        _append_run(row)
        return {"ok": False, **row}


def run_due_automations(now: dt.datetime | None = None) -> dict:
    settings = read_settings()
    runs = list_runs(100)
    executed = []
    rss_ran = False
    if automation_due("rss", settings=settings, now=now, runs=runs):
        executed.append(run_automation_once("rss"))
        rss_ran = True
    memory_cfg = settings.get("marketMemory", {})
    if memory_cfg.get("enabled") and ((rss_ran and memory_cfg.get("runAfterRss")) or automation_due("marketMemory", settings=settings, now=now, runs=runs)):
        executed.append(run_automation_once("marketMemory"))
    if automation_due("briefing", settings=settings, now=now, runs=runs):
        executed.append(run_automation_once("briefing"))
    return {"ok": True, "executed": executed}


def schedule_automation_loop(interval_seconds: int = 60) -> bool:
    global _LOOP_STARTED
    if _LOOP_STARTED:
        return False
    _LOOP_STARTED = True

    def _worker() -> None:
        while True:
            try:
                run_due_automations()
            except Exception as exc:
                _append_run({
                    "kind": "scheduler",
                    "status": "failed",
                    "startedAt": now_iso(),
                    "finishedAt": now_iso(),
                    "error": str(exc),
                })
            time.sleep(max(10, int(interval_seconds)))

    threading.Thread(target=_worker, name="folio-automation", daemon=True).start()
    return True
