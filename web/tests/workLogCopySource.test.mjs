import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

const appFile = (name) => new URL(`../src/app/${name}`, import.meta.url);

test("Work Log renders readable Korean copy instead of raw code values", async () => {
  const [component, copy] = await Promise.all([
    readFile(appFile("AgentWorkLog.tsx"), "utf8"),
    readFile(appFile("workLogCopy.ts"), "utf8"),
  ]);

  assert.match(component, /import \{ workLogItemCopy, workLogLatestSummary \} from "\.\/workLogCopy"/);
  assert.match(component, /data-qa="work-log-outcome"/);
  assert.match(component, /data-tone=\{copy\.tone\}/);
  // 코드 값을 그대로 밀어 넣던 경로는 남지 않아야 한다.
  assert.doesNotMatch(component, /codeLabel\(/);
  assert.doesNotMatch(component, /entry\.generationMode\)/);

  assert.match(copy, /export function workLogItemCopy/);
  assert.match(copy, /export function workLogLatestSummary/);
  for (const taskType of ["companion", "briefing", "company_analysis", "topic_report", "personal_overlay", "thesis_delta", "market_memory_llm", "market_state_snapshot", "market_memory_update", "quality_repair", "investment_review", "index", "rss", "setup"]) {
    assert.match(copy, new RegExp(`\\b${taskType}: "`));
  }
});

test("Work Log copy keeps the metadata-only boundary", async () => {
  const copy = await readFile(appFile("workLogCopy.ts"), "utf8");

  // 사전은 안전한 코드 값만 번역한다. 본문/개인 자료 필드를 읽으면 안 된다.
  assert.doesNotMatch(copy, /entry\.(?:title|reportId|artifactId|message|error|reply|markdown|revisedMarkdown|diff|path|traceback)\b/);
  assert.match(copy, /import type \{ WorkLogEntry \}/);
});

test("dark theme redefines every translucent surface token the light theme sets", async () => {
  const css = await readFile(new URL("../../public/styles.css", import.meta.url), "utf8");
  const dark = css.slice(css.indexOf(':root[data-theme="dark"]'), css.indexOf("* { box-sizing"));

  for (const token of ["--folio-tint-weak", "--folio-tint-strong", "--folio-surface-translucent", "--folio-surface-float", "--folio-surface-veil", "--folio-toggle-track"]) {
    assert.match(dark, new RegExp(`${token}:`), `${token} must be redefined for dark mode`);
  }

  // 화면 전역에 밝은 판을 고정하던 리터럴이 다시 들어오면 다크 모드가 깨진다.
  const body = css.slice(css.indexOf("* { box-sizing"));
  for (const literal of ["rgba(245, 247, 250, 0.9", "rgba(248, 250, 252, 0.9", "rgba(255, 255, 255, 0.96)", "rgba(255, 255, 255, 0.74)", "rgba(255, 255, 255, 0.56)", "#eef6f3", "#d7dde6"]) {
    assert.ok(!body.includes(literal), `hardcoded light surface ${literal} must use a theme token`);
  }
});

test("every CSS variable used by a declaration is defined somewhere", async () => {
  const css = await readFile(new URL("../../public/styles.css", import.meta.url), "utf8");
  const defined = new Set(Array.from(css.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm), (m) => m[1]));
  const used = new Set(Array.from(css.matchAll(/var\(\s*(--[a-z0-9-]+)/g), (m) => m[1]));
  // 정의가 없으면 라이트 리터럴 fallback이 다크에도 고정되거나(대비 파괴)
  // fallback이 없는 선언은 통째로 무효가 된다(포커스 링 소실).
  const missing = [...used].filter((token) => !defined.has(token)).sort();
  assert.deepEqual(missing, [], `undefined CSS variables: ${missing.join(", ")}`);
});
