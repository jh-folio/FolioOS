# React SPA Rewrite Phase 0/1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the React SPA rewrite foundation without breaking the existing Folio OS UI.

**Architecture:** Keep FastAPI and existing JSON APIs unchanged. Build a React app shell in `web/src/app/` that can own navigation, status, and route containers while legacy views continue to work through a typed bridge. Do not migrate business screens in this plan except for shell-level placeholders and compatibility wiring.

**Tech Stack:** React 18, TypeScript, Vite 8, existing CSS variables in `public/styles.css`, existing FastAPI endpoints, existing `public/app.js` as legacy bridge during migration.

## Global Constraints

- Do not change data storage formats in `data/`, `research-inbox/`, or `config/`.
- Do not expose `.env`, API keys, Notion tokens, or CLI credentials in frontend state or logs.
- Keep `app.py` thin; this plan should not add backend feature logic.
- React Phase 1 must not remove existing legacy views.
- Do not change Canonical report markdown as part of frontend migration.
- Mobile width 390px must not introduce horizontal overflow.
- Keep `node --check public\app.js`, `npm run typecheck`, and `npm run build` green after every task.

---

## File Structure

- Create `docs/frontend/react-spa-inventory.md` - Phase 0 inventory and contract freeze.
- Modify `features/frontend_ui/README.md` - replace obsolete right actionbar/shell description with current legacy + target React SPA state.
- Create `web/src/app/routes.ts` - route ids, labels, hash parsing, and legacy view ids.
- Create `web/src/app/legacyBridge.ts` - typed wrapper around `window.FolioBridge` and legacy view activation.
- Create `web/src/app/statusStore.ts` - minimal React-readable status/job/document count state contract.
- Create `web/src/app/AppShell.tsx` - top status bar, left navigation, route host.
- Create `web/src/app/App.tsx` - root React app.
- Modify `web/src/main.tsx` - mount either SPA root or existing islands.
- Modify `public/index.html` - add `#folioReactRoot` without deleting legacy DOM.
- Modify `public/app.js` - expose stable bridge methods used by React shell.
- Test with `npm run typecheck`, `npm run build`, `node --check public\app.js`, and browser DOM checks.

---

### Task 1: Frontend Inventory Contract

**Files:**
- Create: `docs/frontend/react-spa-inventory.md`
- Modify: `features/frontend_ui/README.md`

**Interfaces:**
- Consumes: current `public/app.js`, `public/index.html`, `web/src/main.tsx`.
- Produces: documented route/API/UI ownership contract for later React tasks.

- [ ] **Step 1: Create inventory document**

Create `docs/frontend/react-spa-inventory.md` with this structure:

```markdown
# React SPA Inventory

## Legacy Owners

| Area | Current owner | React target | Notes |
| --- | --- | --- | --- |
| Routing/navigation | `public/app.js::switchViewById`, `renderLeftNavigation` | `web/src/app/routes.ts`, `AppShell` | Hash compatibility must be preserved during migration. |
| Top status/jobs | `#status`, `#jobProgress`, `pollJob` | `statusStore`, `TopStatusBar` | Existing job APIs stay unchanged. |
| Agent chat/dock | `public/app.js` Agent functions | `AgentHome`, later shared Agent components | Proposal approval contract stays backend-owned. |
| Market state dashboard | `web/src/islands/MarketStateDashboard.tsx` | Dashboard route component | Existing island becomes normal component. |
| Report readers | `openBriefingReader`, `openAnalysisReader`, `openTopicReader` | `ReportReaderShell` | Canonical markdown remains separate from notes/overlay. |
| Native notes | note panel in `public/app.js`, `/api/investment-notes` | React note panel | Notes are hypothesis, not evidence. |
| Settings | `renderSettings`, setup handlers | React settings route | No secret values rendered. |

## API Contracts To Preserve

| Feature | Endpoints | Migration rule |
| --- | --- | --- |
| Dashboard | `GET /api/dashboard` | Keep response shape in Phase 1. |
| Market State | `GET /api/memory/state-dashboard?limit=5` | Existing component can consume unchanged. |
| Agent Chat | `POST /api/agent/chat`, `GET /api/jobs/{id}` | React uses same job polling. |
| Agent Proposals | `POST /api/agent/proposals/{id}` | Approval required before writeback. |
| Briefings | `GET /api/briefings`, `GET /api/briefings/{date}` | Reader migration must preserve hash/deeplink behavior. |
| Investment Notes | `GET/POST /api/investment-notes` | Notes remain hypothesis. |

