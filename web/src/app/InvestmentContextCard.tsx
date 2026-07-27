import { useEffect, useMemo, useRef, useState } from "react";

import {
  getJson,
  postJson,
  type InvestmentContextSummary,
  type InvestmentContextExplanationJob,
  type InvestmentTickerContext,
} from "../api";
import { pollAgentJobBounded } from "./agentPolling";

export type InvestmentContextMode = "home" | "market-memory" | "collection" | "deep-research";

type InvestmentContextCardViewProps = {
  readonly mode: InvestmentContextMode;
  readonly summary: InvestmentContextSummary | null;
  readonly collectionId?: string;
  readonly dismissible?: boolean;
  readonly onDismiss?: () => void;
  readonly onReference?: (context: InvestmentTickerContext) => void;
  readonly onExplain?: (context: InvestmentTickerContext) => void;
  readonly explainingTicker?: string;
  readonly explanation?: { readonly ticker: string; readonly reply: string } | null;
  readonly explanationError?: string;
  readonly loading?: boolean;
  readonly error?: string;
};

type InvestmentContextCardProps = Omit<InvestmentContextCardViewProps, "summary" | "onDismiss">;

const contextBoundary = {
  layer: "hypothesis",
  reuseAsEvidence: false,
} as const;

const MODE_COPY: Record<InvestmentContextMode, { title: string; description: string }> = {
  home: {
    title: "내 리서치 연결",
    description: "관심 종목과 확인 일정을 현재 리서치 화면에만 연결합니다.",
  },
  "market-memory": {
    title: "이 흐름과 연결된 종목",
    description: "시장 드라이버가 개인 포트폴리오·워치리스트와 만나는 지점입니다.",
  },
  collection: {
    title: "이 Collection과 연결된 개인 맥락",
    description: "저장 필터와 겹치는 종목만 표시하며 외부 근거에는 포함하지 않습니다.",
  },
  "deep-research": {
    title: "질문에 참고할 개인 맥락",
    description: "선택한 종목만 추가 컨텍스트에 hypothesis로 복사할 수 있습니다.",
  },
};

function sourceLabel(source: InvestmentTickerContext["source"]) {
  if (source === "both") return "포트폴리오 · 워치리스트";
  return source === "portfolio" ? "포트폴리오" : "워치리스트";
}

function contextsFor(
  summary: InvestmentContextSummary,
  mode: InvestmentContextMode,
  collectionId?: string,
) {
  if (mode !== "collection") return summary.watchContexts;
  return summary.watchContexts.filter((context) =>
    context.collections.some((collection) => collection.id === collectionId)
  );
}

function rowMeta(context: InvestmentTickerContext) {
  const drivers = context.marketDrivers.map((driver) => driver.label).slice(0, 2);
  const details = [
    sourceLabel(context.source),
    ...drivers,
    context.dueCheckpoints.length ? `확인 예정 ${context.dueCheckpoints.length}` : "",
  ].filter(Boolean);
  return details.join(" · ");
}

function ExplanationReply({ reply }: { readonly reply: string }) {
  const lines = reply.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return (
    <div className="investment-context-explanation-body">
      {lines.map((line, index) => {
        if (line.startsWith("### ")) {
          return <h3 key={`${index}:${line}`}>{line.slice(4)}</h3>;
        }
        if (line.startsWith("- ")) {
          return <p className="is-bullet" key={`${index}:${line}`}>{line.slice(2)}</p>;
        }
        return <p key={`${index}:${line}`}>{line}</p>;
      })}
    </div>
  );
}

