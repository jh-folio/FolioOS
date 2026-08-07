import { useEffect, useRef, useState } from "react";
import { getJson, postJson } from "../../api";
import { KIND_KO, STATUS_KO, timeLabelKST } from "./MarketCalendar";

type Point = { time: string; open?: number | null; high?: number | null; low?: number | null; close: number };
type ChartPayload = { symbol: string; range: string; interval: string; series: Point[]; freshness?: string; asOf?: string; notice?: string; fallbackReason?: string };
type CalendarEvent = { id: string; kind: string; title: string; startsAt: string; status: string; allDay?: boolean; tickers?: string[] };
type SeriesApi = { setData: (rows: unknown[]) => void };
type ChartApi = {
  addSeries: (definition: unknown, options?: object) => SeriesApi;
  timeScale: () => { fitContent: () => void };
  subscribeCrosshairMove: (handler: (param: CrosshairParam) => void) => void;
  remove: () => void;
};
type CrosshairParam = { point?: { x: number; y: number }; seriesData?: Map<SeriesApi, { time?: unknown; close?: number; value?: number }> };
type LightweightApi = {
  createChart: (target: HTMLElement, options: object) => ChartApi;
  CandlestickSeries: unknown;
  LineSeries: unknown;
  AreaSeries: unknown;
  LineStyle?: { Dotted?: number };
  CrosshairMode?: { Normal?: number };
};

declare global { interface Window { LightweightCharts?: LightweightApi } }

const FRESHNESS_KO: Record<string, string> = {
  snapshot: "스냅샷", current: "최신", fresh: "최신", cached: "최근 조회", delayed: "지연", stale: "오래됨", unavailable: "불러올 수 없음",
};
// 1D는 장중(5분봉), 나머지는 일봉이다.
const RANGES = ["1d", "1m", "3m", "1y", "5y"];
const RANGE_LABELS: Record<string, string> = { "1d": "1D", "1m": "1M", "3m": "3M", "1y": "1Y", "5y": "5Y" };
const intervalFor = (value: string) => (value === "1d" ? "5m" : "1d");

const INDEX_SYMBOLS: Array<{ symbol: string; label: string }> = [
  { symbol: "^GSPC", label: "S&P 500" },
  { symbol: "^IXIC", label: "NASDAQ" },
  { symbol: "^DJI", label: "DOW" },
  { symbol: "^KS11", label: "KOSPI" },
  { symbol: "^KQ11", label: "KOSDAQ" },
  { symbol: "KRW=X", label: "USD/KRW" },
];

function isIndexLike(symbol: string): boolean {
  return symbol.startsWith("^") || symbol.includes("=");
}

function nextEventLabel(event: CalendarEvent): string {
  const date = new Date(event.startsAt);
  const day = Number.isNaN(date.getTime())
    ? event.startsAt.slice(0, 10)
    : date.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", weekday: "short" });
  const kind = KIND_KO[event.kind] || event.kind;
  const tag = event.kind === "earnings" ? timeLabelKST(event) : "";
  return `${day} ${kind} 예정${tag && tag !== "종일" ? ` · ${tag}` : ""}`;
}