## Migration Guardrails

- React shell may wrap legacy views, but must not delete them in Phase 1.
- `renderMarkdown()` parity is required before React reader migration.
- Browser verification must check console errors and mobile overflow.
```

- [ ] **Step 2: Update frontend README current-state language**

Replace the opening obsolete "3-zone workspace with right action panel" section in `features/frontend_ui/README.md` with a short current-state section:

```markdown
## 현재 프론트엔드 구조

현재 운영 UI는 `public/index.html`, `public/app.js`, `public/styles.css`가 대부분 소유한다. React는 `web/`에서 Vite로 빌드되어 `public/react/folio-react.js`로 제공되며, 현재는 Market State Dashboard 같은 일부 island만 담당한다.

우측 전역 Action Panel은 제거되었다. 보고서 조작은 리더 내부 조작 레일과 노트 패널에서 처리한다.

## React SPA 전환 방향

장기 목표는 `web/` React/TypeScript SPA가 routing, navigation, Agent Home, Dashboard, Report Reader, Notes, Settings를 소유하고, `public/app.js`는 전환 기간 동안 legacy bridge 역할만 맡는 것이다. 세부 계획은 `roadmap/REACT_SPA_REWRITE_PLAN.md`를 따른다.
```

Keep the later detailed sections that still describe current Agent Dock, Native Notes, Market State Dashboard, and UI rules.

- [ ] **Step 3: Verify docs contain no stale rightActionbar contract**

Run:

```powershell
rg -n "rightActionbar|ACTION_GROUPS|renderActionPanel|우측 Action Panel" features\frontend_ui\README.md docs\frontend\react-spa-inventory.md
```

Expected: no results in `docs/frontend/react-spa-inventory.md`; `features/frontend_ui/README.md` may mention removed actionbar only as historical removal, not as current architecture.

- [ ] **Step 4: Commit**

```powershell
git add docs\frontend\react-spa-inventory.md features\frontend_ui\README.md
git commit -m "docs(frontend): define react spa inventory"
```

---

### Task 2: React Route and Bridge Contracts

**Files:**
- Create: `web/src/app/routes.ts`
- Create: `web/src/app/legacyBridge.ts`
- Modify: `web/src/api.ts`

**Interfaces:**
- Consumes: `window.FolioBridge` from `public/app.js`.
- Produces:
  - `ROUTES: AppRoute[]`
  - `parseHashRoute(hash: string): RouteId`
  - `toHash(routeId: RouteId): string`
  - `legacyBridge(): LegacyBridge`

- [ ] **Step 1: Add route contract**

Create `web/src/app/routes.ts`:

```ts
export type RouteId =
  | "home"
  | "dashboard"
  | "briefing"
  | "rss"
  | "market-memory"
  | "analysis"
  | "deep-research"
  | "watchlist"
  | "portfolio"
  | "notes"
  | "settings";

export type LegacyViewId =
  | "review"
  | "briefing"
  | "rssfeed"
  | "memory"
  | "analysis"
  | "topicrpt"
  | "watchlist"
  | "portfolio"
  | "notes"
  | "settings";

export type AppRoute = {
  id: RouteId;
  label: string;
  group: "home" | "research" | "portfolio" | "system";
  legacyViewId?: LegacyViewId;
};

export const ROUTES: AppRoute[] = [
  { id: "home", label: "홈", group: "home" },
  { id: "dashboard", label: "대시보드", group: "home", legacyViewId: "review" },
  { id: "briefing", label: "브리핑", group: "research", legacyViewId: "briefing" },
  { id: "rss", label: "RSS 피드", group: "research", legacyViewId: "rssfeed" },
  { id: "market-memory", label: "시장 내러티브", group: "research", legacyViewId: "memory" },
  { id: "analysis", label: "기업 분석", group: "research", legacyViewId: "analysis" },
  { id: "deep-research", label: "딥 리서치", group: "research", legacyViewId: "topicrpt" },
  { id: "watchlist", label: "워치리스트", group: "portfolio", legacyViewId: "watchlist" },
  { id: "portfolio", label: "포트폴리오", group: "portfolio", legacyViewId: "portfolio" },
  { id: "notes", label: "투자 노트", group: "system", legacyViewId: "notes" },
  { id: "settings", label: "설정", group: "system", legacyViewId: "settings" },
];

const DEFAULT_ROUTE: RouteId = "home";