export function InvestmentContextCardView({
  mode,
  summary,
  collectionId,
  dismissible = false,
  onDismiss,
  onReference,
  onExplain,
  explainingTicker = "",
  explanation = null,
  explanationError = "",
  loading = false,
  error = "",
}: InvestmentContextCardViewProps) {
  const contexts = useMemo(
    () => summary ? contextsFor(summary, mode, collectionId).slice(0, mode === "home" ? 4 : 3) : [],
    [collectionId, mode, summary],
  );
  const copy = MODE_COPY[mode];

  if (!summary) {
    if (mode !== "home") return null;
    return (
      <aside className="investment-context-card is-minimal" data-qa="investment-context-loading" data-layer={contextBoundary.layer}>
        <span>{loading ? "개인 리서치 연결을 확인하는 중입니다." : error || "개인 맥락을 불러오지 못했습니다."}</span>
      </aside>
    );
  }

  if (!contexts.length) {
    if (mode !== "home") return null;
    return (
      <aside
        className="investment-context-card is-empty"
        data-qa="investment-context-empty"
        data-layer={contextBoundary.layer}
        data-reuse-as-evidence={String(contextBoundary.reuseAsEvidence)}
      >
        <div className="investment-context-head">
          <div>
            <p>PERSONAL CONTEXT · HYPOTHESIS</p>
            <h2>개인 리서치 연결이 아직 없습니다</h2>
          </div>
          {dismissible && onDismiss ? <button type="button" className="investment-context-dismiss" aria-label="개인 맥락 카드 닫기" onClick={onDismiss}>×</button> : null}
        </div>
        <p>관심 종목이나 체크포인트를 기록하면 관련 리서치 화면에서 조용히 연결됩니다.</p>
      </aside>
    );
  }

  const dueCount = contexts.reduce((total, context) => total + context.dueCheckpoints.length, 0);
  return (
    <aside
      className={`investment-context-card mode-${mode}`}
      data-qa={`investment-context-${mode}`}
      data-layer={contextBoundary.layer}
      data-reuse-as-evidence={String(contextBoundary.reuseAsEvidence)}
    >
      <div className="investment-context-head">
        <div>
          <p>PERSONAL CONTEXT · HYPOTHESIS</p>
          <h2>{copy.title}</h2>
          <span>{copy.description}</span>
        </div>
        {dismissible && onDismiss ? <button type="button" className="investment-context-dismiss" aria-label="개인 맥락 카드 닫기" onClick={onDismiss}>×</button> : null}
      </div>

      <div className="investment-context-summary" aria-label="개인 맥락 요약">
        <span>연결 {contexts.length}</span>
        <span>확인 예정 {dueCount}</span>
      </div>

      <ul className="investment-context-ledger">
        {contexts.map((context) => (
          <li key={context.ticker}>
            <div>
              <strong>{context.ticker}</strong>
              <small>{rowMeta(context)}</small>
            </div>
            <div className="investment-context-row-actions">
              {mode === "deep-research" && onReference ? (
                <button type="button" onClick={() => onReference(context)}>질문에 참고</button>
              ) : (
                <a href={context.source === "watchlist" || context.source === "both" ? "#/watchlist" : "#/market-memory"}>
                  연결 보기
                </a>
              )}
              {onExplain ? (
                <button
                  type="button"
                  disabled={Boolean(explainingTicker)}
                  onClick={() => onExplain(context)}
                >
                  {explainingTicker === context.ticker ? "설명 중…" : "Agent로 위험 설명"}
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {explanation ? (
        <section className="investment-context-explanation" aria-live="polite">
          <strong>{explanation.ticker} · Agent 설명</strong>
          <ExplanationReply reply={explanation.reply} />
        </section>
      ) : null}
      {explanationError ? (
        <p className="investment-context-error" role="status">{explanationError}</p>
      ) : null}

      {mode === "home" ? (
        <nav className="investment-context-links" aria-label="연결된 리서치 화면">
          <a href="#/market-memory">시장 내러티브</a>
          <a href="#/deep-research">딥 리서치</a>
        </nav>
      ) : null}
      <small className="investment-context-boundary">개인 가설 레이어 · 외부 evidence 및 Canonical 본문과 분리</small>
    </aside>
  );
}

export function InvestmentContextCard(props: InvestmentContextCardProps) {
  const [summary, setSummary] = useState<InvestmentContextSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const [explainingTicker, setExplainingTicker] = useState("");
  const [explanation, setExplanation] = useState<{ ticker: string; reply: string } | null>(null);
  const [explanationError, setExplanationError] = useState("");
  const explanationController = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    getJson<InvestmentContextSummary>("/api/investment-context/summary", { signal: controller.signal })
      .then(setSummary)
      .catch((requestError) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setError(requestError instanceof Error ? requestError.message : "개인 맥락을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => () => explanationController.current?.abort(), []);

  async function requestExplanation(context: InvestmentTickerContext) {
    explanationController.current?.abort();
    const controller = new AbortController();
    explanationController.current = controller;
    setExplainingTicker(context.ticker);
    setExplanation(null);
    setExplanationError("");
    try {
      const job = await postJson<InvestmentContextExplanationJob>(
        "/api/agent/investment-context/explain",
        { tickers: [context.ticker] },
        { signal: controller.signal },
      );
      const done = await pollAgentJobBounded(job, { signal: controller.signal });
      const reply = done.result?.reply?.trim() || "";
      if (!reply) throw new Error("설명 결과가 비어 있습니다.");
      setExplanation({ ticker: context.ticker, reply });
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") return;
      setExplanationError(
        requestError instanceof Error
          ? requestError.message
          : "Agent 설명을 완료하지 못했습니다.",
      );
    } finally {
      if (explanationController.current === controller) {
        explanationController.current = null;
        setExplainingTicker("");
      }
    }
  }

  if (dismissed) return null;
  return (
    <InvestmentContextCardView
      {...props}
      summary={summary}
      loading={loading}
      error={error}
      onDismiss={props.dismissible ? () => setDismissed(true) : undefined}
      onExplain={requestExplanation}
      explainingTicker={explainingTicker}
      explanation={explanation}
      explanationError={explanationError}
    />
  );
}
