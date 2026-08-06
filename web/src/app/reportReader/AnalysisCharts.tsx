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

const COLORS = [
  "var(--folio-chart-1)",
  "var(--folio-chart-2)",
  "var(--folio-chart-3)",
  "var(--folio-chart-4)",
  "var(--folio-chart-5)",
];

const SERIES_LABELS: Record<string, string> = {
  revenue: "매출",
  grossProfit: "매출총이익",
  operatingIncome: "영업이익",
  netIncome: "순이익",
  operatingCashFlow: "영업활동 현금흐름",
  capitalExpenditure: "설비투자",
  freeCashFlow: "잉여현금흐름",
  grossMargin: "매출총이익률",
  operatingMargin: "영업이익률",
  netMargin: "순이익률",
  fcfMargin: "잉여현금흐름률",
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
    // 마진은 금액과 단위가 달라 오른쪽 축으로 뺀다. 같은 축에 얹으면 그려지지 않는다.
    performance: [["revenue", "money"], ["operatingIncome", "money"], ["netIncome", "money"], ["netMargin", "percent"]],
    quarterly: [["revenue", "money"], ["operatingIncome", "money"], ["netIncome", "money"], ["netMargin", "percent"]],
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

/** 그림이 카드를 채우도록 넉넉히 잡는다. 예전 geometry는 플롯이 148px이라
 *  카드의 4분의 1만 쓰고 막대가 손톱만 했다. */
const BARS = { width: 640, height: 300, top: 18, plot: 210, left: 58, right: 46 };

function niceTicks(min: number, max: number, count = 4): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return [min, max];
  const step = (max - min) / count;
  return Array.from({ length: count + 1 }, (_, i) => min + step * i);
}

