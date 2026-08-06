import { useEffect, useState } from "react";
import { openReactAgentDock } from "../agentContext";
import { legacyBridge } from "../legacyBridge";
import {
  ARTIFACT_KIND_LABELS,
  changedValueText,
  changeReasonText,
  type ChangedItem,
  type ChangeEvent,
} from "../changeEvents";
import { MARKET_CODE_LABELS } from "../../api";
import { STORY_MARKETS, StoryShare, type StoryMarket } from "./StoryShare";

export const CHANGE_STATUS_LABELS: Record<string, string> = {
  major_change: "중대한 변화", developing_signal: "발전 중", conflicting_uncertain: "충돌·불확실",
  no_material_change: "중대한 변화 없음", baseline_created: "기준선 생성", insufficient_basis: "근거 부족",
};

/** 의미 분류 칩. tone은 CSS의 카드 좌측 색과 칩 배경을 함께 정한다. */
export const SEMANTIC_VERDICT_LABELS: Record<string, { label: string; tone: string }> = {
  new_information: { label: "새 정보", tone: "burgundy" },
  reversal: { label: "방향 전환", tone: "gold" },
  trend_development: { label: "흐름 진전", tone: "blue" },
  coverage_shift_only: { label: "보도량 이동", tone: "muted" },
  no_new_information: { label: "변화 없음", tone: "muted" },
  not_evaluated: { label: "내용 미평가", tone: "muted" },
};

const VERDICT_PRIORITY = ["new_information", "reversal", "trend_development", "coverage_shift_only", "no_new_information", "not_evaluated"];

export function changeEventRoute(event: ChangeEvent): string {
  const kind = String(event.artifactKind || "");
  const id = String(event.artifactId || "");
  if (kind === "briefing") {
    const date = id.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      // Events written before the id carried a market only know their market from
      // the lineage; without this they all opened the combined view instead.
      return `#/briefing/${date}/${briefingScope(id, event.lineageId)}`;
    }
    return "#/briefing";
  }
  if (kind === "company_analysis") return "#/analysis";
  if (kind === "topic_report") return "#/deep-research";
  if (kind === "market_memory") return "#/market-memory";
  return "#/dashboard";
}

// 변화 이벤트 id는 시장별로 접미사를 단다(`2026-08-05.europe`). 시장을 못
// 읽으면 유럽·일본 카드가 전부 통합 뷰를 열어 어느 브리핑이 바뀐 건지 사라진다.
const BRIEFING_SCOPES = ["us", "kr", "europe", "jp"] as const;

function briefingScope(id: string, lineageId?: unknown): string {
  const suffix = BRIEFING_SCOPES.find((scope) => id.endsWith(`.${scope}`));
  if (suffix) return suffix;
  // 시장이 id에 들어가기 전에 쓰인 이벤트는 lineage로만 시장을 안다.
  const fromLineage = new RegExp(`^briefing:(${BRIEFING_SCOPES.join("|")})$`)
    .exec(String(lineageId || ""))?.[1];
  return fromLineage || "both";
}

/** 기준 브리핑(비교 대상)을 여는 경로. 기준이 없으면 빈 문자열. */
export function baselineRoute(event: ChangeEvent): string {
  if (String(event.artifactKind || "") !== "briefing") return "";
  const id = String(event.baselineRef?.id || "");
  const date = id.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
  return `#/briefing/${date}/${briefingScope(id, event.lineageId)}`;
}

/** 카드 대표 항목: 의미 verdict가 강한 순 → 없으면 첫 변화 항목. */
export function primaryChangedItem(event: ChangeEvent): ChangedItem | undefined {
  const items = event.changedItems || [];
  for (const verdict of VERDICT_PRIORITY) {
    const match = items.find((item) => item.semanticVerdict === verdict);
    if (match) return match;
  }
  return items[0];
}

/** Agent 도크로 넘길 질문. 카드가 아는 사실만 담고 해석은 Agent에 맡긴다. */
export function agentQuestionForEvent(event: ChangeEvent): string {
  const item = primaryChangedItem(event);
  const artifact = ARTIFACT_KIND_LABELS[event.artifactKind || ""] || "보고서";
  const subject = item?.subject || "변화 항목";
  const lines = [`${artifact} 변화에 대해 물어볼게. 주제: ${subject}`];
  const before = item ? changedValueText(item, item.previousValue) : "";
  const after = item ? changedValueText(item, item.currentValue) : "";
  if (before || after) lines.push(`변화: ${before || "기준 없음"} → ${after || "현재 없음"}`);
  const verdict = SEMANTIC_VERDICT_LABELS[String(item?.semanticVerdict || "")];
  if (verdict) lines.push(`의미 분류: ${verdict.label}`);
  if (item?.semanticNote) lines.push(`분류 근거: ${item.semanticNote}`);
  const titles = [...(item?.previousContextDocs || []).map((title) => `직전: ${title}`), ...(item?.contextDocs || []).map((title) => `현재: ${title}`)];
  if (titles.length) lines.push(`대표 기사:\n${titles.map((title) => `- ${title}`).join("\n")}`);
  if (event.baselineRef?.id) lines.push(`비교 기준: ${event.baselineRef.id}`);
  lines.push("이 변화가 실제로 얼마나 중요한지, 투자 관점에서 무엇을 확인해야 하는지 설명해줘.");
  return lines.join("\n");
}

function artifactLabel(event: ChangeEvent): string {
  return ARTIFACT_KIND_LABELS[event.artifactKind || ""] || event.artifactKind || "보고서";
}