export function NativeMarketChart({ symbols }: { symbols: Array<{ symbol: string; label?: string; source?: string }> }) {
  const watchSymbols = symbols.filter((row) => row.source !== "fallback" && !INDEX_SYMBOLS.some((index) => index.symbol === row.symbol));
  const [draftSymbol, setDraftSymbol] = useState("");
  const [watchError, setWatchError] = useState("");
  const [symbol, setSymbol] = useState(INDEX_SYMBOLS[0].symbol);
  const [range, setRange] = useState("3m");
  const [style, setStyle] = useState<"candle" | "line">("line");
  const [payload, setPayload] = useState<ChartPayload | null>(null);
  const [nextEvent, setNextEvent] = useState<CalendarEvent | null>(null);
  const [error, setError] = useState("");
  const targetRef = useRef<HTMLDivElement | null>(null);
  const settingsRef = useRef(false);

  // 관심 종목 목록의 주인은 워치리스트다. 차트에서 편집해도 저장소는 한 곳이라
  // 같은 목록을 두 곳에서 따로 관리하는 일이 생기지 않는다.
  async function saveWatchlist(next: string[]) {
    await postJson("/api/watchlist", { items: next });
    document.dispatchEvent(new CustomEvent("folio:generation-complete"));
  }

  async function addWatchSymbol() {
    const value = draftSymbol.trim().toUpperCase();
    if (!value) return;
    setWatchError("");
    try {
      const current = await getJson<string[]>("/api/watchlist");
      if (current.some((item) => item.toUpperCase() === value)) {
        setWatchError("이미 관심 종목에 있습니다.");
        return;
      }
      await saveWatchlist([...current, value]);
      setDraftSymbol("");
    } catch (reason) {
      setWatchError(reason instanceof Error ? reason.message : "추가하지 못했습니다.");
    }
  }

  async function removeWatchSymbol(target: string) {
    setWatchError("");
    try {
      const current = await getJson<string[]>("/api/watchlist");
      const row = symbols.find((item) => item.symbol === target);
      const label = (row?.label || "").toLowerCase();
      const next = current.filter((item) => {
        const token = item.trim().toLowerCase();
        return token !== target.toLowerCase() && (!label || token !== label);
      });
      if (next.length === current.length) {
        setWatchError("워치리스트에서 해당 항목을 찾지 못했습니다.");
        return;
      }
      await saveWatchlist(next);
    } catch (reason) {
      setWatchError(reason instanceof Error ? reason.message : "제거하지 못했습니다.");
    }
  }

  useEffect(() => {
    if (settingsRef.current) return;
    settingsRef.current = true;
    getJson<{ chartSymbol?: string; chartRange?: string; chartStyle?: string }>("/api/dashboard/settings")
      .then((row) => {
        if (row.chartRange && RANGES.includes(row.chartRange)) setRange(row.chartRange);
        if (row.chartSymbol) setSymbol(row.chartSymbol);
        if (row.chartStyle === "line" || row.chartStyle === "candle") setStyle(row.chartStyle);
      })
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    const known = INDEX_SYMBOLS.some((row) => row.symbol === symbol) || watchSymbols.some((row) => row.symbol === symbol);
    if (!known) setSymbol(INDEX_SYMBOLS[0].symbol);
  }, [watchSymbols, symbol]);

  function pickSymbol(value: string) {
    setSymbol(value);
    postJson("/api/dashboard/settings", { chartSymbol: value }).catch(() => undefined);
  }
  function pickRange(value: string) {
    setRange(value);
    postJson("/api/dashboard/settings", { chartRange: value }).catch(() => undefined);
  }
  function pickStyle(value: "candle" | "line") {
    setStyle(value);
    postJson("/api/dashboard/settings", { chartStyle: value }).catch(() => undefined);
  }

  useEffect(() => {
    let alive = true;
    setError("");
    getJson<ChartPayload>(`/api/market/chart?symbol=${encodeURIComponent(symbol)}&range=${range}&interval=${intervalFor(range)}`)
      .then((row) => { if (alive) setPayload(row); })
      .catch((err) => { if (alive) setError(err instanceof Error ? err.message : "차트를 불러오지 못했습니다."); });
    return () => { alive = false; };
  }, [symbol, range]);

  useEffect(() => {
    let alive = true;
    setNextEvent(null);
    if (!symbol || isIndexLike(symbol)) return undefined;
    const start = new Date();
    const end = new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000);
    getJson<{ events?: CalendarEvent[] }>(
      `/api/market-calendar?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}&ticker=${encodeURIComponent(symbol)}&limit=20`,
    )
      .then((row) => {
        if (!alive) return;
        const upcoming = (row.events || [])
          .filter((event) => ["earnings", "dividend", "filing"].includes(event.kind))
          .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
        setNextEvent(upcoming[0] || null);
      })
      .catch(() => undefined);
    return () => { alive = false; };
  }, [symbol]);

  const [themeKey, setThemeKey] = useState(0);
  useEffect(() => {
    const observer = new MutationObserver(() => setThemeKey((value) => value + 1));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const target = targetRef.current;
    const library = window.LightweightCharts;
    if (!target || !library || !payload?.series?.length) return undefined;
    target.innerHTML = "";
    // 브리핑 본문 차트(public/briefing-visuals.js)와 같은 형식으로 맞춘다.
    const tokens = getComputedStyle(document.documentElement);
    const token = (name: string, fallback: string) => tokens.getPropertyValue(name).trim() || fallback;
    const upColor = token("--folio-green", "#3b6d11");
    const downColor = token("--folio-burgundy", "#8a1024");
    const rows = payload.series;
    const positive = rows.length > 1 ? rows[rows.length - 1].close >= rows[0].close : true;
    const lineColor = positive ? upColor : downColor;
    const chart = library.createChart(target, {
      autoSize: true,
      height: 360,
      width: target.clientWidth || 0,
      layout: { background: { type: "solid", color: token("--folio-surface-clean", "#ffffff") }, textColor: token("--folio-ink-muted", "#44505f"), attributionLogo: true },
      grid: { vertLines: { visible: false }, horzLines: { color: token("--folio-border", "#dde2e9"), style: library.LineStyle?.Dotted ?? 1 } },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.12, bottom: 0.08 } },
      timeScale: { borderVisible: false, rightOffset: 1, barSpacing: 8, minBarSpacing: 2, timeVisible: false, secondsVisible: false },
      localization: { locale: "ko-KR", dateFormat: "yyyy-MM-dd" },
      crosshair: { mode: library.CrosshairMode?.Normal ?? 0 },
      handleScroll: { mouseWheel: false, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { axisPressedMouseMove: false, mouseWheel: false, pinch: true },
    });
    const ohlcRows = rows.filter((row) => row.open != null && row.high != null && row.low != null);
    const useCandle = style === "candle" && ohlcRows.length > 0;
    const series = useCandle
      ? chart.addSeries(library.CandlestickSeries, { upColor, downColor, wickUpColor: upColor, wickDownColor: downColor, borderVisible: false })
      : chart.addSeries(library.AreaSeries, { lineColor, topColor: `${lineColor}38`, bottomColor: `${lineColor}05`, lineWidth: 3, priceLineVisible: false, lastValueVisible: true });
    series.setData(useCandle
      ? ohlcRows.map((row) => ({ time: row.time, open: row.open, high: row.high, low: row.low, close: row.close }))
      : rows.map((row) => ({ time: row.time, value: row.close })));

    const closeByTime = new Map(rows.map((row, index) => [String(row.time), { close: row.close, previous: index > 0 ? rows[index - 1].close : null }]));
    const tooltip = document.createElement("div");
    tooltip.className = "market-chart-tooltip";
    tooltip.hidden = true;
    target.appendChild(tooltip);
    chart.subscribeCrosshairMove((param) => {
      const point = param?.point;
      const seriesPoint = param?.seriesData?.get(series);
      const stage = target.getBoundingClientRect();
      if (!point || !seriesPoint || point.x < 0 || point.y < 0 || point.x > stage.width || point.y > stage.height) {
        tooltip.hidden = true;
        return;
      }
      const key = String(seriesPoint.time);
      const source = closeByTime.get(key);
      const close = source?.close ?? seriesPoint.close ?? seriesPoint.value ?? null;
      const previous = source?.previous ?? null;
      const change = close != null && previous != null ? close - previous : null;
      const changePctValue = change != null && previous ? (change / previous) * 100 : null;
      const direction = change == null || change >= 0 ? "up" : "down";
      const priceText = close == null ? "가격 없음" : close.toLocaleString(undefined, { maximumFractionDigits: 2 });
      const changeText = change == null || changePctValue == null
        ? "전일 대비 없음"
        : `${change >= 0 ? "+" : ""}${change.toLocaleString(undefined, { maximumFractionDigits: 2 })} (${changePctValue >= 0 ? "+" : ""}${changePctValue.toFixed(2)}%)`;
      tooltip.innerHTML = "";
      const dateNode = document.createElement("div");
      dateNode.className = "market-chart-tooltip__date";
      dateNode.textContent = key;
      const priceNode = document.createElement("div");
      priceNode.className = "market-chart-tooltip__price";
      priceNode.textContent = priceText;
      const changeNode = document.createElement("div");
      changeNode.className = "market-chart-tooltip__change";
      changeNode.dataset.direction = direction;
      changeNode.textContent = changeText;
      tooltip.append(dateNode, priceNode, changeNode);
      const width = tooltip.offsetWidth || 150;
      const height = tooltip.offsetHeight || 76;
      const left = Math.min(Math.max(8, point.x + 14), Math.max(8, stage.width - width - 8));
      const top = Math.min(Math.max(8, point.y - height - 12), Math.max(8, stage.height - height - 8));
      tooltip.style.transform = `translate(${left}px, ${top}px)`;
      tooltip.hidden = false;
    });
    chart.timeScale().fitContent();
    return () => chart.remove();
  }, [payload, themeKey, style]);

  const series = payload?.series || [];
  const lastClose = series.length ? series[series.length - 1].close : null;
  const prevClose = series.length > 1 ? series[series.length - 2].close : null;
  const changePct = lastClose != null && prevClose ? ((lastClose - prevClose) / prevClose) * 100 : null;
  const freshnessLabel = FRESHNESS_KO[payload?.freshness || ""] || (payload ? payload.freshness : "불러오는 중");

  return (
    <section className="cockpit-panel cockpit-chart" aria-labelledby="native-chart-title">
      <div className="cockpit-panel__head">
        <div><span>MARKET CHART</span><h2 id="native-chart-title">시장 차트</h2></div>
        {/* 종목 선택은 제목 줄 우측. 지수 6개 + 관심 종목을 칩으로 늘어놓으면 제목
            줄이 넘치므로 접이식 둘로 묶는다. */}
        <div className="chart-pickers">
          <details className="chart-picker">
            <summary>지수</summary>
            <div className="chart-picker__list">
              {INDEX_SYMBOLS.map((row) => (
                <button type="button" key={row.symbol}
                  className={`sym-chip${row.symbol === symbol ? " sym-chip--active" : ""}`}
                  aria-pressed={row.symbol === symbol} onClick={() => pickSymbol(row.symbol)}>{row.label}</button>
              ))}
            </div>
          </details>
          <details className="chart-picker">
            <summary>관심 종목{watchSymbols.length ? ` ${watchSymbols.length}` : ""}</summary>
            <div className="chart-picker__list">
              {watchSymbols.map((row) => (
                <span className="chart-picker__row" key={row.symbol}>
                  <button type="button" title={row.label || row.symbol}
                    className={`sym-chip${row.symbol === symbol ? " sym-chip--active" : ""}`}
                    aria-pressed={row.symbol === symbol} onClick={() => pickSymbol(row.symbol)}>{row.symbol}</button>
                  <button type="button" className="btn btn--icon chart-picker__remove"
                    aria-label={`${row.label || row.symbol} 관심 종목에서 제거`}
                    onClick={() => void removeWatchSymbol(row.symbol)}>×</button>
                </span>
              ))}
              {/* 워치리스트가 관리 주체다. 여기서 더하면 워치리스트에 반영돼
                  같은 목록을 두 곳에서 따로 관리하는 일이 생기지 않는다. */}
              <form className="chart-picker__add" onSubmit={(event) => { event.preventDefault(); void addWatchSymbol(); }}>
                <input value={draftSymbol} onChange={(event) => setDraftSymbol(event.currentTarget.value)}
                  placeholder="티커 추가" aria-label="관심 종목 추가" />
                <button className="btn btn--sm" type="submit" disabled={!draftSymbol.trim()}>추가</button>
              </form>
              {watchError && <p className="chart-picker__error">{watchError}</p>}
            </div>
          </details>
        </div>
      </div>
      {/* 종목명·가격·등락률이 이 패널에서 가장 강조되어야 할 값이다. 예전에는
          한 줄에 같은 크기로 놓여 위계가 없었다. 차트 컨트롤은 그 오른쪽으로. */}
      <div className="chart-headline">
        <div className="chart-quote">
          <span className="chart-quote__name">{INDEX_SYMBOLS.find((row) => row.symbol === symbol)?.label || symbol}</span>
          <div className="chart-quote__value">
            {lastClose != null ? <b>{lastClose.toLocaleString(undefined, { maximumFractionDigits: 2 })}</b> : null}
            {changePct != null ? (
              <span className={changePct > 0 ? "up" : changePct < 0 ? "down" : "flat"}>
                {changePct > 0 ? "▲" : changePct < 0 ? "▼" : "—"} {changePct > 0 ? "+" : ""}{changePct.toFixed(1)}%
              </span>
            ) : null}
          </div>
          <small>{freshnessLabel}{payload?.asOf ? ` · ${payload.asOf} 기준` : ""}</small>
        </div>
        <div className="cockpit-chart-controls">
          <div className="segment" role="group" aria-label="차트 유형">
            <button type="button" aria-pressed={style === "line"} onClick={() => pickStyle("line")}>라인</button>
            <button type="button" aria-pressed={style === "candle"} onClick={() => pickStyle("candle")}>캔들</button>
          </div>
          <div className="segment" role="group" aria-label="차트 기간">{RANGES.map((value) => <button type="button" aria-pressed={range === value} onClick={() => pickRange(value)} key={value}>{RANGE_LABELS[value] || value}</button>)}</div>
        </div>
      </div>
      {error && <p className="react-dashboard-error">{error}</p>}
      <div className="cockpit-chart-stage" ref={targetRef}>{!window.LightweightCharts && <p>차트 라이브러리를 사용할 수 없습니다.</p>}</div>
      {nextEvent && (
        <p className="chart-next">
          <span className={`chip certainty-badge--${nextEvent.status}`}>{STATUS_KO[nextEvent.status] || nextEvent.status}</span>
          다음 일정 — <b>{nextEventLabel(nextEvent)}</b>
          <small>시장 캘린더 연동</small>
        </p>
      )}
      {payload?.notice ? <div className="cockpit-chart-foot"><small>{payload.notice}</small></div> : null}
    </section>
  );
}
