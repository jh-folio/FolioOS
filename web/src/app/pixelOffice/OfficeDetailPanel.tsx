import { useEffect, useRef } from "react";
import type { AgentWorkspaceController } from "../agentWorkspace/useAgentWorkspace";
import { officeObjectById } from "./officeObjects";
import { AgentWorkspacePanel } from "./AgentWorkspacePanel";
import { ObjectStatusPanel } from "./ObjectStatusPanel";
import { ReportShelfPanel } from "./ReportShelfPanel";
import type { OfficeObjectId, OfficeObjectSummary } from "./types";

const FOCUSABLE = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function OfficeDetailPanel({
  selectedId,
  status,
  workspace,
  onClose,
}: {
  selectedId: OfficeObjectId | null;
  status: OfficeObjectSummary | null;
  workspace: AgentWorkspaceController;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!selectedId) return undefined;
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    window.requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.requestAnimationFrame(() => returnFocusRef.current?.focus());
    };
  }, [onClose, selectedId]);

  if (!selectedId || !status) return null;
  const definition = officeObjectById(selectedId);

  return (
    <aside
      ref={panelRef}
      className="office-detail-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="office-detail-title"
      data-panel-kind={definition.panel}
    >
      <header className="office-detail-head">
        <div>
          <p>{definition.shortLabel}</p>
          <h2 id="office-detail-title">{definition.label}</h2>
          <span>{definition.description}</span>
        </div>
        <button type="button" onClick={onClose} aria-label={`${definition.label} 상세 닫기`}>×</button>
      </header>
      {definition.panel === "agent" ? (
        <AgentWorkspacePanel workspace={workspace} />
      ) : definition.panel === "reports" ? (
        <ReportShelfPanel definition={definition} status={status} workspace={workspace} />
      ) : (
        <ObjectStatusPanel definition={definition} status={status} workspace={workspace} />
      )}
    </aside>
  );
}

