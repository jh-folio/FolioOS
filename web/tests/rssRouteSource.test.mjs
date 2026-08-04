import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

// 필터가 3개(기간·소스)에서 6개로 늘었다. 시장·국가·언어가 합쳐지면서
// 목록 옆에서 즉시 적용되던 시장 드롭다운도 이 폼으로 들어왔다.
const SELECT_FILTERS = ["start", "end", "source", "market", "country", "language"];

test("RSS filter inputs read the event before the state updater runs", async () => {
  const source = await readFile(new URL("../src/app/RssRoute.tsx", import.meta.url), "utf8");
  // 상태 업데이터는 렌더 시점에 실행되고 그때 React는 currentTarget을 비운다.
  // 업데이터 안에서 event를 읽으면 null.value로 터져 화면 전체가 언마운트된다.
  assert.doesNotMatch(source, /setDraftFilters\(\([^)]*\) => \([^)]*event\.currentTarget/);

  const captured = source.match(/const value = event\.currentTarget\.value;/g) || [];
  assert.equal(
    captured.length,
    SELECT_FILTERS.length,
    `${SELECT_FILTERS.length}개 필터 모두 값을 먼저 읽어야 합니다`,
  );
  for (const field of SELECT_FILTERS) {
    assert.ok(source.includes(`${field}: value`), `${field} 필터가 캡처한 값을 써야 합니다`);
  }
});

test("RSS filters live in one panel rather than three surfaces", async () => {
  const source = await readFile(new URL("../src/app/RssRoute.tsx", import.meta.url), "utf8");
  // 기간·소스 폼, 별도 검색 폼, 목록 옆 즉시적용 시장 드롭다운으로 나뉘어 있었다.
  const panels = source.match(/className="react-rss-control-panel/g) || [];
  assert.equal(panels.length, 1, "필터·검색이 한 패널에 있어야 합니다");
  assert.ok(!source.includes("react-rss-market-controls"), "목록 옆 시장 드롭다운은 제거됐어야 합니다");
  assert.ok(!source.includes("react-rss-search-panel"), "별도 검색 패널은 제거됐어야 합니다");
});

test("market options cover the 0.5 markets", async () => {
  const source = await readFile(new URL("../src/app/RssRoute.tsx", import.meta.url), "utf8");
  for (const value of ["US", "KR", "EUROPE", "JP", "GLOBAL"]) {
    assert.ok(source.includes(`value: "${value}"`), `${value} 시장 옵션이 있어야 합니다`);
  }
});
