import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

test("RSS route owns feed, filters, import, search, and market controls", async () => {
  const source = await readFile(new URL("../src/app/RssRoute.tsx", import.meta.url), "utf8");

  assert.match(source, /data-rss-route/);
  assert.match(source, /\/api\/rss\/items/);
  assert.match(source, /\/api\/search/);
  assert.match(source, /\/api\/rssarchive\/import/);
  assert.doesNotMatch(source, /\/api\/rss\/merge/);
  assert.match(source, /react-rss-hero-actions/);
  assert.match(source, /react-rss-stat-pill/);
  assert.match(source, /피드 필터/);
  assert.match(source, /뉴스 검색/);
  assert.match(source, /RSS 수집\/가져오기/);
  assert.doesNotMatch(source, /병합 다운로드/);
  assert.match(source, /start/);
  assert.match(source, /end/);
  assert.match(source, /source/);
  assert.match(source, /market/);
  assert.match(source, /전체 시장/);
  assert.match(source, /미국/);
  assert.match(source, /한국/);
  assert.match(source, /글로벌/);
  assert.doesNotMatch(source, /UNKNOWN/);
  assert.match(source, /report-feed-view-pill/);
  assert.match(source, /normalizeMarketTags/);
  assert.match(source, /searchNews/);
  assert.match(source, /pageSize/);
});

test("AppShell renders RssRoute on the rss route", async () => {
  const source = await readFile(new URL("../src/app/AppShell.tsx", import.meta.url), "utf8");

  assert.match(source, /<RssRoute\s*\/>/);
  assert.match(source, /route\.id === "rss"/);
  assert.match(source, /renderRoutePane/);
});

test("rss route no longer falls back to the legacy rssfeed view", async () => {
  const source = await readFile(new URL("../src/app/routes.ts", import.meta.url), "utf8");

  assert.doesNotMatch(source, /id: "rss", label: "RSS 피드", group: "research", legacyViewId: "rssfeed"/);
});
