import { useCallback, useEffect, useMemo, useState } from "react";
import { getJson, postJson } from "../api";
import { updateReactAgentContext } from "./agentContext";
import { RouteHero } from "./RouteHero";

type RssItem = {
  title?: string;
  url?: string;
  description?: string;
  media?: string;
  source?: string;
  markets?: string[] | string;
  market?: string;
  timestamp?: string;
  date?: string;
};

type RssPayload = {
  items?: RssItem[];
  total?: number;
  offset?: number;
  limit?: number;
  has_more?: boolean;
  sources?: string[];
};

type RssFilters = {
  start: string;
  end: string;
  source: string;
  market: string;
};

type SearchDocument = {
  title?: string;
  headline?: string;
  url?: string;
  sourceUrl?: string;
  link?: string;
  summary?: string;
  snippet?: string;
  text?: string;
  content?: string;
  media?: string;
  source?: string;
  collector?: string;
  timestamp?: string;
  date?: string;
  publishedAt?: string;
  published?: string;
  path?: string;
};

type AgentJob = {
  id: string;
  kind?: string;
  status: "queued" | "running" | "done" | "failed" | "cancelled";
  message?: string;
  error?: string;
  result?: Record<string, unknown>;
};

const EMPTY_FILTERS: RssFilters = { start: "", end: "", source: "", market: "" };
const pageSize = 20;
const MARKET_OPTIONS = [
  { value: "", label: "전체 시장" },
  { value: "US", label: "미국" },
  { value: "KR", label: "한국" },
  { value: "GLOBAL", label: "글로벌" },
];

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function displayTimestamp(item: RssItem) {
  const raw = item.timestamp || item.date || "";
  if (!raw) return "시간 정보 없음";
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? raw : parsed.toLocaleString("ko-KR");
}

