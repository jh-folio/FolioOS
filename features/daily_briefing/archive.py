"""Cached, read-only metadata index for saved daily briefings."""

from __future__ import annotations

import datetime as dt
import json
import re
import threading
import time
from pathlib import Path

from features.daily_briefing.schema import (
    BRIEFING_TYPES,
    briefing_archive_items,
    briefing_market_metadata,
)


ROOT = Path(__file__).resolve().parents[2]
BRIEFINGS_DIR = ROOT / "data" / "briefings"
REPORT_FILE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}(?:\.(?:us|kr))?\.json$")
SCOPED_REPORT_FILE_RE = re.compile(r"^(?P<date>\d{4}-\d{2}-\d{2})\.(?P<market>us|kr)\.json$")


def _date(value, field):
    if not value:
        return ""
    try:
        return dt.date.fromisoformat(str(value)).isoformat()
    except ValueError as exc:
        raise ValueError(f"{field} must be YYYY-MM-DD") from exc


def _bounded_int(value, field, minimum, maximum=None):
    try:
        number = int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{field} must be an integer") from exc
    if number < minimum:
        raise ValueError(f"{field} must be {minimum} or greater")
    if maximum is not None and number > maximum:
        raise ValueError(f"{field} must be between {minimum} and {maximum}")
    return number


