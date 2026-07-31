import { AgentComposer } from "./agentWorkspace/AgentComposer";
import { AgentJobsPanel } from "./agentWorkspace/AgentJobsPanel";
import { AgentThread } from "./agentWorkspace/AgentThread";
import { recentKey, reportRoute } from "./agentWorkspace/presenters";
import { useAgentWorkspace } from "./agentWorkspace/useAgentWorkspace";
import { HomeModeSwitch } from "./HomeModeSwitch";

export function AgentHome() {
  const workspace = useAgentWorkspace("agent_home");

  return (
    <div className="react-home-route" data-agent-home>
      <div className={`agent-home ${workspace.hasConversation ? "has-conversation" : "is-empty"}`}>
        <div className="agent-home-left">
          <header className="home-hero agent-home-hero">
            <p className="eyebrow">Local Investment Research Workspace</p>
            <h1>Folio OS</h1>
            <HomeModeSwitch current="home" />
          </header>

          <AgentComposer workspace={workspace} />

          <div className="home-launcher agent-home-launcher" role="group" aria-label="빠른 실행">
            <button
              className="launch-tile primary"
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
          </div>

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
        <AgentJobsPanel workspace={workspace} />
      </div>
    </div>
  );
}
