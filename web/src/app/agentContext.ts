import type { LegacyBridge } from "./legacyBridge";

export type AgentContextPatch = Record<string, unknown>;

declare global {
  interface Window {
    FolioAgent?: {
      currentContext?: AgentContextPatch;
    };
    FolioBridge?: LegacyBridge;
  }
}

export function updateReactAgentContext(patch: AgentContextPatch = {}) {
  const current = window.FolioAgent?.currentContext || {};
  const next = { ...current, ...patch };
  window.FolioAgent = { ...(window.FolioAgent || {}), currentContext: next };
  return next;
}

export function openReactAgentDock(context: AgentContextPatch = {}) {
  updateReactAgentContext(context);
  window.FolioBridge?.openAgentDock?.(context);
}
