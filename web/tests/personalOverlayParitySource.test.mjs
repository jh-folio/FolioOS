import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const payload = fs.readFileSync(new URL("../src/app/deepResearchPayload.ts", import.meta.url), "utf8");
const view = fs.readFileSync(new URL("../src/app/reportReader/PersonalOverlayView.tsx", import.meta.url), "utf8");
const shell = fs.readFileSync(new URL("../src/app/reportReader/ReportReaderShell.tsx", import.meta.url), "utf8");
const note = fs.readFileSync(new URL("../src/app/reportReader/FolioNotePanel.tsx", import.meta.url), "utf8");
const briefing = fs.readFileSync(new URL("../src/app/BriefingRoute.tsx", import.meta.url), "utf8");
const company = fs.readFileSync(new URL("../src/app/CompanyAnalysisRoute.tsx", import.meta.url), "utf8");
const deep = fs.readFileSync(new URL("../src/app/DeepResearchRoute.tsx", import.meta.url), "utf8");

test("one public overlay projection and one reader view serve all report readers", () => {
  assert.match(payload, /export function parsePersonalOverlayPayload/);
  assert.match(payload, /revisionState:\s*"current" \| "stale" \| "legacy_unknown"/);
  for (const source of [briefing, company, deep]) assert.match(source, /parsePersonalOverlayPayload/);
  assert.match(shell, /noteOverlay\?: PersonalOverlayPayload/);
  assert.match(note, /PersonalOverlayView/);
  assert.match(deep, /PersonalOverlayView/);
});

test("shared copy distinguishes missing, stale, legacy, and empty overlays", () => {
  for (const label of [
    "생성된 Personal Overlay가 없습니다.",
    "이 Overlay는 오래된 Canonical 기준입니다.",
    "생성 기준 revision을 확인할 수 없는 레거시 Overlay입니다.",
    "저장된 개인 해석 본문이 없습니다.",
    "반대 근거와 충돌",
    "불확실성과 다음 질문",
  ]) assert.match(view, new RegExp(label));
});

test("routes pass full overlays instead of markdown-only projections", () => {
  for (const source of [briefing, company, deep]) {
    assert.match(source, /noteOverlay=/);
    assert.doesNotMatch(source, /noteOverlayMarkdown=/);
  }
});
