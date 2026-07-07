# Briefing Step 8–9 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add standardized per-market briefing metadata and a cached, filtered, paginated archive metadata API without changing canonical markdown or the existing briefing list API.

**Architecture:** Keep dated JSON reports as the only persistent source of truth. Add pure metadata helpers to `features/daily_briefing/schema.py`, use them from both normal and Agent Mode generation, and place mtime/size caching plus archive queries in a new `features/daily_briefing/archive.py` module. `app.py` remains a thin route adapter.

**Tech Stack:** Python 3, FastAPI, JSON-per-report storage, `pathlib`, `unittest`-style existing test runners, Node syntax verification.

---

## File Map

- Modify `features/daily_briefing/schema.py`: normalize and enrich per-market records; derive archive metadata without mutating reports.
- Modify `features/daily_briefing/builder.py`: persist enriched market records in the normal generation path.
- Modify `features/agent_mode/service.py`: persist the same enriched records in Agent Mode writeback.
- Create `features/daily_briefing/archive.py`: mtime/size cache, query validation, filtering, stable sort, and pagination.
- Modify `app.py`: expose `GET /api/briefings/index` before the dynamic date route.
- Modify `features/daily_briefing/tests/test_contracts.py`: metadata contract and compatibility tests.
- Modify `features/daily_briefing/tests/test_builder.py`: normal builder persistence regression.
- Modify `features/agent_mode/tests/test_writeback.py`: Agent Mode metadata regression.
- Create `features/daily_briefing/tests/test_archive.py`: cache, filtering, search, warning, and pagination tests.
- Modify `features/daily_briefing/README.md`: storage and API documentation.
- Modify `roadmap/BRIEFING_IMPLEMENTATION_PLAN.md`: mark Step 8 P0 and Step 9 P0 complete and record verification.
- Modify `AGENTS.md` and `CLAUDE.md` identically only if the top-level briefing boundary description needs the new archive API.

### Task 1: Pure Per-Market Metadata Contract

**Files:**
- Modify: `features/daily_briefing/tests/test_contracts.py`
- Modify: `features/daily_briefing/schema.py`

- [ ] **Step 1: Write failing metadata tests**

Add imports for `briefing_market_metadata`, `briefing_archive_items`, and `enrich_briefing_sections`, then add tests equivalent to:

```python
def test_market_metadata_is_structured_and_does_not_mutate_report():
    report = {
        "date": "2026-06-22",
        "marketScope": "both",
        "briefingType": "market_focused",
        "generatedAt": "2026-06-22T08:30:00+09:00",
        "summary": "report fallback",
        "briefings": {
            "us": {
                "markdown": "# US Market Briefing\n\nUS body",
                "marketSessionDate": "2026-06-21",
                "summary": "US summary",
            },
            "kr": {
                "markdown": "# Korea Market Briefing\n\nKR body",
                "marketSessionDate": "2026-06-22",
            },
        },
    }
    original = deepcopy(report)
    items = briefing_archive_items(report)
    assert report == original
    assert [row["id"] for row in items] == ["2026-06-22:us", "2026-06-22:kr"]
    assert items[0]["title"] == "미국 시장 브리핑 — 2026-06-22"
    assert items[0]["summary"] == "US summary"
    assert items[0]["tags"] == ["미국장", "시황중심"]
    assert items[1]["sessionDate"] == "2026-06-22"
    assert items[1]["reportScope"] == "both"


def test_enrichment_adds_metadata_without_changing_markdown():
    sections = {"us": {"markdown": "# US Market Briefing\n\nBody", "marketSessionDate": "2026-06-21"}}
    enriched = enrich_briefing_sections(
        sections,
        report_date="2026-06-22",
        report_scope="us",
        briefing_type="concise",
        generated_at="2026-06-22T09:00:00+09:00",
        report_summary="fallback",
    )
    assert enriched["us"]["markdown"] == sections["us"]["markdown"]
    assert enriched["us"]["marketScope"] == "us"
    assert enriched["us"]["briefingType"] == "concise"
    assert enriched["us"]["sessionDate"] == "2026-06-21"
    assert enriched["us"]["tags"] == ["미국장", "요약"]


def test_legacy_report_gets_one_safe_archive_item():
    report = {"date": "2026-06-20", "markdown": "# Legacy\n\n" + "A" * 400}
    items = briefing_archive_items(report)
    assert len(items) == 1
    assert items[0]["id"] == "2026-06-20:both"
    assert len(items[0]["summary"]) == 240
```

