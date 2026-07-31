import { recentKey, reportRoute } from "../agentWorkspace/presenters";
import type { AgentWorkspaceController } from "../agentWorkspace/useAgentWorkspace";
import type { OfficeObjectDefinition, OfficeObjectSummary } from "./types";

export function ReportShelfPanel({
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
        <p>{definition.source} · {status.asOf ? `최근 생성 ${status.asOf.slice(0, 10)}` : "생성 시각 없음"}</p>
      </section>
      {workspace.recentReports.length > 0 ? (
        <div className="office-report-list">
          {workspace.recentReports.map((report, index) => (
            <button
              type="button"
              key={recentKey(report, index)}
              onClick={() => { window.location.hash = reportRoute(report); }}
            >
              <small>{String(report.type || report.view || "REPORT").toUpperCase()}</small>
              <strong>{report.title || "제목 없음"}</strong>
              <span>{report.date || "날짜 없음"}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="office-panel-empty">최근 보고서가 없습니다. 브리핑이나 기업 분석을 생성하면 이곳에서 다시 열 수 있습니다.</p>
      )}
      <div className="office-panel-actions">
        <button type="button" onClick={() => workspace.runQuickAction("briefing")}>오늘 브리핑 생성</button>
        <button type="button" onClick={() => { window.location.hash = "#/briefing"; }}>보고서 목록</button>
      </div>
    </div>
  );
}

