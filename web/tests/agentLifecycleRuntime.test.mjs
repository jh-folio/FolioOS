import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";

const VALID_HASH = "a".repeat(64);

async function loadCompiled(relativePath, apiOverrides = {}) {
  const source = await readFile(new URL(relativePath, import.meta.url), "utf8");
  const api = {
    getJson: async () => {
      throw new Error("unexpected_get");
    },
    postJson: async () => {
      throw new Error("unexpected_post");
    },
    isActiveJobStatus: (status) => ["queued", "running", "cancel_requested", "committing"].includes(status),
    ApiRequestError: class ApiRequestError extends Error {
      constructor(path, status, code, payload) {
        super(`${path} failed: ${status}${code ? ` (${code})` : ""}`);
        this.name = "ApiRequestError";
        this.path = path;
        this.status = status;
        this.code = code;
        this.payload = payload;
      }
    },
    ...apiOverrides,
  };
  const apiKey = `__folioLifecycleApi_${Math.random().toString(36).slice(2)}`;
  globalThis[apiKey] = api;
  const stripped = stripTypeScriptTypes(source, { mode: "transform", sourceMap: false });
  const dependencyPrelude = relativePath.endsWith("agentPolling.ts")
    ? `const { getJson, isActiveJobStatus } = globalThis[${JSON.stringify(apiKey)}];`
    : `const { ApiRequestError, getJson, postJson } = globalThis[${JSON.stringify(apiKey)}];`;
  const runnable = stripped.replace(/^import .*? from "\.\.\/api";\r?\n/, `${dependencyPrelude}\n`);
  assert.notEqual(runnable, stripped, "expected the ../api dependency import to be injected");
  try {
    const exports = await import(`data:text/javascript;base64,${Buffer.from(runnable).toString("base64")}`);
    return { exports, api };
  } finally {
    delete globalThis[apiKey];
  }
}

function actionFixture(overrides = {}) {
  return {
    proposalId: "abc123def456",
    status: "applied",
    reportKind: "briefing",
    reportId: "2026-07-22",
    marketScope: "both",
    targetRevision: { number: 2, hash: VALID_HASH },
    ...overrides,
  };
}

function pendingRecordFixture(overrides = {}) {
  return {
    schemaVersion: 2,
    id: "0123456789abcdef0123456789abcdef",
    reportKind: "briefing",
    reportId: "2026-07-22",
    marketScope: "both",
    status: "pending",
    summary: "근거 보강",
    diff: "@@ -1 +1 @@\n-old\n+new",
    revisedMarkdown: "PRIVATE_BODY_CANARY",
    userRequest: "PRIVATE_REQUEST_CANARY",
    ...overrides,
  };
}

test("public job proposalId hydrates one strict pending approval surface and ignores broad result bodies", async () => {
  const { exports } = await loadCompiled("../src/app/agentProposalLifecycle.ts");
  const paths = [];
  const result = await exports.hydrateAgentProposalFromResult({
    reply: "완료",
    proposalId: "0123456789abcdef0123456789abcdef",
    proposal: { summary: "JOB_RESULT_PRIVATE_CANARY", diff: "JOB_RESULT_DIFF_CANARY" },
  }, {
    get: async (path) => {
      paths.push(path);
      return pendingRecordFixture();
    },
  });

  assert.deepEqual(paths, ["/api/agent/proposals/0123456789abcdef0123456789abcdef"]);
  assert.deepEqual(result, {
    proposal: {
      id: "0123456789abcdef0123456789abcdef",
      summary: "근거 보강",
      diff: "@@ -1 +1 @@\n-old\n+new",
      artifactKind: "briefing",
      artifactId: "2026-07-22",
      marketScope: "both",
    },
    proposalStatus: "pending",
    notice: "",
  });
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE|CANARY/);
});