- [ ] **Step 2: Run the tests and verify RED**

Run:

```powershell
py -3 features\daily_briefing\tests\test_contracts.py
```

Expected: import failure because the new metadata functions do not exist.

- [ ] **Step 3: Implement the pure helpers**

Add constants and functions to `schema.py` with these signatures and behaviors:

```python
MARKET_TAGS = {"us": "미국장", "kr": "한국장", "both": "종합"}
BRIEFING_TYPE_TAGS = {"default": "기본", "market_focused": "시황중심", "concise": "요약"}


def _plain_excerpt(value, limit=240):
    text = re.sub(r"[`*_>#\[\]()-]+", " ", str(value or ""))
    return re.sub(r"\s+", " ", text).strip()[:limit]


def briefing_market_metadata(report, market_scope, section=None):
    source = section if isinstance(section, dict) else {}
    report_date = str(report.get("date") or "").strip()
    scope = normalize_market_scope(market_scope)
    report_scope = normalize_market_scope(report.get("marketScope"))
    briefing_type = normalize_briefing_type(source.get("briefingType") or report.get("briefingType"))
    title = source.get("title") or {
        "us": f"미국 시장 브리핑 — {report_date}",
        "kr": f"한국 시장 브리핑 — {report_date}",
        "both": report.get("title") or f"시장 브리핑 — {report_date}",
    }[scope]
    summary = source.get("summary") or report.get("summary") or _plain_excerpt(source.get("markdown") or report.get("markdown"))
    return {
        "id": f"{report_date}:{scope}",
        "reportDate": report_date,
        "reportScope": report_scope,
        "marketScope": scope,
        "briefingType": briefing_type,
        "generatedAt": source.get("generatedAt") or report.get("generatedAt") or "",
        "sessionDate": source.get("sessionDate") or source.get("marketSessionDate") or "",
        "title": str(title),
        "summary": _plain_excerpt(summary),
        "tags": [MARKET_TAGS[scope], BRIEFING_TYPE_TAGS[briefing_type]],
    }


def enrich_briefing_sections(sections, *, report_date, report_scope, briefing_type, generated_at, report_summary=""):
    report = {
        "date": report_date,
        "marketScope": report_scope,
        "briefingType": briefing_type,
        "generatedAt": generated_at,
        "summary": report_summary,
    }
    enriched = {}
    for scope, raw in deepcopy(sections or {}).items():
        if scope not in {"us", "kr"} or not isinstance(raw, dict):
            enriched[scope] = deepcopy(raw)
            continue
        section = deepcopy(raw)
        metadata = briefing_market_metadata(report, scope, section)
        section.update({key: metadata[key] for key in (
            "marketScope", "briefingType", "generatedAt", "sessionDate", "title", "summary", "tags"
        )})
        enriched[scope] = section
    return enriched


def briefing_archive_items(report):
    normalized = normalize_briefing_contract(report)
    sections = normalized.get("briefings") or {}
    scopes = [scope for scope in ("us", "kr") if isinstance(sections.get(scope), dict)]
    if scopes:
        return [briefing_market_metadata(normalized, scope, sections[scope]) for scope in scopes]
    return [briefing_market_metadata(normalized, normalized.get("marketScope", "both"), normalized)]
```

Adjust exact markdown cleaning only if needed to keep headings readable in the 240-character fallback.

- [ ] **Step 4: Run contract tests and verify GREEN**

Run the Task 1 command. Expected: all contract tests pass.

- [ ] **Step 5: Commit Task 1**

```powershell
git add features/daily_briefing/schema.py features/daily_briefing/tests/test_contracts.py
git commit -m "feat: add briefing market metadata contract"
```

### Task 2: Persist Metadata in Both Generation Paths

**Files:**
- Modify: `features/daily_briefing/tests/test_builder.py`
- Modify: `features/agent_mode/tests/test_writeback.py`
- Modify: `features/daily_briefing/builder.py`
- Modify: `features/agent_mode/service.py`

- [ ] **Step 1: Add failing normal-builder assertions**

Extend `test_both_scope_stores_two_complete_reports_and_structured_fields`:

```python
for scope in ("us", "kr"):
    section = report["briefings"][scope]
    assert section["marketScope"] == scope
    assert section["briefingType"] == "default"
    assert section["generatedAt"] == report["generatedAt"]
    assert section["sessionDate"] == section["marketSessionDate"]
    assert section["title"]
    assert section["summary"]
    assert len(section["tags"]) == 2
