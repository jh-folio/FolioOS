import { useCallback, useEffect, useState } from "react";
import { getJson } from "../../api";
import { ChangeFeed } from "./ChangeFeed";
import { InvestmentImplications } from "./InvestmentImplications";
import { MarketCalendar } from "./MarketCalendar";
import { NativeMarketChart } from "./NativeMarketChart";
import type { ChangeEvent } from "../watchlist/ChangeHistory";

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
        <span className="cockpit-summary__chip" data-tone="burgundy">중대한 변화 {counts.majorChange || 0}</span>
        <span className="cockpit-summary__chip" data-tone="blue">발전 중 {counts.developingSignal || 0}</span>
        <span className="cockpit-summary__chip" data-tone="gold">충돌·불확실 {counts.conflictingUncertain || 0}</span>
        <span className="cockpit-summary__chip" data-tone="muted">그 외 평가 {counts.quiet || 0}</span>
        {providerIssues.map((row) => (
          <span className="cockpit-summary__chip" data-tone="burgundy" key={row.provider}>{row.provider} 수집 문제</span>
        ))}
      </div>
      <ChangeFeed events={payload.changes || []} quiet={payload.quietChanges || []} />
      <InvestmentImplications items={payload.implications || []} portfolioState={payload.portfolioState} />
      <NativeMarketChart symbols={focusSymbols} />
      <MarketCalendar focusSymbols={focusSymbols} />
    </div>
  );
}
