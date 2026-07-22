const base = {
  title: "현재 중기 시장 상황",
  summary: "성장주 모멘텀과 금리 부담이 함께 관찰됩니다.",
  plainConclusion: "선별적으로 대응하되 금리 재상승을 확인합니다.",
  reasonSummary: "AI 투자 사이클이 지지력을 보이지만 장기금리가 상단을 제한합니다.",
  source: "market_state_snapshot",
  actionGuide: { headline: "선별 유지", action: "실적 확인 종목 중심으로 접근합니다.", timing: "다음 CPI와 실적 발표를 확인합니다." },
  watchItems: ["미국 CPI", "10년물 금리"],
  drivers: [{
    id: "driver-1", title: "AI 투자 사이클", status: "current", momentum: "agent", momentumLabel: "Agent 판단",
    directionLabel: "도움", confidence: "high", confidencePct: 82, interpretation: "설비투자가 관련 실적을 지지합니다.",
    marketImpact: "성장주와 반도체에 선택적 지지력을 제공합니다.", rationale: "복수 기업의 가이던스가 유지됐습니다.",
    evidenceSummary: "복수 기업의 가이던스가 유지됐습니다.", elaboration: "", evidenceCounts: { d7: 2, d30: 5, d90: 8 },
    linkedCompanies: ["NVDA"], nextCheckpoint: "다음 분기 가이던스", nextMemoryCheck: "가이던스 상향 지속 여부", askAgentPrompt: "영향을 설명해줘",
  }],
  counterEvidence: [{ title: "금리 부담", summary: "실질금리 상승은 밸류에이션을 압박할 수 있습니다." }],
  uncertainties: [{ title: "정책 경로", summary: "인하 시점의 불확실성이 남아 있습니다." }],
  sourceRefs: [{ id: "src-1", title: "공개 RSS 기사", source: "Fixture News", date: "2026-07-22", url: "https://example.test/news" }],
};

const refs = {
  current: { snapshotId: "snap-current", sourceKind: "snapshot", scope: "GLOBAL", asOf: "2026-07-22T00:00:00Z", status: "current", freshnessReason: "within_window", inputWatermark: "2026-07-21T23:00:00Z", relevantEvidenceWatermark: "2026-07-21T23:00:00Z", invalidWatermarkRows: 0, resolvedAt: "2026-07-22T01:00:00Z", layer: "source-grounded" },
  stale: { snapshotId: "snap-stale", sourceKind: "snapshot", scope: "GLOBAL", asOf: "2026-07-18T00:00:00Z", status: "stale", freshnessReason: "new_relevant_evidence", inputWatermark: "2026-07-18T00:00:00Z", relevantEvidenceWatermark: "2026-07-22T00:30:00Z", invalidWatermarkRows: 0, resolvedAt: "2026-07-22T01:00:00Z", layer: "source-grounded" },
  fallback: { snapshotId: null, sourceKind: "state_fallback", scope: "GLOBAL", asOf: "2026-07-20T00:00:00Z", status: "fallback", freshnessReason: "state_fallback", inputWatermark: null, relevantEvidenceWatermark: null, invalidWatermarkRows: 0, resolvedAt: "2026-07-22T01:00:00Z", layer: "source-grounded" },
  empty: { snapshotId: null, sourceKind: "none", scope: "GLOBAL", asOf: null, status: "empty", freshnessReason: "no_state", inputWatermark: null, relevantEvidenceWatermark: null, invalidWatermarkRows: 0, resolvedAt: "2026-07-22T01:00:00Z", layer: "source-grounded" },
};

export const marketStateFixtures = {
  current: { ...base, snapshot: { asOf: refs.current.asOf, status: "current", confidence: 0.82, marketRegime: "mixed" }, marketStateRef: refs.current },
  stale: { ...base, snapshot: { asOf: refs.stale.asOf, status: "current", confidence: 0.82, marketRegime: "mixed" }, marketStateRef: refs.stale },
  fallback: { ...base, source: "state_fallback", snapshot: undefined, sourceRefs: [], counterEvidence: [], uncertainties: [], marketStateRef: refs.fallback },
  empty: { title: "현재 중기 시장 상황", summary: "", source: "none", drivers: [], marketStateRef: refs.empty },
};

export const fallbackWithLiveEvidenceFixture = {
  ...marketStateFixtures.fallback,
  marketStateRef: {
    ...marketStateFixtures.fallback.marketStateRef,
    relevantEvidenceWatermark: "2026-07-22T00:45:00Z",
  },
};

export const STATE_CANARY = "MARKET_STATE_CANARY_DO_NOT_PROMOTE";
