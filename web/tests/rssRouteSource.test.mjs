import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

const SELECT_FILTERS = ["start", "end", "source", "market", "country", "language"];

test("RSS filter handlers read the event value before any async work", async () => {
  const source = await readFile(new URL("../src/app/RssRoute.tsx", import.meta.url), "utf8");
  // React는 렌더 시점에 currentTarget을 비운다. 상태 업데이터 안이나 await 뒤에서
  // 읽으면 null.value로 터져 화면 전체가 언마운트된다. 인자를 만들 때 읽어야 한다.
  assert.doesNotMatch(source, /setDraftFilters\(\([^)]*\) => \([^)]*event\.currentTarget/);
  assert.doesNotMatch(source, /await[\s\S]{0,120}?event\.currentTarget/);

  for (const field of SELECT_FILTERS) {
    assert.ok(
      source.includes(`${field}: event.currentTarget.value`) || source.includes(`${field}: value`),
      `${field} 필터가 핸들러 안에서 값을 읽어야 합니다`,
    );
  }
});

test("RSS select filters apply on change without a submit button", async () => {
  const source = await readFile(new URL("../src/app/RssRoute.tsx", import.meta.url), "utf8");
  // 다른 탭은 전부 즉시 적용이다. 여기만 `필터 적용` 제출을 요구하면 같은 일에
  // 다른 조작을 배우게 한다. 전문 검색은 별개 동작이라 버튼을 유지한다.
  assert.ok(!source.includes("필터 적용"), "선택 필터는 즉시 적용되어야 합니다");
  assert.ok(source.includes("본문 검색"), "전문 검색 버튼은 남아 있어야 합니다");
});

test("RSS filters and search live in one find bar", async () => {
  const source = await readFile(new URL("../src/app/RssRoute.tsx", import.meta.url), "utf8");
  // 기간·소스 폼, 별도 검색 폼, 목록 옆 즉시적용 시장 드롭다운으로 나뉘어 있었다.
  const bars = source.match(/className="find-bar find-bar--stacked/g) || [];
  assert.equal(bars.length, 1, "필터·검색이 한 찾기 바에 있어야 합니다");
  assert.ok(!source.includes("react-rss-market-controls"), "목록 옆 시장 드롭다운은 제거됐어야 합니다");
  assert.ok(!source.includes("react-rss-search-panel"), "별도 검색 패널은 제거됐어야 합니다");
});

test("market options cover the 0.5 markets", async () => {
  const source = await readFile(new URL("../src/app/RssRoute.tsx", import.meta.url), "utf8");
  for (const value of ["US", "KR", "EUROPE", "JP", "GLOBAL"]) {
    assert.ok(source.includes(`value: "${value}"`), `${value} 시장 옵션이 있어야 합니다`);
  }
});
