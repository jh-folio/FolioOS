import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

test("React Agent Dock collapses into the legacy-style floating AI pill", async () => {
  const dockSource = await readFile(new URL("../src/app/ReactAgentDock.tsx", import.meta.url), "utf8");
  const shellSource = await readFile(new URL("../src/app/AppShell.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../../public/styles.css", import.meta.url), "utf8");

  assert.match(dockSource, /react-agent-dock is-closed/);
  assert.match(dockSource, /react-agent-closed-dot/);
  assert.match(dockSource, /AI Agent 열기/);
  assert.match(shellSource, /is-agent-closed/);
  assert.match(styles, /\.react-shell\.is-agent-closed/);
  assert.match(styles, /\.react-agent-dock\.is-closed/);
  assert.match(styles, /position:\s*fixed/);
  assert.match(styles, /bottom:\s*18px/);
});

test("React Agent Dock accepts contextual ask events and submits to chat", async () => {
  const dockSource = await readFile(new URL("../src/app/ReactAgentDock.tsx", import.meta.url), "utf8");
  const shellSource = await readFile(new URL("../src/app/AppShell.tsx", import.meta.url), "utf8");
  const contextSource = await readFile(new URL("../src/app/agentContext.ts", import.meta.url), "utf8");

  assert.match(shellSource, /window\.FolioBridge = \{/);
  assert.match(shellSource, /folio:react-agent-request/);
  assert.match(dockSource, /window\.addEventListener\("folio:react-agent-request"/);
  assert.match(dockSource, /autoSubmit/);
  assert.match(dockSource, /submitAgentMessage\(text, contextPatch\)/);
  assert.match(dockSource, /contextRef/);
  assert.match(dockSource, /AgentMessageContent/);
  assert.match(dockSource, /AgentRunCard/);
  assert.match(dockSource, /세션 시작/);
  assert.match(dockSource, /응답/);
  assert.match(dockSource, /requestSubmit/);
  assert.match(dockSource, /WELCOME_AGENT_MESSAGE/);
  assert.match(dockSource, /react-agent-welcome-card/);
  // 화면에서는 전부 "대화"라 부른다. 주제는 별도 이름이 아니라 칩으로 보여준다.
  assert.match(dockSource, /새 대화/);
  assert.match(dockSource, /대화 목록/);
  // 대화는 서버에 저장되는 스레드 경로로 나간다 — chat 경로는 저장하지 않아
  // 세션이 끊기면 맥락이 사라진다(Task 7.6).
  assert.match(dockSource, /agent\/threads/);
  assert.doesNotMatch(dockSource, /"\/api\/agent\/chat"/);
  assert.match(contextSource, /window\.FolioAgent/);
  assert.match(contextSource, /setReactAgentContextScope/);
  assert.match(contextSource, /activateReactAgentContextScope/);
  assert.match(contextSource, /openReactAgentDock/);
});

test("Deep Research collection identity reaches the actual Agent chat submit boundary", async () => {
  const dockSource = await readFile(new URL("../src/app/ReactAgentDock.tsx", import.meta.url), "utf8");
  const deepResearchSource = await readFile(new URL("../src/app/DeepResearchRoute.tsx", import.meta.url), "utf8");

  assert.match(deepResearchSource, /collectionId: selectedCollectionRef\?\.id \|\| null/);
  assert.match(deepResearchSource, /collectionRevision: selectedCollectionRef\?\.revision \|\| null/);
  assert.match(dockSource, /function collectionIdentityPatch\(/);
  assert.match(dockSource, /function withoutCollectionIdentity\(/);
  assert.match(dockSource, /buildAgentRequestContext\(/);
  assert.match(dockSource, /\.\.\.withoutCollectionIdentity\(scoped\.patch\),\s*\.\.\.withoutCollectionIdentity\(contextPatch\),\s*\.\.\.collectionIdentityPatch\(globalContext\)/s);
  assert.match(dockSource, /context: requestContext/);
  assert.doesNotMatch(dockSource, /\.\.\.window\.FolioAgent\?\.currentContext/);
  const merge = dockSource.match(/export function buildAgentRequestContext\([\s\S]*?return \{([\s\S]*?)\};/)?.[1] || "";
  assert.ok(merge.indexOf("withoutCollectionIdentity(scoped.patch)") < merge.indexOf("withoutCollectionIdentity(contextPatch)"), "same-surface explicit request patch must override Dock context");
  assert.ok(merge.indexOf("withoutCollectionIdentity(contextPatch)") < merge.indexOf("...collectionIdentityPatch"), "latest global collection identity must win at submit");
  assert.doesNotMatch(merge, /query|definition|body|items|snippet|providerIds/);
});

test("React Agent Dock hard-resets local context ownership when the route surface changes", async () => {
  const dockSource = await readFile(new URL("../src/app/ReactAgentDock.tsx", import.meta.url), "utf8");

  assert.match(dockSource, /if \(state\.ownerSurface === surface\) return state;/);
  assert.match(dockSource, /return \{ ownerSurface: surface, patch: \{\} \};/);
  assert.match(dockSource, /contextRef\.current = resetDockContextForSurface\(contextRef\.current, surface\);/);
  assert.doesNotMatch(dockSource, /contextRef\.current\s*=\s*requestContext/);
});

test("React Agent chat renders structured markdown and run status cards", async () => {
  const contentSource = await readFile(new URL("../src/app/AgentMessageContent.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../../public/styles.css", import.meta.url), "utf8");

  assert.match(contentSource, /AgentMessageContent/);
  assert.match(contentSource, /AgentRunCard/);
  assert.match(contentSource, /ordered/);
  assert.match(contentSource, /bullet/);
  assert.match(contentSource, /inlineParts/);
  assert.match(styles, /\.agent-run-card/);
  assert.match(styles, /\.agent-chat-markdown/);
});

test("React Agent Dock can approve or reject agent proposals", async () => {
  const dockSource = await readFile(new URL("../src/app/ReactAgentDock.tsx", import.meta.url), "utf8");
  const lifecycleSource = await readFile(new URL("../src/app/agentProposalLifecycle.ts", import.meta.url), "utf8");

  assert.match(dockSource, /type AgentProposal/);
  assert.match(dockSource, /hydrateAgentProposalFromResult/);
  assert.doesNotMatch(dockSource, /result\.proposal\b/);
  assert.match(dockSource, /proposalStatus: proposalHydration\.proposalStatus/);
  assert.match(lifecycleSource, /\/api\/agent\/proposals\/\$\{encodeURIComponent\(proposalId\)\}/);
  assert.match(dockSource, /notifyProposalLifecycle/);
  assert.match(dockSource, /handleProposalAction/);
  assert.match(dockSource, /agent-proposal/);
  assert.match(dockSource, /승인/);
  assert.match(dockSource, /거절/);
});

test("React Agent Dock surfaces preflight failures visibly", async () => {
  const dockSource = await readFile(new URL("../src/app/ReactAgentDock.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../../public/styles.css", import.meta.url), "utf8");

  assert.match(dockSource, /type AgentPreflight/);
  assert.match(dockSource, /\/api\/agent-bridge\/preflight/);
  assert.match(dockSource, /failedPreflightChecks/);
  assert.match(dockSource, /Agent 준비 상태 확인 필요/);
  assert.match(styles, /\.react-agent-preflight/);
});

test("React Agent model dropdowns persist discovered choices instead of free text", async () => {
  const dockSource = await readFile(new URL("../src/app/ReactAgentDock.tsx", import.meta.url), "utf8");
  const homeSource = (await Promise.all([
    "../src/app/AgentHome.tsx",
    "../src/app/agentWorkspace/useAgentWorkspace.ts",
    "../src/app/agentWorkspace/presenters.ts",
    "../src/app/agentWorkspace/AgentComposer.tsx",
  ].map((path) => readFile(new URL(path, import.meta.url), "utf8")))).join("\n");

  assert.match(dockSource, /modelChoicesFor/);
  assert.match(dockSource, /persistModel/);
  assert.match(dockSource, /folio:agent-settings-updated/);
  assert.match(homeSource, /modelChoicesFor/);
  assert.match(homeSource, /persistModel/);
  assert.match(homeSource, /folio:agent-settings-updated/);
  assert.doesNotMatch(homeSource, /placeholder="기본 모델"/);
});

test("React Agent Dock uses provider logos with mono watermarks", async () => {
  const dockSource = await readFile(new URL("../src/app/ReactAgentDock.tsx", import.meta.url), "utf8");
  const bridgeSource = await readFile(new URL("../../public/app.js", import.meta.url), "utf8");
  const styles = await readFile(new URL("../../public/styles.css", import.meta.url), "utf8");

  assert.match(dockSource, /CODEX_COLOR_LOGO/);
  assert.match(dockSource, /CLAUDE_COLOR_LOGO/);
  assert.match(dockSource, /ANTIGRAVITY_COLOR_LOGO/);
  assert.match(dockSource, /monoLogo/);
  assert.match(dockSource, /dangerouslySetInnerHTML=\{\{ __html: meta\.logo \}\}/);
  assert.match(dockSource, /dangerouslySetInnerHTML=\{\{ __html: meta\.monoLogo \}\}/);
  assert.match(bridgeSource, /applyAgentBranding/);
  assert.match(styles, /\.react-agent-watermark[\s\S]*right:\s*20px/);
  assert.match(styles, /\.react-agent-watermark[\s\S]*bottom:\s*18px/);
});

test("resuming a still-running job reads the reply from the thread, not the job result", async () => {
  const dockSource = (await readFile(new URL("../src/app/ReactAgentDock.tsx", import.meta.url), "utf8")).replace(/\r\n/g, "\n");
  const resume = dockSource.match(/async function resumeAgentJob\([\s\S]*?\n  \}\n\n/)?.[0];
  assert.ok(resume, "resumeAgentJob not found");

  // 스레드 메시지 잡은 {sessionId, messageId, status, proposalId}만 돌려준다. 잡 결과에서
  // 답변을 읽으면 `상태 다시 확인` 후 답변 자리에 `작업이 완료되었습니다.`가 들어간다.
  // 계약: features/agent_mode/README.md — 답변 본문은 잡 결과가 아니라 스레드에서 읽는다.
  assert.match(resume, /threads\.latestReply\(threads\.threadId\)/);
  assert.doesNotMatch(resume, /const result\s*(:[^=]*)?=\s*done\.result \|\| \{\}/);
  assert.match(resume, /\.\.\.\(done\.result \|\| \{\}\)/);
  assert.match(resume, /threads\.bumpList\(\)/);
  assert.match(resume, /result\.reply \|\| done\.message/);
});

test("submitAgentMessage tracks thread state in its dependencies (no stale threadId)", async () => {
  const dockSource = await readFile(new URL("../src/app/ReactAgentDock.tsx", import.meta.url), "utf8");

  // threads.threadId/pending이 의존성에서 빠지면 `새 대화`·`짚어보기`·대화 전환 직후의
  // 첫 질문이 낡은 threadId로 이전 대화에 저장된다.
  const depsMatch = dockSource.match(/setBusy\(false\);\s*\}\s*[\s\S]*?\}, \[([^\]]*)\]\);/);
  assert.ok(depsMatch, "submitAgentMessage dependency array not found");
  const deps = depsMatch[1];
  assert.match(deps, /threads\.threadId/);
  assert.match(deps, /threads\.pending/);
  assert.match(deps, /threads\.createThread/);
  assert.match(deps, /threads\.latestReply/);
});
