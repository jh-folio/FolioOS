"""Build the redacted, read-only Pixel Office Home summary."""

from __future__ import annotations

import datetime as dt
import sqlite3
from collections.abc import Callable
from pathlib import Path
from typing import Any

from features.common.utils import now_iso, read_json

from .schema import OBJECT_ORDER, OfficeObjectState, validate_pixel_office_payload

Loader = Callable[[], Any]
NEWS_STALE_AFTER = dt.timedelta(hours=48)
ACTIVE_JOB_STATUSES = {"queued", "running"}
ATTENTION_JOB_STATUSES = {"failed"}


def _default_loaders() -> dict[str, Loader]:
    # Imports stay local so the feature has no module-load dependency on large
    # report or market services and remains straightforward to isolate in tests.
    from features.common.jobs import recent_jobs
    from features.company_analysis.service import list_analysis_reports
    from features.daily_briefing.service import list_briefings
    from features.market_memory.state_dashboard import market_state_dashboard_payload
    from features.portfolio.service import get_portfolio
    from features.topic_report.service import list_topic_reports
    from features.watchlist_notes.service import get_watchlist

    return {
        "index": _read_index_summary,
        "market": market_state_dashboard_payload,
        "topic_reports": list_topic_reports,
        "briefings": list_briefings,
        "analysis_reports": list_analysis_reports,
        "notes": _read_note_summary_rows,
        "portfolio": get_portfolio,
        "watchlist": get_watchlist,
        "jobs": lambda: recent_jobs(limit=20),
    }


def _readonly_connection(path: Path) -> sqlite3.Connection:
    return sqlite3.connect(f"file:{path.resolve().as_posix()}?mode=ro", uri=True)


def _read_index_summary() -> dict:
    """Read index metadata without invoking the build-on-miss `load_index()` path."""
    from features.common.research_library.indexing.service import DATA_DIR, RESEARCH_DB_PATH

    status = read_json(DATA_DIR / "index.json", {})
    count = _safe_count(status.get("count")) if isinstance(status, dict) else 0
    if RESEARCH_DB_PATH.exists():
        try:
            with _readonly_connection(RESEARCH_DB_PATH) as conn:
                count = _safe_count(conn.execute("SELECT COUNT(*) FROM documents").fetchone()[0])
        except (OSError, sqlite3.Error):
            pass
    return {
        "count": count,
        "generatedAt": str(status.get("generatedAt") or "") if isinstance(status, dict) else "",
    }


def _read_note_summary_rows() -> list[dict]:
    """Return count/freshness placeholders without reading note bodies or syncing files."""
    from features.investment_notes.service import MARKET_MEMORY_DB_PATH, NOTES_DIR

    if MARKET_MEMORY_DB_PATH.exists():
        try:
            with _readonly_connection(MARKET_MEMORY_DB_PATH) as conn:
                rows = conn.execute(
                    """
                    SELECT note_id, updated_at
                    FROM native_note_index
                    WHERE reuse_as_evidence=0
                    ORDER BY updated_at DESC
                    LIMIT 200
                    """
                ).fetchall()
            return [{"id": str(row[0] or ""), "updatedAt": str(row[1] or "")} for row in rows]
        except (OSError, sqlite3.Error):
            pass
    if not NOTES_DIR.exists():
        return []
    rows = []
    for path in NOTES_DIR.glob("*.json"):
        try:
            updated = dt.datetime.fromtimestamp(path.stat().st_mtime, tz=dt.timezone.utc).isoformat()
        except OSError:
            continue
        rows.append({"id": path.stem, "updatedAt": updated})
    return sorted(rows, key=lambda row: row["updatedAt"], reverse=True)[:200]


def _clean_text(value: Any, limit: int = 160) -> str:
    return " ".join(str(value or "").split())[:limit]


def _rows(value: Any) -> list[dict]:
    return [row for row in value if isinstance(row, dict)] if isinstance(value, list) else []


def _safe_count(value: Any) -> int:
    try:
        return max(0, int(value or 0))
    except (TypeError, ValueError):
        return 0


def _parse_time(value: Any) -> dt.datetime | None:
    text = str(value or "").strip()
    if not text:
        return None
    try:
        parsed = dt.datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=dt.timezone.utc)
    return parsed.astimezone(dt.timezone.utc)


def _latest_at(rows: list[dict], *fields: str) -> str:
    values = []
    for row in rows:
        for field in fields:
            value = str(row.get(field) or "").strip()
            if value:
                values.append(value)
                break
    return max(values, default="")


