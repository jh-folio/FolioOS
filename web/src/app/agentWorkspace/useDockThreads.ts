import { useCallback, useEffect, useRef, useState } from "react";
import { getJson, postJson } from "../../api";
import {
  AGENT_HOME_THREAD_STORAGE_KEY,
  getAgentThreadMessages,
  resetAgentThreadMessages,
} from "./storage";
import type { AgentMessage, ConsultationMessage, ConsultationSession } from "./types";

const MIGRATED_KEY = "folio.agentThreads.migrated.v1";

// 도크가 대화의 집이다. 대화는 서버에 저장되므로 브라우저를 닫아도, 기기를 바꿔도
// 남고 — 무엇보다 Agent가 다음 세션에서 context로 읽을 수 있다. localStorage에만
// 있던 예전 구조에서는 그게 원천적으로 불가능했다.

function toAgentMessage(row: ConsultationMessage, index: number): AgentMessage {
  return {
    id: row.id || `restored-${index}`,
    role: row.role === "assistant" ? "assistant" : "user",
    text: String(row.content || ""),
    createdAt: row.createdAt,
  };
}

export function useDockThreads(welcome: AgentMessage) {
  const [threadId, setThreadId] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [scope, setScope] = useState<ConsultationSession["scope"] | null>(null);
  const migratedRef = useRef(false);

  const bumpList = useCallback(() => setRefreshKey((value) => value + 1), []);

  const createThread = useCallback(async (detail: { title?: string; scope?: ConsultationSession["scope"] } = {}) => {
    const created = await postJson<ConsultationSession>("/api/agent/threads", {
      title: detail.title || "새 대화",
      // 주제를 주지 않으면 주제 없는 대화다. 예전에는 알 수 없는 주제가 조용히
      // 포트폴리오로 떨어져 무관한 대화에 포트폴리오 맥락이 딸려 들어갔다.
      scope: detail.scope || { kind: "general" },
    });
    setThreadId(created.id);
    setScope(created.scope || null);
    bumpList();
    return created;
  }, [bumpList]);

  const openThread = useCallback(async (id: string): Promise<AgentMessage[]> => {
    const session = await getJson<ConsultationSession>(`/api/agent/threads/${encodeURIComponent(id)}`);
    setThreadId(session.id);
    setScope(session.scope || null);
    const rows = session.messages || [];
    return rows.length ? rows.map(toAgentMessage) : [{ ...welcome, createdAt: new Date().toISOString() }];
  }, [welcome]);

  /** 브라우저에만 있던 대화를 서버 스레드로 한 번 옮긴다. 실패하면 원본을 지우지 않는다. */
  const migrateLocalThread = useCallback(async () => {
    if (migratedRef.current) return;
    migratedRef.current = true;
    if (window.localStorage.getItem(MIGRATED_KEY)) return;
    const local = getAgentThreadMessages().filter((row) => row.text && row.variant !== "welcome");
    if (!local.length) {
      window.localStorage.setItem(MIGRATED_KEY, new Date().toISOString());
      return;
    }
    try {
      // 기록만 옮긴다. 메시지 API로 재생하면 옛 질문이 전부 Agent 잡으로 다시 실행된다.
      await postJson<ConsultationSession>("/api/agent/threads", {
        title: "이전 대화",
        scope: { kind: "general" },
        importMessages: local.map((row) => ({ role: row.role, content: row.text, createdAt: row.createdAt })),
      });
      window.localStorage.setItem(MIGRATED_KEY, new Date().toISOString());
      resetAgentThreadMessages();
      window.localStorage.removeItem(AGENT_HOME_THREAD_STORAGE_KEY);
      bumpList();
    } catch {
      // 이관은 편의 기능이다. 실패해도 사용자가 쓰던 대화는 브라우저에 남는다.
      migratedRef.current = false;
    }
  }, [bumpList]);

  useEffect(() => { void migrateLocalThread(); }, [migrateLocalThread]);

  return { threadId, setThreadId, scope, setScope, refreshKey, bumpList, createThread, openThread };
}
