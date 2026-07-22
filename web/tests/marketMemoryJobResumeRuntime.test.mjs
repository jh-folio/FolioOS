import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const webRoot = fileURLToPath(new URL("..", import.meta.url));
const validId = "job_3ce336dd-74a7-4f5b-8e5f-fefd4d5c3176";

class MemoryStorage {
  values = new Map();
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

test("Market Memory stores only a strict scoped active job id", async (t) => {
  const vite = await createServer({ configFile: false, root: webRoot, server: { middlewareMode: true, hmr: false }, appType: "custom" });
  t.after(() => vite.close());
  const resume = await vite.ssrLoadModule("/src/app/marketMemoryJobResume.ts");
  const storage = new MemoryStorage();
  assert.equal(resume.persistMarketMemoryJobId(validId, storage), true);
  assert.equal(storage.getItem(resume.MARKET_MEMORY_ACTIVE_JOB_KEY), validId);
  assert.equal(Array.from(storage.values.values()).some((value) => /prompt|context|reply|markdown/i.test(value)), false);
  storage.setItem(resume.MARKET_MEMORY_ACTIVE_JOB_KEY, `${validId}:private-canary`);
  assert.equal(resume.readMarketMemoryJobId(storage), null);
  assert.equal(storage.getItem(resume.MARKET_MEMORY_ACTIVE_JOB_KEY), null);
});

test("reload recovery fetches the exact same id and clears only invalid or terminal state", async (t) => {
  const vite = await createServer({ configFile: false, root: webRoot, server: { middlewareMode: true, hmr: false }, appType: "custom" });
  t.after(() => vite.close());
  const resume = await vite.ssrLoadModule("/src/app/marketMemoryJobResume.ts");
  const storage = new MemoryStorage();
  resume.persistMarketMemoryJobId(validId, storage);
  const requested = [];
  const active = await resume.recoverMarketMemoryJob((id) => { requested.push(id); return Promise.resolve({ id, status: "running", progress: 20 }); }, storage);
  assert.deepEqual(requested, [validId]);
  assert.equal(active.kind, "active");
  assert.equal(active.job.id, validId);
  assert.equal(storage.getItem(resume.MARKET_MEMORY_ACTIVE_JOB_KEY), validId);

  const terminal = await resume.recoverMarketMemoryJob((id) => Promise.resolve({ id, status: "done", result: { status: "done" } }), storage);
  assert.equal(terminal.kind, "terminal");
  assert.equal(storage.getItem(resume.MARKET_MEMORY_ACTIVE_JOB_KEY), null);

  resume.persistMarketMemoryJobId(validId, storage);
  const mismatched = await resume.recoverMarketMemoryJob(() => Promise.resolve({ id: "job_00000000-0000-4000-8000-000000000000", status: "running" }), storage);
  assert.equal(mismatched.kind, "invalid");
  assert.equal(storage.getItem(resume.MARKET_MEMORY_ACTIVE_JOB_KEY), null);

  resume.persistMarketMemoryJobId(validId, storage);
  const unavailable = await resume.recoverMarketMemoryJob(() => Promise.reject(new Error("offline")), storage);
  assert.equal(unavailable.kind, "unavailable");
  assert.equal(unavailable.id, validId);
  assert.equal(storage.getItem(resume.MARKET_MEMORY_ACTIVE_JOB_KEY), validId);
});
