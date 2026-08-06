import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

// 상담 패널은 도크가 흡수했다(Task 7.6). 패널이 지키던 계약은 도크로 옮겨왔다.
const DOCK = new URL("../src/app/ReactAgentDock.tsx", import.meta.url);

test("the dock states the hypothesis boundary of a conversation", async () => {
  const source = await readFile(DOCK, "utf8");

  // 대화가 근거로 승격되지 않는다는 것을 화면이 말해야 한다(3계층 위계).
  assert.match(source, /보고서·Market Memory·근거 평가에 사용되지 않습니다/);
});

test("submit does not restore the composer after the turn is persisted", async () => {
  const source = await readFile(DOCK, "utf8");
  // 저장 성공 후 실패(폴링 지연 등)에 작성칸을 되돌리면 사용자가 다시 보내고,
  // 새 operationId 때문에 멱등성이 깨져 같은 질문이 두 번 저장된다.
  assert.doesNotMatch(source, /catch \([^)]*\) \{\s*setInput\(text\)/);
});

test("a conversation is created before the turn is sent", async () => {
  const source = await readFile(DOCK, "utf8");
  // 서버가 user turn을 먼저 저장해야 재시작 후에도 질문이 남고 재시도할 수 있다.
  assert.match(source, /threads\.threadId \|\| \(await threads\.createThread/);
  assert.match(source, /operationId: messageId\(\)/);
});
