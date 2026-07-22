import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";

test("Briefing and Company canonical Markdown bridge remains byte-for-byte pinned", async () => {
  const source = await readFile(new URL("../../public/app.js", import.meta.url), "utf8");
  const sandbox = { console, URL, Intl, Date, setTimeout, clearTimeout, addEventListener() {}, removeEventListener() {}, dispatchEvent() {}, localStorage: { getItem: () => null, setItem() {}, removeItem() {} } };
  sandbox.window = sandbox;
  sandbox.document = { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], body: { classList: { add() {}, remove() {}, toggle() {} } } };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  const markdown = "# Canonical Title\n\n## Decision\n\nPlain **bold** with [safe link](https://example.com/a_(b)).\n\n- first\n  - nested\n\n| Metric | Value |\n|---|---:|\n| Revenue | 42 |\n\n### Unsafe canary\n\n<script id=\"todo13-canary\">globalThis.pwned=true</script>\n\n[bad](javascript:alert(1))\n\n<img src=x onerror=\"globalThis.pwned=true\">";
  const split = sandbox.FolioBridge.splitReportTitle(markdown, "fallback");
  const html = sandbox.FolioBridge.renderMarkdown(split.body);
  const expected = "<h3>Decision</h3><p>Plain <strong>bold</strong> with <a href=\"https://example.com/a_(b\" target=\"_blank\" rel=\"noreferrer\">safe link</a>).</p><ul><li class=\"depth-0\">first</li><li class=\"depth-1\">nested</li></ul><div class=\"table-wrap\"><table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody><tr><td>Revenue</td><td>42</td></tr></tbody></table></div><h4>Unsafe canary</h4><p>&lt;script id=&quot;todo13-canary&quot;&gt;globalThis.pwned=true&lt;/script&gt;</p><p>[bad](javascript:alert(1))</p><p>&lt;img src=x onerror=&quot;globalThis.pwned=true&quot;&gt;</p>";
  assert.equal(html, expected);
  assert.equal(createHash("sha256").update(html).digest("hex"), "c9d35841ed0e03f370d95420c4d2ecd1e61e1d11ead824c43eae0069ba201bb2");
  const briefing = await readFile(new URL("../src/app/BriefingRoute.tsx", import.meta.url), "utf8");
  const company = await readFile(new URL("../src/app/reportReader/CompanyAnalysisBody.tsx", import.meta.url), "utf8");
  assert.match(briefing, /<ReportBody/);
  assert.match(company, /<ReportBody/);
});
