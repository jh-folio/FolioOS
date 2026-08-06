import { useState } from "react";
import { getJson } from "../../api";
import type { CompanyResolution } from "../companyAnalysis/useCompanyResolution";

export type PositionDraft = {
  ticker: string;
  quantity: number | string;
  averagePrice?: number | string;
  market?: string;
  currency?: string;
};

export function HoldingsTable({ positions, onChange }: { positions: PositionDraft[]; onChange: (positions: PositionDraft[]) => void }) {
  // 해석된 회사명은 화면 확인용이라 저장 payload에 넣지 않는다.
  const [names, setNames] = useState<Record<number, string>>({});

  function update(index: number, field: keyof PositionDraft, value: string) {
    onChange(positions.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
  }

  function removeRow(index: number) {
    onChange(positions.filter((_, rowIndex) => rowIndex !== index));
    // 행이 빠지면 뒤 행의 번호가 당겨진다. 그대로 두면 남의 이름이 붙는다.
    setNames((prev) => {
      const next: Record<number, string> = {};
      for (const [key, value] of Object.entries(prev)) {
        const at = Number(key);
        if (at < index) next[at] = value;
        else if (at > index) next[at - 1] = value;
      }
      return next;
    });
  }

  /** 입력을 벗어날 때 한 번만 해석한다. 표 안이라 글자마다 부르지 않는다. */
  async function resolveRow(index: number, raw: string) {
    const text = raw.trim();
    if (!text) {
      setNames((prev) => ({ ...prev, [index]: "" }));
      return;
    }
    try {
      const result = await getJson<CompanyResolution>(`/api/company/resolve?q=${encodeURIComponent(text)}&limit=1`);
      if (result.status !== "confident" || !result.match) {
        setNames((prev) => ({ ...prev, [index]: "" }));
        return;
      }
      const match = result.match;
      setNames((prev) => ({ ...prev, [index]: match.name }));
      const patch: Partial<PositionDraft> = {};
      if (match.ticker && match.ticker !== text) patch.ticker = match.ticker;
      // 시장은 비어 있을 때만 채운다. 사용자가 적어 둔 값을 덮지 않는다.
      if (match.market && !positions[index]?.market) patch.market = match.market;
      if (Object.keys(patch).length) {
        onChange(positions.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
      }
    } catch {
      // 해석에 실패해도 입력은 그대로 둔다. 확인 문구만 사라진다.
      setNames((prev) => ({ ...prev, [index]: "" }));
    }
  }

  return (
    <div className="portfolio-holdings-table-wrap">
      <table className="portfolio-holdings-table">
        <thead><tr><th>종목</th><th>수량</th><th>평균단가</th><th>시장</th><th><span className="sr-only">삭제</span></th></tr></thead>
        <tbody>
          {positions.map((row, index) => (
            // 키에 편집 중인 ticker를 넣으면 글자를 칠 때마다 키가 바뀌어 행이 재생성되고
            // 포커스가 빠진다. 행은 추가/삭제로만 바뀌므로 index를 키로 쓴다.
            <tr key={index}>
              <td>
                <input
                  aria-label={`${index + 1}번 종목`}
                  value={row.ticker}
                  onChange={(event) => update(index, "ticker", event.currentTarget.value.toUpperCase())}
                  onBlur={(event) => void resolveRow(index, event.currentTarget.value)}
                  placeholder="NVDA / 삼성전자"
                />
                {/* 이름으로 적어도 되도록 하되, 무엇으로 읽었는지 보여준다. */}
                {names[index] && <small className="holdings-resolved">{names[index]}</small>}
              </td>
              <td><input aria-label={`${row.ticker || index + 1} 수량`} value={row.quantity} onChange={(event) => update(index, "quantity", event.currentTarget.value)} inputMode="decimal" /></td>
              <td><input aria-label={`${row.ticker || index + 1} 평균단가`} value={row.averagePrice ?? ""} onChange={(event) => update(index, "averagePrice", event.currentTarget.value)} inputMode="decimal" /></td>
              <td><input aria-label={`${row.ticker || index + 1} 시장`} value={row.market || ""} onChange={(event) => update(index, "market", event.currentTarget.value.toUpperCase())} placeholder="US / KR / EUROPE / JP" /></td>
              <td><button type="button" className="btn" onClick={() => removeRow(index)}>삭제</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {!positions.length && <p className="cockpit-empty">등록된 보유 종목이 없습니다. 직접 추가하거나 증권사 화면에서 가져오세요.</p>}
    </div>
  );
}