function BarsChart({
  chart,
  series,
  activeIndex,
  onIndex,
}: {
  chart: AnalysisChart;
  series: Series[];
  activeIndex: number;
  onIndex: (index: number) => void;
}) {
  const labels = Array.isArray(chart.years) ? chart.years : [];
  // 금액과 비율은 축을 나눈다. 한 축에 얹으면 비율이 0에 붙어 사라진다.
  const amounts = series.filter((item) => item.kind !== "percent");
  const rates = series.filter((item) => item.kind === "percent");
  const { min, max } = valueRange(amounts.flatMap((item) => item.values));
  const rate = valueRange(rates.flatMap((item) => item.values));
  const { width, height, top, plot, left, right } = BARS;
  const groupWidth = (width - left - right) / Math.max(1, labels.length);
  const barWidth = Math.max(6, Math.min(26, (groupWidth - 18) / Math.max(1, amounts.length)));
  const zeroY = yFor(0, min, max, top, plot);
  const centre = (index: number) => left + index * groupWidth + groupWidth / 2;

  return (
    <svg className="analysis-chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={chart.title || "기업 분석 차트"}>
      {niceTicks(min, max).map((tick) => {
        const y = yFor(tick, min, max, top, plot);
        return (
          <g key={`tick-${tick}`}>
            <line x1={left} y1={y} x2={width - right} y2={y} stroke="var(--folio-border)" strokeWidth="0.5" />
            <text className="analysis-chart-axis" x={left - 8} y={y + 4} textAnchor="end">
              {formatValue(tick, "money", chart.currency)}
            </text>
          </g>
        );
      })}
      {rates.length > 0 && niceTicks(rate.min, rate.max, 2).map((tick) => (
        <text
          className="analysis-chart-axis"
          key={`rate-${tick}`}
          x={width - right + 8}
          y={yFor(tick, rate.min, rate.max, top, plot) + 4}
        >
          {formatValue(tick, "percent")}
        </text>
      ))}

      {labels.map((label, labelIndex) =>
        amounts.map((item, seriesIndex) => {
          const value = item.values[labelIndex];
          if (value === null) return null;
          const y = yFor(value, min, max, top, plot);
          const x = centre(labelIndex) - (amounts.length * barWidth) / 2 + seriesIndex * barWidth;
          return (
            <rect
              key={`${item.key}-${label}`}
              x={x}
              y={Math.min(y, zeroY)}
              width={Math.max(2, barWidth - 3)}
              height={Math.max(2, Math.abs(zeroY - y))}
              rx="3"
              fill={COLORS[seriesIndex % COLORS.length]}
            />
          );
        }),
      )}

      {rates.map((item, rateIndex) => {
        const points = labels
          .map((_, index) => [centre(index), item.values[index]] as const)
          .filter((pair): pair is readonly [number, number] => pair[1] !== null)
          .map(([x, value]) => `${x},${yFor(value, rate.min, rate.max, top, plot)}`)
          .join(" ");
        if (!points) return null;
        return (
          <polyline
            key={item.key}
            points={points}
            fill="none"
            strokeWidth="2"
            stroke={COLORS[(amounts.length + rateIndex) % COLORS.length]}
          />
        );
      })}

      {labels.map((label, index) => (
        <g key={`band-${label}`}>
          {/* 막대 하나가 아니라 그 기간 전체가 대상이다. 조준할 필요가 없고,
              한 번에 그 기간의 모든 지표를 볼 수 있다. */}
          <rect
            className="analysis-chart-band"
            data-active={index === activeIndex ? "true" : undefined}
            x={left + index * groupWidth}
            y={top - 4}
            width={groupWidth}
            height={plot + 8}
            tabIndex={0}
            role="button"
            aria-label={`${label} 수치 보기`}
            onMouseEnter={() => onIndex(index)}
            onFocus={() => onIndex(index)}
          />
          <text className="analysis-chart-axis" x={centre(index)} y={height - 14} textAnchor="middle">{label}</text>
        </g>
      ))}
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
        return <line key={tick} x1={left} y1={y} x2={width - 12} y2={y} stroke="var(--folio-border)" strokeWidth="1" />;
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

/** 기간별 수치를 한 상자에 모아 보여준다.
 *
 *  예전에는 막대마다 툴팁이 떠서 한 번에 한 계열만 보였고, 그 해의 매출·이익을
 *  나란히 보려면 막대를 차례로 짚어야 했다. 비교가 목적인데 비교가 안 됐다.
 *  상자를 그림 밖에 두어 플롯을 가리지도 않는다.
 */
function PeriodPanel({
  chart,
  series,
  index,
}: {
  chart: AnalysisChart;
  series: Series[];
  index: number;
}) {
  const labels = Array.isArray(chart.years) ? chart.years : [];
  // 분기는 계절성이 있어 직전 분기가 아니라 전년 동기와 비교한다.
  const offset = Number(chart.compareOffset) > 0 ? Number(chart.compareOffset) : 1;
  const previous = index - offset;
  const compareLabel = previous >= 0 ? labels[previous] : "";

  return (
    <div className="analysis-chart-readout">
      <p className="analysis-chart-readout-head">
        <strong>{labels[index] || ""}</strong>
        {compareLabel && <span>{compareLabel} 대비</span>}
      </p>
      {series.map((item, seriesIndex) => {
        const value = item.values[index] ?? null;
        const before = previous >= 0 ? item.values[previous] ?? null : null;
        let change = "—";
        let direction: "up" | "down" | "flat" = "flat";
        if (value !== null && before !== null && before !== 0) {
          if (item.kind === "percent") {
            const diff = (value - before) * 100;
            direction = diff >= 0 ? "up" : "down";
            change = `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%p`;
          } else {
            const diff = ((value - before) / Math.abs(before)) * 100;
            direction = diff >= 0 ? "up" : "down";
            change = `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`;
          }
        }
        return (
          <p className="analysis-chart-readout-row" key={item.key}>
            <span className="analysis-chart-swatch" style={{ background: COLORS[seriesIndex % COLORS.length] }} />
            <span>{item.label}</span>
            <b>{formatValue(value, item.kind, chart.currency)}</b>
            <em data-direction={direction}>{change}</em>
          </p>
        );
      })}
    </div>
  );
}

function ChartCard({ chart }: { chart: AnalysisChart }) {
  const [tooltip, setTooltip] = useState<ChartTooltip>(null);
  const series = chartSeries(chart);
  const kind = String(chart.kind || chart.id || "");
  const labels = Array.isArray(chart.years) ? chart.years : [];
  // 마우스를 올리지 않아도 최신 기간 숫자가 보인다.
  const [activeIndex, setActiveIndex] = useState(Math.max(0, labels.length - 1));
  const banded = kind === "performance" || kind === "cashflow" || kind === "quarterly";
  const tooltipStyle = tooltip?.x !== undefined
    ? { left: `${Math.max(7, Math.min(93, (tooltip.x / 520) * 100))}%`, top: `${Math.max(10, tooltip.y || 10)}px` }
    : undefined;

  return (
    <article className="analysis-chart-card">
      <div className="analysis-chart-title">
        <h4>{chart.title || "기업 분석 차트"}</h4>
        {chart.subtitle && <p>{chart.subtitle}</p>}
      </div>
      <div className="analysis-chart-plot">
        {kind === "margins" && series.length ? <LineChart chart={chart} series={series} onPoint={setTooltip} onLeave={() => setTooltip(null)} /> : null}
        {banded && series.length ? (
          <BarsChart
            chart={chart}
            series={series}
            activeIndex={Math.min(activeIndex, Math.max(0, labels.length - 1))}
            onIndex={setActiveIndex}
          />
        ) : null}
        {(kind === "dcf" || kind === "scenario_price") ? <ScenarioChart chart={chart} onPoint={setTooltip} onLeave={() => setTooltip(null)} /> : null}
        {kind === "price_return" ? <ReturnChart chart={chart} onPoint={setTooltip} onLeave={() => setTooltip(null)} /> : null}
        {!series.length && !["dcf", "scenario_price", "price_return"].includes(kind) && (
          <p className="analysis-chart-warning">이 차트에 표시할 수치가 충분하지 않습니다.</p>
        )}
        {tooltip && !banded && (
          <div className="analysis-chart-tooltip" style={tooltipStyle}>
            {tooltip.series && <span>{tooltip.series}</span>}
            <strong>{tooltip.value}</strong>
            <em>{tooltip.label}</em>
          </div>
        )}
      </div>
      {banded && series.length > 0 ? (
        <PeriodPanel chart={chart} series={series} index={Math.min(activeIndex, Math.max(0, labels.length - 1))} />
      ) : (
        series.length > 0 && legend(series)
      )}
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
