import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { getJson, isActiveJobStatus, postJson, type JobStatus } from "../api";
import { resetReactAgentContextScope, setReactAgentContextScope } from "./agentContext";
import { AgentMessageContent, AgentRunCard } from "./AgentMessageContent";
import { AgentWorkLog } from "./AgentWorkLog";
import { InvestmentContextCard } from "./InvestmentContextCard";
import { AgentPollTimeout, pollAgentJobBounded, releasePollController, replacePollController } from "./agentPolling";
import { actOnProposal, boundedProposalDiff, boundedProposalSummary, hydrateAgentProposalFromResult, notifyProposalLifecycle } from "./agentProposalLifecycle";

type AgentProposal = {
  id: string;
  summary?: string;
  diff?: string;
  artifactKind?: string;
  artifactId?: string;
  marketScope?: string;
};

type AgentResult = {
  reply?: string;
  notice?: string;
  mode?: string;
  engine?: string;
  adapter?: string;
  proposalId?: string | null;
};

type AgentJob = {
  id: string;
  kind?: string;
  label?: string;
  status: JobStatus;
  progress?: number;
  message?: string;
  error?: string;
  createdAt?: string;
  updatedAt?: string;
  finishedAt?: string;
  result?: AgentResult & { date?: string; artifactId?: string; reportId?: string; artifactType?: string; title?: string };
  generationMode?: string;
  adapter?: string;
};

type AgentMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  notice?: string;
  pending?: boolean;
  attachments?: string[];
  proposal?: AgentProposal | null;
  proposalStatus?: string;
  runState?: "pending" | "done" | "error" | "still-running";
  runTitle?: string;
  runMeta?: string;
  jobId?: string;
  createdAt?: string;
};

type Attachment = {
  name: string;
  size: number;
  content: string;
};

type AgentModelChoice = {
  value: string;
  label: string;
};

type AgentAdapterSettings = {
  id: string;
  label?: string;
  model?: string;
  modelChoices?: AgentModelChoice[];
};

type AgentSettings = {
  provider?: string;
  selectedAdapter?: string;
  adapters?: AgentAdapterSettings[];
  message?: string;
};

type RecentReport = {
  title?: string;
  type?: string;
  date?: string;
  view?: string;
  marketScope?: string;
  scope?: string;
};

type DashboardPayload = {
  briefings?: RecentReport[];
};

type InvestmentReviewPayload = {
  recentReports?: RecentReport[];
};

const ATTACHMENT_LIMIT = 3;
const ATTACHMENT_MAX_BYTES = 200_000;
const ATTACHMENT_TEXT_LIMIT = 4_000;
const PROVIDERS = new Set(["codex", "claude", "antigravity"]);
const AGENT_HOME_THREAD_STORAGE_KEY = "folio.agentHome.thread.v1";
const WELCOME_MESSAGE: AgentMessage = {
  id: "welcome",
  role: "assistant",
  text: "무엇을 조사하거나 정리할까요? 질문으로 시작해도 되고, 보고서 수정 작업을 지시해도 됩니다.",
  notice: "저장 변경은 proposal 승인 전에는 반영되지 않습니다.",
};

function messageId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function effortLabel(value: string) {
  return value === "high" ? "높음" : value === "low" ? "낮음" : "중간";
}

function elapsedSeconds(startedAt: number) {
  return `${Math.max(1, Math.round((Date.now() - startedAt) / 1000))}초`;
}

function messagesForStorage(messages: AgentMessage[]) {
  return messages
    .filter((message) => message.id !== "welcome")
    .map((message) => ({
      ...message,
      pending: false,
      text: message.pending ? `${message.text}\n\n이전 세션에서 완료 여부를 확인하지 못했습니다.` : message.text,
    }))
    .slice(-80);
}