function eventKey(event: ChangeEvent): string {
  return `${event.artifactKind}-${event.artifactId}-${event.generatedAt}`;
}

/** 구형 이벤트의 이슈 항목은 제목 없이 해시 id만 남아 있어 읽을 것이 없다. */
export function isReadableItem(item: ChangedItem): boolean {
  if (item.semanticVerdict || item.semanticNote) return true;
  if ((item.contextDocs || []).length || (item.previousContextDocs || []).length) return true;
  return !/^[0-9a-f]{12,}$/i.test(String(item.subject || ""));
}

function ChangeCard({ event }: { event: ChangeEvent }) {
  // 동적으로 mount되는 로고 슬롯은 bridge를 다시 불러야 채워진다 (시장 내러티브와 같은 방식).
  useEffect(() => { legacyBridge().applyAgentBranding?.(); }, []);
  const item = primaryChangedItem(event);
  const verdict = SEMANTIC_VERDICT_LABELS[String(item?.semanticVerdict || "")];
  const reason = item?.semanticNote || changeReasonText(event);
  return (
    <li data-status={event.status} data-tone={verdict?.tone || ""}>
      <div className="cockpit-change-card">
        <div className="cockpit-change-card__meta">
          <span className="chip status-chip">{CHANGE_STATUS_LABELS[event.status || ""] || event.status}</span>
          {verdict ? <span className="chip change-verdict-chip" data-tone={verdict.tone}>{verdict.label}</span> : null}
          <time>{event.generatedAt ? new Date(event.generatedAt).toLocaleString("ko-KR") : ""}</time>
        </div>
        <strong>{item?.subject || artifactLabel(event)}</strong>
        {/* 카드는 "무엇이 어떻게 달라졌다" 한 줄까지만 말한다. 순위·비중 대조는
            보도량 변화지 내용 변화가 아니라서 위 안내와 어긋났고, 항목별 펼치기는
            보고서에 이미 있는 내용을 카드에서 한 번 더 펼치는 것이었다. */}
        {reason ? <em className="cockpit-change-reason">{reason}</em> : null}
        <div className="cockpit-change-card__actions">
          <button type="button" className="btn btn--sm" onClick={() => { window.location.hash = changeEventRoute(event); }}>보고서 열기</button>
          <button
            type="button"
            className="btn btn--icon agent-action agent-ask-btn"
            data-tooltip="Agent에게 묻기"
            data-tooltip-pos="left"
            aria-label="Agent에게 묻기"
            onClick={() => openReactAgentDock({ message: agentQuestionForEvent(event) })}
          >
            <span className="agent-logo-slot" aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  );
}

export function ChangeFeed({ events, quiet }: { events: ChangeEvent[]; quiet?: ChangeEvent[] }) {
  const [storyMarket, setStoryMarket] = useState<StoryMarket>("us");
  // 의미 판정이 끝난 변화만 본문에 둔다. `내용 미평가`(LLM 없이 생성)와 보도량
  // 이동만 있는 건은 "무엇이 달라졌다"를 아직 말할 수 없으므로 접힌 목록으로.
  const confirmed = events.filter((event) => {
    const verdict = String(primaryChangedItem(event)?.semanticVerdict || "");
    return verdict === "new_information" || verdict === "reversal" || verdict === "trend_development";
  });
  const pending = [...events.filter((event) => !confirmed.includes(event)), ...(quiet || [])];
  return (
    <section className="cockpit-panel cockpit-change-feed" aria-labelledby="cockpit-change-title">
      <div className="cockpit-panel__head">
        <div><span>CHANGE INTELLIGENCE</span><h2 id="cockpit-change-title">무엇이 달라졌나</h2></div>
        {/* 세그먼트 안 버튼에는 클래스를 붙이지 않는다. `.segment`가 트랙·알약·눌림
            상태를 전부 소유한다. `sym-chip`을 섞었더니 선택 칩이 흰색이었다가
            hover에서 네이비로 튀었다 — 두 규칙이 같은 요소를 서로 다르게 칠했다. */}
        <div className="segment story-share__toggle" role="group" aria-label="이야기 비중 시장">
          {STORY_MARKETS.map((option) => (
            <button key={option} type="button" aria-pressed={storyMarket === option} onClick={() => setStoryMarket(option)}>
              {MARKET_CODE_LABELS[option]}
            </button>
          ))}
        </div>
      </div>
      <StoryShare market={storyMarket} />
      <div className="cockpit-change-feed__subhead">
        <span>내용의 변화</span>
        <b>{confirmed.length}건</b>
      </div>
      {confirmed.length ? <ol>
        {confirmed.map((event) => <ChangeCard event={event} key={eventKey(event)} />)}
      </ol> : (
        <p className="cockpit-empty">아직 확인된 내용 변화가 없습니다.</p>
      )}
      {pending.length ? (
        <details className="cockpit-quiet">
          {/* 기준선 생성·근거 부족·변화 없음·내용 미평가가 함께 들어가므로
              "변화 없음"으로 뭉뚱그리지 않는다. */}
          <summary>내용 미평가·보도량 이동 {pending.length}건 보기</summary>
          <ol>
            {pending.map((event) => (
              <li key={eventKey(event)}>
                <span>{CHANGE_STATUS_LABELS[event.status || ""] || event.status}</span>
                <em>{artifactLabel(event)}{event.artifactId ? ` · ${String(event.artifactId).slice(0, 24)}` : ""}</em>
                <time>{event.generatedAt ? new Date(event.generatedAt).toLocaleDateString("ko-KR") : ""}</time>
              </li>
            ))}
          </ol>
        </details>
      ) : null}
    </section>
  );
}
