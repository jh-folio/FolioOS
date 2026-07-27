import { ApiRequestError, getJson, postJson } from "../api";

export const PROPOSAL_LIFECYCLE_EVENT = "folio:proposal-lifecycle";
export const MAX_PROPOSAL_SUMMARY_CHARS = 1_000;
export const MAX_PROPOSAL_DIFF_CHARS = 12_000;
export const PROPOSAL_HYDRATION_ERROR_NOTICE = "수정 제안을 불러오지 못했습니다. Agent 작업 기록에서 다시 확인해 주세요.";

export type ProposalLifecycleStatus = "pending" | "applying" | "applied" | "rejected" | "stale" | "conflict" | "failed_apply";

export type ProposalLifecycleResult = {
  proposalId: string;
  status: ProposalLifecycleStatus;
  reportKind: "briefing" | "company_analysis" | "topic_report";
  reportId: string;
  marketScope: "both" | "us" | "kr" | "none";
  targetRevision: { number: number; hash: string } | null;
};

export type ProposalAction = "approve" | "reject";

export type HydratedAgentProposal = {
  id: string;
  summary: string;
  diff: string;
  artifactKind: ProposalLifecycleResult["reportKind"];
  artifactId: string;
  marketScope: ProposalLifecycleResult["marketScope"];
};

export type AgentProposalHydration = {
  proposal: HydratedAgentProposal | null;
  proposalStatus: "pending" | "applying" | "";
  notice: string;
};

export type ProposalHydrationTransport = {
  get: (path: string) => Promise<unknown>;
};

export type ProposalActionTransport = {
  post: (path: string, body: { action: ProposalAction }) => Promise<unknown>;
  get: (path: string) => Promise<unknown>;
};

const TERMINAL = new Set<ProposalLifecycleStatus>(["applied", "rejected", "stale", "conflict", "failed_apply"]);
const STATUSES: ReadonlySet<string> = new Set(["pending", "applying", ...TERMINAL]);
const REPORT_KINDS: ReadonlySet<string> = new Set(["briefing", "company_analysis", "topic_report"]);
const MARKET_SCOPES: ReadonlySet<string> = new Set(["both", "us", "kr", "none"]);
const ACTION_KEYS = ["marketScope", "proposalId", "reportId", "reportKind", "status", "targetRevision"].sort();
const REVISION_KEYS = ["hash", "number"].sort();
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const PROPOSAL_ID_PATTERN = /^(?:[0-9a-f]{12}|[0-9a-f]{32})$/;
const EMPTY_PROPOSAL_HYDRATION: AgentProposalHydration = { proposal: null, proposalStatus: "", notice: "" };

export function boundedProposalSummary(value?: string | null) {
  return String(value || "").slice(0, MAX_PROPOSAL_SUMMARY_CHARS);
}

export function boundedProposalDiff(value?: string | null) {
  return String(value || "").slice(0, MAX_PROPOSAL_DIFF_CHARS);
}

function invalidProposalContract(): never {
  throw new Error("proposal_contract_invalid");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: unknown, expected: readonly string[]): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  const keys = Object.keys(value).sort();
  return keys.length === expected.length && keys.every((key, index) => key === expected[index]);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isProposalStatus(value: unknown): value is ProposalLifecycleStatus {
  return typeof value === "string" && STATUSES.has(value);
}

function isReportKind(value: unknown): value is ProposalLifecycleResult["reportKind"] {
  return typeof value === "string" && REPORT_KINDS.has(value);
}

function isMarketScope(value: unknown): value is ProposalLifecycleResult["marketScope"] {
  return typeof value === "string" && MARKET_SCOPES.has(value);
}

function invalidProposalHydration(): AgentProposalHydration {
  return { proposal: null, proposalStatus: "", notice: PROPOSAL_HYDRATION_ERROR_NOTICE };
}

function parseActiveProposalRecord(value: unknown, expectedId: string): AgentProposalHydration {
  if (
    !isRecord(value)
    || value.schemaVersion !== 2
    || value.id !== expectedId
    || !PROPOSAL_ID_PATTERN.test(expectedId)
    || (value.status !== "pending" && value.status !== "applying")
    || !isReportKind(value.reportKind)
    || !isNonEmptyString(value.reportId)
    || !isMarketScope(value.marketScope)
    || typeof value.summary !== "string"
    || typeof value.diff !== "string"
  ) invalidProposalContract();
  return {
    proposal: {
      id: expectedId,
      summary: value.summary,
      diff: value.diff,
      artifactKind: value.reportKind,
      artifactId: value.reportId,
      marketScope: value.marketScope,
    },
    proposalStatus: value.status,
    notice: "",
  };
}

