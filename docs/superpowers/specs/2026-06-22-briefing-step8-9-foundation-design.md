# Briefing Step 8 P0 and Step 9 P0 Foundation Design

## Goal

Prepare Folio OS for market-specific briefing export and the historical briefing archive by implementing two foundations:

1. A normalized per-market metadata contract stored with new briefings and derived safely for legacy briefings.
2. A cached, filtered, paginated archive metadata API that leaves the existing briefing list API unchanged.

This design does not implement export images, split Obsidian/Notion export, or the archive frontend. Those remain Step 8 P1–P2 and Step 9 P1–P2.

## Product Decisions

- The archive UI direction is the approved feed-first single-column layout with top filters.
- `data/briefings/{date}.json` remains the source of truth and the one-report-file-per-date storage unit.
- A `both` report produces two archive metadata items, one for `us` and one for `kr`.
- Existing combined `markdown`, Personal Overlay, visual snapshots, and current-market read-only behavior remain unchanged.
- No SQLite archive database is introduced. The expected daily report volume does not justify index synchronization and migration complexity.

## Architecture

### Metadata contract

`features/daily_briefing/schema.py` owns dependency-free normalization and metadata construction.

Each new `briefings.us` or `briefings.kr` record stores:

```json
{
  "marketScope": "us",
  "briefingType": "market_focused",
  "generatedAt": "2026-06-22T08:30:00+09:00",
  "sessionDate": "2026-06-21",
  "title": "미국 시장 브리핑 — 2026.06.22",
  "summary": "금리 경계 속 반도체 강세가 지수 하단을 지지했습니다.",
  "markdown": "...",
  "sessionMode": "us_close",
  "marketSessionDate": "2026-06-21"
}
```

`sessionDate` is the normalized public metadata name. Existing `marketSessionDate` remains for compatibility and market-data semantics.

The pure metadata builder returns an archive-safe item with:

```text
id, reportDate, reportScope, marketScope, briefingType,
generatedAt, sessionDate, title, summary, tags
```

- `id` is stable within the archive: `{reportDate}:{marketScope}`.
- `reportScope` preserves whether the source report was generated as `us`, `kr`, or `both`.
- `tags` contains exactly two normalized display values: `미국장` or `한국장`, followed by `기본`, `시황중심`, or `요약`.
- `title` defaults to `미국 시장 브리핑 — {reportDate}` or `한국 시장 브리핑 — {reportDate}`.
- `summary` uses the scoped stored summary first, then the report summary, then the first 240 plain-text characters of scoped markdown.
- `generatedAt` falls back to the report-level value and then an empty string; it is never inferred from filesystem time.
- The builder never mutates its input and never changes canonical markdown.

Both the normal briefing builder and Agent Mode writeback call the same enrichment function so their persisted contracts cannot drift.

### Archive index and cache

Create `features/daily_briefing/archive.py` with one focused responsibility: turn dated report JSON files into queryable archive metadata.

The process-local cache stores one entry per report file:

```text
path -> {mtimeNs, size, metadataItems, searchText}
```

Behavior:

1. A directory snapshot is refreshed at most once every 30 seconds by default. Tests inject the clock or request a forced refresh.
2. The snapshot reads filenames and file stats only; it does not parse every JSON document.
3. New or changed files are parsed and normalized.
4. Unchanged files reuse cached metadata and search text.
5. Deleted files are removed from the cache.
6. `.visuals.json` and `.visuals.json.gz` files are never treated as reports.
7. Invalid JSON is skipped and reported through aggregate warnings without breaking valid results.
8. Cache loss or process restart causes a transparent rebuild from report JSON files.

The cache is memory-only. It adds no duplicate persistent index and therefore cannot become a second source of truth.

Search text contains normalized title, summary, and scoped markdown. It is retained once per cached market item so title/body search does not reopen unchanged files. The expected daily briefing volume keeps this bounded; SQLite FTS should be reconsidered only if archive size or measured latency becomes material, with 10,000 report files as a review trigger rather than an automatic migration.

### API

Add an explicit route before `/api/briefings/{date}`:

```text
GET /api/briefings/index
```