```

Extend the existing Agent Mode writeback fixture test after loading the saved report:

```python
for scope in ("us", "kr"):
    section = saved["briefings"][scope]
    assert section["marketScope"] == scope
    assert section["briefingType"] == saved["briefingType"]
    assert section["generatedAt"] == saved["generatedAt"]
```

- [ ] **Step 2: Run both tests and verify RED**

```powershell
py -3 features\daily_briefing\tests\test_builder.py
py -3 features\agent_mode\tests\test_writeback.py
```

Expected: missing metadata keys in scoped records.

- [ ] **Step 3: Enrich normal builder records**

Import `enrich_briefing_sections` in `builder.py`. Compute `generated_at = now_iso()` once before the report dict, then replace the current `briefings` comprehension with:

```python
raw_sections = {
    key: {field: value for field, value in result.items() if field in {
        "markdown", "sessionMode", "marketSessionDate", "sources", "generation", "status"
    }}
    for key, result in results.items()
}
briefing_sections = enrich_briefing_sections(
    raw_sections,
    report_date=date,
    report_scope=market_scope,
    briefing_type=briefing_type,
    generated_at=generated_at,
    report_summary=report_summary,
)
```

Use the same `generated_at` and `report_summary` values in the report-level fields.

- [ ] **Step 4: Enrich Agent Mode writeback records**

Import `enrich_briefing_sections` in `features/agent_mode/service.py` and enrich the dictionary returned by `split_market_markdown` before storage:

```python
sections = enrich_briefing_sections(
    split_market_markdown(markdown, draft.get("marketScope", "both")),
    report_date=date,
    report_scope=draft.get("marketScope", "both"),
    briefing_type=draft.get("briefingType", "default"),
    generated_at=draft.get("generatedAt", ""),
    report_summary=draft.get("summary", ""),
)
```

Store `sections` in the briefing dict and leave merge/write behavior unchanged.

- [ ] **Step 5: Run both suites and verify GREEN**

Run the Task 2 commands. Expected: both suites pass.

- [ ] **Step 6: Commit Task 2**

```powershell
git add features/daily_briefing/builder.py features/daily_briefing/tests/test_builder.py features/agent_mode/service.py features/agent_mode/tests/test_writeback.py
git commit -m "feat: persist briefing metadata by market"
```

### Task 3: Cached Archive Index and Query Service

**Files:**
- Create: `features/daily_briefing/archive.py`
- Create: `features/daily_briefing/tests/test_archive.py`

- [ ] **Step 1: Write failing cache and query tests**

Create a standalone existing-style test module using `TemporaryDirectory`. Include a counting JSON loader and a fake clock. Core assertions:

```python
def test_cache_reloads_only_changed_reports():
    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        write_report(root / "2026-06-21.json", "2026-06-21", "old")
        loads = []
        index = BriefingArchiveIndex(root, ttl_seconds=0, loader=lambda path: loads.append(path.name) or json.loads(path.read_text(encoding="utf-8")))
        assert index.query()["total"] == 2
        assert loads == ["2026-06-21.json"]
        index.query()
        assert loads == ["2026-06-21.json"]
        write_report(root / "2026-06-21.json", "2026-06-21", "changed")
        index.query(force_refresh=True)
        assert loads == ["2026-06-21.json", "2026-06-21.json"]


def test_query_composes_filters_search_sort_and_pagination():
    payload = index.query(
        q="semiconductor",
        market_scope="us",
        briefing_type="market_focused",
        date_from="2026-06-01",
        date_to="2026-06-30",
        offset=0,
        limit=1,
    )
    assert payload["total"] == 2
    assert len(payload["items"]) == 1
    assert payload["items"][0]["marketScope"] == "us"


