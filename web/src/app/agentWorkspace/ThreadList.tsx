import { useCallback, useEffect, useState } from "react";
import { deleteJson, getJson, postJson } from "../../api";
import type { ConsultationSession } from "./types";

type ThreadListPayload = { items?: ConsultationSession[]; nextCursor?: string | null };

// 주제는 별도 이름이 아니라 칩으로 보여준다. 화면에서는 전부 "대화"다.
const SCOPE_LABELS: Record<string, string> = {
  watchlist: "관심 종목",
  portfolio: "포트폴리오",
  briefing: "브리핑",
  company_analysis: "기업 분석",
  topic_report: "딥 리서치",
  market_memory: "시장 내러티브",
  change: "변화",
};

export function scopeChipLabel(scope: ConsultationSession["scope"] | undefined): string {
  if (!scope || scope.kind === "general") return "";
  const base = SCOPE_LABELS[scope.kind] || scope.kind;
  // 티커가 있으면 그게 가장 알아보기 쉬운 표시다.
  const subject = (scope.tickers && scope.tickers[0]) || scope.id || "";
  return subject ? `${subject}` : base;
}

export function ThreadList({
  activeId,
  refreshKey,
  onSelect,
  onDeleted,
}: {
  activeId: string;
  refreshKey: number;
  onSelect: (id: string) => void;
  onDeleted: (id: string) => void;
}) {
  const [threads, setThreads] = useState<ConsultationSession[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [renamingId, setRenamingId] = useState("");
  const [titleDraft, setTitleDraft] = useState("");

  const load = useCallback(async () => {
    try {
      const payload = await getJson<ThreadListPayload>("/api/agent/threads?limit=60");
      setThreads(payload.items || []);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "대화 목록을 불러오지 못했습니다.");
    }
  }, []);

  useEffect(() => { void load(); }, [load, refreshKey]);

  async function remove(thread: ConsultationSession) {
    // 지운 대화는 되돌릴 수 없다. 저장소도 confirmed 없이는 지우지 않는다.
    if (!window.confirm(`"${thread.title}" 대화를 삭제할까요? 삭제 후 복구할 수 없습니다.`)) return;
    setBusyId(thread.id);
    try {
      await deleteJson(`/api/agent/threads/${encodeURIComponent(thread.id)}`, { confirm: true });
      onDeleted(thread.id);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "삭제하지 못했습니다.");
    } finally {
      setBusyId("");
    }
  }

  async function archive(thread: ConsultationSession) {
    setBusyId(thread.id);
    try {
      await postJson(`/api/agent/threads/${encodeURIComponent(thread.id)}/archive`, {});
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "보관하지 못했습니다.");
    } finally {
      setBusyId("");
    }
  }

  async function rename(thread: ConsultationSession) {
    const title = titleDraft.trim();
    setRenamingId("");
    if (!title || title === thread.title) return;
    setBusyId(thread.id);
    try {
      await postJson(`/api/agent/threads/${encodeURIComponent(thread.id)}`, { title });
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "제목을 바꾸지 못했습니다.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="agent-threads" aria-label="저장된 대화">
      {error && <p className="agent-threads__error">{error}</p>}
      {threads.length === 0 && !error && <p className="agent-threads__empty">저장된 대화가 없습니다.</p>}
      <ul>
        {threads.map((thread) => {
          const chip = scopeChipLabel(thread.scope);
          return (
            <li key={thread.id} data-active={thread.id === activeId ? "true" : undefined}>
              {renamingId === thread.id ? (
                <form
                  className="agent-threads__rename"
                  onSubmit={(event) => { event.preventDefault(); void rename(thread); }}
                >
                  <input
                    value={titleDraft}
                    autoFocus
                    aria-label="대화 제목"
                    onChange={(event) => setTitleDraft(event.currentTarget.value)}
                    onBlur={() => void rename(thread)}
                  />
                </form>
              ) : (
                <button
                  type="button"
                  className="agent-threads__open"
                  aria-current={thread.id === activeId ? "true" : undefined}
                  onClick={() => onSelect(thread.id)}
                >
                  <span className="agent-threads__title">{thread.title}</span>
                  <span className="agent-threads__meta">
                    {chip && <em className="chip">{chip}</em>}
                    {thread.messageCount ? `${thread.messageCount}개` : "비어 있음"}
                    {thread.status === "archived" ? " · 보관됨" : ""}
                  </span>
                </button>
              )}
              <span className="agent-threads__actions">
                <button
                  type="button" className="btn btn--text btn--sm" disabled={busyId === thread.id}
                  onClick={() => { setRenamingId(thread.id); setTitleDraft(thread.title); }}
                >제목</button>
                {thread.status !== "archived" && (
                  <button
                    type="button" className="btn btn--text btn--sm" disabled={busyId === thread.id}
                    onClick={() => void archive(thread)}
                  >보관</button>
                )}
                <button
                  type="button" className="btn btn--text btn--sm" disabled={busyId === thread.id}
                  onClick={() => void remove(thread)}
                >삭제</button>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
