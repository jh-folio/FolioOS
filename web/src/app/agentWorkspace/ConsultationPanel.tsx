import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { deleteJson, getJson, postJson, type JobStatus } from "../../api";
import { pollAgentJobBounded } from "../agentPolling";
import { dismissLegacyConsultationNotice, getActiveConsultationId, setActiveConsultationId, shouldShowLegacyConsultationNotice } from "./storage";
import type { ConsultationSession } from "./types";

type OpenDetail = { scope?: ConsultationSession["scope"]; title?: string; initialMessage?: string };
type SessionList = { items?: ConsultationSession[]; nextCursor?: string | null };
type AgentJob = { id: string; status: JobStatus; message?: string; error?: string };
type MessageResponse = { sessionId: string; messageId: string; job: AgentJob };
type NoteDraft = { noteType: "company_thesis" | "portfolio_decision" | "investment_note"; title: string; body: string; ticker: string };

function operationId() {
  return `op-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function openConsultation(detail: OpenDetail = {}) {
  window.dispatchEvent(new CustomEvent<OpenDetail>("folio:open-consultation", { detail }));
}

export function ConsultationPanel() {
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<ConsultationSession[]>([]);
  const [session, setSession] = useState<ConsultationSession | null>(null);
  const [input, setInput] = useState("");
  const [titleDraft, setTitleDraft] = useState("");
  const [pendingOpen, setPendingOpen] = useState<OpenDetail>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [legacyNotice, setLegacyNotice] = useState(shouldShowLegacyConsultationNotice());
  const [noteDraft, setNoteDraft] = useState<NoteDraft | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const loadList = useCallback(async () => {
    const payload = await getJson<SessionList>("/api/agent/consultations?limit=60");
    setSessions(payload.items || []);
    return payload.items || [];
  }, []);

  const loadSession = useCallback(async (sessionId: string) => {
    const payload = await getJson<ConsultationSession>(`/api/agent/consultations/${encodeURIComponent(sessionId)}`);
    setSession(payload); setTitleDraft(payload.title || ""); setActiveConsultationId(payload.id);
    return payload;
  }, []);

  const createSession = useCallback(async (detail: OpenDetail = {}) => {
    const payload = await postJson<ConsultationSession>("/api/agent/consultations", { title: detail.title || "새 투자 상담", scope: detail.scope || { kind: "portfolio" } });
    setSession(payload); setTitleDraft(payload.title); setActiveConsultationId(payload.id); setInput(detail.initialMessage || "");
    await loadList();
    return payload;
  }, [loadList]);

  useEffect(() => {
    const handler = (event: Event) => { setPendingOpen((event as CustomEvent<OpenDetail>).detail || {}); setOpen(true); };
    window.addEventListener("folio:open-consultation", handler);
    return () => window.removeEventListener("folio:open-consultation", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    setError("");
    loadList().then(async (items) => {
      const detail = pendingOpen;
      const activeId = getActiveConsultationId();
      const matching = items.find((row) => row.status === "active" && detail.scope?.kind === row.scope.kind && (!detail.scope?.id || detail.scope.id === row.scope.id));
      const target = matching?.id || (activeId && items.some((row) => row.id === activeId) ? activeId : "");
      if (target) { await loadSession(target); if (detail.initialMessage) setInput(detail.initialMessage); }
      else await createSession(detail);
    }).catch((reason) => setError(reason instanceof Error ? reason.message : "상담을 불러오지 못했습니다."));
  }, [open, pendingOpen, createSession, loadList, loadSession]);

  useEffect(() => {
    if (!open) return undefined;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    window.requestAnimationFrame(() => closeRef.current?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')).filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus({ preventScroll: true });
    };
  }, [open]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!session || !message || busy) return;
    setBusy(true); setError(""); setInput("");
    try {
      const response = await postJson<MessageResponse>(`/api/agent/consultations/${encodeURIComponent(session.id)}/messages`, { message, operationId: operationId() });
      await loadSession(response.sessionId);
      await pollAgentJobBounded(response.job);
      await loadSession(response.sessionId);
      await loadList();
    } catch (reason) {
      setInput(message);
      setError(reason instanceof Error ? reason.message : "상담 답변을 가져오지 못했습니다. 저장된 질문은 다시 시도할 수 있습니다.");
      if (session) await loadSession(session.id).catch(() => undefined);
    } finally { setBusy(false); }
  }

  async function rename() {
    if (!session || !titleDraft.trim()) return;
    const payload = await postJson<ConsultationSession>(`/api/agent/consultations/${encodeURIComponent(session.id)}`, { title: titleDraft.trim() });
    setSession(payload); await loadList();
  }

  async function archive() {
    if (!session) return;
    await postJson(`/api/agent/consultations/${encodeURIComponent(session.id)}/archive`, {});
    setSession(null); setActiveConsultationId(""); await loadList();
  }

  async function remove() {
    if (!session || !window.confirm("이 상담 내역을 삭제할까요? 삭제 후 복구할 수 없습니다.")) return;
    await deleteJson(`/api/agent/consultations/${encodeURIComponent(session.id)}`, { confirm: true });
    setSession(null); setActiveConsultationId(""); await loadList();
  }

  function exportLocal() {
    if (!session) return;
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a");
    link.href = url; link.download = `${session.id}.json`; link.click(); URL.revokeObjectURL(url);
  }

  async function previewNote() {
    if (!session) return;
    const type = session.scope.kind === "portfolio" ? "portfolio_decision" : session.scope.kind === "company_analysis" || session.scope.kind === "watchlist" ? "company_thesis" : "investment_note";
    const payload = await postJson<{ note: NoteDraft }>(`/api/agent/consultations/${encodeURIComponent(session.id)}/note`, { preview: true, noteType: type });
    setNoteDraft(payload.note);
  }

  async function saveNote() {
    if (!session || !noteDraft) return;
    await postJson(`/api/agent/consultations/${encodeURIComponent(session.id)}/note`, { ...noteDraft, preview: false });
    setNoteDraft(null);
  }

  const waitingMessage = useMemo(() => [...(session?.messages || [])].reverse().find((row) => row.role === "user" && row.status === "awaiting_agent"), [session]);

  async function retryWaiting() {
    if (!session || !waitingMessage) return;
    setBusy(true); setError("");
    try {
      const response = await postJson<MessageResponse>(`/api/agent/consultations/${encodeURIComponent(session.id)}/messages`, { retryMessageId: waitingMessage.id, operationId: operationId() });
      await pollAgentJobBounded(response.job); await loadSession(response.sessionId);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "재시도에 실패했습니다."); }
    finally { setBusy(false); }
  }

  if (!open) return null;
  return (
    <aside ref={panelRef} className="consultation-panel" aria-label="투자 상담" aria-modal="true" role="dialog">
      <header><div><span>ISOLATED HYPOTHESIS CHAT</span><h2>투자 상담</h2></div><button ref={closeRef} className="icon-btn" type="button" aria-label="상담 닫기" onClick={() => setOpen(false)}>×</button></header>
      {legacyNotice && <div className="settings-notice warn"><strong>기존 로컬 대화가 있습니다.</strong><span>자동으로 옮기거나 삭제하지 않습니다. 필요한 내용을 확인해 새 상담에 직접 붙여 넣을 수 있습니다.</span><button className="filter-btn clear" type="button" onClick={() => { dismissLegacyConsultationNotice(); setLegacyNotice(false); }}>확인</button></div>}
      <div className="consultation-layout">
        <nav className="consultation-sessions" aria-label="저장된 상담"><button className="filter-btn apply" type="button" onClick={() => createSession(pendingOpen)}>새 상담</button>{sessions.map((row) => <button type="button" className={row.id === session?.id ? "active" : ""} onClick={() => loadSession(row.id)} key={row.id}><strong>{row.title}</strong><small>{row.scope.kind} · {row.messageCount || 0} turns</small></button>)}</nav>
        <section className="consultation-thread">
          {session ? <>
            <div className="consultation-toolbar"><input aria-label="상담 제목" value={titleDraft} onChange={(event) => setTitleDraft(event.currentTarget.value)} /><button className="filter-btn" type="button" onClick={rename}>이름 저장</button><button className="filter-btn" type="button" onClick={exportLocal}>내보내기</button><button className="filter-btn" type="button" onClick={archive}>보관</button><button className="filter-btn clear" type="button" onClick={remove}>삭제</button></div>
            <p className="consultation-boundary">이 대화 안에서는 맥락이 이어지지만, 내용은 보고서·Market Memory·근거 평가에 사용되지 않습니다.</p>
            <div className="consultation-messages" aria-live="polite">{(session.messages || []).map((message) => <article className={`consultation-message consultation-message--${message.role}`} key={message.id}><span>{message.role === "user" ? "나" : "Folio Agent"}</span><div>{message.content}</div><small>{message.status || ""}{message.engine ? ` · ${message.engine}` : ""}</small></article>)}</div>
            {waitingMessage && <button className="filter-btn" type="button" disabled={busy} onClick={retryWaiting}>저장된 질문 다시 답변</button>}
            <form className="consultation-composer" onSubmit={submit}><textarea value={input} onChange={(event) => setInput(event.currentTarget.value)} placeholder="지금 궁금한 점이나 검토할 상황을 그대로 적어보세요." rows={4} /><div><button className="filter-btn" type="button" onClick={previewNote}>노트로 정리</button><button className="filter-btn apply" type="submit" disabled={busy || !input.trim()}>{busy ? "답변 작성 중" : "보내기"}</button></div></form>
          </> : <p className="cockpit-empty">상담을 선택하거나 새로 시작하세요.</p>}
          {error && <p className="react-dashboard-error" role="alert">{error}</p>}
        </section>
      </div>
      {noteDraft && <div className="consultation-note-preview"><h3>노트 미리보기</h3><label>유형<select value={noteDraft.noteType} onChange={(event) => setNoteDraft({ ...noteDraft, noteType: event.currentTarget.value as NoteDraft["noteType"] })}><option value="company_thesis">기업 thesis</option><option value="portfolio_decision">Portfolio 판단</option><option value="investment_note">투자 노트</option></select></label><label>제목<input value={noteDraft.title} onChange={(event) => setNoteDraft({ ...noteDraft, title: event.currentTarget.value })} /></label><label>본문<textarea rows={10} value={noteDraft.body} onChange={(event) => setNoteDraft({ ...noteDraft, body: event.currentTarget.value })} /></label><div><button className="filter-btn clear" type="button" onClick={() => setNoteDraft(null)}>취소</button><button className="filter-btn apply" type="button" onClick={saveNote}>내 생각 노트로 저장</button></div></div>}
    </aside>
  );
}
