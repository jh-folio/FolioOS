import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const SRC = new URL("../src/app/savedListFormat.ts", import.meta.url);
const ROUTES = ["BriefingRoute", "CompanyAnalysisRoute", "DeepResearchRoute"];

function routeSource(name) {
  return readFile(new URL(`../src/app/${name}.tsx`, import.meta.url), "utf8");
}

test("the three saved lists share one date format", async () => {
  const source = await readFile(SRC, "utf8");
  // 같은 개념의 날짜를 화면마다 2026.08.04 / 2026. 6. 15. / 2026-06-13으로 적고 있었다.
  assert.match(source, /export function listDate/);
  assert.match(source, /export function groupMeta/);
});

test("each saved list route uses the shared format", async () => {
  for (const name of ROUTES) {
    const source = await routeSource(name);
    assert.match(source, /from "\.\/savedListFormat"/, `${name}가 공용 서식을 쓰지 않는다`);
    assert.match(source, /groupMeta\(/, `${name}의 그룹 머리가 다르다`);
  }
});

test("the badge names the model instead of saying LLM", async () => {
  for (const name of ROUTES) {
    const source = await routeSource(name);
    assert.ok(source.includes(".engine"), `${name}에 엔진 표시가 없다`);
  }
});

test("the engine badge does not rely on a tooltip", async () => {
  // 카드가 overflow: hidden이라 카드 밖으로 나가는 툴팁은 잘린다.
  for (const name of ROUTES) {
    const source = await routeSource(name);
    assert.ok(
      !/report-feed-badge" data-tooltip|briefing-archive-chip" data-tooltip/.test(source),
      `${name}의 엔진 배지가 툴팁에 기대고 있다`,
    );
  }
});

test("the deep research group name is not a raw key", async () => {
  const source = await routeSource("DeepResearchRoute");
  // exchange_rate가 그대로 그룹명으로 나왔다. 저장된 주제 이름이 사람이 읽는 단서다.
  assert.ok(source.includes("topicLabel"), "저장된 주제 이름을 쓰지 않는다");
});
