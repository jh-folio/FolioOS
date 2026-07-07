import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/app/reportReader/FolioNotePanel.tsx", import.meta.url), "utf8");

test("Folio note panel drafts notes through chat-style Agent interaction", () => {
  assert.match(source, /buildAgentNotePrompt/);
  assert.match(source, /Market Memory/);
  assert.match(source, /\/api\/agent\/chat/);
  assert.match(source, /pollAgentJob/);
  assert.match(source, /reportKind: identity\.reportKind/);
  assert.match(source, /reportId: identity\.reportId/);
  assert.match(source, /현재 관점/);
  assert.match(source, /반대 근거/);
  assert.match(source, /Agent와 투자 노트 정리하기/);
  assert.match(source, /떠오르는 생각을 자유롭게 정리해보세요/);
  assert.match(source, /rawThoughts/);
  assert.match(source, /interactionLog/);
  assert.match(source, /agent_assisted/);
});

test("Agent replies split into chat message and full note body", () => {
  assert.match(source, /splitAgentReply/);
  assert.match(source, /\[대화\]/);
  assert.match(source, /\[투자 노트\]/);
  // 노트 마커가 없으면 기존 노트 본문을 유지한다.
  assert.match(source, /note \|\| noteBody/);
});

test("chat tab supports quoting sentences for follow-up questions", () => {
  assert.match(source, /captureQuoteSelection/);
  assert.match(source, /quoteDraft/);
  assert.match(source, /report-note-quote-bar/);
  assert.match(source, /생각만 기록/);
});

test("completed note is read-only in the links tab", () => {
  assert.match(source, /report-note-final/);
  assert.match(source, /읽기 전용 완성본/);
  // 완성본 편집용 textarea는 더 이상 없다. 첨삭은 채팅으로만 진행한다.
  assert.doesNotMatch(source, /report-note-editor/);
  assert.doesNotMatch(source, /setNoteBody\(event\.currentTarget\.value\)/);
});

test("folio note typography and reader overflow are guarded in CSS", () => {
  const styles = fs.readFileSync(new URL("../../public/styles.css", import.meta.url), "utf8");
  assert.match(styles, /\.report-note-head \.section-kicker/);
  assert.match(styles, /\.report-note-editor[\s\S]*font-size: var\(--fs-sm\)/);
  assert.match(styles, /\.report-note-chat-text[\s\S]*font-size: var\(--fs-sm\)/);
  assert.match(styles, /\.report-reader-stage > \*[\s\S]*min-width: 0/);
  assert.match(styles, /\.report-reader-inline \.report-reader-dialog[\s\S]*min-width: 0/);
  assert.match(styles, /overflow-wrap: anywhere/);
});
