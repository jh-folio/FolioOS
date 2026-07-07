import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

test("Deep Research route owns topic report feed, form, and reader APIs", async () => {
  const source = await readFile(new URL("../src/app/DeepResearchRoute.tsx", import.meta.url), "utf8");

  assert.match(source, /data-deep-research-route/);
  assert.match(source, /\/api\/topic-reports/);
  assert.match(source, /topicKey/);
  assert.match(source, /customLabel/);
  assert.match(source, /userContext/);
  assert.match(source, /deepResearch/);
  assert.match(source, /ReportReaderShell/);
  assert.match(source, /ReportBody/);
  assert.match(source, /noteIdentity/);
  assert.doesNotMatch(source, /proposalSurface/);
  assert.match(source, /openReactAgentDock/);
  assert.match(source, /updateReactAgentContext/);
  assert.match(source, /noteType: "topic_review"/);
  assert.match(source, /reportKind: "topic_report"/);
});

test("Deep Research route preserves legacy visual class contracts", async () => {
  const source = await readFile(new URL("../src/app/DeepResearchRoute.tsx", import.meta.url), "utf8");

  assert.match(source, /RouteHero/);
  assert.match(source, /input-panel topicrpt-form/);
  assert.match(source, /topicrpt-preset/);
  assert.match(source, /topicrpt-action-row/);
  assert.match(source, /report-feed-card is-topic/);
  assert.doesNotMatch(source, />품질 모드</);
  assert.doesNotMatch(source, /setQualityMode/);
});

test("Deep Research route polls agent jobs for generated reports", async () => {
  const source = await readFile(new URL("../src/app/DeepResearchRoute.tsx", import.meta.url), "utf8");

  assert.match(source, /\/api\/jobs\/\$\{encodeURIComponent\(current\.id\)\}/);
  assert.match(source, /reportId \|\| done\.result\?\.artifactId/);
  assert.match(source, /includePersonal=true/);
});

test("AppShell renders DeepResearchRoute on the deep-research route", async () => {
  const source = await readFile(new URL("../src/app/AppShell.tsx", import.meta.url), "utf8");

  assert.match(source, /<DeepResearchRoute\s*\/>/);
  assert.match(source, /route\.id === "deep-research"/);
  assert.match(source, /renderRoutePane/);
});

test("deep-research route no longer falls back to the legacy topicrpt view", async () => {
  const source = await readFile(new URL("../src/app/routes.ts", import.meta.url), "utf8");

  assert.doesNotMatch(source, /id: "deep-research", label: "딥 리서치", group: "research", legacyViewId: "topicrpt"/);
});

test("Deep Research stays routable but is hidden from the default 0.1 surface", async () => {
  const routeSource = await readFile(new URL("../src/app/routes.ts", import.meta.url), "utf8");
  const shellSource = await readFile(new URL("../src/app/AppShell.tsx", import.meta.url), "utf8");
  const homeSource = await readFile(new URL("../src/app/AgentHome.tsx", import.meta.url), "utf8");
  const paletteSource = await readFile(new URL("../src/app/CommandPalette.tsx", import.meta.url), "utf8");

  assert.match(routeSource, /id: "deep-research", label: "딥 리서치", group: "research", visibleInNav: false/);
  assert.match(routeSource, /id: "dashboard", label: "대시보드", group: "home", visibleInNav: false/);
  assert.match(routeSource, /id: "watchlist", label: "워치리스트", group: "home", visibleInNav: false/);
  assert.match(routeSource, /export const NAV_ROUTES = ROUTES\.filter/);
  assert.doesNotMatch(shellSource, /routes: \["analysis", "deep-research"\]/);
  assert.doesNotMatch(shellSource, /routes: \["home", "dashboard", "watchlist"\]/);
  assert.doesNotMatch(homeSource, /runQuickAction\("deep-research"\)/);
  assert.match(paletteSource, /NAV_ROUTES\.map/);
});
