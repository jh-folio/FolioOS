import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

test("Briefing route owns archive and saved briefing APIs", async () => {
  const source = await readFile(new URL("../src/app/BriefingRoute.tsx", import.meta.url), "utf8");

  assert.match(source, /data-briefing-route/);
  assert.match(source, /\/api\/briefings\/index/);
  assert.match(source, /\/api\/briefings\/\$\{encodeURIComponent\(date\)\}/);
  assert.match(source, /includePersonal=true/);
  assert.match(source, /marketScope/);
  assert.match(source, /ReportReaderShell/);
  assert.match(source, /ReportBody/);
});

test("Briefing route mirrors the legacy generation and archive controls", async () => {
  const source = await readFile(new URL("../src/app/BriefingRoute.tsx", import.meta.url), "utf8");

  assert.match(source, /brief-gen-box input-panel react-briefing-generation/);
  assert.match(source, /brief-market-segment/);
  assert.match(source, /brief-gen-actionbar/);
  assert.match(source, /오늘 브리핑 생성/);
  assert.match(source, /이 날짜로 생성/);
  assert.doesNotMatch(source, />품질 모드</);
  assert.doesNotMatch(source, /setQualityMode/);
  assert.match(source, /briefing-archive-filters/);
  assert.match(source, /archiveQuery/);
  assert.match(source, /archiveMarket/);
  assert.match(source, /archiveType/);
  assert.match(source, /archiveStart/);
  assert.match(source, /archiveEnd/);
  assert.match(source, /archiveView/);
  assert.match(source, /ArchiveViewMode = "recent" \| "month" \| "market"/);
  assert.match(source, /RECENT_BRIEFING_LIMIT/);
  assert.match(source, /formatArchiveMonth/);
  assert.match(source, /report-feed-outside-controls/);
  assert.match(source, /report-feed-view-row/);
  assert.match(source, /report-feed-view-pill/);
  assert.match(source, /value="recent"/);
  assert.match(source, /value="month"/);
  assert.match(source, /URLSearchParams/);
  assert.match(source, /limit:\s*"100"/);
  assert.match(source, /marketScope:\s*archiveMarket/);
  assert.match(source, /briefingType:\s*archiveType/);
  assert.match(source, /strictDate/);
});

test("Briefing route owns reader actions and native note persistence", async () => {
  const source = await readFile(new URL("../src/app/BriefingRoute.tsx", import.meta.url), "utf8");
  const shellSource = await readFile(new URL("../src/app/reportReader/ReportReaderShell.tsx", import.meta.url), "utf8");
  const noteSource = await readFile(new URL("../src/app/reportReader/FolioNotePanel.tsx", import.meta.url), "utf8");

  assert.match(source, /\/api\/briefings\/\$\{encodeURIComponent\(date\)\}\/export-notion/);
  assert.match(source, /\/api\/briefings\/\$\{encodeURIComponent\(date\)\}\/export-obsidian/);
  assert.match(source, /\/api\/briefings\/\$\{encodeURIComponent\(date\)\}\/personal-overlay/);
  assert.match(source, /noteType: "market_memo"/);
  assert.match(source, /noteIdentity=\{briefingNoteIdentity/);
  assert.match(source, /noteLinkedTitle=\{readerContent\.title\}/);
  assert.match(source, /noteOverlayMarkdown=\{briefing\.personalOverlay\?\.markdown \|\| ""\}/);
  assert.match(shellSource, /FolioNotePanel/);
  assert.match(noteSource, /\/api\/investment-notes/);
  assert.match(source, /ReaderActionGroup title="AI"/);
  assert.match(source, /ReaderActionGroup title="노트"/);
  assert.match(source, /ReaderActionGroup title="내보내기"/);
  assert.match(source, /message: `\$\{readerContent\.title\}/);
  assert.match(source, /autoSubmit: true/);
  assert.doesNotMatch(source, />\s*목록\s*</);
});

test("AppShell renders BriefingRoute on the briefing route", async () => {
  const source = await readFile(new URL("../src/app/AppShell.tsx", import.meta.url), "utf8");

  assert.match(source, /<BriefingRoute\s*\/>/);
  assert.match(source, /route\.id === "briefing"/);
  assert.match(source, /renderRoutePane/);
});

test("briefing route no longer falls back to the legacy briefing view", async () => {
  const source = await readFile(new URL("../src/app/routes.ts", import.meta.url), "utf8");

  assert.doesNotMatch(source, /id: "briefing", label: "브리핑", group: "research", legacyViewId: "briefing"/);
});

test("Report Reader foundation mirrors the legacy inline reader contract", async () => {
  const source = await readFile(new URL("../src/app/reportReader/ReportReaderShell.tsx", import.meta.url), "utf8");
  const bodySource = await readFile(new URL("../src/app/reportReader/ReportBody.tsx", import.meta.url), "utf8");

  assert.match(source, /data-report-reader-shell/);
  assert.match(source, /actionSlot/);
  assert.match(source, /noteIdentity/);
  assert.doesNotMatch(source, /proposalSurface/);
  assert.doesNotMatch(source, /report-proposal-surface/);
  assert.match(source, /updateReactAgentContext/);
  assert.match(source, /onClose/);
  assert.match(source, /report-reader-inline/);
  assert.match(source, /report-reader-stage/);
  assert.match(source, /report-reader-dialog/);
  assert.match(source, /report-reader-rail/);
  assert.match(source, /report-note-panel is-open/);
  assert.match(bodySource, /stripInlineReferenceSections/);
  assert.match(bodySource, /참고\\s\*자료/);
  assert.match(bodySource, /Sources Used/);
  assert.match(bodySource, /sourcePanelHtml/);
});
