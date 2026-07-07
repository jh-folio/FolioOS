export type LegacyBridge = {
  updateAgentContext?: (patch: Record<string, unknown>) => void;
  applyAgentBranding?: () => void;
  openAgentDock?: (context?: Record<string, unknown>) => void;
  readStatus?: () => {
    statusText?: string;
    docCount?: string;
    activeJobId?: string | null;
  };
  // 레거시 렌더러 재사용(표/링크/차트/소스패널 parity)
  renderMarkdown?: (markdown: string) => string;
  splitReportTitle?: (markdown: string) => { title: string | null; body: string };
  briefingSourcePanelHtml?: (briefing: unknown) => string;
  renderBriefingVisuals?: (article: HTMLElement, briefing: unknown) => void;
  cleanupBriefingVisuals?: () => void;
};

declare global {
  interface Window {
    FolioBridge?: LegacyBridge;
  }
}

export function legacyBridge(): LegacyBridge {
  return window.FolioBridge ?? {};
}
