import { useEffect, useRef, useState } from "react";
import { AgentHome } from "./AgentHome";
import { BriefingRoute } from "./BriefingRoute";
import { CommandPalette } from "./CommandPalette";
import { CompanyAnalysisRoute } from "./CompanyAnalysisRoute";
import { Dashboard } from "./Dashboard";
import { DeepResearchRoute } from "./DeepResearchRoute";
import { MarketMemoryRoute } from "./MarketMemoryRoute";
import { ReactAgentDock } from "./ReactAgentDock";
import { RssRoute } from "./RssRoute";
import { SettingsRoute } from "./SettingsRoute";
import { WatchlistRoute } from "./WatchlistRoute";
import { NAV_ROUTES, parseHashRoute, routeById, ROUTES, toHash, type RouteId } from "./routes";
import { useShellStatus } from "./statusStore";

const NAV_GROUPS: Array<{ title: string; routes: RouteId[] }> = [
  { title: "Home", routes: ["home"] },
  { title: "News", routes: ["briefing", "rss", "market-memory"] },
  { title: "Research", routes: ["analysis"] },
  { title: "System", routes: ["settings"] },
];

const ROUTE_ICONS: Record<RouteId, JSX.Element> = {
  home: (
    <svg className="react-left-nav-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h5v-6h4v6h5V9.5" />
    </svg>
  ),
  dashboard: (
    <svg className="react-left-nav-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="7" height="8" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="15" width="7" height="6" rx="1.5" />
    </svg>
  ),
  briefing: (
    // Newspaper (기존 RSS 피드가 쓰던 아이콘)
    <svg className="react-left-nav-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 5h12.5v14H5.5A1.5 1.5 0 0 1 4 17.5z" />
      <path d="M16.5 8H20v9a2 2 0 0 1-2 2h-1.5" />
      <path d="M7.5 9h6" />
      <path d="M7.5 13h6" />
      <path d="M7.5 16.5h3.5" />
    </svg>
  ),
  rss: (
    // Material Icons — dynamic_feed
    <svg className="react-left-nav-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path fill="currentColor" stroke="none" d="M8 8H6v7c0 1.1.9 2 2 2h9v-2H8V8z" />
      <path
        fill="currentColor"
        stroke="none"
        d="M20 3h-8c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 8h-8V7h8v4z"
      />
      <path fill="currentColor" stroke="none" d="M4 12H2v7c0 1.1.9 2 2 2h9v-2H4v-7z" />
    </svg>
  ),
  "market-memory": (
    <svg className="react-left-nav-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22 12h-4l-3 8-6-16-3 8H2" />
    </svg>
  ),
  analysis: (
    // Report (outline) — 문서 + 막대 그래프
    <svg className="react-left-nav-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <path d="M14 3v6h6" />
      <path d="M8 17v-3" />
      <path d="M12 17v-6" />
      <path d="M16 17v-4" />
    </svg>
  ),
  "deep-research": (
    // Untitled UI icons — file-search-02
    <svg className="react-left-nav-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 11H8m2 4H8m8-8H8m12 3.5V6.8c0-1.68 0-2.52-.327-3.162a3 3 0 0 0-1.311-1.311C17.72 2 16.88 2 15.2 2H8.8c-1.68 0-2.52 0-3.162.327a3 3 0 0 0-1.311 1.311C4 4.28 4 5.12 4 6.8v10.4c0 1.68 0 2.52.327 3.162a3 3 0 0 0 1.311 1.311C6.28 22 7.12 22 8.8 22h2.7M22 22l-1.5-1.5m1-2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0" />
    </svg>
  ),
  watchlist: (
    // Untitled UI icons — bookmark-add
    <svg className="react-left-nav-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 13V7m-3 3h6m4 11V7.8c0-1.68 0-2.52-.327-3.162a3 3 0 0 0-1.311-1.311C16.72 3 15.88 3 14.2 3H9.8c-1.68 0-2.52 0-3.162.327a3 3 0 0 0-1.311 1.311C5 5.28 5 6.12 5 7.8V21l7-4z" />
    </svg>
  ),
  settings: (
    <svg className="react-left-nav-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-.4-1.1 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.1-.4 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06A2 2 0 1 1 7.22 3.43l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 .4 1.1 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.2.34.4.7.6 1a1.7 1.7 0 0 0 1.1.4H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.1.4c-.17.14-.31.28-.41.2Z" />
    </svg>
  ),
};

