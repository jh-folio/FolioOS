import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ApiRequestError,
  FALLBACK_POLICY,
  getJson,
  isActiveJobStatus,
  postJson,
  type ApprovalReference,
  type CliAdapter,
  type CollectionRef,
  type ConfirmDegradedRequest,
  type ExecutionMode,
  type ExecutionRequest,
  type GenerateApprovedRequest,
  type JobStatus,
  type InvestmentTickerContext,
  type MarketStatePolicy,
  type MarketStateScope,
  type PlanPreviewEnvelope,
  type PlanRequest,
} from "../api";
import { openReactAgentDock, patchReactAgentContextScope, setReactAgentContextScope } from "./agentContext";
import { PROPOSAL_LIFECYCLE_EVENT, proposalTargetsContext, type ProposalLifecycleResult } from "./agentProposalLifecycle";
import { stableNoteKey } from "./reportReader/FolioNotePanel";
import { ReaderActionButton, ReaderActionGroup } from "./reportReader/ReaderActions";
import { ReportBody } from "./reportReader/ReportBody";
import { ReportReaderShell } from "./reportReader/ReportReaderShell";
import { PersonalOverlayView } from "./reportReader/PersonalOverlayView";
import { RouteHero } from "./RouteHero";
import { AgentWorkLog } from "./AgentWorkLog";
import { marketStateContextProjection, readMarketStateRef } from "./marketStateContext";
import {
  deepResearchCollectionHash,
  deepResearchReportHash,
  parseDeepResearchLocation,
  parsePersonalOverlayPayload,
  parseTopicReportPayload,
  parseTopicReportSummaries,
  type MarketStateResolutionPayload,
  type TopicReport,
  type TopicReportSummary,
} from "./deepResearchPayload";
import { SmartCollectionsPanel, SmartCollectionWorkspace } from "./SmartCollectionWorkspace";
import { InvestmentContextCard } from "./InvestmentContextCard";

type DeepResearchPhase =
  | "readiness"
  | "draft"
  | "plan-loading"
  | "plan-review"
  | "generation"
  | "report"
  | "recoverable-error";

type ErrorKind = "validation" | "readiness" | "plan" | "degraded" | "generation" | "report";

type AgentJob = {
  readonly id: string;
  readonly kind?: string;
  readonly status: JobStatus;
  readonly message?: string;
  readonly error?: string;
  readonly errorCode?: string;
  readonly result?: { readonly reportId?: string; readonly artifactId?: string };
};

type JobEnvelope = { readonly job: AgentJob };

type ExportResult = {
  notionUrl?: string;
  title?: string;
  filename?: string;
  topic?: string;
};

type OverlayResult = {
  personalOverlay?: { markdown?: string } | null;
};

function EmptyProvenance({ children = "저장된 구조화 정보가 없습니다." }: { readonly children?: string }) {
  return <p className="topicrpt-provenance-empty">{children}</p>;
}

