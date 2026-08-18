/** 라벨은 칸보다 넓어지는 순간 이웃과 겹친다.
 *
 *  연도 넷짜리 차트에서는 드러나지 않는다. 분기 차트가 여덟 칸을 쓰면서
 *  `2026 Q1`(52px)이 43px 칸에 들어가려다 옆 라벨 위로 올라탔다.
 */
import { describe, expect, it } from "vitest";

import { compareIndex, labelStride } from "./AnalysisCharts";

describe("labelStride", () => {
  it("연도 넷은 좁은 카드에서도 그대로 다 보인다", () => {
    // 카드 300px일 때 칸 폭은 48px, `2025`는 29px다.
    expect(labelStride(["2022", "2023", "2024", "2025"], 48)).toBe(1);
  });

  it("분기 여덟 칸에서는 라벨을 걸러 겹침을 막는다", () => {
    const quarters = ["2024 Q3", "2024 Q4", "2025 Q1", "2025 Q2", "2025 Q3", "2025 Q4", "2026 Q1", "2026 Q2"];
    expect(labelStride(quarters, 43)).toBeGreaterThan(1);
  });

  it("칸이 넓어지면 다시 전부 보여준다", () => {
    const quarters = ["2024 Q3", "2024 Q4", "2025 Q1", "2025 Q2", "2025 Q3", "2025 Q4", "2026 Q1", "2026 Q2"];
    expect(labelStride(quarters, 109)).toBe(1);
  });

  it("한글 라벨은 라틴 문자보다 넓게 잡는다", () => {
    // `12개월`은 `2025`보다 넓다. 같은 칸이라도 먼저 걸린다.
    expect(labelStride(["12개월"], 40)).toBeGreaterThan(labelStride(["2025"], 40));
  });

  it("칸이 0이어도 무한 반복으로 가지 않는다", () => {
    expect(labelStride(["2025"], 0)).toBeGreaterThanOrEqual(1);
    expect(labelStride([], 40)).toBe(1);
  });
});

/** 고정 오프셋 4는 전년 동기를 못 짚는다. 10-Q에는 Q4가 없어 분기가 건너뛴다. */
describe("compareIndex", () => {
  it("Q4가 빠진 라벨에서도 전년 같은 분기를 찾는다", () => {
    // 10-Q만 모으면 Q4가 없다. 여기서 오프셋 4는 2025 Q2가 아니라 2024 Q3를 가리킨다.
    const labels = ["2024 Q2", "2024 Q3", "2025 Q1", "2025 Q2", "2025 Q3", "2026 Q1", "2026 Q2", "2026 Q3"];
    expect(compareIndex(labels, labels.indexOf("2026 Q2"), 4)).toBe(labels.indexOf("2025 Q2"));
    expect(compareIndex(labels, labels.indexOf("2025 Q1"), 4)).toBe(-1);
  });

  it("전년 동기가 목록에 없으면 비교하지 않는다", () => {
    // 예전 저장 보고서는 분기 라벨이 4개뿐이라 전년 동기가 아예 없다.
    const labels = ["2025 Q4", "2026 Q1", "2026 Q2", "2026 Q3"];
    expect(compareIndex(labels, 3, 4)).toBe(-1);
    expect(compareIndex(labels, 1, 4)).toBe(-1);
  });

  it("연도 차트는 직전 기간과 비교한다", () => {
    const labels = ["2022", "2023", "2024", "2025"];
    expect(compareIndex(labels, 3)).toBe(2);
    expect(compareIndex(labels, 0)).toBe(-1);
  });
});
