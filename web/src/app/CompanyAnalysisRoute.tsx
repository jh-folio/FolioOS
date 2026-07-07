import { useCallback, useEffect, useMemo, useState } from "react";
import { getJson, postJson } from "../api";
import { openReactAgentDock, updateReactAgentContext } from "./agentContext";
import { CompanyAnalysisBody } from "./reportReader/CompanyAnalysisBody";
import { stableNoteKey } from "./reportReader/FolioNotePanel";
import { ReaderActionButton, ReaderActionGroup } from "./reportReader/ReaderActions";
import { ReportReaderShell } from "./reportReader/ReportReaderShell";
import { RouteHero } from "./RouteHero";

type AnalysisViewMode = "recent" | "company" | "month";
type AnalysisStyle = "beginner" | "advanced";

type Company = {
  name?: string;
  ticker?: string;
};

type AnalysisReport = {
  id?: string;
  query?: string;
  company?: Company;
  generatedAt?: string;
  mode?: string;
  headline?: string;
  markdown?: string;
  analysisStyle?: AnalysisStyle | string;
  saved?: boolean;
  generation?: { message?: string; mode?: string; webSearch?: boolean; generatedAt?: string };
  sources?: Array<{ source?: string; date?: string; type?: string; title?: string; url?: string; path?: string }>;
  analysisCharts?: { available?: boolean; reason?: string; charts?: unknown[] };
  dataGaps?: DataGap[] | { gaps?: DataGap[]; summary?: Record<string, number> };
  personalOverlay?: { markdown?: string } | null;
};

type DataGap = {
  field?: string;
  label?: string;
  category?: string;
  severity?: string;
  status?: string;
  message?: string;
  suggestedAction?: string;
  resolvedBy?: string;
  attempts?: string[];
};

type AgentJob = {
  id: string;
  kind?: string;
  status: "queued" | "running" | "done" | "failed" | "cancelled";
  message?: string;
  error?: string;
  result?: { reportId?: string; artifactId?: string };
};

type ExportResult = {
  notionUrl?: string;
  title?: string;
  filename?: string;
  company?: string;
};

type OverlayResult = {
  personalOverlay?: { markdown?: string } | null;
};

const ANALYSIS_STYLES: Array<{ value: AnalysisStyle; label: string; description: string }> = [
  { value: "beginner", label: "기본", description: "쉽게 설명" },
  { value: "advanced", label: "심화", description: "정밀 분석" },
];
const RECENT_ANALYSIS_LIMIT = 20;

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isAgentJob(value: unknown): value is AgentJob {
  const job = value as AgentJob;
  return Boolean(job?.id && ["queued", "running"].includes(job.status));
}

async function pollJob(job: AgentJob): Promise<AgentJob> {
  let current = job;
  while (["queued", "running"].includes(current.status)) {
    await sleep(1000);
    current = await getJson<AgentJob>(`/api/jobs/${encodeURIComponent(current.id)}`);
  }
  if (current.status !== "done") {
    throw new Error(current.message || current.error || "기업 분석 생성에 실패했습니다.");
  }
  return current;
}

