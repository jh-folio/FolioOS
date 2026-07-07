"""Background job management — submit, track, and persist async tasks."""
import threading
import traceback
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from features.common.utils import now_iso, read_json, write_json

ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = ROOT / "data"
JOBS_PATH = DATA_DIR / "jobs.json"

JOB_EXECUTOR = ThreadPoolExecutor(max_workers=2)
JOB_LOCK = threading.Lock()
JOBS: dict[str, dict] = {}


def persist_jobs():
    try:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        visible = {
            job_id: {k: v for k, v in job.items() if k != "future"}
            for job_id, job in JOBS.items()
        }
        write_json(JOBS_PATH, visible)
    except Exception:
        pass


def load_jobs():
    stored = read_json(JOBS_PATH, {})
    if isinstance(stored, dict):
        for job_id, job in stored.items():
            if not isinstance(job, dict):
                continue
            if job.get("status") in {"queued", "running"}:
                job = {**job, "status": "failed", "message": "서버 재시작으로 작업 상태가 종료되었습니다.", "finishedAt": now_iso()}
            JOBS[str(job_id)] = job


def update_job(job_id, **changes):
    with JOB_LOCK:
        job = JOBS.get(job_id, {})
        job.update(changes)
        job["updatedAt"] = now_iso()
        JOBS[job_id] = job
        persist_jobs()
        return {k: v for k, v in job.items() if k != "future"}


def job_progress(job_id):
    def _progress(message, progress=None, **extra):
        payload = {"message": message}
        if progress is not None:
            payload["progress"] = progress
        payload.update(extra)
        update_job(job_id, **payload)
    return _progress


def compact_job_result(result):
    if not isinstance(result, dict):
        return result
    if "documents" in result and "generatedAt" in result:
        return {
            "generatedAt": result.get("generatedAt", ""),
            "inbox": result.get("inbox", ""),
            "count": result.get("count", 0),
            "incremental": result.get("incremental", {}),
            "sqlite": result.get("sqlite", {}),
        }
    if "index" in result and isinstance(result.get("index"), dict):
        compacted = dict(result)
        index = result.get("index") or {}
        compacted["index"] = {
            "count": index.get("count", 0),
            "generatedAt": index.get("generatedAt", ""),
            "incremental": index.get("incremental", {}),
        }
        return compacted
    return result


def run_job(job_id, fn, *args, **kwargs):
    update_job(job_id, status="running", startedAt=now_iso(), message="작업을 시작했습니다.", progress=0)
    try:
        fn_job_id = kwargs.pop("_folio_job_id", "")
        if fn_job_id:
            kwargs["job_id"] = fn_job_id
        result = compact_job_result(fn(*args, progress=job_progress(job_id), **kwargs))
        if (get_job(job_id) or {}).get("status") == "cancelled":
            return
        update_job(job_id, status="done", finishedAt=now_iso(), progress=100, result=result, message="작업이 완료되었습니다.")
    except Exception as exc:
        if (get_job(job_id) or {}).get("status") == "cancelled":
            return
        update_job(
            job_id,
            status="failed",
            finishedAt=now_iso(),
            error=str(exc),
            traceback=traceback.format_exc()[-4000:],
            message=f"작업 실패: {exc}",
        )


def submit_job(kind, label, fn, *args, pass_job_id=False, executor=None, dedicated_thread=False, **kwargs):
    job_id = uuid.uuid4().hex[:16]
    job = {
        "id": job_id,
        "kind": kind,
        "label": label,
        "status": "queued",
        "progress": 0,
        "message": "작업 대기 중입니다.",
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
    }
    with JOB_LOCK:
        JOBS[job_id] = job
        persist_jobs()
    if pass_job_id:
        kwargs["_folio_job_id"] = job_id
    if dedicated_thread:
        future = threading.Thread(
            target=run_job,
            args=(job_id, fn, *args),
            kwargs=kwargs,
            name=f"folio-job-{kind}-{job_id[:6]}",
            daemon=True,
        )
        future.start()
    else:
        future = (executor or JOB_EXECUTOR).submit(run_job, job_id, fn, *args, **kwargs)
    with JOB_LOCK:
        JOBS[job_id]["future"] = future
    return {k: v for k, v in job.items() if k != "future"}


def get_job(job_id):
    with JOB_LOCK:
        job = JOBS.get(str(job_id), {})
        return {k: v for k, v in job.items() if k != "future"} if job else None


def cancel_job(job_id):
    job_id = str(job_id)
    with JOB_LOCK:
        job = JOBS.get(job_id)
        if not job:
            return {"cancelled": False, "error": "Job not found"}
        if job.get("status") in {"done", "failed", "cancelled"}:
            return {"cancelled": False, "job": {k: v for k, v in job.items() if k != "future"}}
        future = job.get("future")
        if future and hasattr(future, "cancel"):
            future.cancel()
    updated = update_job(
        job_id,
        status="cancelled",
        finishedAt=now_iso(),
        message="사용자가 작업을 취소했습니다.",
    )
    return {"cancelled": True, "job": updated}


def recent_jobs(limit=20):
    with JOB_LOCK:
        rows = [{k: v for k, v in job.items() if k != "future"} for job in JOBS.values()]
    rows.sort(key=lambda row: row.get("createdAt", ""), reverse=True)
    return rows[:limit]
