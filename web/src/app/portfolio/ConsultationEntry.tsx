import { openScopedThread } from "../agentWorkspace/openScopedThread";

export function ConsultationEntry({ tickers }: { tickers: string[] }) {
  return <button className="btn btn--primary" type="button" onClick={() => openScopedThread({ title: "포트폴리오 대화", scope: { kind: "portfolio", id: "current", tickers }, initialMessage: "현재 Portfolio와 최근 뉴스·브리핑·시장 내러티브를 연결해 우선 확인할 변화와 반대 근거를 검토해줘." })}>포트폴리오 짚어보기</button>;
}