function splitReportTitle(markdown = "", fallback = "기업 분석") {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const firstContentIndex = lines.findIndex((line) => line.trim());
  if (firstContentIndex < 0) return { title: fallback, body: "" };
  const titleMatch = lines[firstContentIndex].trim().match(/^#\s+(.+)$/);
  if (!titleMatch) return { title: fallback, body: markdown };
  return {
    title: titleMatch[1],
    body: lines.slice(firstContentIndex + 1).join("\n").trim(),
  };
}

function tickerOf(report: AnalysisReport) {
  return String(report.company?.ticker || report.query || report.company?.name || "").trim().toUpperCase();
}

function companyNameOf(report: AnalysisReport) {
  return String(report.company?.name || report.query || tickerOf(report) || "").trim();
}

function reportLabel(report: AnalysisReport) {
  const ticker = tickerOf(report);
  const name = companyNameOf(report);
  return ticker && name && ticker !== name ? `${ticker} · ${name}` : name || ticker || "기업 분석";
}

function analysisFeedTitle(report: AnalysisReport) {
  const markdownTitle = splitReportTitle(String(report.markdown || ""), "").title.trim();
  return markdownTitle || String(report.headline || "").trim() || reportLabel(report);
}

function displayDate(value?: string) {
  if (!value) return "미상";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString("ko-KR");
}

function analysisStyleLabel(value?: string) {
  return ANALYSIS_STYLES.find((style) => style.value === value)?.label || "";
}

function gapSeverityLabel(value?: string) {
  if (value === "high") return "높음";
  if (value === "medium") return "중간";
  if (value === "low") return "낮음";
  return value || "확인 필요";
}

function dataGapRows(report?: AnalysisReport | null) {
  const raw = report?.dataGaps;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return Array.isArray(raw.gaps) ? raw.gaps : [];
}

function dedupeDataGaps(gaps: DataGap[]) {
  const seen = new Set<string>();
  return gaps.filter((gap) => {
    const key = [
      normalizeText(gap.field),
      normalizeText(gap.label),
      normalizeText(gap.category),
      normalizeText(gap.message || gap.suggestedAction),
    ].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function unresolvedDataGaps(report?: AnalysisReport | null) {
  const severityRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
  return dedupeDataGaps(
    dataGapRows(report)
      .filter((gap) => gap.status !== "resolved")
      .sort((a, b) => (severityRank[a.severity || ""] ?? 9) - (severityRank[b.severity || ""] ?? 9)),
  );
}

function displayMonth(value?: string) {
  if (!value) return "월 미상";
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}.${String(parsed.getMonth() + 1).padStart(2, "0")}`;
  }
  const match = String(value).match(/^(\d{4})[-.](\d{1,2})/);
  return match ? `${match[1]}.${String(match[2]).padStart(2, "0")}` : "월 미상";
}

function normalizeText(value?: string) {
  return String(value || "").trim().toLowerCase();
}

function sourceLabel(source: NonNullable<AnalysisReport["sources"]>[number]) {
  return [source.source, source.date, source.type].filter(Boolean).join(" · ");
}

function sourceTitle(source: NonNullable<AnalysisReport["sources"]>[number]) {
  return source.title || source.url || source.path || "자료";
}

function analysisBodyMarkdown(report: AnalysisReport) {
  const raw = String(report.markdown || "");
  if (report.generation?.webSearch) return raw.trim();
  return raw.split(/\n(?=#{1,3}\s*(?:8\.\s*)?(?:Sources Used|사용 자료)\b)/i)[0].trim();
}

function setAnalysisHash(reportId?: string) {
  window.location.hash = reportId ? `#/analysis/${encodeURIComponent(reportId)}` : "#/analysis";
}

function readAnalysisDetailId() {
  const match = window.location.hash.match(/^#\/?analysis\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : "";
}

function isAnalysisHash() {
  return window.location.hash.replace(/^#\/?/, "").split("/")[0] === "analysis";
}

export function CompanyAnalysisRoute() {
  const [reports, setReports] = useState<AnalysisReport[]>([]);
  const [selected, setSelected] = useState<AnalysisReport | null>(null);
  const [detailId, setDetailId] = useState(() => readAnalysisDetailId());
  const [query, setQuery] = useState("");
  const [analysisStyle, setAnalysisStyle] = useState<AnalysisStyle>("beginner");
  const [reportQuery, setReportQuery] = useState("");
  const [reportView, setReportView] = useState<AnalysisViewMode>("recent");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [actionBusy, setActionBusy] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await getJson<AnalysisReport[]>("/api/analysis-reports");
      setReports(Array.isArray(payload) ? payload : []);
      updateReactAgentContext({ surface: "analysis", viewId: "analysis", reportKind: "", reportId: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "기업 분석 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useEffect(() => {
    const handleHashChange = () => {
      if (!isAnalysisHash()) return;
      setDetailId(readAnalysisDetailId());
    };
    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    let alive = true;
    async function loadDetail(reportId: string) {
      setLoading(true);
      setError("");
      try {
        const report = await getJson<AnalysisReport>(`/api/analysis-reports/${encodeURIComponent(reportId)}?includePersonal=true`);
        if (!alive) return;
        setSelected(report);
        updateReactAgentContext({
          surface: "analysis_reader",
          viewId: "analysis",
          reportKind: "company_analysis",
          reportId: report.id || reportId,
          ticker: tickerOf(report),
        });
      } catch (err) {
        if (!alive) return;
        setSelected(null);
        setError(err instanceof Error ? err.message : "저장된 기업 분석 보고서를 열지 못했습니다.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    if (detailId) {
      loadDetail(detailId);
    } else {
      setSelected(null);
      updateReactAgentContext({ surface: "analysis", viewId: "analysis", reportKind: "", reportId: "" });
    }
    return () => {
      alive = false;
    };
  }, [detailId]);

  async function generateAnalysis(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setGenerating(true);
    setError("");
    setStatus("기업 자료를 읽고 분석 보고서를 생성하는 중입니다.");
    try {
      const params = new URLSearchParams({
        q: trimmed,
        analysisStyle,
      });
      const response = await getJson<AnalysisReport | AgentJob>(`/api/analyze?${params.toString()}`);
      let report: AnalysisReport;
      if (isAgentJob(response)) {
        const done = await pollJob(response);
        const reportId = done.result?.reportId || done.result?.artifactId || "";
        if (!reportId) throw new Error("생성된 보고서 ID를 확인하지 못했습니다.");
        report = await getJson<AnalysisReport>(`/api/analysis-reports/${encodeURIComponent(reportId)}?includePersonal=true`);
      } else {
        report = response;
      }
      await loadReports();
      setStatus("기업 분석 보고서를 생성하고 자동 저장했습니다.");
      setSelected(report);
      if (report.id) setAnalysisHash(report.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "기업 분석 생성에 실패했습니다.");
      setStatus("");
    } finally {
      setGenerating(false);
    }
  }

  async function openReport(reportId?: string) {
    if (!reportId) return;
    setAnalysisHash(reportId);
  }

  async function deleteReport(report: AnalysisReport) {
    if (!report.id) return;
    if (!window.confirm(`${reportLabel(report)} 보고서를 삭제할까요?`)) return;
    setActionBusy(`delete-${report.id}`);
    setError("");
    try {
      const res = await fetch(`/api/analysis-reports/${encodeURIComponent(report.id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`삭제 실패: ${res.status}`);
      if (selected?.id === report.id) setAnalysisHash();
      await loadReports();
      setStatus("저장된 기업 분석 보고서를 삭제했습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "보고서 삭제에 실패했습니다.");
    } finally {
      setActionBusy("");
    }
  }

  async function exportAnalysis(target: "notion" | "obsidian") {
    if (!selected) return;
    setActionBusy(target);
    setStatus(target === "notion" ? "Notion으로 내보내는 중..." : "Obsidian으로 내보내는 중...");
    try {
      const result = target === "notion"
        ? await postJson<ExportResult>("/api/export-notion/analysis", selected)
        : await postJson<ExportResult>("/api/export-obsidian/analysis", selected);
      setStatus(target === "notion"
        ? `Notion으로 내보냈습니다${result.title ? `: ${result.title}` : ""}`
        : `Obsidian으로 내보냈습니다${result.company || result.filename ? `: ${result.company || result.filename}` : ""}`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "내보내기에 실패했습니다.");
    } finally {
      setActionBusy("");
    }
  }

  async function generatePersonalOverlay() {
    if (!selected?.id) return;
    setActionBusy("overlay");
    setStatus("내 노트와 연결하는 중...");
    try {
      const response = await postJson<OverlayResult | AgentJob>(`/api/analysis-reports/${encodeURIComponent(selected.id)}/personal-overlay`, {});
      if (isAgentJob(response)) await pollJob(response);
      const updated = await getJson<AnalysisReport>(`/api/analysis-reports/${encodeURIComponent(selected.id)}?includePersonal=true`);
      setSelected(updated);
      setStatus("내 노트와 연결했습니다.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "내 노트 연결에 실패했습니다.");
    } finally {
      setActionBusy("");
    }
  }

  const filteredReports = useMemo(() => {
    const q = normalizeText(reportQuery);
    if (!q) return reports;
    return reports.filter((report) => {
      const haystack = normalizeText([
        tickerOf(report),
        companyNameOf(report),
        reportLabel(report),
        report.headline,
        report.mode,
        report.generatedAt,
        displayDate(report.generatedAt),
      ].filter(Boolean).join(" "));
      return haystack.includes(q);
    });
  }, [reportQuery, reports]);

  const visibleReportGroups = useMemo(() => {
    const sorted = [...filteredReports].sort((a, b) => String(b.generatedAt || "").localeCompare(String(a.generatedAt || "")));
    if (reportView === "recent") {
      if (!sorted.length) return [];
      return [{
        key: "recent",
        label: `최근 보고서 ${Math.min(sorted.length, RECENT_ANALYSIS_LIMIT)}건`,
        rows: sorted.slice(0, RECENT_ANALYSIS_LIMIT),
      }];
    }
    if (reportView === "month") {
      const groups = new Map<string, AnalysisReport[]>();
      for (const report of sorted) {
        const key = displayMonth(report.generatedAt);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)?.push(report);
      }
      return Array.from(groups.entries()).map(([key, rows]) => ({ key, label: key, rows }));
    }
    const groups = new Map<string, AnalysisReport[]>();
    for (const report of sorted) {
      const key = tickerOf(report) || analysisFeedTitle(report);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)?.push(report);
    }
    return Array.from(groups.entries())
      .map(([key, rows]) => ({
        key,
        label: analysisFeedTitle(rows[0] || {}),
        rows: rows.sort((a, b) => String(b.generatedAt || "").localeCompare(String(a.generatedAt || ""))),
      }))
      .sort((a, b) => String(b.rows[0]?.generatedAt || "").localeCompare(String(a.rows[0]?.generatedAt || "")));
  }, [filteredReports, reportView]);

  const readerMarkdown = analysisBodyMarkdown(selected || {});
  const readerContent = splitReportTitle(readerMarkdown, selected?.headline || reportLabel(selected || {}));
  const sources = selected?.sources || [];
  const readerDataGaps = unresolvedDataGaps(selected);

  if (selected) {
    return (
      <div className="react-company-analysis-route" data-company-analysis-route>
        {error && <p className="react-dashboard-error">{error}</p>}
        <ReportReaderShell
          eyebrow={`COMPANY ANALYSIS${tickerOf(selected) ? ` · ${tickerOf(selected)}` : ""}`}
          title={readerContent.title}
          meta={[selected.generatedAt ? `생성일 ${displayDate(selected.generatedAt)}` : "", analysisStyleLabel(selected.analysisStyle)].filter(Boolean).join(" · ")}
          agentContext={{
            surface: "analysis_reader",
            viewId: "analysis",
            reportKind: "company_analysis",
            reportId: selected.id || "",
            ticker: tickerOf(selected),
          }}
          breadcrumb={(
            <>
              <button type="button" onClick={() => setAnalysisHash()}>
                기업 분석
              </button>
              <span>{readerContent.title}</span>
            </>
          )}
          onClose={() => setAnalysisHash()}
          actionSlot={(
            <>
              <ReaderActionGroup title="AI">
                <ReaderActionButton
                  icon="agent"
                  onClick={() => openReactAgentDock({
                    surface: "analysis_reader",
                    reportKind: "company_analysis",
                    reportId: selected.id || "",
                    ticker: tickerOf(selected),
                    message: `${readerContent.title}에서 투자 판단에 중요한 핵심, 리스크, 추가 확인 질문을 정리해줘.`,
                    autoSubmit: true,
                  })}
                >
                  Agent에게 묻기
                </ReaderActionButton>
              </ReaderActionGroup>
              <ReaderActionGroup title="노트">
                <ReaderActionButton icon="link" disabled={actionBusy === "overlay" || !selected.id} onClick={generatePersonalOverlay}>
                  {actionBusy === "overlay" ? "연결 중" : "내 노트와 연결"}
                </ReaderActionButton>
              </ReaderActionGroup>
              <ReaderActionGroup title="내보내기">
                <ReaderActionButton icon="notion" disabled={actionBusy === "notion"} onClick={() => exportAnalysis("notion")}>
                  {actionBusy === "notion" ? "내보내는 중" : "Notion으로 내보내기"}
                </ReaderActionButton>
                <ReaderActionButton icon="obsidian" disabled={actionBusy === "obsidian"} onClick={() => exportAnalysis("obsidian")}>
                  {actionBusy === "obsidian" ? "내보내는 중" : "Obsidian으로 내보내기"}
                </ReaderActionButton>
              </ReaderActionGroup>
              {readerDataGaps.length > 0 && (
                <ReaderActionGroup title="자료 한계">
                  <div className="react-reader-gap-list">
                    {readerDataGaps.slice(0, 3).map((gap, index) => (
                      <div className="react-reader-gap" key={`${gap.field || gap.category || "gap"}-${index}`}>
                        <span>{gapSeverityLabel(gap.severity)}</span>
                        <strong>{gap.label || gap.category || "추가 확인 필요"}</strong>
                        <p>{gap.message || gap.suggestedAction || "보고서 해석 시 확인이 필요한 자료 한계입니다."}</p>
                      </div>
                    ))}
                  </div>
                </ReaderActionGroup>
              )}
              {selected.generation?.message && <p className="react-reader-status">{selected.generation.message}</p>}
              {status && <p className="react-reader-status">{status}</p>}
            </>
          )}
          noteIdentity={{
            id: stableNoteKey("company", tickerOf(selected) || selected.headline || "company"),
            noteType: "company_thesis",
            title: tickerOf(selected) ? `${tickerOf(selected)} 투자 노트` : "기업 투자 노트",
            ticker: tickerOf(selected),
            company: selected.company?.name || "",
            label: tickerOf(selected),
            reportKind: "company_analysis",
            reportId: tickerOf(selected),
            linkedReports: [readerContent.title].filter(Boolean),
          }}
          noteLinkedTitle={readerContent.title}
          noteOverlayMarkdown={selected.personalOverlay?.markdown || ""}
        >
          <CompanyAnalysisBody markdown={readerContent.body || readerMarkdown} charts={selected.analysisCharts} />
          {sources.length > 0 && (
            <section className="source-panel react-analysis-sources">
              <h4>참고자료</h4>
              <div className="sources">
                {sources.map((source, index) => (
                  <div className="meta" key={`${sourceTitle(source)}-${index}`}>
                    <span>{sourceLabel(source)}</span>
                    {source.url ? (
                      <a href={source.url} target="_blank" rel="noopener noreferrer">{sourceTitle(source)}</a>
                    ) : (
                      <span>{sourceTitle(source)}</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </ReportReaderShell>
      </div>
    );
  }

  return (
    <div className="react-company-analysis-route" data-company-analysis-route>
      <RouteHero
        eyebrow="Company Analysis"
        title="기업 분석"
        description="SEC, DART, 시장 데이터와 로컬 자료를 활용해 기업 분석 보고서를 생성합니다."
        actions={(
          <button type="button" onClick={loadReports} disabled={loading}>
            {loading ? "불러오는 중" : "새로고침"}
          </button>
        )}
      />

      <form className="react-analysis-form" onSubmit={generateAnalysis}>
        <div className="react-analysis-api-note" role="note">
          <strong>API 연동 안내</strong>
          <span>미국 기업은 SEC 자료를 우선 사용하고, 한국 기업은 DART API Key를 설정하면 공시 확인 정확도가 높아집니다.</span>
        </div>
        <div className="react-analysis-query">
          <label>
            <span>분석 대상</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="예: NVDA, 삼성전자, SK하이닉스"
            />
          </label>
        </div>
        <fieldset className="react-analysis-style" aria-label="보고서 모드">
          <legend>보고서 모드</legend>
          <div className="react-analysis-style-toggle" data-style={analysisStyle}>
            {ANALYSIS_STYLES.map((style) => (
              <button
                type="button"
                key={style.value}
                className={analysisStyle === style.value ? "active" : ""}
                aria-pressed={analysisStyle === style.value}
                onClick={() => setAnalysisStyle(style.value)}
                data-tooltip={style.description}
              >
                {style.label}
              </button>
            ))}
          </div>
        </fieldset>
        <button type="submit" disabled={generating || !query.trim()}>
          {generating ? "분석 중" : "분석"}
        </button>
      </form>

      {error && <p className="react-dashboard-error">{error}</p>}
      {status && <p className="react-dashboard-warning">{status}</p>}

      <section className="input-panel react-analysis-feed-controls report-feed-controls" aria-label="저장 기업 분석 검색">
        <div className="briefing-archive-filters">
          <label>
            <span>검색</span>
            <input
              type="search"
              value={reportQuery}
              onChange={(event) => setReportQuery(event.currentTarget.value)}
              placeholder="티커·회사명·보고서 검색"
            />
          </label>
          <button
            className="filter-btn clear"
            type="button"
            onClick={() => {
              setReportQuery("");
              setReportView("recent");
            }}
          >
            초기화
          </button>
        </div>
        <div className="briefing-archive-summary">
          <span>{filteredReports.length}건</span>
          <span aria-live="polite">{loading ? "불러오는 중..." : reportQuery ? "검색 결과" : ""}</span>
        </div>
      </section>
      <div className="report-feed-outside-controls" aria-label="기업 분석 표시 옵션">
        <div className="report-feed-view-row">
          <span>보기</span>
          <label className="report-feed-view-pill">
            <select value={reportView} onChange={(event) => setReportView(event.currentTarget.value as AnalysisViewMode)}>
              <option value="recent">최근</option>
              <option value="company">기업별</option>
              <option value="month">월별</option>
            </select>
          </label>
        </div>
      </div>

      <section className="react-analysis-feed" aria-label="저장된 기업 분석">
        <div className="react-section-heading">
          <div>
            <p className="section-kicker">Saved Reports</p>
            <h2>저장된 기업 분석</h2>
          </div>
          <span>{reports.length} reports</span>
        </div>
        {visibleReportGroups.length ? visibleReportGroups.map((group) => (
          <section className="report-feed-group" key={group.key}>
            <div className="report-feed-group-head">
              <span className="report-feed-group-name">{group.label}</span>
              <span className="report-feed-group-meta">{group.rows.length}건 · 최근 {displayDate(group.rows[0]?.generatedAt)}</span>
            </div>
            <div className="report-feed-group-cards">
              {group.rows.map((report) => {
                const deleting = actionBusy === `delete-${report.id}`;
                return (
                  <div className="report-feed-card-wrap" key={report.id || `${analysisFeedTitle(report)}-${report.generatedAt}`}>
                    <button className="report-feed-card is-analysis" type="button" onClick={() => openReport(report.id)}>
                      <span className="report-feed-card-meta">
                        {report.mode && <span className="report-feed-badge">{String(report.mode).toUpperCase()}</span>}
                        {report.analysisStyle && <span className="report-feed-badge">{analysisStyleLabel(report.analysisStyle) || String(report.analysisStyle).toUpperCase()}</span>}
                      </span>
                      <strong>{analysisFeedTitle(report)}</strong>
                      <span className="report-feed-card-foot">생성일 {displayDate(report.generatedAt)}</span>
                    </button>
                    <button
                      type="button"
                      className="report-feed-card-delete"
                      disabled={deleting}
                      onClick={() => deleteReport(report)}
                      aria-label={`${reportLabel(report)} 삭제`}
                      data-tooltip="삭제"
                    >
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M2.5 4h11M6 4V2.5h4V4M5 4l.5 9h5L11 4" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )) : (
          <article className="react-dashboard-panel">
            <h2>저장된 기업 분석 보고서가 없습니다.</h2>
            <p>분석 대상을 입력해 첫 보고서를 생성하세요.</p>
          </article>
        )}
      </section>
    </div>
  );
}
