import { isActiveJobStatus, type JobStatus } from "../api";

export const MARKET_MEMORY_ACTIVE_JOB_KEY = "folio.marketMemory.activeJob.v1";
const JOB_ID_PATTERN = /^job_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const JOB_STATUSES = new Set<JobStatus>([
  "queued", "running", "cancel_requested", "committing", "done", "cancelled", "failed",
  "failed_cancel", "failed_commit", "failed_restart", "failed_commit_recovery",
]);

export type MarketMemoryJob = {
  id: string;
  status: JobStatus;
  progress?: number;
  message?: string;
  error?: string;
  result?: Record<string, unknown>;
};

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type RecoveryResult =
  | { kind: "none" }
  | { kind: "active"; job: MarketMemoryJob }
  | { kind: "terminal"; job: MarketMemoryJob }
  | { kind: "unavailable"; id: string }
  | { kind: "invalid" };

function defaultStorage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function validJobId(value: unknown): value is string {
  return typeof value === "string" && JOB_ID_PATTERN.test(value);
}

function validJob(value: unknown, expectedId: string): value is MarketMemoryJob {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const job = value as Partial<MarketMemoryJob>;
  return job.id === expectedId && JOB_STATUSES.has(job.status as JobStatus);
}

export function clearMarketMemoryJobId(storage: StorageLike | null = defaultStorage()) {
  try {
    storage?.removeItem(MARKET_MEMORY_ACTIVE_JOB_KEY);
  } catch {
    // Storage denial must not break the running server job or UI.
  }
}

export function readMarketMemoryJobId(storage: StorageLike | null = defaultStorage()) {
  let value: string | null = null;
  try {
    value = storage?.getItem(MARKET_MEMORY_ACTIVE_JOB_KEY) ?? null;
  } catch {
    return null;
  }
  if (!value) return null;
  if (!validJobId(value)) {
    clearMarketMemoryJobId(storage);
    return null;
  }
  return value;
}

export function persistMarketMemoryJobId(jobId: string, storage: StorageLike | null = defaultStorage()) {
  if (!validJobId(jobId) || !storage) return false;
  try {
    storage.setItem(MARKET_MEMORY_ACTIVE_JOB_KEY, jobId);
    return storage.getItem(MARKET_MEMORY_ACTIVE_JOB_KEY) === jobId;
  } catch {
    return false;
  }
}

export async function recoverMarketMemoryJob(
  fetchJob: (jobId: string) => Promise<unknown>,
  storage: StorageLike | null = defaultStorage(),
): Promise<RecoveryResult> {
  const id = readMarketMemoryJobId(storage);
  if (!id) return { kind: "none" };
  let value: unknown;
  try {
    value = await fetchJob(id);
  } catch {
    return { kind: "unavailable", id };
  }
  if (!validJob(value, id)) {
    clearMarketMemoryJobId(storage);
    return { kind: "invalid" };
  }
  if (isActiveJobStatus(value.status)) return { kind: "active", job: value };
  clearMarketMemoryJobId(storage);
  return { kind: "terminal", job: value };
}