def test_corrupt_json_warns_and_sidecars_are_ignored():
    assert payload["total"] == 2
    assert len(payload["warnings"]) == 1
    assert payload["cache"]["reportFiles"] == 1


def test_market_search_does_not_match_sibling_markdown():
    us = index.query(q="kr-only-term", market_scope="us")
    kr = index.query(q="kr-only-term", market_scope="kr")
    assert us["total"] == 0
    assert kr["total"] == 1
```

Add validation assertions for bad enum, date, range, offset, and limit values raising `ValueError` with stable messages.

- [ ] **Step 2: Run the archive test and verify RED**

```powershell
py -3 features\daily_briefing\tests\test_archive.py
```

Expected: import failure because `archive.py` does not exist.

- [ ] **Step 3: Implement the archive module**

Implement this public surface and core behavior:

```python
from __future__ import annotations

import datetime as dt
import json
import re
import threading
import time
from pathlib import Path

from features.daily_briefing.schema import BRIEFING_TYPES, briefing_archive_items

ROOT = Path(__file__).resolve().parents[2]
BRIEFINGS_DIR = ROOT / "data" / "briefings"
REPORT_FILE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}\.json$")


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
                        item.get("title", ""), item.get("summary", ""),
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

    def query(self, *, q="", market_scope="all", briefing_type="all",
              date_from="", date_to="", offset=0, limit=20,
              force_refresh=False):
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
            pairs = [pair for entry in self._entries.values() for pair in entry["rows"]]
            warnings = [entry["warning"] for entry in self._entries.values() if entry["warning"]]

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
            "cache": {"refreshedAt": self._refreshed_at, "reportFiles": len(self._entries)},
        }


_ARCHIVE_INDEX = BriefingArchiveIndex(BRIEFINGS_DIR)


def query_briefing_archive(*, q="", market_scope="all", briefing_type="all",
                           date_from="", date_to="", offset=0, limit=20):
    return _ARCHIVE_INDEX.query(
        q=q, market_scope=market_scope, briefing_type=briefing_type,
        date_from=date_from, date_to=date_to, offset=offset, limit=limit,
    )
```

Cache entries contain the `(mtime_ns, size)` signature, per-item metadata/search text, and a bounded warning. Scan only `YYYY-MM-DD.json`, sort paths for deterministic loader counts, and never include exception details or file contents in warnings.

Normalize and validate with explicit helpers:

```python
def _date(value, field):
    if not value:
        return ""
    try:
        return date.fromisoformat(str(value)).isoformat()
    except ValueError as exc:
        raise ValueError(f"{field} must be YYYY-MM-DD") from exc


def _bounded_int(value, field, minimum, maximum=None):
    try:
        number = int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{field} must be an integer") from exc
    if number < minimum or (maximum is not None and number > maximum):
        if maximum is None:
            raise ValueError(f"{field} must be {minimum} or greater")
        raise ValueError(f"{field} must be between {minimum} and {maximum}")
    return number
```

For each market item, build `searchText` only from its own title, summary, and scoped markdown. Return metadata without `searchText`. Implement `market_scope="both"` against `reportScope`, and `us`/`kr` against item `marketScope`.

- [ ] **Step 4: Run archive tests and verify GREEN**

Run the Task 3 command. Expected: all archive tests pass.

- [ ] **Step 5: Commit Task 3**

```powershell
git add features/daily_briefing/archive.py features/daily_briefing/tests/test_archive.py
git commit -m "feat: add cached briefing archive index"
```

### Task 4: Thin Archive API Route

**Files:**
- Modify: `app.py`
- Modify: `features/daily_briefing/tests/test_archive.py`

- [ ] **Step 1: Add failing route adapter test**

In `test_archive.py`, import `app` only inside the test and patch the imported query function:

```python
def test_archive_route_translates_query_and_maps_value_error():
    import app
    with patch.object(app, "query_briefing_archive", return_value={"items": [], "total": 0}) as query:
        result = app.api_briefing_archive_index(
            q="chips", marketScope="us", briefingType="concise",
            dateFrom="2026-06-01", dateTo="2026-06-30", offset=2, limit=5,
        )
    assert result["total"] == 0
    query.assert_called_once_with(
        q="chips", market_scope="us", briefing_type="concise",
        date_from="2026-06-01", date_to="2026-06-30", offset=2, limit=5,
    )

    with patch.object(app, "query_briefing_archive", side_effect=ValueError("bad query")):
        try:
            app.api_briefing_archive_index()
            raise AssertionError("HTTPException was not raised")
        except app.HTTPException as exc:
            assert exc.status_code == 400
