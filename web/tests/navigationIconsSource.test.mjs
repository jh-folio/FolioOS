import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

test("React navigation uses semantic SVG icons instead of alphabet badges", async () => {
  const shellSource = await readFile(new URL("../src/app/AppShell.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../../public/styles.css", import.meta.url), "utf8");

  assert.match(shellSource, /ROUTE_ICONS/);
  assert.match(shellSource, /react-left-nav-svg/);
  assert.match(shellSource, /className="react-shell-nav-toggle"/);
  assert.match(shellSource, /react-left-nav-separator/);
  assert.match(shellSource, /viewBox="0 0 16 16"/);
  assert.doesNotMatch(shellSource, /ROUTE_KEYS/);
  assert.match(styles, /\.react-left-nav-svg/);
  assert.match(styles, /\.react-left-nav-separator/);
  assert.match(styles, /\.react-shell-nav-toggle svg/);
  assert.match(styles, /\.react-shell\.is-nav-collapsed \.react-shell-nav-toggle svg/);
  assert.match(styles, /width:\s*19px;\s*\n\s*height:\s*19px;\s*\n\s*stroke:\s*currentColor;\s*\n\s*stroke-width:\s*2\.25;/);
  assert.doesNotMatch(styles, /react-shell\.is-nav-collapsed \.react-shell-nav-toggle \{\s*\n\s*right:\s*50%/);
  assert.doesNotMatch(shellSource, />\s*‹\s*</);
});
