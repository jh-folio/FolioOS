import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

test("React Shell mounts the React command palette", async () => {
  const source = await readFile(new URL("../src/app/AppShell.tsx", import.meta.url), "utf8");

  assert.match(source, /import \{ CommandPalette \}/);
  assert.match(source, /<CommandPalette\s*\/>/);
});

test("React command palette handles Ctrl K and routes through React hashes", async () => {
  const source = await readFile(new URL("../src/app/CommandPalette.tsx", import.meta.url), "utf8");

  assert.match(source, /data-react-command-palette/);
  assert.match(source, /ctrlKey/);
  assert.match(source, /metaKey/);
  assert.match(source, /key\.toLowerCase\(\) === "k"/);
  assert.match(source, /NAV_ROUTES\.map/);
  assert.match(source, /toHash\(route\.id\)/);
  assert.match(source, /\/api\/dashboard/);
  assert.match(source, /#\/briefing\/\$\{date\}\/\$\{scope\}/);
  assert.match(source, /openReactAgentDock/);
  assert.match(source, /surface: "command_palette"/);
});

test("Phase 6 bridge leaves Ctrl K ownership to React Shell", async () => {
  const source = await readFile(new URL("../../public/app.js", import.meta.url), "utf8");

  assert.match(source, /window\.FolioBridge/);
  assert.match(source, /openAgentDock\(context = \{\}\)/);
  assert.match(source, /folio:react-agent-request/);
  assert.doesNotMatch(source, /key\.toLowerCase\(\) === "k"/);
});