export async function hydrateAgentProposalFromResult(
  result: unknown,
  transport: ProposalHydrationTransport = { get: (path) => getJson<unknown>(path) },
): Promise<AgentProposalHydration> {
  if (!isRecord(result) || !("proposalId" in result)) return EMPTY_PROPOSAL_HYDRATION;
  if (result.proposalId === null || result.proposalId === "") return EMPTY_PROPOSAL_HYDRATION;
  if (typeof result.proposalId !== "string" || !PROPOSAL_ID_PATTERN.test(result.proposalId)) {
    return invalidProposalHydration();
  }
  const proposalId = result.proposalId;
  try {
    const record = await transport.get(`/api/agent/proposals/${encodeURIComponent(proposalId)}`);
    return parseActiveProposalRecord(record, proposalId);
  } catch {
    return invalidProposalHydration();
  }
}

function parseTargetRevision(value: unknown): ProposalLifecycleResult["targetRevision"] {
  if (value === null) return null;
  if (
    !hasExactKeys(value, REVISION_KEYS)
    || typeof value.number !== "number"
    || !Number.isInteger(value.number)
    || value.number < 1
    || typeof value.hash !== "string"
    || !SHA256_PATTERN.test(value.hash)
  ) invalidProposalContract();
  return { number: value.number, hash: value.hash };
}

function normalizeProposalResult(value: unknown, allowRecordId: boolean): ProposalLifecycleResult {
  if (!isRecord(value) || !isProposalStatus(value.status) || !isReportKind(value.reportKind) || !isMarketScope(value.marketScope)) {
    invalidProposalContract();
  }
  const proposalId = isNonEmptyString(value.proposalId)
    ? value.proposalId
    : allowRecordId && isNonEmptyString(value.id)
      ? value.id
      : invalidProposalContract();
  if (!isNonEmptyString(value.reportId)) invalidProposalContract();
  return {
    proposalId,
    status: value.status,
    reportKind: value.reportKind,
    reportId: value.reportId,
    marketScope: value.marketScope,
    targetRevision: parseTargetRevision(value.targetRevision),
  };
}

export function parseProposalActionResult(value: unknown, action: ProposalAction) {
  if (!hasExactKeys(value, ACTION_KEYS)) invalidProposalContract();
  const result = normalizeProposalResult(value, false);
  const expectedStatus = action === "approve" ? "applied" : action === "reject" ? "rejected" : invalidProposalContract();
  if (result.status !== expectedStatus) invalidProposalContract();
  return result;
}

export async function performProposalAction(
  proposalId: string,
  action: ProposalAction,
  transport: ProposalActionTransport,
) {
  if (!isNonEmptyString(proposalId) || (action !== "approve" && action !== "reject")) invalidProposalContract();
  const path = `/api/agent/proposals/${encodeURIComponent(proposalId)}`;
  try {
    return parseProposalActionResult(await transport.post(path, { action }), action);
  } catch (error) {
    if (!(error instanceof ApiRequestError) || (error.status >= 200 && error.status < 300)) throw error;
    let result: ProposalLifecycleResult;
    try {
      result = normalizeProposalResult(await transport.get(path), true);
    } catch {
      throw error;
    }
    if (!TERMINAL.has(result.status)) throw error;
    return result;
  }
}

export function actOnProposal(proposalId: string, action: ProposalAction) {
  return performProposalAction(proposalId, action, {
    post: (path, body) => postJson<unknown>(path, body),
    get: (path) => getJson<unknown>(path),
  });
}

export function notifyProposalLifecycle(result: ProposalLifecycleResult) {
  window.dispatchEvent(new CustomEvent<ProposalLifecycleResult>(PROPOSAL_LIFECYCLE_EVENT, { detail: result }));
}

export function proposalTargetsContext(result: ProposalLifecycleResult, context: Record<string, unknown> | undefined) {
  if (result.status !== "applied" || !context) return false;
  if (context.reportKind !== result.reportKind || String(context.reportId || "") !== result.reportId) return false;
  if (result.reportKind !== "briefing") return true;
  return String(context.marketScope || "") === result.marketScope;
}
