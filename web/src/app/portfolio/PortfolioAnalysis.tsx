import { useEffect, useState } from "react";
import { getJson } from "../../api";
import {
  money,
  percent,
  signOf,
  type PortfolioAnalytics,
  type WeightSlice,
} from "./portfolioTypes";

/** 평가 요약과 구성 분석.
 *
 *  `/api/portfolio/summary`와 `/api/portfolio/analytics`는 처음부터 동작하고 있었고
 *  화면만 없었다. 시세·환율·비중·집중도·해설이 전부 서버에서 계산돼 온다 — 여기서는
 *  다시 계산하지 않고 그리기만 한다.
 *
 *  숫자는 전부 **USD 환산**이다. 원화 자산과 달러 자산이 섞이면 환산 없이는 비중을
 *  더할 수 없다. 어느 기준인지 화면이 계속 말한다.
 */

const BUCKETS: ReadonlyArray<{ key: "marketWeights" | "sectorWeights" | "currencyWeights" | "assetClassWeights"; label: string }> = [
  { key: "marketWeights", label: "시장" },
  { key: "sectorWeights", label: "섹터" },
  { key: "currencyWeights", label: "통화" },
  { key: "assetClassWeights", label: "자산군" },
];

function WeightBars({ slices }: { slices: ReadonlyArray<WeightSlice> }) {
  if (!slices.length) return <p className="portfolio-empty">계산할 수 있는 자료가 없습니다.</p>;
  return (
    <ul className="portfolio-weights">
      {slices.map((slice) => (
        <li key={slice.label} className="portfolio-weight">
          <div className="portfolio-weight__head">
            <span className="portfolio-weight__label">{slice.label}</span>
            <span className="portfolio-weight__value">{percent(slice.weight)}</span>
          </div>
          <div
            className="portfolio-weight__track"
            role="img"
            aria-label={`${slice.label} 비중 ${percent(slice.weight)}`}
          >
            <span className="portfolio-weight__fill" style={{ inlineSize: `${Math.min(100, slice.weight * 100)}%` }} />
          </div>
          <div className="portfolio-weight__foot">
            <span>{slice.positions}종목 · USD {money(slice.marketValue)}</span>
            <span data-sign={signOf(slice.pnl)}>{percent(slice.pnlPct)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function PortfolioAnalysis({ revision }: { revision: number }) {
  const [payload, setPayload] = useState<PortfolioAnalytics | null>(null);
  const [bucket, setBucket] = useState<(typeof BUCKETS)[number]["key"]>("marketWeights");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const result = await getJson<PortfolioAnalytics>("/api/portfolio/analytics");
        if (!cancelled) { setPayload(result); setError(""); }
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "평가 정보를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // 저장하면 revision이 오르고, 그때 시세와 비중을 다시 받는다.
  }, [revision]);

  if (loading && !payload) return <p className="portfolio-empty">시세를 확인하는 중입니다.</p>;
  if (error) return <p className="react-dashboard-error" role="alert">{error}</p>;
  if (!payload) return null;

  const { analytics } = payload;
  if (!analytics.totalMarketValue && !payload.positions.length) {
    return (
      <p className="portfolio-empty">
        보유 종목을 입력하면 평가액·비중·집중도가 여기에 표시됩니다.
      </p>
    );
  }

  const base = payload.baseCurrency || "USD";
  const perCurrency = payload.summary.filter((row) => row.currency !== `${base} 기준`);

  return (
    <div className="portfolio-analysis">
      <div className="portfolio-metrics">
        <div className="portfolio-metric">
          <span>평가액 ({base} 환산)</span>
          <strong>{money(analytics.totalMarketValue)}</strong>
        </div>
        <div className="portfolio-metric">
          <span>원금</span>
          <strong>{money(analytics.totalCost)}</strong>
        </div>
        <div className="portfolio-metric" data-sign={signOf(analytics.totalPnl)}>
          <span>평가손익</span>
          <strong>{money(analytics.totalPnl)}</strong>
          <small>{percent(analytics.totalPnlPct)}</small>
        </div>
      </div>

      {(perCurrency.length > 1 || payload.cash.length > 0) && (
        <div className="portfolio-block">
          <h3>통화별</h3>
          <table className="portfolio-mini-table">
            <thead>
              <tr><th scope="col">통화</th><th scope="col">평가액</th><th scope="col">손익</th><th scope="col">현금</th></tr>
            </thead>
            <tbody>
              {perCurrency.map((row) => {
                const cash = payload.cash.find((item) => item.currency === row.currency);
                return (
                  <tr key={row.currency}>
                    <th scope="row">{row.currency}</th>
                    <td>{money(row.marketValue)}</td>
                    <td data-sign={signOf(row.pnl)}>{money(row.pnl)} <small>{percent(row.pnlPct)}</small></td>
                    <td>{cash ? money(cash.amount) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="portfolio-note">
            현금은 평가액 합계에 포함하지 않습니다. 환율:{" "}
            {Object.entries(payload.fxRates)
              .filter(([code]) => code !== "USD")
              .map(([code, rate]) => `${code} ${(1 / rate.rateToUsd).toFixed(1)}/USD`)
              .join(" · ") || "—"}
          </p>
        </div>
      )}

      <div className="portfolio-block">
        <div className="portfolio-block__head">
          <h3>구성</h3>
          <div className="segment" role="group" aria-label="구성 기준">
            {BUCKETS.map((item) => (
              <button
                type="button"
                key={item.key}
                aria-pressed={bucket === item.key}
                onClick={() => setBucket(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <WeightBars slices={analytics[bucket]} />
      </div>

      <div className="portfolio-block">
        <h3>집중도</h3>
        <div className="portfolio-metrics portfolio-metrics--compact">
          <div className="portfolio-metric"><span>보유 종목</span><strong>{analytics.concentration.holdings}</strong></div>
          <div className="portfolio-metric"><span>최대 1종목</span><strong>{percent(analytics.concentration.top1)}</strong></div>
          <div className="portfolio-metric"><span>상위 3종목</span><strong>{percent(analytics.concentration.top3)}</strong></div>
        </div>
      </div>

      {analytics.comments.length > 0 && (
        <div className="portfolio-block">
          <h3>살펴볼 점</h3>
          <ul className="portfolio-comments">
            {analytics.comments.map((comment) => (
              <li key={comment.title} className="portfolio-comment surface" data-level={comment.level}>
                <strong>{comment.title}</strong>
                <p>{comment.body}</p>
              </li>
            ))}
          </ul>
          <p className="portfolio-note">
            규칙으로 계산한 관찰입니다. 매수·매도 권유가 아닙니다.
          </p>
        </div>
      )}
    </div>
  );
}
