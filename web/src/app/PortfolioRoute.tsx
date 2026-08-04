import { useEffect, useState } from "react";
import { ApiRequestError, getJson, postJson } from "../api";
import { setReactAgentContextScope } from "./agentContext";
import { RouteHero } from "./RouteHero";
import { HoldingsTable, type PositionDraft } from "./portfolio/HoldingsTable";
import { ImportPositionsDialog } from "./portfolio/ImportPositionsDialog";
import { ConsultationEntry } from "./portfolio/ConsultationEntry";

type Portfolio = { revision: number; positions: PositionDraft[]; cash?: Array<{ currency: string; amount: number }>; updatedAt?: string };

export function PortfolioRoute() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [positions, setPositions] = useState<PositionDraft[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const payload = await getJson<Portfolio>("/api/portfolio");
    setPortfolio(payload); setPositions(payload.positions || []);
  }

  useEffect(() => { load().catch((reason) => setError(reason instanceof Error ? reason.message : "Portfolio를 불러오지 못했습니다.")); setReactAgentContextScope("portfolio", { surface: "portfolio", viewId: "portfolio", reportKind: "portfolio", reportId: "current" }); }, []);

  async function save() {
    if (!portfolio) return;
    setBusy(true); setError(""); setStatus("");
    try {
      const payload = await postJson<Portfolio>("/api/portfolio", { expectedRevision: portfolio.revision, positions, cash: portfolio.cash || [] });
      setPortfolio(payload); setPositions(payload.positions || []); setStatus(`revision ${payload.revision}로 저장했습니다.`);
    } catch (reason) {
      if (reason instanceof ApiRequestError && reason.status === 409) {
        await load(); setError("다른 화면에서 Portfolio가 먼저 수정되어 최신본을 다시 불러왔습니다. 변경을 확인한 뒤 다시 저장하세요.");
      } else setError(reason instanceof Error ? reason.message : "Portfolio 저장에 실패했습니다.");
    } finally { setBusy(false); }
  }

  return (
    <main className="portfolio-route">
      <RouteHero eyebrow="Portfolio" title="보유 종목과 리서치 연결" description="입력 부담을 줄이고, 보유 포지션에서 시작해 뉴스·브리핑·시장 내러티브를 함께 검토합니다." />
      <div className="portfolio-route-grid">
        <section className="cockpit-panel portfolio-holdings" aria-labelledby="portfolio-holdings-title">
          <div className="cockpit-panel__head"><div><span>HOLDINGS</span><h2 id="portfolio-holdings-title">현재 보유 종목</h2></div><b>버전 {portfolio?.revision ?? 0}</b></div>
          <div className="portfolio-actions"><button className="filter-btn" type="button" onClick={() => setPositions([...positions, { ticker: "", quantity: "", averagePrice: "" }])}>종목 추가</button><button className="filter-btn" type="button" onClick={() => setShowImport(true)}>사진에서 가져오기</button><button className="filter-btn apply" type="button" disabled={busy || !portfolio} onClick={save}>{busy ? "저장 중" : "Portfolio 저장"}</button></div>
          <HoldingsTable positions={positions} onChange={setPositions} />
          {status && <p className="react-reader-status">{status}</p>}{error && <p className="react-dashboard-error" role="alert">{error}</p>}
        </section>
        <aside className="cockpit-panel portfolio-research" aria-labelledby="portfolio-research-title">
          <div className="cockpit-panel__head"><div><span>RESEARCH</span><h2 id="portfolio-research-title">Agent와 검토</h2></div></div>
          <p>현재 보유 종목을 기준으로 최근 뉴스, 브리핑, 시장 내러티브의 변화와 반대 근거를 함께 살펴봅니다.</p>
          <ConsultationEntry tickers={positions.map((row) => row.ticker).filter(Boolean)} />
          <small>상담 내용은 보고서 근거로 사용되지 않습니다.</small>
        </aside>
      </div>
      {showImport && <ImportPositionsDialog current={positions} onApply={(next) => { setPositions(next); setShowImport(false); setStatus("이미지 인식 결과를 편집표에 적용했습니다. 아직 저장되지 않았습니다."); }} onClose={() => setShowImport(false)} />}
    </main>
  );
}
