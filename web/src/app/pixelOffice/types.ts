export type OfficeObjectId =
  | "news_desk"
  | "market_board"
  | "research_desk"
  | "report_shelf"
  | "memo_board"
  | "portfolio_monitor"
  | "agent_seat";

export type OfficeObjectState =
  | "loading"
  | "ready"
  | "busy"
  | "attention"
  | "empty"
  | "stale"
  | "unavailable"
  | "error";

export type OfficeObjectSummary = {
  id: OfficeObjectId;
  state: OfficeObjectState;
  summary: string;
  count: number;
  asOf: string;
  stale: boolean;
  notice: string;
};

export type PixelOfficePayload = {
  version: 1;
  generatedAt: string;
  objects: OfficeObjectSummary[];
  agent: {
    attentionCount: number;
    latestJobId: string;
    latestJobStatus: string;
  };
};

export type OfficeJob = {
  id: string;
  kind: string;
  label: string;
  status: "queued" | "running" | "done" | "failed" | "cancelled";
  progress?: number;
  message: string;
  createdAt: string;
  updatedAt: string;
  finishedAt: string;
};

export type OfficePanelKind = "status" | "reports" | "agent";

export type OfficeObjectDefinition = {
  id: OfficeObjectId;
  label: string;
  shortLabel: string;
  description: string;
  source: string;
  route: string;
  panel: OfficePanelKind;
  zone: string;
  symbol: string;
};

