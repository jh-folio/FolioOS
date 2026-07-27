import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

const routeUrl = new URL("../src/app/DeepResearchRoute.tsx", import.meta.url);
const shellUrl = new URL("../src/app/reportReader/ReportReaderShell.tsx", import.meta.url);
const cssUrl = new URL("../../public/styles.css", import.meta.url);

test("saved Deep Research reader exposes every provenance and RP-H1 state selector", async () => {
  const source = await readFile(routeUrl, "utf8");
  for (const selector of [
    "dr-approved-plan", "dr-evidence-coverage", "dr-source-ledger", "dr-data-gaps",
    "dr-quality", "dr-collection-resolution", "dr-market-state-context",
    "dr-user-context-hypothesis", "dr-overlay-hypothesis", "dr-overlay-stale",
    "dr-report-loading", "dr-report-return", "dr-report-not-found", "dr-report-error",
    "dr-report-list-empty",
  ]) assert.match(source, new RegExp("[\"']" + selector + "[\"']"), selector);
  assert.match(source, /parseTopicReportPayload/);
  assert.match(source, /try\s*\{[\s\S]*decodeURIComponent/);
  assert.match(source, /data-qa="dr-overlay-generate"/);
  assert.doesNotMatch(source, /data-qa="dr-overlay-generate"[^>]+setMobileNoteOpen/);
  assert.match(source, /coverage\.roleCounts/);
  assert.match(source, /coverage\.questionCoverage/);
  assert.match(source, /resolution\.collectionDefinitionHash/);
  assert.match(source, /resolution\.resolvedCandidateIds/);
  assert.match(source, /resolution\.executionUniverseIds/);
  assert.match(source, /resolution\.providerGenerations/);
  assert.match(source, /resolution\.inputWatermark/);
});

test("reader shell has one page main, labelled reader region, deterministic focus, Escape, and modal note controls", async () => {
  const source = await readFile(shellUrl, "utf8");
  assert.doesNotMatch(source, /<main className="report-reader-dialog/);
  assert.match(source, /<(?:section|article)[^>]+className="report-reader-dialog/);
  assert.doesNotMatch(source, /<article className="headline/);
  assert.match(source, /data-qa="dr-report-close"/);
  assert.match(source, /data-qa="reader-note-open"/);
  assert.match(source, /data-qa="reader-note-close"/);
  assert.match(source, /aria-modal=\{mobileNoteOpen/);
  assert.match(source, /event\.key === "Escape"/);
  assert.match(source, /focus\(\{ preventScroll: true \}\)/);
  assert.doesNotMatch(source, /data-qa="reader-note-open"[^>]+generatePersonalOverlay/);
});

test("reader CSS makes provenance responsive, focus visible, and mobile content vertically reachable", async () => {
  const css = await readFile(cssUrl, "utf8");
  assert.match(css, /\.topicrpt-provenance-grid/);
  assert.match(css, /\.topicrpt-provenance-panel/);
  assert.match(css, /\.topicrpt-hypothesis-panel/);
  assert.match(css, /\.report-reader-dialog:focus-visible/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*?\.report-reader-dialog[\s\S]*?overflow-y:\s*visible/);
});

test("Market State remains outside evidence and hypothesis panel markup", async () => {
  const source = await readFile(routeUrl, "utf8");
  const market = source.indexOf("<MarketStateReportContext");
  const evidence = source.indexOf("<DeepResearchProvenance");
  assert.ok(market > -1 && evidence > -1);
  assert.ok(market < evidence);
});
