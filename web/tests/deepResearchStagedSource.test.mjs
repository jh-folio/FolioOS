import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import assert from "node:assert/strict";

const testsDirectory = dirname(fileURLToPath(import.meta.url));
const root = process.env.FOLIO_SOURCE_ROOT || resolve(testsDirectory, "../src");
const execFileAsync = promisify(execFile);

async function readSource(relativePath) {
  if (root.startsWith("git:")) {
    const ref = root.slice("git:".length) || "HEAD";
    const { stdout } = await execFileAsync("git.exe", ["show", `${ref}:web/src/${relativePath}`], { cwd: join(process.cwd(), "..") });
    return stdout;
  }
  return readFile(join(root, relativePath), "utf8");
}

test("Deep Research source defines the question-first staged contract", async () => {
  const source = await readSource("app/DeepResearchRoute.tsx");

  for (const phase of ["readiness", "draft", "plan-loading", "plan-review", "generation", "report", "recoverable-error"]) {
    assert.match(source, new RegExp(`\\"${phase}\\"`));
  }
  for (const selector of ["dr-question", "dr-context", "dr-preview", "dr-plan", "dr-continue", "dr-report"]) {
    assert.match(source, new RegExp(`data-qa=\\"${selector}\\"`));
  }
  assert.match(source, /\/api\/topic-reports\/plan/);
  assert.match(source, /\/api\/topic-reports\/confirm-degraded/);
  assert.match(source, /approvedRequest: planEnvelope\.approvedRequest/);
  assert.match(source, /approval: approvalReference\(envelope\)/);
  assert.match(source, /fallbackPolicy: FALLBACK_POLICY/);
  assert.doesNotMatch(source, /postJson<[^>]+>\("\/api\/topic-reports", \{\s*topicKey/);
});

test("Deep Research API source exposes typed approval and preview contracts", async () => {
  const source = await readSource("api.ts");

  for (const typeName of ["PlanRequest", "PlanPreviewEnvelope", "ApprovedRequest", "ConfirmDegradedRequest", "GenerateApprovedRequest", "ExecutionRequest"]) {
    assert.match(source, new RegExp(`export type ${typeName}`));
  }
  assert.match(source, /class ApiRequestError/);
  assert.match(source, /signal\?: AbortSignal/);
  assert.match(source, /rules_on_engine_failure/);
});
