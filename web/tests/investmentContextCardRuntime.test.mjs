import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const webRoot = fileURLToPath(new URL("..", import.meta.url));

const summary = {
  observedAt: "2026-07-27T12:00:00Z",
  counts: {
    total: 2,
    portfolio: 1,
    watchlist: 0,
    both: 1,
    positive: 0,
    watch: 2,
    negative: 0,
    neutral: 0,
    unknown: 0,
  },
  watchContexts: [
    {
      ticker: "NVDA",
      source: "both",
      stance: "watch",
      observedAt: "2026-07-27T12:00:00Z",
      reasonCodes: [],
      marketDrivers: [{ stateId: "ai-capex", label: "AI CAPEX", momentum: "stable" }],
      latestThesisVerdict: "maintained",
      dueCheckpoints: [{ id: "cp-nvda", label: "PRIVATE-CHECKPOINT-CANARY", dueAt: "2026-07-27T00:00:00Z" }],
      linkedReports: [],
      collections: [{ id: "ai-watch", name: "AI watch", revision: 2, health: "active", matchSources: ["saved_filter"] }],
    },
    {
      ticker: "MSFT",
      source: "portfolio",
      stance: "watch",
      observedAt: "2026-07-27T12:00:00Z",
      reasonCodes: [],
      marketDrivers: [{ stateId: "cloud", label: "Cloud demand", momentum: "stable" }],
      latestThesisVerdict: "unknown",
      dueCheckpoints: [],
      linkedReports: [],
      collections: [],
    },
  ],
};

test("card renders bounded personal context and collection filtering without private values", async (t) => {
  const vite = await createServer({ configFile: false, root: webRoot, server: { middlewareMode: true, hmr: false }, appType: "custom" });
  t.after(() => vite.close());
  const { InvestmentContextCardView } = await vite.ssrLoadModule("/src/app/InvestmentContextCard.tsx");

  const home = renderToStaticMarkup(React.createElement(InvestmentContextCardView, { mode: "home", summary }));
  assert.match(home, /data-layer="hypothesis"/);
  assert.match(home, /NVDA/);
  assert.match(home, /MSFT/);
  assert.match(home, /AI CAPEX/);
  assert.match(home, /확인 예정 1/);
  assert.doesNotMatch(home, /quantity|costBasis|averagePrice|portfolioTotal|noteBody/);

  const collection = renderToStaticMarkup(React.createElement(InvestmentContextCardView, {
    mode: "collection",
    summary,
    collectionId: "ai-watch",
  }));
  assert.match(collection, /NVDA/);
  assert.doesNotMatch(collection, /MSFT/);
});

test("empty state is neutral and dismissible", async (t) => {
  const vite = await createServer({ configFile: false, root: webRoot, server: { middlewareMode: true, hmr: false }, appType: "custom" });
  t.after(() => vite.close());
  const { InvestmentContextCardView } = await vite.ssrLoadModule("/src/app/InvestmentContextCard.tsx");
  const empty = { ...summary, counts: { ...summary.counts, total: 0 }, watchContexts: [] };

  const html = renderToStaticMarkup(React.createElement(InvestmentContextCardView, {
    mode: "home",
    summary: empty,
    dismissible: true,
    onDismiss: () => {},
  }));
  assert.match(html, /data-qa="investment-context-empty"/);
  assert.match(html, /개인 리서치 연결이 아직 없습니다/);
  assert.match(html, /aria-label="개인 맥락 카드 닫기"/);
  assert.doesNotMatch(html, /위험|경고|추천/);
});

test("controlled Agent reply renders headings and bullets without HTML injection", async (t) => {
  const vite = await createServer({ configFile: false, root: webRoot, server: { middlewareMode: true, hmr: false }, appType: "custom" });
  t.after(() => vite.close());
  const { InvestmentContextCardView } = await vite.ssrLoadModule("/src/app/InvestmentContextCard.tsx");
  const html = renderToStaticMarkup(React.createElement(InvestmentContextCardView, {
    mode: "home",
    summary,
    explanation: {
      ticker: "NVDA",
      reply: "### 불확실성\n- 수요 지속성은 미확인\n<script>PRIVATE_CANARY</script>",
    },
  }));
  assert.match(html, /<h3>불확실성<\/h3>/);
  assert.match(html, /class="is-bullet">수요 지속성은 미확인<\/p>/);
  assert.doesNotMatch(html, /<script>PRIVATE_CANARY<\/script>/);
  assert.match(html, /&lt;script&gt;PRIVATE_CANARY&lt;\/script&gt;/);
});
