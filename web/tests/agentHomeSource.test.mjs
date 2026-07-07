import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

test("Agent Home source exposes the React-owned chat workspace contract", async () => {
  const source = await readFile(new URL("../src/app/AgentHome.tsx", import.meta.url), "utf8");

  assert.match(source, /data-agent-home/);
  assert.match(source, /\/api\/agent\/chat/);
  assert.match(source, /\/api\/jobs\//);
  assert.match(source, /\/api\/agent\/proposals\//);
  assert.match(source, /\/api\/agent-bridge\/settings/);
  assert.match(source, /\/api\/dashboard/);
  assert.match(source, /\/api\/investment-review/);
  assert.match(source, /\/api\/briefings/);
  assert.match(source, /\/api\/rssarchive\/import/);
  assert.match(source, /modelChoices/);
  assert.match(source, /agent-home-provider/);
  assert.match(source, /agent-home-prompt/);
  assert.match(source, /hasConversation \? "has-conversation" : "is-empty"/);
  assert.match(source, /agent-home-left/);
  assert.match(source, /agent-home-right/);
  assert.match(source, /home-launcher agent-home-launcher/);
  assert.match(source, /review-recent-wrap agent-home-recent/);
  assert.match(source, /attachments/);
  assert.match(source, /effort/);
  assert.match(source, /model/);
  assert.match(source, /AgentMessageContent/);
  assert.match(source, /AgentRunCard/);
  assert.match(source, /세션 시작/);
  assert.match(source, /응답/);
  assert.match(source, /requestSubmit/);
});

test("AppShell renders AgentHome on the home route instead of the placeholder", async () => {
  const source = await readFile(new URL("../src/app/AppShell.tsx", import.meta.url), "utf8");

  assert.match(source, /<AgentHome\s*\/>/);
  assert.doesNotMatch(source, /React SPA 전환을 위한 숨김 앱 셸입니다/);
});
