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
