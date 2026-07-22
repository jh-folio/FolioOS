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
  type WorkLogMigrationPreview,
  type WorkLogMigrationResponse,
} from "../api";
import { boundedProposalDiff, boundedProposalSummary, PROPOSAL_LIFECYCLE_EVENT } from "./agentProposalLifecycle";

type AgentWorkLogProps = {
  readonly surface: "home" | "deep-research";
  readonly pageSize?: number;
  readonly defaultFilter?: WorkLogFilter;
  readonly refreshKey?: number;
};

type DialogKind = "clear" | "migration" | null;
type MigrationAction = "migrate_keep_original" | "migrate_delete_original";

function errorCode(error: unknown) {
  if (error instanceof ApiRequestError) return error.code || `http_${error.status}`;
  if (error instanceof Error && /^[a-z0-9_]+$/.test(error.message)) return error.message;
  return "request_failed";
}

function displayTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "시간 확인 불가" : new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function codeLabel(value: string | null) {
  return value ? value.split("_").join(" · ") : "없음";
}

export function AgentWorkLog({ surface, pageSize = 20, defaultFilter = "all", refreshKey = 0 }: AgentWorkLogProps) {
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
  const [migrationPreview, setMigrationPreview] = useState<WorkLogMigrationPreview | null>(null);
  const [migrationAction, setMigrationAction] = useState<MigrationAction>("migrate_keep_original");
  const [migrationBusy, setMigrationBusy] = useState(false);
  const [migrationError, setMigrationError] = useState("");
  const [migrationSuccess, setMigrationSuccess] = useState("");
  const [proposal, setProposal] = useState<AgentProposalRecord | null>(null);
  const [proposalLoading, setProposalLoading] = useState("");
  const [proposalError, setProposalError] = useState("");
  const requestSequence = useRef(0);
  const activeController = useRef<AbortController | null>(null);
  const clearInFlight = useRef(false);
  const migrationInFlight = useRef(false);
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
    setMigrationPreview(null);
    setClearError("");
    setMigrationError("");
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

  async function previewMigration(button: HTMLButtonElement) {
    if (migrationInFlight.current) return;
    migrationInFlight.current = true;
    openerRef.current = button;
    setMigrationBusy(true);
    setMigrationError("");
    setMigrationSuccess("");
    try {
      const preview = await postJson<WorkLogMigrationPreview>("/api/agent/work-log/migration-preview", {});
      setMigrationPreview(preview);
      setMigrationAction("migrate_keep_original");
      setDialog("migration");
    } catch (error) { setMigrationError(errorCode(error)); }
    finally { migrationInFlight.current = false; setMigrationBusy(false); }
  }

  async function confirmMigration() {
    if (!migrationPreview || migrationInFlight.current || migrationPreview.collisions.length > 0) return;
    migrationInFlight.current = true;
    setMigrationBusy(true);
    setMigrationError("");
    try {
      const result = await postJson<WorkLogMigrationResponse>("/api/agent/work-log/migration-confirm", { previewToken: migrationPreview.previewToken, action: migrationAction });
      setMigrationSuccess(`${result.migratedJobs}건을 마이그레이션했습니다.`);
      closeDialog();
      setOffset(0);
      await load();
    } catch (error) {
      setMigrationPreview(null);
      setMigrationError(errorCode(error));
    } finally { migrationInFlight.current = false; setMigrationBusy(false); }
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
  return (
    <section className={`work-log work-log-${surface}`} data-qa="work-log" aria-busy={loading}>
      <header className="work-log-head">
        <div><p className="section-kicker">Agent Work Log</p><h2>Agent 작업 기록</h2><p>작업 본문이나 개인 컨텍스트 없이 안전한 상태 메타데이터만 표시합니다.</p></div>
        <div className="work-log-actions">
          <button className="filter-btn clear" type="button" data-qa="work-log-refresh" disabled={loading} onClick={() => void load()}>새로고침</button>
          <button className="filter-btn clear" type="button" data-qa="work-log-clear-preview" disabled={clearBusy} onClick={(event) => void previewClear(event.currentTarget)}>기록 숨기기</button>
          <button className="filter-btn clear" type="button" data-qa="work-log-migration-preview" disabled={migrationBusy} onClick={(event) => void previewMigration(event.currentTarget)}>이전 기록 가져오기</button>
        </div>
      </header>
      <div className="work-log-filters" data-qa="work-log-filter" aria-label="작업 범주">
        {(["all", "companion", "task"] as const).map((value) => <button key={value} type="button" className={`filter-btn${filter === value ? " active" : ""}`} data-qa={`work-log-filter-${value}`} aria-pressed={filter === value} onClick={() => changeFilter(value)}>{value === "all" ? "전체" : value === "companion" ? "답변" : "작업"}</button>)}
      </div>
      {loading && !data && <p data-qa="work-log-loading" role="status">작업 기록을 불러오는 중입니다.</p>}
      {listError && <p className="react-dashboard-error" data-qa="work-log-error" data-error-code={listError} role="alert">작업 기록을 불러오지 못했습니다. ({listError})</p>}
      {clearError && <p className="react-dashboard-error" data-qa="work-log-clear-error" data-error-code={clearError}>숨기기 미리보기가 만료되었거나 실패했습니다. 다시 미리보세요. ({clearError})</p>}
      {clearSuccess && <p className="react-dashboard-warning" data-qa="work-log-clear-success" role="status">{clearSuccess}</p>}
      {migrationError && <p className="react-dashboard-error" data-qa="work-log-migration-error" data-error-code={migrationError}>마이그레이션을 완료하지 못했습니다. 다시 미리보세요. ({migrationError})</p>}
      {migrationSuccess && <p className="react-dashboard-warning" data-qa="work-log-migration-success" role="status">{migrationSuccess}</p>}
      {proposalError && <p className="react-dashboard-error" data-qa="work-log-proposal-error" data-error-code={proposalError}>제안이 만료되었거나 현재 열 수 없습니다. ({proposalError})</p>}
      {!loading && !listError && entries.length === 0 && <p className="work-log-empty" data-qa="work-log-empty">표시할 Agent 작업 기록이 없습니다.</p>}
      {entries.length > 0 && <div className="work-log-list" data-qa="work-log-list">
        {entries.map((entry) => <article className={`work-log-item status-${entry.status}`} data-qa="work-log-item" key={entry.id}>
          <div className="work-log-item-main">
            <div className="work-log-item-title"><strong data-qa="work-log-task-type">{codeLabel(entry.taskType)}</strong><span>{codeLabel(entry.category)} · {codeLabel(entry.labelCode)}</span></div>
            <span className="work-log-status" data-qa="work-log-status">{codeLabel(entry.status)} · {entry.progress}%</span>
            <span data-qa="work-log-execution">{codeLabel(entry.generationMode)} · {codeLabel(entry.adapter)} · {codeLabel(entry.attemptedEngine)} → {codeLabel(entry.finalEngine)}</span>
            {entry.fallbackReason && <span data-qa="work-log-fallback">fallback · {codeLabel(entry.fallbackReason)}</span>}
            <span data-qa="work-log-artifacts">산출물 {entry.artifactCount}건{entry.artifactTypes.length ? ` · ${entry.artifactTypes.join(", ")}` : ""}</span>
            {entry.proposalStatus && <span data-qa="work-log-proposal-status">제안 · {codeLabel(entry.proposalStatus)}</span>}
            {entry.errorCode && <span className="work-log-error-code">오류 · {codeLabel(entry.errorCode)}</span>}
          </div>
          <div className="work-log-item-side">
            <time data-qa="work-log-time" dateTime={entry.updatedAt}>{displayTime(entry.finishedAt || entry.updatedAt)}</time>
            {entry.proposalId && (entry.proposalStatus === "pending" || entry.proposalStatus === "applying") && <button type="button" className="filter-btn clear" data-qa="work-log-proposal-open" disabled={proposalLoading === entry.proposalId} onClick={() => void openProposal(entry)}>{proposalLoading === entry.proposalId ? <span data-qa="work-log-proposal-loading">불러오는 중</span> : "승인 검토"}</button>}
          </div>
        </article>)}
      </div>}
      {data && <footer className="work-log-footer">
        <p data-qa="work-log-retention">최근 {data.retention.maxDays}일, 최대 {data.retention.maxEntries}건을 표시합니다.</p>
        <div className="work-log-pagination"><span data-qa="work-log-page-summary">{data.total ? `${offset + 1}–${Math.min(offset + pageSize, data.total)} / ${data.total}` : "0 / 0"}</span><button type="button" data-qa="work-log-page-prev" disabled={offset === 0 || loading} onClick={() => setOffset(Math.max(0, offset - pageSize))}>이전</button><button type="button" data-qa="work-log-page-next" disabled={!canNext || loading} onClick={() => setOffset(offset + pageSize)}>다음</button></div>
      </footer>}

      {dialog === "clear" && clearPreview && <div className="work-log-dialog-backdrop"><div className="work-log-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="work-log-clear-title" data-qa="work-log-clear-dialog"><h3 id="work-log-clear-title">작업 기록 숨기기</h3><p data-qa="work-log-clear-count">현재 범위 {clearPreview.count}건</p><p>목록에서만 숨깁니다. 공유 작업, 보고서, 제안, 레거시 파일은 삭제하지 않습니다.</p><div className="work-log-dialog-actions"><button type="button" data-qa="work-log-clear-confirm" disabled={clearBusy} onClick={() => void confirmClear()}>숨기기 확인</button><button type="button" data-qa="work-log-clear-cancel" onClick={closeDialog}>취소</button></div></div></div>}
      {dialog === "migration" && migrationPreview && <div className="work-log-dialog-backdrop"><div className="work-log-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="work-log-migration-title" data-qa="work-log-migration-dialog"><h3 id="work-log-migration-title">이전 기록 가져오기</h3><p data-qa="work-log-migration-summary">이전 {migrationPreview.legacyJobs}건 · 가져올 수 있음 {migrationPreview.migratableJobs}건 · {displayTime(migrationPreview.expiresAt)}까지</p>{migrationPreview.collisions.length > 0 && <p className="react-dashboard-error" data-qa="work-log-migration-collisions">충돌 {migrationPreview.collisions.length}건이 있어 진행할 수 없습니다.</p>}<label><input type="radio" name="migration-action" data-qa="work-log-migration-keep" checked={migrationAction === "migrate_keep_original"} onChange={() => setMigrationAction("migrate_keep_original")} /> 원본 유지</label><label><input type="radio" name="migration-action" data-qa="work-log-migration-delete-original" checked={migrationAction === "migrate_delete_original"} onChange={() => setMigrationAction("migrate_delete_original")} /> 성공 후 이전 jobs 파일 삭제</label><div className="work-log-dialog-actions"><button type="button" data-qa="work-log-migration-confirm" disabled={migrationBusy || migrationPreview.collisions.length > 0} onClick={() => void confirmMigration()}>마이그레이션 확인</button><button type="button" data-qa="work-log-migration-cancel" onClick={closeDialog}>취소</button></div></div></div>}
      {proposal && <aside className="work-log-proposal-surface" data-qa="proposal-approval-surface" aria-label="활성 제안 승인 검토"><div><p className="section-kicker">Approval required</p><h3>{boundedProposalSummary(proposal.summary) || "저장 변경 제안"}</h3><p>이 내용은 작업 기록이 아니라 요청 시 별도로 불러온 승인 제안입니다.</p></div>{proposal.diff && <pre>{boundedProposalDiff(proposal.diff)}</pre>}<button type="button" className="filter-btn clear" onClick={() => setProposal(null)}>닫기</button></aside>}
    </section>
  );
}
