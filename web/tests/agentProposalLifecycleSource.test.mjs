import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("Agent polling is shared, bounded, abortable, and recoverable without server cancellation", async () => {
  const [polling, dock, home] = await Promise.all([
    read("../src/app/agentPolling.ts"),
    read("../src/app/ReactAgentDock.tsx"),
    read("../src/app/AgentHome.tsx"),
  ]);
  assert.match(polling, /AGENT_POLL_TIMEOUT_MS\s*=\s*120_000/);
  assert.match(polling, /AGENT_POLL_INTERVAL_MS\s*=\s*1_000/);
  assert.match(polling, /signal\?:\s*AbortSignal/);
  assert.match(polling, /AgentPollTimeout/);
  assert.doesNotMatch(polling, /["']DELETE["']|\/cancel\b/i);
  assert.match(dock, /data-qa="agent-job-still-running"/);
  assert.match(dock, /data-qa="agent-job-resume"/);
  assert.match(home, /data-qa="agent-job-still-running"/);
  assert.match(home, /data-qa="agent-job-resume"/);
});

test("proposal terminal results notify Work Log and exactly one owning reader reload path", async () => {
  const [lifecycle, dock, home, workLog, briefing, company, deep] = await Promise.all([
    read("../src/app/agentProposalLifecycle.ts"),
    read("../src/app/ReactAgentDock.tsx"),
    read("../src/app/AgentHome.tsx"),
    read("../src/app/AgentWorkLog.tsx"),
    read("../src/app/BriefingRoute.tsx"),
    read("../src/app/CompanyAnalysisRoute.tsx"),
    read("../src/app/DeepResearchRoute.tsx"),
  ]);
  assert.match(lifecycle, /folio:proposal-lifecycle/);
  assert.match(lifecycle, /status\s*!==\s*"applied"/);
  assert.match(dock, /notifyProposalLifecycle/);
  assert.match(home, /notifyProposalLifecycle/);
  assert.match(workLog, /PROPOSAL_LIFECYCLE_EVENT/);
  for (const route of [briefing, company, deep]) {
    assert.match(route, /PROPOSAL_LIFECYCLE_EVENT/);
    assert.match(route, /proposalTargetsContext/);
  }
});

test("route Agent context is scoped replace-reset instead of global merge", async () => {
  const [context, shell, reportReader] = await Promise.all([
    read("../src/app/agentContext.ts"),
    read("../src/app/AppShell.tsx"),
    read("../src/app/reportReader/ReportReaderShell.tsx"),
  ]);
  assert.match(context, /setReactAgentContextScope/);
  assert.match(context, /resetReactAgentContextScope/);
  assert.match(context, /activateReactAgentContextScope/);
  assert.match(context, /delete next\.selectedText/);
  assert.match(context, /delete next\.visibleSection/);
  assert.match(shell, /activateReactAgentContextScope/);
  assert.match(reportReader, /setReactAgentContextScope/);
  assert.doesNotMatch(context, /const next = \{ \.\.\.current, \.\.\.patch \}/);
});

test("proposal content is bounded to the active approval surface and excluded from WorkLogEntry", async () => {
  const [lifecycle, dock, home, api] = await Promise.all([
    read("../src/app/agentProposalLifecycle.ts"),
    read("../src/app/ReactAgentDock.tsx"),
    read("../src/app/AgentHome.tsx"),
    read("../src/api.ts"),
  ]);
  assert.match(lifecycle, /MAX_PROPOSAL_DIFF_CHARS/);
  assert.match(lifecycle, /ACTION_KEYS/);
  assert.match(dock, /boundedProposalDiff/);
  assert.match(home, /boundedProposalDiff/);
  const entry = api.match(/export type WorkLogEntry = \{([\s\S]*?)\n\};/)?.[1] || "";
  assert.ok(entry);
  assert.doesNotMatch(entry, /summary|diff|markdown|selectedText|visibleSection/i);
});

test("Dock and Home use one proposalId hydration helper for initial and resumed completion", async () => {
  const [lifecycle, dock, home] = await Promise.all([
    read("../src/app/agentProposalLifecycle.ts"),
    read("../src/app/ReactAgentDock.tsx"),
    read("../src/app/AgentHome.tsx"),
  ]);
  assert.match(lifecycle, /hydrateAgentProposalFromResult/);
  assert.match(lifecycle, /\/api\/agent\/proposals\/\$\{encodeURIComponent\(proposalId\)\}/);
  assert.equal((dock.match(/await hydrateAgentProposalFromResult\(result\)/g) || []).length, 2);
  assert.equal((home.match(/await hydrateAgentProposalFromResult\(result\)/g) || []).length, 2);
  assert.doesNotMatch(`${dock}\n${home}`, /result\.proposal\b/);
});
