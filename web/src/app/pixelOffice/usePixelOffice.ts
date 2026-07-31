import { useCallback, useEffect, useRef, useState } from "react";
import { getJson } from "../../api";
import { fallbackOfficeObjects, OFFICE_OBJECT_IDS } from "./officeObjects";
import type { OfficeJob, OfficeObjectSummary, PixelOfficePayload } from "./types";

function sanitizeJobs(value: unknown): OfficeJob[] {
  if (!Array.isArray(value)) return [];
  return value.filter((row) => row && typeof row === "object").slice(0, 20).map((row) => {
    const job = row as Record<string, unknown>;
    const rawStatus = String(job.status || "");
    const status: OfficeJob["status"] = ["queued", "running", "done", "failed", "cancelled"].includes(rawStatus)
      ? rawStatus as OfficeJob["status"]
      : "cancelled";
    return {
      id: String(job.id || "").slice(0, 80),
      kind: String(job.kind || "").slice(0, 80),
      label: String(job.label || "").slice(0, 120),
      status,
      progress: typeof job.progress === "number" ? Math.max(0, Math.min(100, job.progress)) : undefined,
      message: String(job.message || "").slice(0, 180),
      createdAt: String(job.createdAt || ""),
      updatedAt: String(job.updatedAt || ""),
      finishedAt: String(job.finishedAt || ""),
    };
  });
}

function normalizePayload(value: PixelOfficePayload): PixelOfficePayload {
  const byId = new Map((Array.isArray(value?.objects) ? value.objects : []).map((row) => [row.id, row]));
  const objects = OFFICE_OBJECT_IDS.map((id) => byId.get(id)).filter(Boolean) as OfficeObjectSummary[];
  if (value?.version !== 1 || objects.length !== OFFICE_OBJECT_IDS.length) {
    throw new Error("Pixel Office 응답 형식이 올바르지 않습니다.");
  }
  return { ...value, objects };
}

export function usePixelOffice() {
  const [payload, setPayload] = useState<PixelOfficePayload | null>(null);
  const [jobs, setJobs] = useState<OfficeJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(() => document.visibilityState !== "hidden");
  const terminalFingerprint = useRef("");

  const refresh = useCallback(async () => {
    setError("");
    try {
      const next = normalizePayload(await getJson<PixelOfficePayload>("/api/pixel-office"));
      setPayload(next);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Office 상태를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshJobs = useCallback(async () => {
    try {
      const next = sanitizeJobs(await getJson<unknown>("/api/jobs"));
      setJobs(next);
      const fingerprint = next
        .filter((job) => ["done", "failed", "cancelled"].includes(job.status))
        .slice(0, 4)
        .map((job) => `${job.id}:${job.status}:${job.finishedAt}`)
        .join("|");
      if (terminalFingerprint.current && fingerprint !== terminalFingerprint.current) {
        refresh().catch(() => undefined);
      }
      terminalFingerprint.current = fingerprint;
    } catch {
      // The redacted summary remains usable if raw job polling is temporarily unavailable.
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
    refreshJobs();
  }, [refresh, refreshJobs]);

  useEffect(() => {
    const handleVisibility = () => setVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const hasActiveJob = jobs.some((job) => job.status === "queued" || job.status === "running");

  useEffect(() => {
    if (!visible) return undefined;
    const timer = window.setInterval(refreshJobs, hasActiveJob ? 2500 : 15000);
    return () => window.clearInterval(timer);
  }, [hasActiveJob, refreshJobs, visible]);

  useEffect(() => {
    if (!visible) return undefined;
    const timer = window.setInterval(refresh, 60000);
    return () => window.clearInterval(timer);
  }, [refresh, visible]);

  return {
    payload,
    objects: payload?.objects || fallbackOfficeObjects(loading ? "loading" : "unavailable"),
    jobs,
    loading,
    error,
    refresh,
  };
}

