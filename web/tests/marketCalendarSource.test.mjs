import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

const calendar = () => readFile(new URL("../src/app/dashboard/MarketCalendar.tsx", import.meta.url), "utf8");

test("격자·오늘·선택일이 일정과 같은 KST 달력을 쓴다", async () => {
  const source = await calendar();

  // 일정 키는 KST(`eventDateKeyKST`)인데 격자·todayKey·selectedDay는 브라우저 로컬
  // 달력이었다. 서울 밖에서는 일정이 옆 칸에 붙고 `오늘`이 엉뚱한 날을 가리킨다.
  assert.match(source, /function kstToday\(\): Date/);
  assert.match(source, /const todayKey = dateKey\(kstToday\(\)\)/);
  assert.match(source, /useState\(\(\) => dateKey\(kstToday\(\)\)\)/);
  assert.match(source, /useState\(\(\) => kstToday\(\)\)/);
  // `오늘` 버튼도 같은 기준이어야 한다.
  assert.match(source, /const now = kstToday\(\); setAnchor\(now\); setSelectedDay\(dateKey\(now\)\);/);
  assert.doesNotMatch(source, /dateKey\(new Date\(\)\)/);
});

test("날짜 이동은 +24h 누적이 아니라 달력 성분으로 한다", async () => {
  const source = await calendar();

  // `getTime() + index * DAY_MS`는 DST 되돌림 주에 같은 날짜를 두 번 만들어
  // 격자 한 칸이 사라지고 React 중복 key 경고가 난다.
  assert.match(source, /function addDays\(value: Date, days: number\): Date/);
  assert.match(source, /new Date\(value\.getFullYear\(\), value\.getMonth\(\), value\.getDate\(\) \+ days\)/);
  assert.doesNotMatch(source, /index \* DAY_MS/);
  assert.doesNotMatch(source, /offset \* DAY_MS/);
  assert.match(source, /cells\.push\(addDays\(first, index\)\)/);
  assert.match(source, /addDays\(weekStart, index\)/);
  assert.match(source, /setAnchor\(\(prev\) => addDays\(prev, step \* 7\)\)/);
});
