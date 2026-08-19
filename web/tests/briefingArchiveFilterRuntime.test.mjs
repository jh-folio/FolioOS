import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";

const ROUTE_SOURCE = new URL("../src/app/BriefingRoute.tsx", import.meta.url);

/** 소스에 실제로 실린 함수만 떼어 실행한다. 화면 파일은 React·bridge를 함께 끌고
 *  오므로 import할 수 없고, 규칙을 테스트가 다시 적으면 회귀를 잡지 못한다. */
async function readRouteSource() {
  // 저장소 파일은 CRLF다. 함수 단위로 떼어낼 때 줄바꿈 모양에 걸리지 않게 정규화한다.
  return (await readFile(ROUTE_SOURCE, "utf8")).replace(/\r\n/g, "\n");
}

async function loadArchiveDateFilter() {
  const source = await readRouteSource();
  const displayDate = source.match(/function displayDate\([\s\S]*?\n\}\n/)?.[0];
  const inRange = source.match(/export function archiveDateInRange\([\s\S]*?\n\}\n/)?.[0];
  assert.ok(displayDate, "displayDate() not found");
  assert.ok(inRange, "archiveDateInRange() not found");
  const runnable = stripTypeScriptTypes(`${displayDate}\n${inRange}`, { mode: "transform", sourceMap: false });
  const mod = await import(`data:text/javascript;base64,${Buffer.from(runnable).toString("base64")}`);
  return mod.archiveDateInRange;
}

function readDetailRouteMatcher(source) {
  const literal = source.match(/window\.location\.hash\.match\((\/.+\/)\)/)?.[1];
  assert.ok(literal, "briefing detail route pattern not found");
  return new RegExp(literal.slice(1, -1));
}

test("briefing detail route reads every scope the app can write into the hash", async () => {
  const pattern = readDetailRouteMatcher(await readRouteSource());

  // setBriefingHash()가 쓰는 scope 집합과 같아야 한다. `multi`(예: 미국+일본)가 빠져
  // 있으면 생성은 끝났는데 리더가 열리지 않고 주소만 바뀐 채 목록에 남는다.
  // 서버 계약: features/daily_briefing/schema.py::MARKET_SCOPES.
  for (const scope of ["us", "kr", "europe", "jp", "all", "both", "multi"]) {
    const match = `#/briefing/2026-08-14/${scope}`.match(pattern);
    assert.ok(match, `scope ${scope} must resolve to a detail route`);
    assert.equal(match[1], "2026-08-14");
    assert.equal(match[2], scope);
  }
  assert.ok("#/briefing/2026-08-14".match(pattern), "scope is optional");
  assert.equal("#/briefing/2026-08-14/bogus".match(pattern), null);
  assert.equal("#/briefing".match(pattern), null);
});

test("archive period filter keeps reports whose session date is in range", async () => {
  const archiveDateInRange = await loadArchiveDateFilter();
  // 실제 저장본: 2026-08-10.us.json — 발행일 08-10, 세션일 08-07,
  // 카드 제목은 `US Market Briefing — 2026.08.07 마감`.
  const usCard = { reportDate: "2026-08-10", date: "2026-08-10", sessionDate: "2026-08-07" };

  assert.equal(archiveDateInRange(usCard, "2026-08-07", "2026-08-07"), true);
  assert.equal(archiveDateInRange(usCard, "2026-08-10", "2026-08-10"), true);
  assert.equal(archiveDateInRange(usCard, "2026-08-01", "2026-08-05"), false);
  assert.equal(archiveDateInRange(usCard, "", ""), true);
  assert.equal(archiveDateInRange(usCard, "2026-08-08", ""), true);
  assert.equal(archiveDateInRange(usCard, "", "2026-08-07"), true);
  assert.equal(archiveDateInRange(usCard, "", "2026-08-06"), false);
  // 세션일이 없는 옛 카드는 발행일 하나로 판정한다.
  assert.equal(archiveDateInRange({ date: "2026-08-10" }, "2026-08-10", "2026-08-10"), true);
  assert.equal(archiveDateInRange({ date: "2026-08-10" }, "2026-08-07", "2026-08-07"), false);
});
