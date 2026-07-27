import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

async function source(path) {
  return readFile(new URL(`../src/${path}`, import.meta.url), "utf8");
}

test("Smart Collection API exposes strict CRUD and preview transports", async () => {
  const api = await source("api.ts");

  for (const typeName of [
    "SmartCollectionFields",
    "SmartCollection",
    "SmartCollectionListEnvelope",
    "SmartCollectionMutationEnvelope",
    "SmartCollectionPreviewItem",
    "SmartCollectionPreview",
    "UpdateSmartCollectionRequest",
    "DeleteSmartCollectionRequest",
    "PreviewSmartCollectionRequest",
  ]) {
    assert.match(api, new RegExp(`export type ${typeName}`));
  }
  assert.match(api, /export async function putJson<T>/);
  assert.match(api, /export async function deleteJson<T>/);
  assert.match(api, /method: "PUT"/);
  assert.match(api, /method: "DELETE"/);
  assert.match(api, /body: JSON\.stringify\(body\)/);
});

test("Deep Research embeds the complete collection browser contract", async () => {
  const workspace = await source("app/SmartCollectionWorkspace.tsx");
  const editor = await source("app/SmartCollectionEditor.tsx");
  const implementation = `${workspace}\n${editor}`;
  const selectors = [
    "collection-panel",
    "collection-reload",
    "collection-new",
    "collection-list",
    "collection-item",
    "collection-edit",
    "collection-delete",
    "collection-name",
    "collection-query",
    "collection-market",
    "collection-sources",
    "collection-tickers",
    "collection-tags",
    "collection-save",
    "collection-cancel",
    "collection-results",
    "collection-empty",
    "collection-conflict",
    "collection-error",
    "collection-clear-selection",
  ];
  for (const selector of selectors) assert.match(implementation, new RegExp(`data-qa="${selector}"`));

  assert.match(workspace, /\/api\/smart-collections\?limit=100&offset=0/);
  assert.match(workspace, /\/api\/smart-collections\/\$\{encodeURIComponent\(collection\.id\)\}\/preview/);
  assert.match(workspace, /expectedRevision: collection\.revision, limit: 10/);
  assert.match(workspace, /requestError instanceof ApiRequestError && requestError\.status === 409/);
  assert.match(workspace, /requestError\.code === "revision_conflict" \|\| requestError\.code === "duplicate_name"/);
});

test("Collection trust boundary sends identity only to plan and Agent context", async () => {
  const route = await source("app/DeepResearchRoute.tsx");

  assert.match(route, /const \[selectedCollectionRef, setSelectedCollectionRef\] = useState<CollectionRef \| null>\(null\)/);
  assert.match(route, /collectionRef: selectedCollectionRef/);
  assert.match(route, /collectionId: selectedCollectionRef\?\.id \|\| null/);
  assert.match(route, /collectionRevision: selectedCollectionRef\?\.revision \|\| null/);
  const planBody = route.match(/const body: PlanRequest = \{([\s\S]*?)\n    \};/)?.[1] || "";
  assert.ok(planBody, "typed plan body must exist");
  assert.doesNotMatch(planBody, /\.\.\.|definitionSnapshot|preview|providerIds|snippet|sources|tickers|tags/);
  assert.match(planBody, /collectionRef: selectedCollectionRef/);
  const contextEffect = route.match(/useEffect\(\(\) => \{\s*const ownedCollectionIdentity([\s\S]*?)\}, \[selectedCollectionRef\]\);/)?.[1] || "";
  assert.ok(contextEffect, "collection Agent context effect must exist");
  assert.doesNotMatch(contextEffect, /collectionRef/);
  assert.match(contextEffect, /collectionId: selectedCollectionRef\?\.id \|\| null/);
  assert.match(contextEffect, /collectionRevision: selectedCollectionRef\?\.revision \|\| null/);
  assert.match(contextEffect, /patchReactAgentContextScope\("deep-research", ownedCollectionIdentity\)/);
  assert.doesNotMatch(contextEffect, /items|snippet|providerIds|definitionSnapshot|sources|tickers|tags|query/);
  assert.doesNotMatch(route, /userContext:\s*(?:collection|preview)/i);
});