function DeepResearchProvenance({ report }: { readonly report: TopicReport }) {
  const plan = report.topicPlan;
  const coverage = report.evidencePackSummary;
  const resolution = report.researchResolution;
  const overlay = parsePersonalOverlayPayload(report.personalOverlay, report.canonicalRevision);
  const userContext = typeof report.userContext === "string" ? report.userContext.trim() : report.userContext ? "생성 요청에 사용자 컨텍스트가 포함되었습니다." : "";
  return (
    <section className="topicrpt-provenance" aria-labelledby="dr-provenance-heading">
      <div className="topicrpt-provenance-heading">
        <p className="section-kicker">PROVENANCE</p>
        <h2 id="dr-provenance-heading">리서치 근거 추적</h2>
        <p>승인 계획, 외부 근거, 자료 공백과 개인 가설을 서로 다른 레이어로 확인합니다.</p>
      </div>
      {report.contractWarnings.length > 0 && (
        <div className="topicrpt-contract-warning" role="status">
          일부 구조화 필드가 올바르지 않아 안전한 빈 상태로 표시했습니다.
        </div>
      )}
      <div className="topicrpt-provenance-grid">
        <section className="topicrpt-provenance-panel" data-qa="dr-approved-plan" aria-labelledby="dr-approved-plan-heading">
          <h3 id="dr-approved-plan-heading">승인된 계획</h3>
          {plan ? (
            <>
              <dl className="topicrpt-provenance-facts">
                <div><dt>주제</dt><dd>{plan.topic || "미기록"}</dd></div>
                <div><dt>보고서 유형</dt><dd>{plan.reportType || "미기록"}</dd></div>
                <div><dt>사용자 의도</dt><dd>{plan.userIntent || "미기록"}</dd></div>
              </dl>
              <h4>리서치 질문</h4>{renderList(plan.researchQuestions)}
              <h4>반증 조건</h4>{renderList(plan.falsificationTriggers)}
            </>
          ) : <EmptyProvenance />}
        </section>

        <section className="topicrpt-provenance-panel" data-qa="dr-evidence-coverage" aria-labelledby="dr-evidence-coverage-heading">
          <h3 id="dr-evidence-coverage-heading">근거 커버리지</h3>
          {coverage ? (
            <>
              <dl className="topicrpt-provenance-facts">
                <div><dt>외부 문서</dt><dd>{coverage.totalDocs}건</dd></div>
                <div><dt>메모리 참조</dt><dd>{coverage.memoryCount}건</dd></div>
              </dl>
              {Object.keys(coverage.roleCounts).length > 0 && <><h4>근거 역할</h4><ul className="topicrpt-provenance-list">{Object.entries(coverage.roleCounts).map(([role, count]) => <li key={role}><strong>{role}</strong><span>{count}건</span></li>)}</ul></>}
              {Object.keys(coverage.axisCoverage).length ? (
                <ul className="topicrpt-provenance-list">
                  {Object.entries(coverage.axisCoverage).map(([key, row]) => <li key={key}><strong>{row.label || key}</strong><span>{row.count}건 · {row.level || "수준 미상"}</span></li>)}
                </ul>
              ) : <EmptyProvenance>분석 축별 커버리지가 없습니다.</EmptyProvenance>}
              {Object.keys(coverage.questionCoverage).length > 0 && <details><summary>리서치 질문 커버리지</summary><ul className="topicrpt-provenance-list">{Object.entries(coverage.questionCoverage).map(([key, row]) => <li key={key}><strong>{row.question || key}</strong><span>{row.count}건 · {row.level || "수준 미상"}</span></li>)}</ul></details>}
              {report.evidenceItems.length > 0 && (
                <details>
                  <summary>선별된 근거 {report.evidenceItems.length}건</summary>
                  <ul className="topicrpt-provenance-list">{report.evidenceItems.map((item) => <li key={item.id}><strong>{item.title}</strong><span>{[item.source, item.role, item.confidence].filter(Boolean).join(" · ")}</span></li>)}</ul>
                </details>
              )}
            </>
          ) : <EmptyProvenance />}
        </section>

        <section className="topicrpt-provenance-panel topicrpt-provenance-wide" data-qa="dr-source-ledger" aria-labelledby="dr-source-ledger-heading">
          <h3 id="dr-source-ledger-heading">외부 근거 원장</h3>
          <p className="topicrpt-layer-note">이 목록만 보고서의 권위 있는 외부 출처 원장입니다.</p>
          {report.sourceLedger.length ? (
            <ol className="topicrpt-source-ledger">
              {report.sourceLedger.map((source) => (
                <li key={source.sourceId}>
                  <div><strong>{source.title || "제목 미상"}</strong><span>{[source.source, source.date, source.evidenceRole, source.reliability, source.artifactType].filter(Boolean).join(" · ")}</span></div>
                  {source.usedInSections.length > 0 && <small>사용 섹션: {source.usedInSections.join(", ")}</small>}
                  {(source.axisKey || source.researchQuestionId || source.researchRound !== null) && <small>추적: {[source.axisKey, source.researchQuestionId, source.researchRound === null ? "" : `round ${source.researchRound}`].filter(Boolean).join(" · ")}</small>}
                  {source.url && <a href={source.url} target="_blank" rel="noopener noreferrer">원문 열기</a>}
                </li>
              ))}
            </ol>
          ) : <EmptyProvenance>확인 가능한 외부 근거 원장이 없습니다.</EmptyProvenance>}
        </section>

        <section className="topicrpt-provenance-panel" data-qa="dr-data-gaps" aria-labelledby="dr-data-gaps-heading">
          <h3 id="dr-data-gaps-heading">자료 공백</h3>
          {report.dataGaps.length ? (
            <ul className="topicrpt-provenance-list">{report.dataGaps.map((gap) => <li key={gap.id} data-severity={gap.severity}><strong>{gap.description}</strong><span>{gap.resolved ? "해결됨" : gap.suggestedAction || "추가 확인 필요"}</span></li>)}</ul>
          ) : <EmptyProvenance>기록된 자료 공백이 없습니다.</EmptyProvenance>}
        </section>

        <section className="topicrpt-provenance-panel" data-qa="dr-quality" aria-labelledby="dr-quality-heading">
          <h3 id="dr-quality-heading">품질과 경고</h3>
          {report.quality ? (
            <>
              <dl className="topicrpt-provenance-facts">
                <div><dt>평가</dt><dd>{report.quality.score ?? "—"}점 · {report.quality.grade || "등급 미상"}</dd></div>
                <div><dt>상태</dt><dd>{report.quality.status || "미기록"}</dd></div>
              </dl>
              <h4>경고</h4>{renderList(report.quality.warnings, "경고 없음")}
              <h4>보완 제안</h4>{renderList(report.quality.suggestedFixes, "제안 없음")}
            </>
          ) : <EmptyProvenance />}
        </section>

        <section className="topicrpt-provenance-panel topicrpt-provenance-wide" data-qa="dr-collection-resolution" aria-labelledby="dr-collection-resolution-heading">
          <h3 id="dr-collection-resolution-heading">Collection 실행 스냅샷</h3>
          {resolution ? (
            <>
              <dl className="topicrpt-provenance-facts topicrpt-provenance-facts-wide">
                <div><dt>Collection</dt><dd>{resolution.collectionId || "직접 범위"}</dd></div>
                <div><dt>Revision</dt><dd>{resolution.collectionRevision ?? "—"}</dd></div>
                <div><dt>후보</dt><dd>{resolution.eligibleTotal ?? "—"}건</dd></div>
                <div><dt>선택 근거</dt><dd>{resolution.selectedEvidenceIds.length}건</dd></div>
                <div><dt>후보 상한</dt><dd>{resolution.candidateCap ?? "—"}</dd></div>
                <div><dt>해결 / 실행</dt><dd>{resolution.resolvedCandidateIds.length} / {resolution.executionUniverseIds.length}건</dd></div>
              </dl>
              <details><summary>재현성 세부 정보</summary><dl className="topicrpt-provenance-facts topicrpt-provenance-facts-wide"><div><dt>Definition hash</dt><dd>{resolution.collectionDefinitionHash || "—"}</dd></div><div><dt>Input watermark</dt><dd>{resolution.inputWatermark || "—"}</dd></div><div><dt>Index generation</dt><dd>{resolution.providerGenerations.indexGeneration || "—"}</dd></div><div><dt>RSS generation</dt><dd>{resolution.providerGenerations.rssGeneration || "—"}</dd></div><div><dt>Fingerprint</dt><dd>{resolution.resolutionFingerprint || "—"}</dd></div><div><dt>Resolved at</dt><dd>{resolution.resolvedAt || "—"}</dd></div></dl></details>
              {resolution.unusableCandidates.length > 0 && <p className="topicrpt-layer-note">사용 제외 {resolution.unusableCandidates.length}건 · {resolution.unusableCandidates.map((row) => row.reason).join(", ")}</p>}
              {resolution.zeroEvidenceRequired && <p className="topicrpt-contract-warning">근거 부족 확인: {resolution.zeroEvidenceReason || "사유 미기록"}</p>}
            </>
          ) : <EmptyProvenance />}
        </section>

        <aside className="topicrpt-hypothesis-panel" data-qa="dr-user-context-hypothesis" aria-labelledby="dr-user-context-heading">
          <p className="section-kicker">HYPOTHESIS · 근거 아님</p>
          <h3 id="dr-user-context-heading">사용자 컨텍스트</h3>
          <p>{userContext || "이 보고서에는 사용자 컨텍스트가 기록되지 않았습니다."}</p>
        </aside>

        <aside className="topicrpt-hypothesis-panel topicrpt-provenance-wide" data-qa="dr-overlay-hypothesis" aria-labelledby="dr-overlay-heading">
          <p className="section-kicker">PERSONAL OVERLAY · HYPOTHESIS</p>
          <h3 id="dr-overlay-heading">개인 해석</h3>
          <PersonalOverlayView overlay={overlay} staleQa="dr-overlay-stale" />
        </aside>
      </div>
    </section>
  );
}

export function MarketStateReportContext({ resolution }: { resolution?: MarketStateResolutionPayload }) {
  if (!resolution) return null;
  const ref = readMarketStateRef(resolution);
  const reason = typeof resolution.reason === "string" ? resolution.reason : "";
  const injected = resolution.injected === true;
  const status = ref?.status || (reason === "policy_excluded" ? "excluded" : "unknown");
  const statusCopy = status === "current" && injected
    ? "생성 시점의 현재 상태를 별도 시장 배경으로 포함했습니다."
    : status === "stale" ? "최신성이 만료되어 보고서 판단에는 주입하지 않았습니다."
      : status === "fallback" ? "참고용 대체 상태이며 현재 투자 자세로 사용하지 않았습니다."
        : status === "empty" ? "사용 가능한 시장 상태가 없어 보고서 판단에 포함하지 않았습니다."
          : status === "excluded" ? "요청 정책에 따라 시장 상태를 제외했습니다."
            : "시장 상태 참조를 확인할 수 없습니다.";
  return (
    <aside className={`topicrpt-market-state-context state-${status}`} data-qa="dr-market-state-context" data-status={status} aria-label="별도 Market State 컨텍스트">
      <div><span>Market State · source-grounded context</span><strong>{status}</strong></div>
      <p>{statusCopy}</p>
      {ref ? <dl><div><dt>기준 시각</dt><dd>{ref.asOf || "없음"}</dd></div><div><dt>최신성</dt><dd>{ref.freshnessReason}</dd></div><div><dt>출처</dt><dd>{ref.sourceKind}</dd></div><div><dt>범위</dt><dd>{ref.scope}</dd></div></dl> : null}
      <small>이 컨텍스트는 외부 근거 목록·인용·가설에 포함되지 않습니다.</small>
    </aside>
  );
}

