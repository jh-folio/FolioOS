import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

const settings = await readFile(new URL("../src/app/SettingsRoute.tsx", import.meta.url), "utf8");

test("automation exposes the briefing type the schema already stores", async () => {
  // 스키마·서비스는 briefingType을 읽고 있었는데 화면에 선택이 없어서 늘 default로
  // 고정됐다. 셋 중 하나라도 빠지면 자동 브리핑 유형을 고를 수 없다.
  for (const value of ["default", "market_focused", "concise"]) {
    assert.ok(
      settings.includes(`${value}:`),
      `자동화 유형 목록에 ${value}가 없습니다`,
    );
  }
  assert.match(settings, /automation\.briefing\?\.briefingType/, "선택값이 자동화 설정에서 읽히지 않습니다");
});

test("the automation save payload carries briefingType", () => {
  // payload에서 빠지면 저장할 때마다 스키마가 default로 되돌린다 — 화면만 고쳐도 소용없다.
  const block = settings.slice(settings.indexOf("    briefing: {"));
  assert.match(
    block.slice(0, 400),
    /briefingType: form\.briefing\?\.briefingType/,
    "저장 payload에 briefingType이 없습니다",
  );
});

test("automation and manual generation label the types identically", async () => {
  const briefing = await readFile(new URL("../src/app/BriefingRoute.tsx", import.meta.url), "utf8");
  for (const [value, label] of [["default", "기본"], ["market_focused", "시황 중심"], ["concise", "요약"]]) {
    assert.ok(briefing.includes(`${value}: "${label}"`), `수동 화면 라벨이 바뀌었습니다: ${value}`);
    assert.ok(settings.includes(`${value}: "${label}"`), `자동화 라벨이 수동 화면과 다릅니다: ${value}`);
  }
});
