import { CHANGE_STATUS_LABELS, SEMANTIC_VERDICT_LABELS } from "../dashboard/ChangeFeed";
import { changeReasonText, type ChangeEvent } from "../changeEvents";

/** 브리핑 상단 "이 브리핑에서 달라진 것" — 저장된 changeSummary만 읽는 표시 전용 스트립. */
export function BriefingChangeStrip({ summary }: { summary?: ChangeEvent }) {
  if (!summary || !summary.status) return null;
  const items = (summary.changedItems || []).filter((item) => item.semanticVerdict || item.semanticNote || item.subject);
  // 기준선 생성/근거 부족은 본문을 가릴 만큼 중요하지 않다.
  if (!items.length || ["baseline_created", "insufficient_basis"].includes(String(summary.status))) return null;
  const highlighted = items
    .filter((item) => ["new_information", "reversal", "trend_development"].includes(String(item.semanticVerdict || "")))
    .slice(0, 3);
  const rows = highlighted.length ? highlighted : items.slice(0, 1);
  const baseline = summary.baselineRef?.id ? `${summary.baselineRef.id} 대비` : "";
  return (
    <aside className="briefing-change-strip" data-status={summary.status} aria-label="이 브리핑에서 달라진 것">
      <div className="briefing-change-strip__head">
        <span className="status-chip">{CHANGE_STATUS_LABELS[summary.status] || summary.status}</span>
        <strong>이 브리핑에서 달라진 것</strong>
        {baseline ? <em>{baseline}</em> : null}
      </div>
      <ul>
        {rows.map((item) => {
          const verdict = SEMANTIC_VERDICT_LABELS[String(item.semanticVerdict || "")];
          return (
            <li key={item.id || item.subject}>
              <span className="briefing-change-strip__subject">{item.subject}</span>
              {verdict ? <span className="change-verdict-chip" data-tone={verdict.tone}>{verdict.label}</span> : null}
              {item.semanticNote ? <span className="briefing-change-strip__note">{item.semanticNote}</span> : null}
            </li>
          );
        })}
      </ul>
      {!highlighted.length ? <p className="briefing-change-strip__fallback">{changeReasonText(summary)}</p> : null}
    </aside>
  );
}
