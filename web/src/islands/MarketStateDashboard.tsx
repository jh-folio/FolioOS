import { useCallback, useEffect, useState } from "react";
import { getJson } from "../api";
import { legacyBridge as bridge } from "../app/legacyBridge";

// Mirrors features/market_memory/state_dashboard.py::summarize_market_state.
interface Driver {
  id: string;
  title: string;
  status: string;
  momentum: string;
  momentumLabel: string;
  directionLabel?: string;
  directionTone?: string;
  confidence: string;
  confidencePct: number;
  interpretation: string;
  marketImpact?: string;
  rationale: string;
  whyItMatters?: string;
  evidenceSummary?: string;
  elaboration: string;
  evidenceCounts: { d7: number; d30: number; d90: number };
  linkedCompanies: string[];
  nextCheckpoint: string;
  whatToWatch?: string;
  nextMemoryCheck?: string;
  askAgentPrompt: string;
}

interface BriefItem {
  label: string;
  value: string;
}

interface Posture {
  label: string;
  tone: string;
  summary: string;
}

interface ActionGuide {
  headline: string;
  action: string;
  timing: string;
}

interface DashboardPayload {
  title: string;
  summary: string;
  plainConclusion?: string;
  reasonSummary?: string;
  sourceSummary?: string;
  source?: string;
  stance?: string;
  posture?: Posture;
  actionGuide?: ActionGuide;
  briefs?: BriefItem[];
  watchItems?: string[];
  drivers: Driver[];
  counterEvidence?: CheckItem[];
  uncertainties?: CheckItem[];
  sourceRefs?: Array<{ id?: string; title?: string; source?: string; date?: string; url?: string }>;
  snapshot?: { asOf?: string; status?: string; confidence?: number; marketRegime?: string };
  freshness?: { snapshotAsOf?: string; latestMemoryAt?: string; latestMemoryTitle?: string; stale?: boolean };
  marketViews?: Partial<Record<MarketScope, DashboardPayload>>;
}

const CONFIDENCE_LABELS: Record<string, string> = { high: "높음", medium: "보통", low: "낮음" };
type MarketScope = "overall" | "us" | "kr";
const MARKET_SCOPE_LABELS: Record<MarketScope, string> = { overall: "종합", us: "미국장", kr: "한국장" };
type CheckItem = string | { title?: string; summary?: string; sourceRefs?: string[] };

function splitNarrative(value: string) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  const parts = normalized.match(/[^.!?。]+[.!?。]?/g)?.map((part) => part.trim()).filter(Boolean) || [];
  return {
    lead: parts[0] || normalized,
    support: parts.slice(1, 3).join(" "),
  };
}

function displaySnapshotTime(value?: string) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

function signalTone(driver: Driver) {
  const direction = String(driver.directionLabel || "").trim();
  if (direction === "중립") return "neutral";
  if (direction === "혼재" || direction === "변동성") return "warning";
  if (direction === "도움" || direction === "부담 완화") return "positive";
  if (direction === "부담") return "negative";
  const label = `${driver.directionLabel || ""} ${driver.directionTone || ""}`.toLowerCase();
  if (/neutral|중립/.test(label)) return "neutral";
  if (/mixed|conflicted|혼재|변동성/.test(label)) return "warning";
  if (/support|positive|완화|호재|긍정|지지|강화|도움/.test(label)) return "positive";
  if (/risk|negative|부담|악화|위험|하방/.test(label)) return "negative";
  return "neutral";
}

function signalLabel(driver: Driver) {
  const label = String(driver.directionLabel || "").trim();
  if (!label || label === "도움") return "긍정 요인";
  if (label === "부담") return "부담 가중";
  if (label === "변동성") return "변동성 증가";
  return label;
}

