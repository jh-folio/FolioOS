import { useCallback, useEffect, useMemo, useState } from "react";
import { getJson, postJson } from "../api";
import { openReactAgentDock, updateReactAgentContext } from "./agentContext";
import { stableNoteKey } from "./reportReader/FolioNotePanel";
import { ReaderActionButton, ReaderActionGroup } from "./reportReader/ReaderActions";
import { ReportBody } from "./reportReader/ReportBody";
import { ReportReaderShell } from "./reportReader/ReportReaderShell";
import { RouteHero } from "./RouteHero";

type TopicKey = "exchange_rate" | "interest_rate" | "earnings" | "weekly_market" | "industry_trend" | "custom";

type TopicReport = {
  id?: string;
  topicKey?: string;
  topicLabel?: string;
  date?: string;
  generatedAt?: string;
  mode?: string;
  saved?: boolean;
  markdown?: string;
  docCount?: number;
  memoryCount?: number;
  userContext?: string;
  generation?: { message?: string; mode?: string; generatedAt?: string };
  sources?: Array<{ source?: string; date?: string; title?: string; url?: string; path?: string }>;
  personalOverlay?: { markdown?: string } | null;
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
  topic?: string;
};

type OverlayResult = {
  personalOverlay?: { markdown?: string } | null;
};

const TOPIC_PRESETS: Array<{ key: TopicKey; label: string }> = [
  { key: "exchange_rate", label: "환율" },
  { key: "interest_rate", label: "금리" },
  { key: "earnings", label: "기업실적" },
  { key: "weekly_market", label: "주간 시황" },
  { key: "industry_trend", label: "산업 동향" },
  { key: "custom", label: "직접입력" },
];

const PRESET_LABELS: Record<string, string> = Object.fromEntries(TOPIC_PRESETS.map((preset) => [preset.key, preset.label]));

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
    throw new Error(current.message || current.error || "딥 리서치 생성에 실패했습니다.");
  }
  return current;
}

