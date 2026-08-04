import type { AgentMessage } from "./types";

export const AGENT_HOME_THREAD_STORAGE_KEY = "folio.agentHome.thread.v1";
export const ACTIVE_CONSULTATION_STORAGE_KEY = "folio.consultation.active.v1";
export const LEGACY_CONSULTATION_NOTICE_KEY = "folio.consultation.legacyNotice.v1";

export const WELCOME_MESSAGE: AgentMessage = {
  id: "welcome",
  role: "assistant",
  text: "무엇을 조사하거나 정리할까요? 질문으로 시작해도 되고, 보고서 수정 작업을 지시해도 됩니다.",
  notice: "저장 변경은 proposal 승인 전에는 반영되지 않습니다.",
};

type ThreadListener = (messages: AgentMessage[]) => void;

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
  if (typeof window === "undefined") return [WELCOME_MESSAGE];
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

let currentMessages = loadStoredMessages();
let currentFingerprint = JSON.stringify(messagesForStorage(currentMessages));
const listeners = new Set<ThreadListener>();

function notifyThreadListeners() {
  const snapshot = [...currentMessages];
  listeners.forEach((listener) => listener(snapshot));
}

export function getAgentThreadMessages() {
  return [...currentMessages];
}

export function setAgentThreadMessages(messages: AgentMessage[]) {
  const stored = messagesForStorage(messages);
  const fingerprint = JSON.stringify(stored);
  if (fingerprint === currentFingerprint) return;
  currentMessages = messages.length ? [...messages] : [WELCOME_MESSAGE];
  currentFingerprint = fingerprint;
  if (typeof window !== "undefined") {
    try {
      if (!stored.length) {
        window.localStorage.removeItem(AGENT_HOME_THREAD_STORAGE_KEY);
      } else {
        window.localStorage.setItem(
          AGENT_HOME_THREAD_STORAGE_KEY,
          JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), messages: stored }),
        );
      }
    } catch {
      // Storage capacity or permission failures must not block the current session.
    }
  }
  notifyThreadListeners();
}

export function resetAgentThreadMessages() {
  currentMessages = [WELCOME_MESSAGE];
  currentFingerprint = "[]";
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(AGENT_HOME_THREAD_STORAGE_KEY);
    } catch {
      // Keep the in-memory reset when storage is unavailable.
    }
  }
  notifyThreadListeners();
}

export function subscribeAgentThread(listener: ThreadListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getActiveConsultationId() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(ACTIVE_CONSULTATION_STORAGE_KEY) || "";
}

export function setActiveConsultationId(sessionId: string) {
  if (typeof window === "undefined") return;
  if (sessionId) window.localStorage.setItem(ACTIVE_CONSULTATION_STORAGE_KEY, sessionId);
  else window.localStorage.removeItem(ACTIVE_CONSULTATION_STORAGE_KEY);
}

export function shouldShowLegacyConsultationNotice() {
  if (typeof window === "undefined") return false;
  return Boolean(window.localStorage.getItem(AGENT_HOME_THREAD_STORAGE_KEY)) && !window.localStorage.getItem(LEGACY_CONSULTATION_NOTICE_KEY);
}

export function dismissLegacyConsultationNotice() {
  if (typeof window !== "undefined") window.localStorage.setItem(LEGACY_CONSULTATION_NOTICE_KEY, "dismissed");
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== AGENT_HOME_THREAD_STORAGE_KEY) return;
    currentMessages = loadStoredMessages();
    currentFingerprint = JSON.stringify(messagesForStorage(currentMessages));
    notifyThreadListeners();
  });
}
