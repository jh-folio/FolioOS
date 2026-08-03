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

test("submit does not restore the composer after the turn is persisted", async () => {
  const source = await readFile(new URL("../src/app/agentWorkspace/ConsultationPanel.tsx", import.meta.url), "utf8");
  // 저장 성공 후 실패(폴링 지연 등)에 작성칸을 되돌리면 사용자가 다시 보내고,
  // 새 operationId 때문에 멱등성이 깨져 같은 질문이 두 번 저장된다.
  assert.match(source, /let posted = false/);
  assert.match(source, /posted = true/);
  assert.match(source, /if \(!posted\) setInput\(message\)/);
  assert.doesNotMatch(source, /catch \(reason\) \{\s*setInput\(message\)/);
  // 상담 턴은 2분을 넘길 수 있어 bounded 폴링은 정상 응답을 실패로 만든다.
  assert.doesNotMatch(source, /pollAgentJobBounded/);
  assert.match(source, /pollAgentJobUntilTerminal/);
});

test("holdings rows are keyed by position, not by the ticker being typed", async () => {
  const source = await readFile(new URL("../src/app/portfolio/HoldingsTable.tsx", import.meta.url), "utf8");
  // key에 편집 중인 값이 들어가면 글자마다 행이 재생성되어 포커스가 빠진다.
  assert.doesNotMatch(source, /key=\{`\$\{row\.ticker\}/);
  assert.match(source, /<tr key=\{index\}>/);
});

test("merging an imported position never invents a cost basis", async () => {
  const source = await readFile(new URL("../src/app/portfolio/ImportPositionsDialog.tsx", import.meta.url), "utf8");
  // 평균단가 미입력은 "0원"이 아니라 "모름"이라 0으로 가중평균하면 안 된다.
  assert.match(source, /hasOldPrice/);
  assert.doesNotMatch(source, /const oldPrice = Number\(next\[index\]\.averagePrice\) \|\| 0/);
});
