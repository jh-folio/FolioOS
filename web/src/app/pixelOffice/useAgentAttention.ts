import { useMemo, useState } from "react";
import type { AgentMessage } from "../agentWorkspace/types";
import type { OfficeJob } from "./types";

const ATTENTION_STORAGE_KEY = "folio.pixelOffice.attention.v1";

export type AgentAttentionItem = {
  id: string;
  kind: "job" | "proposal";
  tone: "success" | "error" | "approval";
  label: string;
};

function loadAcknowledged() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ATTENTION_STORAGE_KEY) || "{}") as { ids?: string[] };
    return new Set(Array.isArray(parsed.ids) ? parsed.ids.filter((id) => typeof id === "string").slice(-100) : []);
  } catch {
    return new Set<string>();
  }
}

function jobTime(job: OfficeJob) {
  return Date.parse(job.finishedAt || job.updatedAt || job.createdAt || "") || 0;
}

export function useAgentAttention(jobs: OfficeJob[], messages: AgentMessage[]) {
  const [acknowledged, setAcknowledged] = useState<Set<string>>(() => loadAcknowledged());

  const items = useMemo(() => {
    const cutoff = Date.now() - 12 * 60 * 60 * 1000;
    const jobItems: AgentAttentionItem[] = jobs
      .filter((job) => ["done", "failed"].includes(job.status) && jobTime(job) >= cutoff)
      .map((job) => ({
        id: `job:${job.id}`,
        kind: "job" as const,
        tone: job.status === "failed" ? "error" as const : "success" as const,
        label: job.status === "failed"
          ? `${job.label || "Agent 작업"} 실패 — 다시 확인해 주세요.`
          : `${job.label || "Agent 작업"} 완료`,
      }));
    const proposalItems: AgentAttentionItem[] = messages
      .filter((message) => message.proposal && message.proposalStatus === "pending")
      .map((message) => ({
        id: `proposal:${message.proposal!.id}`,
        kind: "proposal" as const,
        tone: "approval" as const,
        label: message.proposal?.summary || "검토할 수정 제안이 있습니다.",
      }));
    return [...proposalItems, ...jobItems].filter((item) => !acknowledged.has(item.id));
  }, [acknowledged, jobs, messages]);

  function persist(next: Set<string>) {
    setAcknowledged(next);
    try {
      window.localStorage.setItem(
        ATTENTION_STORAGE_KEY,
        JSON.stringify({ version: 1, ids: [...next].slice(-100), updatedAt: new Date().toISOString() }),
      );
    } catch {
      // Current-session acknowledgement still works without storage.
    }
  }

  return {
    items,
    acknowledge(id: string) {
      persist(new Set([...acknowledged, id]));
    },
    acknowledgeAll() {
      persist(new Set([...acknowledged, ...items.map((item) => item.id)]));
    },
  };
}