function loadStoredMessages(): AgentMessage[] {
  try {
    const raw = window.localStorage.getItem(AGENT_HOME_THREAD_STORAGE_KEY);
    if (!raw) return [WELCOME_MESSAGE];
    const parsed = JSON.parse(raw) as { messages?: AgentMessage[] };
    const stored = Array.isArray(parsed?.messages)
      ? parsed.messages.filter((message) => message?.role === "user" || message?.role === "assistant")
      : [];
    return stored.length ? [WELCOME_MESSAGE, ...stored] : [WELCOME_MESSAGE];
  } catch {
    return [WELCOME_MESSAGE];
  }
}

function persistStoredMessages(messages: AgentMessage[]) {
  try {
    const stored = messagesForStorage(messages);
    if (!stored.length) {
      window.localStorage.removeItem(AGENT_HOME_THREAD_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(
      AGENT_HOME_THREAD_STORAGE_KEY,
      JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), messages: stored }),
    );
  } catch {
    // localStorage 용량/권한 문제는 대화 기능 자체를 막지 않는다.
  }
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

function selectedAdapter(settings: AgentSettings | null): AgentAdapterSettings | null {
  const provider = settings?.provider && PROVIDERS.has(settings.provider)
    ? settings.provider
    : settings?.selectedAdapter || "";
  return settings?.adapters?.find((adapter) => adapter.id === provider) || null;
}

function modelChoicesFor(adapter: AgentAdapterSettings | null) {
  return adapter?.modelChoices || [];
}

function preferredModel(adapter: AgentAdapterSettings | null) {
  const choices = modelChoicesFor(adapter);
  if (!choices.length) return "";
  return choices.some((choice) => choice.value === adapter?.model) ? String(adapter?.model || "") : choices[0].value;
}

function isJobResponse(value: unknown): value is AgentJob {
  const job = value as AgentJob;
  return Boolean(job?.id && isActiveJobStatus(job.status));
}

function reportRoute(report: RecentReport) {
  const view = String(report.view || "").trim();
  const scope = report.marketScope === "us" || report.marketScope === "kr" || report.marketScope === "both"
    ? report.marketScope
    : report.scope === "us" || report.scope === "kr" || report.scope === "both"
      ? report.scope
      : "both";
  if (view === "briefing" && /^\d{4}-\d{2}-\d{2}$/.test(String(report.date || ""))) {
    return `#/briefing/${report.date}/${scope}`;
  }
  const routeByView: Record<string, string> = {
    review: "dashboard",
    dashboard: "dashboard",
    briefing: "briefing",
    rssfeed: "rss",
    memory: "market-memory",
    analysis: "analysis",
    topicrpt: "deep-research",
    watchlist: "watchlist",
    settings: "settings",
  };
  return `#/${routeByView[view] || "dashboard"}`;
}

function recentKey(report: RecentReport, index: number) {
  return `${report.view || "report"}-${report.date || ""}-${report.title || index}`;
}

