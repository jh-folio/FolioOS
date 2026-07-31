import type { AgentWorkspaceController } from "../agentWorkspace/useAgentWorkspace";
import type { OfficeObjectDefinition, OfficeObjectSummary } from "./types";

function formatAsOf(value: string) {
  if (!value) return "기준 시각 없음";
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value.slice(0, 19);
  }
}

export function ObjectStatusPanel({
  definition,
  status,
  workspace,
}: {
  definition: OfficeObjectDefinition;
  status: OfficeObjectSummary;
  workspace: AgentWorkspaceController;
}) {
  return (
    <div className="office-panel-body">
      <section className="office-panel-summary">
        <span data-state={status.state}>{status.state}</span>
        <strong>{status.summary}</strong>
        {status.notice && <p>{status.notice}</p>}
      </section>
      <dl className="office-panel-facts">
        <div><dt>Source</dt><dd>{definition.source}</dd></div>
        <div><dt>As of</dt><dd>{formatAsOf(status.asOf)}</dd></div>
        <div><dt>Count</dt><dd>{status.count.toLocaleString("ko-KR")}</dd></div>
        <div><dt>Freshness</dt><dd>{status.stale ? "업데이트 필요" : "현재 상태"}</dd></div>
      </dl>
      <div className="office-panel-actions">
        {definition.id === "news_desk" && (
          <button type="button" onClick={() => workspace.runQuickAction("rss")}>
            RSS 수집 실행
          </button>
        )}
        {definition.id === "research_desk" && (
          <button type="button" onClick={() => workspace.runQuickAction("analysis")}>
            기업 분석 열기
          </button>
        )}
        {definition.id === "report_shelf" && (
          <button type="button" onClick={() => workspace.runQuickAction("briefing")}>
            오늘 브리핑 생성
          </button>
        )}
        <button type="button" onClick={() => { window.location.hash = definition.route; }}>
          자세히 보기
        </button>
      </div>
    </div>
  );
}

