import { FormEvent, useCallback, useEffect, useState } from "react";
import { getJson, postJson } from "../../api";
import { updateReactAgentContext } from "../agentContext";
import {
  effortLabel,
  elapsedSeconds,
  isAgentManagedJob,
  isJobResponse,
  modelChoicesFor,
  preferredModel,
  selectedAdapter,
} from "./presenters";
import {
  getAgentThreadMessages,
  resetAgentThreadMessages,
  setAgentThreadMessages,
  subscribeAgentThread,
} from "./storage";
import type {
  AgentJob,
  AgentMessage,
  AgentSettings,
  Attachment,
  DashboardPayload,
  InvestmentReviewPayload,
} from "./types";

const ATTACHMENT_LIMIT = 3;
const ATTACHMENT_MAX_BYTES = 200_000;
const ATTACHMENT_TEXT_LIMIT = 4_000;

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function messageId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function pollAgentJob(job: AgentJob): Promise<AgentJob> {
  let current = job;
  while (["queued", "running"].includes(current.status)) {
    await sleep(1000);
    current = await getJson<AgentJob>(`/api/jobs/${encodeURIComponent(current.id)}`);
  }
  if (current.status !== "done") {
    throw new Error(current.message || current.error || "Agent 작업에 실패했습니다.");
  }
  return current;
}

async function readAttachment(file: File): Promise<Attachment> {
  const text = file.type.startsWith("text/") || /\.(md|txt|csv|json)$/i.test(file.name)
    ? await file.text()
    : "";
  return {
    name: file.name.slice(0, 120),
    size: file.size,
    content: text.slice(0, ATTACHMENT_TEXT_LIMIT),
  };
}

