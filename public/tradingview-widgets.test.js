const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(ROOT, "public", "tradingview-widgets.js"), "utf8");

test("renderer allows only approved widget types", () => {
  assert.match(source, /const ALLOWED_WIDGET_TYPES = new Set/);
  assert.match(source, /market_overview/);
  assert.match(source, /advanced_chart/);
  assert.match(source, /symbol_overview/);
  assert.match(source, /ticker_tag/);
  assert.match(source, /single_ticker/);
  assert.match(source, /economic_calendar/);
  assert.doesNotMatch(source, /top_stories/);
});

test("renderer builds stable height classes and fallbacks", () => {
  assert.match(source, /tv-widget-size-wide/);
  assert.match(source, /tv-widget-size-medium/);
  assert.match(source, /tv-widget-size-compact/);
  assert.match(source, /tradingview-widget-unavailable/);
});

test("renderer exposes FolioTradingViewWidgets API", () => {
  assert.match(source, /window\.FolioTradingViewWidgets/);
  assert.match(source, /renderDashboardBoard/);
  assert.match(source, /renderWatchlistDetail/);
  assert.match(source, /cleanup/);
});

test("renderer marks dashboard cards as draggable and resizable", () => {
  assert.match(source, /data-tv-widget-drag-handle/);
  assert.match(source, /data-tv-widget-resize/);
  assert.match(source, /tv-widget-resize-handle/);
});

test("renderer stacks watchlist detail widgets in research order", () => {
  assert.match(source, /watch-info/);
  assert.match(source, /watch-chart/);
  assert.match(source, /watch-fundamental/);
  assert.match(source, /watchlist-detail-stack/);
});
