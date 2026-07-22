import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

const appFile = (name) => new URL(`../src/app/${name}`, import.meta.url);

test("Home and Deep Research reuse the metadata-only Work Log", async () => {
  const [home, deep, component] = await Promise.all([
    readFile(appFile("AgentHome.tsx"), "utf8"),
    readFile(appFile("DeepResearchRoute.tsx"), "utf8"),
    readFile(appFile("AgentWorkLog.tsx"), "utf8"),
  ]);

  assert.match(home, /<AgentWorkLog surface="home"/);
  assert.match(deep, /<AgentWorkLog surface="deep-research"/);
  assert.doesNotMatch(home, /getJson<AgentJob\[]>\("\/api\/jobs"\)/);
  assert.match(component, /\/api\/agent\/work-log/);
  assert.match(component, /data-qa="work-log"/);
  assert.match(component, /data-qa="work-log-filter"/);
  assert.match(component, /data-qa="work-log-item"/);
});

test("Work Log source exposes safe controls and never renders broad job body fields", async () => {
  const source = await readFile(appFile("AgentWorkLog.tsx"), "utf8");

  for (const selector of [
    "work-log-loading", "work-log-empty", "work-log-error", "work-log-retention",
    "work-log-page-prev", "work-log-page-next", "work-log-clear-preview",
    "work-log-clear-confirm", "work-log-migration-preview", "work-log-migration-confirm",
    "work-log-proposal-open", "proposal-approval-surface",
  ]) assert.match(source, new RegExp(`data-qa=["']${selector}["']`));

  assert.match(source, /getJson<AgentProposalRecord>/);
  assert.doesNotMatch(source, /entry\.(?:title|reportId|artifactId|message|error|reply|markdown|revisedMarkdown|diff|path|traceback)\b/);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML/);
});

test("API types pin exact WorkLogEntry and runtime validation", async () => {
  const api = await readFile(new URL("../src/api.ts", import.meta.url), "utf8");
  assert.match(api, /export type WorkLogEntry =/);
  assert.match(api, /export function parseWorkLogList/);
  assert.match(api, /WORK_LOG_ENTRY_KEYS/);
  assert.doesNotMatch(api, /type WorkLogEntry[^]*?\[key: string\]/);
});

