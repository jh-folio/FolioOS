import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

test("Dashboard route source owns monitoring APIs and market state component", async () => {
  const source = await readFile(new URL("../src/app/Dashboard.tsx", import.meta.url), "utf8");

  assert.match(source, /data-react-dashboard/);
  assert.match(source, /\/api\/dashboard/);
  assert.match(source, /\/api\/investment-review/);
  assert.match(source, /\/api\/investment-review\/generate/);
  assert.match(source, /\/api\/market-widgets\/settings/);
  assert.match(source, /FolioTradingViewWidgets/);
  assert.match(source, /folio:market-widgets-updated/);
  assert.match(source, /id="editGlobalMarketsBtn"/);
  assert.match(source, /id="addMarketChartBtn"/);
  assert.match(source, /id="resetMarketWidgetsBtn"/);
  assert.match(source, /id="marketWidgetBoard"/);
  assert.match(source, /saveWidgetSettings/);
  assert.match(source, /editWidget/);
  assert.match(source, /deleteWidget/);
  assert.match(source, /market-widget-context-menu is-open/);
  assert.match(source, /data-market-widget-action="delete"/);
  assert.match(source, /addWidget/);
  assert.match(source, /resetWidgets/);
  assert.match(source, /MarketStateDashboard/);
  assert.match(source, /recentReports/);
  assert.match(source, /keyCheckpoints/);
  assert.match(source, /data-current-market/);
  assert.doesNotMatch(source, /home-launcher/);
  assert.doesNotMatch(source, /오늘의 투자 리뷰/);
});

test("AppShell renders Dashboard on the dashboard route", async () => {
  const source = await readFile(new URL("../src/app/AppShell.tsx", import.meta.url), "utf8");

  assert.match(source, /<Dashboard\s*\/>/);
  assert.match(source, /route\.id === "dashboard"/);
  assert.match(source, /renderRoutePane/);
});

test("AppShell suppresses the global agent dock on the home route", async () => {
  const source = await readFile(new URL("../src/app/AppShell.tsx", import.meta.url), "utf8");

  assert.match(source, /const agentVisible = active\.id !== "home"/);
  assert.match(source, /is-agent-suppressed/);
  assert.match(source, /\{agentVisible && \(/);
});

test("dashboard route no longer falls back to the legacy review view", async () => {
  const source = await readFile(new URL("../src/app/routes.ts", import.meta.url), "utf8");

  assert.doesNotMatch(source, /id: "dashboard", label: "대시보드", group: "home", legacyViewId: "review"/);
});
