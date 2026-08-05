import { openConsultation } from "../agentWorkspace/ConsultationPanel";

export function ConsultationEntry({ tickers }: { tickers: string[] }) {
  return <button className="btn btn--primary" type="button" onClick={() => openConsultation({ title: "현재 Portfolio 상담", scope: { kind: "portfolio", id: "current", tickers }, initialMessage: "현재 Portfolio와 최근 뉴스·브리핑·시장 내러티브를 연결해 우선 확인할 변화와 반대 근거를 검토해줘." })}>현재 Portfolio 상담하기</button>;
}