function splitReportTitle(markdown = "", fallback = "딥 리서치") {
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

function reportLabel(report: TopicReport) {
  return report.topicLabel || report.topicKey || "딥 리서치";
}

function presetLabel(report: TopicReport) {
  const key = String(report.topicKey || "").trim();
  return PRESET_LABELS[key] || key || "기타";
}

function displayDate(value?: string) {
  if (!value) return "날짜 미상";
  const raw = value.slice(0, 10);
  return raw || value;
}

function sourceLabel(source: NonNullable<TopicReport["sources"]>[number]) {
  return [source.source, source.date].filter(Boolean).join(" · ");
}

function sourceTitle(source: NonNullable<TopicReport["sources"]>[number]) {
  return source.title || source.url || source.path || "자료";
}

function setTopicHash(reportId?: string) {
  window.location.hash = reportId ? `#/deep-research/${encodeURIComponent(reportId)}` : "#/deep-research";
}

function readTopicDetailId() {
  const match = window.location.hash.match(/^#\/?deep-research\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : "";
}

function isDeepResearchHash() {
  return window.location.hash.replace(/^#\/?/, "").split("/")[0] === "deep-research";
}

export function DeepResearchRoute() {
  const [reports, setReports] = useState<TopicReport[]>([]);
  const [selected, setSelected] = useState<TopicReport | null>(null);
  const [detailId, setDetailId] = useState(() => readTopicDetailId());
  const [topicKey, setTopicKey] = useState<TopicKey>("exchange_rate");
  const [customLabel, setCustomLabel] = useState("");
  const [userContext, setUserContext] = useState("");
  const [deepResearch, setDeepResearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [actionBusy, setActionBusy] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await getJson<TopicReport[]>("/api/topic-reports");
      setReports(Array.isArray(payload) ? payload : []);
      updateReactAgentContext({ surface: "topic_report", viewId: "topicrpt", reportKind: "", reportId: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "딥 리서치 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useEffect(() => {
    const handleHashChange = () => {
      if (!isDeepResearchHash()) return;
      setDetailId(readTopicDetailId());
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
        const report = await getJson<TopicReport>(`/api/topic-reports/${encodeURIComponent(reportId)}?includePersonal=true`);
        if (!alive) return;
        setSelected(report);
        updateReactAgentContext({
          surface: "topic_report_reader",
          viewId: "topicrpt",
          reportKind: "topic_report",
          reportId: report.id || reportId,
        });
      } catch (err) {
        if (!alive) return;
        setSelected(null);
        setError(err instanceof Error ? err.message : "저장된 딥 리서치를 열지 못했습니다.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    if (detailId) {
      loadDetail(detailId);
    } else {
      setSelected(null);
      updateReactAgentContext({ surface: "topic_report", viewId: "topicrpt", reportKind: "", reportId: "" });
    }
    return () => {
      alive = false;
    };
  }, [detailId]);

  async function generateReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (topicKey === "custom" && !customLabel.trim()) {
      setError("직접입력 모드에서는 주제 이름을 입력하세요.");
      return;
    }
    setGenerating(true);
    setError("");
    setStatus("딥 리서치를 생성하는 중입니다.");
    try {
      const response = await postJson<TopicReport | AgentJob>("/api/topic-reports", {
        topicKey,
        customLabel: customLabel.trim(),
        userContext: userContext.trim(),
        deepResearch,
      });
      let report: TopicReport;
      if (isAgentJob(response)) {
        const done = await pollJob(response);
        const reportId = done.result?.reportId || done.result?.artifactId || "";
        if (!reportId) throw new Error("생성된 보고서 ID를 확인하지 못했습니다.");
        report = await getJson<TopicReport>(`/api/topic-reports/${encodeURIComponent(reportId)}?includePersonal=true`);
      } else {
        report = response;
      }
      await loadReports();
      setStatus("딥 리서치를 생성하고 자동 저장했습니다.");
      setSelected(report);
      if (report.id) setTopicHash(report.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "딥 리서치 생성에 실패했습니다.");
      setStatus("");
    } finally {
      setGenerating(false);
    }
  }

  async function deleteReport(report: TopicReport) {
    if (!report.id) return;
    if (!window.confirm(`${reportLabel(report)} 보고서를 삭제할까요?`)) return;
    setActionBusy(`delete-${report.id}`);
    setError("");
    try {
      const res = await fetch(`/api/topic-reports/${encodeURIComponent(report.id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`삭제 실패: ${res.status}`);
      if (selected?.id === report.id) setTopicHash();
      await loadReports();
      setStatus("저장된 딥 리서치를 삭제했습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "보고서 삭제에 실패했습니다.");
    } finally {
      setActionBusy("");
    }
  }

  async function exportTopicReport(target: "notion" | "obsidian") {
    if (!selected) return;
    setActionBusy(target);
    setStatus(target === "notion" ? "Notion으로 내보내는 중..." : "Obsidian으로 내보내는 중...");
    try {
      const result = target === "notion"
        ? await postJson<ExportResult>("/api/export-notion/topic-report", selected)
        : await postJson<ExportResult>("/api/export-obsidian/topic-report", selected);
      setStatus(target === "notion"
        ? `Notion으로 내보냈습니다${result.title ? `: ${result.title}` : ""}`
        : `Obsidian으로 내보냈습니다${result.topic || result.filename ? `: ${result.topic || result.filename}` : ""}`);
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
      const response = await postJson<OverlayResult | AgentJob>(`/api/topic-reports/${encodeURIComponent(selected.id)}/personal-overlay`, {});
      if (isAgentJob(response)) await pollJob(response);
      const updated = await getJson<TopicReport>(`/api/topic-reports/${encodeURIComponent(selected.id)}?includePersonal=true`);
      setSelected(updated);
      setStatus("내 노트와 연결했습니다.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "내 노트 연결에 실패했습니다.");
    } finally {
      setActionBusy("");
    }
  }

  const groupedReports = useMemo(() => {
    const groups = new Map<string, TopicReport[]>();
    for (const report of reports) {
      const key = presetLabel(report);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)?.push(report);
    }
    return Array.from(groups.entries())
      .map(([key, rows]) => ({
        key,
        rows: rows.sort((a, b) => String(b.generatedAt || b.date || "").localeCompare(String(a.generatedAt || a.date || ""))),
      }))
      .sort((a, b) => String(b.rows[0]?.generatedAt || b.rows[0]?.date || "").localeCompare(String(a.rows[0]?.generatedAt || a.rows[0]?.date || "")));
  }, [reports]);

  const readerContent = splitReportTitle(selected?.markdown || "", reportLabel(selected || {}));
  const sources = selected?.sources || [];

  if (selected) {
    return (
      <div className="react-deep-research-route" data-deep-research-route>
        {error && <p className="react-dashboard-error">{error}</p>}
        <ReportReaderShell
          eyebrow={`DEEP RESEARCH${selected.date ? ` · ${selected.date}` : ""}`}
          title={readerContent.title}
          meta={`${reportLabel(selected)} · 뉴스 ${selected.docCount || 0}건 · 내러티브 ${selected.memoryCount || 0}건`}
          agentContext={{
            surface: "topic_report_reader",
            viewId: "topicrpt",
            reportKind: "topic_report",
            reportId: selected.id || "",
            topic: reportLabel(selected),
          }}
          breadcrumb={(
            <>
              <button type="button" onClick={() => setTopicHash()}>
                딥 리서치
              </button>
              <span>{readerContent.title}</span>
            </>
          )}
          onClose={() => setTopicHash()}
          actionSlot={(
            <>
              <ReaderActionGroup title="AI">
                <ReaderActionButton
                  icon="agent"
                  onClick={() => openReactAgentDock({
                    surface: "topic_report_reader",
                    reportKind: "topic_report",
                    reportId: selected.id || "",
                    topic: reportLabel(selected),
                    message: `${readerContent.title}의 핵심 결론, 반대 근거, 더 발전시킬 분석 방향을 정리해줘.`,
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
                <ReaderActionButton icon="notion" disabled={actionBusy === "notion"} onClick={() => exportTopicReport("notion")}>
                  {actionBusy === "notion" ? "내보내는 중" : "Notion으로 내보내기"}
                </ReaderActionButton>
                <ReaderActionButton icon="obsidian" disabled={actionBusy === "obsidian"} onClick={() => exportTopicReport("obsidian")}>
                  {actionBusy === "obsidian" ? "내보내는 중" : "Obsidian으로 내보내기"}
                </ReaderActionButton>
              </ReaderActionGroup>
              {selected.generation?.message && <p className="react-reader-status">{selected.generation.message}</p>}
              {status && <p className="react-reader-status">{status}</p>}
            </>
          )}
          noteIdentity={{
            id: stableNoteKey("topic", reportLabel(selected)),
            noteType: "topic_review",
            title: reportLabel(selected) ? `${reportLabel(selected)} 리서치 노트` : "딥 리서치 노트",
            topic: reportLabel(selected),
            label: reportLabel(selected),
            reportKind: "topic_report",
            reportId: reportLabel(selected),
            linkedReports: [readerContent.title].filter(Boolean),
          }}
          noteLinkedTitle={readerContent.title}
          noteOverlayMarkdown={selected.personalOverlay?.markdown || ""}
        >
          <ReportBody markdown={readerContent.body || selected.markdown || ""} />
          {sources.length > 0 && (
            <section className="source-panel react-topic-sources">
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
    <div className="react-deep-research-route" data-deep-research-route>
      <RouteHero
        eyebrow="Deep Research"
        title="딥 리서치"
        description="환율, 금리, 기업실적, 주간 시황 등 특정 투자 질문을 근거 중심으로 분석합니다."
        actions={(
        <button className="filter-btn clear" type="button" onClick={loadReports} disabled={loading}>
          {loading ? "불러오는 중" : "다시 읽기"}
        </button>
        )}
      />

      <form className="input-panel topicrpt-form" onSubmit={generateReport}>
        <div className="input-panel-header">
          <h3>리서치 주제 선택</h3>
          <p>프리셋 주제를 선택하거나 직접 입력하세요. 추가 컨텍스트를 입력하면 리서치 품질이 크게 향상됩니다.</p>
        </div>
        <div className="topicrpt-topic-row">
          <div className="topicrpt-preset-btns">
            {TOPIC_PRESETS.slice(0, -1).map((preset) => (
              <button
                className={`filter-btn topicrpt-preset${topicKey === preset.key ? " active" : ""}`}
                type="button"
                data-topic={preset.key}
                key={preset.key}
                onClick={() => setTopicKey(preset.key)}
              >
                {preset.label}
              </button>
            ))}
            <span className="topicrpt-preset-sep" aria-hidden="true" />
            <button
              className={`filter-btn topicrpt-preset${topicKey === "custom" ? " active" : ""}`}
              type="button"
              data-topic="custom"
              onClick={() => setTopicKey("custom")}
            >
              직접입력
            </button>
          </div>
        </div>
        {topicKey === "custom" && (
          <div className="topicrpt-custom-row">
            <label className="field">
              <span>주제 이름</span>
              <input value={customLabel} onChange={(event) => setCustomLabel(event.currentTarget.value)} placeholder="예: 반도체 섹터, 유가 전망, BOK 정책" />
            </label>
          </div>
        )}
        <div className="topicrpt-context-row">
          <label className="field topicrpt-context-field">
            <span>추가 컨텍스트</span>
            <textarea
              value={userContext}
              onChange={(event) => setUserContext(event.currentTarget.value)}
              rows={4}
              placeholder={"예: BOK 기준금리 동결\n미국 고용지표 변화\nFed 점도표 수정"}
            />
          </label>
        </div>
        <div className="topicrpt-action-row">
          <label className="gen-option quality-option">
            <span>심층 모드</span>
            <input checked={deepResearch} onChange={(event) => setDeepResearch(event.currentTarget.checked)} type="checkbox" />
          </label>
          <button className="filter-btn apply" type="submit" disabled={generating}>
            {generating ? "생성 중" : "리서치 생성"}
          </button>
        </div>
      </form>

      {error && <p className="react-dashboard-error">{error}</p>}
      {status && <p className="react-dashboard-warning">{status}</p>}

      <div className="section-head compact analysis-archive-head topicrpt-saved-panel">
        <div>
          <h2 className="section-title">저장된 리포트</h2>
          <p className="section-subtitle">카드를 누르면 Notion식 리더 화면으로 열립니다.</p>
        </div>
      </div>
      <div className="report-feed">
        {groupedReports.length ? groupedReports.map((group) => (
          <section className="report-feed-group" key={group.key}>
            <div className="report-feed-group-head">
              <span className="report-feed-group-name">{group.key}</span>
              <span className="report-feed-group-meta">{group.rows.length}건 · 최근 {displayDate(group.rows[0]?.generatedAt || group.rows[0]?.date)}</span>
            </div>
            <div className="report-feed-group-cards">
              {group.rows.map((report) => {
                const deleting = actionBusy === `delete-${report.id}`;
                return (
                  <div className="report-feed-card-wrap" key={report.id || `${reportLabel(report)}-${report.date}`}>
                    <button className="report-feed-card is-topic" type="button" onClick={() => report.id && setTopicHash(report.id)}>
                      <span className="report-feed-card-meta">
                        {report.mode && <span className="report-feed-badge">{String(report.mode).toUpperCase()}</span>}
                      </span>
                      <strong>{reportLabel(report)}</strong>
                      <span className="report-feed-card-foot">{displayDate(report.date || report.generatedAt)}</span>
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
          <div className="report-feed-empty">저장된 딥 리서치가 없습니다. 위에서 리서치를 생성하세요.</div>
        )}
      </div>
    </div>
  );
}
