export type JobStatus =
  | "queued"
  | "running"
  | "cancel_requested"
  | "committing"
  | "done"
  | "cancelled"
  | "failed"
  | "failed_cancel"
  | "failed_commit"
  | "failed_restart"
  | "failed_commit_recovery";

export function isActiveJobStatus(status: JobStatus): boolean {
  return status === "queued" || status === "running" || status === "cancel_requested" || status === "committing";
}

export async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { "Content-Type": "application/json" } });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return (await res.json()) as T;
}
