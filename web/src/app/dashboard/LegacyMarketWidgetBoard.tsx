import { useCallback, useEffect, useRef, useState } from "react";
import { getJson, postJson } from "../../api";
import { useThemePreference } from "../themePreference";

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

export default function LegacyMarketWidgetBoard() {
  const { resolved: resolvedTheme } = useThemePreference();
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
  }, [resolvedTheme, settings]);

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
          <button id="editGlobalMarketsBtn" className="btn" type="button" disabled={busyAction === "overview"} onClick={(event) => { event.stopPropagation(); void addWidget("overview"); }}>
            {busyAction === "overview" ? "추가 중" : "위젯 추가"}
          </button>
          <button id="addMarketChartBtn" className="btn" type="button" disabled={busyAction === "chart"} onClick={(event) => { event.stopPropagation(); void addWidget("chart"); }}>
            {busyAction === "chart" ? "추가 중" : "빠른 차트 추가"}
          </button>
          <button id="resetMarketWidgetsBtn" className="btn" type="button" disabled={busyAction === "reset"} onClick={(event) => { event.stopPropagation(); void resetWidgets(); }}>
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
