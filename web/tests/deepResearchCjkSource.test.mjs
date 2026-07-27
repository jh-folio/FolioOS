import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import assert from "node:assert/strict";

const testsDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testsDirectory, "../..");
const execFileAsync = promisify(execFile);

async function readStyles() {
  if (process.env.FOLIO_SOURCE_ROOT?.startsWith("git:")) {
    const ref = process.env.FOLIO_SOURCE_ROOT.slice("git:".length) || "HEAD";
    const { stdout } = await execFileAsync("git.exe", ["show", `${ref}:public/styles.css`], { cwd: projectRoot });
    return stdout;
  }
  return readFile(join(projectRoot, "public/styles.css"), "utf8");
}

test("Deep Research keeps Korean phrases intact and reflows narrow desktop plans", async () => {
  const styles = await readStyles();
  assert.match(
    styles,
    /\.react-deep-research-route[^{]*\{[^}]*word-break:\s*keep-all;[^}]*overflow-wrap:\s*break-word;/s,
    "Deep Research content needs a Korean-first wrapping rule",
  );
  assert.match(
    styles,
    /@media\s*\(min-width:\s*1025px\)[\s\S]*?\.react-shell\.is-agent-open[\s\S]*?\.react-deep-research-route\s+\.topicrpt-plan-grid\s*\{[^}]*grid-template-columns:\s*1fr;/,
    "an open Agent Dock must stack the plan before cards become too narrow",
  );
});

test("Deep Research blocking errors and non-blocking warnings use distinct tokens", async () => {
  const styles = await readStyles();
  assert.match(styles, /\.react-dashboard-error\s*\{[^}]*background:\s*var\(--color-error-bg\)[^}]*color:\s*var\(--color-error-text\)/s);
  assert.match(styles, /\.react-dashboard-warning\s*\{[^}]*background:\s*var\(--color-warning-bg\)[^}]*color:\s*var\(--color-warning-text\)/s);
});
