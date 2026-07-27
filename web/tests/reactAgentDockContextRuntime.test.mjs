import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";
import { transformWithOxc } from "vite";

const sourceUrl = new URL("../src/app/ReactAgentDock.tsx", import.meta.url);

async function loadContextHelpers() {
  const source = await readFile(sourceUrl, "utf8");
  const start = source.indexOf("const GLOBAL_AGENT_CONTEXT_FIELDS");
  const end = source.indexOf("function selectedAdapter", start);
  assert.ok(start >= 0 && end > start, "production context helper block must be discoverable");
  const transformed = await transformWithOxc(source.slice(start, end), sourceUrl.pathname, { lang: "tsx" });
  return import(`data:text/javascript;base64,${Buffer.from(transformed.code).toString("base64")}`);
}

test("route transition drops prior report, market, and transient Dock context", async () => {
  const { patchDockContextForSurface, resetDockContextForSurface, buildAgentRequestContext } = await loadContextHelpers();
  let state = {
    ownerSurface: "react_briefing",
    patch: {
      surface: "react_briefing",
      viewId: "briefing",
      reportKind: "briefing",
      reportId: "2026-07-22",
      marketScope: "us",
      selectedText: "stale selection",
      visibleSection: "stale section",
    },
  };
  state = patchDockContextForSurface(state, "react_briefing", {
    surface: "briefing_reader",
    reportKind: "briefing",
    reportId: "2026-07-22",
    marketScope: "us",
    selectedText: "explicit selection",
    visibleSection: "risk",
  });
  state = resetDockContextForSurface(state, "react_rss");

  const context = buildAgentRequestContext(
    { surface: "react_rss", viewId: "rss" },
    state,
    "react_rss",
  );

  assert.deepEqual(context, { surface: "react_rss", viewId: "rss" });
  for (const forbidden of ["reportKind", "reportId", "marketScope", "selectedText", "visibleSection"]) {
    assert.equal(Object.hasOwn(context, forbidden), false, `${forbidden} must not survive a route transition`);
  }
  if (process.env.FOLIO_CONTEXT_QA_LOG === "1") {
    console.log(JSON.stringify({ qa: "ROUTE_CONTEXT_PROBE", status: "PASS", context, forbiddenKeysPresent: [] }));
  }
});

test("same-route explicit patch works and current scoped collection identity wins", async () => {
  const { patchDockContextForSurface, buildAgentRequestContext } = await loadContextHelpers();
  let state = { ownerSurface: "react_deep-research", patch: { surface: "react_deep-research" } };
  state = patchDockContextForSurface(state, "react_deep-research", {
    surface: "topic_report_reader",
    reportKind: "topic_report",
    reportId: "topic-7",
    selectedText: "current selection",
    collectionId: "stale-collection",
    collectionRevision: 1,
  });

  const context = buildAgentRequestContext(
    {
      surface: "topic_report_reader",
      viewId: "deep-research",
      reportKind: "topic_report",
      reportId: "topic-7",
      collectionId: "current-collection",
      collectionRevision: 4,
    },
    state,
    "react_deep-research",
    { visibleSection: "counter-evidence" },
  );

  assert.equal(context.reportId, "topic-7");
  assert.equal(context.selectedText, "current selection");
  assert.equal(context.visibleSection, "counter-evidence");
  assert.equal(context.collectionId, "current-collection");
  assert.equal(context.collectionRevision, 4);
});

test("malformed current collection identity cannot revive stale explicit identity", async () => {
  const { patchDockContextForSurface, buildAgentRequestContext } = await loadContextHelpers();
  const state = patchDockContextForSurface(
    { ownerSurface: "react_deep-research", patch: {} },
    "react_deep-research",
    { collectionId: "stale-collection", collectionRevision: 1 },
  );
  const context = buildAgentRequestContext(
    { surface: "react_deep-research", viewId: "deep-research", collectionId: "malformed-without-revision" },
    state,
    "react_deep-research",
  );

  assert.equal(Object.hasOwn(context, "collectionId"), false);
  assert.equal(Object.hasOwn(context, "collectionRevision"), false);
});

test("repeated route interruptions never revive prior Dock patches", async () => {
  const { patchDockContextForSurface, resetDockContextForSurface, buildAgentRequestContext } = await loadContextHelpers();
  let state = { ownerSurface: "react_briefing", patch: { surface: "react_briefing" } };
  state = patchDockContextForSurface(state, "react_briefing", { reportId: "brief-1", marketScope: "kr" });
  state = resetDockContextForSurface(state, "react_rss");
  state = patchDockContextForSurface(state, "react_rss", { selectedText: "rss selection" });
  state = resetDockContextForSurface(state, "react_analysis");
  state = resetDockContextForSurface(state, "react_rss");

  const context = buildAgentRequestContext({ surface: "react_rss", viewId: "rss" }, state, "react_rss");
  assert.deepEqual(context, { surface: "react_rss", viewId: "rss" });
});
