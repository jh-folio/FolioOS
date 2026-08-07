import { describe, expect, it } from "vitest";
import { comparisonLabel, comparisonDirection } from "./MarketCalendar";
import { chartTime } from "./NativeMarketChart";

/** 두 버그 모두 "예외가 안 났으니 잘 됐겠지"로 새어나간 것들이다. */

describe("캘린더 결과 비교", () => {
  // `Number("")`이 0이라 빈 예상치가 0으로 읽혔다. 서버는 결측을 빈 문자열로
  // 주고 yfinance 컨센서스는 늘 비어 있어, 거의 모든 지표 행이 이 경로였다.
  it("예상치가 비어 있으면 직전 값으로 읽는다", () => {
    expect(comparisonLabel({ actualValue: "3.2", forecastValue: "", previousValue: "3.4" } as never)).toBe("직전 3.4");
    expect(comparisonLabel({ actualValue: "3.2", previousValue: "3.4" } as never)).toBe("직전 3.4");
    expect(comparisonLabel({ actualValue: "-0.5", forecastValue: "   ", previousValue: "0.1" } as never)).toBe("직전 0.1");
  });

  it("방향도 직전 값 기준이다 — 발표치의 부호가 아니라", () => {
    // 3.2 < 3.4 이므로 내림이다. 예전에는 0과 비교해 `up`이 나왔다.
    expect(comparisonDirection({ actualValue: "3.2", forecastValue: "", previousValue: "3.4" } as never)).toBe("down");
    expect(comparisonDirection({ actualValue: "-0.5", forecastValue: "", previousValue: "-0.9" } as never)).toBe("up");
    expect(comparisonDirection({ actualValue: "3.2", forecastValue: "", previousValue: "3.2" } as never)).toBe("flat");
  });

  it("예상치가 실제로 있으면 그것을 우선한다", () => {
    expect(comparisonLabel({ actualValue: "3.2", forecastValue: "3.0", previousValue: "2.8" } as never)).toBe("예상 3.0 대비 +0.2");
    expect(comparisonDirection({ actualValue: "3.2", forecastValue: "3.0" } as never)).toBe("up");
  });

  it("숫자가 아닌 발표치는 직전 값 문구로 떨어진다", () => {
    expect(comparisonLabel({ actualValue: "210K", previousValue: "180K" } as never)).toBe("직전 180K");
    expect(comparisonDirection({ actualValue: "210K", previousValue: "180K" } as never)).toBe("flat");
  });
});

describe("차트 시각 변환", () => {
  // ISO 문자열을 그대로 넘기면 라이브러리가 예외 없이 받은 뒤 하루로 접어
  // 세션 전체를 한 점에 겹쳐 놓는다(실측: 보이는 범위의 from == to).
  it("분봉은 벽시계 값을 UTC epoch 초로 넘긴다", () => {
    const open = chartTime("2026-08-07T09:30:00-04:00", true);
    const close = chartTime("2026-08-07T15:55:00-04:00", true);
    expect(typeof open).toBe("number");
    expect(open).toBe(Date.UTC(2026, 7, 7, 9, 30, 0) / 1000);
    // 한 세션의 봉들이 서로 다른 값이어야 겹치지 않는다.
    expect(close as number).toBeGreaterThan(open as number);
    expect((close as number) - (open as number)).toBe(6 * 3600 + 25 * 60);
  });

  it("일봉은 yyyy-mm-dd 문자열 그대로 둔다", () => {
    expect(chartTime("2026-08-07", false)).toBe("2026-08-07");
  });

  it("읽을 수 없는 값은 버리지 않고 원본을 돌려준다", () => {
    expect(chartTime("nonsense", true)).toBe("nonsense");
  });
});
