import { useState } from "react";

type AnalysisChartsPayload = {
  available?: boolean;
  reason?: string;
  charts?: unknown[];
};

type AnalysisChart = {
  id?: string;
  kind?: string;
  title?: string;
  subtitle?: string;
  years?: string[];
  labels?: string[];
  scenarios?: Array<Record<string, unknown>>;
  series?: Record<string, number[]>;
  currentPrice?: number;
  currency?: string;
  [key: string]: unknown;
};

type Series = {
  key: string;
  label: string;
  values: Array<number | null>;
  kind?: "money" | "percent" | "plain";
};

type ChartTooltip = {
  label: string;
  value: string;
  series?: string;
  x?: number;
  y?: number;
} | null;

const COLORS = ["#0f172a", "#2f6f9f", "#3d8f64", "#c99a33", "#9a5b72"];

const SERIES_LABELS: Record<string, string> = {
  revenue: "Revenue",
  grossProfit: "Gross Profit",
  operatingIncome: "Operating Income",
  netIncome: "Net Income",
  operatingCashFlow: "Operating CF",
  capitalExpenditure: "Capex",
  freeCashFlow: "Free CF",
  grossMargin: "Gross Margin",
  operatingMargin: "Operating Margin",
  netMargin: "Net Margin",
  fcfMargin: "FCF Margin",
};

function toNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function arrayValues(value: unknown): Array<number | null> {
  return Array.isArray(value) ? value.map(toNumber) : [];
}

function currencySymbol(currency?: string) {
  const normalized = String(currency || "USD").toUpperCase();
  if (normalized === "KRW" || normalized === "KRX") return "₩";
  if (normalized === "JPY") return "¥";
  if (normalized === "EUR") return "€";
  if (normalized === "GBP") return "£";
  return "$";
}

