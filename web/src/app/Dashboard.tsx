import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { getJson, isActiveJobStatus, postJson, type JobStatus } from "../api";
import { MarketStateDashboard } from "../islands/MarketStateDashboard";
import { setReactAgentContextScope } from "./agentContext";
import { RouteHero } from "./RouteHero";
import { ResearchCockpit } from "./dashboard/ResearchCockpit";

const LegacyMarketWidgetBoard = lazy(() => import("./dashboard/LegacyMarketWidgetBoard"));

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
  status: JobStatus;
  message?: string;
  error?: string;
  result?: { date?: string; artifactId?: string };
};

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
  return Boolean(job?.id && job?.kind === "agent_bridge" && isActiveJobStatus(job.status));
}

async function pollAgentJob(job: AgentJob): Promise<AgentJob> {
  let current = job;
  while (isActiveJobStatus(current.status)) {
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

export function Dashboard() {
  const [dashboardMode, setDashboardMode] = useState<"cockpit" | "legacy">(() => localStorage.getItem("folio.dashboardMode") === "legacy" ? "legacy" : "cockpit");
  const [data, setData] = useState<LoadState>({ dashboard: null, review: null });
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (localStorage.getItem("folio.dashboardMode")) return;
    let alive = true;
    getJson<{ dashboardMode?: "cockpit" | "legacy" }>("/api/dashboard/settings")
      .then((payload) => { if (alive && payload.dashboardMode) setDashboardMode(payload.dashboardMode); })
      .catch(() => undefined);
    return () => { alive = false; };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboard, review] = await Promise.all([
        getJson<DashboardPayload>("/api/dashboard"),
        getJson<InvestmentReview>("/api/investment-review"),
      ]);
      setData({ dashboard, review });
      setReactAgentContextScope("dashboard", { surface: "dashboard", viewId: "dashboard", reportKind: "", reportId: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "대시보드를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (dashboardMode === "legacy") load();
  }, [dashboardMode, load]);

  async function changeDashboardMode(mode: "cockpit" | "legacy") {
    setDashboardMode(mode);
    localStorage.setItem("folio.dashboardMode", mode);
    try { await postJson("/api/dashboard/settings", { dashboardMode: mode }); } catch { /* local rollback control remains available */ }
  }

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
      setReactAgentContextScope("dashboard", { surface: "dashboard", viewId: "dashboard", reportKind: "investment_review", reportId: review.date || "" });
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

  if (dashboardMode === "cockpit") {
    return (
      <div className="react-dashboard" data-react-dashboard data-dashboard-mode="cockpit">
        <RouteHero
          eyebrow="Research Cockpit"
          title="대시보드"
          description="새 보고서에서 확인된 변화, 집중 차트, 시장 일정을 한 화면에서 점검합니다."
          actions={<div className="segment dashboard-mode-switch" role="group" aria-label="대시보드 모드"><button type="button" aria-pressed="true">Cockpit</button><button type="button" aria-pressed="false" onClick={() => changeDashboardMode("legacy")}>Legacy</button></div>}
        />
        <ResearchCockpit />
      </div>
    );
  }

  return (
    <div className="react-dashboard" data-react-dashboard>
      <RouteHero
        eyebrow="Investment Review"
        title="대시보드"
        description="시장 상태와 투자 체크포인트를 한 화면에서 점검합니다."
        actions={<><div className="segment dashboard-mode-switch" role="group" aria-label="대시보드 모드"><button type="button" aria-pressed="false" onClick={() => changeDashboardMode("cockpit")}>Cockpit</button><button type="button" aria-pressed="true">Legacy</button></div><button className="btn" type="button" onClick={load} disabled={loading}>{loading ? "불러오는 중" : "새로고침"}</button></>}
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
        <Suspense fallback={<article className="market-widget-panel"><p>Legacy 시장 위젯을 불러오는 중입니다.</p></article>}>
          <LegacyMarketWidgetBoard />
        </Suspense>

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
