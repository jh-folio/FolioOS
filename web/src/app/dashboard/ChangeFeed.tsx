import { ARTIFACT_KIND_LABELS, baselineText, changeReasonText, type ChangeEvent } from "../watchlist/ChangeHistory";

export const CHANGE_STATUS_LABELS: Record<string, string> = {
  major_change: "중대한 변화", developing_signal: "발전 중", conflicting_uncertain: "충돌·불확실",
  no_material_change: "중대한 변화 없음", baseline_created: "기준선 생성", insufficient_basis: "근거 부족",
};

export function changeEventRoute(event: ChangeEvent): string {
  const kind = String(event.artifactKind || "");
  const id = String(event.artifactId || "");
  if (kind === "briefing") {
    const date = id.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const scope = id.endsWith(".us") ? "us" : id.endsWith(".kr") ? "kr" : "both";
      return `#/briefing/${date}/${scope}`;
    }
    return "#/briefing";
  }
  if (kind === "company_analysis") return "#/analysis";
  if (kind === "topic_report") return "#/deep-research";
  if (kind === "market_memory") return "#/market-memory";
  return "#/dashboard";
}

function artifactLabel(event: ChangeEvent): string {
  return ARTIFACT_KIND_LABELS[event.artifactKind || ""] || event.artifactKind || "보고서";
}

export function ChangeFeed({ events, quiet }: { events: ChangeEvent[]; quiet?: ChangeEvent[] }) {
  return (
    <section className="cockpit-panel cockpit-change-feed" aria-labelledby="cockpit-change-title">
      <div className="cockpit-panel__head"><div><span>CHANGE INTELLIGENCE</span><h2 id="cockpit-change-title">무엇이 달라졌나</h2></div><b>{events.length}건</b></div>
      {events.length ? <ol>
        {events.map((event) => (
          <li data-status={event.status} key={`${event.artifactKind}-${event.artifactId}-${event.generatedAt}`}>
            <button type="button" className="cockpit-change-open" onClick={() => { window.location.hash = changeEventRoute(event); }}>
              <div><span className="status-chip">{CHANGE_STATUS_LABELS[event.status || ""] || event.status}</span><time>{event.generatedAt ? new Date(event.generatedAt).toLocaleString("ko-KR") : ""}</time></div>
              <strong>{event.changedItems?.[0]?.subject || artifactLabel(event)}</strong>
              {changeReasonText(event) ? <em className="cockpit-change-reason">{changeReasonText(event)}</em> : null}
              <small>{artifactLabel(event)}
                {baselineText(event) ? <> · {baselineText(event)}</> : null}
                {Number(event.materiality || 0) > 0 ? <> · 중요도 {Math.round(Number(event.materiality) * 100)}</> : null}
                {Number(event.reliability || 0) > 0 ? <> · 신뢰도 {Math.round(Number(event.reliability) * 100)}</> : null}
              </small>
            </button>
          </li>
        ))}
      </ol> : (
        <p className="cockpit-empty">
          아직 확인된 중요한 변화가 없습니다. 새 브리핑·기업 분석·딥 리서치를 만들면 직전 보고서와 비교한 결과가 여기에 표시됩니다.
        </p>
      )}
      {quiet?.length ? (
        <details className="cockpit-quiet">
          {/* 기준선 생성·근거 부족·변화 없음이 함께 들어가므로 "변화 없음"으로 뭉뚱그리지 않는다. */}
          <summary>그 외 평가 {quiet.length}건 보기</summary>
          <ol>
            {quiet.map((event) => (
              <li key={`${event.artifactKind}-${event.artifactId}-${event.generatedAt}`}>
                <span>{CHANGE_STATUS_LABELS[event.status || ""] || event.status}</span>
                <em>{artifactLabel(event)}{event.artifactId ? ` · ${String(event.artifactId).slice(0, 24)}` : ""}</em>
                <time>{event.generatedAt ? new Date(event.generatedAt).toLocaleDateString("ko-KR") : ""}</time>
              </li>
            ))}
          </ol>
        </details>
      ) : null}
    </section>
  );
}
