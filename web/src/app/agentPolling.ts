import { getJson, isActiveJobStatus, type JobStatus } from "../api";

export const AGENT_POLL_INTERVAL_MS = 1_000;
export const AGENT_POLL_TIMEOUT_MS = 120_000;

export type PollableAgentJob = {
  id: string;
  status: JobStatus;
  message?: string;
  error?: string;
};

export class AgentPollTimeout<T extends PollableAgentJob = PollableAgentJob> extends Error {
  readonly name = "AgentPollTimeout";

  constructor(readonly job: T) {
    super("작업이 아직 실행 중입니다. 서버 작업은 계속되며 나중에 상태를 다시 확인할 수 있습니다.");
  }
}

export class AgentJobTerminalError<T extends PollableAgentJob = PollableAgentJob> extends Error {
  readonly name = "AgentJobTerminalError";

  constructor(readonly job: T) {
    super(job.message || job.error || `Agent 작업이 ${job.status} 상태로 종료되었습니다.`);
  }
}

export function replacePollController(
  controllers: Map<string, AbortController>,
  key: string,
  controller: AbortController,
) {
  const previous = controllers.get(key);
  if (previous !== controller) previous?.abort();
  controllers.set(key, controller);
}

export function releasePollController(
  controllers: Map<string, AbortController>,
  key: string,
  controller: AbortController,
) {
  if (controllers.get(key) !== controller) return false;
  controllers.delete(key);
  return true;
}

function waitForPoll(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Polling aborted", "AbortError"));
      return;
    }
    const timeoutId = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      window.clearTimeout(timeoutId);
      reject(new DOMException("Polling aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export async function pollAgentJobBounded<T extends PollableAgentJob>(
  job: T,
  options: {
    signal?: AbortSignal;
    timeoutMs?: number;
    intervalMs?: number;
    /** 진행 중인 상태를 매 폴링마다 알려준다. 몇 분 걸리는 작업(CLI 설치)에서 화면이
     *  아무 말도 없이 멈춰 있으면 사용자는 실패한 줄 안다. */
    onUpdate?: (current: T) => void;
  } = {},
): Promise<T> {
  const { signal, timeoutMs = AGENT_POLL_TIMEOUT_MS, intervalMs = AGENT_POLL_INTERVAL_MS, onUpdate } = options;
  const deadline = Date.now() + timeoutMs;
  let current = job;
  while (isActiveJobStatus(current.status)) {
    if (Date.now() >= deadline) throw new AgentPollTimeout(current);
    await waitForPoll(intervalMs, signal);
    current = await getJson<T>(`/api/jobs/${encodeURIComponent(current.id)}`, { signal });
    onUpdate?.(current);
  }
  if (current.status !== "done") throw new AgentJobTerminalError(current);
  return current;
}

export function pollAgentJobUntilTerminal<T extends PollableAgentJob>(
  job: T,
  options: { signal?: AbortSignal; intervalMs?: number } = {},
) {
  return pollAgentJobBounded(job, {
    ...options,
    timeoutMs: Number.POSITIVE_INFINITY,
  });
}
