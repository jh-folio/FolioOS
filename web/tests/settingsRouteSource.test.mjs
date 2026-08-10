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
  // 하위 탭은 포트폴리오와 같은 `.segment` 프리미티브다. 예전 `.sub-tabs`는 테두리 알약을
  // 화면 CSS에서 따로 선언하고 선택을 `aria-current`로 칠해, 같은 자리의 두 화면이 달라 보였다.
  assert.match(source, /className="segment settings-tabs"/);
  assert.match(source, /aria-pressed=\{tab === item\.id\}/);
  assert.doesNotMatch(source, /sub-tabs/);
  assert.match(source, /settings-panel input-panel/);
  assert.match(source, /settings-grid/);
  assert.match(source, /settings-switch/);
  assert.match(source, /settings-agent-header/);
  assert.match(source, /settings-agent-mode-row/);
  assert.match(source, /settings-switch-compact/);
  assert.match(source, /fieldset className="settings-agent-controls"/);
  assert.match(source, /disabled=\{!agentEnabled\}/);
  assert.match(source, /<\/fieldset>\s*<div className="filter-actions settings-actions">/);
  assert.match(source, /className="segment"/);
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

test("each settings panel reports its own outcome next to its own button", async () => {
  const source = await readFile(new URL("../src/app/SettingsRoute.tsx", import.meta.url), "utf8");

  // 결과를 화면 맨 위 한 곳에 모으면, 문서상 1,991px에 있는 자동화 저장을 눌러도
  // 메시지가 54px에 떠 두 화면 반 위에 있다 — 보이지 않는 확인이다.
  assert.match(source, /function PanelNote/);
  for (const panel of ["agent", "api", "notion", "obsidian", "automation", "cache"]) {
    assert.match(source, new RegExp(`<PanelNote note=\{note\} panel="${panel}" />`), panel);
  }
  // 페이지 전체를 못 불러온 것만 위에 남는다.
  assert.doesNotMatch(source, /\{status && <p/);
  assert.doesNotMatch(source, /setStatus\(/);
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

test("React navigation exposes Portfolio and keeps standalone notes hidden", async () => {
  const source = await readFile(new URL("../src/app/routes.ts", import.meta.url), "utf8");

  assert.match(source, /label: "포트폴리오"/);
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

test("the agent dock never forces itself wider than its column", async () => {
  const css = await readFile(new URL("../../public/styles.css", import.meta.url), "utf8");

  // 도크는 384px 고정 열이다. 안쪽 컨트롤이 `min-width: auto`로 남으면 폼이 열보다
  // 넓어지고 그만큼 화면 밖으로 잘린다 — CLI 선택을 더했을 때 실제로 77px이 넘쳤다.
  const toolbar = css.slice(css.indexOf(".react-agent-form-toolbar {"));
  assert.match(toolbar.slice(0, 220), /min-width:\s*0/);
  assert.match(toolbar.slice(0, 220), /flex-wrap:\s*wrap/);
  const select = css.slice(css.indexOf(".react-agent-tools select {"));
  assert.match(select.slice(0, 260), /min-width:\s*0/);
});