def _is_stale(value: str, now: dt.datetime, max_age: dt.timedelta) -> bool:
    parsed = _parse_time(value)
    if parsed is None:
        return False
    return now.astimezone(dt.timezone.utc) - parsed > max_age


def _object(
    object_id: str,
    state: str,
    summary: str,
    *,
    count: int = 0,
    as_of: str = "",
    notice: str = "",
    stale: bool | None = None,
) -> dict:
    is_stale = state == OfficeObjectState.STALE.value if stale is None else bool(stale)
    return {
        "id": object_id,
        "state": state,
        "summary": _clean_text(summary),
        "count": _safe_count(count),
        "asOf": _clean_text(as_of, 80),
        "stale": is_stale,
        "notice": _clean_text(notice),
    }


def _error_object(object_id: str) -> dict:
    return _object(
        object_id,
        OfficeObjectState.ERROR.value,
        "상태를 불러오지 못했습니다.",
        notice="직접 화면에서 다시 확인해 주세요.",
    )


def _load(loaders: dict[str, Loader], name: str, default: Any) -> tuple[Any, bool]:
    loader = loaders.get(name)
    if not callable(loader):
        return default, False
    try:
        return loader(), True
    except Exception:
        return default, False


def _job_kind(job: dict) -> str:
    return _clean_text(job.get("kind"), 80).lower().replace("-", "_")


def _has_active_job(jobs: list[dict], terms: tuple[str, ...]) -> bool:
    return any(
        job.get("status") in ACTIVE_JOB_STATUSES and any(term in _job_kind(job) for term in terms)
        for job in jobs
    )


def _news_object(index: Any, loaded: bool, jobs: list[dict], now: dt.datetime) -> dict:
    if not loaded or not isinstance(index, dict):
        return _error_object("news_desk")
    count = _safe_count(index.get("count"))
    as_of = str(index.get("generatedAt") or "")
    state = OfficeObjectState.READY.value if count else OfficeObjectState.EMPTY.value
    stale = bool(count and _is_stale(as_of, now, NEWS_STALE_AFTER))
    if stale:
        state = OfficeObjectState.STALE.value
    if _has_active_job(jobs, ("rss", "index", "evidence")):
        state = OfficeObjectState.BUSY.value
    summary = f"수집 자료 {count}건" if count else "아직 수집된 자료가 없습니다."
    return _object("news_desk", state, summary, count=count, as_of=as_of, stale=stale)


def _market_object(market: Any, loaded: bool) -> dict:
    if not loaded or not isinstance(market, dict):
        return _error_object("market_board")
    freshness = market.get("freshness") if isinstance(market.get("freshness"), dict) else {}
    as_of = str(freshness.get("snapshotAsOf") or freshness.get("latestMemoryAt") or "")
    drivers = _rows(market.get("drivers"))
    has_content = bool(drivers or market.get("snapshot"))
    state = OfficeObjectState.READY.value if has_content else OfficeObjectState.EMPTY.value
    if has_content and bool(freshness.get("stale")):
        state = OfficeObjectState.STALE.value
    summary = _clean_text(market.get("plainConclusion") or market.get("summary"))
    if not has_content:
        summary = "아직 정리된 시장 상태가 없습니다."
    return _object("market_board", state, summary, count=len(drivers), as_of=as_of)


def _research_object(reports: Any, loaded: bool, jobs: list[dict]) -> dict:
    if not loaded:
        return _error_object("research_desk")
    rows = _rows(reports)
    state = OfficeObjectState.READY.value if rows else OfficeObjectState.EMPTY.value
    if _has_active_job(jobs, ("topic", "research", "company_analysis", "analyze")):
        state = OfficeObjectState.BUSY.value
    as_of = _latest_at(rows, "generatedAt", "date")
    summary = f"저장 리서치 {len(rows)}건" if rows else "아직 저장된 딥 리서치가 없습니다."
    return _object("research_desk", state, summary, count=len(rows), as_of=as_of)


def _reports_object(briefings: Any, analyses: Any, loaded: bool, jobs: list[dict]) -> dict:
    if not loaded:
        return _error_object("report_shelf")
    rows = _rows(briefings) + _rows(analyses)
    state = OfficeObjectState.READY.value if rows else OfficeObjectState.EMPTY.value
    if _has_active_job(jobs, ("briefing", "report", "proposal")):
        state = OfficeObjectState.BUSY.value
    as_of = _latest_at(rows, "generatedAt", "date")
    summary = f"저장 보고서 {len(rows)}건" if rows else "아직 저장된 보고서가 없습니다."
    return _object("report_shelf", state, summary, count=len(rows), as_of=as_of)


