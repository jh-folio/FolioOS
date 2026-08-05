import { describe, expect, it } from "vitest";
import { splitNarrative, splitSentences } from "./MarketStateDashboard";

describe("splitSentences", () => {
  it("소수점을 문장 끝으로 읽지 않는다", () => {
    // 화면에 "S&P 500이 7736." / "52로 1일 +1. 79%..."로 쪼개져 나온 실제 사례.
    const text = "S&P 500이 7736.52로 1일 +1.79% 올랐고 나스닥이 26584.32로 마감했다. 지수는 버텼다.";
    expect(splitSentences(text)).toEqual([
      "S&P 500이 7736.52로 1일 +1.79% 올랐고 나스닥이 26584.32로 마감했다.",
      "지수는 버텼다.",
    ]);
  });

  it("문장 끝 마침표에서는 가른다", () => {
    expect(splitSentences("첫 문장이다. 둘째 문장이다. 셋째다.")).toHaveLength(3);
  });
});

describe("splitNarrative", () => {
  it("네 번째 문장부터 버리지 않는다", () => {
    const text = "하나다. 둘이다. 셋이다. 넷이다. 다섯이다.";
    const { lead, support } = splitNarrative(text);
    expect(lead).toBe("하나다.");
    expect(`${lead} ${support}`).toBe(text);
  });

  it("소수점이 든 해석을 통째로 보존한다", () => {
    const text = "미 10년물이 4.627%로 내렸다. WTI는 5거래일 -9.79%다. 부담이 함께 줄었다.";
    const { lead, support } = splitNarrative(text);
    expect(`${lead} ${support}`).toBe(text);
  });
});
