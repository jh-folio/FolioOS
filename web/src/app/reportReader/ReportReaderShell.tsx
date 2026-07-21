import { ReactNode, useEffect, useState } from "react";
import { updateReactAgentContext, type AgentContextPatch } from "../agentContext";
import { FolioNotePanel, type FolioNoteIdentity } from "./FolioNotePanel";

type ReportReaderShellProps = {
  eyebrow?: string;
  title: string;
  meta?: string;
  breadcrumb: ReactNode;
  actionSlot?: ReactNode;
  noteSlot?: ReactNode;
  noteIdentity?: FolioNoteIdentity;
  noteLinkedTitle?: string;
  noteOverlayMarkdown?: string;
  agentContext?: AgentContextPatch;
  onClose?: () => void;
  children: ReactNode;
};

export function ReportReaderShell({
  eyebrow,
  title,
  breadcrumb,
  actionSlot,
  noteSlot,
  noteIdentity,
  noteLinkedTitle,
  noteOverlayMarkdown,
  agentContext,
  onClose,
  children,
}: ReportReaderShellProps) {
  const [mobileNoteOpen, setMobileNoteOpen] = useState(false);
  const resolvedNoteSlot = noteSlot ?? (noteIdentity ? (
    <FolioNotePanel
      identity={noteIdentity}
      linkedTitle={noteLinkedTitle || title}
      overlayMarkdown={noteOverlayMarkdown || ""}
    />
  ) : null);
  const agentContextKey = agentContext ? JSON.stringify(agentContext) : "";
  const stageClass = [
    "report-reader-stage",
    !actionSlot && !resolvedNoteSlot ? "no-side" : "",
    !actionSlot ? "no-rail" : "",
    !resolvedNoteSlot ? "no-note" : "",
  ].filter(Boolean).join(" ");

  useEffect(() => {
    if (agentContextKey) updateReactAgentContext(agentContext || {});
  }, [agentContext, agentContextKey]);

  return (
    <div className="report-reader-shell report-reader-inline" data-report-reader-shell>
      <div className="reader-breadcrumb report-reader-breadcrumb">{breadcrumb}</div>
      <div className={stageClass}>
        <main className="report-reader-dialog report-reader-main" aria-label="보고서 리더">
          <div className="report-reader-head">
            {onClose && (
              <button className="icon-btn" type="button" onClick={onClose} aria-label="리더 닫기" data-tooltip="닫기" data-tooltip-pos="left">
                ×
              </button>
            )}
          </div>
          <div className="report-reader-body">
            <section className="report-hero react-report-hero">
              {eyebrow && <p className="report-kicker">{eyebrow}</p>}
              <h1>{title}</h1>
            </section>
            <article className="headline react-report-card">{children}</article>
          </div>
        </main>
          {actionSlot && (
            <aside className="report-reader-rail" aria-label="보고서 조작 패널">
              {actionSlot}
            </aside>
          )}
        {resolvedNoteSlot && (
          <>
            <button
              className={mobileNoteOpen ? "report-note-grip is-open" : "report-note-grip"}
              type="button"
              aria-label="투자 노트 열기"
              aria-controls="report-reader-note-panel"
              aria-expanded={mobileNoteOpen}
              onClick={() => setMobileNoteOpen(true)}
            />
            <aside
              id="report-reader-note-panel"
              className={mobileNoteOpen ? "report-note-panel is-open" : "report-note-panel"}
              aria-label="투자 노트"
            >
              <div className="report-note-inner">
                <button
                  className="report-note-mobile-close"
                  type="button"
                  aria-label="투자 노트 닫기"
                  onClick={() => setMobileNoteOpen(false)}
                >
                  ×
                </button>
                {resolvedNoteSlot}
              </div>
            </aside>
          </>
        )}
      </div>
    </div>
  );
}
