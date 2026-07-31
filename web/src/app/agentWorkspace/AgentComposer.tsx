import { useRef } from "react";
import type { AgentWorkspaceController } from "./useAgentWorkspace";

export function AgentComposer({ workspace }: { workspace: AgentWorkspaceController }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <form className="agent-home-prompt" onSubmit={workspace.handleSubmit}>
      <div className="agent-home-prompt-shell">
        <textarea
          value={workspace.input}
          onChange={(event) => workspace.setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="Folio OS에서 무엇을 빌드할까요?"
          rows={3}
        />
        <div className="agent-home-toolbar">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            onChange={(event) => {
              workspace.handleFiles(event.currentTarget.files).finally(() => {
                if (fileInputRef.current) fileInputRef.current.value = "";
              });
            }}
          />
          <div className="agent-home-toolbar-left">
            <button
              type="button"
              className="agent-home-icon-btn"
              onClick={() => fileInputRef.current?.click()}
              aria-label="파일 첨부"
              data-tooltip="파일 첨부"
            >
              +
            </button>
            <span className="agent-home-provider">{workspace.adapter?.label || workspace.adapter?.id || "Folio OS"}</span>
          </div>
          <div className="agent-home-toolbar-right">
            <select aria-label="모델" value={workspace.model} onChange={(event) => workspace.persistModel(event.target.value)}>
              {workspace.modelChoices.length > 0 ? workspace.modelChoices.map((choice) => (
                <option key={choice.value} value={choice.value}>{choice.label}</option>
              )) : <option value="">모델 목록 없음</option>}
            </select>
            <select aria-label="노력 단계" value={workspace.effort} onChange={(event) => workspace.setEffort(event.target.value)}>
              <option value="low">낮음</option>
              <option value="medium">중간</option>
              <option value="high">높음</option>
              <option value="max">최대</option>
            </select>
            <button
              className="agent-home-send"
              type="submit"
              disabled={workspace.busy || !workspace.input.trim()}
              aria-label="전송"
              data-tooltip="전송"
            >
              {workspace.busy ? "..." : "↑"}
            </button>
          </div>
        </div>
      </div>
      {workspace.settingsMessage && <p className="agent-home-notice">{workspace.settingsMessage}</p>}
      {workspace.attachments.length > 0 && (
        <div className="agent-home-attachments">
          {workspace.attachments.map((item) => (
            <span key={item.name}>
              {item.name}
              <button
                type="button"
                aria-label={`${item.name} 첨부 제거`}
                onClick={() => workspace.setAttachments((current) => current.filter((candidate) => candidate.name !== item.name))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      {workspace.quickStatus && <p className="agent-home-notice">{workspace.quickStatus}</p>}
      {workspace.error && <p className="agent-home-error">{workspace.error}</p>}
    </form>
  );
}

