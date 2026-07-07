import { useState } from "react";
import { postJson } from "../api";
import { MarketStateDashboard } from "../islands/MarketStateDashboard";
import { RouteHero } from "./RouteHero";

type AgentJob = {
  id: string;
  kind?: string;
  status: "queued" | "running" | "done" | "failed" | "cancelled";
  message?: string;
  error?: string;
  result?: Record<string, unknown>;
};

type MemoryResult = {
  ok?: boolean;
  status?: string;
  message?: string;
  snapshot?: { headline?: string };
  snapshotId?: string;
  title?: string;
  savedCount?: number;
  estimatedInputTokens?: number;
  rawEntryCount?: number;
  droppedCount?: number;
};

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function resultMessage(result: MemoryResult) {
  if (result.snapshot?.headline) {
    return result.message || `시장 상태 스냅샷을 저장했습니다: ${result.snapshot.headline}`;
  }
  if (result.snapshotId || result.title) {
    return result.message || `시장 상태 스냅샷을 저장했습니다${result.title ? `: ${result.title}` : ""}`;
  }
  const base = result.message || (result.ok ? "시장 내러티브를 정리했습니다." : "시장 내러티브 정리가 완료되었습니다.");
  const saved = Number.isFinite(Number(result.savedCount)) ? ` 저장 ${result.savedCount}건` : "";
  const tokenNote = result.estimatedInputTokens ? ` · 입력 약 ${result.estimatedInputTokens} tokens` : "";
  const diagnostic = result.rawEntryCount !== undefined ? ` · 응답 ${result.rawEntryCount}건 · 제외 ${result.droppedCount || 0}건` : "";
  return `${base}${saved}${tokenNote}${diagnostic}`;
}

function isAgentJob(value: unknown): value is AgentJob {
  const job = value as AgentJob;
  return Boolean(job?.id && ["queued", "running"].includes(job.status));
}

async function pollJob(job: AgentJob): Promise<AgentJob> {
  let current = job;
  while (["queued", "running"].includes(current.status)) {
    await sleep(1000);
    current = await fetch(`/api/jobs/${encodeURIComponent(current.id)}`).then((res) => {
      if (!res.ok) throw new Error(`/api/jobs/${encodeURIComponent(current.id)} failed: ${res.status}`);
      return res.json() as Promise<AgentJob>;
    });
  }
  if (current.status !== "done") {
    throw new Error(current.message || current.error || "시장 내러티브 정리에 실패했습니다.");
  }
  return current;
}

async function runMemoryUpdate(): Promise<MemoryResult> {
  const response = await postJson<MemoryResult | AgentJob>("/api/memory/update", {
    date: todayIsoDate(),
  });
  if (isAgentJob(response)) {
    const done = await pollJob(response);
    return (done.result || {}) as MemoryResult;
  }
  return response;
}

export function MarketMemoryRoute() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function runMarketMemoryUpdate() {
    setBusy(true);
    setError("");
    setStatus("AI Agent가 단기 뉴스와 기존 중기 메모리를 업데이트하는 중입니다.");
    try {
      setStatus("시장 메모리와 화면용 시장 상태를 함께 갱신하는 중입니다.");
      const result = await runMemoryUpdate();
      if (result.ok === false) {
        throw new Error(result.message || result.status || "시장 메모리 업데이트에 실패했습니다.");
      }
      setStatus(`시장 메모리를 업데이트했습니다. ${resultMessage(result)}`);
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "시장 메모리 업데이트에 실패했습니다.");
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="react-market-memory-route" data-market-memory-route>
      <RouteHero
        eyebrow="Market Memory"
        title="시장 내러티브"
        description="단기 뉴스 흐름을 중기 시장 상황으로 압축해 투자 판단의 배경으로 유지합니다."
      />

      {error && <p className="react-dashboard-error">{error}</p>}
      {status && <p className="react-dashboard-warning">{status}</p>}

      <section className="market-state-dashboard react-market-memory-dashboard" aria-label="현재 중기 시장 상황">
        <MarketStateDashboard key={refreshKey} onUpdate={runMarketMemoryUpdate} updating={busy} />
      </section>
    </div>
  );
}
