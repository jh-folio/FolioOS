import { openConsultation } from "../agentWorkspace/ConsultationPanel";
import { CHANGE_STATUS_LABELS } from "./ChangeFeed";

type Implication = { tickers?: string[]; status?: string; source?: string; generatedAt?: string };

export function InvestmentImplications({ items, portfolioState }: { items: Implication[]; portfolioState?: string }) {
  const emptyPortfolio = portfolioState === "empty";
  return (
    <section className="cockpit-panel cockpit-implications" aria-labelledby="cockpit-implications-title">
      <div className="cockpit-panel__head">
        <div><span>INVESTMENT CONTEXT</span><h2 id="cockpit-implications-title">내 포지션과의 연결</h2></div>
        {items.length ? <b>{items.length}건</b> : null}
      </div>
      {items.length ? (
        <ul>
          {items.map((item, index) => (
            <li key={`${item.tickers?.join("-")}-${index}`}>
              <strong>{item.tickers?.join(", ")}</strong>
              <span className="cockpit-implication-meta">
                <em>{item.source === "watchlist" ? "관심" : "보유"}</em>
                {CHANGE_STATUS_LABELS[item.status || ""] || item.status}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="cockpit-empty">
          {emptyPortfolio
            ? "포트폴리오가 비어 있어 보유 종목과의 연결을 표시하지 못합니다."
            : "최근 변화와 직접 연결된 보유·관심 종목이 없습니다."}
        </p>
      )}
      <div className="cockpit-actions">
        {emptyPortfolio && (
          <button className="btn" type="button" onClick={() => { window.location.hash = "#/portfolio"; }}>Portfolio에서 보유 종목 입력</button>
        )}
        <button className="btn" type="button" onClick={() => openConsultation({ scope: { kind: "portfolio" } })}>Agent와 검토</button>
      </div>
    </section>
  );
}
