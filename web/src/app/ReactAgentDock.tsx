import { FormEvent, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { getJson, postJson } from "../api";
import { AgentMessageContent, AgentRunCard } from "./AgentMessageContent";

type AgentResult = {
  reply?: string;
  notice?: string;
  proposal?: AgentProposal | null;
};

type AgentProposal = {
  id: string;
  summary?: string;
  diff?: string;
  artifactKind?: string;
  artifactId?: string;
};

type AgentJob = {
  id: string;
  status: "queued" | "running" | "done" | "failed" | "cancelled";
  message?: string;
  error?: string;
  result?: AgentResult;
};

type AgentMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  notice?: string;
  proposal?: AgentProposal | null;
  proposalStatus?: string;
  pending?: boolean;
  runState?: "pending" | "done" | "error";
  runTitle?: string;
  runMeta?: string;
  createdAt?: string;
  variant?: "welcome";
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

type AgentPreflightCheck = {
  id: string;
  label: string;
  ok: boolean;
  severity?: "info" | "warning" | "error";
  message: string;
  detail?: string;
};

type AgentPreflight = {
  ok: boolean;
  adapter?: string;
  checks?: AgentPreflightCheck[];
};

type ReactAgentDockProps = {
  surface: string;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
};

type AgentRequestDetail = Record<string, unknown> & {
  message?: string;
  prompt?: string;
  autoSubmit?: boolean;
};

const PROVIDERS = new Set(["codex", "claude", "antigravity"]);
const WELCOME_AGENT_MESSAGE: AgentMessage = {
  id: "welcome",
  role: "assistant",
  text: "현재 화면에 대해 물어보세요. 보고서 수정이나 발전 요청은 작업으로 전환해 처리합니다.",
  variant: "welcome",
  createdAt: new Date().toISOString(),
};

const CODEX_COLOR_LOGO = `<svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M19.503 0H4.496A4.496 4.496 0 000 4.496v15.007A4.496 4.496 0 004.496 24h15.007A4.496 4.496 0 0024 19.503V4.496A4.496 4.496 0 0019.503 0z" fill="#fff"></path><path d="M9.064 3.344a4.578 4.578 0 012.285-.312c1 .115 1.891.54 2.673 1.275.01.01.024.017.037.021a.09.09 0 00.043 0 4.55 4.55 0 013.046.275l.047.022.116.057a4.581 4.581 0 012.188 2.399c.209.51.313 1.041.315 1.595a4.24 4.24 0 01-.134 1.223.123.123 0 00.03.115c.594.607.988 1.33 1.183 2.17.289 1.425-.007 2.71-.887 3.854l-.136.166a4.548 4.548 0 01-2.201 1.388.123.123 0 00-.081.076c-.191.551-.383 1.023-.74 1.494-.9 1.187-2.222 1.846-3.711 1.838-1.187-.006-2.239-.44-3.157-1.302a.107.107 0 00-.105-.024c-.388.125-.78.143-1.204.138a4.441 4.441 0 01-1.945-.466 4.544 4.544 0 01-1.61-1.335c-.152-.202-.303-.392-.414-.617a5.81 5.81 0 01-.37-.961 4.582 4.582 0 01-.014-2.298.124.124 0 00.006-.056.085.085 0 00-.027-.048 4.467 4.467 0 01-1.034-1.651 3.896 3.896 0 01-.251-1.192 5.189 5.189 0 01.141-1.6c.337-1.112.982-1.985 1.933-2.618.212-.141.413-.251.601-.33.215-.089.43-.164.646-.227a.098.098 0 00.065-.066 4.51 4.51 0 01.829-1.615 4.535 4.535 0 011.837-1.388zm3.482 10.565a.637.637 0 000 1.272h3.636a.637.637 0 100-1.272h-3.636zM8.462 9.23a.637.637 0 00-1.106.631l1.272 2.224-1.266 2.136a.636.636 0 101.095.649l1.454-2.455a.636.636 0 00.005-.64L8.462 9.23z" fill="url(#folio-react-codex-gradient)"></path><defs><linearGradient gradientUnits="userSpaceOnUse" id="folio-react-codex-gradient" x1="12" x2="12" y1="3" y2="21"><stop stop-color="#B1A7FF"></stop><stop offset=".5" stop-color="#7A9DFF"></stop><stop offset="1" stop-color="#3941FF"></stop></linearGradient></defs></svg>`;
const CODEX_MONO_LOGO = `<svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M9.064 3.344a4.578 4.578 0 012.285-.312c1 .115 1.891.54 2.673 1.275.01.01.024.017.037.021a.09.09 0 00.043 0 4.55 4.55 0 013.046.275l.047.022.116.057a4.581 4.581 0 012.188 2.399c.209.51.313 1.041.315 1.595a4.24 4.24 0 01-.134 1.223.123.123 0 00.03.115c.594.607.988 1.33 1.183 2.17.289 1.425-.007 2.71-.887 3.854l-.136.166a4.548 4.548 0 01-2.201 1.388.123.123 0 00-.081.076c-.191.551-.383 1.023-.74 1.494-.9 1.187-2.222 1.846-3.711 1.838-1.187-.006-2.239-.44-3.157-1.302a.107.107 0 00-.105-.024c-.388.125-.78.143-1.204.138a4.441 4.441 0 01-1.945-.466 4.544 4.544 0 01-1.61-1.335c-.152-.202-.303-.392-.414-.617a5.81 5.81 0 01-.37-.961 4.582 4.582 0 01-.014-2.298.124.124 0 00.006-.056.085.085 0 00-.027-.048 4.467 4.467 0 01-1.034-1.651 3.896 3.896 0 01-.251-1.192 5.189 5.189 0 01.141-1.6c.337-1.112.982-1.985 1.933-2.618.212-.141.413-.251.601-.33.215-.089.43-.164.646-.227a.098.098 0 00.065-.066 4.51 4.51 0 01.829-1.615 4.535 4.535 0 011.837-1.388zm3.482 10.565a.637.637 0 000 1.272h3.636a.637.637 0 100-1.272h-3.636zM8.462 9.23a.637.637 0 00-1.106.631l1.272 2.224-1.266 2.136a.636.636 0 101.095.649l1.454-2.455a.636.636 0 00.005-.64L8.462 9.23z" fill="currentColor"/></svg>`;
const CLAUDE_LOGO_PATH = "M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z";
const CLAUDE_COLOR_LOGO = `<svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="${CLAUDE_LOGO_PATH}" fill="#D97757" fill-rule="nonzero"></path></svg>`;
const CLAUDE_MONO_LOGO = `<svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="${CLAUDE_LOGO_PATH}" fill="currentColor" fill-rule="nonzero"></path></svg>`;
const ANTIGRAVITY_LOGO_PATH = "M21.751 22.607c1.34 1.005 3.35.335 1.508-1.508C17.73 15.74 18.904 1 12.037 1 5.17 1 6.342 15.74.815 21.1c-2.01 2.009.167 2.511 1.507 1.506 5.192-3.517 4.857-9.714 9.715-9.714 4.857 0 4.522 6.197 9.714 9.715z";
const ANTIGRAVITY_COLOR_LOGO = `<svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="${ANTIGRAVITY_LOGO_PATH}" fill="url(#folio-react-antigravity-gradient)"></path><defs><linearGradient id="folio-react-antigravity-gradient" x1="5" x2="19" y1="22" y2="2" gradientUnits="userSpaceOnUse"><stop stop-color="#3186FF"></stop><stop offset=".42" stop-color="#34A853"></stop><stop offset=".72" stop-color="#FBBC04"></stop><stop offset="1" stop-color="#EA4335"></stop></linearGradient></defs></svg>`;
const ANTIGRAVITY_MONO_LOGO = `<svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="${ANTIGRAVITY_LOGO_PATH}" fill="currentColor"></path></svg>`;
const DEFAULT_AGENT_LOGO = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 3c.4 3.9 3.1 6.6 7 7-3.9.4-6.6 3.1-7 7-.4-3.9-3.1-6.6-7-7 3.9-.4 6.6-3.1 7-7z"/><path d="M17.8 13c.25 2.4 1.85 4 4.2 4.25-2.35.25-3.95 1.85-4.2 4.25-.25-2.4-1.85-4-4.2-4.25 2.35-.25 3.95-1.85 4.2-4.25z" opacity=".7"/></svg>`;

const PROVIDER_META: Record<string, { label: string; color: string; logo: string; monoLogo: string }> = {
  codex: { label: "Codex", color: "#3941ff", logo: CODEX_COLOR_LOGO, monoLogo: CODEX_MONO_LOGO },
  claude: { label: "Claude", color: "#d97757", logo: CLAUDE_COLOR_LOGO, monoLogo: CLAUDE_MONO_LOGO },
  antigravity: { label: "Antigravity", color: "#3186ff", logo: ANTIGRAVITY_COLOR_LOGO, monoLogo: ANTIGRAVITY_MONO_LOGO },
  default: { label: "Folio Agent", color: "#c79a45", logo: DEFAULT_AGENT_LOGO, monoLogo: DEFAULT_AGENT_LOGO },
};

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function messageId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatTime(value?: string) {
  const parsed = value ? new Date(value) : new Date();
  return parsed.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

function effortLabel(value: string) {
  return value === "high" ? "높음" : value === "low" ? "낮음" : "중간";
}

function elapsedSeconds(startedAt: number) {
  return `${Math.max(1, Math.round((Date.now() - startedAt) / 1000))}초`;
}

function selectedAdapter(settings: AgentSettings | null): AgentAdapterSettings | null {
  const provider = settings?.provider && PROVIDERS.has(settings.provider)
    ? settings.provider
    : settings?.selectedAdapter || "";
  return settings?.adapters?.find((adapter) => adapter.id === provider) || null;
}

function providerMeta(settings: AgentSettings | null) {
  const provider = settings?.provider && PROVIDERS.has(settings.provider)
    ? settings.provider
    : settings?.selectedAdapter || "";
  return PROVIDER_META[provider] || PROVIDER_META.default;
}

function modelChoicesFor(adapter: AgentAdapterSettings | null) {
  return adapter?.modelChoices || [];
}

function preferredModel(adapter: AgentAdapterSettings | null) {
  const choices = modelChoicesFor(adapter);
  if (!choices.length) return "";
  return choices.some((choice) => choice.value === adapter?.model) ? String(adapter?.model || "") : choices[0].value;
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

export function ReactAgentDock({ surface, open, onOpen, onClose }: ReactAgentDockProps) {
  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [preflight, setPreflight] = useState<AgentPreflight | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([WELCOME_AGENT_MESSAGE]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState("");
  const [effort, setEffort] = useState("medium");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const contextRef = useRef<Record<string, unknown>>({ surface });

  const applySettings = useCallback((payload: AgentSettings, keepCurrent = false) => {
    const adapter = selectedAdapter(payload);
    setSettings(payload);
    setModel((current) => {
      const preferred = preferredModel(adapter);
      if (keepCurrent && modelChoicesFor(adapter).some((choice) => choice.value === current)) return current;
      return preferred;
    });
  }, []);

  const loadAgentSettings = useCallback(async (refresh = false) => {
    const payload = await getJson<AgentSettings>(`/api/agent-bridge/settings${refresh ? "?refresh=true" : ""}`);
    applySettings(payload, true);
    return payload;
  }, [applySettings]);

  const loadPreflight = useCallback(async (payload: AgentSettings | null) => {
    try {
      const provider = payload?.provider && PROVIDERS.has(payload.provider) ? payload.provider : "";
      const query = provider ? `?adapter=${encodeURIComponent(provider)}` : "";
      setPreflight(await getJson<AgentPreflight>(`/api/agent-bridge/preflight${query}`));
    } catch (err) {
      setPreflight({
        ok: false,
        checks: [{
          id: "preflight",
          label: "Agent Preflight",
          ok: false,
          severity: "error",
          message: err instanceof Error ? err.message : "Agent 준비 상태를 확인하지 못했습니다.",
        }],
      });
    }
  }, []);

  useEffect(() => {
    let alive = true;
    getJson<AgentSettings>("/api/agent-bridge/settings")
      .then((payload) => {
        if (!alive) return;
        applySettings(payload);
        void loadPreflight(payload);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Agent 설정을 불러오지 못했습니다.");
      });
    return () => {
      alive = false;
    };
  }, [applySettings, loadPreflight]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    contextRef.current = { ...contextRef.current, surface };
  }, [surface]);

  useEffect(() => {
    const handleSettingsUpdate = (event: Event) => {
      const detail = (event as CustomEvent<AgentSettings | null>).detail;
      if (detail) {
        applySettings(detail);
        void loadPreflight(detail);
      } else {
        loadAgentSettings()
          .then((payload) => loadPreflight(payload))
          .catch((err) => setError(err instanceof Error ? err.message : "Agent 설정을 불러오지 못했습니다."));
      }
    };
    window.addEventListener("folio:agent-settings-updated", handleSettingsUpdate);
    return () => window.removeEventListener("folio:agent-settings-updated", handleSettingsUpdate);
  }, [applySettings, loadAgentSettings, loadPreflight]);

  const adapter = selectedAdapter(settings);
  const meta = providerMeta(settings);
  const modelChoices = modelChoicesFor(adapter);
  const accentStyle = useMemo(() => ({ "--react-agent-accent": meta.color } as CSSProperties), [meta.color]);
  const failedPreflightChecks = (preflight?.checks || []).filter((check) => !check.ok);

  const submitAgentMessage = useCallback(async (rawText: string, contextPatch: Record<string, unknown> = {}) => {
    const text = rawText.trim();
    if (!text || busy) return;

    const requestContext = { ...contextRef.current, ...contextPatch };
    contextRef.current = requestContext;
    const assistantId = messageId();
    const startedAt = Date.now();
    const createdAt = new Date(startedAt).toISOString();
    const providerLabel = adapter?.label || meta.label;
    const modelLabel = model || adapter?.model || "model";
    setMessages((current) => [
      ...current,
      { id: messageId(), role: "user", text, createdAt },
      {
        id: assistantId,
        role: "assistant",
        text: "",
        pending: true,
        runState: "pending",
        runTitle: `${providerLabel} 세션 시작`,
        runMeta: `${modelLabel} · ${effortLabel(effort)} · on-request`,
        createdAt,
      },
    ]);
    setInput("");
    setBusy(true);
    setError("");

    try {
      const job = await postJson<AgentJob>("/api/agent/chat", {
        message: text,
        context: requestContext,
        options: { model, effort },
      });
      const done = await pollAgentJob(job);
      const result = done.result || {};
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                text: result.reply || done.message || "Agent가 응답을 반환하지 않았습니다.",
                notice: result.notice,
                proposal: result.proposal || null,
                proposalStatus: result.proposal ? "pending" : "",
                pending: false,
                runState: "done",
                runTitle: `${providerLabel} 응답`,
                runMeta: `${modelLabel} · ${effortLabel(effort)} · ${elapsedSeconds(startedAt)}`,
              }
            : message,
        ),
      );
    } catch (err) {
      const messageText = err instanceof Error ? err.message : "Agent 요청에 실패했습니다.";
      setError(messageText);
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                text: messageText,
                pending: false,
                runState: "error",
                runTitle: `${providerLabel} 오류`,
                runMeta: `${modelLabel} · ${effortLabel(effort)}`,
              }
            : message,
        ),
      );
    } finally {
      setBusy(false);
    }
  }, [adapter?.label, adapter?.model, busy, effort, meta.label, model]);

  useEffect(() => {
    const handleAgentRequest = (event: Event) => {
      const detail = ((event as CustomEvent<AgentRequestDetail>).detail || {}) as AgentRequestDetail;
      const { message, prompt, autoSubmit, ...contextPatch } = detail;
      contextRef.current = { ...contextRef.current, ...contextPatch, surface: String(contextPatch.surface || surface) };
      const text = String(message || prompt || "");
      if (!text) return;
      if (autoSubmit) {
        void submitAgentMessage(text, contextPatch);
      } else {
        setInput(text);
      }
    };
    window.addEventListener("folio:react-agent-request", handleAgentRequest);
    return () => window.removeEventListener("folio:react-agent-request", handleAgentRequest);
  }, [submitAgentMessage, surface]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitAgentMessage(input);
  }

  function startNewChat() {
    setMessages([{ ...WELCOME_AGENT_MESSAGE, createdAt: new Date().toISOString() }]);
    setInput("");
    setError("");
  }

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

  async function handleProposalAction(messageIdValue: string, proposalId: string, action: "approve" | "reject") {
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

  if (!open) {
    return (
      <aside className="react-agent-dock is-closed" style={accentStyle} aria-label="AI Agent 닫힘">
        <button type="button" onClick={onOpen} aria-label="AI Agent 열기" data-tooltip="AI Agent 열기" data-tooltip-pos="left">
          <span className="react-agent-closed-dot" aria-hidden="true" />
          <span>AI</span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="react-agent-dock" style={accentStyle} aria-label="AI Agent">
      <header className="react-agent-dock-header">
        <div className="react-agent-dock-title">
          <span className="react-agent-logo" aria-hidden="true">
            <span className="react-agent-logo-mark" dangerouslySetInnerHTML={{ __html: meta.logo }} />
          </span>
          <div>
            <p className="section-kicker">Agent</p>
            <h2>{adapter?.label || meta.label}</h2>
          </div>
        </div>
        <div className="react-agent-header-actions">
          <button className="react-agent-new-chat" type="button" onClick={startNewChat}>
            새 채팅
          </button>
          <button className="icon-btn" type="button" aria-label="AI Agent 닫기" data-tooltip="닫기" data-tooltip-pos="left" onClick={onClose}>×</button>
        </div>
      </header>

      <div className="react-agent-dock-body" ref={bodyRef}>
        <div className="react-agent-watermark" aria-hidden="true" dangerouslySetInnerHTML={{ __html: meta.monoLogo }} />
        {failedPreflightChecks.length > 0 && (
          <div className="react-agent-preflight" role="status">
            <strong>Agent 준비 상태 확인 필요</strong>
            {failedPreflightChecks.slice(0, 3).map((check) => (
              <p key={check.id}>{check.message}</p>
            ))}
          </div>
        )}
        <div className="react-agent-messages">
          {messages.map((message) => (
            <article key={message.id} className={`react-agent-message ${message.role}${message.pending ? " pending" : ""}`}>
              {message.role === "assistant" && (
                <div className="react-agent-message-head">
                  <span className="react-agent-mini-logo" aria-hidden="true" dangerouslySetInnerHTML={{ __html: meta.logo }} />
                  <strong>{adapter?.label || meta.label}</strong>
                  <time>{formatTime(message.createdAt)}</time>
                </div>
              )}
              {message.runTitle && <AgentRunCard state={message.runState} title={message.runTitle} meta={message.runMeta} />}
              {message.text && (
                <div className={message.variant === "welcome" ? "react-agent-welcome-card" : ""}>
                  <AgentMessageContent text={message.text} />
                </div>
              )}
              {message.notice && <p className="react-agent-notice">{message.notice}</p>}
              {message.proposal && (
                <div className="agent-proposal">
                  <div className="agent-proposal-title">
                    <strong>{message.proposal.artifactKind || "proposal"}</strong>
                    {message.proposal.artifactId && <span>{message.proposal.artifactId}</span>}
                  </div>
                  {message.proposal.summary && <p>{message.proposal.summary}</p>}
                  {message.proposal.diff && (
                    <details className="agent-proposal-diff">
                      <summary>diff 보기</summary>
                      <pre>{message.proposal.diff}</pre>
                    </details>
                  )}
                  {message.proposalStatus === "pending" ? (
                    <div className="agent-actions">
                      <button type="button" onClick={() => handleProposalAction(message.id, message.proposal!.id, "approve")}>
                        승인
                      </button>
                      <button type="button" onClick={() => handleProposalAction(message.id, message.proposal!.id, "reject")}>
                        거절
                      </button>
                    </div>
                  ) : (
                    <p className="agent-proposal-status">상태: {message.proposalStatus}</p>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>

      <form className="react-agent-form" onSubmit={handleSubmit}>
        <textarea
          value={input}
          onChange={(event) => setInput(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          rows={2}
          placeholder="현재 화면에 대해 물어보세요"
        />
        <div className="react-agent-form-toolbar">
          <div className="react-agent-tools">
            <select value={model} onChange={(event) => persistModel(event.currentTarget.value)} aria-label="모델 버전">
              {modelChoices.length ? modelChoices.map((choice) => (
                <option key={choice.value} value={choice.value}>{choice.label}</option>
              )) : <option value="">기본 버전</option>}
            </select>
            <select value={effort} onChange={(event) => setEffort(event.currentTarget.value)} aria-label="노력 단계">
              <option value="low">노력 낮음</option>
              <option value="medium">노력 중간</option>
              <option value="high">노력 높음</option>
              <option value="max">노력 최대</option>
            </select>
          </div>
          <button type="submit" disabled={busy || !input.trim()}>{busy ? "작업 중" : "보내기"}</button>
        </div>
        {error && <p className="react-agent-error">{error}</p>}
      </form>
    </aside>
  );
}
