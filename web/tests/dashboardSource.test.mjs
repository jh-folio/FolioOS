import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

test("Dashboard route source owns monitoring APIs and market state component", async () => {
  const source = await readFile(new URL("../src/app/Dashboard.tsx", import.meta.url), "utf8");
  const legacySource = await readFile(new URL("../src/app/dashboard/LegacyMarketWidgetBoard.tsx", import.meta.url), "utf8");

  assert.match(source, /data-react-dashboard/);
  assert.match(source, /\/api\/dashboard/);
  assert.match(source, /\/api\/investment-review/);
  assert.match(source, /\/api\/investment-review\/generate/);
  assert.match(source, /lazy\(\(\) => import\("\.\/dashboard\/LegacyMarketWidgetBoard"\)\)/);
  assert.match(legacySource, /\/api\/market-widgets\/settings/);
  assert.match(legacySource, /FolioTradingViewWidgets/);
  assert.match(legacySource, /folio:market-widgets-updated/);
  assert.match(legacySource, /id="editGlobalMarketsBtn"/);
  assert.match(legacySource, /id="addMarketChartBtn"/);
  assert.match(legacySource, /id="resetMarketWidgetsBtn"/);
  assert.match(legacySource, /id="marketWidgetBoard"/);
  assert.match(legacySource, /saveWidgetSettings/);
  assert.match(legacySource, /editWidget/);
  assert.match(legacySource, /deleteWidget/);
  assert.match(legacySource, /market-widget-context-menu is-open/);
  assert.match(legacySource, /data-market-widget-action="delete"/);
  assert.match(legacySource, /addWidget/);
  assert.match(legacySource, /resetWidgets/);
  assert.match(source, /MarketStateDashboard/);
  assert.match(source, /recentReports/);
  assert.match(source, /keyCheckpoints/);
  assert.match(legacySource, /data-current-market/);
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
