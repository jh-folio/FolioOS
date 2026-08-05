export type PositionDraft = {
  ticker: string;
  quantity: number | string;
  averagePrice?: number | string;
  market?: string;
  currency?: string;
};

export function HoldingsTable({ positions, onChange }: { positions: PositionDraft[]; onChange: (positions: PositionDraft[]) => void }) {
  function update(index: number, field: keyof PositionDraft, value: string) {
    onChange(positions.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
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
              <td><input aria-label={`${index + 1}번 종목`} value={row.ticker} onChange={(event) => update(index, "ticker", event.currentTarget.value.toUpperCase())} placeholder="NVDA / 005930" /></td>
              <td><input aria-label={`${row.ticker || index + 1} 수량`} value={row.quantity} onChange={(event) => update(index, "quantity", event.currentTarget.value)} inputMode="decimal" /></td>
              <td><input aria-label={`${row.ticker || index + 1} 평균단가`} value={row.averagePrice ?? ""} onChange={(event) => update(index, "averagePrice", event.currentTarget.value)} inputMode="decimal" /></td>
              <td><input aria-label={`${row.ticker || index + 1} 시장`} value={row.market || ""} onChange={(event) => update(index, "market", event.currentTarget.value.toUpperCase())} placeholder="US / KR / EUROPE / JP" /></td>
              <td><button type="button" className="filter-btn clear" onClick={() => onChange(positions.filter((_, rowIndex) => rowIndex !== index))}>삭제</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {!positions.length && <p className="cockpit-empty">등록된 보유 종목이 없습니다. 직접 추가하거나 증권사 화면에서 가져오세요.</p>}
    </div>
  );
}
