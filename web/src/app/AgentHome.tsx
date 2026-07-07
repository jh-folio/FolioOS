import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { getJson, postJson } from "../api";
import { updateReactAgentContext } from "./agentContext";
import { AgentMessageContent, AgentRunCard } from "./AgentMessageContent";

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
  proposal?: AgentProposal | null;
};

type AgentJob = {
  id: string;
  kind?: string;
  label?: string;
  status: "queued" | "running" | "done" | "failed" | "cancelled";
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
  runState?: "pending" | "done" | "error";
  runTitle?: string;
  runMeta?: string;
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
const AGENT_MANAGED_JOB_KINDS = new Set(["agent_bridge", "rss"]);
const WELCOME_MESSAGE: AgentMessage = {
  id: "welcome",
  role: "assistant",
  text: "무엇을 조사하거나 정리할까요? 질문으로 시작해도 되고, 보고서 수정 작업을 지시해도 됩니다.",
  notice: "저장 변경은 proposal 승인 전에는 반영되지 않습니다.",
};

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

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

function isAgentManagedJob(job: AgentJob) {
  const label = `${job.label || ""} ${job.message || ""}`;
  return AGENT_MANAGED_JOB_KINDS.has(String(job.kind || "")) || /^LLM CLI|Agent/.test(label);
}

function formatJobTime(job: AgentJob) {
  const value = job.finishedAt || job.updatedAt || job.createdAt || "";
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value.slice(0, 16);
  }
}

function jobArtifactRoute(job: AgentJob) {
  const result = job.result || {};
  const artifactType = result.artifactType || "";
  const artifactId = result.artifactId || result.reportId || "";
  const date = result.date || "";
  if (artifactType === "briefing" && date) return `#/briefing/${date}/both`;
  if (artifactType === "company_analysis" && artifactId) return `#/analysis/${encodeURIComponent(artifactId)}`;
  if (artifactType === "topic_report" && artifactId) return `#/deep-research/${encodeURIComponent(artifactId)}`;
  if (String(job.label || "").includes("RSS")) return "#/rss";
  return "";
}

async function pollAgentJob(job: AgentJob): Promise<AgentJob> {
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
  return Boolean(job?.id && ["queued", "running"].includes(job.status));
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
  const [recentJobs, setRecentJobs] = useState<AgentJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsOpen, setJobsOpen] = useState(false);
  const [quickBusy, setQuickBusy] = useState("");
  const [quickStatus, setQuickStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    updateReactAgentContext({ surface: "agent_home" });
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
      const done = await pollAgentJob(job);
      const result = done.result || {};
      loadRecentJobs().catch(() => undefined);
      setMessages((current) =>
        current.map((item) =>
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
            : item,
        ),
      );
      setAttachments([]);
    } catch (err) {
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
      const result = await postJson<{ status?: string }>(`/api/agent/proposals/${encodeURIComponent(proposalId)}`, { action });
      setMessages((current) =>
        current.map((item) =>
          item.id === messageIdValue
            ? { ...item, proposalStatus: result.status || action }
            : item,
        ),
      );
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
          </div>

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
                    {message.runTitle && <AgentRunCard state={message.runState} title={message.runTitle} meta={message.runMeta} />}
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
                      {message.proposal.summary && <p>{message.proposal.summary}</p>}
                      {message.proposal.diff && (
                        <details>
                          <summary>diff 보기</summary>
                          <pre>{message.proposal.diff}</pre>
                        </details>
                      )}
                      {message.proposalStatus === "pending" ? (
                        <div className="agent-home-proposal-actions">
                          <button type="button" onClick={() => handleProposalAction(message.id, message.proposal!.id, "approve")}>
                            승인
                          </button>
                          <button type="button" onClick={() => handleProposalAction(message.id, message.proposal!.id, "reject")}>
                            거절
                          </button>
                        </div>
                      ) : (
                        <p className="agent-home-notice">상태: {message.proposalStatus}</p>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        <section className={`agent-home-jobs${jobsOpen ? " open" : ""}`} aria-label="AI Agent 작업">
          <div className="agent-home-section-head">
            <div>
              <p className="section-kicker">Agent Work</p>
              <h2>최근 작업</h2>
            </div>
            <div className="agent-home-jobs-actions">
              {jobsOpen && (
                <button type="button" onClick={() => loadRecentJobs().catch(() => undefined)} disabled={jobsLoading}>
                  {jobsLoading ? "확인 중" : "새로고침"}
                </button>
              )}
              <button type="button" onClick={() => setJobsOpen((current) => !current)} aria-expanded={jobsOpen}>
                {jobsOpen ? "접기 ▲" : "펼치기 ▼"}
              </button>
            </div>
          </div>
          {!jobsOpen ? null : recentJobs.length > 0 ? (
            <div className="agent-home-job-list">
              {recentJobs.map((job) => {
                const route = jobArtifactRoute(job);
                return (
                  <article key={job.id} className={`agent-home-job ${job.status}`}>
                    <div>
                      <strong>{job.label || job.kind || "작업"}</strong>
                      <p>{job.message || job.error || "상태 메시지가 없습니다."}</p>
                      <span className="agent-home-job-meta">
                        {job.status}
                        {typeof job.progress === "number" ? ` · ${job.progress}%` : ""}
                        {formatJobTime(job) ? ` · ${formatJobTime(job)}` : ""}
                      </span>
                    </div>
                    {route && (
                      <button type="button" onClick={() => { window.location.hash = route; }}>
                        열기
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="agent-home-empty">
              아직 표시할 Agent 작업이 없습니다. Home에서 질문하거나 브리핑/RSS 빠른 실행을 사용하면 여기에 남습니다.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
