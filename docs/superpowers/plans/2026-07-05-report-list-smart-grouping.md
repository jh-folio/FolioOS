# Report List Smart Grouping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Briefing and Company Analysis feeds easier to scan when saved reports grow.

**Architecture:** Keep backend APIs unchanged and add client-side grouping/filtering in the existing React routes. Briefing gets recent/month/market views; Company Analysis gets search plus recent/company/month views. Existing cards and reader routes remain unchanged.

**Tech Stack:** React + TypeScript in `web/src/app`, source-contract tests in `web/tests`, Vite build output in `public/react/folio-react.js`.

## Global Constraints

- Do not expose Deep Research in the 0.1 default UI.
- Do not add a folder tree for 0.1.
- Preserve existing report card visual language and route hashes.
- Do not touch backend APIs unless the frontend cannot meet the requirement.

---

### Task 1: Briefing Feed Views

**Files:**
- Modify: `web/src/app/BriefingRoute.tsx`
- Test: `web/tests/briefingRouteSource.test.mjs`

**Interfaces:**
- Consumes: `BriefingArchiveItem[]` from `/api/briefings/index`
- Produces: `visibleGroups: Array<{ label: string; rows: BriefingArchiveItem[] }>`

- [ ] Add `ArchiveViewMode = "recent" | "month" | "market"`.
- [ ] Default `archiveView` to `"recent"`.
- [ ] Group latest reports into one recent group, month view by `YYYY-MM`, and market view by existing market scope.
- [ ] Update the view dropdown and reset behavior.
- [ ] Add source tests for `recent`, `month`, and grouping helpers.

### Task 2: Company Analysis Feed Search And Views

**Files:**
- Modify: `web/src/app/CompanyAnalysisRoute.tsx`
- Test: `web/tests/companyAnalysisRouteSource.test.mjs`

**Interfaces:**
- Consumes: `AnalysisReport[]` from `/api/analysis-reports`
- Produces: `visibleReportGroups: Array<{ key: string; label: string; rows: AnalysisReport[] }>`

- [ ] Add `AnalysisViewMode = "recent" | "company" | "month"`.
- [ ] Add `reportQuery` and `reportView` state.
- [ ] Filter by ticker, company name, headline, mode, and generated date.
- [ ] Render feed controls above saved reports.
- [ ] Preserve existing card clicks and deletion behavior.
- [ ] Add source tests for search state, view state, and visible groups.

### Task 3: Verify And Build

**Files:**
- Modify: `public/react/folio-react.js`

- [ ] Run `npm run typecheck`.
- [ ] Run `node --test --test-reporter=dot tests/*.test.mjs`.
- [ ] Run `npm run build`.
- [ ] Run `node --check public\app.js`.
