import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const ROUTES = {
  BriefingRoute: "briefing",
  CompanyAnalysisRoute: "companyAnalysis",
  DeepResearchRoute: "topicReport",
  RssRoute: "rss",
  MarketMemoryRoute: "marketMemory",
};

test("every content screen follows the change signal", async () => {
  // 자기가 실행한 작업만 보면 자동화가 만든 브리핑이나 다른 탭이 수집한 RSS가
  // 사용자가 직접 새로고침하기 전까지 화면에 없다.
  for (const [name, kind] of Object.entries(ROUTES)) {
    const source = await readFile(new URL(`../src/app/${name}.tsx`, import.meta.url), "utf8");
    assert.ok(source.includes(`useContentRevision("${kind}")`), `${name}이 변화 신호를 구독하지 않는다`);
    assert.ok(source.includes("contentRevision"), `${name}이 신호를 쓰지 않는다`);
  }
});

test("the signal is not polled while the tab is hidden", async () => {
  const source = await readFile(new URL("../src/app/useContentRevision.ts", import.meta.url), "utf8");
  assert.ok(source.includes("document.hidden"), "배경 탭이 5초마다 서버를 두드린다");
  assert.ok(source.includes("visibilitychange"), "탭으로 돌아왔을 때 따라잡지 않는다");
});

test("the first response is a baseline, not a refresh", async () => {
  const source = await readFile(new URL("../src/app/useContentRevision.ts", import.meta.url), "utf8");
  // 화면을 여는 순간 목록을 두 번 읽으면 낭비다.
  assert.ok(source.includes("seen.current === null"), "첫 응답을 기준점으로 삼지 않는다");
});
