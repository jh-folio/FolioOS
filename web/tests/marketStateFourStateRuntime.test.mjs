import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import { fallbackWithLiveEvidenceFixture, marketStateFixtures, STATE_CANARY } from "./fixtures/marketStateFixtures.mjs";

const selectors = ["current", "stale", "empty", "fallback"].map((state) => `data-qa=\"market-state-${state}\"`);
const webRoot = fileURLToPath(new URL("..", import.meta.url));

test("four Market State fixtures render exactly one honest structural state", async (t) => {
  const vite = await createServer({ configFile: false, root: webRoot, server: { middlewareMode: true, hmr: false }, appType: "custom" });
  t.after(() => vite.close());
  const { MarketStateDashboardView } = await vite.ssrLoadModule("/src/islands/MarketStateDashboard.tsx");

  for (const [state, payload] of Object.entries(marketStateFixtures)) {
    const html = renderToStaticMarkup(React.createElement(MarketStateDashboardView, { payload, loading: false, updating: false }));
    assert.equal(selectors.filter((selector) => html.includes(selector)).length, 1, `${state} owns exactly one state selector`);
    assert.match(html, new RegExp(`data-qa=\"market-state-${state}\"`));
    assert.match(html, /data-qa=\"market-state-update\"/);
    assert.match(html, /data-qa=\"market-state-asof\"/);
    assert.match(html, /data-qa=\"market-state-source\"/);
    assert.doesNotMatch(html, /taxonomy|story map|family suggestion|audit/i);
    if (state === "current") {
      assert.match(html, /data-qa=\"market-state-drivers\"/);
      assert.match(html, /data-qa=\"market-state-counter-evidence\"/);
      assert.match(html, /data-qa=\"market-state-uncertainties\"/);
      assert.match(html, /data-qa=\"market-state-next-checks\"/);
    } else {
      assert.doesNotMatch(html, /data-qa=\"market-state-posture\"/);
    }
    if (state === "stale") assert.match(html, /새 외부 자료|new_relevant_evidence/);
    if (state === "fallback") assert.match(html, /현재 투자 판단으로 사용하지/);
    if (state === "empty") assert.match(html, /아직 생성된 시장 상태가 없습니다/);
  }
});

test("malformed dashboard payload fails closed to one empty state", async (t) => {
  const vite = await createServer({ configFile: false, root: webRoot, server: { middlewareMode: true, hmr: false }, appType: "custom" });
  t.after(() => vite.close());
  const { MarketStateDashboardView } = await vite.ssrLoadModule("/src/islands/MarketStateDashboard.tsx");
  const payload = { ...marketStateFixtures.current, marketStateRef: { status: "CURRENT_INJECT_THIS", sourceKind: "snapshot" } };
  const html = renderToStaticMarkup(React.createElement(MarketStateDashboardView, { payload, loading: false, updating: false }));
  assert.equal(selectors.filter((selector) => html.includes(selector)).length, 1);
  assert.match(html, /data-qa=\"market-state-empty\"/);
  assert.doesNotMatch(html, /data-qa=\"market-state-posture\"/);

  const partialCurrent = { ...marketStateFixtures.current, marketStateRef: { status: "current", sourceKind: "snapshot", scope: "GLOBAL" } };
  const partialHtml = renderToStaticMarkup(React.createElement(MarketStateDashboardView, { payload: partialCurrent }));
  assert.match(partialHtml, /data-qa=\"market-state-empty\"/);
  assert.doesNotMatch(partialHtml, /data-qa=\"market-state-current\"/);
});

test("snapshot asOf accepts an explicit local timezone offset", async (t) => {
  const vite = await createServer({ configFile: false, root: webRoot, server: { middlewareMode: true, hmr: false }, appType: "custom" });
  t.after(() => vite.close());
  const { MarketStateDashboardView, marketStateContextProjection } = await vite.ssrLoadModule("/src/islands/MarketStateDashboard.tsx");
  const payload = structuredClone(marketStateFixtures.stale);
  payload.marketStateRef.asOf = "2026-07-29T14:48:08.624992+09:00";

  const html = renderToStaticMarkup(React.createElement(MarketStateDashboardView, { payload }));
  assert.match(html, /data-qa="market-state-stale"/);
  assert.doesNotMatch(html, /data-qa="market-state-empty"/);
  assert.equal(marketStateContextProjection(payload)?.asOf, "2026-07-29T14:48:08.624992+09:00");
});

test("fallback accepts a valid live evidence watermark without promoting it to evidence context", async (t) => {
  const vite = await createServer({ configFile: false, root: webRoot, server: { middlewareMode: true, hmr: false }, appType: "custom" });
  t.after(() => vite.close());
  const { MarketStateDashboardView, marketStateContextProjection } = await vite.ssrLoadModule("/src/islands/MarketStateDashboard.tsx");
  const html = renderToStaticMarkup(React.createElement(MarketStateDashboardView, { payload: fallbackWithLiveEvidenceFixture }));
  assert.equal(selectors.filter((selector) => html.includes(selector)).length, 1);
  assert.match(html, /data-qa="market-state-fallback"/);
  assert.doesNotMatch(html, /data-qa="market-state-empty"/);
  assert.deepEqual(marketStateContextProjection(fallbackWithLiveEvidenceFixture), {
    status: "fallback",
    asOf: "2026-07-20T00:00:00Z",
    freshnessReason: "state_fallback",
    sourceKind: "state_fallback",
    scope: "GLOBAL",
    resolvedAt: "2026-07-22T01:00:00Z",
  });
  assert.doesNotMatch(JSON.stringify(marketStateContextProjection(fallbackWithLiveEvidenceFixture)), /relevantEvidenceWatermark|inputWatermark|evidenceItems|userContext/);

  for (const marketStateRef of [
    { ...fallbackWithLiveEvidenceFixture.marketStateRef, relevantEvidenceWatermark: "2026-07-22T00:45:00+09:00" },
    { ...fallbackWithLiveEvidenceFixture.marketStateRef, inputWatermark: "2026-07-20T00:00:00Z" },
  ]) {
    const invalidHtml = renderToStaticMarkup(React.createElement(MarketStateDashboardView, {
      payload: { ...fallbackWithLiveEvidenceFixture, marketStateRef },
    }));
    assert.match(invalidHtml, /data-qa="market-state-empty"/);
    assert.doesNotMatch(invalidHtml, /data-qa="market-state-fallback"/);
  }
});

test("scope tabs render only backed distinct market views", async (t) => {
  const vite = await createServer({ configFile: false, root: webRoot, server: { middlewareMode: true, hmr: false }, appType: "custom" });
  t.after(() => vite.close());
  const { MarketStateDashboardView } = await vite.ssrLoadModule("/src/islands/MarketStateDashboard.tsx");
  const overallOnly = renderToStaticMarkup(React.createElement(MarketStateDashboardView, { payload: marketStateFixtures.current }));
  assert.doesNotMatch(overallOnly, /미국장|한국장/);
  const withUs = { ...marketStateFixtures.current, marketViews: { us: { ...marketStateFixtures.current, title: "미국 시장" } } };
  const withUsHtml = renderToStaticMarkup(React.createElement(MarketStateDashboardView, { payload: withUs }));
  assert.match(withUsHtml, /종합/);
  assert.match(withUsHtml, /미국장/);
  assert.doesNotMatch(withUsHtml, /한국장/);
});

test("Deep Research renders freshness as separate context without canary promotion", async (t) => {
  const vite = await createServer({ configFile: false, root: webRoot, server: { middlewareMode: true, hmr: false }, appType: "custom" });
  t.after(() => vite.close());
  const { MarketStateReportContext } = await vite.ssrLoadModule("/src/app/DeepResearchRoute.tsx");
  const resolution = {
    policy: "include_current",
    requestedScope: "AUTO",
    resolvedScope: "GLOBAL",
    injected: false,
    reason: "stale_not_injected",
    ref: marketStateFixtures.stale.marketStateRef,
    evidenceItems: [STATE_CANARY],
    userContext: STATE_CANARY,
  };
  const html = renderToStaticMarkup(React.createElement(MarketStateReportContext, { resolution }));
  assert.match(html, /data-qa=\"dr-market-state-context\"/);
  assert.match(html, /data-status=\"stale\"/);
  assert.match(html, /기준 시각/);
  assert.match(html, /최신성/);
  assert.match(html, /new_relevant_evidence/);
  assert.match(html, /출처/);
  assert.doesNotMatch(html, new RegExp(STATE_CANARY));
  assert.doesNotMatch(html, /evidenceItems|userContext/);
});

test("Market State context projection is freshness-only and never evidence or hypothesis", async (t) => {
  const vite = await createServer({ configFile: false, root: webRoot, server: { middlewareMode: true, hmr: false }, appType: "custom" });
  t.after(() => vite.close());
  const { marketStateContextProjection } = await vite.ssrLoadModule("/src/islands/MarketStateDashboard.tsx");
  const payload = structuredClone(marketStateFixtures.current);
  payload.summary += ` ${STATE_CANARY}`;
  const projection = marketStateContextProjection(payload);
  assert.deepEqual(Object.keys(projection).sort(), ["asOf", "freshnessReason", "resolvedAt", "scope", "sourceKind", "status"].sort());
  assert.equal(JSON.stringify(projection).includes(STATE_CANARY), false);
  assert.equal("evidenceItems" in projection, false);
  assert.equal("sourceLedger" in projection, false);
  assert.equal("userContext" in projection, false);
});
