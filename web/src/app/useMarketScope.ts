import { useCallback, useEffect, useState } from "react";
import { getJson } from "../api";

/** 관심 시장 범위 — 필터가 아니라 제품의 바깥 테두리.
 *
 *  여기서 고른 시장이 RSS 목록·필터, 브리핑 생성 선택지, 시장 캘린더,
 *  내러티브 세그먼트의 상한이다. 범위에서 꺼진 시장은 수집도 멈춘다.
 *  GLOBAL/UNKNOWN 자료는 특정 시장 소유가 아니므로 항상 보인다.
 */
export type MarketScopePayload = {
  readonly selected: readonly string[];
  readonly enabledAt: Readonly<Record<string, string>>;
  readonly updatedAt: string;
  readonly markets: ReadonlyArray<{ readonly id: string; readonly label: string }>;
};

const FALLBACK: MarketScopePayload = {
  // 읽기 전이나 실패 시에는 전부 보인다. 범위를 못 읽었다고 화면을 좁히면
  // 서버 오류가 곧 데이터 소실처럼 보인다.
  selected: ["US", "KR", "EUROPE", "JP"],
  enabledAt: {},
  updatedAt: "",
  markets: [
    { id: "US", label: "미국" },
    { id: "KR", label: "한국" },
    { id: "EUROPE", label: "유럽" },
    { id: "JP", label: "일본" },
  ],
};

export function useMarketScope() {
  const [scope, setScope] = useState<MarketScopePayload>(FALLBACK);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    try {
      const payload = await getJson<MarketScopePayload>("/api/market-scope");
      setScope({ ...FALLBACK, ...payload });
    } catch {
      setScope(FALLBACK);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const isSelected = useCallback(
    (market: string) => {
      const token = String(market || "").toUpperCase();
      if (!token || token === "GLOBAL" || token === "UNKNOWN") return true;
      const normalized = token === "EU" ? "EUROPE" : token;
      return scope.selected.includes(normalized);
    },
    [scope.selected],
  );

  return { scope, loaded, reload, isSelected };
}
