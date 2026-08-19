/** 저장 목록의 생성일이 UTC 날짜였다.
 *
 *  보고서 id는 KST 날짜로 묶이는데 카드가 UTC 날짜를 적으면, KST 00~09시에 만든
 *  보고서가 화면에서만 전날 것으로 보인다.
 */
import { describe, expect, it } from "vitest";

import { listDate } from "./savedListFormat";

describe("listDate", () => {
  it("생성 시각은 KST 날짜로 읽는다", () => {
    // UTC 2026-08-14T23:00 = KST 2026-08-15 08:00.
    expect(listDate("2026-08-14T23:00:00+00:00")).toBe("2026.08.15");
    expect(listDate("2026-08-15T02:00:00+00:00")).toBe("2026.08.15");
  });

  it("날짜만 있는 값은 그대로 둔다", () => {
    // 브리핑 발행일은 이미 KST 날짜다. 시각이 없으므로 변환할 것이 없다.
    expect(listDate("2026-08-04")).toBe("2026.08.04");
    expect(listDate("2026.08.04")).toBe("2026.08.04");
  });

  it("빈 값과 읽을 수 없는 값은 화면을 깨지 않는다", () => {
    expect(listDate("")).toBe("");
    expect(listDate(undefined)).toBe("");
  });
});
