import { describe, expect, it } from "vitest";

import { megabytes, reclaimHint } from "./SettingsRoute";

describe("정리 버튼 설명", () => {
  it("돌려받을 공간이 크면 그 양과 대가를 먼저 말한다", () => {
    // VACUUM은 실측 728MB 기준 12~29초 동안 검색을 멈춘다. 무엇을 얻는지 모르면 누를 수 없다.
    const hint = reclaimHint(320e6);

    expect(hint).toContain("320MB");
    expect(hint).toContain("검색이 잠시 멈춥니다");
  });

  it("돌려받을 것이 적으면 양을 말하지 않는다", () => {
    // 임계값 아래에서 "0.0MB를 돌려받습니다"라고 하면 누를 이유가 있는 것처럼 읽힌다.
    for (const bytes of [undefined, 0, 49e6]) {
      expect(reclaimHint(bytes)).not.toContain("돌려받습니다");
    }
  });

  it("경계값에서 안내가 바뀐다", () => {
    expect(reclaimHint(50e6)).toContain("돌려받습니다");
    expect(reclaimHint(50e6 - 1)).not.toContain("돌려받습니다");
  });

  it("큰 값은 소수점을 떼고, 작은 값은 남긴다", () => {
    expect(megabytes(348_000_000)).toBe("348MB");
    expect(megabytes(17_400_000)).toBe("17.4MB");
    expect(megabytes(-5)).toBe("0.0MB");
  });
});
