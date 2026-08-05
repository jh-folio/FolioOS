import { useCallback, useEffect, useRef, useState } from "react";
import {
  ApiRequestError,
  deleteJson,
  getJson,
  parseWorkLogList,
  postJson,
  type AgentProposalRecord,
  type WorkLogClearPreview,
  type WorkLogClearResponse,
  type WorkLogEntry,
  type WorkLogFilter,
  type WorkLogList,
} from "../api";
import { boundedProposalDiff, boundedProposalSummary, PROPOSAL_LIFECYCLE_EVENT } from "./agentProposalLifecycle";
import { workLogItemCopy, workLogLatestSummary } from "./workLogCopy";

type AgentWorkLogProps = {
  readonly surface: "home" | "deep-research";
  readonly pageSize?: number;
  readonly defaultFilter?: WorkLogFilter;
  readonly refreshKey?: number;
  readonly collapsible?: boolean;
};

type DialogKind = "clear" | null;

function errorCode(error: unknown) {
  if (error instanceof ApiRequestError) return error.code || `http_${error.status}`;
  if (error instanceof Error && /^[a-z0-9_]+$/.test(error.message)) return error.message;
  return "request_failed";
}

function displayTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "시간 확인 불가" : new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export function AgentWorkLog({ surface, pageSize = 20, defaultFilter = "all", refreshKey = 0, collapsible = false }: AgentWorkLogProps) {
  const [filter, setFilter] = useState<WorkLogFilter>(defaultFilter);
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<WorkLogList | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [clearPreview, setClearPreview] = useState<WorkLogClearPreview | null>(null);
  const [clearBusy, setClearBusy] = useState(false);
  const [clearError, setClearError] = useState("");
  const [clearSuccess, setClearSuccess] = useState("");
  const [proposal, setProposal] = useState<AgentProposalRecord | null>(null);
  const [proposalLoading, setProposalLoading] = useState("");
  const [proposalError, setProposalError] = useState("");
  const requestSequence = useRef(0);
  const activeController = useRef<AbortController | null>(null);
  const clearInFlight = useRef(false);
  const proposalInFlight = useRef(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);

  const load = useCallback(async () => {
    const sequence = ++requestSequence.current;
    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;
    setLoading(true);
    setListError("");
    try {
      const raw = await getJson<unknown>(`/api/agent/work-log?kind=${filter}&limit=${pageSize}&offset=${offset}`, { signal: controller.signal });
      const next = parseWorkLogList(raw);
      if (sequence !== requestSequence.current) return;
      setData(next);
    } catch (error) {
      if (controller.signal.aborted || sequence !== requestSequence.current) return;
      setListError(errorCode(error));
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }, [filter, offset, pageSize]);

  useEffect(() => {
    void load();
    return () => activeController.current?.abort();
  }, [load, refreshKey]);

  useEffect(() => {
    const handleProposalLifecycle = () => {
      setProposal(null);
      void load();
    };
    window.addEventListener(PROPOSAL_LIFECYCLE_EVENT, handleProposalLifecycle);
    return () => window.removeEventListener(PROPOSAL_LIFECYCLE_EVENT, handleProposalLifecycle);
  }, [load]);

  useEffect(() => {
    if (!dialog) return;
    dialogRef.current?.querySelector<HTMLElement>("button:not([disabled]), input:not([disabled])")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDialog();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled])"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [dialog]);

  function closeDialog() {
    setDialog(null);
    setClearPreview(null);
    setClearError("");
    window.setTimeout(() => openerRef.current?.focus(), 0);
  }

  function changeFilter(next: WorkLogFilter) {
    setFilter(next);
    setOffset(0);
    setProposal(null);
    setProposalError("");
  }

  async function previewClear(button: HTMLButtonElement) {
    if (clearInFlight.current) return;
    clearInFlight.current = true;
    openerRef.current = button;
    setClearBusy(true);
    setClearError("");
    setClearSuccess("");
    try {
      const preview = await postJson<WorkLogClearPreview>("/api/agent/work-log/clear-preview", { scope: filter });
      setClearPreview(preview);
      setDialog("clear");
    } catch (error) {
      setClearError(errorCode(error));
    } finally { clearInFlight.current = false; setClearBusy(false); }
  }

  async function confirmClear() {
    if (!clearPreview || clearInFlight.current) return;
    clearInFlight.current = true;
    setClearBusy(true);
    setClearError("");
    try {
      const result = await deleteJson<WorkLogClearResponse>("/api/agent/work-log", { scope: clearPreview.scope, previewToken: clearPreview.previewToken });
      setClearSuccess(`${result.hiddenCount}건을 목록에서 숨겼습니다.`);
      closeDialog();
      setOffset(0);
      await load();
    } catch (error) {
      setClearPreview(null);
      setClearError(errorCode(error));
    } finally { clearInFlight.current = false; setClearBusy(false); }
  }

  async function openProposal(entry: WorkLogEntry) {
    if (!entry.proposalId || proposalInFlight.current) return;
    proposalInFlight.current = true;
    setProposalLoading(entry.proposalId);
    setProposalError("");
    setProposal(null);
    try {
      const record = await getJson<AgentProposalRecord>(`/api/agent/proposals/${encodeURIComponent(entry.proposalId)}`);
      if (record.id !== entry.proposalId) throw new Error("proposal_identity_mismatch");
      if (record.status !== "pending" && record.status !== "applying") {
        throw new Error("proposal_not_active");
      }
      setProposal(record);
    } catch (error) {
      setProposalError(errorCode(error));
      await load();
    } finally { proposalInFlight.current = false; setProposalLoading(""); }
  }

  const entries = data?.entries || [];
  const canNext = Boolean(data && offset + pageSize < data.total);
  const latestSummary = workLogLatestSummary(entries[0], loading && !data);
  // 고를 것이 없는 필터와 넘길 곳이 없는 페이지 이동은 그리지 않는다.
  // 이미 범주를 좁혀둔 상태라면 돌아갈 길이 필요하므로 필터는 남긴다.
  const showFilters = filter !== "all" || (data?.total ?? 0) > 1;
  const showPagination = Boolean(data && data.total > pageSize);
  const body = (
    <>
      {!collapsible && (
        <header className="work-log-head">
          <div><p className="section-kicker">Agent Work Log</p><h2>Agent 작업 기록</h2></div>
        </header>
      )}
      {/* 범주 필터와 새로고침은 같은 줄에 둔다. 접힌 머리말 아래에 빈 행이 생기지 않는다. */}
      <div className="work-log-toolbar">
        {showFilters ? (
          <div className="work-log-filters" data-qa="work-log-filter" aria-label="작업 범주">
            {(["all", "companion", "task"] as const).map((value) => <button key={value} type="button" className={`btn${filter === value ? " active" : ""}`} data-qa={`work-log-filter-${value}`} aria-pressed={filter === value} onClick={() => changeFilter(value)}>{value === "all" ? "전체" : value === "companion" ? "대화" : "작업"}</button>)}
          </div>
        ) : <span />}
        <button className="btn btn--icon" type="button" data-qa="work-log-refresh" disabled={loading} onClick={() => void load()} aria-label="작업 기록 새로고침" data-tooltip="새로고침">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9" /><path d="M13.5 2.5V6H10" /></svg>
        </button>
      </div>
      {loading && !data && <p data-qa="work-log-loading" role="status">작업 기록을 불러오는 중입니다.</p>}
      {listError && <p className="react-dashboard-error" data-qa="work-log-error" data-error-code={listError} role="alert">작업 기록을 불러오지 못했습니다. ({listError})</p>}
      {clearError && <p className="react-dashboard-error" data-qa="work-log-clear-error" data-error-code={clearError}>숨기기 미리보기가 만료되었거나 실패했습니다. 다시 미리보세요. ({clearError})</p>}
      {clearSuccess && <p className="react-dashboard-warning" data-qa="work-log-clear-success" role="status">{clearSuccess}</p>}
      {proposalError && <p className="react-dashboard-error" data-qa="work-log-proposal-error" data-error-code={proposalError}>제안이 만료되었거나 현재 열 수 없습니다. ({proposalError})</p>}
      {!loading && !listError && entries.length === 0 && <p className="work-log-empty" data-qa="work-log-empty">표시할 Agent 작업 기록이 없습니다.</p>}
      {entries.length > 0 && <div className="work-log-list" data-qa="work-log-list">
        {entries.map((entry) => {
          const copy = workLogItemCopy(entry);
          return (
            <article className={`work-log-item status-${entry.status} tone-${copy.tone}`} data-qa="work-log-item" data-tone={copy.tone} key={entry.id}>
              <div className="work-log-item-main">
                <div className="work-log-item-title">
                  <strong data-qa="work-log-task-type">{copy.title}</strong>
                  <span className="work-log-badge" data-qa="work-log-status" data-tone={copy.tone}>{copy.statusLabel}</span>
                </div>
                <p className="work-log-outcome" data-qa="work-log-outcome">{copy.outcome}</p>
                {copy.details.length > 0 && (
                  <p className="work-log-detail" data-qa="work-log-execution">{copy.details.join(" · ")}</p>
                )}
                {copy.attention && <p className="work-log-attention" data-qa="work-log-proposal-status">{copy.attention}</p>}
              </div>
              <div className="work-log-item-side">
                <time data-qa="work-log-time" dateTime={entry.updatedAt}>{displayTime(entry.finishedAt || entry.updatedAt)}</time>
                {entry.proposalId && (entry.proposalStatus === "pending" || entry.proposalStatus === "applying") && <button type="button" className="btn" data-qa="work-log-proposal-open" disabled={proposalLoading === entry.proposalId} onClick={() => void openProposal(entry)}>{proposalLoading === entry.proposalId ? <span data-qa="work-log-proposal-loading">불러오는 중</span> : "승인 검토"}</button>}
              </div>
            </article>
          );
        })}
      </div>}
      {data && <footer className="work-log-footer">
        <div className="work-log-footer-note">
          <p data-qa="work-log-retention">최근 {data.retention.maxDays}일, 최대 {data.retention.maxEntries}건을 표시합니다.</p>
          <p>작업 내용 원문이나 개인 자료 없이 진행 상태 요약만 표시합니다.</p>
        </div>
        <div className="work-log-footer-actions">
          {showPagination && <div className="work-log-pagination"><span data-qa="work-log-page-summary">{data.total ? `${offset + 1}–${Math.min(offset + pageSize, data.total)} / ${data.total}` : "0 / 0"}</span><button type="button" data-qa="work-log-page-prev" disabled={offset === 0 || loading} onClick={() => setOffset(Math.max(0, offset - pageSize))}>이전</button><button type="button" data-qa="work-log-page-next" disabled={!canNext || loading} onClick={() => setOffset(offset + pageSize)}>다음</button></div>}
          {entries.length > 0 && <button className="work-log-quiet-btn" type="button" data-qa="work-log-clear-preview" disabled={clearBusy} onClick={(event) => void previewClear(event.currentTarget)}>기록 숨기기</button>}
        </div>
      </footer>}

      {dialog === "clear" && clearPreview && <div className="work-log-dialog-backdrop"><div className="work-log-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="work-log-clear-title" data-qa="work-log-clear-dialog"><h3 id="work-log-clear-title">작업 기록 숨기기</h3><p data-qa="work-log-clear-count">현재 범위 {clearPreview.count}건</p><p>목록에서만 숨깁니다. 공유 작업, 보고서, 제안, 레거시 파일은 삭제하지 않습니다.</p><div className="work-log-dialog-actions"><button type="button" data-qa="work-log-clear-confirm" disabled={clearBusy} onClick={() => void confirmClear()}>숨기기 확인</button><button type="button" data-qa="work-log-clear-cancel" onClick={closeDialog}>취소</button></div></div></div>}
      {proposal && <aside className="work-log-proposal-surface" data-qa="proposal-approval-surface" aria-label="활성 제안 승인 검토"><div><p className="section-kicker">승인 필요</p><h3>{boundedProposalSummary(proposal.summary) || "저장 변경 제안"}</h3><p>이 내용은 작업 기록이 아니라 요청 시 별도로 불러온 승인 제안입니다.</p></div>{proposal.diff && <pre>{boundedProposalDiff(proposal.diff)}</pre>}<button type="button" className="btn" onClick={() => setProposal(null)}>닫기</button></aside>}
    </>
  );
  return (
    <section className={`work-log work-log-${surface}${collapsible ? " work-log-collapsible" : ""}`} data-qa="work-log" aria-busy={loading}>
      {collapsible ? (
        <details className="work-log-collapse">
          <summary>
            <span className="section-kicker">Agent Work Log</span>
            <strong>Agent 작업 기록</strong>
            <span className="work-log-latest" data-qa="work-log-latest">{latestSummary}</span>
          </summary>
          {body}
        </details>
      ) : body}
    </section>
  );
}
