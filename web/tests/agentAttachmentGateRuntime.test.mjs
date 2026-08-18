import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";

const HOOK_SOURCE = new URL("../src/app/agentWorkspace/useAgentWorkspace.ts", import.meta.url);

/** 첨부 게이트만 떼어 실제로 실행한다. 훅 전체는 React·API를 끌고 오므로 import할 수
 *  없고, 게이트 순서를 테스트가 다시 적으면 정작 순서가 바뀌어도 통과한다. */
async function loadAttachmentGate() {
  // 저장소 파일은 CRLF다. 함수 단위로 떼어낼 때 줄바꿈 모양에 걸리지 않게 정규화한다.
  const source = (await readFile(HOOK_SOURCE, "utf8")).replace(/\r\n/g, "\n");
  const parts = [
    source.match(/const ATTACHMENT_LIMIT[\s\S]*?const MAX_IMAGE_BYTES = [^\n]+\n/)?.[0],
    source.match(/async function encodeBytes\([\s\S]*?\n\}\n/)?.[0],
    source.match(/function isImageFile\([\s\S]*?\n\}\n/)?.[0],
    source.match(/async function readAttachment\([\s\S]*?\n\}\n/)?.[0],
    source.match(/ {2}async function handleFiles\([\s\S]*?\n {2}\}\n/)?.[0],
  ];
  parts.forEach((part, index) => assert.ok(part, `attachment gate part ${index} not found`));
  const harness = `
let attachments = [];
const errors = [];
// handleFiles는 시작할 때 setError("")로 이전 오류를 지운다. 그 초기화는 오류가 아니다.
const setError = (message) => { if (message) errors.push(message); };
const setAttachments = (value) => { attachments = value; };
export const state = { get attachments() { return attachments; }, errors };
export { handleFiles };
`;
  // data: 모듈은 본문이 같으면 캐시된다. 테스트마다 빈 첨부 목록에서 시작해야 하므로
  // 한 줄을 달리 붙여 매번 새 인스턴스를 받는다.
  const salt = `\nexport const instanceId = "${Math.random().toString(36).slice(2)}";\n`;
  const runnable = stripTypeScriptTypes(`${parts.join("\n")}\n${harness}${salt}`, { mode: "transform", sourceMap: false });
  return import(`data:text/javascript;base64,${Buffer.from(runnable).toString("base64")}`);
}

function fakeFile(name, type, bytes) {
  return new File([new Uint8Array(bytes)], name, { type });
}

test("a portfolio screenshot passes the attachment gate on the 12MB image limit", async () => {
  const gate = await loadAttachmentGate();
  // 300KB PNG. 텍스트용 200KB 게이트가 이미지에도 걸려 있어서 문서화된 이미지 첨부
  // 기능이 실제 용례(300KB~2MB 스크린샷)에서 전면 무효화돼 있었다.
  await gate.handleFiles([fakeFile("portfolio.png", "image/png", 300_000)]);

  assert.deepEqual(gate.state.errors, []);
  assert.equal(gate.state.attachments.length, 1);
  assert.equal(gate.state.attachments[0].name, "portfolio.png");
  assert.ok(gate.state.attachments[0].imageData.length > 0, "image bytes must reach the server");
});

test("attachment gate still rejects oversized images and oversized text", async () => {
  const gate = await loadAttachmentGate();
  // 12MB 초과 이미지는 서버 상한(attachment_files.MAX_IMAGE_BYTES)과 같은 자리에서 거른다.
  await gate.handleFiles([fakeFile("huge.png", "image/png", 13 * 1024 * 1024)]);
  assert.equal(gate.state.attachments.length, 0);
  assert.match(gate.state.errors.at(-1), /12MB/);

  // 텍스트 본문은 프롬프트에 실리므로 200KB 상한을 그대로 유지한다.
  await gate.handleFiles([fakeFile("notes.txt", "text/plain", 300_000)]);
  assert.equal(gate.state.attachments.length, 0);
  assert.match(gate.state.errors.at(-1), /200KB/);
});
