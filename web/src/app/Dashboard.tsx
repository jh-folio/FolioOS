import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getJson, postJson } from "../api";
import { MarketStateDashboard } from "../islands/MarketStateDashboard";
import { updateReactAgentContext } from "./agentContext";
import { RouteHero } from "./RouteHero";

type DashboardPayload = {
  index?: {
    generatedAt?: string;
    count?: number;
    newsCount?: number;
    inbox?: string;
  };
  briefings?: Array<{ title?: string; type?: string; date?: string; marketScope?: string; scope?: string }>;
  recent?: Array<{ title?: string; source?: string; date?: string }>;
  notes?: Array<{ title?: string; updatedAt?: string; noteType?: string }>;
};

type InvestmentReview = {
  date?: string;
  generatedAt?: string;
  summary?: string;
  stats?: Record<string, unknown>;
  recentReports?: Array<{ title?: string; type?: string; date?: string; view?: string }>;
  keyCheckpoints?: Array<{ checkpoint?: string } | string>;
  portfolioImpacts?: Array<{ ticker?: string; name?: string; impact?: string; narrative?: string }>;
  warnings?: string[];
  stale?: boolean;
};

type LoadState = {
  dashboard: DashboardPayload | null;
  review: InvestmentReview | null;
};

type AgentJob = {
  id: string;
  kind?: string;
  status: "queued" | "running" | "done" | "failed" | "cancelled";
  message?: string;
  error?: string;
  result?: { date?: string; artifactId?: string };
};

type MarketWidgetSettings = {
  dashboard?: {
    widgets?: MarketWidget[];
  };
  catalog?: Record<string, unknown>;
  presetOverrides?: Record<string, unknown>;
};

type MarketWidget = {
  id?: string;
  type?: string;
  title?: string;
  size?: string;
  columns?: number;
  symbol?: string;
  interval?: string;
  chartType?: string;
  theme?: string;
  preset?: string;
  height?: number;
};

declare global {
  interface Window {
    FolioTradingViewWidgets?: {
      renderDashboardBoard?: (target: HTMLElement, settings: MarketWidgetSettings, options?: { fallbackHtml?: string }) => void;
      renderWatchlistDetail?: (target: HTMLElement, detail: unknown) => void;
      cleanup?: (root?: ParentNode) => void;
    };
  }
}

const IMPACT_LABELS: Record<string, string> = {
  positive: "긍정",
  watch: "주의",
  negative: "부정",
  neutral: "중립",
};

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isAgentJob(value: unknown): value is AgentJob {
  const job = value as AgentJob;
  return Boolean(job?.id && job?.kind === "agent_bridge" && ["queued", "running"].includes(job.status));
}

