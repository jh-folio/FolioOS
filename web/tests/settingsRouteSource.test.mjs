import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

test("Settings route owns settings, agent bridge, obsidian, and automation APIs", async () => {
  const source = await readFile(new URL("../src/app/SettingsRoute.tsx", import.meta.url), "utf8");

  assert.match(source, /data-settings-route/);
  assert.match(source, /\/api\/settings"/);
  assert.match(source, /\/api\/settings\$\{refreshAgent \? "\?refresh=true" : ""\}/);
  assert.match(source, /\/api\/settings\/llm\/test\/\$\{encodeURIComponent\(providerId\)\}/);
  assert.match(source, /\/api\/agent-bridge\/settings/);
  assert.match(source, /\/api\/obsidian\/settings/);
  assert.match(source, /\/api\/automation\/settings/);
  assert.doesNotMatch(source, /\/api\/automation\/run\/\$\{encodeURIComponent\(kind\)\}/);
  assert.match(source, /\/api\/cache\/stats/);
  assert.match(source, /\/api\/cache\/cleanup/);
});

test("Settings route preserves legacy settings visual class contracts", async () => {
  const source = await readFile(new URL("../src/app/SettingsRoute.tsx", import.meta.url), "utf8");

  assert.match(source, /RouteHero/);
  assert.match(source, /sub-tabs/);
  assert.match(source, /settings-panel input-panel/);
  assert.match(source, /settings-grid/);
  assert.match(source, /settings-switch/);
  assert.match(source, /settings-agent-header/);
  assert.match(source, /settings-agent-mode-row/);
  assert.match(source, /settings-switch-compact/);
  assert.match(source, /fieldset className="settings-agent-controls"/);
  assert.match(source, /disabled=\{!agentEnabled\}/);
  assert.match(source, /<\/fieldset>\s*<div className="filter-actions settings-actions">/);
  assert.match(source, /settings-segmented/);
  assert.match(source, /filter-actions settings-actions/);
  assert.match(source, /automation-routines/);
  assert.match(source, /automation-card/);
  assert.match(source, /automation-inline-switch/);
  assert.match(source, /15분마다/);
  assert.doesNotMatch(source, /RSS 지금 실행/);
  assert.doesNotMatch(source, /시장 메모리 지금 업데이트/);
  assert.doesNotMatch(source, /브리핑 지금 생성/);
  assert.match(source, /RSS Collection/);
  assert.match(source, /Market Memory/);
  assert.match(source, /Daily Briefing/);
  assert.match(source, /cli-provider-list/);
  assert.match(source, /selectedAgentChoices\.length \? selectedAgentChoices\.map/);
  assert.match(source, /providerChoices\.length \? providerChoices\.map/);
  assert.doesNotMatch(source, /datalist id="reactAgentModelChoices"/);
  assert.doesNotMatch(source, /datalist id="reactProviderModelChoices"/);
  assert.doesNotMatch(source, /list="reactAgentModelChoices"/);
  assert.doesNotMatch(source, /list="reactProviderModelChoices"/);
  assert.match(source, /folio:agent-settings-updated/);
  assert.match(source, /캐시 관리/);
  assert.match(source, /cleanupCache/);
  assert.doesNotMatch(source, /Toss Open API/);
  assert.doesNotMatch(source, /tossClientId/);
  assert.doesNotMatch(source, /tossClientSecret/);
});

test("AppShell renders SettingsRoute on the settings route", async () => {
  const source = await readFile(new URL("../src/app/AppShell.tsx", import.meta.url), "utf8");

  assert.match(source, /<SettingsRoute\s*\/>/);
  assert.match(source, /route\.id === "settings"/);
  assert.match(source, /renderRoutePane/);
});

test("settings route no longer falls back to the legacy settings view", async () => {
  const source = await readFile(new URL("../src/app/routes.ts", import.meta.url), "utf8");

  assert.doesNotMatch(source, /id: "settings", label: "설정", group: "system", legacyViewId: "settings"/);
});

test("React navigation hides portfolio and standalone notes routes", async () => {
  const source = await readFile(new URL("../src/app/routes.ts", import.meta.url), "utf8");

  assert.doesNotMatch(source, /label: "포트폴리오"/);
  assert.doesNotMatch(source, /label: "투자 노트"/);
  assert.doesNotMatch(source, /legacyViewId: "portfolio"/);
  assert.doesNotMatch(source, /legacyViewId: "notes"/);
});

test("Phase 6 shell no longer ships standalone portfolio and notes legacy surfaces", async () => {
  const app = await readFile(new URL("../../public/app.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../../public/index.html", import.meta.url), "utf8");

  assert.doesNotMatch(app, /portfolio\.addPosition/);
  assert.doesNotMatch(app, /notes\.add/);
  assert.doesNotMatch(html, /data-view="portfolio"/);
  assert.doesNotMatch(html, /<section id="notes"/);
  assert.match(html, /id="folioReactRoot"/);
});