test("proposal hydration accepts applying and safely rejects malformed, terminal, or failed GET records", async () => {
  const { exports } = await loadCompiled("../src/app/agentProposalLifecycle.ts");
  const id = "0123456789abcdef0123456789abcdef";
  const applying = await exports.hydrateAgentProposalFromResult({ proposalId: id }, {
    get: async () => pendingRecordFixture({ status: "applying" }),
  });
  assert.equal(applying.proposalStatus, "applying");
  assert.equal(applying.notice, "");

  const invalidRecords = [
    pendingRecordFixture({ id: "fedcba9876543210fedcba9876543210" }),
    pendingRecordFixture({ status: "applied", summary: null, diff: null }),
    pendingRecordFixture({ summary: 42 }),
    pendingRecordFixture({ diff: null }),
    pendingRecordFixture({ reportKind: "unknown" }),
    pendingRecordFixture({ reportId: "" }),
    pendingRecordFixture({ marketScope: "invalid" }),
  ];
  for (const record of invalidRecords) {
    const observed = await exports.hydrateAgentProposalFromResult({ proposalId: id }, { get: async () => record });
    assert.equal(observed.proposal, null);
    assert.equal(observed.proposalStatus, "");
    assert.match(observed.notice, /수정 제안을 불러오지 못했습니다/);
  }
  const failed = await exports.hydrateAgentProposalFromResult({ proposalId: id }, {
    get: async () => { throw new Error("PRIVATE_TRANSPORT_CANARY"); },
  });
  assert.equal(failed.proposal, null);
  assert.doesNotMatch(failed.notice, /PRIVATE|CANARY|TRANSPORT/);
});

test("proposal hydration performs no broad fallback for missing, blank, or malformed proposalId", async () => {
  const { exports } = await loadCompiled("../src/app/agentProposalLifecycle.ts");
  let getCalls = 0;
  const transport = { get: async () => { getCalls += 1; return pendingRecordFixture(); } };
  const absent = await exports.hydrateAgentProposalFromResult({ proposal: pendingRecordFixture() }, transport);
  const blank = await exports.hydrateAgentProposalFromResult({ proposalId: "   ", proposal: pendingRecordFixture() }, transport);
  const malformed = await exports.hydrateAgentProposalFromResult({ proposalId: "../secret", proposal: pendingRecordFixture() }, transport);
  assert.deepEqual(absent, { proposal: null, proposalStatus: "", notice: "" });
  assert.match(blank.notice, /수정 제안을 불러오지 못했습니다/);
  assert.match(malformed.notice, /수정 제안을 불러오지 못했습니다/);
  assert.equal(getCalls, 0);
});

test("poll controller release is ownership-safe across overlapping resumes", async () => {
  const { exports } = await loadCompiled("../src/app/agentPolling.ts");
  const controllers = new Map();
  const controllerA = new AbortController();
  const controllerB = new AbortController();

  exports.replacePollController(controllers, "message", controllerA);
  exports.replacePollController(controllers, "message", controllerB);
  assert.equal(controllerA.signal.aborted, true);
  assert.equal(controllers.get("message"), controllerB);

  assert.equal(exports.releasePollController(controllers, "message", controllerA), false);
  assert.equal(controllers.get("message"), controllerB);
  assert.equal(exports.releasePollController(controllers, "message", controllerB), true);
  assert.equal(controllers.has("message"), false);
});

test("proposal parser accepts backend both scope and exact revision shape", async () => {
  const { exports } = await loadCompiled("../src/app/agentProposalLifecycle.ts");
  assert.deepEqual(exports.parseProposalActionResult(actionFixture(), "approve"), actionFixture());
  assert.deepEqual(
    exports.parseProposalActionResult(actionFixture({ status: "rejected", targetRevision: null }), "reject"),
    actionFixture({ status: "rejected", targetRevision: null }),
  );
});

test("proposal parser rejects malformed identifiers, action status, and revisions", async () => {
  const { exports } = await loadCompiled("../src/app/agentProposalLifecycle.ts");
  const malformed = [
    actionFixture({ proposalId: "" }),
    actionFixture({ proposalId: "   " }),
    actionFixture({ reportId: 42 }),
    actionFixture({ reportId: "" }),
    actionFixture({ targetRevision: { number: 0, hash: VALID_HASH } }),
    actionFixture({ targetRevision: { number: 1.5, hash: VALID_HASH } }),
    actionFixture({ targetRevision: { number: 2, hash: VALID_HASH.toUpperCase() } }),
    actionFixture({ targetRevision: { number: 2, hash: VALID_HASH, extra: true } }),
  ];
  for (const value of malformed) {
    assert.throws(() => exports.parseProposalActionResult(value, "approve"), /proposal_contract_invalid/);
  }
  assert.throws(
    () => exports.parseProposalActionResult(actionFixture({ status: "applied" }), "reject"),
    /proposal_contract_invalid/,
  );
});

test("malformed successful POST is not masked by terminal GET", async () => {
  let getCalls = 0;
  const { exports } = await loadCompiled("../src/app/agentProposalLifecycle.ts");
  await assert.rejects(
    exports.performProposalAction("abc123def456", "approve", {
      post: async () => actionFixture({ targetRevision: { number: "2", hash: VALID_HASH } }),
      get: async () => {
        getCalls += 1;
        return actionFixture();
      },
    }),
    /proposal_contract_invalid/,
  );
  assert.equal(getCalls, 0);
});