async function pollAgentJob(job: AgentJob): Promise<AgentJob> {
  let current = job;
  while (["queued", "running"].includes(current.status)) {
    await sleep(1000);
    current = await getJson<AgentJob>(`/api/jobs/${encodeURIComponent(current.id)}`);
  }
  if (current.status !== "done") {
    throw new Error(current.message || current.error || "투자 리뷰 생성에 실패했습니다.");
  }
  return current;
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function statValue(stats: Record<string, unknown> | undefined, keys: string[]): number {
  for (const key of keys) {
    const value = asNumber(stats?.[key]);
    if (value) return value;
  }
  return 0;
}

function itemLabel(item: { ticker?: string; name?: string }) {
  return item.name || item.ticker || "포지션";
}

function CurrentMarketWidgetBoard() {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [settings, setSettings] = useState<MarketWidgetSettings | null>(null);
  const [error, setError] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [widgetMenu, setWidgetMenu] = useState<{ widgetId: string; x: number; y: number } | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const payload = await getJson<MarketWidgetSettings>("/api/market-widgets/settings");
      setSettings(payload);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "시장 위젯 설정을 불러오지 못했습니다.");
    }
  }, []);

  useEffect(() => {
    let alive = true;
    getJson<MarketWidgetSettings>("/api/market-widgets/settings")
      .then((payload) => {
        if (!alive) return;
        setSettings(payload);
        setError("");
      })
      .catch((err) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "시장 위젯 설정을 불러오지 못했습니다.");
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const handleSettingsUpdate = (event: Event) => {
      const detail = (event as CustomEvent<MarketWidgetSettings | null>).detail;
      if (detail) {
        setSettings(detail);
        setError("");
      } else {
        loadSettings();
      }
    };
    document.addEventListener("folio:market-widgets-updated", handleSettingsUpdate);
    return () => document.removeEventListener("folio:market-widgets-updated", handleSettingsUpdate);
  }, [loadSettings]);

  useEffect(() => {
    const target = boardRef.current;
    if (!target) return;
    window.FolioTradingViewWidgets?.cleanup?.(target);
    if (!settings) {
      target.innerHTML = '<div class="tradingview-widget-unavailable">시장 위젯 설정을 불러오는 중입니다.</div>';
      return;
    }
    if (window.FolioTradingViewWidgets?.renderDashboardBoard) {
      window.FolioTradingViewWidgets.renderDashboardBoard(target, settings, {
        fallbackHtml: '<div class="tradingview-widget-unavailable">시장 위젯을 표시할 수 없습니다.</div>',
      });
    } else {
      target.innerHTML = '<div class="tradingview-widget-unavailable">시장 위젯 렌더러를 찾을 수 없습니다.</div>';
    }
    return () => {
      window.FolioTradingViewWidgets?.cleanup?.(target);
    };
  }, [settings]);

  async function saveWidgetSettings(nextSettings: MarketWidgetSettings) {
    const saved = await postJson<MarketWidgetSettings>("/api/market-widgets/settings", nextSettings);
    setSettings(saved);
    document.dispatchEvent(new CustomEvent("folio:market-widgets-updated", { detail: saved }));
    return saved;
  }

  function currentWidgets() {
    return settings?.dashboard?.widgets ? [...settings.dashboard.widgets] : [];
  }

  function withWidgets(widgets: MarketWidget[]): MarketWidgetSettings {
    return {
      ...settings,
      dashboard: { ...(settings?.dashboard || {}), widgets },
      presetOverrides: settings?.presetOverrides || {},
    };
  }

  async function saveWidgetOrder(widgetId: string, targetIndex: number) {
    const widgets = currentWidgets();
    const fromIndex = widgets.findIndex((widget) => widget.id === widgetId);
    if (fromIndex < 0) return;
    const boundedTarget = Math.max(0, Math.min(widgets.length - 1, targetIndex));
    if (fromIndex === boundedTarget) return;
    const [moved] = widgets.splice(fromIndex, 1);
    widgets.splice(boundedTarget, 0, moved);
    try {
      await saveWidgetSettings(withWidgets(widgets));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "시장 위젯 위치 저장에 실패했습니다.");
    }
  }

  async function saveWidgetSize(widgetId: string, height: number, columns: number) {
    const widgets = currentWidgets();
    const index = widgets.findIndex((widget) => widget.id === widgetId);
    if (index < 0) return;
    const nextHeight = Math.max(240, Math.min(1100, Math.round(height)));
    const nextColumns = Math.max(3, Math.min(12, Math.round(columns)));
    const currentHeight = Math.round(Number(widgets[index].height || 0));
    const currentColumns = Math.round(Number(widgets[index].columns || 0));
    if (currentHeight === nextHeight && currentColumns === nextColumns) return;
    widgets[index] = { ...widgets[index], height: nextHeight, columns: nextColumns };
    try {
      await saveWidgetSettings(withWidgets(widgets));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "시장 위젯 크기 저장에 실패했습니다.");
    }
  }

  async function addWidget(kind: "overview" | "chart") {
    setBusyAction(kind);
    try {
      const widgets = currentWidgets();
      const id = `${kind}-${Date.now().toString(36)}`;
      const nextWidget: MarketWidget = kind === "overview"
        ? {
            id,
            type: "market_overview",
            title: "Global Markets",
            size: "wide",
            columns: 8,
            preset: "global_core",
            theme: "auto",
          }
        : {
            id,
            type: "advanced_chart",
            title: "S&P 500",
            size: "wide",
            columns: 4,
            symbol: "FOREXCOM:SPXUSD",
            interval: "D",
            chartType: "candlesticks",
            theme: "auto",
          };
      await saveWidgetSettings(withWidgets([...widgets, nextWidget]));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "시장 위젯 추가에 실패했습니다.");
    } finally {
      setBusyAction("");
    }
  }

  async function resetWidgets() {
    setBusyAction("reset");
    try {
      await saveWidgetSettings({ dashboard: { widgets: [] } });
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "시장 위젯 기본값 복원에 실패했습니다.");
    } finally {
      setBusyAction("");
    }
  }

  async function editWidget(widgetId: string) {
    setWidgetMenu(null);
    const widgets = currentWidgets();
    const index = widgets.findIndex((widget) => widget.id === widgetId);
    if (index < 0) return;
    const widget = widgets[index];
    const title = window.prompt("위젯 제목", widget.title || "");
    if (title === null) return;
    let symbol = widget.symbol || "";
    if (["advanced_chart", "symbol_overview", "ticker_tag", "single_ticker", "stock_heatmap"].includes(String(widget.type || ""))) {
      const nextSymbol = window.prompt("TradingView 심볼", symbol || "FOREXCOM:SPXUSD");
      if (nextSymbol === null) return;
      symbol = nextSymbol.trim().toUpperCase();
    }
    widgets[index] = { ...widget, title: String(title || widget.title || "").trim(), symbol };
    setBusyAction("editor");
    try {
      await saveWidgetSettings(withWidgets(widgets));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "시장 위젯 수정에 실패했습니다.");
    } finally {
      setBusyAction("");
    }
  }

  async function deleteWidget(widgetId: string) {
    setWidgetMenu(null);
    const widgets = currentWidgets();
    const widget = widgets.find((item) => item.id === widgetId);
    if (!widget) return;
    const label = widget.title || widget.symbol || widget.type || "위젯";
    if (!window.confirm(`${label} 위젯을 삭제할까요?`)) return;
    setBusyAction("delete");
    try {
      await saveWidgetSettings(withWidgets(widgets.filter((item) => item.id !== widgetId)));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "시장 위젯 삭제에 실패했습니다.");
    } finally {
      setBusyAction("");
    }
  }

  useEffect(() => {
    const target = boardRef.current;
    if (!target) return;
    const handleClick = (event: MouseEvent) => {
      const button = (event.target as HTMLElement | null)?.closest("[data-tv-widget-menu]");
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      const card = button.closest<HTMLElement>(".tv-widget-card");
      const widgetId = card?.dataset.widgetId || "";
      if (!widgetId) return;
      const rect = button.getBoundingClientRect();
      setWidgetMenu({ widgetId, x: rect.right, y: rect.bottom + 6 });
    };
    target.addEventListener("click", handleClick);
    return () => target.removeEventListener("click", handleClick);
  }, [settings]);

  useEffect(() => {
    const target = boardRef.current;
    if (!target || !settings) return;
    let resizeState: {
      widgetId: string;
      startX: number;
      startY: number;
      startWidth: number;
      startHeight: number;
      startColumns: number;
      card: HTMLElement;
    } | null = null;
    let dragState: { widgetId: string; card: HTMLElement } | null = null;

    const cards = () => Array.from(target.querySelectorAll<HTMLElement>(".tv-widget-card[data-widget-id]"));
    const columnsForWidth = (width: number) => {
      const boardRect = target.getBoundingClientRect();
      const styles = window.getComputedStyle(target);
      const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
      const trackWidth = (boardRect.width - gap * 11) / 12;
      if (!Number.isFinite(trackWidth) || trackWidth <= 0) return 12;
      return Math.max(3, Math.min(12, Math.round((width + gap) / (trackWidth + gap))));
    };
    const targetIndexFromPoint = (clientX: number, clientY: number) => {
      const positioned = cards()
        .map((card, index) => ({ index, rect: card.getBoundingClientRect() }))
        .filter(({ rect }) => rect.width > 0 && rect.height > 0)
        .sort((a, b) => (a.rect.top - b.rect.top) || (a.rect.left - b.rect.left));
      if (!positioned.length) return 0;
      let closest = positioned[0];
      let closestDistance = Number.POSITIVE_INFINITY;
      for (const item of positioned) {
        const centerX = item.rect.left + item.rect.width / 2;
        const centerY = item.rect.top + item.rect.height / 2;
        const distance = Math.hypot(clientX - centerX, clientY - centerY);
        if (distance < closestDistance) {
          closest = item;
          closestDistance = distance;
        }
      }
      const beforeClosest = (
        clientY < closest.rect.top + closest.rect.height / 2
        || (clientY <= closest.rect.bottom && clientX < closest.rect.left + closest.rect.width / 2)
      );
      return beforeClosest ? closest.index : Math.min(closest.index + 1, positioned.length - 1);
    };

    const handlePointerDown = (event: PointerEvent) => {
      const element = event.target as HTMLElement | null;
      const resizeHandle = element?.closest<HTMLElement>("[data-tv-widget-resize]");
      const dragHandle = element?.closest<HTMLElement>("[data-tv-widget-drag-handle]");
      const card = element?.closest<HTMLElement>(".tv-widget-card[data-widget-id]");
      const widgetId = card?.dataset.widgetId || "";
      if (!card || !widgetId) return;
      if (resizeHandle) {
        event.preventDefault();
        const rect = card.getBoundingClientRect();
        resizeState = {
          widgetId,
          startX: event.clientX,
          startY: event.clientY,
          startWidth: rect.width,
          startHeight: rect.height,
          startColumns: Math.max(3, Math.min(12, Number(card.dataset.widgetColumns || columnsForWidth(rect.width)) || 6)),
          card,
        };
        card.classList.add("tv-widget-resizing");
        return;
      }
      if (dragHandle && !element?.closest("[data-tv-widget-menu]")) {
        event.preventDefault();
        dragState = { widgetId, card };
        card.classList.add("tv-widget-dragging");
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!resizeState) return;
      const nextHeight = Math.max(240, Math.min(1100, resizeState.startHeight + event.clientY - resizeState.startY));
      const nextColumns = columnsForWidth(resizeState.startWidth + event.clientX - resizeState.startX);
      resizeState.card.style.height = `${nextHeight}px`;
      resizeState.card.style.minHeight = `${nextHeight}px`;
      resizeState.card.style.gridColumn = `span ${nextColumns}`;
      resizeState.card.dataset.widgetColumns = String(nextColumns);
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (resizeState) {
        const { widgetId, card, startColumns } = resizeState;
        card.classList.remove("tv-widget-resizing");
        const height = card.getBoundingClientRect().height;
        const columns = Number(card.dataset.widgetColumns || startColumns) || startColumns;
        resizeState = null;
        void saveWidgetSize(widgetId, height, columns);
      }
      if (dragState) {
        const { widgetId, card } = dragState;
        card.classList.remove("tv-widget-dragging");
        dragState = null;
        void saveWidgetOrder(widgetId, targetIndexFromPoint(event.clientX, event.clientY));
      }
    };

    target.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      target.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [settings]);

  return (
    <article className="market-widget-panel react-dashboard-market-widget" data-current-market>
      <div className="market-widget-head">
        <div>
          <p className="section-kicker">Current Market</p>
          <h2 id="marketWidgetTitle">Current Market</h2>
        </div>
        <div className="market-widget-actions">
          <button id="editGlobalMarketsBtn" className="filter-btn" type="button" disabled={busyAction === "overview"} onClick={(event) => { event.stopPropagation(); void addWidget("overview"); }}>
            {busyAction === "overview" ? "추가 중" : "위젯 추가"}
          </button>
          <button id="addMarketChartBtn" className="filter-btn" type="button" disabled={busyAction === "chart"} onClick={(event) => { event.stopPropagation(); void addWidget("chart"); }}>
            {busyAction === "chart" ? "추가 중" : "빠른 차트 추가"}
          </button>
          <button id="resetMarketWidgetsBtn" className="filter-btn clear" type="button" disabled={busyAction === "reset"} onClick={(event) => { event.stopPropagation(); void resetWidgets(); }}>
            {busyAction === "reset" ? "복원 중" : "기본값"}
          </button>
        </div>
      </div>
      {error && <p className="react-dashboard-error">{error}</p>}
      {widgetMenu && (
        <div
          className="market-widget-context-menu is-open"
          style={{ left: widgetMenu.x, top: widgetMenu.y }}
          role="menu"
        >
          <button type="button" role="menuitem" onClick={() => void editWidget(widgetMenu.widgetId)}>수정</button>
          <button type="button" role="menuitem" data-market-widget-action="delete" onClick={() => void deleteWidget(widgetMenu.widgetId)}>삭제</button>
        </div>
      )}
      <div
        id="marketWidgetBoard"
        ref={boardRef}
        className="market-widget-board"
        data-fallback='<div class="tradingview-widget-unavailable">시장 위젯을 표시할 수 없습니다.</div>'
      />
    </article>
  );
}

