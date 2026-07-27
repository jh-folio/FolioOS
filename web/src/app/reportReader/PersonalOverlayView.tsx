import type { PersonalOverlayPayload } from "../deepResearchPayload";
import { ReportBody } from "./ReportBody";

function list(items: readonly string[]) {
  return items.length ? <ul>{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p>기록 없음</p>;
}

export function PersonalOverlayView({
  overlay,
  staleQa,
}: {
  readonly overlay: PersonalOverlayPayload | null;
  readonly staleQa?: string;
}) {
  if (!overlay) return <p className="report-note-empty">생성된 Personal Overlay가 없습니다.</p>;
  return (
    <div className="react-personal-overlay" data-personal-overlay-state={overlay.revisionState}>
      {overlay.revisionState === "stale" && (
        <div className="topicrpt-overlay-stale" data-qa={staleQa} role="status">
          <strong>이 Overlay는 오래된 Canonical 기준입니다.</strong>
          <span>현재 보고서 revision과 생성 당시 revision이 다르므로 다시 연결해 확인하세요.</span>
        </div>
      )}
      {overlay.revisionState === "legacy_unknown" && (
        <p className="topicrpt-layer-note">생성 기준 revision을 확인할 수 없는 레거시 Overlay입니다.</p>
      )}
      {overlay.markdown ? <ReportBody markdown={overlay.markdown} /> : <p className="report-note-empty">저장된 개인 해석 본문이 없습니다.</p>}
      <h4>반대 근거와 충돌</h4>
      {list([...overlay.counterEvidence, ...overlay.contradictions])}
      <h4>불확실성과 다음 질문</h4>
      {list([...overlay.uncertainties, ...overlay.personalQuestions])}
    </div>
  );
}
