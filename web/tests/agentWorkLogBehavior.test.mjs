import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

test("Work Log implements preview-confirm, stale-safe requests, and pagination ordering", async () => {
  const source = await readFile(new URL("../src/app/AgentWorkLog.tsx", import.meta.url), "utf8");
  assert.match(source, /AbortController/);
  assert.match(source, /requestSequence/);
  assert.match(source, /clear-preview/);
  assert.match(source, /deleteJson<WorkLogClearResponse>/);
  assert.match(source, /migration-preview/);
  assert.match(source, /migration-confirm/);
  assert.match(source, /setOffset\(0\)/);
  assert.match(source, /Math\.max\(0, offset - pageSize\)/);
  assert.match(source, /offset \+ pageSize/);
});

test("proposal bodies are loaded only after an explicit proposal GET", async () => {
  const source = await readFile(new URL("../src/app/AgentWorkLog.tsx", import.meta.url), "utf8");
  const getIndex = source.indexOf("getJson<AgentProposalRecord>");
  const clickIndex = source.indexOf("openProposal");
  assert.ok(clickIndex >= 0 && getIndex > clickIndex);
  assert.doesNotMatch(source, /entry\.(?:summary|diff|markdown|revisedMarkdown|message|path|title)\b/);
});
