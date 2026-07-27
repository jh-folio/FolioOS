export type JobStatus =
  | "queued"
  | "running"
  | "cancel_requested"
  | "committing"
  | "done"
  | "cancelled"
  | "failed"
  | "failed_cancel"
  | "failed_commit"
  | "failed_restart"
  | "failed_commit_recovery";

export const MARKET_STATE_POLICIES = ["exclude", "include_current"] as const;
export type MarketStatePolicy = (typeof MARKET_STATE_POLICIES)[number];

export const MARKET_STATE_SCOPES = ["AUTO", "GLOBAL", "US", "KR"] as const;
export type MarketStateScope = (typeof MARKET_STATE_SCOPES)[number];

export const EXECUTION_MODES = ["direct", "cli"] as const;
export type ExecutionMode = (typeof EXECUTION_MODES)[number];

export const CLI_ADAPTERS = ["auto", "codex", "claude", "antigravity"] as const;
export type CliAdapter = (typeof CLI_ADAPTERS)[number];

export const FALLBACK_POLICY = "rules_on_engine_failure" as const;

export type CollectionRef = {
  readonly id: string;
  readonly revision: number;
};

export const SMART_COLLECTION_MARKETS = ["ALL", "US", "KR", "GLOBAL", "UNKNOWN"] as const;
export type SmartCollectionMarket = (typeof SMART_COLLECTION_MARKETS)[number];

export type SmartCollectionFields = {
  readonly name: string;
  readonly query: string;
  readonly market: SmartCollectionMarket;
  readonly sources: readonly string[];
  readonly tickers: readonly string[];
  readonly tags: readonly string[];
};