const TOPIC_PRESETS = [{ key: "custom", label: "질문 중심" }] as const;
const PRESET_LABELS: Record<string, string> = { custom: "질문 중심" };
const JOB_STATUS_VALUES = [
  "queued",
  "running",
  "cancel_requested",
  "committing",
  "done",
  "cancelled",
  "failed",
  "failed_cancel",
  "failed_commit",
  "failed_restart",
  "failed_commit_recovery",
] as const;

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Request cancelled", "AbortError"));
      return;
    }
    const timer = window.setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, ms);
    const abort = () => {
      window.clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      reject(new DOMException("Request cancelled", "AbortError"));
    };
    signal.addEventListener("abort", abort, { once: true });
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isJobStatus(value: unknown): value is JobStatus {
  return typeof value === "string" && JOB_STATUS_VALUES.includes(value as (typeof JOB_STATUS_VALUES)[number]);
}

function isAgentJob(value: unknown): value is AgentJob {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" && isJobStatus(value.status);
}

function isJobEnvelope(value: unknown): value is JobEnvelope {
  if (!isRecord(value)) return false;
  return isAgentJob(value.job);
}

class JobTerminalError extends Error {
  readonly name = "JobTerminalError";

  constructor(readonly job: AgentJob) {
    super(job.message || job.error || `딥 리서치 작업이 ${job.status} 상태로 종료되었습니다.`);
  }
}

async function pollJob(job: AgentJob, signal: AbortSignal): Promise<AgentJob> {
  let current = job;
  const deadline = Date.now() + 120_000;
  while (isActiveJobStatus(current.status)) {
    if (Date.now() >= deadline) throw new Error("작업이 아직 실행 중입니다. 잠시 후 작업 목록에서 다시 확인하세요.");
    await sleep(1000, signal);
    current = await getJson<AgentJob>(`/api/jobs/${encodeURIComponent(current.id)}`, { signal });
  }
  if (current.status !== "done") throw new JobTerminalError(current);
  return current;
}

