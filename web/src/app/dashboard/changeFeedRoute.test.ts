import { describe, expect, it } from "vitest";
import { changeEventRoute } from "./ChangeFeed";

describe("changeEventRoute", () => {
  it("시장이 붙은 브리핑 id는 그 시장 브리핑을 연다", () => {
    expect(changeEventRoute({ artifactKind: "briefing", artifactId: "2026-08-04.us" })).toBe("#/briefing/2026-08-04/us");
    expect(changeEventRoute({ artifactKind: "briefing", artifactId: "2026-08-04.kr" })).toBe("#/briefing/2026-08-04/kr");
  });

  it("시장이 없는 예전 이벤트는 lineage에서 시장을 읽는다", () => {
    expect(changeEventRoute({ artifactKind: "briefing", artifactId: "2026-08-04", lineageId: "briefing:us" }))
      .toBe("#/briefing/2026-08-04/us");
  });

  it("시장을 알 수 없을 때만 종합 브리핑으로 간다", () => {
    expect(changeEventRoute({ artifactKind: "briefing", artifactId: "2026-08-04", lineageId: "briefing:both" }))
      .toBe("#/briefing/2026-08-04/both");
  });

  it("날짜가 아니면 브리핑 목록으로 간다", () => {
    expect(changeEventRoute({ artifactKind: "briefing", artifactId: "draft" })).toBe("#/briefing");
  });

  it("다른 산출물은 각자의 화면으로 간다", () => {
    expect(changeEventRoute({ artifactKind: "company_analysis", artifactId: "NVDA:2026-08-04" })).toBe("#/analysis");
    expect(changeEventRoute({ artifactKind: "topic_report", artifactId: "t1" })).toBe("#/deep-research");
    expect(changeEventRoute({ artifactKind: "market_memory", artifactId: "mss_1" })).toBe("#/market-memory");
  });
});
