import { AgentComposer } from "./agentWorkspace/AgentComposer";
import { AgentThread } from "./agentWorkspace/AgentThread";
import { recentKey, reportRoute } from "./agentWorkspace/presenters";
import { useAgentWorkspace } from "./agentWorkspace/useAgentWorkspace";
import { AgentWorkLog } from "./AgentWorkLog";
import { InvestmentContextCard } from "./InvestmentContextCard";

export function AgentHome() {
  const workspace = useAgentWorkspace("agent_home");

  return (
    <div className="react-home-route" data-agent-home>
      <div className={`agent-home ${workspace.hasConversation ? "has-conversation" : "is-empty"}`}>
        <div className="agent-home-left">
          <header className="home-hero agent-home-hero">
            <p className="eyebrow">Local Investment Research Workspace</p>
            <h1>Folio OS</h1>
            <p className="agent-home-tagline">AI Agent에게 투자 리서치를 요청하고 여기서 대화를 이어가세요.</p>
          </header>

          <AgentComposer workspace={workspace} />

          <div className="home-launcher agent-home-launcher" role="group" aria-label="빠른 실행">
            <button
              className="launch-tile"
              type="button"
              onClick={() => workspace.runQuickAction("briefing")}
              disabled={workspace.quickBusy === "briefing"}
            >
              {workspace.quickBusy === "briefing" ? "생성 중" : "오늘 브리핑 생성"}
            </button>
            <button
              className="launch-tile"
              type="button"
              onClick={() => workspace.runQuickAction("rss")}
              disabled={workspace.quickBusy === "rss"}
            >
              {workspace.quickBusy === "rss" ? "수집 중" : "RSS 수집"}
            </button>
            <button className="launch-tile" type="button" onClick={() => workspace.runQuickAction("analysis")}>
              기업 분석
            </button>
            <button
              className="launch-tile"
              data-qa="home-deep-research"
              type="button"
              onClick={() => workspace.runQuickAction("deep-research")}
            >
              딥 리서치
            </button>
          </div>

          <InvestmentContextCard mode="home" dismissible />

          {workspace.recentReports.length > 0 && (
            <div className="review-recent-wrap agent-home-recent">
              <span className="rv-recent-cap">최근 보고서</span>
              <div className="rv-recent">
                {workspace.recentReports.map((report, index) => (
                  <button
                    className="rv-rc"
                    type="button"
                    key={recentKey(report, index)}
                    data-tooltip={`${report.title || "보고서"}${report.date ? ` · ${report.date}` : ""}`}
                    onClick={() => { window.location.hash = reportRoute(report); }}
                  >
                    <span className="rv-rc-k">{String(report.type || report.view || "REPORT").toUpperCase()}</span>
                    <span className="rv-rc-t">{report.title || "제목 없음"}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <AgentThread workspace={workspace} />

        {/* 작업 기록은 metadata-only Work Log 하나만 쓴다. 원문/오류 문자열을 그리는 목록을 따로 두지 않는다. */}
        <AgentWorkLog surface="home" pageSize={20} refreshKey={workspace.workLogRefreshKey} collapsible />
      </div>
    </div>
  );
}
