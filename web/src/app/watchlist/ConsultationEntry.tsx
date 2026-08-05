import { openConsultation } from "../agentWorkspace/ConsultationPanel";

export function ConsultationEntry({ item }: { item: string }) {
  return <button type="button" className="btn btn--primary" onClick={() => openConsultation({ title: `${item} 상담`, scope: { kind: "watchlist", id: item, tickers: [item] }, initialMessage: `${item}에 대해 지금 확인해야 할 변화와 장기 thesis 영향을 함께 검토해줘.` })}>상담 이어가기</button>;
}
