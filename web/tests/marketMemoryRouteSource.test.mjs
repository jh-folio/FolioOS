import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

test("Market Memory route owns the memory workflow shell", async () => {
  const source = await readFile(new URL("../src/app/MarketMemoryRoute.tsx", import.meta.url), "utf8");

  assert.match(source, /data-market-memory-route/);
  assert.match(source, /MarketStateDashboard/);
  assert.match(source, /\/api\/memory\/update/);
  assert.doesNotMatch(source, /\/api\/memory\/llm/);
  assert.doesNotMatch(source, /\/api\/memory\/state-snapshot/);
  assert.match(source, /\/api\/jobs\/\$\{encodeURIComponent\(current\.id\)\}/);
  assert.match(source, /시장 메모리 업데이트/);
  assert.doesNotMatch(source, /시장 상태 정리/);
  assert.doesNotMatch(source, /내러티브 누적/);
});

test("Market State dashboard island keeps the state-dashboard API contract", async () => {
  const source = await readFile(new URL("../src/islands/MarketStateDashboard.tsx", import.meta.url), "utf8");

  assert.match(source, /\/api\/memory\/state-dashboard\?limit=5/);
  assert.match(source, /market-state-overview/);
  assert.match(source, /selectedMarket/);
  assert.match(source, /marketViews/);
  assert.match(source, /market-scope-tabs/);
  assert.match(source, /\["overall", "us", "kr"\]/);
  assert.match(source, /종합/);
  assert.match(source, /미국장/);
  assert.match(source, /한국장/);
  assert.match(source, /watchItems/);
  assert.match(source, /stance/);
  assert.match(source, /posture/);
  assert.match(source, /briefs/);
  assert.match(source, /plainConclusion/);
  assert.match(source, /reasonSummary/);
  assert.match(source, /actionGuide/);
  assert.match(source, /directionLabel/);
  assert.match(source, /signalTone/);
  assert.match(source, /signalLabel/);
  assert.match(source, /neutral\|중립/);
  assert.match(source, /mixed\|conflicted\|혼재\|변동성/);
  assert.match(source, /return "warning"/);
  assert.match(source, /긍정 요인/);
  assert.match(source, /부담 가중/);
  assert.match(source, /변동성 증가/);
  assert.match(source, /nextMemoryCheck/);
  assert.match(source, /시장 해석/);
  assert.match(source, /판단 및 투자 행동/);
  assert.match(source, /splitNarrative/);
  assert.match(source, /market-state-asof/);
  assert.match(source, /market-driver-summary/);
  assert.match(source, /market-driver-detail-list/);
  assert.match(source, /CheckList/);
  assert.match(source, /normalizeCheckItem/);
  assert.match(source, /market-state-drivers/);
  assert.match(source, /askAgentPrompt/);
  assert.match(source, /agent-logo-slot/);
  assert.match(source, /applyAgentBranding/);
  assert.doesNotMatch(source, /Agent-authored/);
  assert.doesNotMatch(source, /market-state-snapshot-meta/);
  assert.doesNotMatch(source, /market-driver-chip">추세/);
  assert.doesNotMatch(source, /<span>행동 온도<\/span>/);
  assert.doesNotMatch(source, /왜 중요한가/);
  assert.doesNotMatch(source, /무엇을 볼까/);
  assert.doesNotMatch(source, /근거 \{counts\.d7/);
  assert.doesNotMatch(source, /연결기업 \{driver\.linkedCompanies/);
  assert.doesNotMatch(source, /상태 \{driver\.status/);
  assert.doesNotMatch(source, /다음 체크포인트/);
});

test("Legacy Agent branding follows the selected provider for market memory ask buttons", async () => {
  const source = await readFile(new URL("../../public/app.js", import.meta.url), "utf8");

  assert.match(source, /FolioAgent\.agentProvider/);
  assert.match(source, /folio:agent-settings-updated/);
  assert.match(source, /CODEX_COLOR_LOGO/);
  assert.match(source, /CLAUDE_COLOR_LOGO/);
  assert.match(source, /ANTIGRAVITY_COLOR_LOGO/);
  assert.match(source, /function agentProviderMeta/);
});

test("AppShell renders MarketMemoryRoute on the market-memory route", async () => {
  const source = await readFile(new URL("../src/app/AppShell.tsx", import.meta.url), "utf8");

  assert.match(source, /<MarketMemoryRoute\s*\/>/);
  assert.match(source, /route\.id === "market-memory"/);
  assert.match(source, /renderRoutePane/);
});

test("market-memory route no longer falls back to the legacy memory view", async () => {
  const source = await readFile(new URL("../src/app/routes.ts", import.meta.url), "utf8");

  assert.doesNotMatch(source, /id: "market-memory", label: "시장 내러티브", group: "research", legacyViewId: "memory"/);
});