export function useAgentWorkspace(surface = "agent_home") {
  const [messages, setMessages] = useState<AgentMessage[]>(() => getAgentThreadMessages());
  const [input, setInput] = useState("");
  const [model, setModel] = useState("");
  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [effort, setEffort] = useState("medium");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [recentReports, setRecentReports] = useState<DashboardPayload["briefings"]>([]);
  const [recentJobs, setRecentJobs] = useState<AgentJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsOpen, setJobsOpen] = useState(false);
  const [quickBusy, setQuickBusy] = useState("");
  const [quickStatus, setQuickStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    updateReactAgentContext({ surface });
  }, [surface]);

  useEffect(() => subscribeAgentThread(setMessages), []);

  useEffect(() => {
    setAgentThreadMessages(messages);
  }, [messages]);

  const applySettings = useCallback((payload: AgentSettings, keepCurrent = false) => {
    const adapter = selectedAdapter(payload);
    setSettings(payload);
    setSettingsMessage(payload.message || "");
    setModel((current) => {
      const preferred = preferredModel(adapter);
      if (keepCurrent && modelChoicesFor(adapter).some((choice) => choice.value === current)) return current;
      return preferred;
    });
  }, []);

  const loadAgentSettings = useCallback(async (refresh = false) => {
    const payload = await getJson<AgentSettings>(`/api/agent-bridge/settings${refresh ? "?refresh=true" : ""}`);
    applySettings(payload, true);
  }, [applySettings]);

  useEffect(() => {
    let alive = true;
    getJson<AgentSettings>("/api/agent-bridge/settings")
      .then((payload) => {
        if (alive) applySettings(payload);
      })
      .catch((reason) => {
        if (alive) setSettingsMessage(reason instanceof Error ? reason.message : "Agent 설정을 불러오지 못했습니다.");
      });
    return () => {
      alive = false;
    };
  }, [applySettings]);

  useEffect(() => {
    const handleSettingsUpdate = (event: Event) => {
      const detail = (event as CustomEvent<AgentSettings | null>).detail;
      if (detail) applySettings(detail);
      else loadAgentSettings().catch((reason) => {
        setSettingsMessage(reason instanceof Error ? reason.message : "Agent 설정을 불러오지 못했습니다.");
      });
    };
    window.addEventListener("folio:agent-settings-updated", handleSettingsUpdate);
    return () => window.removeEventListener("folio:agent-settings-updated", handleSettingsUpdate);
  }, [applySettings, loadAgentSettings]);

  useEffect(() => {
    let alive = true;
    Promise.allSettled([
      getJson<DashboardPayload>("/api/dashboard"),
      getJson<InvestmentReviewPayload>("/api/investment-review"),
    ]).then((results) => {
      if (!alive) return;
      const dashboard = results[0].status === "fulfilled" ? results[0].value : null;
      const review = results[1].status === "fulfilled" ? results[1].value : null;
      const merged = [...(review?.recentReports || []), ...(dashboard?.briefings || [])];
      const seen = new Set<string>();
      setRecentReports(merged.filter((report, index) => {
        const key = `${report.view || ""}:${report.date || ""}:${report.title || index}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 3));
    });
    return () => {
      alive = false;
    };
  }, []);

  const loadRecentJobs = useCallback(async () => {
    setJobsLoading(true);
    try {
      const payload = await getJson<AgentJob[]>("/api/jobs");
      setRecentJobs((Array.isArray(payload) ? payload : []).filter(isAgentManagedJob).slice(0, 4));
    } finally {
      setJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecentJobs().catch(() => undefined);
  }, [loadRecentJobs]);

  function startNewConversation() {
    resetAgentThreadMessages();
    setMessages(getAgentThreadMessages());
    setInput("");
    setAttachments([]);
    setError("");
    setQuickStatus("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();
    if (!message || busy) return;

    const userMessage: AgentMessage = {
      id: messageId(),
      role: "user",
      text: message,
      attachments: attachments.map((item) => item.name),
      createdAt: new Date().toISOString(),
    };
    const assistantId = messageId();
    const startedAt = Date.now();
    const currentAdapter = selectedAdapter(settings);
    const providerLabel = currentAdapter?.label || "Agent";
    const modelLabel = model || currentAdapter?.model || "model";
    setMessages((current) => [
      ...current,
      userMessage,
      {
        id: assistantId,
        role: "assistant",
        text: "",
        pending: true,
        runState: "pending",
        runTitle: `${providerLabel} 세션 시작`,
        runMeta: `${modelLabel} · ${effortLabel(effort)} · on-request`,
        createdAt: new Date(startedAt).toISOString(),
      },
    ]);
    setInput("");
    setError("");
    setBusy(true);

    try {
      const job = await postJson<AgentJob>("/api/agent/chat", {
        message,
        context: { surface },
        options: { model, effort, attachments },
      });
      const done = await pollAgentJob(job);
      const result = done.result || {};
      loadRecentJobs().catch(() => undefined);
      setMessages((current) => current.map((item) => (
        item.id === assistantId
          ? {
              ...item,
              text: result.reply || done.message || "Agent가 응답을 반환하지 않았습니다.",
              notice: result.notice,
              pending: false,
              proposal: result.proposal || null,
              proposalStatus: result.proposal ? "pending" : "",
              runState: "done",
              runTitle: `${providerLabel} 응답`,
              runMeta: `${modelLabel} · ${effortLabel(effort)} · ${elapsedSeconds(startedAt)}`,
            }
          : item
      )));
      setAttachments([]);
    } catch (reason) {
      const messageText = reason instanceof Error ? reason.message : "Agent 요청에 실패했습니다.";
      setError(messageText);
      setMessages((current) => current.map((item) => (
        item.id === assistantId
          ? {
              ...item,
              text: messageText,
              pending: false,
              runState: "error",
              runTitle: `${providerLabel} 오류`,
              runMeta: `${modelLabel} · ${effortLabel(effort)}`,
            }
          : item
      )));
    } finally {
      setBusy(false);
    }
  }

  async function runQuickAction(action: "briefing" | "rss" | "analysis") {
    setError("");
    setQuickStatus("");
    if (action === "analysis") {
      window.location.hash = "#/analysis";
      return;
    }
    setQuickBusy(action);
    try {
      if (action === "rss") {
        setQuickStatus("RSS 수집을 시작했습니다.");
        const job = await postJson<AgentJob>("/api/rssarchive/import", {});
        if (isJobResponse(job)) await pollAgentJob(job);
        loadRecentJobs().catch(() => undefined);
        setQuickStatus("RSS 수집이 끝났습니다.");
        window.location.hash = "#/rss";
        return;
      }
      setQuickStatus("오늘 브리핑을 생성하는 중입니다.");
      const response = await postJson<AgentJob | { date?: string; marketScope?: string }>("/api/briefings", {
        marketScope: "both",
        briefingType: "default",
      });
      let date = "";
      if (isJobResponse(response)) {
        const done = await pollAgentJob(response);
        date = done.result?.date || done.result?.artifactId || "";
      } else {
        date = response.date || "";
      }
      loadRecentJobs().catch(() => undefined);
      setQuickStatus(date ? "오늘 브리핑을 생성했습니다." : "브리핑 생성이 끝났습니다.");
      window.location.hash = date ? `#/briefing/${date}/both` : "#/briefing";
    } catch (reason) {
      const messageText = reason instanceof Error ? reason.message : "빠른 실행에 실패했습니다.";
      setError(messageText);
      setQuickStatus(messageText);
    } finally {
      setQuickBusy("");
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    setError("");
    const next = [...attachments];
    for (const file of Array.from(files)) {
      if (next.length >= ATTACHMENT_LIMIT) {
        setError(`첨부는 최대 ${ATTACHMENT_LIMIT}개까지 가능합니다.`);
        break;
      }
      if (file.size > ATTACHMENT_MAX_BYTES) {
        setError(`${file.name}은 200KB를 초과해 제외했습니다.`);
        continue;
      }
      next.push(await readAttachment(file));
    }
    setAttachments(next);
  }

  async function handleProposalAction(messageIdValue: string, proposalId: string, action: "approve" | "reject") {
    setError("");
    try {
      const result = await postJson<{ status?: string }>(`/api/agent/proposals/${encodeURIComponent(proposalId)}`, { action });
      setMessages((current) => current.map((item) => (
        item.id === messageIdValue ? { ...item, proposalStatus: result.status || action } : item
      )));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "제안 처리에 실패했습니다.");
    }
  }

  const adapter = selectedAdapter(settings);
  const modelChoices = modelChoicesFor(adapter);
  const hasConversation = messages.some((message) => message.id !== "welcome");

  async function persistModel(nextModel: string) {
    setModel(nextModel);
    if (!adapter?.id || !nextModel) return;
    try {
      const models = Object.fromEntries((settings?.adapters || []).map((item) => [item.id, item.model || ""]));
      models[adapter.id] = nextModel;
      const payload = await postJson<AgentSettings>("/api/agent-bridge/settings", { provider: adapter.id, models });
      applySettings(payload, true);
      window.dispatchEvent(new CustomEvent("folio:agent-settings-updated", { detail: payload }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "모델 설정 저장에 실패했습니다.");
    }
  }

  return {
    messages,
    input,
    setInput,
    model,
    effort,
    setEffort,
    attachments,
    setAttachments,
    recentReports: recentReports || [],
    recentJobs,
    jobsLoading,
    jobsOpen,
    setJobsOpen,
    quickBusy,
    quickStatus,
    busy,
    error,
    settingsMessage,
    adapter,
    modelChoices,
    hasConversation,
    handleSubmit,
    handleFiles,
    handleProposalAction,
    loadRecentJobs,
    persistModel,
    runQuickAction,
    startNewConversation,
  };
}

export type AgentWorkspaceController = ReturnType<typeof useAgentWorkspace>;