export function AgentHome() {
  const [messages, setMessages] = useState<AgentMessage[]>(() => loadStoredMessages());
  const [input, setInput] = useState("");
  const [model, setModel] = useState("");
  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [effort, setEffort] = useState("medium");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [workLogRefreshKey, setWorkLogRefreshKey] = useState(0);
  const [quickBusy, setQuickBusy] = useState("");
  const [quickStatus, setQuickStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pollControllers = useRef(new Map<string, AbortController>());

  useEffect(() => {
    setReactAgentContextScope("home", { surface: "agent_home", viewId: "home" });
    return () => resetReactAgentContextScope("home");
  }, []);

  useEffect(() => () => {
    for (const controller of pollControllers.current.values()) controller.abort();
    pollControllers.current.clear();
  }, []);

  useEffect(() => {
    persistStoredMessages(messages);
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
        if (!alive) return;
        applySettings(payload);
      })
      .catch((err) => {
        if (!alive) return;
        setSettingsMessage(err instanceof Error ? err.message : "Agent 설정을 불러오지 못했습니다.");
      });
    return () => {
      alive = false;
    };
  }, [applySettings, loadAgentSettings]);

  useEffect(() => {
    const handleSettingsUpdate = (event: Event) => {
      const detail = (event as CustomEvent<AgentSettings | null>).detail;
      if (detail) applySettings(detail);
      else loadAgentSettings().catch((err) => setSettingsMessage(err instanceof Error ? err.message : "Agent 설정을 불러오지 못했습니다."));
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

  function startNewConversation() {
    setMessages([WELCOME_MESSAGE]);
    setInput("");
    setAttachments([]);
    setError("");
    setQuickStatus("");
    try {
      window.localStorage.removeItem(AGENT_HOME_THREAD_STORAGE_KEY);
    } catch {
      // ignore
    }
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
        context: { surface: "agent_home" },
        options: {
          model,
          effort,
          attachments,
        },
      });
      controller = new AbortController();
      replacePollController(pollControllers.current, assistantId, controller);
      const done = await pollAgentJobBounded(job, { signal: controller.signal });
      releasePollController(pollControllers.current, assistantId, controller);
      const result = done.result || {};
      const proposalHydration = await hydrateAgentProposalFromResult(result);
      setWorkLogRefreshKey((current) => current + 1);
      setMessages((current) =>
        current.map((item) =>
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
            : item,
        ),
      );
      setAttachments([]);
    } catch (err) {
      if (controller) releasePollController(pollControllers.current, assistantId, controller);
      if (err instanceof AgentPollTimeout) {
        setMessages((current) => current.map((item) => item.id === assistantId ? {
          ...item,
          text: err.message,
          pending: false,
          runState: "still-running",
          runTitle: `${providerLabel} 계속 실행 중`,
          runMeta: `${modelLabel} · ${effortLabel(effort)} · ${elapsedSeconds(startedAt)}`,
          jobId: err.job.id,
        } : item));
        return;
      }
      const messageText = err instanceof Error ? err.message : "Agent 요청에 실패했습니다.";
      setError(messageText);
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantId
            ? {
                ...item,
                text: messageText,
                pending: false,
                runState: "error",
                runTitle: `${providerLabel} 오류`,
                runMeta: `${modelLabel} · ${effortLabel(effort)}`,
              }
            : item,
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  async function resumeAgentJob(messageIdValue: string, jobId: string) {
    const controller = new AbortController();
    replacePollController(pollControllers.current, messageIdValue, controller);
    setMessages((current) => current.map((item) => item.id === messageIdValue ? {
      ...item, pending: true, runState: "pending", runTitle: "Agent 상태 다시 확인 중",
    } : item));
    try {
      const current = await getJson<AgentJob>(`/api/jobs/${encodeURIComponent(jobId)}`, { signal: controller.signal });
      const done = await pollAgentJobBounded(current, { signal: controller.signal });
      const result = done.result || {};
      const proposalHydration = await hydrateAgentProposalFromResult(result);
      setWorkLogRefreshKey((value) => value + 1);
      setMessages((messages) => messages.map((item) => item.id === messageIdValue ? {
        ...item,
        text: result.reply || done.message || "Agent가 응답을 반환하지 않았습니다.",
        notice: [result.notice, proposalHydration.notice].filter(Boolean).join(" "),
        proposal: proposalHydration.proposal,
        proposalStatus: proposalHydration.proposalStatus,
        pending: false,
        runState: "done",
        runTitle: "Agent 응답",
        jobId: undefined,
      } : item));
    } catch (err) {
      if (err instanceof AgentPollTimeout) {
        setMessages((messages) => messages.map((item) => item.id === messageIdValue ? {
          ...item, text: err.message, pending: false, runState: "still-running", runTitle: "Agent 계속 실행 중", jobId: err.job.id,
        } : item));
      } else if (!(err instanceof DOMException && err.name === "AbortError")) {
        setMessages((messages) => messages.map((item) => item.id === messageIdValue ? {
          ...item, text: err instanceof Error ? err.message : "Agent 상태 확인에 실패했습니다.", pending: false, runState: "error", runTitle: "Agent 오류",
        } : item));
      }
    } finally {
      releasePollController(pollControllers.current, messageIdValue, controller);
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
        if (isJobResponse(job)) await pollAgentJobBounded(job);
        setWorkLogRefreshKey((current) => current + 1);
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
        const done = await pollAgentJobBounded(response);
        date = done.result?.date || done.result?.artifactId || "";
      } else {
        date = response.date || "";
      }
      setWorkLogRefreshKey((current) => current + 1);
      setQuickStatus(date ? "오늘 브리핑을 생성했습니다." : "브리핑 생성이 끝났습니다.");
      window.location.hash = date ? `#/briefing/${date}/both` : "#/briefing";
    } catch (err) {
      const messageText = err instanceof Error ? err.message : "빠른 실행에 실패했습니다.";
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleProposalAction(messageIdValue: string, proposalId: string, action: "approve" | "reject") {
    setError("");
    try {
      const result = await actOnProposal(proposalId, action);
      setMessages((current) =>
        current.map((item) =>
          item.id === messageIdValue
            ? { ...item, proposalStatus: result.status }
            : item,
        ),
      );
      notifyProposalLifecycle(result);
      setWorkLogRefreshKey((current) => current + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "제안 처리에 실패했습니다.");
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "모델 설정 저장에 실패했습니다.");
    }
  }

  return (
    <div className="react-home-route" data-agent-home>
      <div className={`agent-home ${hasConversation ? "has-conversation" : "is-empty"}`}>
        <div className="agent-home-left">
          <header className="home-hero agent-home-hero">
            <p className="eyebrow">Local Investment Research Workspace</p>
            <h1>Folio OS</h1>
          </header>

          <form className="agent-home-prompt" onSubmit={handleSubmit}>
            <div className="agent-home-prompt-shell">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="Folio OS에서 무엇을 빌드할까요?"
                rows={3}
              />
              <div className="agent-home-toolbar">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  hidden
                  onChange={(event) => handleFiles(event.currentTarget.files)}
                />
                <div className="agent-home-toolbar-left">
                  <button type="button" className="agent-home-icon-btn" onClick={() => fileInputRef.current?.click()} aria-label="파일 첨부" data-tooltip="파일 첨부">
                    +
                  </button>
                  <span className="agent-home-provider">{adapter?.label || adapter?.id || "Folio OS"}</span>
                </div>
                <div className="agent-home-toolbar-right">
                  <select aria-label="모델" value={model} onChange={(event) => persistModel(event.target.value)}>
                    {modelChoices.length > 0 ? modelChoices.map((choice) => (
                      <option key={choice.value} value={choice.value}>
                        {choice.label}
                      </option>
                    )) : <option value="">모델 목록 없음</option>}
                  </select>
                  <select aria-label="노력 단계" value={effort} onChange={(event) => setEffort(event.target.value)}>
                    <option value="low">낮음</option>
                    <option value="medium">중간</option>
                    <option value="high">높음</option>
                    <option value="max">최대</option>
                  </select>
                  <button className="agent-home-send" type="submit" disabled={busy || !input.trim()} aria-label="전송" data-tooltip="전송">
                    {busy ? "..." : "↑"}
                  </button>
                </div>
              </div>
            </div>
              {settingsMessage && <p className="agent-home-notice">{settingsMessage}</p>}
              {attachments.length > 0 && (
                <div className="agent-home-attachments">
                  {attachments.map((item) => (
                    <span key={item.name}>
                      {item.name}
                      <button
                        type="button"
                        aria-label={`${item.name} 첨부 제거`}
                        onClick={() => setAttachments((current) => current.filter((candidate) => candidate.name !== item.name))}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {quickStatus && <p className="agent-home-notice">{quickStatus}</p>}
              {error && <p className="agent-home-error">{error}</p>}
          </form>

          <div className="home-launcher agent-home-launcher" role="group" aria-label="빠른 실행">
            <button className="launch-tile primary" type="button" onClick={() => runQuickAction("briefing")} disabled={quickBusy === "briefing"}>
              {quickBusy === "briefing" ? "생성 중" : "오늘 브리핑 생성"}
            </button>
            <button className="launch-tile" type="button" onClick={() => runQuickAction("rss")} disabled={quickBusy === "rss"}>
              {quickBusy === "rss" ? "수집 중" : "RSS 수집"}
            </button>
            <button className="launch-tile" type="button" onClick={() => runQuickAction("analysis")}>기업 분석</button>
            <button className="launch-tile" data-qa="home-deep-research" type="button" onClick={() => runQuickAction("deep-research")}>딥 리서치</button>
          </div>

          <InvestmentContextCard mode="home" dismissible />

          {recentReports.length > 0 && (
            <div className="review-recent-wrap agent-home-recent">
              <span className="rv-recent-cap">최근 보고서</span>
              <div className="rv-recent">
                {recentReports.map((report, index) => (
                  <button
                    className="rv-rc"
                    type="button"
                    key={recentKey(report, index)}
                    data-tooltip={`${report.title || "보고서"}${report.date ? ` · ${report.date}` : ""}`}
                    onClick={() => { window.location.hash = reportRoute(report); }}
                  >
                    <span className="rv-rc-k">{String(report.type || report.view || "REPORT").toUpperCase()}</span>
                    <span className="rv-rc-t">{report.title || "제목 없음"}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {hasConversation && (
          <section className="agent-home-thread agent-home-right" aria-label="AI Agent 대화">
            <div className="agent-home-section-head">
              <div>
                <p className="section-kicker">Agent Thread</p>
                <h2>현재 대화</h2>
              </div>
              <button type="button" onClick={startNewConversation}>
                새 대화
              </button>
            </div>
            <div className="agent-home-log" aria-live="polite">
              {messages.map((message) => (
                <article key={message.id} className={`agent-home-message ${message.role}${message.pending ? " pending" : ""}`}>
                  <div className="agent-home-message-body">
                    {message.runTitle && <AgentRunCard state={message.runState === "still-running" ? "pending" : message.runState} title={message.runTitle} meta={message.runMeta} />}
                    {message.runState === "still-running" && message.jobId && (
                      <div data-qa="agent-job-still-running">
                        <button type="button" data-qa="agent-job-resume" onClick={() => void resumeAgentJob(message.id, message.jobId!)}>상태 다시 확인</button>
                      </div>
                    )}
                    {message.text && <AgentMessageContent text={message.text} />}
                    {message.notice && <p className="agent-home-notice">{message.notice}</p>}
                    {(message.attachments || []).length > 0 && (
                      <div className="agent-home-attachments">
                        {message.attachments?.map((name) => <span key={name}>{name}</span>)}
                      </div>
                    )}
                  </div>
                  {message.proposal && (
                    <div className="agent-home-proposal">
                      <div>
                        <strong>수정 제안</strong>
                        <span>{message.proposal.artifactKind} {message.proposal.artifactId}</span>
                      </div>
                      {message.proposalStatus === "pending" && message.proposal.summary && <p data-qa="proposal-summary">{boundedProposalSummary(message.proposal.summary)}</p>}
                      {message.proposalStatus === "pending" && message.proposal.diff && (
                        <details>
                          <summary>diff 보기</summary>
                          <pre data-qa="proposal-diff">{boundedProposalDiff(message.proposal.diff)}</pre>
                        </details>
                      )}
                      {message.proposalStatus === "pending" ? (
                        <div className="agent-home-proposal-actions">
                          <button type="button" data-qa="proposal-approve" onClick={() => handleProposalAction(message.id, message.proposal!.id, "approve")}>
                            승인
                          </button>
                          <button type="button" data-qa="proposal-reject" onClick={() => handleProposalAction(message.id, message.proposal!.id, "reject")}>
                            거절
                          </button>
                        </div>
                      ) : (
                        <p className="agent-home-notice" data-qa={message.proposalStatus === "applied" ? "wb-happy-applied" : message.proposalStatus === "rejected" ? "wb-f1-terminal-rejected" : message.proposalStatus === "stale" ? "wb-f1-terminal-stale" : "proposal-terminal"}>상태: {message.proposalStatus}</p>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        <AgentWorkLog surface="home" pageSize={20} refreshKey={workLogRefreshKey} />
      </div>
    </div>
  );
}
