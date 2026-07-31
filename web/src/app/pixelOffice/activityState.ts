import type { OfficeJob, OfficeObjectId } from "./types";

export type AgentActivityKind =
  | "ambient"
  | "collecting"
  | "analyzing"
  | "writing"
  | "listening"
  | "complete"
  | "error"
  | "generic_work";

export type AgentActivity = {
  kind: AgentActivityKind;
  label: string;
  anchor: OfficeObjectId;
  frame: number;
  working: boolean;
  jobId: string;
};

const AMBIENT: AgentActivity[] = [
  { kind: "ambient", label: "경제 노트를 읽는 중", anchor: "agent_seat", frame: 1, working: false, jobId: "" },
  { kind: "ambient", label: "시장 자료를 정리하는 중", anchor: "agent_seat", frame: 3, working: false, jobId: "" },
  { kind: "ambient", label: "다음 질문을 기다리는 중", anchor: "agent_seat", frame: 0, working: false, jobId: "" },
];

function normalizedKind(job: OfficeJob) {
  return `${job.kind} ${job.label}`.toLowerCase().replace(/-/g, "_");
}

function workingActivity(job: OfficeJob): AgentActivity {
  const kind = normalizedKind(job);
  if (/rss|index|evidence|intake/.test(kind)) {
    return { kind: "collecting", label: "새 자료를 수집하는 중", anchor: "news_desk", frame: 1, working: true, jobId: job.id };
  }
  if (/topic|research|company|analysis|analy/.test(kind)) {
    return { kind: "analyzing", label: "리서치 근거를 분석하는 중", anchor: "research_desk", frame: 2, working: true, jobId: job.id };
  }
  if (/briefing|report|proposal|write/.test(kind)) {
    return { kind: "writing", label: "보고서를 작성하는 중", anchor: "report_shelf", frame: 4, working: true, jobId: job.id };
  }
  if (/agent|chat|companion/.test(kind)) {
    return { kind: "listening", label: "질문을 검토하고 답변하는 중", anchor: "agent_seat", frame: 4, working: true, jobId: job.id };
  }
  return { kind: "generic_work", label: "작업을 처리하는 중", anchor: "agent_seat", frame: 4, working: true, jobId: job.id };
}

function timeValue(job: OfficeJob) {
  return Date.parse(job.finishedAt || job.updatedAt || job.createdAt || "") || 0;
}

export function resolveAgentActivity(
  jobs: OfficeJob[],
  attentionCount = 0,
  ambientIndex = 0,
  now = Date.now(),
): AgentActivity {
  const sorted = [...jobs].sort((a, b) => timeValue(b) - timeValue(a));
  const failed = sorted.find((job) => job.status === "failed" && now - timeValue(job) < 12 * 60 * 60 * 1000);
  if (failed || attentionCount > 0) {
    return {
      kind: "error",
      label: failed?.message || "확인이 필요한 작업이 있습니다.",
      anchor: "agent_seat",
      frame: 7,
      working: false,
      jobId: failed?.id || "",
    };
  }
  const running = sorted.find((job) => job.status === "running");
  if (running) return workingActivity(running);
  const queued = sorted.find((job) => job.status === "queued");
  if (queued) return { ...workingActivity(queued), label: "다음 작업을 준비하는 중" };
  const completed = sorted.find((job) => job.status === "done" && now - timeValue(job) < 10 * 60 * 1000);
  if (completed) {
    return {
      kind: "complete",
      label: "작업을 완료했습니다.",
      anchor: "agent_seat",
      frame: 6,
      working: false,
      jobId: completed.id,
    };
  }
  return AMBIENT[Math.abs(ambientIndex) % AMBIENT.length];
}