function splitReportTitle(markdown = "", fallback = "딥 리서치") {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const firstContentIndex = lines.findIndex((line) => line.trim());
  if (firstContentIndex < 0) return { title: fallback, body: "" };
  const titleMatch = lines[firstContentIndex].trim().match(/^#\s+(.+)$/);
  if (!titleMatch) return { title: fallback, body: markdown };
  return { title: titleMatch[1], body: lines.slice(firstContentIndex + 1).join("\n").trim() };
}

function reportLabel(report: TopicReport | TopicReportSummary) {
  return report.topicLabel || report.topicKey || "딥 리서치";
}

function presetLabel(report: TopicReport | TopicReportSummary) {
  const key = String(report.topicKey || "").trim();
  return PRESET_LABELS[key] || key || "기타";
}

function displayDate(value?: string) {
  if (!value) return "날짜 미상";
  return value.slice(0, 10) || value;
}

function setTopicHash(reportId?: string) {
  window.location.hash = reportId ? deepResearchReportHash(reportId) : "#/deep-research";
}

function isDeepResearchHash() {
  return window.location.hash.replace(/^#\/?/, "").split("/")[0] === "deep-research";
}

function errorCode(error: unknown): string {
  if (error instanceof ApiRequestError) return error.code;
  if (error instanceof JobTerminalError) return error.job.errorCode || error.job.status;
  if (error instanceof Error) return error.name;
  return "request_failed";
}

function errorCopy(kind: ErrorKind, error: unknown): string {
  const code = errorCode(error);
  if (kind === "validation") return "투자 질문을 1~500자로 입력하세요.";
  if (code === "evidence_confirmation_required" || code === "resolution_changed") return "자료 상태가 계획 미리보기와 달라졌습니다. 최신 계획을 다시 미리보고 확인하세요.";
  if (code === "no_index" || code === "index_unavailable") return "연구 인덱스를 아직 읽을 수 없습니다. RSS 자료를 수집하고 인덱스를 만든 뒤 다시 시도하세요.";
  if (code === "rss_unavailable") return "RSS 자료를 읽을 수 없습니다. RSS 수집 상태를 확인한 뒤 다시 시도하세요.";
  if (code === "cli_unavailable") return "선택한 CLI 어댑터를 사용할 수 없습니다. 자동 어댑터를 선택하거나 설정을 확인하세요.";
  if (kind === "degraded") return "근거가 없는 규칙 기반 보고서를 실행하려면 근거 부족 확인이 필요합니다.";
  if (kind === "generation") return "생성 작업에 실패했습니다. 입력과 승인 계획은 유지되므로 다시 실행할 수 있습니다.";
  if (kind === "report") return "저장된 보고서를 열지 못했습니다. 목록으로 돌아가 다시 시도하세요.";
  if (error instanceof Error && error.message) return error.message;
  return "요청을 처리하지 못했습니다. 입력을 확인하고 다시 시도하세요.";
}

function approvalReference(envelope: PlanPreviewEnvelope): ApprovalReference {
  return { id: envelope.approval.id, token: envelope.approval.token };
}

function renderList(items: readonly string[], empty = "없음") {
  if (!items.length) return <span className="topicrpt-empty-value">{empty}</span>;
  return <ul className="topicrpt-inline-list">{items.map((item) => <li key={item}>{item}</li>)}</ul>;
}

function PlanReview({
  envelope,
  executionMode,
  cliAdapter,
  onExecutionMode,
  onCliAdapter,
  onContinue,
  onEdit,
  degradedConfirming,
  onConfirmDegraded,
  onCancelDegraded,
}: {
  readonly envelope: PlanPreviewEnvelope;
  readonly executionMode: ExecutionMode;
  readonly cliAdapter: CliAdapter;
  readonly onExecutionMode: (mode: ExecutionMode) => void;
  readonly onCliAdapter: (adapter: CliAdapter) => void;
  readonly onContinue: () => void;
  readonly onEdit: () => void;
  readonly degradedConfirming: boolean;
  readonly onConfirmDegraded: () => void;
  readonly onCancelDegraded: () => void;
}) {
  const { approvedRequest, preview } = envelope;
  const plan = approvedRequest.topicPlan;
  const zeroEvidence = preview.zeroEvidence;
  const reason = zeroEvidence.reasonCode;
  return (
    <section className="input-panel topicrpt-plan-panel" data-qa="dr-plan" aria-labelledby="dr-plan-heading">
      <div className="input-panel-header">
        <span className="section-kicker">PLAN REVIEW</span>
        <h2 id="dr-plan-heading">실행 전에 리서치 계획을 확인하세요</h2>
        <p>계획의 범위와 자료 상태를 확인한 뒤에만 생성 작업을 시작합니다. 이 계획은 승인된 요청의 일부로 기록됩니다.</p>
      </div>
      <div className="topicrpt-plan-grid">
        <div className="topicrpt-plan-card">
          <span className="topicrpt-plan-label">보고서 유형</span>
          <strong>{plan.reportType}</strong>
          <span className="topicrpt-plan-label">분석 축</span>
          {plan.analysisAxes.length ? (
            <ul className="topicrpt-axis-list">
              {plan.analysisAxes.map((axis) => (
                <li key={axis.key}>
                  <strong>{axis.label}</strong>
                  {renderList(axis.questions)}
                </li>
              ))}
            </ul>
          ) : <span className="topicrpt-empty-value">분석 축 없음</span>}
        </div>
        <div className="topicrpt-plan-card">
          <span className="topicrpt-plan-label">검색 질의</span>
          {renderList(plan.searchQueries)}
          <span className="topicrpt-plan-label">심층 범위</span>
          <p>최대 {plan.deepResearch.maxRounds}라운드 · 하위 질문 {plan.deepResearch.subQuestions.length}개</p>
          <span className="topicrpt-plan-label">예상 공백</span>
          {renderList(plan.dataGapsLikely)}
        </div>
        <div className="topicrpt-plan-card">
          <span className="topicrpt-plan-label">Collection 스냅샷</span>
          {approvedRequest.collectionRef ? (
            <p>저장된 외부 근거 필터 · {approvedRequest.collectionRef.id} · revision {approvedRequest.collectionRef.revision}<br />eligible {preview.resolution.eligibleTotal ?? 0} · selected {preview.resolution.selectedEvidenceIds.length}<br /><small>컬렉션은 근거가 아니며 서버가 일치 자료를 해석합니다.</small></p>
          ) : <p>저장 필터 없이 전체 허용 자료에서 확인합니다.</p>}
          {zeroEvidence.required && (
            <p className="topicrpt-zero-evidence" data-qa={`dr-readiness-${reason === "no_index" ? "no-index" : reason || "zero-evidence"}`} data-reason-code={reason || undefined}>
              {reason === "no_index" ? "인덱스 없음" : reason === "filtered_empty" ? "필터 결과 없음" : "일치 자료 없음"} · 실행 전 확인 필요
            </p>
          )}
          <span className="topicrpt-plan-label">Market State</span>
          <p>{approvedRequest.marketStatePolicy} · scope {approvedRequest.marketStateScope}<br /><small>실행 시 status · as-of · freshness · source를 별도 컨텍스트로 기록합니다.</small></p>
        </div>
      </div>
      {zeroEvidence.required && reason && zeroEvidence.resolutionFingerprint && (
        <div className="topicrpt-degraded-panel" data-qa={`dr-degraded-${reason === "no_index" ? "no-index" : reason}`} data-reason-code={reason} role="alert">
          <strong>근거 부족 상태를 확인해야 합니다</strong>
          <p>현재 선택된 외부 근거가 0건입니다. 확인하면 규칙 기반 결과로 진행하며, 보고서에 근거 공백과 반대 근거를 표시합니다.</p>
          {degradedConfirming ? (
            <div className="topicrpt-degraded-actions">
              <button className="filter-btn apply" type="button" data-qa="dr-degraded-confirm" onClick={onConfirmDegraded}>근거 부족을 확인하고 계속</button>
              <button className="filter-btn clear" type="button" onClick={onCancelDegraded}>취소</button>
            </div>
          ) : <p>계속하기를 누르면 확인 단계가 열립니다.</p>}
        </div>
      )}
      <div className="topicrpt-action-row">
        <label className="field topicrpt-execution-field">
          <span>실행 경로</span>
          <select value={executionMode} onChange={(event) => onExecutionMode(event.currentTarget.value as ExecutionMode)}>
            <option value="direct">Direct API</option>
            <option value="cli">CLI</option>
          </select>
        </label>
        {executionMode === "cli" && (
          <label className="field topicrpt-execution-field">
            <span>CLI 어댑터</span>
            <select value={cliAdapter} onChange={(event) => onCliAdapter(event.currentTarget.value as CliAdapter)}>
              <option value="auto">자동 선택</option>
              <option value="codex">Codex</option>
              <option value="claude">Claude</option>
              <option value="antigravity">Antigravity</option>
            </select>
          </label>
        )}
        <button className="filter-btn clear" type="button" onClick={onEdit}>질문 수정</button>
        <button className="filter-btn apply" type="button" data-qa="dr-continue" onClick={onContinue}>
          {zeroEvidence.required ? "계속하기" : "이 계획으로 생성"}
        </button>
      </div>
    </section>
  );
}

export function DeepResearchRoute() {
  const [workLogRefreshKey, setWorkLogRefreshKey] = useState(0);
  const [reports, setReports] = useState<TopicReportSummary[]>([]);
  const [selected, setSelected] = useState<TopicReport | null>(null);
  const initialLocation = useMemo(() => parseDeepResearchLocation(window.location.hash), []);
  const [detailId, setDetailId] = useState(initialLocation.kind === "report" ? initialLocation.id : "");
  const [collectionDetailId, setCollectionDetailId] = useState(initialLocation.kind === "collection" ? initialLocation.id : "");
  const [malformedRoute, setMalformedRoute] = useState(initialLocation.malformed);
  const [question, setQuestion] = useState("");
  const [userContext, setUserContext] = useState("");
  const [marketStatePolicy, setMarketStatePolicy] = useState<MarketStatePolicy>("include_current");
  const [marketStateScope, setMarketStateScope] = useState<MarketStateScope>("AUTO");
  const [selectedCollectionRef, setSelectedCollectionRef] = useState<CollectionRef | null>(null);
  const [collectionBusy, setCollectionBusy] = useState(false);
  const [phase, setPhase] = useState<DeepResearchPhase>("readiness");
  const [planEnvelope, setPlanEnvelope] = useState<PlanPreviewEnvelope | null>(null);
  const [executionMode, setExecutionMode] = useState<ExecutionMode>("direct");
  const [cliAdapter, setCliAdapter] = useState<CliAdapter>("auto");
  const [degradedConfirming, setDegradedConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null);
  const [errorReason, setErrorReason] = useState("");
  const [readinessKind, setReadinessKind] = useState<"no-index" | "rss" | "api" | null>(null);
  const [status, setStatus] = useState("");
  const [actionBusy, setActionBusy] = useState("");
  const [proposalReloadKey, setProposalReloadKey] = useState(0);
  const requestId = useRef(0);
  const requestController = useRef<AbortController | null>(null);
  const listHeadingRef = useRef<HTMLHeadingElement>(null);
  const openingReportId = useRef("");
  const restoreFocusPending = useRef(false);

  const topicKey = TOPIC_PRESETS[0].key;
  const customLabel = question;
  const deepResearch = true;

  const beginRequest = useCallback(() => {
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    requestId.current += 1;
    return { id: requestId.current, signal: controller.signal };
  }, []);

  const isCurrentRequest = useCallback((id: number) => id === requestId.current, []);

  const loadReports = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const payload = await getJson<unknown>("/api/topic-reports", { signal });
      setReports(parseTopicReportSummaries(payload));
      setReadinessKind(null);
      setPhase((current) => current === "readiness" ? "draft" : current);
      setReactAgentContextScope("deep-research", { surface: "topic_report", viewId: "topicrpt", reportKind: "", reportId: "", collectionId: null, collectionRevision: null });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(errorCopy("readiness", err));
      setErrorKind("readiness");
      setErrorReason(errorCode(err));
      const code = errorCode(err);
      setReadinessKind(code === "no_index" || code === "index_unavailable" ? "no-index" : code === "rss_unavailable" ? "rss" : "api");
      setPhase("recoverable-error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadReports(controller.signal);
    return () => controller.abort();
  }, [loadReports]);

  useEffect(() => {
    const ownedCollectionIdentity = {
      collectionId: selectedCollectionRef?.id || null,
      collectionRevision: selectedCollectionRef?.revision || null,
    };
    patchReactAgentContextScope("deep-research", ownedCollectionIdentity);
    return () => {
      const current = window.FolioAgent?.currentContext;
      if (
        current?.collectionId === ownedCollectionIdentity.collectionId
        && current.collectionRevision === ownedCollectionIdentity.collectionRevision
      ) {
        patchReactAgentContextScope("deep-research", { collectionId: null, collectionRevision: null });
      }
    };
  }, [selectedCollectionRef]);

  useEffect(() => {
    const handleHashChange = () => {
      if (!isDeepResearchHash()) return;
      const route = parseDeepResearchLocation(window.location.hash);
      setMalformedRoute(route.malformed);
      setDetailId(route.kind === "report" ? route.id : "");
      setCollectionDetailId(route.kind === "collection" ? route.id : "");
      if (route.malformed) {
        setSelected(null);
        setError(route.kind === "collection"
          ? "컬렉션 주소 형식이 올바르지 않습니다. 목록으로 돌아가 다시 여세요."
          : "보고서 주소 형식이 올바르지 않습니다. 목록으로 돌아가 다시 여세요.");
        setErrorKind("report");
        setErrorReason(route.kind === "collection" ? "malformed_collection_id" : "malformed_report_id");
        setPhase("recoverable-error");
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const returnToReportList = useCallback(() => {
    restoreFocusPending.current = true;
    setSelected(null);
    setMalformedRoute(false);
    setError("");
    setErrorKind(null);
    setErrorReason("");
    setTopicHash();
  }, []);

  useEffect(() => {
    if (detailId || malformedRoute || !restoreFocusPending.current) return;
    restoreFocusPending.current = false;
    window.requestAnimationFrame(() => {
      const reportId = openingReportId.current.replace(/["\\]/g, "");
      const opener = reportId ? document.querySelector<HTMLElement>("[data-report-id=\"" + reportId + "\"]") : null;
      (opener || listHeadingRef.current)?.focus({ preventScroll: true });
    });
  }, [detailId, malformedRoute, phase]);

  useEffect(() => {
    const handleProposalLifecycle = (event: Event) => {
      const result = (event as CustomEvent<ProposalLifecycleResult>).detail;
      if (proposalTargetsContext(result, window.FolioAgent?.currentContext)) {
        setProposalReloadKey((value) => value + 1);
        setWorkLogRefreshKey((value) => value + 1);
      }
    };
    window.addEventListener(PROPOSAL_LIFECYCLE_EVENT, handleProposalLifecycle);
    return () => window.removeEventListener(PROPOSAL_LIFECYCLE_EVENT, handleProposalLifecycle);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    requestController.current?.abort();
    const detailRequest = requestId.current + 1;
    requestId.current = detailRequest;
    async function loadDetail(reportId: string) {
      setLoading(true);
      setError("");
      setErrorKind(null);
      setErrorReason("");
      try {
        const payload = await getJson<unknown>(`/api/topic-reports/${encodeURIComponent(reportId)}?includePersonal=true`, { signal: controller.signal });
        if (controller.signal.aborted || requestId.current !== detailRequest) return;
        const report = parseTopicReportPayload(payload);
        setSelected(report);
        setPhase("report");
        setReactAgentContextScope("deep-research", { surface: "topic_report_reader", viewId: "topicrpt", reportKind: "topic_report", reportId: report.id || reportId, collectionId: selectedCollectionRef?.id || null, collectionRevision: selectedCollectionRef?.revision || null });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (controller.signal.aborted || requestId.current !== detailRequest) return;
        setSelected(null);
        setError(errorCopy("report", err));
        setErrorKind("report");
        setErrorReason(errorCode(err));
        setPhase("recoverable-error");
      } finally {
        if (!controller.signal.aborted && requestId.current === detailRequest) setLoading(false);
      }
    }
    if (detailId && !malformedRoute) {
      void loadDetail(detailId);
    } else if (!malformedRoute && !collectionDetailId) {
      setSelected(null);
      setPhase((current) => current === "report" ? "draft" : current);
      setReactAgentContextScope("deep-research", { surface: "topic_report", viewId: "topicrpt", reportKind: "", reportId: "", collectionId: selectedCollectionRef?.id || null, collectionRevision: selectedCollectionRef?.revision || null });
      setLoading(false);
    }
    return () => controller.abort();
  }, [collectionDetailId, detailId, malformedRoute, proposalReloadKey]);

  const handlePreview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedQuestion = question.normalize("NFKC").trim();
    if (!normalizedQuestion || normalizedQuestion.length > 500) {
      setError(errorCopy("validation", new Error("question_invalid")));
      setErrorKind("validation");
      setErrorReason("question_invalid");
      setPhase("recoverable-error");
      return;
    }
    const request = beginRequest();
    setPhase("plan-loading");
    setPlanEnvelope(null);
    setDegradedConfirming(false);
    setError("");
    setErrorKind(null);
    setErrorReason("");
    setStatus("질문을 실행 계획으로 바꾸는 중입니다.");
    const body: PlanRequest = {
      question: normalizedQuestion,
      userContext: userContext.normalize("NFKC").trim(),
      deepResearch: true,
      customTickers: {},
      marketStatePolicy,
      marketStateScope,
      collectionRef: selectedCollectionRef,
    };
    try {
      const envelope = await postJson<PlanPreviewEnvelope>("/api/topic-reports/plan", body, { signal: request.signal });
      if (!isCurrentRequest(request.id)) return;
      setPlanEnvelope(envelope);
      setPhase("plan-review");
      setStatus("실행 계획을 확인하세요.");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (!isCurrentRequest(request.id)) return;
      setError(errorCopy("plan", err));
      setErrorKind("plan");
      setErrorReason(errorCode(err));
      setReadinessKind(errorCode(err) === "no_index" || errorCode(err) === "index_unavailable" ? "no-index" : errorCode(err) === "rss_unavailable" ? "rss" : null);
      setPhase("recoverable-error");
      setStatus("");
    }
  };

  const executeEnvelope = async (envelope: PlanPreviewEnvelope) => {
    const request = beginRequest();
    setPhase("generation");
    setError("");
    setErrorKind(null);
    setErrorReason("");
    setStatus("승인된 계획으로 리서치를 생성하는 중입니다.");
    const execution: ExecutionRequest = {
      mode: executionMode,
      adapter: executionMode === "direct" ? "auto" : cliAdapter,
      fallbackPolicy: FALLBACK_POLICY,
    };
    const body: GenerateApprovedRequest = {
      approvedRequest: envelope.approvedRequest,
      approval: approvalReference(envelope),
      execution,
    };
    try {
      const response = await postJson<JobEnvelope>("/api/topic-reports", body, { signal: request.signal });
      const job = isJobEnvelope(response) ? response.job : isAgentJob(response) ? response : null;
      if (!job) throw new Error("생성 작업 ID를 확인하지 못했습니다.");
      const done = await pollJob(job, request.signal);
      setWorkLogRefreshKey((current) => current + 1);
      if (!isCurrentRequest(request.id)) return;
      const reportId = done.result?.reportId || done.result?.artifactId || "";
      if (!reportId) throw new Error("생성된 보고서 ID를 확인하지 못했습니다.");
      const report = parseTopicReportPayload(await getJson<unknown>(`/api/topic-reports/${encodeURIComponent(reportId)}?includePersonal=true`, { signal: request.signal }));
      if (!isCurrentRequest(request.id)) return;
      setReports((current) => [report, ...current.filter((item) => item.id !== report.id)]);
      setSelected(report);
      setPhase("report");
      setStatus("딥 리서치를 생성하고 자동 저장했습니다.");
      setTopicHash(report.id);
      setReactAgentContextScope("deep-research", { surface: "topic_report_reader", viewId: "topicrpt", reportKind: "topic_report", reportId: report.id || "", collectionId: selectedCollectionRef?.id || null, collectionRevision: selectedCollectionRef?.revision || null });
    } catch (err) {
      setWorkLogRefreshKey((current) => current + 1);
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (!isCurrentRequest(request.id)) return;
      setError(errorCopy("generation", err));
      setErrorKind(err instanceof ApiRequestError && (err.code === "evidence_confirmation_required" || err.code === "resolution_changed") ? "degraded" : "generation");
      setErrorReason(errorCode(err));
      setPhase("recoverable-error");
      setStatus("");
    }
  };

  const handleContinue = () => {
    if (!planEnvelope) return;
    if (planEnvelope.preview.zeroEvidence.required) {
      if (!planEnvelope.preview.zeroEvidence.reasonCode || !planEnvelope.preview.zeroEvidence.resolutionFingerprint) {
        setError("근거 부족 확인 정보가 없어 실행을 중단했습니다. 계획을 다시 미리보세요.");
        setErrorKind("degraded");
        setErrorReason("invalid_zero_evidence");
        setPhase("recoverable-error");
        return;
      }
      setDegradedConfirming(true);
      setStatus("근거 부족 확인을 검토하세요.");
      return;
    }
    void executeEnvelope(planEnvelope);
  };

  const confirmDegraded = async () => {
    if (!planEnvelope) return;
    const zeroEvidence = planEnvelope.preview.zeroEvidence;
    if (!zeroEvidence.required || !zeroEvidence.reasonCode || !zeroEvidence.resolutionFingerprint) return;
    const request = beginRequest();
    setError("");
    setErrorKind(null);
    setErrorReason("");
    setStatus("근거 부족 확인을 저장하는 중입니다.");
    const body: ConfirmDegradedRequest = {
      approvedRequest: planEnvelope.approvedRequest,
      approval: approvalReference(planEnvelope),
      reasonCode: zeroEvidence.reasonCode,
      resolutionFingerprint: zeroEvidence.resolutionFingerprint,
      confirmed: true,
    };
    try {
      const replacement = await postJson<PlanPreviewEnvelope>("/api/topic-reports/confirm-degraded", body, { signal: request.signal });
      if (!isCurrentRequest(request.id)) return;
      setPlanEnvelope(replacement);
      setDegradedConfirming(false);
      await executeEnvelope(replacement);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (!isCurrentRequest(request.id)) return;
      setError(errorCopy("degraded", err));
      setErrorKind("degraded");
      setErrorReason(errorCode(err));
      setPhase("recoverable-error");
      setStatus("");
    }
  };

  async function deleteReport(report: TopicReportSummary) {
    if (!report.id || !window.confirm(`${reportLabel(report)} 보고서를 삭제할까요?`)) return;
    setActionBusy(`delete-${report.id}`);
    setError("");
    try {
      const response = await fetch(`/api/topic-reports/${encodeURIComponent(report.id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`삭제 실패: ${response.status}`);
      if (selected?.id === report.id) setTopicHash();
      setReports((current) => current.filter((item) => item.id !== report.id));
      setStatus("저장된 딥 리서치를 삭제했습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "보고서 삭제에 실패했습니다.");
      setErrorKind("report");
      setErrorReason(errorCode(err));
    } finally {
      setActionBusy("");
    }
  }

  async function exportTopicReport(target: "notion" | "obsidian") {
    if (!selected) return;
    setActionBusy(target);
    setStatus(target === "notion" ? "Notion으로 내보내는 중..." : "Obsidian으로 내보내는 중...");
    try {
      const result = target === "notion"
        ? await postJson<ExportResult>("/api/export-notion/topic-report", selected)
        : await postJson<ExportResult>("/api/export-obsidian/topic-report", selected);
      setStatus(target === "notion"
        ? `Notion으로 내보냈습니다${result.title ? `: ${result.title}` : ""}`
        : `Obsidian으로 내보냈습니다${result.topic || result.filename ? `: ${result.topic || result.filename}` : ""}`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "내보내기에 실패했습니다.");
    } finally {
      setActionBusy("");
    }
  }

  async function generatePersonalOverlay() {
    if (!selected?.id) return;
    setActionBusy("overlay");
    setStatus("내 노트와 연결하는 중...");
    try {
      const response = await postJson<OverlayResult | AgentJob>(`/api/topic-reports/${encodeURIComponent(selected.id)}/personal-overlay`, {});
      if (isAgentJob(response)) await pollJob(response, new AbortController().signal);
      const updated = parseTopicReportPayload(await getJson<unknown>(`/api/topic-reports/${encodeURIComponent(selected.id)}?includePersonal=true`));
      setSelected(updated);
      setStatus("내 노트와 연결했습니다.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "내 노트 연결에 실패했습니다.");
    } finally {
      setActionBusy("");
    }
  }

  const groupedReports = useMemo(() => {
    const groups = new Map<string, TopicReportSummary[]>();
    for (const report of reports) {
      const key = presetLabel(report);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)?.push(report);
    }
    return Array.from(groups.entries())
      .map(([key, rows]) => ({ key, rows: rows.sort((a, b) => String(b.generatedAt || b.date || "").localeCompare(String(a.generatedAt || a.date || ""))) }))
      .sort((a, b) => String(b.rows[0]?.generatedAt || b.rows[0]?.date || "").localeCompare(String(a.rows[0]?.generatedAt || a.rows[0]?.date || "")));
  }, [reports]);

  const readerContent = splitReportTitle(selected?.markdown || "", selected ? reportLabel(selected) : "딥 리서치");
  const selectedMarketStateContext = marketStateContextProjection(selected?.marketStateResolution);

  const referenceInvestmentContext = useCallback((context: InvestmentTickerContext) => {
    const source = context.source === "both"
      ? "포트폴리오·워치리스트"
      : context.source === "portfolio"
        ? "포트폴리오"
        : "워치리스트";
    const reference = `개인 맥락(hypothesis): ${context.ticker} · ${source}`;
    setUserContext((current) => {
      const lines = current.split("\n").map((line) => line.trim()).filter(Boolean);
      if (lines.includes(reference)) return current;
      return [...lines, reference].join("\n").slice(0, 4000);
    });
  }, []);

  if (collectionDetailId && !malformedRoute) {
    return (
      <div className="react-deep-research-route" data-deep-research-route>
        <SmartCollectionWorkspace
          collectionId={collectionDetailId}
          onBack={() => setTopicHash()}
          onStartResearch={(ref) => {
            setSelectedCollectionRef(ref);
            setTopicHash();
          }}
        />
      </div>
    );
  }

  if (detailId && !selected && !(phase === "recoverable-error" && errorKind === "report")) {
    return (
      <div className="react-deep-research-route" data-deep-research-route>
        <section className="topicrpt-report-state" data-qa="dr-report-loading" role="status" aria-live="polite" aria-busy="true">
          <p className="section-kicker">DEEP RESEARCH</p>
          <h1 tabIndex={-1}>저장된 리포트를 여는 중입니다</h1>
          <p>Canonical 보고서와 구조화된 근거 원장을 함께 확인하고 있습니다.</p>
        </section>
      </div>
    );
  }

  if ((detailId || malformedRoute) && !selected && (malformedRoute || (phase === "recoverable-error" && errorKind === "report"))) {
    const notFound = errorReason === "topic_report_not_found" || errorReason === "not_found";
    return (
      <div className="react-deep-research-route" data-deep-research-route>
        <section
          className="topicrpt-report-state is-error"
          data-qa={notFound ? "dr-report-not-found" : "dr-report-error"}
          role="alert"
          aria-live="assertive"
        >
          <p className="section-kicker">DEEP RESEARCH</p>
          <h1>{notFound ? "저장된 리포트를 찾을 수 없습니다" : "리포트를 열 수 없습니다"}</h1>
          <p data-qa={notFound ? "dr-not-found" : undefined}>{error || "보고서 주소나 저장 데이터를 확인한 뒤 목록에서 다시 여세요."}</p>
          <button className="filter-btn clear" type="button" data-qa="dr-report-return" onClick={returnToReportList}>딥 리서치 목록으로 돌아가기</button>
        </section>
      </div>
    );
  }

  if (selected && phase === "report") {
    return (
      <div className="react-deep-research-route" data-deep-research-route data-qa="dr-report">
        {error && <p className="react-dashboard-error" data-qa="dr-error-report">{error}</p>}
        {(selected.mode === "fallback" || selected.generation?.mode === "rules") && <p className="react-dashboard-warning" data-qa="dr-degraded-rules" role="status">근거 부족을 확인한 규칙 기반 보고서입니다. 자료 공백과 반대 근거를 함께 확인하세요.</p>}
        <ReportReaderShell
          eyebrow={`DEEP RESEARCH${selected.date ? ` · ${selected.date}` : ""}`}
          title={readerContent.title}
          meta={`${reportLabel(selected)} · 뉴스 ${selected.docCount || 0}건 · 내러티브 ${selected.memoryCount || 0}건`}
          agentContext={{ surface: "topic_report_reader", viewId: "topicrpt", reportKind: "topic_report", reportId: selected.id || "", topic: reportLabel(selected), marketState: selectedMarketStateContext }}
          breadcrumb={(
            <>
              <button type="button" data-qa="dr-report-return" onClick={returnToReportList}>딥 리서치</button>
              <span>{readerContent.title}</span>
            </>
          )}
          onClose={returnToReportList}
          actionSlot={(
            <>
              <ReaderActionGroup title="AI">
                <ReaderActionButton icon="agent" onClick={() => openReactAgentDock({ surface: "topic_report_reader", reportKind: "topic_report", reportId: selected.id || "", topic: reportLabel(selected), message: `${readerContent.title}의 핵심 결론, 반대 근거, 더 발전시킬 분석 방향을 정리해줘.`, autoSubmit: true })}>Agent에게 묻기</ReaderActionButton>
              </ReaderActionGroup>
              <ReaderActionGroup title="노트">
                <ReaderActionButton icon="link" data-qa="dr-overlay-generate" disabled={actionBusy === "overlay" || !selected.id} onClick={generatePersonalOverlay}>{actionBusy === "overlay" ? "연결 중" : "내 노트와 연결"}</ReaderActionButton>
              </ReaderActionGroup>
              <ReaderActionGroup title="내보내기">
                <ReaderActionButton icon="notion" disabled={actionBusy === "notion"} onClick={() => exportTopicReport("notion")}>{actionBusy === "notion" ? "내보내는 중" : "Notion으로 내보내기"}</ReaderActionButton>
                <ReaderActionButton icon="obsidian" disabled={actionBusy === "obsidian"} onClick={() => exportTopicReport("obsidian")}>{actionBusy === "obsidian" ? "내보내는 중" : "Obsidian으로 내보내기"}</ReaderActionButton>
              </ReaderActionGroup>
              {selected.generation?.message && <p className="react-reader-status">{selected.generation.message}</p>}
              {status && <p className="react-reader-status">{status}</p>}
            </>
          )}
          noteIdentity={{ id: stableNoteKey("topic", reportLabel(selected)), noteType: "topic_review", title: reportLabel(selected) ? `${reportLabel(selected)} 리서치 노트` : "딥 리서치 노트", topic: reportLabel(selected), label: reportLabel(selected), reportKind: "topic_report", reportId: reportLabel(selected), linkedReports: [readerContent.title].filter(Boolean) }}
          noteLinkedTitle={readerContent.title}
          noteOverlay={parsePersonalOverlayPayload(selected.personalOverlay, selected.canonicalRevision)}
        >
          <MarketStateReportContext resolution={selected.marketStateResolution} />
          <ReportBody markdown={readerContent.body || selected.markdown || ""} />
          <DeepResearchProvenance report={selected} />
        </ReportReaderShell>
      </div>
    );
  }

  const isBusy = phase === "plan-loading" || phase === "generation" || loading || collectionBusy;
  const showError = phase === "recoverable-error" && error;
  return (
    <div className="react-deep-research-route" data-deep-research-route>
      <RouteHero
        eyebrow="Deep Research"
        title="딥 리서치"
        description="투자 질문을 먼저 실행 계획으로 정리한 뒤, 외부 근거와 시장 상태를 구분해 bounded research를 생성합니다."
        actions={<button className="filter-btn clear" type="button" onClick={() => void loadReports()} disabled={loading}>{loading ? "불러오는 중" : "다시 읽기"}</button>}
      />

      {phase === "readiness" && <p className="react-dashboard-warning" data-qa="dr-readiness-loading" role="status">저장된 리포트와 자료 상태를 확인하는 중입니다.</p>}
      {readinessKind && phase === "recoverable-error" && <p className="react-dashboard-error" data-qa={`dr-readiness-${readinessKind}`}>{error}</p>}
      {showError && <div className="react-dashboard-error topicrpt-recoverable-error" data-qa={`dr-error-${errorKind || "request"}`} role="alert"><strong>다시 시도할 수 있습니다</strong><span data-qa={`dr-error-${(errorReason || "request").replace(/_/g, "-")}`} data-error-code={errorReason || "request"}>{error}</span><p>입력한 질문과 컨텍스트, 마지막 계획은 유지됩니다.</p><button className="filter-btn clear" type="button" onClick={() => { setError(""); setErrorKind(null); setErrorReason(""); setPhase(planEnvelope ? "plan-review" : "draft"); }}>돌아가서 수정</button></div>}

      {phase !== "plan-review" && phase !== "generation" && (
        <form className="input-panel topicrpt-form" onSubmit={handlePreview} noValidate>
          <div className="input-panel-header">
            <span className="section-kicker">QUESTION FIRST</span>
            <h2>무엇을 투자 판단으로 확인하고 싶나요?</h2>
            <p>질문은 1~500자로 입력하세요. 컨텍스트는 가설로만 전달되며 외부 근거로 승격되지 않습니다.</p>
          </div>
          <div className="topicrpt-topic-row">
            <div className="topicrpt-preset-btns" aria-label="리서치 모드">
              {TOPIC_PRESETS.map((preset) => <span className="filter-btn topicrpt-preset active" data-topic={preset.key} key={preset.key}>{preset.label}</span>)}
            </div>
          </div>
          <label className="field topicrpt-question-field">
            <span>투자 질문</span>
            <textarea data-qa="dr-question" value={question} onChange={(event) => setQuestion(event.currentTarget.value)} maxLength={500} rows={4} placeholder="예: 미국 전력 수요 증가가 12개월 내 반도체 공급망과 관련 기업에 어떤 영향을 줄까?" required aria-describedby="dr-question-help" />
            <small id="dr-question-help">{question.length}/500</small>
          </label>
          <label className="field topicrpt-context-field">
            <span>추가 컨텍스트 <em>(선택)</em></span>
            <textarea data-qa="dr-context" value={userContext} onChange={(event) => setUserContext(event.currentTarget.value)} maxLength={4000} rows={4} placeholder="예: 보유 종목, 관심 지역, 확인할 기간 등. 이 내용은 hypothesis로 표시됩니다." />
          </label>
          <InvestmentContextCard mode="deep-research" onReference={referenceInvestmentContext} />
          <SmartCollectionsPanel
            selectedRef={selectedCollectionRef}
            onSelectedRef={setSelectedCollectionRef}
            onBusyChange={setCollectionBusy}
            onOpenDetail={(collectionId) => { window.location.hash = deepResearchCollectionHash(collectionId); }}
            disabled={phase === "plan-loading" || loading}
          />
          <div className="topicrpt-action-row">
            <label className="field topicrpt-policy-field">
              <span>Market State 정책</span>
              <select value={marketStatePolicy} onChange={(event) => setMarketStatePolicy(event.currentTarget.value as MarketStatePolicy)}>
                <option value="include_current">현재 상태 포함</option>
                <option value="exclude">제외</option>
              </select>
            </label>
            <label className="field topicrpt-policy-field">
              <span>Market State 범위</span>
              <select value={marketStateScope} onChange={(event) => setMarketStateScope(event.currentTarget.value as MarketStateScope)}>
                <option value="AUTO">자동</option>
                <option value="GLOBAL">글로벌</option>
                <option value="US">미국</option>
                <option value="KR">한국</option>
              </select>
            </label>
            <span className="topicrpt-policy-note">Deep research · 최대 2라운드</span>
            <button className="filter-btn apply" type="submit" data-qa="dr-preview" disabled={isBusy}>{phase === "plan-loading" ? "계획 준비 중" : "계획 미리보기"}</button>
          </div>
          <input type="hidden" value={customLabel} data-legacy-topic={topicKey} readOnly aria-hidden="true" />
          <input type="hidden" value={deepResearch ? "true" : "false"} readOnly aria-hidden="true" />
        </form>
      )}

      {phase === "plan-review" && planEnvelope && (
        <PlanReview
          envelope={planEnvelope}
          executionMode={executionMode}
          cliAdapter={cliAdapter}
          onExecutionMode={setExecutionMode}
          onCliAdapter={setCliAdapter}
          onContinue={handleContinue}
          onEdit={() => { setPhase("draft"); setStatus(""); }}
          degradedConfirming={degradedConfirming}
          onConfirmDegraded={() => void confirmDegraded()}
          onCancelDegraded={() => setDegradedConfirming(false)}
        />
      )}

      {phase === "generation" && <section className="input-panel topicrpt-generation-panel" data-qa="dr-generation" aria-live="polite"><span className="section-kicker">GENERATING</span><h2>승인된 계획을 실행하는 중입니다</h2><p data-qa="dr-generation-status">{status || "작업 상태를 확인하는 중입니다."}</p></section>}

      {status && phase !== "generation" && phase !== "report" && <p className="react-dashboard-warning" data-qa="dr-status" role="status">{status}</p>}

      <div className="section-head compact analysis-archive-head topicrpt-saved-panel">
        <div><h2 ref={listHeadingRef} className="section-title" tabIndex={-1}>저장된 리포트</h2><p className="section-subtitle">카드를 누르면 원문·근거·개인 레이어를 확인할 수 있습니다.</p></div>
      </div>
      <div className="report-feed">
        {groupedReports.length ? groupedReports.map((group) => (
          <section className="report-feed-group" key={group.key}>
            <div className="report-feed-group-head"><span className="report-feed-group-name">{group.key}</span><span className="report-feed-group-meta">{group.rows.length}건 · 최근 {displayDate(group.rows[0]?.generatedAt || group.rows[0]?.date)}</span></div>
            <div className="report-feed-group-cards">
              {group.rows.map((report) => {
                const deleting = actionBusy === `delete-${report.id}`;
                return (
                  <div className="report-feed-card-wrap" key={report.id || `${reportLabel(report)}-${report.date}`}>
                    <button className="report-feed-card is-topic" type="button" data-report-id={report.id} onClick={() => { if (report.id) { openingReportId.current = report.id; setTopicHash(report.id); } }}><span className="report-feed-card-meta">{report.mode && <span className="report-feed-badge">{String(report.mode).toUpperCase()}</span>}</span><strong>{reportLabel(report)}</strong><span className="report-feed-card-foot">{displayDate(report.date || report.generatedAt)}</span></button>
                    <button type="button" className="report-feed-card-delete" disabled={deleting} onClick={() => void deleteReport(report)} aria-label={`${reportLabel(report)} 삭제`} data-tooltip="삭제"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 4h11M6 4V2.5h4V4M5 4l.5 9h5L11 4" /></svg></button>
                  </div>
                );
              })}
            </div>
          </section>
        )) : <div className="report-feed-empty" data-qa="dr-report-list-empty">저장된 딥 리서치가 없습니다. 질문을 입력해 실행 계획을 미리보세요.</div>}
      </div>
      <AgentWorkLog surface="deep-research" pageSize={20} defaultFilter="task" refreshKey={workLogRefreshKey} />
    </div>
  );
}