function normalizeCheckItem(item: CheckItem) {
  const humanize = (value: string) => String(value || "")
    .replace(/marketTape와 macroSnapshot가 비어 있어 가격 검증이 약하다\.?/g, "가격·거시 데이터가 아직 충분하지 않아 뉴스 흐름을 숫자로 검증하기 어렵습니다.")
    .replace(/marketTape/g, "가격 데이터")
    .replace(/macroSnapshot/g, "거시 데이터")
    .trim();
  if (typeof item !== "string") {
    return {
      title: humanize(item.title || ""),
      summary: humanize(item.summary || ""),
      sourceRefs: item.sourceRefs || [],
    };
  }
  const raw = humanize(item.trim());
  const title = raw.match(/['"]title['"]:\s*['"]([^'"]+)['"]/)?.[1] || "";
  const summary = raw.match(/['"]summary['"]:\s*['"]([^'"]+)['"]/)?.[1] || "";
  const sourceRefsRaw = raw.match(/['"]sourceRefs['"]:\s*\[([^\]]*)\]/)?.[1] || "";
  const sourceRefs = sourceRefsRaw
    .split(",")
    .map((ref) => ref.replace(/['"]/g, "").trim())
    .filter(Boolean);
  return title || summary ? { title, summary, sourceRefs } : { title: "", summary: raw, sourceRefs: [] };
}

function CheckList({ items }: { items: CheckItem[] }) {
  return (
    <ul className="market-state-check-list">
      {items.slice(0, 5).map((item, index) => {
        const normalized = normalizeCheckItem(item);
        return (
          <li className="market-state-check-item" key={`${normalized.title || normalized.summary}-${index}`}>
            {normalized.title && <strong>{normalized.title}</strong>}
            {normalized.summary && <span>{normalized.summary}</span>}
            {normalized.sourceRefs.length ? <small>{normalized.sourceRefs.join(" · ")}</small> : null}
          </li>
        );
      })}
    </ul>
  );
}

function DriverCard({ driver }: { driver: Driver }) {
  const confidence = CONFIDENCE_LABELS[driver.confidence] || driver.confidence || "보통";
  const judgement = driver.interpretation;
  const impact = driver.marketImpact || driver.interpretation;
  const evidenceSummary = driver.evidenceSummary || driver.whyItMatters || driver.rationale;
  const nextMemoryCheck = driver.nextMemoryCheck || driver.whatToWatch || driver.nextCheckpoint;
  const showImpact = Boolean(impact && impact !== judgement && impact !== evidenceSummary);
  const detailItems = [
    evidenceSummary ? { label: "근거 요약", value: evidenceSummary } : null,
    showImpact ? { label: "시장 영향", value: impact } : null,
    nextMemoryCheck ? { label: "다음 확인", value: nextMemoryCheck } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;
  return (
    <article className={`market-driver-card momentum-${driver.momentum || "stable"}`}>
      <div className="market-driver-top">
        <h3>{driver.title}</h3>
        <div className="market-driver-chip-row">
          {driver.directionLabel && <span className={`market-direction-chip direction-${signalTone(driver)}`}>{signalLabel(driver)}</span>}
        </div>
      </div>
      {judgement && <p className="market-driver-summary">{judgement}</p>}
      {detailItems.length ? (
        <details className="market-driver-details">
          <summary>근거 보기</summary>
          <dl className="market-driver-detail-list">
            {detailItems.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        </details>
      ) : null}
      <footer>
        <small>
          확신도 {confidence}
          {driver.confidencePct ? ` · ${driver.confidencePct}%` : ""}
        </small>
        {/* The existing document-level [data-agent-prompt] handler in app.js opens the dock;
            .agent-logo-slot is filled by the shared applyAgentBranding bridge. */}
        <button
          type="button"
          className="agent-action agent-ask-btn"
          data-agent-prompt={driver.askAgentPrompt}
          data-tooltip="Agent에게 묻기"
          aria-label="Agent에게 묻기"
        >
          <span className="agent-logo-slot" aria-hidden="true" />
        </button>
      </footer>
    </article>
  );
}

interface MarketStateDashboardProps {
  onUpdate?: () => void;
  updating?: boolean;
}

export function MarketStateDashboard({ onUpdate, updating = false }: MarketStateDashboardProps = {}) {
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<MarketScope>("overall");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getJson<DashboardPayload>("/api/memory/state-dashboard?limit=5");
      setPayload(data);
      bridge().updateAgentContext?.({ surface: "market_state", viewId: "memory", reportKind: "", reportId: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Re-brand the Agent buttons this island rendered whenever content changes.
  useEffect(() => {
    bridge().applyAgentBranding?.();
  }, [payload]);

  const marketViews = payload?.marketViews || {};
  const availableMarkets = ["overall", "us", "kr"] as MarketScope[];
  const activeMarket = availableMarkets.includes(selectedMarket) ? selectedMarket : "overall";
  const activePayload = activeMarket === "overall" ? (marketViews.overall || payload) : (marketViews[activeMarket] || payload);
  const drivers = activePayload?.drivers ?? [];
  const visibleSummary = activePayload?.plainConclusion || activePayload?.summary || "";
  const reasonSummary = activePayload?.reasonSummary || activePayload?.sourceSummary || activePayload?.stance || "";
  const interpretation = splitNarrative(reasonSummary);
  const snapshotTime = displaySnapshotTime(activePayload?.snapshot?.asOf);
  const latestMemoryTime = displaySnapshotTime(payload?.freshness?.latestMemoryAt);
  const snapshotIsStale = Boolean(payload?.freshness?.stale);
  const briefs = activePayload?.briefs?.length
    ? activePayload.briefs
    : [
        { label: "현재 판단", value: visibleSummary },
        { label: "시장 해석", value: reasonSummary },
        { label: "행동 가이드", value: activePayload?.actionGuide?.action || activePayload?.stance || "" },
        { label: "다음 확인", value: activePayload?.actionGuide?.timing || (activePayload?.watchItems || []).slice(0, 3).join("; ") },
      ].filter((item) => item.value);
  return (
    <>
      <div className="market-state-head">
        <div>
          <p className="section-kicker">Market State</p>
          <h2>{activePayload?.title || payload?.title || "현재 중기 시장 상황"}</h2>
        </div>
        <div className="market-state-head-actions">
          {snapshotTime ? (
            <span className={`market-state-asof${snapshotIsStale ? " stale" : ""}`}>
              생성 {snapshotTime}
              {snapshotIsStale ? " · 최신 메모리 반영 전" : ""}
            </span>
          ) : null}
          {onUpdate ? (
            <button className="filter-btn apply" type="button" onClick={onUpdate} disabled={updating || loading}>
              {updating ? "업데이트 중" : "시장 메모리 업데이트"}
            </button>
          ) : null}
          <button className="filter-btn clear" type="button" onClick={load} disabled={loading || updating}>
            {loading ? "불러오는 중…" : "새로고침"}
          </button>
        </div>
      </div>
      {availableMarkets.length > 1 ? (
        <div className="market-scope-tabs" role="tablist" aria-label="시장 범위 선택" data-scope={activeMarket} data-count={availableMarkets.length}>
          {availableMarkets.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={activeMarket === key}
              className={activeMarket === key ? "active" : ""}
              onClick={() => setSelectedMarket(key)}
            >
              {MARKET_SCOPE_LABELS[key]}
            </button>
          ))}
        </div>
      ) : null}
      {snapshotIsStale ? (
        <p className="market-state-stale-note">
          최신 시장 메모리
          {latestMemoryTime ? `(${latestMemoryTime})` : ""}
          가 저장됐지만, 화면용 시장 상태 스냅샷은 아직 다시 생성되지 않았습니다. 시장 메모리 업데이트를 다시 실행하면 화면 판단을 갱신합니다.
        </p>
      ) : null}
      {error ? (
        <p className="market-state-summary">시장 상황을 불러오지 못했습니다: {error}</p>
      ) : (
        <div className="market-state-overview">
          {reasonSummary ? (
            <section className="market-state-interpretation">
              <span>시장 해석</span>
              <strong>{interpretation.lead}</strong>
              {interpretation.support ? <p>{interpretation.support}</p> : null}
            </section>
          ) : null}
          {activePayload?.actionGuide || activePayload?.posture || visibleSummary ? (
            <section className={`market-state-posture posture-${activePayload?.posture?.tone || "watch"}`}>
              <span>판단 및 투자 행동</span>
              {visibleSummary && <p className="market-state-summary">{visibleSummary}</p>}
              {activePayload?.actionGuide ? (
                <div className="market-state-action-body">
                  <strong>{activePayload.actionGuide.headline}</strong>
                  <p>{activePayload.actionGuide.action}</p>
                  {activePayload.actionGuide.timing && <small>{activePayload.actionGuide.timing}</small>}
                </div>
              ) : activePayload?.posture ? (
                <div className="market-state-action-body">
                  <strong>{activePayload.posture.label}</strong>
                  <p>{activePayload.posture.summary}</p>
                </div>
              ) : null}
              {(activePayload?.watchItems?.length || briefs[3]?.value) ? (
                <div className="market-state-action-list">
                  <b>다음 확인</b>
                  {activePayload?.watchItems?.length ? (
                    <ul>
                      {activePayload.watchItems.slice(0, 3).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{briefs[3]?.value}</p>
                  )}
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      )}
      <div className="market-state-drivers">
        {drivers.map((driver, index) => (
          <DriverCard key={driver.id || index} driver={driver} />
        ))}
      </div>
      {activePayload && ((activePayload.counterEvidence?.length || 0) > 0 || (activePayload.uncertainties?.length || 0) > 0) ? (
        <div className="market-state-checks" aria-label="반대 근거와 불확실성">
          {activePayload.counterEvidence?.length ? (
            <section>
              <h3>반대 근거</h3>
              <CheckList items={activePayload.counterEvidence} />
            </section>
          ) : null}
          {activePayload.uncertainties?.length ? (
            <section>
              <h3>불확실성</h3>
              <CheckList items={activePayload.uncertainties} />
            </section>
          ) : null}
        </div>
      ) : null}
      {payload?.sourceRefs?.length ? (
        <details className="market-state-sources">
          <summary>사용한 출처 {payload.sourceRefs.length}개</summary>
          <ul>
            {payload.sourceRefs.slice(0, 8).map((source, index) => (
              <li key={source.id || index}>
                {source.url ? (
                  <a href={source.url} target="_blank" rel="noreferrer">{source.title || source.source || source.url}</a>
                ) : (
                  <span>{source.title || source.source || source.id}</span>
                )}
                {source.source && <small>{source.source}</small>}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </>
  );
}