export type SmartCollection = SmartCollectionFields & CollectionRef & {
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type SmartCollectionListEnvelope = {
  readonly schemaVersion: 1;
  readonly storeRevision: number;
  readonly recovered: boolean;
  readonly total: number;
  readonly items: readonly SmartCollection[];
};

export type SmartCollectionMutationEnvelope = {
  readonly storeRevision: number;
  readonly collection: SmartCollection;
};

export type SmartCollectionProviderId = {
  readonly provider: "index" | "rss";
  readonly id: string;
};

export type SmartCollectionPreviewItem = {
  readonly id: string;
  readonly providerIds: readonly SmartCollectionProviderId[];
  readonly title: string;
  readonly url: string;
  readonly source: string;
  readonly markets: readonly string[];
  readonly tickers: readonly string[];
  readonly tags: readonly string[];
  readonly publishedAt: string;
  readonly score: number;
  readonly snippet: string;
  readonly usability: "indexed" | "unindexed_rss";
};

export type SmartCollectionPreview = {
  readonly collectionId: string;
  readonly revision: number;
  readonly total: number;
  readonly limit: number;
  readonly items: readonly SmartCollectionPreviewItem[];
};

export type UpdateSmartCollectionRequest = SmartCollectionFields & { readonly expectedRevision: number };
export type DeleteSmartCollectionRequest = { readonly expectedRevision: number };
export type PreviewSmartCollectionRequest = { readonly expectedRevision: number; readonly limit: number };

export type PlanRequest = {
  readonly question: string;
  readonly userContext: string;
  readonly deepResearch: true;
  readonly customTickers: Readonly<Record<string, string>>;
  readonly marketStatePolicy: MarketStatePolicy;
  readonly marketStateScope: MarketStateScope;
  readonly collectionRef: CollectionRef | null;
};

export type AnalysisAxis = {
  readonly key: string;
  readonly label: string;
  readonly questions: readonly string[];
  readonly requiredData: readonly string[];
  readonly searchQueries: readonly string[];
};

export type DeepSubQuestion = {
  readonly id: string;
  readonly question: string;
  readonly axisKey: string;
  readonly round: 1 | 2;
  readonly searchQueries: readonly string[];
};

export type DeepResearchPlan = {
  readonly enabled: boolean;
  readonly maxRounds: 2;
  readonly subQuestions: readonly DeepSubQuestion[];
  readonly falsificationTriggers: readonly string[];
  readonly requiredOutputs: readonly string[];
};

export type TopicPlan = {
  readonly topic: string;
  readonly topicLabel: string;
  readonly reportType: string;
  readonly regions: readonly string[];
  readonly assetClasses: readonly string[];
  readonly timeHorizon: string;
  readonly userIntent: string;
  readonly researchQuestions: readonly string[];
  readonly analysisAxes: readonly AnalysisAxis[];
  readonly requiredMarketData: readonly string[];
  readonly requiredMacroData: readonly string[];
  readonly searchQueries: readonly string[];
  readonly memoryQueries: readonly string[];
  readonly candidateTickers: Readonly<Record<string, string>>;
  readonly expectedSections: readonly string[];
  readonly dataGapsLikely: readonly string[];
  readonly deepResearch: DeepResearchPlan;
};

export type CollectionDefinitionSnapshot = {
  readonly query: string;
  readonly market: string;
  readonly sources: readonly string[];
  readonly tickers: readonly string[];
  readonly tags: readonly string[];
};

export type ApprovedCollectionRef = CollectionRef & {
  readonly definitionHash: string;
  readonly definitionSnapshot: CollectionDefinitionSnapshot;
};

export type DegradedConfirmation = {
  readonly reasonCode: "no_index" | "zero_matches" | "filtered_empty";
  readonly resolutionFingerprint: string;
  readonly confirmed: true;
  readonly confirmedAt: string;
};

export type ApprovedRequest = {
  readonly schemaVersion: 1;
  readonly planRevision: 1;
  readonly asOfDate: string;
  readonly qualityMode: "diagnose_only";
  readonly question: string;
  readonly userContext: string;
  readonly contextLayer: "hypothesis";
  readonly deepResearch: boolean;
  readonly customTickers: Readonly<Record<string, string>>;
  readonly marketStatePolicy: MarketStatePolicy;
  readonly marketStateScope: MarketStateScope;
  readonly collectionRef: ApprovedCollectionRef | null;
  readonly topicPlan: TopicPlan;
  readonly degradedConfirmation: DegradedConfirmation | null;
  readonly planHash: string;
};

export type ApprovalGrant = {
  readonly id: string;
  readonly token: string;
  readonly expiresAt: string;
};

export type ApprovalReference = Pick<ApprovalGrant, "id" | "token">;

export type ProviderGenerations = {
  readonly indexGeneration: string | null;
  readonly rssGeneration: string | null;
};

export type UnusableCandidate = {
  readonly candidateId: string;
  readonly reason: "unindexed_rss";
};

export type ResolutionSnapshot = {
  readonly schemaVersion: 1;
  readonly collectionId: string | null;
  readonly collectionRevision: number | null;
  readonly collectionDefinitionHash: string | null;
  readonly eligibleTotal: number | null;
  readonly candidateCap: number | null;
  readonly truncated: boolean;
  readonly resolvedCandidateIds: readonly string[];
  readonly executionUniverseIds: readonly string[];
  readonly unusableCandidates: readonly UnusableCandidate[];
  readonly selectedEvidenceIds: readonly string[];
  readonly providerGenerations: ProviderGenerations;
  readonly inputWatermark: string | null;
};

export type ZeroEvidence = {
  readonly required: boolean;
  readonly reasonCode: "no_index" | "zero_matches" | "filtered_empty" | null;
  readonly resolutionFingerprint: string | null;
};

export type ResearchPreview = {
  readonly resolution: ResolutionSnapshot;
  readonly resolvedAt: string;
  readonly zeroEvidence: ZeroEvidence;
};

export type PlanPreviewEnvelope = {
  readonly approvedRequest: ApprovedRequest;
  readonly approval: ApprovalGrant;
  readonly preview: ResearchPreview;
};

export type ExecutionRequest = {
  readonly mode: ExecutionMode;
  readonly adapter: CliAdapter;
  readonly fallbackPolicy: typeof FALLBACK_POLICY;
};

export type GenerateApprovedRequest = {
  readonly approvedRequest: ApprovedRequest;
  readonly approval: ApprovalReference;
  readonly execution: ExecutionRequest;
};

export type ConfirmDegradedRequest = {
  readonly approvedRequest: ApprovedRequest;
  readonly approval: ApprovalReference;
  readonly reasonCode: "no_index" | "zero_matches" | "filtered_empty";
  readonly resolutionFingerprint: string;
  readonly confirmed: true;
};

export type WorkLogFilter = "all" | "companion" | "task";
export type WorkLogProposalStatus = "pending" | "applying" | "applied" | "rejected" | "stale" | "conflict" | "failed_apply" | "unavailable";
export type WorkLogEntry = {
  readonly id: string;
  readonly jobId: string;
  readonly category: "companion" | "task";
  readonly kind: "index" | "rss" | "setup" | "agent_bridge" | "agent_cli_install" | "briefing" | "company_analysis" | "topic_report" | "market_state_snapshot";
  readonly taskType: "index" | "rss" | "setup" | "companion" | "briefing" | "company_analysis" | "topic_report" | "personal_overlay" | "thesis_delta" | "market_memory_llm" | "market_state_snapshot" | "market_memory_update" | "quality_repair" | "investment_review";
  readonly labelCode: "index_rebuild" | "rss_import" | "setup" | "agent_chat" | "agent_cli_install" | "agent_task" | "briefing" | "company_analysis" | "topic_report" | "market_state";
  readonly status: JobStatus;
  readonly progress: number;
  readonly messageCode: JobStatus;
  readonly createdAt: string;
  readonly startedAt: string | null;
  readonly updatedAt: string;
  readonly finishedAt: string | null;
  readonly errorCode: "adapter_unavailable" | "adapter_failed" | "validation_failed" | "save_failed" | "cancel_failed" | "restart_interrupted" | "commit_recovery_failed" | "private_cleanup_failed" | "store_unavailable" | "internal_error" | null;
  readonly generationMode: "llm_api" | "llm_cli" | "rules" | "none";
  readonly adapter: "auto" | "codex" | "claude" | "antigravity" | "openai_api" | "gemini_api" | "claude_api" | "rules" | "none";
  readonly requestedMode: "direct" | "cli" | null;
  readonly mode: "collect" | "index" | "install" | "answer" | "generate" | "revise" | "fallback";
  readonly attemptedEngine: "api" | "cli" | "rules" | "none" | null;
  readonly finalEngine: "api" | "cli" | "rules" | "none" | null;
  readonly fallbackReason: "engine_unavailable" | "engine_failed" | "confirmed_zero_evidence" | null;
  readonly artifactTypes: readonly string[];
  readonly artifactCount: number;
  readonly proposalId: string | null;
  readonly proposalStatus: WorkLogProposalStatus | null;
  readonly resultStatus: "done" | "cancelled" | "failed" | null;
};

export type WorkLogList = {
  readonly schemaVersion: 1;
  readonly storeRevision: number;
  readonly jobsStoreRevision: number;
  readonly retention: { readonly maxEntries: 200; readonly maxDays: 30 };
  readonly total: number;
  readonly entries: readonly WorkLogEntry[];
};
export type WorkLogClearPreview = { readonly previewToken: string; readonly scope: WorkLogFilter; readonly count: number; readonly jobsStoreRevision: number; readonly expiresAt: string };
export type WorkLogClearResponse = { readonly scope: WorkLogFilter; readonly hiddenCount: number; readonly jobsStoreRevision: number; readonly storeRevision: number };
export type WorkLogMigrationPreview = { readonly previewToken: string; readonly legacyJobs: number; readonly migratableJobs: number; readonly collisions: readonly { readonly legacyId: string; readonly reason: "id_collision" }[]; readonly jobsStoreRevision: number; readonly expiresAt: string };
export type WorkLogMigrationResponse = { readonly migratedJobs: number; readonly derivedVisibleEntries: number; readonly keptOriginal: boolean; readonly deletedOriginal: boolean; readonly jobsStoreRevision: number; readonly storeRevision: number };

export type AgentProposalRecord = {
  readonly schemaVersion: 2;
  readonly id: string;
  readonly reportKind: string;
  readonly reportId: string;
  readonly marketScope: "both" | "us" | "kr" | "none";
  readonly status: Exclude<WorkLogProposalStatus, "unavailable">;
  readonly summary: string | null;
  readonly diff: string | null;
  readonly revisedMarkdown: string | null;
  readonly userRequest: string | null;
};

export const WORK_LOG_ENTRY_KEYS = ["id", "jobId", "category", "kind", "taskType", "labelCode", "status", "progress", "messageCode", "createdAt", "startedAt", "updatedAt", "finishedAt", "errorCode", "generationMode", "adapter", "requestedMode", "mode", "attemptedEngine", "finalEngine", "fallbackReason", "artifactTypes", "artifactCount", "proposalId", "proposalStatus", "resultStatus"] as const;
const WORK_LOG_LIST_KEYS = ["schemaVersion", "storeRevision", "jobsStoreRevision", "retention", "total", "entries"] as const;
const RETENTION_KEYS = ["maxEntries", "maxDays"] as const;
const WORK_LOG_CATEGORIES = new Set(["companion", "task"]);
const WORK_LOG_KINDS = new Set(["index", "rss", "setup", "agent_bridge", "agent_cli_install", "briefing", "company_analysis", "topic_report", "market_state_snapshot"]);
const WORK_LOG_TASK_TYPES = new Set(["index", "rss", "setup", "companion", "briefing", "company_analysis", "topic_report", "personal_overlay", "thesis_delta", "market_memory_llm", "market_state_snapshot", "market_memory_update", "quality_repair", "investment_review"]);
const WORK_LOG_LABEL_CODES = new Set(["index_rebuild", "rss_import", "setup", "agent_chat", "agent_cli_install", "agent_task", "briefing", "company_analysis", "topic_report", "market_state"]);
const WORK_LOG_STATUSES = new Set(["queued", "running", "cancel_requested", "committing", "done", "cancelled", "failed", "failed_cancel", "failed_commit", "failed_restart", "failed_commit_recovery"]);
const WORK_LOG_GENERATION_MODES = new Set(["llm_api", "llm_cli", "rules", "none"]);
const WORK_LOG_ADAPTERS = new Set(["auto", "codex", "claude", "antigravity", "openai_api", "gemini_api", "claude_api", "rules", "none"]);
const WORK_LOG_REQUESTED_MODES = new Set(["direct", "cli"]);
const WORK_LOG_MODES = new Set(["collect", "index", "install", "answer", "generate", "revise", "fallback"]);
const WORK_LOG_ENGINES = new Set(["api", "cli", "rules", "none"]);
const WORK_LOG_FALLBACK_REASONS = new Set(["engine_unavailable", "engine_failed", "confirmed_zero_evidence"]);
const WORK_LOG_ERROR_CODES = new Set(["adapter_unavailable", "adapter_failed", "validation_failed", "save_failed", "cancel_failed", "restart_interrupted", "commit_recovery_failed", "private_cleanup_failed", "store_unavailable", "internal_error"]);
const WORK_LOG_PROPOSAL_STATUSES = new Set(["pending", "applying", "applied", "rejected", "stale", "conflict", "failed_apply", "unavailable"]);
const WORK_LOG_RESULT_STATUSES = new Set(["done", "cancelled", "failed"]);
const UTC_Z = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$/;

function hasExactKeys(value: unknown, keys: readonly string[]): value is Readonly<Record<string, unknown>> {
  if (!isRecord(value)) return false;
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function isWorkLogEntry(value: unknown): value is WorkLogEntry {
  if (!hasExactKeys(value, WORK_LOG_ENTRY_KEYS)) return false;
  const nullableIn = (item: unknown, values: ReadonlySet<string>) => item === null || values.has(item as string);
  const nullableUtc = (item: unknown) => item === null || (typeof item === "string" && UTC_Z.test(item));
  return typeof value.id === "string" && /^wl_[0-9a-f]{24}$/.test(value.id) && typeof value.jobId === "string"
    && WORK_LOG_CATEGORIES.has(value.category as string) && WORK_LOG_KINDS.has(value.kind as string)
    && WORK_LOG_TASK_TYPES.has(value.taskType as string) && WORK_LOG_LABEL_CODES.has(value.labelCode as string)
    && WORK_LOG_STATUSES.has(value.status as string) && Number.isInteger(value.progress) && (value.progress as number) >= 0 && (value.progress as number) <= 100
    && WORK_LOG_STATUSES.has(value.messageCode as string) && typeof value.createdAt === "string" && UTC_Z.test(value.createdAt)
    && typeof value.updatedAt === "string" && UTC_Z.test(value.updatedAt) && nullableUtc(value.startedAt) && nullableUtc(value.finishedAt)
    && nullableIn(value.errorCode, WORK_LOG_ERROR_CODES) && WORK_LOG_GENERATION_MODES.has(value.generationMode as string)
    && WORK_LOG_ADAPTERS.has(value.adapter as string) && nullableIn(value.requestedMode, WORK_LOG_REQUESTED_MODES)
    && WORK_LOG_MODES.has(value.mode as string) && nullableIn(value.attemptedEngine, WORK_LOG_ENGINES) && nullableIn(value.finalEngine, WORK_LOG_ENGINES)
    && nullableIn(value.fallbackReason, WORK_LOG_FALLBACK_REASONS) && Array.isArray(value.artifactTypes)
    && value.artifactTypes.every((item) => typeof item === "string") && Number.isInteger(value.artifactCount) && (value.artifactCount as number) >= 0
    && (value.proposalId === null || typeof value.proposalId === "string") && nullableIn(value.proposalStatus, WORK_LOG_PROPOSAL_STATUSES)
    && nullableIn(value.resultStatus, WORK_LOG_RESULT_STATUSES);
}

export function parseWorkLogList(value: unknown): WorkLogList {
  if (!hasExactKeys(value, WORK_LOG_LIST_KEYS) || value.schemaVersion !== 1 || !Number.isInteger(value.storeRevision) || !Number.isInteger(value.jobsStoreRevision) || !Number.isInteger(value.total) || !Array.isArray(value.entries) || !value.entries.every(isWorkLogEntry) || !hasExactKeys(value.retention, RETENTION_KEYS) || value.retention.maxEntries !== 200 || value.retention.maxDays !== 30) {
    throw new Error("work_log_contract_invalid");
  }
  return value as WorkLogList;
}

export type ApiErrorPayload = Readonly<Record<string, unknown>>;

export class ApiRequestError extends Error {
  readonly name = "ApiRequestError";

  constructor(
    readonly path: string,
    readonly status: number,
    readonly code: string,
    readonly payload: ApiErrorPayload | null,
  ) {
    super(`${path} failed: ${status}${code ? ` (${code})` : ""}`);
  }
}

export function isActiveJobStatus(status: JobStatus): boolean {
  return status === "queued" || status === "running" || status === "cancel_requested" || status === "committing";
}

export type JsonRequestOptions = {
  readonly signal?: AbortSignal;
};

function isRecord(value: unknown): value is ApiErrorPayload {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function parseJson<T>(res: Response): Promise<T | null> {
  try {
    const payload: unknown = await res.json();
    return payload as T;
  } catch {
    return null;
  }
}

async function requestJson<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  const payload = await parseJson<T>(res);
  if (!res.ok) {
    const record = isRecord(payload) ? payload : null;
    const rawCode = record?.error;
    const code = typeof rawCode === "string" ? rawCode : "request_failed";
    throw new ApiRequestError(path, res.status, code, record);
  }
  if (payload === null) throw new Error(`${path} returned an empty response`);
  return payload;
}

export async function getJson<T>(path: string, options: JsonRequestOptions = {}): Promise<T> {
  return requestJson<T>(path, {
    headers: { "Content-Type": "application/json" },
    signal: options.signal,
  });
}

export async function postJson<T>(path: string, body: unknown, options: JsonRequestOptions = {}): Promise<T> {
  return requestJson<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: options.signal,
  });
}

export async function putJson<T>(path: string, body: unknown, options: JsonRequestOptions = {}): Promise<T> {
  return requestJson<T>(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: options.signal,
  });
}

export async function deleteJson<T>(path: string, body: unknown, options: JsonRequestOptions = {}): Promise<T> {
  return requestJson<T>(path, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: options.signal,
  });
}
