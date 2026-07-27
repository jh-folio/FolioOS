import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { MarketStateDashboardView, type DashboardPayload } from "../../../src/islands/MarketStateDashboard";
import "../../../../public/styles.css";

const currentRef = { snapshotId: "fixture-current", sourceKind: "snapshot" as const, scope: "GLOBAL" as const, asOf: "2026-07-22T00:00:00Z", status: "current" as const, freshnessReason: "within_window", inputWatermark: "2026-07-21T23:00:00Z", relevantEvidenceWatermark: "2026-07-21T23:00:00Z", invalidWatermarkRows: 0, resolvedAt: "2026-07-22T01:00:00Z", layer: "source-grounded" as const };
const driver = { id: "fixture-driver", title: "AI 투자 사이클", status: "current", momentum: "agent", momentumLabel: "Agent 판단", directionLabel: "도움", confidence: "high", confidencePct: 82, interpretation: "설비투자가 실적 기대를 지지합니다.", marketImpact: "성장주에 선택적 지지를 제공합니다.", rationale: "공개 자료의 가이던스가 유지됐습니다.", evidenceSummary: "복수 공개 자료의 방향이 일치합니다.", elaboration: "", evidenceCounts: { d7: 2, d30: 4, d90: 8 }, linkedCompanies: ["NVDA"], nextCheckpoint: "다음 분기 가이던스", nextMemoryCheck: "가이던스 지속 여부", askAgentPrompt: "시장 영향을 설명해줘" };
const base: DashboardPayload = { title: "현재 중기 시장 상황", summary: "성장 동력과 금리 부담이 함께 관찰됩니다.", plainConclusion: "선별적으로 대응합니다.", reasonSummary: "AI 투자 흐름이 지지하지만 금리가 상단을 제한합니다.", source: "market_state_snapshot", actionGuide: { headline: "선별 유지", action: "실적 확인 종목 중심으로 접근합니다.", timing: "CPI와 실적을 확인합니다." }, watchItems: ["미국 CPI", "10년물 금리"], drivers: [driver], counterEvidence: [{ title: "금리 부담", summary: "실질금리 상승이 밸류에이션을 압박할 수 있습니다." }], uncertainties: [{ title: "정책 경로", summary: "인하 시점의 불확실성이 남아 있습니다." }], sourceRefs: [{ id: "fixture-source", title: "공개 RSS 기사", source: "Fixture News", url: "https://example.test/news" }] };
const current: DashboardPayload = { ...base, marketStateRef: currentRef, marketViews: { us: { ...base, title: "미국 시장", drivers: [driver] }, kr: { ...base, title: "한국 시장", drivers: [{ ...driver, id: "kr-driver", title: "한국 수출 사이클" }] } } };
const fixtures: Record<string, DashboardPayload> = {
  current,
  stale: { ...base, marketStateRef: { ...currentRef, snapshotId: "fixture-stale", asOf: "2026-07-18T00:00:00Z", status: "stale", freshnessReason: "new_relevant_evidence", relevantEvidenceWatermark: "2026-07-22T00:30:00Z" } },
  fallback: { ...base, source: "state_fallback", drivers: [driver], counterEvidence: [], uncertainties: [], sourceRefs: [], marketStateRef: { ...currentRef, snapshotId: null, sourceKind: "state_fallback", asOf: "2026-07-20T00:00:00Z", status: "fallback", freshnessReason: "state_fallback", inputWatermark: null, relevantEvidenceWatermark: null } },
  empty: { title: "현재 중기 시장 상황", summary: "", drivers: [], marketStateRef: { ...currentRef, snapshotId: null, sourceKind: "none", asOf: null, status: "empty", freshnessReason: "no_state", inputWatermark: null, relevantEvidenceWatermark: null } },
};

function stateFromHash() {
  const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
  const state = params.get("state") || "current";
  return fixtures[state] ? state : "empty";
}

function FixtureApp() {
  const [fixtureState, setFixtureState] = useState(stateFromHash());
  const [updating, setUpdating] = useState(false);
  useEffect(() => { const listener = () => setFixtureState(stateFromHash()); window.addEventListener("hashchange", listener); return () => window.removeEventListener("hashchange", listener); }, []);
  const update = () => { setUpdating(true); window.setTimeout(() => { setFixtureState("current"); setUpdating(false); }, 120); };
  return <main style={{ maxWidth: 1360, margin: "0 auto", padding: 16 }}><section className="market-state-dashboard react-market-memory-dashboard" aria-label="현재 중기 시장 상황"><MarketStateDashboardView payload={fixtures[fixtureState]} updating={updating} onUpdate={update} onReload={() => setFixtureState(stateFromHash())} /></section></main>;
}

createRoot(document.getElementById("fixture-root")!).render(<FixtureApp />);
