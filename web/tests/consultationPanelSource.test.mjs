import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

test("persistent consultation panel keeps an isolated, keyboard-safe modal boundary", async () => {
  const source = await readFile(new URL("../src/app/agentWorkspace/ConsultationPanel.tsx", import.meta.url), "utf8");

  assert.match(source, /aria-modal="true"/);
  assert.match(source, /event\.key === "Escape"/);
  assert.match(source, /event\.key !== "Tab"/);
  assert.match(source, /previousFocusRef\.current\?\.focus/);
  assert.match(source, /보고서·Market Memory·근거 평가에 사용되지 않습니다/);
  assert.match(source, /ISOLATED HYPOTHESIS CHAT/);
  assert.doesNotMatch(source, /agent\/proposals/);
});