```

Use the shown `try/except HTTPException` style so the test adds no new dependency.

- [ ] **Step 2: Run and verify RED**

Run the archive test. Expected: missing `api_briefing_archive_index`.

- [ ] **Step 3: Add the route before `/api/briefings/{date}`**

Import `query_briefing_archive` from `features.daily_briefing.archive` and add:

```python
@fastapi_app.get("/api/briefings/index")
def api_briefing_archive_index(
    q: str = "",
    marketScope: str = "all",
    briefingType: str = "all",
    dateFrom: str = "",
    dateTo: str = "",
    offset: int = 0,
    limit: int = 20,
):
    try:
        return query_briefing_archive(
            q=q,
            market_scope=marketScope,
            briefing_type=briefingType,
            date_from=dateFrom,
            date_to=dateTo,
            offset=offset,
            limit=limit,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
```

Keep existing `api_list_briefings()` unchanged.

- [ ] **Step 4: Run route and archive tests and verify GREEN**

Run the archive test. Then run:

```powershell
py -3 -c "import app; print(any(getattr(r, 'path', '') == '/api/briefings/index' for r in app.fastapi_app.routes))"
```

Expected: tests pass and command prints `True`.

- [ ] **Step 5: Commit Task 4**

```powershell
git add app.py features/daily_briefing/tests/test_archive.py
git commit -m "feat: expose briefing archive index API"
```

### Task 5: Documentation and Full Verification

**Files:**
- Modify: `features/daily_briefing/README.md`
- Modify: `roadmap/BRIEFING_IMPLEMENTATION_PLAN.md`
- Modify identically if needed: `AGENTS.md`, `CLAUDE.md`

- [ ] **Step 1: Document the implemented contracts**

Add to the daily briefing README:

```text
- Stored `briefings.us`/`briefings.kr` records include marketScope, briefingType,
  generatedAt, sessionDate, title, summary, and tags.
- `GET /api/briefings/index` returns cached per-market archive metadata and accepts
  q, marketScope, briefingType, dateFrom, dateTo, offset, and limit.
- The cache is memory-only, reloads only files whose mtime/size changed, and never
  writes archive reads back to report JSON.
```

Mark Step 8 P0 and Step 9 P0 complete in the roadmap, set the next task to Step 8 P1, and add a work-log row with actual test counts from verification.

- [ ] **Step 2: Run focused regression suites**

```powershell
py -3 features\daily_briefing\tests\test_contracts.py
py -3 features\daily_briefing\tests\test_builder.py
py -3 features\daily_briefing\tests\test_archive.py
py -3 features\agent_mode\tests\test_writeback.py
```

Expected: all pass with no warnings or tracebacks.

- [ ] **Step 3: Run broader verification**

```powershell
py -3 -m compileall app.py features\daily_briefing features\agent_mode
node --check public\app.js
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 4: Verify protected data and synchronized instructions**

```powershell
git status --short
git diff --name-only -- data research-inbox config
py -3 -c "from pathlib import Path; print(Path('AGENTS.md').read_text(encoding='utf-8') == Path('CLAUDE.md').read_text(encoding='utf-8'))"
```

Expected: no output for protected directories and `True` for instruction synchronization. Any untracked planning or visual-companion files remain excluded from implementation commits.

- [ ] **Step 5: Commit documentation**

```powershell
git add features/daily_briefing/README.md roadmap/BRIEFING_IMPLEMENTATION_PLAN.md AGENTS.md CLAUDE.md
git commit -m "docs: record briefing archive foundations"
```

Only stage `AGENTS.md` and `CLAUDE.md` when both were changed identically.
