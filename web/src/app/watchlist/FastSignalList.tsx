export type FastSignal = {
  id?: string;
  provider?: string;
  title?: string;
  url?: string;
  providerPublishedAt?: string;
  receivedAt?: string;
  signalStatus?: string;
  sourceStatus?: string;
  latency?: { collectionLagSeconds?: number | null };
};

export type SignalProviderHealth = {
  provider?: string;
  sourceStatus?: string;
  checkedAt?: string;
  errorCode?: string;
  delayMinutes?: number | null;
};

function timeLabel(value?: string) {
  if (!value) return "시각 미확인";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const SIGNAL_STATUS_KO: Record<string, string> = {
  unconfirmed: "확인 전",
  corroborated: "교차 확인",
  expired: "만료",
  retracted: "철회",
};

export function FastSignalList({ signals, providers }: { signals: FastSignal[]; providers: SignalProviderHealth[] }) {
  const unavailable = providers.filter((row) => !["active", "delayed"].includes(String(row.sourceStatus || "")));
  return (
    <section className="evidence-rail evidence-rail--lead" aria-labelledby="fast-signal-title">
      <div className="evidence-rail__head">
        <div>
          <span className="evidence-rail__eyebrow">EARLY LEAD</span>
          <h3 id="fast-signal-title">빠른 시장 신호</h3>
        </div>
        <span className="status-chip status-chip--lead">확인 전 정보</span>
      </div>
      <p className="evidence-rail__note">빠르게 게시된 제목만 모았습니다. 단일 신호는 보고서 결론이나 투자 판단을 바꾸지 않습니다.</p>
      {unavailable.length > 0 && (
        <div className="provider-health-list" aria-label="수집 경로 상태">
          {unavailable.map((row) => (
            <div className="provider-health-item" key={row.provider}>
              <strong>{row.provider}</strong>
              <span>{row.sourceStatus}{row.errorCode ? ` · ${row.errorCode}` : ""}</span>
            </div>
          ))}
        </div>
      )}
      {signals.length ? (
        <ol className="evidence-rail__list">
          {signals.map((signal) => (
            <li key={signal.id || `${signal.provider}-${signal.title}`}>
              <div className="evidence-rail__meta">
                <span>{signal.provider || "unknown"}</span>
                <span>{signal.sourceStatus === "delayed" ? "지연 수신" : SIGNAL_STATUS_KO[signal.signalStatus || ""] || "확인 전"}</span>
                <time>{timeLabel(signal.providerPublishedAt)}</time>
              </div>
              {signal.url ? <a href={signal.url} target="_blank" rel="noopener noreferrer">{signal.title}</a> : <strong>{signal.title}</strong>}
              <small>수신 {timeLabel(signal.receivedAt)}</small>
            </li>
          ))}
        </ol>
      ) : <p className="section-subtitle">현재 이 종목에 연결된 빠른 시장 신호가 없습니다.</p>}
    </section>
  );
}
