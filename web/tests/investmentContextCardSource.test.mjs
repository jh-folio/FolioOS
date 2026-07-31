import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

async function source(path) {
  return readFile(new URL(`../src/${path}`, import.meta.url), "utf8");
}

test("Investment Context uses one bounded hypothesis-only API contract", async () => {
  const api = await source("api.ts");
  const card = await source("app/InvestmentContextCard.tsx");

  for (const typeName of [
    "InvestmentContextSummary",
    "InvestmentTickerContext",
    "InvestmentMarketDriver",
    "InvestmentDueCheckpoint",
  ]) assert.match(api, new RegExp(`export type ${typeName}`));
  assert.match(card, /\/api\/investment-context\/summary/);
  assert.match(card, /layer: "hypothesis"/);
  assert.match(card, /data-layer=\{contextBoundary\.layer\}/);
  assert.match(card, /내 투자 맥락 · 가설 \(근거 아님\)/);
  assert.match(card, /reuseAsEvidence/);
  assert.doesNotMatch(card, /quantity|costBasis|averagePrice|portfolioTotal|noteBody/);
  assert.doesNotMatch(card, /매수|매도|buy|sell|target price|position size/i);
});

test("visible research routes embed the shared context card without automatic Agent work", async () => {
  const home = await source("app/AgentHome.tsx");
  const memory = await source("app/MarketMemoryRoute.tsx");
  const collection = await source("app/SmartCollectionWorkspace.tsx");
  const deep = await source("app/DeepResearchRoute.tsx");

  assert.match(home, /<InvestmentContextCard[\s\S]*?mode="home"/);
  assert.match(home, /dismissible/);
  assert.match(memory, /<InvestmentContextCard[\s\S]*?mode="market-memory"/);
  assert.match(collection, /<InvestmentContextCard[\s\S]*?mode="collection"[\s\S]*?collectionId=\{workspace\.collection\.id\}/);
  assert.match(deep, /<InvestmentContextCard[\s\S]*?mode="deep-research"/);
  assert.match(deep, /onReference=\{referenceInvestmentContext\}/);
  assert.doesNotMatch(cardLoadSections(`${home}\n${memory}\n${collection}\n${deep}`), /\/api\/agent\/|openReactAgentDock|autoSubmit/);
});

test("Agent risk explanation is click-only, job-backed, and recommendation-safe", async () => {
  const api = await source("api.ts");
  const card = await source("app/InvestmentContextCard.tsx");

  assert.match(api, /export type InvestmentContextExplanationJob/);
  assert.match(card, /\/api\/agent\/investment-context\/explain/);
  assert.match(card, /pollAgentJobBounded/);
  assert.match(card, /Agent로 위험 설명/);
  assert.match(card, /tickers:\s*\[context\.ticker\]/);
  assert.match(card, /result\?\.reply/);
  assert.match(card, /function ExplanationReply/);
  assert.match(card, /line\.startsWith\("### "\)/);
  assert.doesNotMatch(card, /dangerouslySetInnerHTML/);
  assert.doesNotMatch(card, /useEffect\(\(\) => \{[\s\S]{0,500}investment-context\/explain/);
  assert.doesNotMatch(card, /매수|매도|buy|sell|target price|position size/i);
});

test("Deep Research references personal context only after a user click", async () => {
  const deep = await source("app/DeepResearchRoute.tsx");
  const handler = deep.match(/const referenceInvestmentContext = useCallback\(([\s\S]*?)\n  \}, \[\]\);/)?.[1] || "";
  assert.ok(handler, "explicit Investment Context reference handler must exist");
  assert.match(handler, /setUserContext/);
  assert.match(handler, /개인 맥락\(hypothesis\)/);
  assert.doesNotMatch(deep, /useEffect\(\(\) => \{[\s\S]{0,500}setUserContext\(/);
});

test("navigation exposes Watchlist while responsive context card styling stays bounded", async () => {
  const routes = await source("app/routes.ts");
  const css = await readFile(new URL("../../public/styles.css", import.meta.url), "utf8");

  assert.match(routes, /id: "watchlist", label: "워치리스트", group: "home"/);
  assert.doesNotMatch(routes, /id: "watchlist"[^\n]+visibleInNav: false/);
  assert.doesNotMatch(routes, /id: "portfolio"/);
  assert.match(css, /\.investment-context-card\s*\{[\s\S]*?min-width:\s*0/);
  assert.match(css, /\.investment-context-ledger\s*\{[\s\S]*?grid-template-columns/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.investment-context-ledger[\s\S]*?grid-template-columns:\s*1fr/);
  assert.match(css, /\.investment-context-card[\s\S]*?overflow-wrap:\s*anywhere/);
});

function cardLoadSections(sourceText) {
  return [...sourceText.matchAll(/<InvestmentContextCard[\s\S]*?\/>/g)].map((match) => match[0]).join("\n");
}
