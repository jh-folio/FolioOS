import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

test("React navigation uses semantic SVG icons instead of alphabet badges", async () => {
  const shellSource = await readFile(new URL("../src/app/AppShell.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../../public/styles.css", import.meta.url), "utf8");

  assert.match(shellSource, /ROUTE_ICONS/);
  assert.match(shellSource, /react-left-nav-svg/);
  assert.match(shellSource, /className="react-shell-nav-toggle"/);
  assert.match(shellSource, /viewBox="0 0 16 16"/);
  assert.doesNotMatch(shellSource, /ROUTE_KEYS/);
  assert.match(styles, /\.react-left-nav-svg/);
  // 홈·대시보드 사이 구분선은 뺐다(2026-08-09). 같은 그룹 안에서 둘을 갈라 놓아,
  // 한 묶음으로 읽혀야 할 자리에 선이 하나 더 있었다.
  assert.doesNotMatch(shellSource, /react-left-nav-separator/);
  assert.doesNotMatch(styles, /\.react-left-nav-separator/);
  assert.match(styles, /\.react-shell-nav-toggle svg/);
  assert.match(styles, /\.react-shell\.is-nav-collapsed \.react-shell-nav-toggle svg/);
  assert.match(styles, /width:\s*19px;\s*\n\s*height:\s*19px;\s*\n\s*stroke:\s*currentColor;\s*\n\s*stroke-width:\s*2\.25;/);
  assert.doesNotMatch(styles, /react-shell\.is-nav-collapsed \.react-shell-nav-toggle \{\s*\n\s*right:\s*50%/);
  assert.doesNotMatch(shellSource, />\s*‹\s*</);
});
