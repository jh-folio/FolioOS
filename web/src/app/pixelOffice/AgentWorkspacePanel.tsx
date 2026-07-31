import { AgentComposer } from "../agentWorkspace/AgentComposer";
import { AgentThread } from "../agentWorkspace/AgentThread";
import type { AgentWorkspaceController } from "../agentWorkspace/useAgentWorkspace";
import { AgentWorkLog } from "../AgentWorkLog";

export function AgentWorkspacePanel({ workspace }: { workspace: AgentWorkspaceController }) {
  return (
    <div className="office-agent-workspace">
      <p className="office-agent-note">
        Agent Home과 같은 대화·모델·첨부·수정 제안 상태를 사용합니다.
      </p>
      <AgentComposer workspace={workspace} />
      <AgentThread workspace={workspace} />
      <AgentWorkLog surface="home" pageSize={20} refreshKey={workspace.workLogRefreshKey} collapsible />
    </div>
  );
}