export function parseHashRoute(hash: string): RouteId {
  const cleaned = hash.replace(/^#\/?/, "").split("/")[0];
  return ROUTES.some((route) => route.id === cleaned) ? (cleaned as RouteId) : DEFAULT_ROUTE;
}

export function toHash(routeId: RouteId): string {
  return `#/${routeId}`;
}

export function routeById(routeId: RouteId): AppRoute {
  return ROUTES.find((route) => route.id === routeId) ?? ROUTES[0];
}
```

- [ ] **Step 2: Add typed legacy bridge**

Create `web/src/app/legacyBridge.ts`:

```ts
import type { LegacyViewId } from "./routes";

export type LegacyBridge = {
  switchLegacyView?: (viewId: LegacyViewId) => void;
  updateAgentContext?: (patch: Record<string, unknown>) => void;
  applyAgentBranding?: () => void;
  openAgentDock?: (context?: Record<string, unknown>) => void;
  readStatus?: () => {
    statusText?: string;
    docCount?: string;
    activeJobId?: string | null;
  };
};

declare global {
  interface Window {
    FolioBridge?: LegacyBridge;
  }
}

export function legacyBridge(): LegacyBridge {
  return window.FolioBridge ?? {};
}

export function switchLegacyView(viewId: LegacyViewId) {
  legacyBridge().switchLegacyView?.(viewId);
}
```

- [ ] **Step 3: Simplify `web/src/api.ts` bridge declarations**

Modify `web/src/api.ts` so it only exports JSON helpers. Remove its local `declare global` for `FolioBridge`; the bridge contract now lives in `web/src/app/legacyBridge.ts`.

Expected `web/src/api.ts`:

```ts
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
```

- [ ] **Step 4: Run typecheck**

Run:

```powershell
npm run typecheck
```

Expected: pass.

- [ ] **Step 5: Commit**

```powershell
git add web\src\app\routes.ts web\src\app\legacyBridge.ts web\src\api.ts
git commit -m "feat(web): add react route bridge contracts"
```

---

### Task 3: Legacy Bridge Provider in Vanilla App

**Files:**
- Modify: `public/app.js`

**Interfaces:**
- Consumes: existing `switchViewById`, `applyAgentBranding`, `openAgentDock`, `state`.
- Produces: `window.FolioBridge.switchLegacyView`, `window.FolioBridge.readStatus`.

- [ ] **Step 1: Add bridge methods near existing `window.FolioBridge` assignment**

Find the current `window.FolioBridge` block in `public/app.js` and extend it to:

```js
window.FolioBridge = {
  updateAgentContext(patch = {}) {
    FolioAgent.currentContext = { ...(FolioAgent.currentContext || {}), ...patch };
  },
  applyAgentBranding,
  openAgentDock(context = {}) {
    if (context && Object.keys(context).length) {
      FolioAgent.currentContext = { ...(FolioAgent.currentContext || {}), ...context };
    }
    openAgentDock();
  },
  switchLegacyView(viewId) {
    if (typeof viewId === "string") switchViewById(viewId);
  },
  readStatus() {
    return {
      statusText: document.getElementById("status")?.textContent || "",
      docCount: document.getElementById("docCount")?.textContent || "",
      activeJobId: state.activeAgentJobId || null,
    };
  },
};
```

If the existing block already has some of these methods, preserve behavior and add only missing methods.

- [ ] **Step 2: Run syntax check**

Run:

```powershell
node --check public\app.js
```

Expected: no output, exit 0.

- [ ] **Step 3: Commit**

```powershell
git add public\app.js
git commit -m "feat(frontend): expose legacy bridge for react shell"
```

---

### Task 4: React App Shell Mount

**Files:**
- Create: `web/src/app/App.tsx`
- Create: `web/src/app/AppShell.tsx`
- Create: `web/src/app/statusStore.ts`
- Modify: `web/src/main.tsx`
- Modify: `public/index.html`

**Interfaces:**
- Consumes: `ROUTES`, `parseHashRoute`, `toHash`, `routeById`, `switchLegacyView`.
- Produces: React shell mounted in `#folioReactRoot`, with legacy island fallback still working.

- [ ] **Step 1: Add status store**

Create `web/src/app/statusStore.ts`:

```ts
import { useEffect, useState } from "react";
import { legacyBridge } from "./legacyBridge";

export type ShellStatus = {
  statusText: string;
  docCount: string;
  activeJobId: string | null;
};

export function useShellStatus(): ShellStatus {
  const [status, setStatus] = useState<ShellStatus>({
    statusText: "",
    docCount: "",
    activeJobId: null,
  });

  useEffect(() => {
    const read = () => {
      const next = legacyBridge().readStatus?.() ?? {};
      setStatus({
        statusText: next.statusText || "",
        docCount: next.docCount || "",
        activeJobId: next.activeJobId || null,
      });
    };
    read();
    const timer = window.setInterval(read, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return status;
}
```

- [ ] **Step 2: Add AppShell**

Create `web/src/app/AppShell.tsx`:

```tsx
import { useEffect, useMemo, useState } from "react";
import { ROUTES, parseHashRoute, routeById, toHash, type RouteId } from "./routes";
import { switchLegacyView } from "./legacyBridge";
import { useShellStatus } from "./statusStore";

function useRoute(): [RouteId, (route: RouteId) => void] {
  const [route, setRoute] = useState<RouteId>(() => parseHashRoute(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setRoute(parseHashRoute(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = (next: RouteId) => {
    if (window.location.hash !== toHash(next)) window.location.hash = toHash(next);
    setRoute(next);
  };

  return [route, navigate];
}

export function AppShell() {
  const [activeRoute, navigate] = useRoute();
  const status = useShellStatus();
  const active = useMemo(() => routeById(activeRoute), [activeRoute]);

  useEffect(() => {
    if (active.legacyViewId) switchLegacyView(active.legacyViewId);
  }, [active]);

  return (
    <div className="react-shell" data-react-shell="1">
      <aside className="react-shell-nav" aria-label="Folio OS navigation">
        <div className="react-shell-brand">Folio OS</div>
        <nav>
          {ROUTES.map((route) => (
            <button
              key={route.id}
              type="button"
              className={route.id === activeRoute ? "active" : ""}
              onClick={() => navigate(route.id)}
            >
              {route.label}
            </button>
          ))}
        </nav>
      </aside>
      <section className="react-shell-main">
        <header className="react-shell-status">
          <span>{status.statusText || "준비됨"}</span>
          <span>{status.docCount}</span>
        </header>
        <div className="react-route-host" data-route={activeRoute}>
          {activeRoute === "home" ? (
            <div className="react-placeholder">
              <p className="section-kicker">AGENT HOME</p>
              <h1>AI Agent 작업 화면</h1>
              <p>다음 단계에서 채팅 composer와 작업 제안 흐름을 이곳에 구현합니다.</p>
            </div>
          ) : (
            <div className="react-legacy-host" data-legacy-view={active.legacyViewId || ""} />
          )}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Add App root**

Create `web/src/app/App.tsx`:

```tsx
import { AppShell } from "./AppShell";

export function App() {
  return <AppShell />;
}
```

- [ ] **Step 4: Update `web/src/main.tsx`**

Replace `web/src/main.tsx` with:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { MarketStateDashboard } from "./islands/MarketStateDashboard";

const ISLANDS: Record<string, () => JSX.Element> = {
  "market-state": () => <MarketStateDashboard />,
};

function mountApp() {
  const root = document.getElementById("folioReactRoot");
  if (!root || root.dataset.reactMounted === "1") return false;
  root.dataset.reactMounted = "1";
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  return true;
}

function mountIslands() {
  document.querySelectorAll<HTMLElement>("[data-react-island]").forEach((el) => {
    const name = el.dataset.reactIsland || "";
    const factory = ISLANDS[name];
    if (!factory || el.dataset.reactMounted === "1") return;
    el.dataset.reactMounted = "1";
    createRoot(el).render(<StrictMode>{factory()}</StrictMode>);
  });
}

function mountReact() {
  const mountedApp = mountApp();
  if (!mountedApp) mountIslands();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountReact);
} else {
  mountReact();
}
```

- [ ] **Step 5: Add React root to `public/index.html`**

Add this inside `<body>` before the current `<main class="page home-active">`:

```html
<div id="folioReactRoot" hidden></div>
```

Keep it hidden for this task. The shell is mounted but not yet visible by default. Later tasks will enable it behind a flag.

- [ ] **Step 6: Run checks**

Run:

```powershell
npm run typecheck
npm run build
node --check public\app.js
```

Expected: all pass.

- [ ] **Step 7: Browser smoke**

Open `http://127.0.0.1:8787/?react-shell-check=1`.

Verify via DOM:

```js
({
  reactRoot: Boolean(document.getElementById("folioReactRoot")),
  rootMounted: document.getElementById("folioReactRoot")?.dataset.reactMounted || null,
  legacyVisible: Boolean(document.querySelector("main.page")),
  islandFallback: Boolean(document.querySelector('[data-react-island="market-state"]')),
})
```

Expected:

```json
{
  "reactRoot": true,
  "rootMounted": "1",
  "legacyVisible": true,
  "islandFallback": true
}
```

- [ ] **Step 8: Commit**

```powershell
git add web\src\app web\src\main.tsx public\index.html public\react\folio-react.js
git commit -m "feat(web): add hidden react app shell"
```

---

### Task 5: Opt-In React Shell Flag

**Files:**
- Modify: `public/index.html`
- Modify: `public/styles.css`
- Modify: `web/src/app/AppShell.tsx`

**Interfaces:**
- Consumes: hidden React shell from Task 4.
- Produces: opt-in URL flag `?reactShell=1` that shows React shell while preserving default legacy UI.

- [ ] **Step 1: Make root visibility controlled by query flag**

In `web/src/app/AppShell.tsx`, add:

```tsx
const reactShellEnabled = new URLSearchParams(window.location.search).get("reactShell") === "1";
```

If not enabled, render `null`.

Use:

```tsx
export function AppShell() {
  const reactShellEnabled = new URLSearchParams(window.location.search).get("reactShell") === "1";
  const [activeRoute, navigate] = useRoute();
  const status = useShellStatus();
  const active = useMemo(() => routeById(activeRoute), [activeRoute]);

  useEffect(() => {
    if (reactShellEnabled && active.legacyViewId) switchLegacyView(active.legacyViewId);
  }, [active, reactShellEnabled]);

  if (!reactShellEnabled) return null;

  return (
    // existing JSX
  );
}
```

- [ ] **Step 2: Add minimal shell CSS**

Append to `public/styles.css`:

```css
#folioReactRoot:not(:empty) {
  display: block;
}

body:has(#folioReactRoot .react-shell) main.page {
  display: none;
}

.react-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  background: var(--folio-bg, #f7f6f2);
  color: var(--folio-ink, #111827);
}

.react-shell-nav {
  border-right: 1px solid var(--folio-line, #e5e0d8);
  padding: 18px 14px;
  background: var(--folio-surface, #fbfaf7);
}

.react-shell-brand {
  font-weight: 800;
  margin-bottom: 18px;
}

.react-shell-nav nav {
  display: grid;
  gap: 4px;
}

.react-shell-nav button {
  min-height: 38px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  text-align: left;
  padding: 0 12px;
  font: inherit;
  cursor: pointer;
}

.react-shell-nav button.active {
  background: var(--folio-surface-2, #eee9df);
  font-weight: 800;
}

.react-shell-main {
  min-width: 0;
  display: grid;
  grid-template-rows: 54px minmax(0, 1fr);
}

.react-shell-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--folio-line, #e5e0d8);
  padding: 0 20px;
}

.react-route-host {
  min-width: 0;
  padding: 24px;
}

.react-placeholder {
  max-width: 860px;
}

@media (max-width: 760px) {
  .react-shell {
    grid-template-columns: 1fr;
  }

  .react-shell-nav {
    border-right: 0;
    border-bottom: 1px solid var(--folio-line, #e5e0d8);
  }
}
```

- [ ] **Step 3: Run checks**

Run:

```powershell
npm run typecheck
npm run build
node --check public\app.js
```

Expected: all pass.

- [ ] **Step 4: Browser smoke default legacy**

Open `http://127.0.0.1:8787/`.

Expected DOM:

```js
Boolean(document.querySelector("main.page")) === true
Boolean(document.querySelector(".react-shell")) === false
```

- [ ] **Step 5: Browser smoke opt-in shell**

Open `http://127.0.0.1:8787/?reactShell=1#/home`.

Expected DOM:

```js
Boolean(document.querySelector(".react-shell")) === true
getComputedStyle(document.querySelector("main.page")).display === "none"
```

Also check console error count is 0.

- [ ] **Step 6: Commit**

```powershell
git add public\styles.css public\react\folio-react.js web\src\app\AppShell.tsx
git commit -m "feat(web): gate react shell behind opt-in flag"
```

---

## Plan Self-Review

- Spec coverage: Phase 0 inventory, Phase 1 app foundation, bridge, status, hidden mount, opt-in shell are covered.
- Placeholder scan: no task uses unresolved placeholder markers.
- Type consistency: route ids and bridge method names are defined before use.
- Deferred by design: Agent Home, Dashboard, Report Reader, and screen migrations are later plans after this foundation lands.
