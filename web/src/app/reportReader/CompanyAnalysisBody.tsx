import { AnalysisCharts } from "./AnalysisCharts";
import { ReportBody } from "./ReportBody";

type AnalysisChartsPayload = {
  available?: boolean;
  charts?: unknown[];
};

type AnalysisSection = {
  key: string;
  title: string;
  markdown: string;
};

const CHART_SECTION_RULES: Array<{ ids: string[]; patterns: RegExp[]; fallbackIndex: number }> = [
  { ids: ["performance", "margins"], patterns: [/실적|재무|수익성|숫자|손익/i], fallbackIndex: 1 },
  { ids: ["cashflow"], patterns: [/현금|cash|fcf|free cash|설비투자/i], fallbackIndex: 2 },
  { ids: ["dcf", "scenario_price"], patterns: [/밸류에이션|가치|valuation|가격|적정가/i], fallbackIndex: 3 },
  { ids: ["price_return"], patterns: [/주가|시장|접근|핵심 판단|수익률/i], fallbackIndex: 0 },
];

export function splitAnalysisSections(markdown = ""): AnalysisSection[] {
  const normalized = markdown.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  const matches = Array.from(normalized.matchAll(/^##\s+(.+)$/gm));
  if (!matches.length) return [{ key: "body", title: "", markdown: normalized }];

  const sections: AnalysisSection[] = [];
  const firstStart = matches[0].index || 0;
  if (firstStart > 0) {
    const intro = normalized.slice(0, firstStart).trim();
    if (intro) sections.push({ key: "intro", title: "", markdown: intro });
  }

  matches.forEach((match, index) => {
    const start = match.index || 0;
    const end = index + 1 < matches.length ? matches[index + 1].index || normalized.length : normalized.length;
    const markdownSlice = normalized.slice(start, end).trim();
    sections.push({
      key: `section-${index}`,
      title: match[1] || "",
      markdown: markdownSlice,
    });
  });
  return sections;
}

function availableChartIds(payload?: AnalysisChartsPayload) {
  return new Set((Array.isArray(payload?.charts) ? payload.charts : [])
    .map((chart) => String((chart as { id?: string; kind?: string })?.id || (chart as { kind?: string })?.kind || ""))
    .filter(Boolean));
}

export function chartGroupsForSection(
  section: AnalysisSection,
  sectionIndex: number,
  payload?: AnalysisChartsPayload,
  usedChartIds = new Set<string>(),
) {
  const available = availableChartIds(payload);
  const titleAndBody = section.title;
  const matched: string[] = [];

  for (const rule of CHART_SECTION_RULES) {
    const isMatch = rule.patterns.some((pattern) => pattern.test(titleAndBody))
      || rule.fallbackIndex === sectionIndex;
    if (!isMatch) continue;
    for (const id of rule.ids) {
      if (available.has(id) && !usedChartIds.has(id)) matched.push(id);
    }
  }
  return matched;
}

export function remainingChartIds(payload?: AnalysisChartsPayload, usedChartIds = new Set<string>()) {
  return Array.from(availableChartIds(payload)).filter((id) => !usedChartIds.has(id));
}

export function CompanyAnalysisBody({ markdown, charts }: { markdown: string; charts?: AnalysisChartsPayload }) {
  const sections = splitAnalysisSections(markdown);
  const usedChartIds = new Set<string>();
  if (!sections.length) return <AnalysisCharts payload={charts} />;

  return (
    <>
      {sections.map((section, index) => {
        const chartIds = chartGroupsForSection(section, index, charts, usedChartIds);
        chartIds.forEach((id) => usedChartIds.add(id));
        return (
          <div className="company-analysis-section" key={section.key}>
            <ReportBody markdown={section.markdown} />
            {chartIds.length > 0 && (
              <AnalysisCharts
                payload={charts}
                chartIds={chartIds}
                heading="관련 시각화"
                intro="이 섹션의 판단을 확인할 때 함께 볼 수 있는 수치입니다."
                compact
              />
            )}
          </div>
        );
      })}
      {remainingChartIds(charts, usedChartIds).length > 0 && (
        <AnalysisCharts
          payload={charts}
          chartIds={remainingChartIds(charts, usedChartIds)}
          heading="추가 시각화"
          intro="본문 섹션에 직접 매칭되지 않은 보조 차트입니다."
          compact
        />
      )}
    </>
  );
}
