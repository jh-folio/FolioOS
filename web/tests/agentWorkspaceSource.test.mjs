import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const root = new URL("../src/app/agentWorkspace/", import.meta.url);
const homeSource = fs.readFileSync(new URL("../src/app/AgentHome.tsx", import.meta.url), "utf8");
const hookSource = fs.readFileSync(new URL("useAgentWorkspace.ts", root), "utf8");
const storageSource = fs.readFileSync(new URL("storage.ts", root), "utf8");
const composerSource = fs.readFileSync(new URL("AgentComposer.tsx", root), "utf8");
const threadSource = fs.readFileSync(new URL("AgentThread.tsx", root), "utf8");
const jobsSource = fs.readFileSync(new URL("AgentJobsPanel.tsx", root), "utf8");

test("Agent workspace centralizes storage and API orchestration", () => {
  assert.match(storageSource, /folio\.agentHome\.thread\.v1/);
  assert.match(storageSource, /subscribeAgentThread/);
  assert.match(hookSource, /\/api\/agent\/chat/);
  assert.match(hookSource, /\/api\/jobs/);
  assert.match(hookSource, /\/api\/agent\/proposals/);
  assert.match(hookSource, /\/api\/agent-bridge\/settings/);
});

test("Agent Home consumes reusable workspace presentation components", () => {
  assert.match(homeSource, /useAgentWorkspace/);
  assert.match(homeSource, /<AgentComposer/);
  assert.match(homeSource, /<AgentThread/);
  assert.match(homeSource, /<AgentJobsPanel/);
  assert.match(composerSource, /agent-home-prompt/);
  assert.match(threadSource, /agent-home-thread agent-home-right/);
  assert.match(jobsSource, /agent-home-jobs/);
});

