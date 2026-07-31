import { formatJobTime, jobArtifactRoute } from "./presenters";
import type { AgentWorkspaceController } from "./useAgentWorkspace";

export function AgentJobsPanel({ workspace }: { workspace: AgentWorkspaceController }) {
  return (
    <section className={`agent-home-jobs${workspace.jobsOpen ? " open" : ""}`} aria-label="AI Agent 작업">
      <div className="agent-home-section-head">
        <div>
          <p className="section-kicker">Agent Work</p>
          <h2>최근 작업</h2>
        </div>
        <div className="agent-home-jobs-actions">
          {workspace.jobsOpen && (
            <button type="button" onClick={() => workspace.loadRecentJobs().catch(() => undefined)} disabled={workspace.jobsLoading}>
              {workspace.jobsLoading ? "확인 중" : "새로고침"}
            </button>
          )}
          <button
            type="button"
            onClick={() => workspace.setJobsOpen((current) => !current)}
            aria-expanded={workspace.jobsOpen}
          >
            {workspace.jobsOpen ? "접기 ▲" : "펼치기 ▼"}
          </button>
        </div>
      </div>
      {!workspace.jobsOpen ? null : workspace.recentJobs.length > 0 ? (
        <div className="agent-home-job-list">
          {workspace.recentJobs.map((job) => {
            const route = jobArtifactRoute(job);
            return (
              <article key={job.id} className={`agent-home-job ${job.status}`}>
                <div>
                  <strong>{job.label || job.kind || "작업"}</strong>
                  <p>{job.message || job.error || "상태 메시지가 없습니다."}</p>
                  <span className="agent-home-job-meta">
                    {job.status}
                    {typeof job.progress === "number" ? ` · ${job.progress}%` : ""}
                    {formatJobTime(job) ? ` · ${formatJobTime(job)}` : ""}
                  </span>
                </div>
                {route && <button type="button" onClick={() => { window.location.hash = route; }}>열기</button>}
              </article>
            );
          })}
        </div>
      ) : (
        <p className="agent-home-empty">
          아직 표시할 Agent 작업이 없습니다. Home에서 질문하거나 브리핑/RSS 빠른 실행을 사용하면 여기에 남습니다.
        </p>
      )}
    </section>
  );
}

