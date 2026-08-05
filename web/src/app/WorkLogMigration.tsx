import { useEffect, useRef, useState } from "react";
import {
  ApiRequestError,
  postJson,
  type WorkLogMigrationPreview,
  type WorkLogMigrationResponse,
} from "../api";

// 예전 jobs.json을 v2 저장소로 옮기는 일회성 정리다. 매일 보는 작업 기록이 아니라
// 설정의 유지보수 영역에 둔다. preview → confirm 2단계는 그대로 유지한다.

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

export function WorkLogMigrationControl() {
  const [preview, setPreview] = useState<WorkLogMigrationPreview | null>(null);
  const [action, setAction] = useState<MigrationAction>("migrate_keep_original");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inFlight = useRef(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!preview) return;
    dialogRef.current?.querySelector<HTMLElement>("button:not([disabled]), input:not([disabled])")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
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
  }, [preview]);

  function close() {
    setPreview(null);
    setError("");
    window.setTimeout(() => openerRef.current?.focus(), 0);
  }

  async function openPreview(button: HTMLButtonElement) {
    if (inFlight.current) return;
    inFlight.current = true;
    openerRef.current = button;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const next = await postJson<WorkLogMigrationPreview>("/api/agent/work-log/migration-preview", {});
      setPreview(next);
      setAction("migrate_keep_original");
    } catch (err) {
      setError(errorCode(err));
    } finally { inFlight.current = false; setBusy(false); }
  }

  async function confirm() {
    if (!preview || inFlight.current || preview.collisions.length > 0) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await postJson<WorkLogMigrationResponse>("/api/agent/work-log/migration-confirm", { previewToken: preview.previewToken, action });
      setSuccess(`${result.migratedJobs}건을 가져왔습니다.`);
      close();
    } catch (err) {
      setPreview(null);
      setError(errorCode(err));
    } finally { inFlight.current = false; setBusy(false); }
  }

  return (
    <div className="work-log-migration-control">
      <div className="filter-actions settings-actions">
        <button className="btn" type="button" data-qa="work-log-migration-preview" disabled={busy} onClick={(event) => void openPreview(event.currentTarget)}>
          {busy && !preview ? "확인 중" : "이전 작업 기록 가져오기"}
        </button>
      </div>
      {error && <p className="react-dashboard-error" data-qa="work-log-migration-error" data-error-code={error}>마이그레이션을 완료하지 못했습니다. 다시 미리보세요. ({error})</p>}
      {success && <p className="react-dashboard-warning" data-qa="work-log-migration-success" role="status">{success}</p>}

      {preview && (
        <div className="work-log-dialog-backdrop">
          <div className="work-log-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="work-log-migration-title" data-qa="work-log-migration-dialog">
            <h3 id="work-log-migration-title">이전 작업 기록 가져오기</h3>
            <p data-qa="work-log-migration-summary">이전 {preview.legacyJobs}건 · 가져올 수 있음 {preview.migratableJobs}건 · {displayTime(preview.expiresAt)}까지</p>
            {preview.collisions.length > 0 && <p className="react-dashboard-error" data-qa="work-log-migration-collisions">충돌 {preview.collisions.length}건이 있어 진행할 수 없습니다.</p>}
            <label><input type="radio" name="migration-action" data-qa="work-log-migration-keep" checked={action === "migrate_keep_original"} onChange={() => setAction("migrate_keep_original")} /> 원본 유지</label>
            <label><input type="radio" name="migration-action" data-qa="work-log-migration-delete-original" checked={action === "migrate_delete_original"} onChange={() => setAction("migrate_delete_original")} /> 성공 후 이전 jobs 파일 삭제</label>
            <div className="work-log-dialog-actions">
              <button type="button" data-qa="work-log-migration-confirm" disabled={busy || preview.collisions.length > 0} onClick={() => void confirm()}>가져오기 확인</button>
              <button type="button" data-qa="work-log-migration-cancel" onClick={close}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