function currentHash() {
  return window.location.hash || toHash("home");
}

function useRouteState(): { hash: string; routeId: RouteId } {
  const [hash, setHash] = useState(() => currentHash());

  useEffect(() => {
    const handleHashChange = () => setHash(currentHash());
    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return { hash, routeId: parseHashRoute(hash) };
}

async function waitForServerAndReload(setStatus: (value: string) => void) {
  // 재시작 신호를 보낸 직후에는 이전 프로세스가 아직 살아 있을 수 있어
  // 잠시 기다렸다가 서버가 완전히 내려간 뒤 다시 뜨는 시점을 감지한다.
  await new Promise((resolve) => window.setTimeout(resolve, 1500));
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      if (response.ok) {
        setStatus("재시작 완료 · 새로고침 중");
        window.location.reload();
        return;
      }
    } catch {
      // 서버가 아직 내려가 있거나 재기동 중이면 계속 폴링한다.
    }
    await new Promise((resolve) => window.setTimeout(resolve, 1000));
  }
  // 60초 안에 살아나지 못하면 수동 새로고침을 안내한다.
  setStatus("재시작 확인 실패 · 수동 새로고침 필요");
}

export function AppShell() {
  const { hash, routeId } = useRouteState();
  const active = routeById(routeId);
  const status = useShellStatus();
  const [navCollapsed, setNavCollapsed] = useState(() => localStorage.getItem("folio.react.navCollapsed") === "1");
  const [agentOpen, setAgentOpen] = useState(() => localStorage.getItem("folio.react.agentClosed") !== "1");
  const [visitedRoutes, setVisitedRoutes] = useState<Set<RouteId>>(() => new Set([routeId]));
  const [routeHashes, setRouteHashes] = useState<Record<string, string>>(() => ({ [routeId]: currentHash() }));
  const [restartStatus, setRestartStatus] = useState("");
  const [restarting, setRestarting] = useState(false);
  const routeHostRef = useRef<HTMLElement | null>(null);
  const previousRouteRef = useRef<RouteId>(routeId);
  const scrollByRouteRef = useRef<Record<string, number>>({});
  const agentVisible = active.id !== "home";
  const shellAgentClass = agentVisible && agentOpen ? " is-agent-open" : " is-agent-closed";

  useEffect(() => {
    localStorage.setItem("folio.react.navCollapsed", navCollapsed ? "1" : "0");
  }, [navCollapsed]);

  useEffect(() => {
    localStorage.setItem("folio.react.agentClosed", agentOpen ? "0" : "1");
  }, [agentOpen]);

  useEffect(() => {
    setVisitedRoutes((current) => {
      if (current.has(routeId)) return current;
      const next = new Set(current);
      next.add(routeId);
      return next;
    });
  }, [routeId]);

  useEffect(() => {
    setRouteHashes((current) => (
      current[routeId] === hash ? current : { ...current, [routeId]: hash }
    ));
  }, [hash, routeId]);

  useEffect(() => {
    const host = routeHostRef.current;
    const previousRoute = previousRouteRef.current;
    if (host) {
      scrollByRouteRef.current[previousRoute] = host.scrollTop;
      window.requestAnimationFrame(() => {
        host.scrollTop = scrollByRouteRef.current[routeId] || 0;
      });
    }
    previousRouteRef.current = routeId;
  }, [routeId]);

  useEffect(() => {
    const bridge = window.FolioBridge ?? {};
    const previousOpenAgentDock = bridge.openAgentDock;
    window.FolioBridge = {
      ...bridge,
      openAgentDock(context = {}) {
        setAgentOpen(true);
        window.dispatchEvent(new CustomEvent("folio:react-agent-request", { detail: context }));
      },
    };
    return () => {
      if (!window.FolioBridge) return;
      window.FolioBridge.openAgentDock = previousOpenAgentDock;
    };
  }, []);

  async function restartServer() {
    if (restarting) return;
    setRestarting(true);
    setRestartStatus("재시작 요청 중");
    try {
      await fetch("/api/server/restart", { method: "POST", body: "{}" });
    } catch {
      // 서버가 응답 전에 종료될 수 있어도 재시작 요청 자체는 정상 흐름이다.
    }
    setRestartStatus("서버 재시작 중");
    // 서버가 os._exit(3) 후 start 스크립트로 재기동될 때까지 폴링하고,
    // 다시 응답하면 최신 코드로 화면을 새로고침한다.
    // 성공 시 reload로 페이지가 다시 로드되고, 실패(타임아웃) 시에만 아래로 돌아온다.
    await waitForServerAndReload(setRestartStatus);
    setRestarting(false);
  }

  function navigateToRoute(nextRouteId: RouteId) {
    const nextHash = routeHashes[nextRouteId] || toHash(nextRouteId);
    if (window.location.hash === nextHash) return;
    window.location.hash = nextHash;
  }

  function renderRoutePane(paneRouteId: RouteId) {
    const route = routeById(paneRouteId);
    if (route.id === "home") return <AgentHome />;
    if (route.id === "dashboard") return <Dashboard />;
    if (route.id === "briefing") return <BriefingRoute />;
    if (route.id === "rss") return <RssRoute />;
    if (route.id === "market-memory") return <MarketMemoryRoute />;
    if (route.id === "analysis") return <CompanyAnalysisRoute />;
    if (route.id === "deep-research") return <DeepResearchRoute />;
    if (route.id === "watchlist") return <WatchlistRoute />;
    if (route.id === "settings") return <SettingsRoute />;
    return null;
  }

  return (
    <div className={`react-shell${navCollapsed ? " is-nav-collapsed" : ""}${shellAgentClass}${agentVisible ? "" : " is-agent-suppressed"}`}>
      <header className="react-shell-topbar">
        <button
          type="button"
          className="react-shell-brand"
          onClick={() => {
            navigateToRoute("home");
          }}
          aria-label="홈으로 이동"
        >
          <span>Folio OS</span>
          <small>Investment Workspace</small>
        </button>
        <div className="react-shell-status" aria-live="polite">
          <span>{restartStatus || status.statusText || "준비됨"}</span>
          {status.activeJobId && <span>{status.activeJobId}</span>}
          <button type="button" onClick={restartServer} disabled={restarting}>
            {restarting ? "재시작 중" : "재시작"}
          </button>
        </div>
      </header>

      <aside className="react-shell-nav" aria-label="주요 화면 탐색">
        <button
          className="react-shell-nav-toggle"
          type="button"
          aria-label={navCollapsed ? "좌측 사이드바 펼치기" : "좌측 사이드바 접기"}
          aria-expanded={!navCollapsed}
          onClick={() => setNavCollapsed((value) => !value)}
        >
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3.5 L5.5 8 L10 12.5" />
          </svg>
        </button>
        <nav className="react-left-nav" aria-label="Folio OS 화면">
          <div className="react-left-nav-title">Navigate</div>
          {NAV_GROUPS.map((group) => (
            <section className="react-left-nav-group" data-nav-group={group.title} key={group.title}>
              <h3>{group.title}</h3>
              <div className="react-left-nav-items">
                {group.routes.map((routeIdValue) => {
                  const route = NAV_ROUTES.find((item) => item.id === routeIdValue);
                  if (!route) return null;
                  return (
                    <span className="react-left-nav-entry" key={route.id}>
                      {group.title === "Home" && route.id === "dashboard" && <span className="react-left-nav-separator" aria-hidden="true" />}
                      <button
                        type="button"
                        data-tooltip={route.label}
                        className={`react-left-nav-item${route.id === active.id ? " active" : ""}`}
                        onClick={() => {
                          navigateToRoute(route.id);
                        }}
                      >
                        <span className="react-left-nav-icon" aria-hidden="true">{ROUTE_ICONS[route.id]}</span>
                        <span className="react-left-nav-label">{route.label}</span>
                      </button>
                    </span>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>
      </aside>

      <main className="react-shell-main">
        <section className="react-route-host" data-route={active.id} ref={routeHostRef}>
          {ROUTES.filter((route) => visitedRoutes.has(route.id)).map((route) => (
            <div
              className="react-route-pane"
              data-route-pane={route.id}
              hidden={route.id !== active.id}
              key={route.id}
            >
              {renderRoutePane(route.id)}
            </div>
          ))}
        </section>
      </main>

      {agentVisible && (
        <ReactAgentDock
          surface={`react_${active.id}`}
          open={agentOpen}
          onOpen={() => setAgentOpen(true)}
          onClose={() => setAgentOpen(false)}
        />
      )}
      <CommandPalette />
    </div>
  );
}