function formatValue(value: number | null, kind: Series["kind"] = "plain", currency?: string) {
  if (value === null) return "-";
  if (kind === "percent") return `${(value * 100).toFixed(1)}%`;
  if (kind === "money") {
    const symbol = currencySymbol(currency);
    const abs = Math.abs(value);
    if (abs >= 1_000_000_000_000) return `${symbol}${(value / 1_000_000_000_000).toFixed(1)}T`;
    if (abs >= 1_000_000_000) return `${symbol}${(value / 1_000_000_000).toFixed(1)}B`;
    if (abs >= 1_000_000) return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
    return `${symbol}${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }
  return value.toFixed(Math.abs(value) >= 100 ? 0 : 1);
}

function chartSeries(chart: AnalysisChart): Series[] {
  const keysByKind: Record<string, Array<[string, Series["kind"]]>> = {
    performance: [["revenue", "money"], ["operatingIncome", "money"], ["netIncome", "money"]],
    cashflow: [["operatingCashFlow", "money"], ["freeCashFlow", "money"], ["capitalExpenditure", "money"]],
    margins: [["grossMargin", "percent"], ["operatingMargin", "percent"], ["netMargin", "percent"]],
  };
  const keys = keysByKind[String(chart.kind || chart.id || "")] || [];
  return keys
    .map(([key, kind]) => ({
      key,
      label: SERIES_LABELS[key] || key,
      values: arrayValues(chart[key]),
      kind,
    }))
    .filter((series) => series.values.some((value) => value !== null));
}

function valueRange(values: Array<number | null>) {
  const valid = values.filter((value): value is number => value !== null);
  if (!valid.length) return { min: 0, max: 1 };
  const min = Math.min(0, ...valid);
  const max = Math.max(0, ...valid);
  if (min === max) return { min: min - 1, max: max + 1 };
  return { min, max };
}

function yFor(value: number, min: number, max: number, top = 16, height = 150) {
  return top + (1 - (value - min) / (max - min)) * height;
}

function BarsChart({
  chart,
  series,
  onPoint,
  onLeave,
}: {
  chart: AnalysisChart;
  series: Series[];
  onPoint: (tooltip: NonNullable<ChartTooltip>) => void;
  onLeave: () => void;
}) {
  const labels = Array.isArray(chart.years) ? chart.years : [];
  const allValues = series.flatMap((item) => item.values);
  const { min, max } = valueRange(allValues);
  const width = 520;
  const height = 220;
  const top = 18;
  const plotHeight = 148;
  const left = 36;
  const groupWidth = (width - left - 20) / Math.max(1, labels.length);
  const barWidth = Math.max(5, Math.min(18, (groupWidth - 10) / Math.max(1, series.length)));
  const zeroY = yFor(0, min, max, top, plotHeight);

  return (
    <svg className="analysis-chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={chart.title || "기업 분석 차트"}>
      <line x1={left} y1={zeroY} x2={width - 12} y2={zeroY} stroke="#d8dee8" strokeWidth="1" />
      {labels.map((label, labelIndex) => (
        <g key={label}>
          {series.map((item, seriesIndex) => {
            const value = item.values[labelIndex];
            if (value === null) return null;
            const y = yFor(value, min, max, top, plotHeight);
            const barHeight = Math.max(2, Math.abs(zeroY - y));
            const x = left + labelIndex * groupWidth + 8 + seriesIndex * barWidth;
            const tooltip = {
              label,
              series: item.label,
              value: formatValue(value, item.kind, chart.currency),
              x: x + barWidth / 2,
              y: Math.min(y, zeroY),
            };
            return (
              <rect
                aria-label={`${label} ${item.label} ${tooltip.value}`}
                key={`${item.key}-${label}`}
                onBlur={onLeave}
                onFocus={() => onPoint(tooltip)}
                onMouseEnter={() => onPoint(tooltip)}
                onMouseLeave={onLeave}
                tabIndex={0}
                x={x}
                y={Math.min(y, zeroY)}
                width={barWidth - 2}
                height={barHeight}
                rx="2"
                fill={COLORS[seriesIndex % COLORS.length]}
              />
            );
          })}
          <text x={left + labelIndex * groupWidth + groupWidth / 2} y={height - 18} textAnchor="middle">{label}</text>
        </g>
      ))}
      <text x={left} y={14}>{formatValue(max, series[0]?.kind, chart.currency)}</text>
      <text x={left} y={height - 40}>{formatValue(min, series[0]?.kind, chart.currency)}</text>
    </svg>
  );
}

function LineChart({
  chart,
  series,
  onPoint,
  onLeave,
}: {
  chart: AnalysisChart;
  series: Series[];
  onPoint: (tooltip: NonNullable<ChartTooltip>) => void;
  onLeave: () => void;
}) {
  const labels = Array.isArray(chart.years) ? chart.years : [];
  const allValues = series.flatMap((item) => item.values);
  const { min, max } = valueRange(allValues);
  const width = 520;
  const height = 220;
  const top = 18;
  const plotHeight = 148;
  const left = 36;
  const step = (width - left - 32) / Math.max(1, labels.length - 1);

  return (
    <svg className="analysis-chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={chart.title || "기업 분석 차트"}>
      {[0, 0.5, 1].map((tick) => {
        const y = top + tick * plotHeight;
        return <line key={tick} x1={left} y1={y} x2={width - 12} y2={y} stroke="#eef2f7" strokeWidth="1" />;
      })}
      {series.map((item, seriesIndex) => {
        const points = item.values.map((value, index) => (
          value === null ? null : `${left + index * step},${yFor(value, min, max, top, plotHeight)}`
        )).filter(Boolean).join(" ");
        return (
          <g key={item.key}>
            <polyline
              points={points}
              fill="none"
              stroke={COLORS[seriesIndex % COLORS.length]}
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {item.values.map((value, index) => {
              if (value === null) return null;
              const x = left + index * step;
              const y = yFor(value, min, max, top, plotHeight);
              const label = labels[index] || `${index + 1}`;
              const tooltip = {
                label,
                series: item.label,
                value: formatValue(value, item.kind, chart.currency),
                x,
                y,
              };
              return (
                <circle
                  aria-label={`${label} ${item.label} ${tooltip.value}`}
                  cx={x}
                  cy={y}
                  fill={COLORS[seriesIndex % COLORS.length]}
                  key={`${item.key}-${label}`}
                  onBlur={onLeave}
                  onFocus={() => onPoint(tooltip)}
                  onMouseEnter={() => onPoint(tooltip)}
                  onMouseLeave={onLeave}
                  r="5"
                  tabIndex={0}
                />
              );
            })}
          </g>
        );
      })}
      {labels.map((label, index) => (
        <text key={label} x={left + index * step} y={height - 18} textAnchor="middle">{label}</text>
      ))}
      <text x={left} y={14}>{formatValue(max, series[0]?.kind || "percent", chart.currency)}</text>
      <text x={left} y={height - 40}>{formatValue(min, series[0]?.kind || "percent", chart.currency)}</text>
    </svg>
  );
}

function ScenarioChart({
  chart,
  onPoint,
  onLeave,
}: {
  chart: AnalysisChart;
  onPoint: (tooltip: NonNullable<ChartTooltip>) => void;
  onLeave: () => void;
}) {
  const rows = Array.isArray(chart.scenarios) ? chart.scenarios : [];
  const values = rows.map((row) => toNumber(row.perShare ?? row.price));
  const { max } = valueRange(values);
  const current = toNumber(chart.currentPrice);

  return (
    <div className="analysis-scenario-bars">
      {rows.map((row, index) => {
        const value = toNumber(row.perShare ?? row.price);
        const width = value === null || max <= 0 ? 0 : Math.max(4, Math.min(100, (value / max) * 100));
        const label = String(row.name || row.label || `Scenario ${index + 1}`);
        const formatted = formatValue(value, "money", chart.currency);
        return (
          <div
            aria-label={`${label} ${formatted}`}
            className="analysis-scenario-row"
            key={label}
            onBlur={onLeave}
            onFocus={() => onPoint({ label, value: formatted })}
            onMouseEnter={() => onPoint({ label, value: formatted })}
            onMouseLeave={onLeave}
            tabIndex={0}
          >
            <span>{label}</span>
            <div><i style={{ width: `${width}%`, background: COLORS[index % COLORS.length] }} /></div>
            <strong>{formatted}</strong>
          </div>
        );
      })}
      {current !== null && <p className="analysis-chart-note">현재가: {formatValue(current, "money", chart.currency)}</p>}
    </div>
  );
}

function ReturnChart({
  chart,
  onPoint,
  onLeave,
}: {
  chart: AnalysisChart;
  onPoint: (tooltip: NonNullable<ChartTooltip>) => void;
  onLeave: () => void;
}) {
  const labels = Array.isArray(chart.labels) ? chart.labels : [];
  const series = Object.entries(chart.series || {}).map(([key, values]) => ({
    key,
    label: key,
    values: Array.isArray(values) ? values.map((value) => (typeof value === "number" ? value / 100 : null)) : [],
    kind: "percent" as const,
  }));
  return <LineChart chart={{ ...chart, years: labels }} series={series} onPoint={onPoint} onLeave={onLeave} />;
}

function legend(series: Series[]) {
  return (
    <div className="analysis-chart-legend">
      {series.map((item, index) => (
        <span key={item.key}>
          <i style={{ background: COLORS[index % COLORS.length] }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function ChartCard({ chart }: { chart: AnalysisChart }) {
  const [tooltip, setTooltip] = useState<ChartTooltip>(null);
  const series = chartSeries(chart);
  const kind = String(chart.kind || chart.id || "");
  const tooltipStyle = tooltip?.x !== undefined
    ? { left: `${Math.max(7, Math.min(93, (tooltip.x / 520) * 100))}%`, top: `${Math.max(10, tooltip.y || 10)}px` }
    : undefined;

  return (
    <article className="analysis-chart-card">
      <div className="analysis-chart-title">
        <h4>{chart.title || "Analysis Chart"}</h4>
        {chart.subtitle && <p>{chart.subtitle}</p>}
      </div>
      <div className="analysis-chart-plot">
        {kind === "margins" && series.length ? <LineChart chart={chart} series={series} onPoint={setTooltip} onLeave={() => setTooltip(null)} /> : null}
        {(kind === "performance" || kind === "cashflow") && series.length ? <BarsChart chart={chart} series={series} onPoint={setTooltip} onLeave={() => setTooltip(null)} /> : null}
        {(kind === "dcf" || kind === "scenario_price") ? <ScenarioChart chart={chart} onPoint={setTooltip} onLeave={() => setTooltip(null)} /> : null}
        {kind === "price_return" ? <ReturnChart chart={chart} onPoint={setTooltip} onLeave={() => setTooltip(null)} /> : null}
        {!series.length && !["dcf", "scenario_price", "price_return"].includes(kind) && (
          <p className="analysis-chart-warning">이 차트에 표시할 수치가 충분하지 않습니다.</p>
        )}
        {tooltip && (
          <div className="analysis-chart-tooltip" style={tooltipStyle}>
            {tooltip.series && <span>{tooltip.series}</span>}
            <strong>{tooltip.value}</strong>
            <em>{tooltip.label}</em>
          </div>
        )}
      </div>
      {series.length > 0 && legend(series)}
    </article>
  );
}

export function AnalysisCharts({
  payload,
  chartIds,
  heading = "기업 분석 시각화",
  intro = "저장된 공식 재무 데이터와 시장 데이터를 기반으로 생성된 참고 차트입니다.",
  compact = false,
}: {
  payload?: AnalysisChartsPayload;
  chartIds?: string[];
  heading?: string;
  intro?: string;
  compact?: boolean;
}) {
  const allowed = chartIds ? new Set(chartIds) : null;
  const charts = ((Array.isArray(payload?.charts) ? payload.charts : []) as AnalysisChart[])
    .filter((chart) => !allowed || allowed.has(String(chart.id || chart.kind || "")));
  if (!payload?.available || !charts.length) return null;
  return (
    <section className={`analysis-charts-panel analysis-charts-inline${compact ? " compact" : ""}`} aria-label={heading}>
      <div className="analysis-chart-head">
        <div>
          <p className="section-kicker">Company Visuals</p>
          <h3>{heading}</h3>
          <p>{intro}</p>
        </div>
      </div>
      <div className="analysis-chart-grid">
        {charts.map((chart, index) => (
          <ChartCard chart={chart} key={chart.id || `${chart.title || "chart"}-${index}`} />
        ))}
      </div>
    </section>
  );
}
