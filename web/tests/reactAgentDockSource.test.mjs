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
  assert.match(dockSource, /새 채팅/);
  assert.match(contextSource, /window\.FolioAgent/);
  assert.match(contextSource, /updateReactAgentContext/);
  assert.match(contextSource, /openReactAgentDock/);
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

  assert.match(dockSource, /type AgentProposal/);
  assert.match(dockSource, /proposalStatus: result\.proposal \? "pending" : ""/);
  assert.match(dockSource, /\/api\/agent\/proposals\/\$\{encodeURIComponent\(proposalId\)\}/);
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
  const homeSource = await readFile(new URL("../src/app/AgentHome.tsx", import.meta.url), "utf8");

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
