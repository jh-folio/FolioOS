import type { AgentAdapterSettings, AgentJob, AgentSettings, RecentReport } from "./types";

const PROVIDERS = new Set(["codex", "claude", "antigravity"]);
const AGENT_MANAGED_JOB_KINDS = new Set(["agent_bridge", "rss"]);

export function effortLabel(value: string) {
  if (value === "high") return "높음";
  if (value === "low") return "낮음";
  if (value === "max") return "최대";
  return "중간";
}

export function elapsedSeconds(startedAt: number) {
  return `${Math.max(1, Math.round((Date.now() - startedAt) / 1000))}초`;
}

export function isAgentManagedJob(job: AgentJob) {
  const label = `${job.label || ""} ${job.message || ""}`;
  return AGENT_MANAGED_JOB_KINDS.has(String(job.kind || "")) || /^LLM CLI|Agent/.test(label);
}

export function formatJobTime(job: AgentJob) {
  const value = job.finishedAt || job.updatedAt || job.createdAt || "";
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value.slice(0, 16);
  }
}

export function jobArtifactRoute(job: AgentJob) {
  const result = job.result || {};
  const artifactType = result.artifactType || "";
  const artifactId = result.artifactId || result.reportId || "";
  const date = result.date || "";
  if (artifactType === "briefing" && date) return `#/briefing/${date}/both`;
  if (artifactType === "company_analysis" && artifactId) return `#/analysis/${encodeURIComponent(artifactId)}`;
  if (artifactType === "topic_report" && artifactId) return `#/deep-research/${encodeURIComponent(artifactId)}`;
  if (String(job.label || "").includes("RSS")) return "#/rss";
  return "";
}

export function selectedAdapter(settings: AgentSettings | null): AgentAdapterSettings | null {
  const provider = settings?.provider && PROVIDERS.has(settings.provider)
    ? settings.provider
    : settings?.selectedAdapter || "";
  return settings?.adapters?.find((adapter) => adapter.id === provider) || null;
}

export function modelChoicesFor(adapter: AgentAdapterSettings | null) {
  return adapter?.modelChoices || [];
}

export function preferredModel(adapter: AgentAdapterSettings | null) {
  const choices = modelChoicesFor(adapter);
  if (!choices.length) return "";
  return choices.some((choice) => choice.value === adapter?.model) ? String(adapter?.model || "") : choices[0].value;
}

export function isJobResponse(value: unknown): value is AgentJob {
  const job = value as AgentJob;
  return Boolean(job?.id && ["queued", "running"].includes(job.status));
}

export function reportRoute(report: RecentReport) {
  const view = String(report.view || "").trim();
  const scope = report.marketScope === "us" || report.marketScope === "kr" || report.marketScope === "both"
    ? report.marketScope
    : report.scope === "us" || report.scope === "kr" || report.scope === "both"
      ? report.scope
      : "both";
  if (view === "briefing" && /^\d{4}-\d{2}-\d{2}$/.test(String(report.date || ""))) {
    return `#/briefing/${report.date}/${scope}`;
  }
  const routeByView: Record<string, string> = {
    review: "dashboard",
    dashboard: "dashboard",
    briefing: "briefing",
    rssfeed: "rss",
    memory: "market-memory",
    analysis: "analysis",
    topicrpt: "deep-research",
    watchlist: "watchlist",
    settings: "settings",
  };
  return `#/${routeByView[view] || "dashboard"}`;
}

export function recentKey(report: RecentReport, index: number) {
  return `${report.view || "report"}-${report.date || ""}-${report.title || index}`;
}

