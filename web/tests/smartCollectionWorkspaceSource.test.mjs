import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

async function source(path) {
  return readFile(new URL(`../src/${path}`, import.meta.url), "utf8");
}

test("Collection list/editor are extracted and detail stays nested in Deep Research", async () => {
  const route = await source("app/DeepResearchRoute.tsx");
  const workspace = await source("app/SmartCollectionWorkspace.tsx");
  const editor = await source("app/SmartCollectionEditor.tsx");
  const shell = await source("app/AppShell.tsx");
  const routes = await source("app/routes.ts");

  assert.match(route, /import \{ SmartCollectionsPanel, SmartCollectionWorkspace \} from "\.\/SmartCollectionWorkspace"/);
  assert.match(route, /<SmartCollectionWorkspace/);
  assert.match(workspace, /export function SmartCollectionsPanel/);
  assert.match(workspace, /export function SmartCollectionWorkspace/);
  assert.match(editor, /export function SmartCollectionEditor/);
  assert.doesNotMatch(route, /function SmartCollectionsPanel/);
  assert.doesNotMatch(shell, /SmartCollectionWorkspace/);
  assert.doesNotMatch(routes, /id: "smart-collections"/);
});

test("workspace uses server projections and ID/revision-only refresh and handoff", async () => {
  const workspace = await source("app/SmartCollectionWorkspace.tsx");
  const api = await source("api.ts");

  for (const name of [
    "SmartCollectionWorkspaceEnvelope",
    "SmartCollectionChangesEnvelope",
    "SmartCollectionRefreshEnvelope",
    "RefreshSmartCollectionRequest",
  ]) assert.match(api, new RegExp(`export type ${name}`));

  assert.match(workspace, /\/workspace/);
  assert.match(workspace, /\/refresh/);
  assert.match(workspace, /\/changes/);
  assert.match(workspace, /const body: RefreshSmartCollectionRequest = \{ expectedRevision: workspace\.collection\.revision \}/);
  assert.match(workspace, /onStartResearch\(\{ id: workspace\.collection\.id, revision: workspace\.collection\.revision \}\)/);
  assert.doesNotMatch(workspace, /\/api\/agent\//);
  assert.doesNotMatch(workspace, /userContext|portfolio|watchlist|noteBody|agentResponse/);
});

test("Agent change summary is an explicit conversational action, never a load or refresh side effect", async () => {
  const workspace = await source("app/SmartCollectionWorkspace.tsx");

  assert.match(workspace, /import \{ openReactAgentDock \} from "\.\/agentContext"/);
  assert.match(workspace, /const askWhatChanged = \(\) =>/);
  assert.match(workspace, /data-qa="collection-workspace-ask-change"/);
  assert.match(workspace, /onClick=\{askWhatChanged\}/);
  assert.match(workspace, /collectionId: workspace\.collection\.id/);
  assert.match(workspace, /collectionRevision: workspace\.collection\.revision/);
  assert.match(workspace, /autoSubmit: true/);
  assert.doesNotMatch(workspace, /useEffect\(\(\) => \{\s*(?:void )?openReactAgentDock/);
  assert.doesNotMatch(workspace, /const refresh = async \(\) => \{\s*(?:void )?openReactAgentDock/);
});

test("detail exposes honest health, evidence, corrective, and navigation states", async () => {
  const workspace = await source("app/SmartCollectionWorkspace.tsx");
  for (const selector of [
    "collection-workspace",
    "collection-workspace-back",
    "collection-workspace-health",
    "collection-workspace-refresh",
    "collection-workspace-ask-change",
    "collection-workspace-start",
    "collection-workspace-evidence",
    "collection-workspace-empty",
    "collection-workspace-stale",
    "collection-workspace-noisy",
    "collection-workspace-source-unavailable",
    "collection-workspace-deleted",
  ]) assert.match(workspace, new RegExp(`data-qa="${selector}"`));
  assert.match(workspace, /저장된 검색 규칙이며 외부 근거 자체가 아닙니다/);
  assert.match(workspace, /requestError\.status === 409/);
  assert.match(workspace, /await loadWorkspace\(\{ preserveMessage: true \}\)/);
  assert.match(workspace, /collection_not_found/);
  assert.match(workspace, /collection_source_unavailable/);
});

test("workspace CSS is bounded on desktop and stacks without horizontal overflow", async () => {
  const css = await readFile(new URL("../../public/styles.css", import.meta.url), "utf8");
  assert.match(css, /\.topicrpt-collection-workspace\s*\{[\s\S]*?min-width:\s*0/);
  assert.match(css, /\.topicrpt-collection-health-rail\s*\{[\s\S]*?grid-template-columns/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.topicrpt-collection-health-rail[\s\S]*?grid-template-columns:\s*1fr/);
  assert.match(css, /\.topicrpt-collection-workspace[\s\S]*?overflow-wrap:\s*anywhere/);
});
