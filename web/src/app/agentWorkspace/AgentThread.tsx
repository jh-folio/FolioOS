import { AgentMessageContent, AgentRunCard } from "../AgentMessageContent";
import type { AgentWorkspaceController } from "./useAgentWorkspace";

export function AgentThread({ workspace }: { workspace: AgentWorkspaceController }) {
  if (!workspace.hasConversation) return null;

  return (
    <section className="agent-home-thread agent-home-right" aria-label="AI Agent 대화">
      <div className="agent-home-section-head">
        <div>
          <p className="section-kicker">Agent Thread</p>
          <h2>현재 대화</h2>
        </div>
        <button type="button" onClick={workspace.startNewConversation}>새 대화</button>
      </div>
      <div className="agent-home-log" aria-live="polite">
        {workspace.messages.map((message) => (
          <article key={message.id} className={`agent-home-message ${message.role}${message.pending ? " pending" : ""}`}>
            <div className="agent-home-message-body">
              {message.runTitle && <AgentRunCard state={message.runState} title={message.runTitle} meta={message.runMeta} />}
              {message.text && <AgentMessageContent text={message.text} />}
              {message.notice && <p className="agent-home-notice">{message.notice}</p>}
              {(message.attachments || []).length > 0 && (
                <div className="agent-home-attachments">
                  {message.attachments?.map((name) => <span key={name}>{name}</span>)}
                </div>
              )}
            </div>
            {message.proposal && (
              <div className="agent-home-proposal">
                <div>
                  <strong>수정 제안</strong>
                  <span>{message.proposal.artifactKind} {message.proposal.artifactId}</span>
                </div>
                {message.proposal.summary && <p>{message.proposal.summary}</p>}
                {message.proposal.diff && (
                  <details>
                    <summary>diff 보기</summary>
                    <pre>{message.proposal.diff}</pre>
                  </details>
                )}
                {message.proposalStatus === "pending" ? (
                  <div className="agent-home-proposal-actions">
                    <button type="button" onClick={() => workspace.handleProposalAction(message.id, message.proposal!.id, "approve")}>
                      승인
                    </button>
                    <button type="button" onClick={() => workspace.handleProposalAction(message.id, message.proposal!.id, "reject")}>
                      거절
                    </button>
                  </div>
                ) : (
                  <p className="agent-home-notice">상태: {message.proposalStatus}</p>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

