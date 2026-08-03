import { describe, expect, it } from "vitest";
import { baselineText, changeReasonText, type ChangeEvent } from "./ChangeHistory";

/** 실제 briefing adapter가 만드는 change unit 모양 그대로 검증한다. */
describe("changeReasonText", () => {
  it("시장 동인은 어느 시장에서 기사 몇 건으로 잡혔는지까지 보여준다", () => {
    const event: ChangeEvent = {
      artifactKind: "briefing",
      changedItems: [
        { kind: "market_driver", subject: "금리", change: "added", currentValue: { score: 14, docCount: 2, markets: ["US"] } },
        { kind: "market_driver", subject: "환율", change: "added", currentValue: { score: 9, docCount: 1, markets: ["KR"] } },
      ],
    };
    expect(changeReasonText(event)).toBe("시장 동인 새로 등장 · US · 기사 2건 · 외 1건");
  });

  it("이슈 보도는 시장과 영향 방향을 함께 보여준다", () => {
    const event: ChangeEvent = {
      changedItems: [{ kind: "issue_coverage", subject: "반도체 수출 규제", change: "changed", currentValue: { market: "US", impact: "negative" } }],
    };
    expect(changeReasonText(event)).toBe("이슈 보도 내용 변화 · US · negative");
  });

  it("지표는 이전 값에서 현재 값으로의 이동을 보여준다", () => {
    const event: ChangeEvent = {
      changedItems: [{ kind: "market_metric", subject: "^GSPC", change: "changed", previousValue: 6388.6412, currentValue: 6401.2 }],
    };
    expect(changeReasonText(event)).toBe("지표 내용 변화 · 6,388.64 → 6,401.2");
  });

  it("항목이 없으면 빈 문자열이라 설명 줄 자체가 렌더링되지 않는다", () => {
    expect(changeReasonText({ status: "baseline_created" })).toBe("");
  });

  it("알 수 없는 종류여도 변화 방향은 남긴다", () => {
    expect(changeReasonText({ changedItems: [{ subject: "무언가", change: "removed" }] })).toBe("사라짐");
  });
});

describe("baselineText", () => {
  it("비교 대상이 있으면 어떤 산출물과 비교했는지 밝힌다", () => {
    expect(baselineText({ baselineRef: { id: "2026-08-01.us" } })).toBe("2026-08-01.us 대비");
  });

  it("기준선이 없으면 빈 문자열이다", () => {
    expect(baselineText({})).toBe("");
  });
});