export function Dashboard() {
  const [data, setData] = useState<LoadState>({ dashboard: null, review: null });
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboard, review] = await Promise.all([
        getJson<DashboardPayload>("/api/dashboard"),
        getJson<InvestmentReview>("/api/investment-review"),
      ]);
      setData({ dashboard, review });
      updateReactAgentContext({ surface: "dashboard", viewId: "dashboard", reportKind: "", reportId: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "대시보드를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function generateReview() {
    setGenerating(true);
    setError("");
    try {
      const response = await postJson<InvestmentReview | AgentJob>("/api/investment-review/generate", {
        forceRefresh: true,
      });
      let review: InvestmentReview;
      if (isAgentJob(response)) {
        const done = await pollAgentJob(response);
        const date = done.result?.date || done.result?.artifactId || "";
        review = date
          ? await getJson<InvestmentReview>(`/api/investment-review/${encodeURIComponent(date)}`)
          : await getJson<InvestmentReview>("/api/investment-review");
      } else {
        review = response;
      }
      const dashboard = await getJson<DashboardPayload>("/api/dashboard");
      setData({ dashboard, review });
      updateReactAgentContext({ surface: "dashboard", viewId: "dashboard", reportKind: "investment_review", reportId: review.date || "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "투자 리뷰를 갱신하지 못했습니다.");
    } finally {
      setGenerating(false);
    }
  }

  const stats = data.review?.stats || {};
  const statCards = useMemo(
    () => [
      { label: "Indexed", value: data.dashboard?.index?.count ?? 0, detail: `${data.dashboard?.index?.newsCount ?? 0} news` },
      { label: "브리핑", value: data.dashboard?.briefings?.length ?? 0, detail: "최근 저장본" },
      { label: "체크포인트", value: data.review?.keyCheckpoints?.length ?? 0, detail: data.review?.date || "" },
      { label: "포지션 영향", value: data.review?.portfolioImpacts?.length ?? 0, detail: `${statValue(stats, ["positive", "positiveImpacts"])} positive` },
    ],
    [data.dashboard?.briefings?.length, data.dashboard?.index?.count, data.dashboard?.index?.newsCount, data.review?.date, data.review?.keyCheckpoints?.length, data.review?.portfolioImpacts?.length, stats],
  );

  const checkpoints = (data.review?.keyCheckpoints || []).slice(0, 5);
  const impacts = (data.review?.portfolioImpacts || []).slice(0, 5);
  const reports = (data.review?.recentReports || data.dashboard?.briefings || []).slice(0, 5);

  return (
    <div className="react-dashboard" data-react-dashboard>
      <RouteHero
        eyebrow="Investment Review"
        title="대시보드"
        description="시장 상태와 투자 체크포인트를 한 화면에서 점검합니다."
        actions={(
          <button type="button" onClick={load} disabled={loading}>
            {loading ? "불러오는 중" : "새로고침"}
          </button>
        )}
      />

      {error && <p className="react-dashboard-error">{error}</p>}
      {data.review?.stale && <p className="react-dashboard-warning">저장된 최신 투자 리뷰를 표시 중입니다.</p>}

      <section className="react-dashboard-stats" aria-label="Dashboard summary">
        {statCards.map((card) => (
          <article key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <small>{card.detail}</small>
          </article>
        ))}
      </section>

      <section className="react-dashboard-grid">
        <CurrentMarketWidgetBoard />

        <article className="react-dashboard-panel wide">
          <div className="react-dashboard-panel-head">
            <p className="section-kicker">Investment Review</p>
            <span>{data.review?.generatedAt || "not generated"}</span>
          </div>
          <h2>투자 리뷰 요약</h2>
          <p>{data.review?.summary || "아직 표시할 투자 리뷰 요약이 없습니다."}</p>
          <div className="react-dashboard-actions">
            <button type="button" onClick={generateReview} disabled={generating}>
              {generating ? "리뷰 생성 중" : "투자 리뷰 갱신"}
            </button>
          </div>
        </article>

        <article className="react-dashboard-panel">
          <div className="react-dashboard-panel-head">
            <p className="section-kicker">Reports</p>
            <span>{reports.length}</span>
          </div>
          <h2>최근 보고서</h2>
          <ul>
            {reports.length ? reports.map((report, index) => (
              <li key={`${report.title || "report"}-${index}`}>
                <strong>{report.title || "제목 없음"}</strong>
                <span>{report.type || report.date || ""}</span>
              </li>
            )) : <li>최근 보고서가 없습니다.</li>}
          </ul>
        </article>

        <article className="react-dashboard-panel">
          <div className="react-dashboard-panel-head">
            <p className="section-kicker">Checkpoints</p>
            <span>{checkpoints.length}</span>
          </div>
          <h2>이번 주 체크포인트</h2>
          <ul>
            {checkpoints.length ? checkpoints.map((checkpoint, index) => (
              <li key={index}>{typeof checkpoint === "string" ? checkpoint : checkpoint.checkpoint || "체크포인트"}</li>
            )) : <li>체크포인트가 없습니다.</li>}
          </ul>
        </article>

        <article className="react-dashboard-panel">
          <div className="react-dashboard-panel-head">
            <p className="section-kicker">Portfolio</p>
            <span>{impacts.length}</span>
          </div>
          <h2>포트폴리오 영향</h2>
          <ul>
            {impacts.length ? impacts.map((impact, index) => (
              <li key={`${itemLabel(impact)}-${index}`}>
                <strong>{itemLabel(impact)}</strong>
                <span>{IMPACT_LABELS[impact.impact || ""] || impact.impact || "중립"}</span>
              </li>
            )) : <li>포트폴리오 영향 항목이 없습니다.</li>}
          </ul>
        </article>

        <article className="react-dashboard-panel wide">
          <MarketStateDashboard />
        </article>
      </section>
    </div>
  );
}