function filterLabel(filters: RssFilters) {
  const parts = [
    filters.start ? `${filters.start} 이후` : "",
    filters.end ? `${filters.end} 이전` : "",
    filters.source ? filters.source : "",
    filters.market ? MARKET_OPTIONS.find((item) => item.value === filters.market)?.label || filters.market : "",
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "전체 RSS 피드";
}

function buildParams(page: number, filters: RssFilters) {
  const params = new URLSearchParams({
    offset: String((Math.max(1, page) - 1) * pageSize),
    limit: String(pageSize),
  });
  if (filters.start) params.set("start", filters.start);
  if (filters.end) params.set("end", filters.end);
  if (filters.source) params.set("source", filters.source);
  if (filters.market) params.set("market", filters.market);
  return params;
}

function normalizeMarketTags(item: Pick<RssItem, "markets" | "market">) {
  const rawMarkets = item.markets;
  const values = Array.isArray(rawMarkets)
    ? rawMarkets
    : typeof rawMarkets === "string"
      ? rawMarkets.split(",")
      : String(item.market || "").split(",");
  const seen = new Set<string>();
  return values
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .filter((value) => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
}

async function pollJob(job: AgentJob): Promise<AgentJob> {
  let current = job;
  while (["queued", "running"].includes(current.status)) {
    await sleep(1000);
    current = await getJson<AgentJob>(`/api/jobs/${encodeURIComponent(current.id)}`);
  }
  if (current.status !== "done") {
    throw new Error(current.message || current.error || "RSS 수집 작업에 실패했습니다.");
  }
  return current;
}

function stableItemKey(item: RssItem, index: number) {
  return item.url || `${item.title || "rss"}-${item.timestamp || item.date || index}`;
}

function mapSearchDocument(doc: SearchDocument): RssItem {
  return {
    title: doc.title || doc.headline || doc.path || "검색 결과",
    url: doc.url || doc.sourceUrl || doc.link || "",
    description: doc.summary || doc.snippet || doc.text || doc.content || "",
    media: doc.media || doc.source || doc.collector || "",
    source: doc.source || doc.media || doc.collector || "",
    markets: normalizeMarketTags({
      markets: (doc as { markets?: unknown }).markets as RssItem["markets"],
      market: String((doc as { market?: string }).market || ""),
    }),
    market: String((doc as { market?: string }).market || ""),
    timestamp: doc.timestamp || doc.date || doc.publishedAt || doc.published || "",
    date: doc.date || doc.publishedAt || doc.published || doc.timestamp || "",
  };
}

export function RssRoute() {
  const [indexedCount, setIndexedCount] = useState<number | null>(null);
  const [payload, setPayload] = useState<RssPayload | null>(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<RssFilters>(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] = useState<RssFilters>(EMPTY_FILTERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const items = payload?.items || [];
  const total = payload?.total ?? items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const sources = useMemo(() => payload?.sources || [], [payload?.sources]);

  const loadItems = useCallback(async (nextPage = page, nextFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      const params = buildParams(nextPage, nextFilters);
      const nextPayload = await getJson<RssPayload>(`/api/rss/items?${params.toString()}`);
      setPayload(nextPayload);
      setPage(nextPage);
      setFilters(nextFilters);
      setDraftFilters(nextFilters);
      updateReactAgentContext({ surface: "rss", viewId: "rssfeed", reportKind: "", reportId: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "RSS 피드를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  const refreshIndexedCount = useCallback(async () => {
    try {
      const dashboard = await getJson<{ index?: { newsCount?: number; count?: number } }>("/api/dashboard");
      const count = dashboard.index?.newsCount ?? dashboard.index?.count;
      if (Number.isFinite(Number(count))) setIndexedCount(Number(count));
    } catch {
      // 색인 수치 조회 실패는 피드 로딩과 무관하므로 조용히 무시한다.
    }
  }, []);

  useEffect(() => {
    loadItems(1, filters);
    refreshIndexedCount();
    // 첫 진입 시 한 번만 현재 필터를 로드한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draftFilters.start && draftFilters.end && draftFilters.start > draftFilters.end) {
      setError("시작 시간은 종료 시간보다 앞서야 합니다.");
      return;
    }
    setStatus("");
    await loadItems(1, draftFilters);
  }

  async function applyMarketFilter(nextMarket: string) {
    setStatus("");
    await loadItems(1, { ...filters, market: nextMarket });
  }

  async function clearFilters() {
    setStatus("");
    setSearchQuery("");
    setDraftFilters(EMPTY_FILTERS);
    await loadItems(1, EMPTY_FILTERS);
  }

  async function searchNews(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setError("검색어를 입력해 주세요.");
      return;
    }
    setSearching(true);
    setError("");
    setStatus("");
    try {
      const params = new URLSearchParams({ query, scope: "news", limit: "50" });
      const result = await getJson<SearchDocument[] | { items?: SearchDocument[] }>(`/api/search?${params.toString()}`);
      const rows = Array.isArray(result) ? result : result.items || [];
      setPayload({
        items: rows.map(mapSearchDocument),
        total: rows.length,
        offset: 0,
        limit: rows.length,
        has_more: false,
        sources,
      });
      setPage(1);
      setStatus(`뉴스 검색 결과 ${rows.length}개`);
      updateReactAgentContext({ surface: "rss", viewId: "rssfeed", reportKind: "news_search", reportId: query });
    } catch (err) {
      setError(err instanceof Error ? err.message : "뉴스 검색에 실패했습니다.");
    } finally {
      setSearching(false);
    }
  }

  async function importRss() {
    setImporting(true);
    setError("");
    setStatus("RSS 수집 작업을 시작했습니다.");
    try {
      const job = await postJson<AgentJob>("/api/rssarchive/import", {});
      const done = await pollJob(job);
      const added = Number.isFinite(Number(done.result?.added)) ? ` 신규 ${done.result?.added}개` : "";
      setStatus(`RSS 수집 완료.${added}`);
      await loadItems(1, filters);
      await refreshIndexedCount();
    } catch (err) {
      setError(err instanceof Error ? err.message : "RSS 수집에 실패했습니다.");
      setStatus("");
    } finally {
      setImporting(false);
    }
  }

  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const pageStart = Math.max(1, currentPage - 2);
  const pageEnd = Math.min(totalPages, currentPage + 2);

  return (
    <div className="react-rss-route" data-rss-route>
      <RouteHero
        eyebrow="RSS Feed"
        title="RSS 피드"
        description="수집한 기사와 원천 자료를 시간, 출처, 키워드로 빠르게 훑습니다."
        actions={(
          <div className="react-rss-hero-actions">
            <span className="react-rss-stat-pill">
              <strong>LOADED</strong>
              {total > 0 ? `${total}개 · ${currentPage}/${totalPages}` : "0개"}
            </span>
            <span className="react-rss-stat-pill">
              <strong>INDEXED</strong>
              {indexedCount === null ? "…" : `${indexedCount}개 문서`}
            </span>
            <button type="button" onClick={importRss} disabled={importing}>
              {importing ? "수집 중" : "RSS 수집/가져오기"}
            </button>
          </div>
        )}
      />

      <section className="react-rss-control-panel react-rss-filter-panel" aria-label="RSS 필터">
        <div className="react-rss-panel-head">
          <div>
            <h2>피드 필터</h2>
            <p>시간 범위와 소스를 선택해 RSS 피드를 필터링합니다. 시간은 UTC+9 기준입니다.</p>
          </div>
          <button className="react-rss-period-action" type="button" onClick={clearFilters} disabled={loading}>
            전체 기간
          </button>
        </div>
        <form className="react-rss-filter-grid" onSubmit={applyFilters}>
          <label>
            <span>시작</span>
            <input
              type="datetime-local"
              value={draftFilters.start}
              onChange={(event) => setDraftFilters((current) => ({ ...current, start: event.currentTarget.value }))}
            />
          </label>
          <label>
            <span>종료</span>
            <input
              type="datetime-local"
              value={draftFilters.end}
              onChange={(event) => setDraftFilters((current) => ({ ...current, end: event.currentTarget.value }))}
            />
          </label>
          <label>
            <span>소스</span>
            <select
              value={draftFilters.source}
              onChange={(event) => setDraftFilters((current) => ({ ...current, source: event.currentTarget.value }))}
            >
              <option value="">전체 소스</option>
              {sources.map((source) => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </label>
          <div className="react-rss-filter-actions">
            <button className="react-rss-primary-action" type="submit" disabled={loading}>필터 적용</button>
            <button className="react-rss-secondary-action" type="button" onClick={clearFilters} disabled={loading}>초기화</button>
          </div>
        </form>
      </section>

      <section className="react-rss-control-panel react-rss-search-panel" aria-label="뉴스 검색">
        <div className="react-rss-panel-head">
          <div>
            <h2>뉴스 검색</h2>
            <p>기업, 티커, 섹터, 시장 이슈 기준으로 RSS와 수동 저장 기사를 검색합니다.</p>
          </div>
        </div>
        <form className="react-rss-search-form" onSubmit={searchNews}>
          <input
            type="search"
            value={searchQuery}
            placeholder="기업, 티커, 섹터 또는 이슈"
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
          />
          <button className="react-rss-primary-action" type="submit" disabled={searching}>
            {searching ? "검색 중" : "검색"}
          </button>
        </form>
      </section>

      <div className="react-rss-summary">
        <strong>{filterLabel(filters)}</strong>
        <span>{total > 0 ? `${total}개 · ${currentPage}/${totalPages}` : "0개"}</span>
      </div>

      {error && <p className="react-dashboard-error">{error}</p>}
      {status && <p className="react-dashboard-warning">{status}</p>}

      <div className="report-feed-outside-controls react-rss-market-controls" aria-label="RSS 표시 옵션">
        <div className="report-feed-view-row">
          <span>시장</span>
          <label className="report-feed-view-pill">
            <select
              value={filters.market}
              onChange={(event) => applyMarketFilter(event.currentTarget.value)}
              disabled={loading}
            >
              {MARKET_OPTIONS.map((option) => (
                <option key={option.value || "all-market"} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <section className="react-rss-feed" aria-label="RSS feed items">
        {items.length ? items.map((item, index) => {
          const key = stableItemKey(item, index);
          const description = String(item.description || "").trim();
          const marketTags = normalizeMarketTags(item);
          return (
            <article className="react-rss-card" key={key}>
              <div className="react-rss-card-main">
                <h2>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noopener noreferrer">{item.title || "제목 없음"}</a>
                  ) : item.title || "제목 없음"}
                </h2>
                <div className="react-rss-card-meta">
                  {(item.media || item.source) && <span className="pill">{item.media || item.source}</span>}
                  {marketTags.length ? (
                    <span className="pill">{marketTags.join(" · ")}</span>
                  ) : null}
                  <span>{displayTimestamp(item)}</span>
                </div>
                {description && <p>{description}</p>}
              </div>
              <div className="react-rss-card-actions">
                {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer">기사 열기</a>}
              </div>
            </article>
          );
        }) : (
          <article className="react-dashboard-panel">
            <h2>{loading ? "불러오는 중" : "표시할 RSS 피드가 없습니다."}</h2>
            <p>{loading ? "수집된 항목을 확인하고 있습니다." : "RSS 수집을 실행하거나 필터를 초기화해 보세요."}</p>
          </article>
        )}
      </section>

      {totalPages > 1 && (
        <nav className="react-rss-pagination" aria-label="RSS pagination">
          <button type="button" disabled={currentPage === 1 || loading} onClick={() => loadItems(currentPage - 1, filters)}>
            이전
          </button>
          {pageStart > 1 && (
            <>
              <button type="button" onClick={() => loadItems(1, filters)}>1</button>
              {pageStart > 2 && <span>...</span>}
            </>
          )}
          {Array.from({ length: pageEnd - pageStart + 1 }, (_, index) => pageStart + index).map((pageNumber) => (
            <button
              type="button"
              key={pageNumber}
              className={pageNumber === currentPage ? "active" : ""}
              disabled={loading}
              onClick={() => loadItems(pageNumber, filters)}
            >
              {pageNumber}
            </button>
          ))}
          {pageEnd < totalPages && (
            <>
              {pageEnd < totalPages - 1 && <span>...</span>}
              <button type="button" onClick={() => loadItems(totalPages, filters)}>{totalPages}</button>
            </>
          )}
          <button type="button" disabled={currentPage === totalPages || loading} onClick={() => loadItems(currentPage + 1, filters)}>
            다음
          </button>
        </nav>
      )}
    </div>
  );
}
