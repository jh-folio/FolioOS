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
  // 대화는 첫 메시지에서 만들어지지만, 그 저장은 Agent 실행보다 앞서야 한다.
  const create = source.indexOf("threads.createThread(");
  const post = source.indexOf("/messages`");
  assert.ok(create > 0 && post > create, "메시지를 보내기 전에 대화를 만들어야 한다");
  assert.match(source, /operationId: messageId\(\)/);
});

test("migration keeps the browser copy until the server confirms the count", async () => {
  const source = await readFile(new URL("../src/app/agentWorkspace/useDockThreads.ts", import.meta.url), "utf8");
  // 2xx만 믿으면 importMessages를 모르는 서버에 붙었을 때 빈 대화를 만들고 원본을 지운다.
  assert.match(source, /created\.messageCount \|\| 0\) < local\.length/);
  const guard = source.indexOf("< local.length");
  assert.ok(guard < source.indexOf("resetAgentThreadMessages()"), "확인이 원본 삭제보다 앞서야 한다");
});

test("an empty conversation is never saved", async () => {
  const dock = await readFile(DOCK, "utf8");
  // 인사말만 든 대화가 54개 저장된 적이 있다. 첫 메시지에서 만들면 그런 게 안 생긴다.
  assert.match(dock, /빈 대화는 저장하지 않는다/);
  assert.doesNotMatch(dock, /startNewChat[\s\S]{0,220}createThread\(/);
});

test("the greeting is filtered by the same rule the store writes with", async () => {
  const storage = await readFile(new URL("../src/app/agentWorkspace/storage.ts", import.meta.url), "utf8");
  const hook = await readFile(new URL("../src/app/agentWorkspace/useDockThreads.ts", import.meta.url), "utf8");
  // 저장은 id로, 이관은 variant로 걸렀다. 인사말에 variant가 없어 이관 필터가 안 걸렸다.
  assert.match(storage, /export function isGreeting/);
  assert.match(hook, /!isGreeting\(row\)/);
});
