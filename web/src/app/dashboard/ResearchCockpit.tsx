import { useCallback, useEffect, useState } from "react";
import { getJson } from "../../api";
import { ChangeFeed } from "./ChangeFeed";
import { MarketCalendar } from "./MarketCalendar";
import { NativeMarketChart } from "./NativeMarketChart";
import type { ChangeEvent } from "../changeEvents";

type ProviderHealth = { provider?: string; sourceStatus?: string; errorCode?: string };
type Cockpit = {
  changes?: ChangeEvent[];
  quietChanges?: ChangeEvent[];
  changeCounts?: { majorChange?: number; developingSignal?: number; conflictingUncertain?: number; quiet?: number };
  calendarRefs?: Array<Record<string, unknown>>;
  focusSymbols?: Array<{ symbol: string; label?: string; source?: string }>;
  implications?: Array<{ tickers?: string[]; status?: string; source?: string; generatedAt?: string }>;
  providerHealth?: ProviderHealth[];
  portfolioState?: string;
  invalidationToken?: string;
};

export function ResearchCockpit() {
  const [payload, setPayload] = useState<Cockpit | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(() => getJson<Cockpit>("/api/dashboard/cockpit").then(setPayload).catch((err) => setError(err instanceof Error ? err.message : "대시보드를 불러오지 못했습니다.")), []);
  useEffect(() => { load(); const handler = () => load(); document.addEventListener("folio:generation-complete", handler); return () => document.removeEventListener("folio:generation-complete", handler); }, [load]);
  if (error) return <p className="react-dashboard-error">{error}</p>;
  if (!payload) return <p className="section-subtitle">대시보드를 불러오는 중입니다.</p>;

  const counts = payload.changeCounts || {};
  const providerIssues = (payload.providerHealth || []).filter((row) => ["stale", "unhealthy"].includes(String(row.sourceStatus || "")));
  const focusSymbols = payload.focusSymbols || [];

  return (
    <div className="research-cockpit" data-invalidation-token={payload.invalidationToken}>
      <div className="cockpit-summary" role="status" aria-label="오늘의 변화 요약">
        <span className="chip cockpit-summary__chip" data-tone="burgundy">중대한 변화 {counts.majorChange || 0}</span>
        <span className="chip cockpit-summary__chip" data-tone="blue">발전 중 {counts.developingSignal || 0}</span>
        <span className="chip cockpit-summary__chip" data-tone="gold">충돌·불확실 {counts.conflictingUncertain || 0}</span>
        <span className="chip cockpit-summary__chip" data-tone="muted">그 외 평가 {counts.quiet || 0}</span>
        {providerIssues.map((row) => (
          <span className="chip cockpit-summary__chip" data-tone="burgundy" key={row.provider}>{row.provider} 수집 문제</span>
        ))}
      </div>
      {/* 무엇이 달라졌나 → 일정 → 차트. 일정이 차트보다 위인 이유는 오늘 무엇을
          지켜봐야 하는지가 가격 움직임보다 먼저 필요한 정보이기 때문이다.
          `내 포지션과의 연결`은 뺐다 — 브리핑 lineage가 시장 단위라 개별 보유
          티커와 걸리는 일이 없어 늘 비어 있었다(워치리스트의 같은 레일도 0.4.8에서
          같은 이유로 제거). 0.6의 thesis 검증 루프가 티커 단위 연결을 만든다. */}
      <ChangeFeed events={payload.changes || []} quiet={payload.quietChanges || []} />
      <MarketCalendar focusSymbols={focusSymbols} />
      <NativeMarketChart symbols={focusSymbols} />
    </div>
  );
}
