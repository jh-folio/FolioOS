import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getJson, postJson } from "../api";
import { openReactAgentDock, updateReactAgentContext } from "./agentContext";
import { RouteHero } from "./RouteHero";

type WatchlistOverviewItem = {
  item?: string;
  ticker?: string;
  companyName?: string;
  name?: string;
  tags?: string[];
  count?: number;
};

type WatchlistCompany = {
  name?: string;
  ticker?: string;
  market?: string;
  tradingViewSymbol?: string;
};

type WatchlistNews = {
  source?: string;
  date?: string;
  title?: string;
  url?: string;
  path?: string;
  snippet?: string;
};

type WatchlistDetail = {
  item?: string;
  company?: WatchlistCompany;
  news?: WatchlistNews[];
  newsCount?: number;
  warnings?: string[];
};

function normalizeItems(items: unknown[]) {
  const seen = new Set<string>();
  return items
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function cardTicker(item: WatchlistOverviewItem) {
  return item.ticker || item.item || "";
}

function cardCompanyName(item: WatchlistOverviewItem) {
  return item.companyName || item.name || item.item || cardTicker(item);
}

function detailLabel(detail: WatchlistDetail | null, fallback = "") {
  return detail?.company?.name || detail?.item || fallback || "상세 보기";
}

function detailMeta(detail: WatchlistDetail | null) {
  if (!detail) return "상세 정보를 불러오는 중입니다.";
  const company = detail.company || {};
  return [
    company.ticker || "",
    company.market || "",
    company.tradingViewSymbol || "",
    detail.newsCount ? `${detail.newsCount}개 뉴스` : "",
  ].filter(Boolean).join(" · ") || "확인된 심볼 정보가 없습니다.";
}

function sortNewsLatestFirst(news: WatchlistNews[] = []) {
  return [...news].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
}

function newsTitle(news: WatchlistNews) {
  return news.title || news.url || news.path || "자료";
}

function sourceLabel(news: WatchlistNews) {
  return [news.source, news.date].filter(Boolean).join(" · ");
}

function setWatchlistHash(item?: string) {
  window.location.hash = item ? `#/watchlist/${encodeURIComponent(item)}` : "#/watchlist";
}

function readWatchlistDetailItem() {
  const match = window.location.hash.match(/^#\/?watchlist\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : "";
}

function isWatchlistHash() {
  return window.location.hash.replace(/^#\/?/, "").split("/")[0] === "watchlist";
}

export function WatchlistRoute() {
  const [items, setItems] = useState<string[]>([]);
  const [cards, setCards] = useState<WatchlistOverviewItem[]>([]);
  const [keyword, setKeyword] = useState("");
  const [detailItem, setDetailItem] = useState(() => readWatchlistDetailItem());
  const [detail, setDetail] = useState<WatchlistDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const widgetsRef = useRef<HTMLDivElement | null>(null);

  const loadOverview = useCallback(async (nextItems: string[]) => {
    if (!nextItems.length) {
      setCards([]);
      return;
    }
    const overview = await getJson<{ items?: WatchlistOverviewItem[] }>("/api/watchlist/overview");
    setCards(Array.isArray(overview.items) ? overview.items : []);
  }, []);

  const loadWatchlist = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await getJson<string[]>("/api/watchlist");
      const normalized = normalizeItems(Array.isArray(payload) ? payload : []);
      setItems(normalized);
      await loadOverview(normalized);
      updateReactAgentContext({ surface: "watchlist", viewId: "watchlist", reportKind: "", reportId: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "워치리스트를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [loadOverview]);

  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  useEffect(() => {
    const handleHashChange = () => {
      if (!isWatchlistHash()) return;
      setDetailItem(readWatchlistDetailItem());
    };
    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    let alive = true;
    async function loadDetail(item: string) {
      setDetailLoading(true);
      setError("");
      setDetail({ item });
      updateReactAgentContext({ surface: "watchlist_detail", viewId: "watchlist", reportKind: "watchlist", reportId: item, marketScope: "" });
      try {
        const payload = await getJson<WatchlistDetail>(`/api/watchlist/detail?item=${encodeURIComponent(item)}&limit=12`);
        if (!alive) return;
        setDetail(payload);
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "상세 정보를 불러오지 못했습니다.");
      } finally {
        if (alive) setDetailLoading(false);
      }
    }

    if (detailItem) {
      loadDetail(detailItem);
    } else {
      setDetail(null);
      updateReactAgentContext({ surface: "watchlist", viewId: "watchlist", reportKind: "", reportId: "" });
    }
    return () => {
      alive = false;
    };
  }, [detailItem]);

  useEffect(() => {
    const target = widgetsRef.current;
    if (!target || !detail || detailLoading) return undefined;
    window.FolioTradingViewWidgets?.cleanup?.(target);
    target.innerHTML = '<div class="tradingview-widget-unavailable">TradingView 위젯을 준비하는 중입니다.</div>';
    window.FolioTradingViewWidgets?.renderWatchlistDetail?.(target, detail);
    return () => {
      window.FolioTradingViewWidgets?.cleanup?.(target);
    };
  }, [detail, detailLoading]);

  async function persistWatchlist(nextItems: string[], message?: string) {
    setSaving(true);
    setError("");
    try {
      const saved = await postJson<string[]>("/api/watchlist", { items: nextItems });
      const normalized = normalizeItems(Array.isArray(saved) ? saved : []);
      setItems(normalized);
      await loadOverview(normalized);
      if (message) setStatus(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "워치리스트 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function resolveKeyword(raw: string) {
    try {
      const result = await getJson<{ keyword?: string }>(`/api/watchlist/resolve?keyword=${encodeURIComponent(raw)}`);
      return result.keyword || raw;
    } catch {
      return raw;
    }
  }

  async function addKeyword() {
    const parts = keyword.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean);
    if (!parts.length) return;
    const next = [...items];
    for (const raw of parts) {
      const resolved = await resolveKeyword(raw);
      if (resolved && !next.some((existing) => existing.toLowerCase() === resolved.toLowerCase())) next.push(resolved);
    }
    setKeyword("");
    if (next.length === items.length) return;
    await persistWatchlist(next, "워치리스트에 추가했습니다.");
  }

  async function removeItem(item: string) {
    await persistWatchlist(items.filter((row) => row !== item), "워치리스트에서 삭제했습니다.");
    if (detailItem === item) setWatchlistHash();
  }

  const newsRows = useMemo(() => sortNewsLatestFirst(detail?.news || []), [detail]);
  const selectedLabel = detailLabel(detail, detailItem);

  if (detailItem) {
    return (
      <div className="react-watchlist-route" data-watchlist-route>
        <div className="watchlist-detail-inline">
          <nav className="reader-breadcrumb" aria-label="현재 위치">
            <button type="button" className="reader-crumb-link" onClick={() => setWatchlistHash()}>워치리스트</button>
            <span className="reader-breadcrumb-sep" aria-hidden="true">›</span>
            <span className="reader-breadcrumb-leaf">{selectedLabel}</span>
          </nav>
          <section className="watchlist-detail-dialog" role="region" aria-labelledby="watchlistDetailTitle">
            <div className="watchlist-detail-head">
              <div>
                <p className="section-kicker">WATCHLIST</p>
                <h2 id="watchlistDetailTitle">{selectedLabel}</h2>
                <p className="section-subtitle">{detailMeta(detail)}</p>
              </div>
              <div className="watchlist-detail-actions">
                <button
                  type="button"
                  className="filter-btn clear"
                  onClick={() => openReactAgentDock({ surface: "watchlist_detail", reportKind: "watchlist", reportId: detailItem })}
                >
                  Agent에게 묻기
                </button>
                <button className="icon-btn" type="button" aria-label="닫기" data-tooltip="닫기" data-tooltip-pos="left" onClick={() => setWatchlistHash()}>×</button>
              </div>
            </div>
            {error && <p className="react-dashboard-error">{error}</p>}
            <div ref={widgetsRef} className="watchlist-detail-widgets">
              <div className="tradingview-widget-unavailable">TradingView 위젯을 준비하는 중입니다.</div>
            </div>
            <div className="watchlist-detail-news">
              <h3>수집한 뉴스</h3>
              {detailLoading ? (
                <p className="section-subtitle">관련 뉴스를 불러오는 중입니다.</p>
              ) : newsRows.length ? (
                <div className="watchlist-detail-news-list">
                  {newsRows.map((row, index) => (
                    <article className="compact-item" key={`${newsTitle(row)}-${index}`}>
                      <div className="meta">{sourceLabel(row)}</div>
                      <h4>
                        {row.url ? (
                          <a href={row.url} target="_blank" rel="noopener noreferrer">{newsTitle(row)}</a>
                        ) : (
                          <span>{newsTitle(row)}</span>
                        )}
                      </h4>
                      {row.snippet && <p>{row.snippet}</p>}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="section-subtitle">수집된 관련 뉴스가 없습니다.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="react-watchlist-route" data-watchlist-route>
      <RouteHero
        eyebrow="Watchlist"
        title="워치리스트"
        description="관심 기업, 섹터, 테마를 추적하고 관련 뉴스와 시장 반응을 확인합니다."
        actions={(
        <div className="brief-controls">
          <button className="filter-btn clear" type="button" onClick={loadWatchlist} disabled={loading}>
            {loading ? "불러오는 중" : "다시 읽기"}
          </button>
          <button className="filter-btn apply" type="button" onClick={() => persistWatchlist(items, "워치리스트를 저장했습니다.")} disabled={saving}>
            {saving ? "저장 중" : "저장"}
          </button>
        </div>
        )}
      />
      <div className="watchlist-editor input-panel">
        <div className="input-panel-header">
          <h3>키워드 추가</h3>
          <p>관심 기업, 섹터, 테마를 하나씩 추가해 뉴스와 브리핑 추적 범위를 관리합니다.</p>
        </div>
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addKeyword();
            }
          }}
          placeholder="예: NVDA, 삼성전자, AI"
        />
        <button className="filter-btn clear" type="button" onClick={addKeyword} disabled={saving}>추가</button>
      </div>
      {error && <p className="react-dashboard-error">{error}</p>}
      {status && <p className="react-dashboard-warning">{status}</p>}
      <div className="watchlist-grid">
        {cards.length ? cards.map((card) => {
          const item = card.item || cardCompanyName(card);
          return (
            <article
              className="watchlist-card"
              data-watchlist-detail-item={item}
              tabIndex={0}
              role="button"
              aria-label={`${item} 상세 보기`}
              key={item}
              onClick={() => setWatchlistHash(item)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setWatchlistHash(item);
                }
              }}
            >
              <span className="watchlist-card-accent" aria-hidden="true" />
              <button
                className="watchlist-card-delete"
                type="button"
                aria-label={`${item} 워치리스트에서 삭제`}
                data-tooltip="삭제"
                onClick={(event) => {
                  event.stopPropagation();
                  removeItem(item);
                }}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2.5 4h11M6 4V2.5h4V4M5 4l.5 9h5L11 4" />
                </svg>
              </button>
              <div className="watchlist-card-top">
                <strong className="watchlist-ticker">{cardTicker(card)}</strong>
                <h3>{cardCompanyName(card)}</h3>
              </div>
              <div className="watchlist-card-meta">
                {card.tags?.length ? (
                  <div className="tags">
                    {card.tags.slice(0, 5).map((tag) => <span className="tag" key={tag}>{tag}</span>)}
                  </div>
                ) : null}
                <span className="watchlist-news-count">{card.count || 0}건</span>
              </div>
            </article>
          );
        }) : (
          <div className="result">
            <p>워치리스트 항목을 저장하면 항목별 최신 뉴스 카드가 표시됩니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