test("Collection requests reject stale responses and surface failures without false success", async () => {
  const route = await source("app/SmartCollectionWorkspace.tsx");

  assert.match(route, /listController\.current\?\.abort\(\)/);
  assert.match(route, /previewController\.current\?\.abort\(\)/);
  assert.match(route, /sequence !== listSequence\.current/);
  assert.match(route, /sequence !== previewSequence\.current/);
  assert.match(route, /const payload = await getJson<SmartCollectionListEnvelope>[\s\S]*?setCollections\(payload\.items\)/);
  assert.match(route, /const payload = await postJson<SmartCollectionPreview>[\s\S]*?setPreview\(payload\)[\s\S]*?onSelectedRef\(\{ id: collection\.id, revision: collection\.revision \}\)/);
  assert.match(route, /!loadingList && !error && !collections\.length/);
  assert.match(route, /!fields\.name[\s\S]*?fields\.sources\.length > 20[\s\S]*?setError\(/);
  assert.match(route, /입력 내용은 유지했습니다/);
  assert.doesNotMatch(route, /catch \(requestError\)[\s\S]{0,800}setDraft\(/);
});

test("Collection inputs capture DOM values before React functional state updates", async () => {
  const editor = await source("app/SmartCollectionEditor.tsx");
  const workspace = await source("app/SmartCollectionWorkspace.tsx");

  assert.doesNotMatch(
    workspace,
    /setDraft\(\(current\) => \(\{[^}]*event\.currentTarget\.value/s,
    "React may clear currentTarget before a deferred functional updater runs",
  );
  for (const [selector, field] of [
    ["collection-name", "name"],
    ["collection-query", "query"],
    ["collection-market", "market"],
    ["collection-sources", "sources"],
    ["collection-tickers", "tickers"],
    ["collection-tags", "tags"],
  ]) {
    const control = editor.split("\n").find((line) => line.includes(`data-qa="${selector}"`)) || "";
    assert.match(control, new RegExp(`onChange\\("${field}",`), `${selector} must pass a synchronously captured value`);
  }
  assert.match(workspace, /function updateDraftField<K extends keyof CollectionDraft>\(field: K, value: CollectionDraft\[K\]\)/);
  assert.match(workspace, /setDraft\(\(current\) => \(\{ \.\.\.current, \[field\]: value \}\)\)/);
});

test("Deep Research clears only the collection identity owned by its effect", async () => {
  const route = await source("app/DeepResearchRoute.tsx");

  const effect = route.match(/useEffect\(\(\) => \{\s*const ownedCollectionIdentity([\s\S]*?)\}, \[selectedCollectionRef\]\);/)?.[1] || "";
  assert.ok(effect, "selection effect must capture its owned identity and provide cleanup");
  assert.match(effect, /patchReactAgentContextScope\("deep-research", ownedCollectionIdentity\)/);
  assert.match(effect, /return \(\) => \{/);
  assert.match(effect, /window\.FolioAgent\?\.currentContext/);
  assert.match(effect, /current\?\.collectionId === ownedCollectionIdentity\.collectionId/);
  assert.match(effect, /current\.collectionRevision === ownedCollectionIdentity\.collectionRevision/);
  assert.match(effect, /patchReactAgentContextScope\("deep-research", \{ collectionId: null, collectionRevision: null \}\)/);
});

test("Smart Collections remain scoped to the exposed Deep Research route", async () => {
  const shell = await source("app/AppShell.tsx");
  const routes = await source("app/routes.ts");

  assert.doesNotMatch(shell, /SmartCollections/);
  assert.match(routes, /id: "deep-research", label: "딥 리서치", group: "research" \}/);
  assert.doesNotMatch(routes, /id: "deep-research"[^\n]+visibleInNav: false/);
  assert.match(routes, /id: "dashboard"[^\n]+visibleInNav: false/);
  assert.match(routes, /id: "watchlist"[^\n]+visibleInNav: false/);
  assert.doesNotMatch(routes, /id: "smart-collections"/);
});
