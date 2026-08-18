import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const root = new URL("../src/app/agentWorkspace/", import.meta.url);
const homeSource = fs.readFileSync(new URL("../src/app/AgentHome.tsx", import.meta.url), "utf8");
const hookSource = fs.readFileSync(new URL("useAgentWorkspace.ts", root), "utf8");
const storageSource = fs.readFileSync(new URL("storage.ts", root), "utf8");
const composerSource = fs.readFileSync(new URL("AgentComposer.tsx", root), "utf8");
const threadSource = fs.readFileSync(new URL("AgentThread.tsx", root), "utf8");
const workLogSource = fs.readFileSync(new URL("../src/app/AgentWorkLog.tsx", import.meta.url), "utf8");

test("Agent workspace centralizes storage and API orchestration", () => {
  assert.match(storageSource, /folio\.agentHome\.thread\.v1/);
  assert.match(storageSource, /subscribeAgentThread/);
  assert.match(hookSource, /\/api\/agent\/chat/);
  assert.match(hookSource, /\/api\/jobs/);
  assert.match(hookSource, /actOnProposal/);
  assert.match(hookSource, /\/api\/agent-bridge\/settings/);
});

test("Image attachments are gated by the image limit, not the text limit", () => {
  const handleFiles = hookSource.replace(/\r\n/g, "\n").match(/ {2}async function handleFiles\([\s\S]*?\n {2}\}\n/)?.[0];
  assert.ok(handleFiles, "handleFiles not found");

  // 200KB는 프롬프트에 싣는 텍스트 본문용이다. 이미지에 그대로 씌우면 readAttachment의
  // 12MB 경로에 닿지 못해 스크린샷 첨부가 통째로 무효화된다.
  assert.match(handleFiles, /isImageFile\(file\)/);
  assert.match(handleFiles, /MAX_IMAGE_BYTES : ATTACHMENT_MAX_BYTES/);
  assert.doesNotMatch(handleFiles, /file\.size > ATTACHMENT_MAX_BYTES/);
  assert.match(hookSource, /function isImageFile\(/);
});

test("Agent Home consumes reusable workspace presentation components", () => {
  assert.match(homeSource, /useAgentWorkspace/);
  assert.match(homeSource, /<AgentComposer/);
  assert.match(homeSource, /<AgentThread/);
  // 작업 목록은 metadata-only Work Log 하나만 쓴다. 원문 job 필드를 그리는 패널을 두지 않는다.
  assert.match(homeSource, /<AgentWorkLog/);
  assert.doesNotMatch(homeSource, /AgentJobsPanel/);
  assert.doesNotMatch(hookSource, /getJson<AgentJob\[\]>\("\/api\/jobs"\)/);
  assert.match(composerSource, /agent-home-prompt/);
  assert.match(threadSource, /agent-home-thread agent-home-right/);
  assert.match(workLogSource, /data-qa="work-log"/);
});