test("ApiRequestError 500 recovers a persisted terminal failed_apply through one GET", async () => {
  let getCalls = 0;
  const { exports, api } = await loadCompiled("../src/app/agentProposalLifecycle.ts");
  const serverError = new api.ApiRequestError("/proposal", 500, "proposal_apply_failed", null);
  const recovered = await exports.performProposalAction("abc123def456", "approve", {
    post: async () => {
      throw serverError;
    },
    get: async () => {
      getCalls += 1;
      return actionFixture({ proposalId: undefined, id: "abc123def456", status: "failed_apply" });
    },
  });
  assert.equal(recovered.status, "failed_apply");
  assert.equal(recovered.proposalId, "abc123def456");
  assert.equal(getCalls, 1);
});

test("non-2xx recovery returns every terminal state and does not cache repeated requests", async () => {
  let postCalls = 0;
  let getCalls = 0;
  const { exports, api } = await loadCompiled("../src/app/agentProposalLifecycle.ts");
  const conflict = new api.ApiRequestError("/proposal", 409, "proposal_action_conflict", null);
  const statuses = ["applied", "rejected", "stale", "conflict", "failed_apply"];
  const transport = {
    post: async () => {
      postCalls += 1;
      throw conflict;
    },
    get: async () => {
      getCalls += 1;
      return actionFixture({ proposalId: undefined, id: "abc123def456", status: statuses[getCalls - 1] });
    },
  };
  const results = [];
  for (const _status of statuses) {
    results.push(await exports.performProposalAction("abc123def456", "approve", transport));
  }
  assert.deepEqual(results.map((result) => result.status), statuses);
  assert.equal(postCalls, statuses.length);
  assert.equal(getCalls, statuses.length);
});

test("500 recovery preserves the original HTTP error for pending or failed GET", async () => {
  let pendingGetCalls = 0;
  let failedGetCalls = 0;
  const { exports, api } = await loadCompiled("../src/app/agentProposalLifecycle.ts");
  const serverError = new api.ApiRequestError("/proposal", 500, "internal_error", null);
  await assert.rejects(
    exports.performProposalAction("abc123def456", "approve", {
      post: async () => {
        throw serverError;
      },
      get: async () => {
        pendingGetCalls += 1;
        return actionFixture({ status: "pending", targetRevision: null });
      },
    }),
    (error) => error === serverError,
  );
  assert.equal(pendingGetCalls, 1);

  const getError = new Error("recovery_get_failed");
  await assert.rejects(
    exports.performProposalAction("abc123def456", "approve", {
      post: async () => {
        throw serverError;
      },
      get: async () => {
        failedGetCalls += 1;
        throw getError;
      },
    }),
    (error) => error === serverError,
  );
  assert.equal(failedGetCalls, 1);
});

test("ApiRequestError with a misleading 2xx status never enters terminal recovery", async () => {
  let getCalls = 0;
  const { exports, api } = await loadCompiled("../src/app/agentProposalLifecycle.ts");
  const misleadingSuccess = new api.ApiRequestError("/proposal", 200, "misleading_success", null);
  await assert.rejects(
    exports.performProposalAction("abc123def456", "approve", {
      post: async () => {
        throw misleadingSuccess;
      },
      get: async () => {
        getCalls += 1;
        return actionFixture({ status: "failed_apply" });
      },
    }),
    (error) => error === misleadingSuccess,
  );
  assert.equal(getCalls, 0);
});

test("manual QA fixture observes A-set B-set A-release, malformed rejection, and both acceptance", async () => {
  const polling = await loadCompiled("../src/app/agentPolling.ts");
  const lifecycle = await loadCompiled("../src/app/agentProposalLifecycle.ts");
  const controllers = new Map();
  const controllerA = new AbortController();
  const controllerB = new AbortController();
  polling.exports.replacePollController(controllers, "message", controllerA);
  polling.exports.replacePollController(controllers, "message", controllerB);
  const oldReleased = polling.exports.releasePollController(controllers, "message", controllerA);
  assert.equal(oldReleased, false);
  assert.equal(controllers.get("message"), controllerB);
  assert.throws(
    () => lifecycle.exports.parseProposalActionResult(actionFixture({ targetRevision: { number: 2, hash: "bad" } }), "approve"),
    /proposal_contract_invalid/,
  );
  assert.equal(lifecycle.exports.parseProposalActionResult(actionFixture(), "approve").marketScope, "both");
  console.log(JSON.stringify({ oldAReleaseKeptB: controllers.get("message") === controllerB, malformedRejected: true, bothAccepted: true }));
});
