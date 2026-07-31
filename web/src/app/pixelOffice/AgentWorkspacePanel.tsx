import { AgentComposer } from "../agentWorkspace/AgentComposer";
import { AgentJobsPanel } from "../agentWorkspace/AgentJobsPanel";
import { AgentThread } from "../agentWorkspace/AgentThread";
import type { AgentWorkspaceController } from "../agentWorkspace/useAgentWorkspace";

export function AgentWorkspacePanel({ workspace }: { workspace: AgentWorkspaceController }) {
  return (
    <div className="office-agent-workspace">
      <p className="office-agent-note">
        Agent Home과 같은 대화·모델·첨부·proposal 상태를 사용합니다.
      </p>
      <AgentComposer workspace={workspace} />
      <AgentThread workspace={workspace} />
      <AgentJobsPanel workspace={workspace} />
    </div>
  );
}

