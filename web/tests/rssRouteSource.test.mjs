import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

test("RSS filter inputs read the event before the state updater runs", async () => {
  const source = await readFile(new URL("../src/app/RssRoute.tsx", import.meta.url), "utf8");
  // 상태 업데이터는 렌더 시점에 실행되고 그때 React는 currentTarget을 비운다.
  // 업데이터 안에서 event를 읽으면 null.value로 터져 화면 전체가 언마운트된다.
  assert.doesNotMatch(source, /setDraftFilters\(\([^)]*\) => \([^)]*event\.currentTarget/);
  // start/end/source 세 필터 모두 핸들러에서 값을 먼저 읽어야 한다.
  const captured = source.match(/const value = event\.currentTarget\.value;/g) || [];
  assert.equal(captured.length, 3, "세 필터 모두 값을 먼저 읽어야 합니다");
  for (const field of ["start", "end", "source"]) {
    assert.ok(source.includes(`${field}: value`), `${field} 필터가 캡처한 값을 써야 합니다`);
  }
});
