import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const bootstrapUrl = new URL("../../public/theme-bootstrap.js", import.meta.url);
const indexUrl = new URL("../../public/index.html", import.meta.url);
const preferenceUrl = new URL("../src/app/themePreference.ts", import.meta.url);
const settingsUrl = new URL("../src/app/SettingsRoute.tsx", import.meta.url);
const shellUrl = new URL("../src/app/AppShell.tsx", import.meta.url);
const cssUrl = new URL("../../public/styles.css", import.meta.url);
const briefingVisualsUrl = new URL("../../public/briefing-visuals.js", import.meta.url);
const analysisChartsUrl = new URL("../src/app/reportReader/AnalysisCharts.tsx", import.meta.url);

test("theme bootstraps before CSS with existing-user light and new-user system defaults", async () => {
  const [bootstrap, html] = await Promise.all([
    readFile(bootstrapUrl, "utf8"),
    readFile(indexUrl, "utf8"),
  ]);
  assert.match(bootstrap, /folio\.themePreference\.v1/);
  assert.match(bootstrap, /hasExistingFolioState\(\) \? "light" : "system"/);
  assert.match(bootstrap, /prefers-color-scheme: dark/);
  assert.match(bootstrap, /dataset\.theme = resolved/);
  assert.ok(html.indexOf("/theme-bootstrap.js") < html.indexOf("/styles.css"));
});

test("React theme preference and Settings expose light, dark, and system", async () => {
  const [preference, settings] = await Promise.all([
    readFile(preferenceUrl, "utf8"),
    readFile(settingsUrl, "utf8"),
  ]);
  assert.match(preference, /"light" \| "dark" \| "system"/);
  assert.match(preference, /folio:theme-changed/);
  assert.match(settings, /data-display-settings/);
  assert.match(settings, /aria-pressed=\{theme\.preference === value\}/);
  assert.match(settings, /\["system", "시스템"\]/);
});

test("dark token palette exists and deferred Pixel Office hashes return home", async () => {
  const [css, shell] = await Promise.all([
    readFile(cssUrl, "utf8"),
    readFile(shellUrl, "utf8"),
  ]);
  assert.match(css, /:root\[data-theme="dark"\]/);
  assert.match(css, /color-scheme: dark/);
  assert.match(css, /--color-warning-bg:/);
  assert.match(shell, /\^#\\\/\?office/);
  assert.match(shell, /replaceState[\s\S]*#\/home/);
});

test("native report charts respond to the resolved document theme", async () => {
  const [css, briefingVisuals, analysisCharts] = await Promise.all([
    readFile(cssUrl, "utf8"),
    readFile(briefingVisualsUrl, "utf8"),
    readFile(analysisChartsUrl, "utf8"),
  ]);
  assert.match(css, /--folio-chart-1:/);
  assert.match(briefingVisuals, /folio:theme-changed/);
  assert.match(briefingVisuals, /applyChartTheme/);
  assert.match(analysisCharts, /var\(--folio-chart-1\)/);
  assert.match(analysisCharts, /var\(--folio-border\)/);
});