Accepted query parameters:

```text
q              optional title/summary/body text
marketScope    us | kr | both | all; default all
briefingType   default | market_focused | concise | all; default all
dateFrom       optional YYYY-MM-DD inclusive
dateTo         optional YYYY-MM-DD inclusive
offset         integer, default 0, minimum 0
limit          integer, default 20, range 1..100
```

Response:

```json
{
  "items": [],
  "total": 0,
  "offset": 0,
  "limit": 20,
  "warnings": [],
  "cache": {"refreshedAt": "...", "reportFiles": 0}
}
```

Results are ordered by `reportDate` descending, then `marketScope` in stable `us`, `kr` order. `marketScope=both` selects items whose source `reportScope` is `both` and still returns those items separately as US and KR rows; `us` and `kr` select the market item regardless of its source report scope. The response preserves `reportScope` so the future UI can distinguish generated-together records without parsing IDs.

The existing `GET /api/briefings` continues returning its current array. This avoids breaking the dashboard and date selector while the archive UI is not yet implemented.

`app.py` only validates/translates query parameters and calls the archive service. File scanning, caching, filtering, and metadata construction remain under `features/daily_briefing/`.

## Data Flow

```text
normal builder / Agent Mode writeback
    -> enrich per-market stored records
    -> data/briefings/{date}.json

GET /api/briefings/index
    -> archive service directory snapshot (TTL)
    -> compare mtime_ns + size
    -> parse only new/changed report JSON
    -> metadata builder for us/kr items
    -> filter -> stable sort -> paginate
    -> response envelope
```

## Compatibility and Failure Handling

- Legacy reports without `briefings` return one best-effort metadata item using normalized report-level scope and fields.
- Legacy `both` reports with scoped markdown return separate US/KR items without rewriting the file.
- Missing or malformed scoped fields fall back to report-level values and normalized enum defaults.
- One corrupt report file does not fail the archive; the response includes a bounded warning.
- Invalid enum query values and invalid date formats return HTTP 400.
- `dateFrom > dateTo` returns HTTP 400.
- Offset beyond the result set returns an empty `items` array with the correct `total`.
- Cache internals never appear in saved report JSON.
- No code path writes to `data/` while serving archive reads.

## Testing Strategy

Implementation follows test-first development.

### Metadata tests

- New US/KR records contain all standardized metadata fields.
- `both` yields stable US/KR metadata IDs and tags without parsing combined markdown.
- Legacy reports receive safe defaults and bounded summaries without input mutation.
- Invalid market/type values normalize to existing enum defaults.
- Partial-scope merge preserves sibling metadata and marks Personal Overlay stale only under the existing rule.
- Normal builder and Agent Mode use the same enrichment contract.

### Archive cache and query tests

- Initial scan parses valid dated report files and ignores visual sidecars.
- A second query reuses unchanged cache entries.
- Changing one file reparses only that file.
- Adding and deleting files updates the cache after refresh.
- Corrupt JSON produces a warning while valid files remain available.
- Market, type, date, and text filters compose correctly.
- Sort order, total count, offset, and bounded limit are deterministic.
- Search matches scoped markdown but does not leak the opposite market's body into a market item.

### API tests

- `/api/briefings/index` returns the envelope and forwards validated filters.
- Invalid enums, dates, ranges, offset, and limit return HTTP 400.
- Existing `/api/briefings` response remains an array.

All tests use temporary directories and synthetic reports. They do not read, modify, or delete personal files in `data/briefings`.

## Documentation and Completion

When implementation passes verification:

- Update `features/daily_briefing/README.md` with the stored metadata and archive API contract.
- Update `features/README.md` only if its feature boundary description needs clarification.
- Update `roadmap/BRIEFING_IMPLEMENTATION_PLAN.md` Step 8 P0 and Step 9 P0 status and work log.
- Update `AGENTS.md` and `CLAUDE.md` identically if the top-level implemented-feature summary changes.
- Run focused Python tests, the full relevant regression suite, Python compilation, and `node --check public/app.js` even though P0 does not modify frontend JavaScript.
- Verify no files under `data/`, `research-inbox/`, or `config/` changed.
