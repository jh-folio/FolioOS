import { describe, expect, it } from "vitest";

import { splitAddInput } from "./WatchlistRoute";

describe("워치리스트 입력 가르기", () => {
  it("한 회사로 확정된 이름은 쉼표가 있어도 쪼개지 않는다", () => {
    // 후보에서 고른 이름이 그대로 입력칸에 들어온다. 이걸 쪼개서 `Hitachi`와
    // `Ltd.` 두 항목이 등록됐고, `Ltd.`는 지워지지 않은 채 이후 모든 목록
    // 갱신에서 검색과 회사해석을 계속 차지했다.
    expect(splitAddInput("Hitachi, Ltd.", true)).toEqual(["Hitachi, Ltd."]);
    expect(splitAddInput("Nintendo Co., Ltd.", true)).toEqual(["Nintendo Co., Ltd."]);
  });

  it("확정되지 않았으면 쉼표·세미콜론·줄바꿈으로 여러 개를 받는다", () => {
    expect(splitAddInput("AMD, 반도체 공급망; 전력", false)).toEqual(["AMD", "반도체 공급망", "전력"]);
  });

  it("법인 형태만 남은 조각은 버린다", () => {
    // 확정 전에 직접 타이핑한 경우에도 `Ltd.`가 항목이 되어선 안 된다.
    expect(splitAddInput("Hitachi, Ltd.", false)).toEqual(["Hitachi"]);
    expect(splitAddInput("Sony Group Corporation, Inc", false)).toEqual(["Sony Group Corporation"]);
  });

  it("빈 입력은 아무것도 만들지 않는다", () => {
    expect(splitAddInput("", true)).toEqual([]);
    expect(splitAddInput("   ", false)).toEqual([]);
  });
});
