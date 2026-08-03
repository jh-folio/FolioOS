export type ChangeEvent = {
  artifactKind?: string;
  artifactId?: string;
  status?: string;
  generatedAt?: string;
  materiality?: number;
  reliability?: number;
  changedItems?: Array<{ id?: string; subject?: string; change?: string }>;
};

const LABELS: Record<string, string> = {
  major_change: "중대한 변화",
  developing_signal: "발전 중인 신호",
  conflicting_uncertain: "충돌·불확실",
  no_material_change: "중대한 변화 없음",
  baseline_created: "기준선 생성",
  insufficient_basis: "비교 근거 부족",
};

export const ARTIFACT_KIND_LABELS: Record<string, string> = {
  briefing: "브리핑",
  company_analysis: "기업 분석",
  topic_report: "딥 리서치",
  market_memory: "시장 내러티브",
};

export function ChangeHistory({ events }: { events: ChangeEvent[] }) {
  return (
    <section className="evidence-rail evidence-rail--confirmed" aria-labelledby="change-history-title">
      <div className="evidence-rail__head">
        <div>
          <span className="evidence-rail__eyebrow">REPORT-GENERATED</span>
          <h3 id="change-history-title">확인된 변화 기록</h3>
        </div>
        <span className="status-chip status-chip--confirmed">구조화 비교</span>
      </div>
      <p className="evidence-rail__note">새 보고서나 시장 내러티브를 생성할 때 공식·독립 근거와 반대 신호를 함께 비교한 결과입니다.</p>
      {events.length ? (
        <ol className="evidence-rail__list">
          {events.map((event) => (
            <li key={`${event.artifactKind}-${event.artifactId}-${event.generatedAt}`}>
              <div className="evidence-rail__meta">
                <span>{ARTIFACT_KIND_LABELS[event.artifactKind || ""] || event.artifactKind}</span>
                <span>{LABELS[event.status || ""] || event.status}</span>
                <time>{event.generatedAt ? new Date(event.generatedAt).toLocaleString("ko-KR") : ""}</time>
              </div>
              <strong>{event.changedItems?.[0]?.subject || LABELS[event.status || ""] || "변화 평가"}</strong>
              <small>중요도 {Math.round(Number(event.materiality || 0) * 100)} · 신뢰도 {Math.round(Number(event.reliability || 0) * 100)}</small>
            </li>
          ))}
        </ol>
      ) : <p className="section-subtitle">아직 비교 가능한 새 보고서 변화가 없습니다.</p>}
    </section>
  );
}
