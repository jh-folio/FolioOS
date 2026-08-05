import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { getJson, postJson } from "../../api";
import { resetReactAgentContextScope, setReactAgentContextScope } from "../agentContext";
import { AgentPollTimeout, pollAgentJobBounded, releasePollController, replacePollController } from "../agentPolling";
import {
  actOnProposal,
  hydrateAgentProposalFromResult,
  notifyProposalLifecycle,
} from "../agentProposalLifecycle";
import {
  effortLabel,
  elapsedSeconds,
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
  shouldShowLegacyConsultationNotice,
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
// 서버의 attachment_files.MAX_IMAGE_BYTES와 같은 값. 넘으면 보내기 전에 거른다.
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

function messageId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function pollAgentJob(job: AgentJob): Promise<AgentJob> {
  return pollAgentJobBounded(job);
}

async function encodeBytes(file: File): Promise<string> {
  const buffer = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  // 큰 이미지를 한 번에 spread하면 인자 수 상한에 걸리므로 조각내 이어붙인다.
  for (let offset = 0; offset < buffer.length; offset += 0x8000) {
    binary += String.fromCharCode(...buffer.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

async function readAttachment(file: File): Promise<Attachment> {
  // 이미지는 본문 텍스트가 없다. 예전에는 빈 문자열이 되어 프롬프트에 파일명만
  // 실렸고, 이미지를 읽을 수 있는 Agent CLI에 파일이 닿지 못했다. 바이트를 보내면
  // 서버가 임시 파일로 내리고 CLI가 그 경로를 직접 연다.
  const isImage = file.type.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp)$/i.test(file.name);
  if (isImage) {
    return {
      name: file.name.slice(0, 120),
      size: file.size,
      content: "",
      imageData: file.size <= MAX_IMAGE_BYTES ? await encodeBytes(file) : "",
    };
  }
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
  const [workLogRefreshKey, setWorkLogRefreshKey] = useState(0);
  const pollControllers = useRef(new Map<string, AbortController>());
  const [quickBusy, setQuickBusy] = useState("");
  const [quickStatus, setQuickStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const legacyConsultationImportAvailable = shouldShowLegacyConsultationNotice();

  useEffect(() => {
    const scope = surface === "agent_home" ? "home" : "office";
    setReactAgentContextScope(scope, { surface, viewId: scope });
    return () => resetReactAgentContextScope(scope);
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

  // 작업 목록은 metadata-only Work Log가 소유한다. 여기서는 다시 읽으라는 신호만 올린다.
  const bumpWorkLog = useCallback(() => setWorkLogRefreshKey((current) => current + 1), []);

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

    let controller: AbortController | null = null;
    try {
      const job = await postJson<AgentJob>("/api/agent/chat", {
        message,
        context: { surface },
        options: { model, effort, attachments },
      });
      controller = new AbortController();
      replacePollController(pollControllers.current, assistantId, controller);
      const done = await pollAgentJobBounded(job, { signal: controller.signal });
      releasePollController(pollControllers.current, assistantId, controller);
      const result = done.result || {};
      const proposalHydration = await hydrateAgentProposalFromResult(result);
      bumpWorkLog();
      setMessages((current) => current.map((item) => (
        item.id === assistantId
          ? {
              ...item,
              text: result.reply || done.message || "Agent가 응답을 반환하지 않았습니다.",
              notice: [result.notice, proposalHydration.notice].filter(Boolean).join(" "),
              pending: false,
              proposal: proposalHydration.proposal,
              proposalStatus: proposalHydration.proposalStatus,
              runState: "done",
              runTitle: `${providerLabel} 응답`,
              runMeta: `${modelLabel} · ${effortLabel(effort)} · ${elapsedSeconds(startedAt)}`,
            }
          : item
      )));
      setAttachments([]);
    } catch (reason) {
      if (controller) releasePollController(pollControllers.current, assistantId, controller);
      if (reason instanceof AgentPollTimeout) {
        setMessages((current) => current.map((item) => (
          item.id === assistantId
            ? {
                ...item,
                text: reason.message,
                pending: false,
                runState: "still-running",
                runTitle: `${providerLabel} 계속 실행 중`,
                runMeta: `${modelLabel} · ${effortLabel(effort)} · ${elapsedSeconds(startedAt)}`,
                jobId: reason.job.id,
              }
            : item
        )));
        return;
      }
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

  async function runQuickAction(action: "briefing" | "rss" | "analysis" | "deep-research") {
    setError("");
    setQuickStatus("");
    if (action === "analysis" || action === "deep-research") {
      window.location.hash = action === "analysis" ? "#/analysis" : "#/deep-research";
      return;
    }
    setQuickBusy(action);
    try {
      if (action === "rss") {
        setQuickStatus("RSS 수집을 시작했습니다.");
        const job = await postJson<AgentJob>("/api/rssarchive/import", {});
        if (isJobResponse(job)) await pollAgentJob(job);
        bumpWorkLog();
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
      bumpWorkLog();
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

  async function resumeAgentJob(messageIdValue: string, jobId: string) {
    const controller = new AbortController();
    replacePollController(pollControllers.current, messageIdValue, controller);
    setMessages((current) => current.map((item) => (
      item.id === messageIdValue
        ? { ...item, pending: true, runState: "pending", runTitle: "Agent 상태 다시 확인 중" }
        : item
    )));
    try {
      const current = await getJson<AgentJob>(`/api/jobs/${encodeURIComponent(jobId)}`, { signal: controller.signal });
      const done = await pollAgentJobBounded(current, { signal: controller.signal });
      const result = done.result || {};
      const proposalHydration = await hydrateAgentProposalFromResult(result);
      bumpWorkLog();
      setMessages((items) => items.map((item) => (
        item.id === messageIdValue
          ? {
              ...item,
              text: result.reply || done.message || "Agent가 응답을 반환하지 않았습니다.",
              notice: [result.notice, proposalHydration.notice].filter(Boolean).join(" "),
              proposal: proposalHydration.proposal,
              proposalStatus: proposalHydration.proposalStatus,
              pending: false,
              runState: "done",
              runTitle: "Agent 응답",
              jobId: undefined,
            }
          : item
      )));
    } catch (reason) {
      if (reason instanceof AgentPollTimeout) {
        setMessages((items) => items.map((item) => (
          item.id === messageIdValue
            ? { ...item, text: reason.message, pending: false, runState: "still-running", runTitle: "Agent 계속 실행 중", jobId: reason.job.id }
            : item
        )));
      } else if (!(reason instanceof DOMException && reason.name === "AbortError")) {
        setMessages((items) => items.map((item) => (
          item.id === messageIdValue
            ? { ...item, text: reason instanceof Error ? reason.message : "Agent 상태 확인에 실패했습니다.", pending: false, runState: "error", runTitle: "Agent 오류" }
            : item
        )));
      }
    } finally {
      releasePollController(pollControllers.current, messageIdValue, controller);
    }
  }

  async function handleProposalAction(messageIdValue: string, proposalId: string, action: "approve" | "reject") {
    setError("");
    try {
      const result = await actOnProposal(proposalId, action);
      setMessages((current) => current.map((item) => (
        item.id === messageIdValue ? { ...item, proposalStatus: result.status } : item
      )));
      notifyProposalLifecycle(result);
      bumpWorkLog();
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
    workLogRefreshKey,
    quickBusy,
    quickStatus,
    busy,
    error,
    settingsMessage,
    adapter,
    modelChoices,
    hasConversation,
    legacyConsultationImportAvailable,
    handleSubmit,
    handleFiles,
    handleProposalAction,
    resumeAgentJob,
    persistModel,
    runQuickAction,
    startNewConversation,
  };
}

export type AgentWorkspaceController = ReturnType<typeof useAgentWorkspace>;

