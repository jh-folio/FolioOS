export const MARKET_STATE_STATUSES = ["current", "stale", "empty", "fallback"] as const;
export type MarketStateStatus = (typeof MARKET_STATE_STATUSES)[number];

export type MarketStateRef = {
  snapshotId: string | null;
  sourceKind: "snapshot" | "state_fallback" | "none";
  scope: "GLOBAL" | "US" | "KR";
  asOf: string | null;
  status: MarketStateStatus;
  freshnessReason: string;
  inputWatermark: string | null;
  relevantEvidenceWatermark: string | null;
  invalidWatermarkRows: number;
  resolvedAt: string;
  layer: "source-grounded";
};

export type MarketStateContextProjection = Pick<MarketStateRef, "status" | "asOf" | "freshnessReason" | "sourceKind" | "scope" | "resolvedAt">;

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function hasOwn(value: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function utcInstant(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value) && Number.isFinite(new Date(value).getTime());
}

const STALE_REASONS = new Set(["invalid_as_of", "future_as_of", "missing_input_watermark", "age_exceeded", "new_relevant_evidence", "update_failed"]);

export function readMarketStateRef(value: unknown): MarketStateRef | null {
  const container = record(value);
  const candidate = record(container?.marketStateRef) || record(record(container?.marketStateResolution)?.ref) || record(container?.ref);
  if (!candidate || !MARKET_STATE_STATUSES.includes(candidate.status as MarketStateStatus)) return null;
  const required = ["snapshotId", "sourceKind", "scope", "asOf", "status", "freshnessReason", "inputWatermark", "relevantEvidenceWatermark", "invalidWatermarkRows", "resolvedAt", "layer"];
  if (required.some((key) => !hasOwn(candidate, key))) return null;
  const sourceKind = candidate.sourceKind;
  const scope = candidate.scope;
  if (!(["snapshot", "state_fallback", "none"] as const).includes(sourceKind as MarketStateRef["sourceKind"])) return null;
  if (!(["GLOBAL", "US", "KR"] as const).includes(scope as MarketStateRef["scope"])) return null;
  if (candidate.layer !== "source-grounded" || !utcInstant(candidate.resolvedAt)) return null;
  if (!Number.isInteger(candidate.invalidWatermarkRows) || Number(candidate.invalidWatermarkRows) < 0) return null;
  if (candidate.inputWatermark !== null && typeof candidate.inputWatermark !== "string") return null;
  if (candidate.relevantEvidenceWatermark !== null && typeof candidate.relevantEvidenceWatermark !== "string") return null;
  if (candidate.relevantEvidenceWatermark !== null && !utcInstant(candidate.relevantEvidenceWatermark)) return null;
  const status = candidate.status as MarketStateStatus;
  const reason = candidate.freshnessReason;
  if (typeof reason !== "string") return null;
  if (status === "current" && (sourceKind !== "snapshot" || typeof candidate.snapshotId !== "string" || !candidate.snapshotId || !utcInstant(candidate.asOf) || reason !== "within_window")) return null;
  if (status === "current" && (candidate.inputWatermark !== null && !utcInstant(candidate.inputWatermark))) return null;
  if (status === "current" && ((candidate.inputWatermark === null) !== (candidate.relevantEvidenceWatermark === null))) return null;
  if (status === "stale" && (sourceKind !== "snapshot" || typeof candidate.snapshotId !== "string" || !candidate.snapshotId || !STALE_REASONS.has(reason))) return null;
  if (status === "stale" && reason !== "invalid_as_of" && !utcInstant(candidate.asOf)) return null;
  if (status === "fallback" && (sourceKind !== "state_fallback" || candidate.snapshotId !== null || (candidate.asOf !== null && !utcInstant(candidate.asOf)) || reason !== "state_fallback" || candidate.inputWatermark !== null)) return null;
  if (status === "empty" && (sourceKind !== "none" || candidate.snapshotId !== null || candidate.asOf !== null || reason !== "no_state" || candidate.inputWatermark !== null || candidate.relevantEvidenceWatermark !== null)) return null;
  return {
    snapshotId: typeof candidate.snapshotId === "string" ? candidate.snapshotId : null,
    sourceKind: sourceKind as MarketStateRef["sourceKind"],
    scope: scope as MarketStateRef["scope"],
    asOf: typeof candidate.asOf === "string" ? candidate.asOf : null,
    status,
    freshnessReason: reason,
    inputWatermark: typeof candidate.inputWatermark === "string" ? candidate.inputWatermark : null,
    relevantEvidenceWatermark: typeof candidate.relevantEvidenceWatermark === "string" ? candidate.relevantEvidenceWatermark : null,
    invalidWatermarkRows: Number.isFinite(Number(candidate.invalidWatermarkRows)) ? Number(candidate.invalidWatermarkRows) : 0,
    resolvedAt: candidate.resolvedAt as string,
    layer: "source-grounded",
  };
}

export function marketStateContextProjection(value: unknown): MarketStateContextProjection | null {
  const ref = readMarketStateRef(value);
  if (!ref) return null;
  return {
    status: ref.status,
    asOf: ref.asOf,
    freshnessReason: ref.freshnessReason,
    sourceKind: ref.sourceKind,
    scope: ref.scope,
    resolvedAt: ref.resolvedAt,
  };
}
