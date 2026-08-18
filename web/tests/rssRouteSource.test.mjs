import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

// 국가 필터는 없앴다 — 태그된 피드에서 언어와 정확히 1:1이었고, 국제 통신사(Reuters·FT)
// 에서는 정의 자체가 안 됐다. 남은 축은 시장·언어·소스 셋이다.
const SELECT_FILTERS = ["start", "end", "source", "market", "language"];

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

test("건너뛴 수집은 '신규 0개'가 아니라 건너뛴 이유를 말한다", async () => {
  const source = await readFile(new URL("../src/app/RssRoute.tsx", import.meta.url), "utf8");

  // 자료 위치를 옮긴 뒤 재시작 전까지 수집은 쉰다. 그 사실을 말하지 않으면 화면이
  // "RSS 수집 완료. 신규 0개"로 그려 자동 수집이 도는 줄 알고 며칠을 보낸다.
  const body = source.slice(source.indexOf("async function importRss"), source.indexOf("const currentPage"));
  assert.match(body, /done\.result\?\.skipped === "workspace_moved"/);
  assert.match(body, /setStatus\(WORKSPACE_MOVED_NOTICE\)/);
  // 안내는 건너뛴 분기가 완료 문구보다 먼저 와야 한다.
  assert.ok(body.indexOf("workspace_moved") < body.indexOf("RSS 수집 완료."));
  assert.match(source, /WORKSPACE_MOVED_NOTICE =[\s\S]{0,200}재시작/);
});

test("검색 결과에는 페이지네이션과 쪽수를 붙이지 않는다", async () => {
  const source = await readFile(new URL("../src/app/RssRoute.tsx", import.meta.url), "utf8");

  // 검색은 한 번에 다 받은 목록을 payload에 통째로 덮어써 total이 결과 수가 된다.
  // 그 값으로 페이지를 계산하면 없는 페이지 버튼이 뜨고, 누르면 검색 결과가 아니라
  // 일반 피드(loadItems)로 되돌아간다.
  assert.match(source, /const \[searchMode, setSearchMode\] = useState\(false\)/);
  assert.match(source, /\{!searchMode && totalPages > 1 && \(/);
  // 쪽수 표기도 검색 모드에서는 빠진다.
  assert.match(source, /searchMode \? `\$\{total\}개` :/);
  // 일반 피드 로드는 검색 모드를 해제한다 — 필터를 바꾸면 다시 페이지가 있다.
  const loadBody = source.slice(source.indexOf("const loadItems"), source.indexOf("const refreshIndexedCount"));
  assert.match(loadBody, /setSearchMode\(false\)/);
  const searchBody = source.slice(source.indexOf("async function searchNews"), source.indexOf("async function importRss"));
  assert.match(searchBody, /setSearchMode\(true\)/);
});