class BriefingArchiveIndex:
    def __init__(self, reports_dir, *, ttl_seconds=30, loader=None, clock=None):
        self.reports_dir = Path(reports_dir)
        self.ttl_seconds = max(0, int(ttl_seconds))
        self.loader = loader or self._load_json
        self.clock = clock or time.monotonic
        self._entries = {}
        self._last_scan = float("-inf")
        self._refreshed_at = ""
        self._lock = threading.RLock()

    @staticmethod
    def _load_json(path):
        return json.loads(path.read_text(encoding="utf-8"))

    def _scan(self, force=False):
        now = self.clock()
        if not force and now - self._last_scan < self.ttl_seconds:
            return
        paths = sorted(
            path for path in self.reports_dir.glob("*.json")
            if REPORT_FILE_RE.fullmatch(path.name)
        ) if self.reports_dir.exists() else []
        refreshed = {}
        for path in paths:
            stat = path.stat()
            signature = (stat.st_mtime_ns, stat.st_size)
            current = self._entries.get(path)
            if current and current["signature"] == signature:
                refreshed[path] = current
                continue
            try:
                report = self.loader(path)
                sections = report.get("briefings") or {}
                rows = []
                for item in briefing_archive_items(report):
                    scope = item["marketScope"]
                    section = sections.get(scope) if isinstance(sections.get(scope), dict) else report
                    search_text = " ".join((
                        item.get("title", ""),
                        item.get("summary", ""),
                        str(section.get("markdown") or ""),
                    )).casefold()
                    rows.append({"item": item, "searchText": search_text})
                refreshed[path] = {"signature": signature, "rows": rows, "warning": ""}
            except Exception:
                refreshed[path] = {
                    "signature": signature,
                    "rows": [],
                    "warning": f"브리핑 파일을 읽지 못했습니다: {path.name}",
                }
        self._entries = refreshed
        self._last_scan = now
        self._refreshed_at = dt.datetime.now(dt.timezone.utc).isoformat()

    @staticmethod
    def _row_key(item):
        return (item.get("reportDate", ""), item.get("marketScope", ""))

    @staticmethod
    def _merge_combined_pairs(group):
        """Collapse the per-market files of one 종합(both) generation into a single
        `both` archive card. Legacy combined `{date}.json` files are never grouped
        here because their items carry `combinedGeneration=False`."""
        items = sorted(
            (pair["item"] for pair in group),
            key=lambda it: {"us": 0, "kr": 1}.get(it.get("marketScope"), 2),
        )
        rep = items[0]
        date = rep.get("reportDate", "")
        briefing_type = rep.get("briefingType", "default")
        generated_at = max((it.get("generatedAt") or "") for it in items)
        session_date = next((it.get("sessionDate") for it in items if it.get("sessionDate")), "")
        synthetic = {
            "date": date,
            "marketScope": "both",
            "briefingType": briefing_type,
            "generatedAt": generated_at,
            "title": f"Daily Market Briefing — {date}",
            "summary": rep.get("summary", ""),
        }
        section = {
            "generatedAt": generated_at,
            "sessionDate": session_date,
            "summary": rep.get("summary", ""),
            "briefingType": briefing_type,
        }
        item = briefing_market_metadata(synthetic, "both", section)
        item["combinedGeneration"] = True
        search_text = " ".join(pair["searchText"] for pair in group)
        return {"item": item, "searchText": search_text}

    def _collapse_combined(self, pairs):
        """Group per-market combined-generation pairs by date into one `both` pair."""
        passthrough = []
        groups = {}
        for pair in pairs:
            if pair["item"].get("combinedGeneration"):
                groups.setdefault(pair["item"].get("reportDate", ""), []).append(pair)
            else:
                passthrough.append(pair)
        for group in groups.values():
            passthrough.append(self._merge_combined_pairs(group))
        return passthrough

    @staticmethod
    def _path_priority(path):
        return 1 if SCOPED_REPORT_FILE_RE.fullmatch(path.name) else 0

    def query(
        self, *, q="", market_scope="all", briefing_type="all",
        date_from="", date_to="", offset=0, limit=20, force_refresh=False,
    ):
        market_scope = str(market_scope or "all").strip().lower()
        briefing_type = str(briefing_type or "all").strip().lower()
        if market_scope not in {"all", "us", "kr", "both"}:
            raise ValueError("marketScope must be all, us, kr, or both")
        if briefing_type not in {"all", *BRIEFING_TYPES}:
            raise ValueError("briefingType must be all, default, market_focused, or concise")
        start = _date(date_from, "dateFrom")
        end = _date(date_to, "dateTo")
        if start and end and start > end:
            raise ValueError("dateFrom must be on or before dateTo")
        offset = _bounded_int(offset, "offset", 0)
        limit = _bounded_int(limit, "limit", 1, 100)
        needle = str(q or "").strip().casefold()

        with self._lock:
            self._scan(force=force_refresh)
            deduped = {}
            for path, entry in self._entries.items():
                priority = self._path_priority(path)
                for pair in entry["rows"]:
                    key = self._row_key(pair["item"])
                    current = deduped.get(key)
                    if current is None or priority >= current["priority"]:
                        deduped[key] = {"pair": pair, "priority": priority}
            pairs = self._collapse_combined([value["pair"] for value in deduped.values()])
            warnings = [entry["warning"] for entry in self._entries.values() if entry["warning"]]
            refreshed_at = self._refreshed_at
            report_files = len(self._entries)

        filtered = []
        for pair in pairs:
            item = pair["item"]
            if market_scope == "both" and item["reportScope"] != "both":
                continue
            if market_scope in {"us", "kr"} and item["marketScope"] != market_scope:
                continue
            if briefing_type != "all" and item["briefingType"] != briefing_type:
                continue
            if start and item["reportDate"] < start:
                continue
            if end and item["reportDate"] > end:
                continue
            if needle and needle not in pair["searchText"]:
                continue
            filtered.append(item)

        order = {"us": 0, "kr": 1, "both": 2}
        filtered.sort(key=lambda row: order.get(row["marketScope"], 9))
        filtered.sort(key=lambda row: row["reportDate"], reverse=True)
        total = len(filtered)
        return {
            "items": filtered[offset:offset + limit],
            "total": total,
            "offset": offset,
            "limit": limit,
            "warnings": warnings[:20],
            "cache": {"refreshedAt": refreshed_at, "reportFiles": report_files},
        }


_ARCHIVE_INDEX = BriefingArchiveIndex(BRIEFINGS_DIR)


def query_briefing_archive(
    *, q="", market_scope="all", briefing_type="all",
    date_from="", date_to="", offset=0, limit=20,
):
    return _ARCHIVE_INDEX.query(
        q=q,
        market_scope=market_scope,
        briefing_type=briefing_type,
        date_from=date_from,
        date_to=date_to,
        offset=offset,
        limit=limit,
    )


def refresh_briefing_archive():
    """Force the cached archive index to rescan (e.g. after a delete)."""
    with _ARCHIVE_INDEX._lock:
        _ARCHIVE_INDEX._scan(force=True)
