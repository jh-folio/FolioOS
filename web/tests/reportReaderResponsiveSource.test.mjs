import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

const cssUrl = new URL("../../public/styles.css", import.meta.url);
const shellUrl = new URL("../src/app/reportReader/ReportReaderShell.tsx", import.meta.url);

function mediaBlock(source, header) {
  const start = source.indexOf(header);
  assert.notEqual(start, -1, `missing media query: ${header}`);
  const open = source.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  assert.fail(`unterminated media query: ${header}`);
}

function mediaBlocks(source, header) {
  const blocks = [];
  let offset = 0;
  while (offset < source.length) {
    const start = source.indexOf(header, offset);
    if (start === -1) break;
    const block = mediaBlock(source.slice(start), header);
    blocks.push(block);
    offset = start + block.length;
  }
  assert.ok(blocks.length > 0, `missing media queries: ${header}`);
  return blocks.join("\n");
}

test("report reader keeps its established desktop and tablet inline note layout", async () => {
  const css = await readFile(cssUrl, "utf8");
  const desktop = mediaBlock(css, "@media (min-width: 761px) {");
  const tablet = mediaBlock(css, "@media (min-width: 761px) and (max-width: 1500px) {");

  assert.match(desktop, /\.report-reader-inline \.report-note-panel\s*\{[\s\S]*?position:\s*sticky;[\s\S]*?width:\s*auto;/);
  assert.match(desktop, /\.report-reader-inline \.report-note-grip\s*\{[\s\S]*?display:\s*none;/);
  assert.match(tablet, /\.report-reader-inline \.report-note-panel\s*\{[\s\S]*?position:\s*static;[\s\S]*?width:\s*100%;/);
});

test("mobile reader starts with report visible and opens the full-screen note only on user action", async () => {
  const [css, shell] = await Promise.all([
    readFile(cssUrl, "utf8"),
    readFile(shellUrl, "utf8"),
  ]);
  const mobile = mediaBlocks(css, "@media (max-width: 760px) {");

  assert.match(shell, /useState\(false\)/, "the note overlay must be closed on initial render");
  assert.match(shell, /aria-expanded=\{mobileNoteOpen\}/);
  assert.match(shell, /aria-label="투자 노트 열기"/);
  assert.match(shell, /onClick=\{\(\) => setMobileNoteOpen\(true\)\}/);
  assert.match(shell, /mobileNoteOpen \? "report-note-panel is-open" : "report-note-panel"/);
  assert.match(shell, /aria-label="투자 노트 닫기"/);
  assert.match(mobile, /\.report-note-grip\s*\{[\s\S]*?position:\s*fixed;[\s\S]*?right:\s*16px;[\s\S]*?bottom:\s*16px;/);
  assert.match(mobile, /\.report-reader-dialog\s*\{[\s\S]*?width:\s*100%;[\s\S]*?max-width:\s*100%;/);
  assert.match(mobile, /\.report-note-panel\s*\{[\s\S]*?height:\s*0;[\s\S]*?overflow:\s*hidden;/);
  assert.match(mobile, /\.report-note-panel\.is-open\s*\{[\s\S]*?position:\s*fixed;[\s\S]*?inset:\s*0;[\s\S]*?width:\s*100%;/);
  assert.ok(
    mobile.indexOf(".report-note-panel {") < mobile.indexOf(".report-note-panel.is-open {"),
    "the explicit open state must follow and override the closed mobile state",
  );
});
