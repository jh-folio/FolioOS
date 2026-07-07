import { useEffect, useMemo, useRef, useState } from "react";
import { getJson } from "../api";
import { openReactAgentDock } from "./agentContext";
import { NAV_ROUTES, toHash, type RouteId } from "./routes";

type DashboardBriefing = {
  date?: string;
  reportDate?: string;
  title?: string;
  marketScope?: string;
  scope?: string;
};

type DashboardPayload = {
  briefings?: DashboardBriefing[];
};

type CommandItem = {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  run: () => void;
};

function routeSubtitle(routeId: RouteId) {
  if (routeId === "home") return "Agent Home";
  if (routeId === "dashboard") return "위젯과 하단 대시보드";
  if (routeId === "briefing") return "저장 브리핑과 생성";
  if (routeId === "rss") return "RSS 수집 자료";
  if (routeId === "market-memory") return "중기 시장 내러티브";
  if (routeId === "analysis") return "기업 분석 보고서";
  if (routeId === "deep-research") return "딥 리서치 보고서";
  if (routeId === "watchlist") return "워치리스트";
  return "설정";
}

function normalizedScope(value?: string) {
  return value === "us" || value === "kr" || value === "both" ? value : "both";
}

function briefingDate(item: DashboardBriefing) {
  return item.reportDate || item.date || "";
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open || dashboard) return;
    let alive = true;
    getJson<DashboardPayload>("/api/dashboard")
      .then((payload) => {
        if (alive) setDashboard(payload);
      })
      .catch(() => {
        if (alive) setDashboard({ briefings: [] });
      });
    return () => {
      alive = false;
    };
  }, [dashboard, open]);

  useEffect(() => {
    document.body.classList.toggle("command-palette-open", open);
    if (!open) return;
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.classList.remove("command-palette-open");
    };
  }, [open]);

  const items = useMemo<CommandItem[]>(() => {
    const routeItems = NAV_ROUTES.map((route) => ({
      id: `route:${route.id}`,
      title: route.label,
      subtitle: routeSubtitle(route.id),
      type: "화면",
      run: () => {
        window.location.hash = toHash(route.id);
      },
    }));

    const briefingItems = (dashboard?.briefings || []).slice(0, 12).map((item) => {
      const date = briefingDate(item);
      const scope = normalizedScope(item.marketScope || item.scope);
      return {
        id: `briefing:${date}:${scope}`,
        title: item.title || `${date} 시장 브리핑`,
        subtitle: [date, scope.toUpperCase()].filter(Boolean).join(" · "),
        type: "브리핑",
        run: () => {
          if (date) window.location.hash = `#/briefing/${date}/${scope}`;
        },
      };
    });

    return [
      {
        id: "action:agent",
        title: "AI Agent 열기",
        subtitle: "현재 화면 컨텍스트로 Agent Dock을 엽니다.",
        type: "액션",
        run: () => openReactAgentDock({ surface: "command_palette" }),
      },
      ...routeItems,
      ...briefingItems,
    ];
  }, [dashboard?.briefings]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = needle
      ? items.filter((item) => `${item.title} ${item.subtitle} ${item.type}`.toLowerCase().includes(needle))
      : items;
    return rows.slice(0, 40);
  }, [items, query]);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  function close() {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }

  function execute(index = activeIndex) {
    const item = filtered[index];
    if (!item) return;
    item.run();
    close();
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key || "";
      if ((event.ctrlKey || event.metaKey) && key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
        return;
      }
      if (!open) return;
      if (key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((value) => Math.min(Math.max(0, filtered.length - 1), value + 1));
        return;
      }
      if (key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((value) => Math.max(0, value - 1));
        return;
      }
      if (key === "Enter") {
        event.preventDefault();
        execute();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, filtered, open]);

  if (!open) return null;

  return (
    <div className="command-palette react-command-palette" data-react-command-palette>
      <button className="command-backdrop" type="button" aria-label="명령 팔레트 닫기" onClick={close} />
      <section className="command-dialog" role="dialog" aria-modal="true" aria-labelledby="reactCommandPaletteTitle">
        <div className="command-input-row">
          <span className="command-mark" aria-hidden="true">⌘K</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.currentTarget.value);
              setActiveIndex(0);
            }}
            placeholder="화면, 보고서, 액션 검색"
            aria-label="명령 검색"
          />
        </div>
        <h2 id="reactCommandPaletteTitle">명령 팔레트</h2>
        <div className="command-list" role="listbox" aria-label="명령 목록">
          {filtered.length ? filtered.map((item, index) => (
            <button
              className={`command-item${index === activeIndex ? " active" : ""}`}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              key={item.id}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => execute(index)}
            >
              <span>
                <span className="command-item-title">{item.title}</span>
                <span className="command-item-subtitle">{item.subtitle}</span>
              </span>
              <span className="command-item-type">{item.type}</span>
            </button>
          )) : (
            <div className="command-empty">검색 결과가 없습니다.</div>
          )}
        </div>
        <div className="command-footer">Ctrl/⌘ K로 열고, Enter로 실행합니다.</div>
      </section>
    </div>
  );
}
