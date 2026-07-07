import { useCallback, useEffect, useMemo, useState } from "react";
import { getJson, postJson } from "../api";
import { openReactAgentDock, updateReactAgentContext } from "./agentContext";
import { legacyBridge } from "./legacyBridge";
import { ReaderActionButton, ReaderActionGroup } from "./reportReader/ReaderActions";
import { ReportBody } from "./reportReader/ReportBody";
import { ReportReaderShell } from "./reportReader/ReportReaderShell";
import { RouteHero } from "./RouteHero";

type MarketScope = "us" | "kr" | "both";
type ArchiveMarketFilter = "all" | MarketScope;
type ArchiveViewMode = "recent" | "month" | "market";

type BriefingArchiveItem = {
  id?: string;
  title?: string;
  reportDate?: string;
  date?: string;
  marketScope?: string;
  scope?: string;
  generatedAt?: string;
  sessionDate?: string;
  briefingType?: string;
  tags?: string[];
};

type BriefingArchivePayload = {
  items?: BriefingArchiveItem[];
  total?: number;
  offset?: number;
  limit?: number;
};

type Briefing = {
  title?: string;
  date?: string;
  marketScope?: string;
  markdown?: string;
  generation?: { message?: string; mode?: string; generatedAt?: string };
  personalOverlay?: { markdown?: string; verdict?: string } | null;
};

type AgentJob = {
  id: string;
  kind?: string;
  status: "queued" | "running" | "done" | "failed" | "cancelled";
  message?: string;
  error?: string;
  result?: { date?: string; artifactId?: string };
};

type ExportResult = {
  notionUrl?: string;
  title?: string;
  filename?: string;
};

type OverlayResult = {
  personalOverlay?: Briefing["personalOverlay"];
  status?: string;
};

type BriefingDetailRoute = {
  date: string;
  scope: MarketScope;
};

const SCOPE_LABELS: Record<MarketScope, string> = {
  us: "미국",
  kr: "한국",
  both: "통합",
};

const MARKET_BADGE: Record<MarketScope, string> = { us: "US", kr: "KR", both: "US/KR" };
const BRIEFING_MARKET_TAGS = new Set(["미국장", "한국장", "종합"]);
const BRIEFING_TYPE_LABELS: Record<string, string> = {
  default: "기본",
  market_focused: "시황 중심",
  concise: "요약",
};
const RECENT_BRIEFING_LIMIT = 20;

function formatArchiveDate(date: string) {
  return String(date || "").replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$1.$2.$3");
}

function formatArchiveMonth(date: string) {
  const match = String(date || "").match(/^(\d{4})-(\d{2})/);
  return match ? `${match[1]}.${match[2]}` : "월 미상";
}

function todayIsoDate() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function stripTitleDate(title: string) {
  return String(title || "").replace(/\s+[—–-]\s+\d{4}[.-]\d{2}[.-]\d{2}\s*$/, "").trim();
}

