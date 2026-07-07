import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

test("Watchlist route owns list, overview, resolve, save, and detail APIs", async () => {
  const source = await readFile(new URL("../src/app/WatchlistRoute.tsx", import.meta.url), "utf8");

  assert.match(source, /data-watchlist-route/);
  assert.match(source, /\/api\/watchlist"/);
  assert.match(source, /\/api\/watchlist\/overview/);
  assert.match(source, /\/api\/watchlist\/resolve\?keyword=/);
  assert.match(source, /\/api\/watchlist\/detail\?item=/);
});

test("Watchlist route preserves legacy visual class contracts", async () => {
  const source = await readFile(new URL("../src/app/WatchlistRoute.tsx", import.meta.url), "utf8");

  assert.match(source, /RouteHero/);
  assert.match(source, /watchlist-editor input-panel/);
  assert.match(source, /watchlist-grid/);
  assert.match(source, /watchlist-card/);
  assert.match(source, /watchlist-card-delete/);
  assert.match(source, /watchlist-detail-inline/);
  assert.match(source, /watchlist-detail-dialog/);
  assert.match(source, /compact-item/);
});

test("Watchlist route integrates legacy TradingView detail renderer and Agent context", async () => {
  const source = await readFile(new URL("../src/app/WatchlistRoute.tsx", import.meta.url), "utf8");

  assert.match(source, /FolioTradingViewWidgets\?\.renderWatchlistDetail/);
  assert.match(source, /FolioTradingViewWidgets\?\.cleanup/);
  assert.match(source, /surface: "watchlist_detail"/);
  assert.match(source, /openReactAgentDock/);
  assert.match(source, /updateReactAgentContext/);
});

test("AppShell renders WatchlistRoute on the watchlist route", async () => {
  const source = await readFile(new URL("../src/app/AppShell.tsx", import.meta.url), "utf8");

  assert.match(source, /<WatchlistRoute\s*\/>/);
  assert.match(source, /route\.id === "watchlist"/);
  assert.match(source, /renderRoutePane/);
});

test("watchlist route no longer falls back to the legacy watchlist view", async () => {
  const source = await readFile(new URL("../src/app/routes.ts", import.meta.url), "utf8");

  assert.doesNotMatch(source, /id: "watchlist", label: "워치리스트", group: "portfolio", legacyViewId: "watchlist"/);
});
