import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

test("React Shell typography follows the legacy type tokens", async () => {
  const styles = await readFile(new URL("../../public/styles.css", import.meta.url), "utf8");

  assert.match(styles, /\.react-left-nav-title[\s\S]*font-size:\s*var\(--fs-base/);
  assert.match(styles, /\.react-left-nav-item[\s\S]*font-size:\s*var\(--fs-base/);
  assert.match(styles, /\.react-route-hero h1[\s\S]*font-size:\s*var\(--fs-xl/);
  assert.match(styles, /\.react-route-hero-description[\s\S]*font-size:\s*var\(--fs-base/);
  assert.match(styles, /\.agent-home \.agent-home-hero[\s\S]*top:\s*-28px/);
});