// 레거시 briefingArchiveCard()와 동일한 표시 규칙(제목·배지·기준일/생성 시각).
function archiveCardView(item: BriefingArchiveItem) {
  const date = displayDate(item);
  const scope = displayScope(item);
  const displayTitle = scope === "us"
    ? "US Market Briefing"
    : scope === "kr"
      ? "KR Market Briefing"
      : stripTitleDate(item.title || "Daily Market Briefing");
  const formatted = formatArchiveDate(date);
  const title = formatted ? `${displayTitle} — ${formatted}` : displayTitle;
  const chips = (item.tags || []).filter((tag) => !BRIEFING_MARKET_TAGS.has(String(tag || "").trim()));
  const session = item.sessionDate ? `시장 기준일 ${item.sessionDate}` : "시장 기준일 미상";
  const generated = item.generatedAt ? new Date(item.generatedAt).toLocaleString("ko-KR") : "생성 시각 미상";
  return { date, scope, title, chips, foot: `${session} · ${generated}` };
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function normalizedScope(value?: string): MarketScope {
  return value === "us" || value === "kr" || value === "both" ? value : "both";
}

function readBriefingDetailRoute(): BriefingDetailRoute | null {
  const match = window.location.hash.match(/^#\/?briefing\/(\d{4}-\d{2}-\d{2})(?:\/(us|kr|both))?$/);
  if (!match) return null;
  return { date: match[1], scope: normalizedScope(match[2]) };
}

function isBriefingHash() {
  return window.location.hash.replace(/^#\/?/, "").split("/")[0] === "briefing";
}

function setBriefingHash(date?: string, scope: MarketScope = "both") {
  window.location.hash = date ? `#/briefing/${date}/${scope}` : "#/briefing";
}

function splitReportTitle(markdown = "", fallback = "시장 브리핑") {
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

function displayDate(item: BriefingArchiveItem) {
  return item.reportDate || item.date || "";
}

function displayScope(item: BriefingArchiveItem): MarketScope {
  return normalizedScope(item.marketScope || item.scope);
}

function normalizeText(value?: string) {
  return String(value || "").trim().toLowerCase();
}

function stableNoteKey(prefix: string, text: string) {
  const raw = String(text || prefix || "note");
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i += 1) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return `${prefix}-${hash.toString(36)}`;
}

function briefingNoteIdentity(date: string, scope: MarketScope) {
  return {
    id: stableNoteKey("brief", `${date}:${scope}`),
    noteType: "market_memo",
    title: date ? `브리핑 ${date} 투자 노트` : "브리핑 투자 노트",
    label: date ? `브리핑 ${date}` : "브리핑",
    topic: scope,
    reportKind: "briefing",
    reportId: date,
    linkedReports: [date ? `Daily Market Briefing — ${date}` : ""].filter(Boolean),
  };
}

function isAgentJob(value: unknown): value is AgentJob {
  const job = value as AgentJob;
  return Boolean(job?.id && ["queued", "running"].includes(job.status));
}

async function pollAgentJob(job: AgentJob): Promise<AgentJob> {
  let current = job;
  while (["queued", "running"].includes(current.status)) {
    await sleep(1000);
    current = await getJson<AgentJob>(`/api/jobs/${encodeURIComponent(current.id)}`);
  }
  if (current.status !== "done") throw new Error(current.message || current.error || "브리핑 생성에 실패했습니다.");
  return current;
}

export function BriefingRoute() {
  const [archive, setArchive] = useState<BriefingArchivePayload | null>(null);
  const [detailRoute, setDetailRoute] = useState<BriefingDetailRoute | null>(() => readBriefingDetailRoute());
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [actionStatus, setActionStatus] = useState("");
  const [actionBusy, setActionBusy] = useState("");
  const [marketScope, setMarketScope] = useState<MarketScope>("us");
  const [briefingType, setBriefingType] = useState("default");
  const [briefingDate, setBriefingDate] = useState(() => todayIsoDate());
  const [archiveQuery, setArchiveQuery] = useState("");
  const [archiveMarket, setArchiveMarket] = useState<ArchiveMarketFilter>("all");
  const [archiveType, setArchiveType] = useState("all");
  const [archiveStart, setArchiveStart] = useState("");
  const [archiveEnd, setArchiveEnd] = useState("");
  const [archiveView, setArchiveView] = useState<ArchiveViewMode>("recent");

  const loadArchive = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        offset: "0",
        limit: "100",
        q: archiveQuery,
        marketScope: archiveMarket,
        briefingType: archiveType,
        dateFrom: archiveStart,
        dateTo: archiveEnd,
      });
      const payload = await getJson<BriefingArchivePayload>(`/api/briefings/index?${params}`);
      setArchive(payload);
      updateReactAgentContext({ surface: "briefing", viewId: "briefing", reportKind: "", reportId: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "브리핑 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [archiveEnd, archiveMarket, archiveQuery, archiveStart, archiveType]);

  useEffect(() => {
    loadArchive();
  }, [loadArchive]);

  useEffect(() => {
    const handleHashChange = () => {
      if (!isBriefingHash()) return;
      setDetailRoute(readBriefingDetailRoute());
    };
    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    let alive = true;
    async function loadDetail(date: string, scope: MarketScope) {
      setLoading(true);
      setError("");
      try {
        const payload = await getJson<Briefing>(`/api/briefings/${encodeURIComponent(date)}?includePersonal=true&marketScope=${encodeURIComponent(scope)}`);
        if (!alive) return;
        setBriefing(payload);
        updateReactAgentContext({
          surface: "briefing_reader",
          viewId: "briefing",
          reportKind: "briefing",
          reportId: date,
          marketScope: scope,
        });
      } catch (err) {
        if (!alive) return;
        setBriefing(null);
        setError(err instanceof Error ? err.message : "브리핑을 불러오지 못했습니다.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    if (detailRoute) {
      loadDetail(detailRoute.date, detailRoute.scope);
    } else {
      setBriefing(null);
      updateReactAgentContext({ surface: "briefing", viewId: "briefing", reportKind: "", reportId: "" });
    }
    return () => {
      alive = false;
    };
  }, [detailRoute]);

  async function exportBriefing(target: "notion" | "obsidian") {
    const date = briefing?.date || detailRoute?.date || "";
    const scope = normalizedScope(briefing?.marketScope || detailRoute?.scope);
    if (!date) return;
    setActionBusy(target);
    setActionStatus(target === "notion" ? "Notion에 내보내는 중..." : "Obsidian에 내보내는 중...");
    try {
      const result = target === "notion"
        ? await postJson<ExportResult>(`/api/briefings/${encodeURIComponent(date)}/export-notion?marketScope=${encodeURIComponent(scope)}`, { marketScope: scope })
        : await postJson<ExportResult>(`/api/briefings/${encodeURIComponent(date)}/export-obsidian?marketScope=${encodeURIComponent(scope)}`, { marketScope: scope });
      if (target === "notion") {
        setActionStatus(result.notionUrl ? `Notion 내보냄: ${result.title || result.notionUrl}` : "Notion에 내보냈습니다.");
      } else {
        setActionStatus(`Obsidian 내보냄: ${result.filename || date}`);
      }
    } catch (err) {
      setActionStatus(err instanceof Error ? err.message : "내보내기에 실패했습니다.");
    } finally {
      setActionBusy("");
    }
  }

  async function generatePersonalOverlay() {
    const date = briefing?.date || detailRoute?.date || "";
    const scope = normalizedScope(briefing?.marketScope || detailRoute?.scope);
    if (!date) return;
    setActionBusy("overlay");
    setActionStatus("개인 해석을 생성하는 중...");
    try {
      const response = await postJson<OverlayResult | AgentJob>(`/api/briefings/${encodeURIComponent(date)}/personal-overlay?marketScope=${encodeURIComponent(scope)}`, {
        marketScope: scope,
      });
      if (isAgentJob(response)) await pollAgentJob(response);
      const updated = await getJson<Briefing>(`/api/briefings/${encodeURIComponent(date)}?includePersonal=true&marketScope=${encodeURIComponent(scope)}`);
      setBriefing(updated);
      setActionStatus("개인 해석을 생성했습니다.");
    } catch (err) {
      setActionStatus(err instanceof Error ? err.message : "개인 해석 생성에 실패했습니다.");
    } finally {
      setActionBusy("");
    }
  }

  async function deleteBriefing(date: string, scope: MarketScope) {
    if (!date) return;
    if (!window.confirm(`${date} ${SCOPE_LABELS[scope]} 브리핑을 삭제할까요?`)) return;
    setActionBusy(`delete-${date}-${scope}`);
    try {
      const query = scope === "both" ? "" : `?market=${encodeURIComponent(scope)}`;
      await fetch(`/api/briefings/${encodeURIComponent(date)}${query}`, { method: "DELETE" });
      await loadArchive();
    } catch (err) {
      setError(err instanceof Error ? err.message : "브리핑 삭제에 실패했습니다.");
    } finally {
      setActionBusy("");
    }
  }

  async function generateBriefing(targetDate?: string) {
    setGenerating(true);
    setError("");
    try {
      const strictDate = Boolean(targetDate);
      const response = await postJson<Briefing | AgentJob>("/api/briefings", {
        date: targetDate || undefined,
        strictDate,
        marketScope,
        briefingType,
      });
      if (isAgentJob(response)) {
        const done = await pollAgentJob(response);
        const date = done.result?.date || done.result?.artifactId || targetDate || "";
        await loadArchive();
        if (date) setBriefingHash(date, marketScope);
        return;
      }
      const date = response.date || targetDate || "";
      await loadArchive();
      if (date) setBriefingHash(date, normalizedScope(response.marketScope || marketScope));
    } catch (err) {
      setError(err instanceof Error ? err.message : "브리핑 생성에 실패했습니다.");
    } finally {
      setGenerating(false);
    }
  }

  const items = archive?.items || [];
  const filteredItems = useMemo(() => {
    const q = normalizeText(archiveQuery);
    return items.filter((item) => {
      const date = displayDate(item);
      const scope = displayScope(item);
      const type = item.briefingType || "default";
      if (archiveMarket !== "all" && scope !== archiveMarket) return false;
      if (archiveType !== "all" && type !== archiveType) return false;
      if (archiveStart && date && date < archiveStart) return false;
      if (archiveEnd && date && date > archiveEnd) return false;
      if (!q) return true;
      const haystack = normalizeText([
        item.title,
        date,
        item.sessionDate,
        item.generatedAt,
        type,
        ...(item.tags || []),
      ].filter(Boolean).join(" "));
      return haystack.includes(q);
    });
  }, [archiveEnd, archiveMarket, archiveQuery, archiveStart, archiveType, items]);
  const visibleGroups = useMemo(() => {
    const sorted = [...filteredItems].sort((a, b) => String(displayDate(b) || b.generatedAt || "").localeCompare(String(displayDate(a) || a.generatedAt || "")));
    if (archiveView === "recent") {
      if (!sorted.length) return [];
      return [{ label: `최근 브리핑 ${Math.min(sorted.length, RECENT_BRIEFING_LIMIT)}건`, rows: sorted.slice(0, RECENT_BRIEFING_LIMIT) }];
    }
    if (archiveView === "month") {
      const byMonth = new Map<string, BriefingArchiveItem[]>();
      for (const item of sorted) {
        const key = formatArchiveMonth(displayDate(item));
        if (!byMonth.has(key)) byMonth.set(key, []);
        byMonth.get(key)?.push(item);
      }
      return Array.from(byMonth.entries()).map(([label, rows]) => ({ label, rows }));
    }
    const order: MarketScope[] = ["us", "kr", "both"];
    return order
      .map((scope) => ({
        label: `${SCOPE_LABELS[scope]} 시장`,
        rows: sorted.filter((item) => displayScope(item) === scope),
      }))
      .filter((group) => group.rows.length > 0);
  }, [archiveView, filteredItems]);
  const readerContent = useMemo(() => splitReportTitle(briefing?.markdown || "", briefing?.title || "시장 브리핑"), [briefing?.markdown, briefing?.title]);

  if (detailRoute && briefing) {
    return (
      <div className="react-briefing-route" data-briefing-route>
        {error && <p className="react-dashboard-error">{error}</p>}
        <ReportReaderShell
          eyebrow={`DAILY BRIEFING · ${briefing.date || detailRoute.date}`}
          title={readerContent.title}
          agentContext={{
            surface: "briefing_reader",
            viewId: "briefing",
            reportKind: "briefing",
            reportId: briefing.date || detailRoute.date,
            marketScope: normalizedScope(briefing.marketScope || detailRoute.scope),
          }}
          breadcrumb={(
            <>
              <button type="button" onClick={() => setBriefingHash()}>
                브리핑
              </button>
              <span>{readerContent.title}</span>
            </>
          )}
          onClose={() => setBriefingHash()}
          actionSlot={(
            <>
              <ReaderActionGroup title="AI">
                <ReaderActionButton
                  icon="agent"
                  onClick={() => openReactAgentDock({
                    surface: "briefing_reader",
                    reportKind: "briefing",
                    reportId: briefing.date || detailRoute.date,
                    marketScope: normalizedScope(briefing.marketScope || detailRoute.scope),
                    message: `${readerContent.title}의 핵심과 투자 판단 체크포인트를 요약해줘.`,
                    autoSubmit: true,
                  })}
                >
                  Agent에게 묻기
                </ReaderActionButton>
              </ReaderActionGroup>
              <ReaderActionGroup title="노트">
                <ReaderActionButton icon="link" disabled={actionBusy === "overlay"} onClick={generatePersonalOverlay}>
                  {actionBusy === "overlay" ? "생성 중" : "내 노트와 연결"}
                </ReaderActionButton>
              </ReaderActionGroup>
              <ReaderActionGroup title="내보내기">
                <ReaderActionButton icon="notion" disabled={actionBusy === "notion"} onClick={() => exportBriefing("notion")}>
                  {actionBusy === "notion" ? "내보내는 중" : "Notion으로 내보내기"}
                </ReaderActionButton>
                <ReaderActionButton icon="obsidian" disabled={actionBusy === "obsidian"} onClick={() => exportBriefing("obsidian")}>
                  {actionBusy === "obsidian" ? "내보내는 중" : "Obsidian으로 내보내기"}
                </ReaderActionButton>
              </ReaderActionGroup>
              {actionStatus && <p className="react-reader-status">{actionStatus}</p>}
            </>
          )}
          noteIdentity={briefingNoteIdentity(
            briefing.date || detailRoute.date,
            normalizedScope(briefing.marketScope || detailRoute.scope),
          )}
          noteLinkedTitle={readerContent.title}
          noteOverlayMarkdown={briefing.personalOverlay?.markdown || ""}
        >
          <ReportBody
            markdown={readerContent.body || briefing.markdown || ""}
            marketScope={normalizedScope(briefing.marketScope || detailRoute.scope)}
            briefing={briefing}
            sourcePanelHtml={legacyBridge().briefingSourcePanelHtml?.(briefing) || ""}
          />
        </ReportReaderShell>
      </div>
    );
  }

  return (
    <div className="react-briefing-route" data-briefing-route>
      <RouteHero
        eyebrow="Briefing"
        title="브리핑"
        description="수집된 최신 뉴스와 시장 데이터를 바탕으로 미국장과 한국장 흐름을 요약합니다."
      />

      <section className="brief-gen-box input-panel react-briefing-generation" aria-label="브리핑 생성">
        <section className="brief-gen-panel brief-gen-settings">
          <div className="brief-gen-panel-head">
            <h3>브리핑 설정</h3>
          </div>
          <div className="brief-gen-settings-row">
            <div className="brief-gen-field brief-gen-market-field">
              <div className="brief-market-segment" role="radiogroup" aria-label="시장 범위" data-scope={marketScope}>
                <span className="brief-market-segment-title">시장</span>
                {([
                  ["both", "종합"],
                  ["us", "미국장"],
                  ["kr", "한국장"],
                ] as Array<[MarketScope, string]>).map(([value, label]) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="reactBriefingMarketScope"
                      value={value}
                      checked={marketScope === value}
                      onChange={() => setMarketScope(value)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <label className="gen-option quality-option">
              <span>유형</span>
              <select value={briefingType} onChange={(event) => setBriefingType(event.currentTarget.value)}>
                {Object.entries(BRIEFING_TYPE_LABELS).map(([value, label]) => (
                  <option value={value} key={value}>{label}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="brief-gen-actionbar">
            <button className="filter-btn clear icon-btn" type="button" onClick={loadArchive} disabled={loading} aria-label="새로고침" data-tooltip="새로고침">
              ↻
            </button>
            <button className="filter-btn apply" type="button" onClick={() => generateBriefing()} disabled={generating}>
              {generating ? "생성 중" : "오늘 브리핑 생성"}
            </button>
            <span className="brief-gen-actionbar-divider" aria-hidden="true" />
            <input
              type="date"
              value={briefingDate}
              onChange={(event) => setBriefingDate(event.currentTarget.value)}
              aria-label="생성할 브리핑 날짜"
            />
            <button className="filter-btn clear" type="button" onClick={() => generateBriefing(briefingDate)} disabled={generating || !briefingDate}>
              이 날짜로 생성
            </button>
          </div>
        </section>
      </section>

      {error && <p className="react-dashboard-error">{error}</p>}

      <section className="input-panel react-briefing-archive-panel report-feed-controls" aria-label="저장 브리핑 검색">
        <div className="briefing-archive-filters">
          <label>
            <span>검색</span>
            <input
              type="search"
              value={archiveQuery}
              onChange={(event) => setArchiveQuery(event.currentTarget.value)}
              placeholder="제목·요약·본문 검색"
            />
          </label>
          <label>
            <span>시작일</span>
            <input type="date" value={archiveStart} onChange={(event) => setArchiveStart(event.currentTarget.value)} />
          </label>
          <label>
            <span>종료일</span>
            <input type="date" value={archiveEnd} onChange={(event) => setArchiveEnd(event.currentTarget.value)} />
          </label>
          <button
            className="filter-btn clear"
            type="button"
            onClick={() => {
              setArchiveQuery("");
              setArchiveMarket("all");
              setArchiveType("all");
              setArchiveStart("");
              setArchiveEnd("");
              setArchiveView("recent");
            }}
          >
            초기화
          </button>
        </div>
        <div className="briefing-archive-summary">
          <span>{filteredItems.length}건</span>
          <span aria-live="polite">{loading ? "불러오는 중..." : archiveQuery ? "검색 결과" : ""}</span>
        </div>
      </section>
      <div className="report-feed-outside-controls" aria-label="브리핑 표시 옵션">
        <div className="report-feed-view-row">
          <span>시장</span>
          <label className="report-feed-view-pill">
            <select value={archiveMarket} onChange={(event) => setArchiveMarket(event.currentTarget.value as ArchiveMarketFilter)}>
              <option value="all">전체</option>
              <option value="us">미국장</option>
              <option value="kr">한국장</option>
              <option value="both">종합 보고서</option>
            </select>
          </label>
          <span>유형</span>
          <label className="report-feed-view-pill">
            <select value={archiveType} onChange={(event) => setArchiveType(event.currentTarget.value)}>
              <option value="all">전체</option>
              {Object.entries(BRIEFING_TYPE_LABELS).map(([value, label]) => (
                <option value={value} key={value}>{label}</option>
              ))}
            </select>
          </label>
          <span>보기</span>
          <label className="report-feed-view-pill">
            <select value={archiveView} onChange={(event) => setArchiveView(event.currentTarget.value as ArchiveViewMode)}>
              <option value="recent">최근</option>
              <option value="month">월별</option>
              <option value="market">시장별</option>
            </select>
          </label>
        </div>
      </div>

      {/* 레거시 briefing-archive-card 클래스를 그대로 재사용해 디자인 언어를 통일한다. */}
      <section className="briefing-archive-feed" aria-label="저장 브리핑">
        {visibleGroups.length ? visibleGroups.map((group) => (
          <div className="briefing-archive-date-group" key={group.label}>
            <h3>{group.label}</h3>
            {group.rows.map((item) => {
              const view = archiveCardView(item);
              const deleting = actionBusy === `delete-${view.date}-${view.scope}`;
              return (
                <div className="briefing-archive-card-wrap" key={item.id || `${view.date}-${view.scope}`}>
                  <button
                    type="button"
                    className={`briefing-archive-card is-${view.scope}`}
                    onClick={() => view.date && setBriefingHash(view.date, view.scope)}
                  >
                    <span className="briefing-archive-card-meta">
                      <span className="briefing-archive-market">{MARKET_BADGE[view.scope]}</span>
                      {view.chips.map((chip) => (
                        <span className="briefing-archive-chip" key={chip}>{chip}</span>
                      ))}
                    </span>
                    <strong>{view.title}</strong>
                    <span className="briefing-archive-card-foot">{view.foot}</span>
                  </button>
                  <button
                    type="button"
                    className="briefing-archive-card-delete"
                    disabled={deleting}
                    onClick={() => deleteBriefing(view.date, view.scope)}
                    aria-label={`${view.date} 브리핑 삭제`}
                    data-tooltip="삭제"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M2.5 4h11M6 4V2.5h4V4M5 4l.5 9h5L11 4" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )) : (
          <div className="briefing-archive-empty">조건에 맞는 저장 브리핑이 없습니다.</div>
        )}
      </section>
    </div>
  );
}