def _notes_object(notes: Any, loaded: bool) -> dict:
    if not loaded:
        return _error_object("memo_board")
    rows = _rows(notes)
    as_of = _latest_at(rows, "updatedAt", "createdAt")
    summary = f"투자 메모 {len(rows)}건" if rows else "아직 작성한 투자 메모가 없습니다."
    state = OfficeObjectState.READY.value if rows else OfficeObjectState.EMPTY.value
    return _object("memo_board", state, summary, count=len(rows), as_of=as_of)


def _portfolio_object(portfolio: Any, watchlist: Any, loaded: bool) -> dict:
    if not loaded or not isinstance(portfolio, dict):
        return _error_object("portfolio_monitor")
    positions = _rows(portfolio.get("positions"))
    watch_rows = _rows(watchlist) if isinstance(watchlist, list) else []
    count = len(positions) + len(watch_rows)
    state = OfficeObjectState.READY.value if count else OfficeObjectState.EMPTY.value
    summary = f"보유 {len(positions)} · 관심 {len(watch_rows)}" if count else "보유·관심 항목이 없습니다."
    return _object("portfolio_monitor", state, summary, count=count)


def _agent_summary(jobs: list[dict], loaded: bool = True) -> tuple[dict, dict]:
    if not loaded:
        return (
            _error_object("agent_seat"),
            {
                "attentionCount": 0,
                "latestJobId": "",
                "latestJobStatus": "",
            },
        )
    latest = jobs[0] if jobs else {}
    active = [job for job in jobs if job.get("status") in ACTIVE_JOB_STATUSES]
    attention_count = sum(1 for job in jobs if job.get("status") in ATTENTION_JOB_STATUSES)
    if attention_count:
        state = OfficeObjectState.ATTENTION.value
        summary = f"확인이 필요한 작업 {attention_count}건"
    elif active:
        state = OfficeObjectState.BUSY.value
        summary = f"진행 중인 작업 {len(active)}건"
    else:
        state = OfficeObjectState.READY.value
        summary = "Agent가 다음 작업을 기다리고 있습니다."
    as_of = str(latest.get("updatedAt") or latest.get("createdAt") or "")
    object_row = _object("agent_seat", state, summary, count=len(active), as_of=as_of)
    agent = {
        "attentionCount": attention_count,
        "latestJobId": _clean_text(latest.get("id"), 80),
        "latestJobStatus": _clean_text(latest.get("status"), 32),
    }
    return object_row, agent


def pixel_office_payload(
    *,
    loaders: dict[str, Loader] | None = None,
    current_time: dt.datetime | None = None,
) -> dict:
    """Return a complete object-level summary while isolating source failures."""
    sources = _default_loaders()
    if loaders:
        sources.update(loaders)
    now = current_time or dt.datetime.now(dt.timezone.utc)

    jobs_value, jobs_loaded = _load(sources, "jobs", [])
    jobs = _rows(jobs_value) if jobs_loaded else []
    index, index_loaded = _load(sources, "index", {})
    market, market_loaded = _load(sources, "market", {})
    topic_reports, topic_loaded = _load(sources, "topic_reports", [])
    briefings, briefings_loaded = _load(sources, "briefings", [])
    analyses, analyses_loaded = _load(sources, "analysis_reports", [])
    notes, notes_loaded = _load(sources, "notes", [])
    portfolio, portfolio_loaded = _load(sources, "portfolio", {})
    watchlist, watchlist_loaded = _load(sources, "watchlist", [])

    agent_object, agent = _agent_summary(jobs, jobs_loaded)
    objects = [
        _news_object(index, index_loaded, jobs, now),
        _market_object(market, market_loaded),
        _research_object(topic_reports, topic_loaded, jobs),
        _reports_object(
            briefings,
            analyses,
            briefings_loaded and analyses_loaded,
            jobs,
        ),
        _notes_object(notes, notes_loaded),
        _portfolio_object(portfolio, watchlist, portfolio_loaded and watchlist_loaded),
        agent_object,
    ]
    if [row["id"] for row in objects] != list(OBJECT_ORDER):
        raise RuntimeError("Pixel Office object order changed")
    return validate_pixel_office_payload(
        {
            "version": 1,
            "generatedAt": now_iso(),
            "objects": objects,
            "agent": agent,
        }
    )
