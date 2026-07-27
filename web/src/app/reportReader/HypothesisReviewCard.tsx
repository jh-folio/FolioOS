import { useEffect, useMemo, useState } from "react";
import {
  getJson,
  getHypothesisIntelligence,
  isActiveJobStatus,
  runThesisReview,
  updateHypothesisCheckpoint,
  type HypothesisCheckpoint,
  type HypothesisIntelligencePayload,
  type ThesisReviewJob,
  type ThesisReviewResult,
} from "../../api";
import type { FolioNoteIdentity } from "./FolioNotePanel";

const FRESHNESS_LABELS = {
  fresh: "최신",
  due: "검토 예정",
  stale: "검토 지연",
  unknown: "검토 이력 없음",
} as const;

function dateLabel(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "—";
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isReviewJob(result: ThesisReviewResult): result is ThesisReviewJob {
  return "id" in result && "status" in result;
}

async function pollReviewJob(job: ThesisReviewJob): Promise<ThesisReviewJob> {
  let current = job;
  while (isActiveJobStatus(current.status)) {
    await sleep(1000);
    current = await getJson<ThesisReviewJob>(`/api/jobs/${encodeURIComponent(current.id)}`);
  }
  if (current.status !== "done") {
    throw new Error(current.message || current.error || "가설 검토 작업에 실패했습니다.");
  }
  return current;
}

export function HypothesisReviewCard({
  identity,
  noteExists,
  refreshKey,
  agentAvailable = true,
  onRequestAgent,
}: {
  identity: FolioNoteIdentity;
  noteExists: boolean | null;
  refreshKey: number;
  agentAvailable?: boolean;
  onRequestAgent: () => void;
}) {
  const [intelligence, setIntelligence] = useState<HypothesisIntelligencePayload | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setIntelligence(null);
    if (!noteExists || !identity.ticker) return;
    const controller = new AbortController();
    setStatus("검토 상태를 불러오는 중...");
    getHypothesisIntelligence(identity.id, { signal: controller.signal })
      .then((payload) => {
        setIntelligence(payload);
        setStatus("");
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setStatus(error instanceof Error ? error.message : "검토 상태를 불러오지 못했습니다.");
      });
    return () => controller.abort();
  }, [identity.id, identity.ticker, noteExists, refreshKey]);

  const nextCheckpoint = useMemo(
    () => intelligence?.reviewState.checkpoints.find(
      (checkpoint) => checkpoint.state === "due" || checkpoint.state === "open",
    ) || null,
    [intelligence],
  );

  async function confirmCheckpoint(checkpoint: HypothesisCheckpoint) {
    if (!intelligence || !identity.ticker || busy) return;
    setBusy(true);
    setStatus("체크포인트를 확인하는 중...");
    try {
      const updated = await updateHypothesisCheckpoint(identity.ticker, {
        noteId: identity.id,
        checkpointId: checkpoint.id,
        state: "checked",
        expectedRevision: intelligence.reviewState.revision,
      });
      setIntelligence(updated);
      setStatus("체크포인트를 확인했습니다.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "체크포인트 확인에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function runExplicitReview() {
    if (!intelligence?.thesis || !identity.ticker || busy) return;
    setBusy(true);
    setStatus("최신 외부 근거로 가설을 검토하는 중...");
    try {
      const result = await runThesisReview(identity.ticker);
      if (isReviewJob(result)) await pollReviewJob(result);
      const refreshed = await getHypothesisIntelligence(identity.id);
      setIntelligence(refreshed);
      setStatus("최신 근거 검토를 완료했습니다.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "최신 근거 검토에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  let emptyState = "";
  if (noteExists === null) emptyState = "노트 상태를 확인하는 중...";
  else if (!noteExists) emptyState = "아직 저장된 노트가 없습니다.";
  else if (!identity.ticker) emptyState = "티커가 없어 Thesis와 연결할 수 없습니다.";

  return (
    <section className="hypothesis-review-card" aria-label="가설 검토 상태">
      <div className="hypothesis-review-head">
        <div>
          <p className="section-kicker">Hypothesis Review</p>
          <strong>가설 검토 상태</strong>
        </div>
        {intelligence && (
          <span className={`hypothesis-freshness is-${intelligence.reviewState.freshness}`}>
            {FRESHNESS_LABELS[intelligence.reviewState.freshness]}
          </span>
        )}
      </div>

      {emptyState ? (
        <p className="hypothesis-review-empty">{emptyState}</p>
      ) : intelligence ? (
        <>
          {!intelligence.thesis && (
            <p className="hypothesis-review-empty">연결된 Thesis가 없습니다.</p>
          )}
          {!intelligence.latestDelta && (
            <p className="hypothesis-review-empty">최신 Delta가 없습니다. 최신 근거 검토를 명시적으로 실행하세요.</p>
          )}
          <dl className="hypothesis-review-metrics">
            <div><dt>최근 검토</dt><dd>{dateLabel(intelligence.reviewState.lastReviewedAt)}</dd></div>
            <div><dt>다음 검토</dt><dd>{dateLabel(intelligence.reviewState.nextReviewAt)}</dd></div>
            <div><dt>반대 근거</dt><dd>{intelligence.latestDelta?.counterEvidenceCount ?? 0}</dd></div>
            <div><dt>예정 체크</dt><dd>{intelligence.checkpointCounts.due + intelligence.checkpointCounts.open}</dd></div>
          </dl>
          <div className="hypothesis-review-actions">
            <button type="button" onClick={runExplicitReview} disabled={!intelligence.thesis || busy}>
              {busy ? "검토 중..." : "최신 근거로 검토"}
            </button>
            <button
              type="button"
              onClick={() => nextCheckpoint && confirmCheckpoint(nextCheckpoint)}
              disabled={!nextCheckpoint || busy}
            >
              {busy ? "확인 중..." : "체크포인트 확인"}
            </button>
            <button type="button" onClick={onRequestAgent} disabled={!agentAvailable}>
              Agent에게 설명 요청
            </button>
          </div>
          {!agentAvailable && (
            <p className="hypothesis-review-empty">Agent를 사용할 수 없습니다. 규칙 기반 상태는 계속 확인할 수 있습니다.</p>
          )}
        </>
      ) : (
        <p className="hypothesis-review-empty">{status || "검토 상태를 준비하고 있습니다."}</p>
      )}
      {status && intelligence && <p className="hypothesis-review-status">{status}</p>}
      <p className="hypothesis-layer-notice">
        사용자 노트는 hypothesis이며 evidence가 아닙니다. Canonical 보고서는 변경되지 않습니다.
      </p>
    </section>
  );
}
