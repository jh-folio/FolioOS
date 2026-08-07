import { useEffect, useRef, useState } from "react";
import type { PositionDraft } from "./HoldingsTable";

type ImportDraft = { ticker: string; name?: string; quantity: number | null; averagePrice: number | null; status: "confirmed" | "needs_review" | "unresolved"; action: "skip" | "merge" | "replace"; issues?: string[] };
type PreviewPayload = { engine?: string; drafts?: ImportDraft[]; notices?: string[]; persisted?: boolean };
type Preflight = { available?: boolean; ready?: boolean; reason?: string; languages?: string[]; languagesRequired?: string[]; agent?: { available?: boolean; reason?: string; message?: string } };
type ImportMode = "agent" | "local" | "vision";

// 설정 화면에는 **CLI 경로를 넣는 칸이 없다.** 경로는 PATH에서 자동으로 찾는다.
// 그러니 "설정에서 경로를 지정하세요"라고 쓰면 없는 칸을 찾게 만든다. 사용자가
// 실제로 할 수 있는 일만 적는다.
const AGENT_REASONS: Record<string, string> = {
  agent_disabled: "설정 › 연동에서 AI Agent 사용이 꺼져 있습니다. 켜면 이 방식을 쓸 수 있습니다.",
  agent_cli_unavailable: "쓸 수 있는 Agent CLI가 없습니다. Codex 또는 Claude Code CLI를 설치하고 로그인하면 자동으로 잡힙니다. 설정 › 연동에 CLI별 상태가 보입니다.",
  agent_status_unknown: "Agent CLI 상태를 확인하지 못했습니다.",
};

function agentReasonText(agent: Preflight["agent"]): string {
  const base = AGENT_REASONS[String(agent?.reason || "")] || "Agent CLI를 쓸 수 없습니다.";
  // 브리지가 더 구체적인 사유를 알면(로그인 필요 등) 그 문장을 함께 보여준다.
  const detail = String(agent?.message || "").trim();
  return detail && agent?.reason !== "agent_disabled" ? `${base} (${detail})` : base;
}

// 서버는 기계 코드를 던진다. 다이얼로그는 사람이 다음에 무엇을 할지 알 수 있는 말로 바꾼다.
const IMPORT_ERRORS: Record<string, string> = {
  vision_provider_not_configured: "외부 Vision을 쓰려면 설정에서 OpenAI API 키를 먼저 저장해야 합니다.",
  vision_consent_required: "외부 Vision 전송 동의가 필요합니다.",
  vision_request_failed: "외부 Vision 요청이 실패했습니다. 잠시 후 다시 시도해 주세요.",
  portfolio_image_type_invalid: "PNG·JPEG·WebP 이미지만 사용할 수 있습니다.",
  portfolio_image_size_invalid: "이미지 용량이 너무 큽니다. 잘라내기로 범위를 줄여 주세요.",
  tesseract_not_installed: "Tesseract가 설치되어 있지 않습니다.",
  tesseract_timeout: "로컬 인식이 시간 안에 끝나지 않았습니다. 잘라내기로 범위를 줄여 주세요.",
  tesseract_failed: "로컬 인식에 실패했습니다.",
  agent_import_cli_failed: "Agent CLI 실행이 실패했거나 시간 안에 끝나지 않았습니다. 잘라내기로 범위를 줄이거나 다시 시도해 주세요.",
  agent_import_image_unreadable: "Agent CLI가 사진을 열지 못했습니다.",
  agent_import_not_json: "Agent CLI가 표 형식으로 답하지 않았습니다. 다시 시도해 주세요.",
  agent_import_empty_output: "Agent CLI가 아무 답도 주지 않았습니다. 다시 시도해 주세요.",
};

function importErrorText(detail: string): string {
  const key = String(detail || "").trim();
  return IMPORT_ERRORS[key] || key || "이미지 인식 실패";
}

const PREFLIGHT_REASONS: Record<string, string> = {
  tesseract_not_installed: "Tesseract가 설치되어 있지 않습니다.",
  tesseract_preflight_failed: "Tesseract를 실행하지 못했습니다.",
  tesseract_languages_missing: "Tesseract 한국어(kor) 언어 데이터가 없습니다.",
};

type CropBox = { top: number; right: number; bottom: number; left: number; redactTop: number };
const EMPTY_CROP: CropBox = { top: 0, right: 0, bottom: 0, left: 0, redactTop: 0 };

function mergePositions(current: PositionDraft[], imports: ImportDraft[]): PositionDraft[] {
  const next = current.map((row) => ({ ...row }));
  for (const item of imports) {
    if (!item.ticker || !item.quantity || item.action === "skip") continue;
    const index = next.findIndex((row) => row.ticker.toUpperCase() === item.ticker.toUpperCase());
    const incoming: PositionDraft = { ticker: item.ticker, quantity: item.quantity, averagePrice: item.averagePrice ?? "" };
    if (index < 0) next.push(incoming);
    else if (item.action === "replace") next[index] = { ...next[index], ...incoming };
    else {
      const oldQuantity = Number(next[index].quantity) || 0;
      const rawOldPrice = next[index].averagePrice;
      // 평균단가 미입력(빈 값)은 "0원에 샀다"가 아니라 "모른다"다. 0으로 가중평균하면
      // 사용자가 넣은 적 없는 단가가 만들어져 그대로 저장된다.
      const hasOldPrice = rawOldPrice !== "" && rawOldPrice != null && Number(rawOldPrice) > 0;
      const oldPrice = hasOldPrice ? Number(rawOldPrice) : 0;
      const newQuantity = oldQuantity + item.quantity;
      let averagePrice: number | string = rawOldPrice ?? "";
      if (item.averagePrice != null && newQuantity > 0) {
        averagePrice = hasOldPrice
          ? ((oldQuantity * oldPrice) + (item.quantity * item.averagePrice)) / newQuantity
          : item.averagePrice;
      }
      next[index] = { ...next[index], quantity: newQuantity, averagePrice };
    }
  }
  return next;
}

export function ImportPositionsDialog({ current, onApply, onClose }: { current: PositionDraft[]; onApply: (positions: PositionDraft[]) => void; onClose: () => void }) {
  // 증권사 화면은 스크롤해서 여러 장으로 찍는 경우가 많다. 장마다 잘라낼 영역이
  // 다를 수 있으므로 crop은 이미지별로 따로 보관한다.
  const [files, setFiles] = useState<File[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [sourceUrl, setSourceUrl] = useState("");
  const [crops, setCrops] = useState<CropBox[]>([]);
  const [preflight, setPreflight] = useState<Preflight | null>(null);
  const file = files[activeIndex] || null;
  const crop = crops[activeIndex] || EMPTY_CROP;
  const setCrop = (next: CropBox) => setCrops((rows) => rows.map((row, index) => index === activeIndex ? next : row));
  const localBlocked = preflight != null && preflight.ready === false;
  const agentReady = preflight?.agent?.available === true;
  const [mode, setMode] = useState<ImportMode>("local");
  const [consent, setConsent] = useState(false);
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [drafts, setDrafts] = useState<ImportDraft[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/portfolio/import-image/preflight")
      .then((response) => response.json())
      .then((payload: Preflight) => {
        if (!alive) return;
        setPreflight(payload);
        // 기본값은 쓸 수 있는 것 중 부담이 가장 적은 쪽이다. CLI는 아무것도 더
        // 깔지 않고 읽으니 1순위, 그다음이 사진을 밖으로 안 내보내는 로컬 OCR,
        // 마지막이 매번 동의가 필요한 외부 Vision이다. 셋 다 못 쓰는 상태에서
        // 로컬을 기본으로 두면 비활성 라디오가 선택된 채 버튼도 눌리지 않는다.
        if (payload?.agent?.available) setMode("agent");
        else if (payload?.ready === false) setMode("vision");
      })
      .catch(() => { if (alive) setPreflight({ ready: false, reason: "preflight_unavailable" }); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!file) { setSourceUrl(""); return; }
    const url = URL.createObjectURL(file);
    setSourceUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!sourceUrl || !canvasRef.current) return;
    const image = new Image();
    image.onload = () => {
      const x = image.width * crop.left / 100;
      const y = image.height * crop.top / 100;
      const width = image.width * Math.max(5, 100 - crop.left - crop.right) / 100;
      const height = image.height * Math.max(5, 100 - crop.top - crop.bottom) / 100;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const scale = Math.min(1, 1100 / width);
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const context = canvas.getContext("2d");
      if (!context) return;
      context.drawImage(image, x, y, width, height, 0, 0, canvas.width, canvas.height);
      if (crop.redactTop > 0) {
        context.fillStyle = "#111";
        context.fillRect(0, 0, canvas.width, canvas.height * crop.redactTop / 100);
      }
    };
    image.src = sourceUrl;
  }, [sourceUrl, crop]);

  /** 화면 밖 캔버스에 crop을 적용해 전송용 PNG를 만든다. 미리보기 캔버스는 활성 이미지 전용이다. */
  async function renderCropped(sourceFile: File, box: CropBox): Promise<Blob> {
    const url = URL.createObjectURL(sourceFile);
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error(`${sourceFile.name}을(를) 읽지 못했습니다.`));
        element.src = url;
      });
      const x = image.width * box.left / 100;
      const y = image.height * box.top / 100;
      const width = image.width * Math.max(5, 100 - box.left - box.right) / 100;
      const height = image.height * Math.max(5, 100 - box.top - box.bottom) / 100;
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 1100 / width);
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("이미지 변환 실패");
      context.drawImage(image, x, y, width, height, 0, 0, canvas.width, canvas.height);
      if (box.redactTop > 0) {
        context.fillStyle = "#111";
        context.fillRect(0, 0, canvas.width, canvas.height * box.redactTop / 100);
      }
      return await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((value) => value ? resolve(value) : reject(new Error("이미지 변환 실패")), "image/png"));
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function runPreview() {
    if (!files.length) return;
    if (mode === "vision" && !consent) { setError("외부 Vision 전송 동의가 필요합니다."); return; }
    setBusy(true); setError("");
    try {
      const merged: ImportDraft[] = [];
      const notices: string[] = [];
      let engine = "";
      for (const [index, sourceFile] of files.entries()) {
        const blob = await renderCropped(sourceFile, crops[index] || EMPTY_CROP);
        const response = await fetch(`/api/portfolio/import-image/preview?mode=${mode}&consent=${consent ? "true" : "false"}`, { method: "POST", headers: { "Content-Type": "image/png" }, body: blob });
        const payload = await response.json() as PreviewPayload & { detail?: string };
        if (!response.ok) throw new Error(`${sourceFile.name}: ${importErrorText(String(payload.detail || ""))}`);
        engine = payload.engine || engine;
        for (const notice of payload.notices || []) if (!notices.includes(notice)) notices.push(notice);
        // 스크롤 캡처는 앞뒤 장이 겹치기 쉽다. 같은 종목이 두 번 잡히면 수량이
        // 배로 늘어나므로 먼저 읽은 쪽을 남긴다.
        for (const row of payload.drafts || []) {
          if (!merged.some((existing) => existing.ticker.toUpperCase() === row.ticker.toUpperCase())) merged.push(row);
        }
      }
      if (!merged.length) {
        notices.push(files.length > 1 ? "선택한 사진에서 종목을 읽지 못했습니다." : "이 사진에서 종목을 읽지 못했습니다.");
      }
      setPreview({ engine, notices, drafts: merged }); setDrafts(merged);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "이미지를 인식하지 못했습니다."); }
    finally { setBusy(false); }
  }

  function updateDraft(index: number, field: keyof ImportDraft, value: string) {
    setDrafts((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: field === "quantity" || field === "averagePrice" ? (value === "" ? null : Number(value)) : value } as ImportDraft : row));
  }

  return (
    <div className="portfolio-import-backdrop" role="presentation">
      <section className="portfolio-import-dialog" role="dialog" aria-modal="true" aria-labelledby="portfolio-import-title">
        {/* `LOCAL-FIRST`라고 적혀 있던 자리다. 기본 인식이 Agent CLI로 바뀌어
            사진이 그 제공자에게 나가므로, 그 표현을 그대로 두면 화면이 사실과
            다른 약속을 한다. */}
        <div className="cockpit-panel__head"><div><span>PREVIEW ONLY IMPORT</span><h2 id="portfolio-import-title">증권사 화면에서 가져오기</h2></div><button type="button" className="btn" onClick={onClose}>닫기</button></div>
        <p className="section-subtitle">계좌번호·총자산 등 불필요한 영역은 crop 또는 상단 가리기로 제거하세요. 원본 사진과 인식 원문은 저장하지 않으며, 아래 편집표를 확인하고 Portfolio 저장을 눌러야 실제로 저장됩니다.</p>
        {/* 네이티브 파일 입력은 OS 기본 버튼으로 그려져 이 다이얼로그의 다른 버튼과 따로 논다.
            Agent 작성창과 같은 방식으로 입력을 숨기고 앱 버튼이 대신 열게 한다. */}
        {localBlocked && (
          <div className={`settings-notice${agentReady ? "" : " warn"}`} role="status">
            <strong>로컬 인식을 쓸 수 없습니다</strong>
            <span>
              {PREFLIGHT_REASONS[String(preflight?.reason || "")] || "로컬 OCR 준비 상태를 확인하지 못했습니다."}
              {" "}Tesseract(kor+eng)를 설치하면 사진이 이 컴퓨터 밖으로 나가지 않습니다.
              {agentReady
                ? " 설치하지 않아도 됩니다 — 이미 쓰고 계신 Agent CLI가 사진을 읽습니다(아래 기본 선택)."
                : " 설치 전에는 아래에서 외부 Vision을 선택하고 매번 동의해야 합니다."}
            </span>
          </div>
        )}
        <div className="portfolio-import-file">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            hidden
            onChange={(event) => {
              const picked = Array.from(event.currentTarget.files || []);
              if (!picked.length) return;
              setFiles(picked);
              setCrops(picked.map(() => ({ ...EMPTY_CROP })));
              setActiveIndex(0);
              setPreview(null);
              setDrafts([]);
              event.currentTarget.value = "";
            }}
          />
          <button type="button" className="btn" onClick={() => fileInputRef.current?.click()}>
            {files.length ? "사진 다시 선택" : "사진 선택"}
          </button>
          <span className="portfolio-import-file__name">
            {files.length ? `${files.length}장 선택됨` : "PNG · JPEG · WebP · 여러 장 선택 가능"}
          </span>
        </div>
        {files.length > 1 && (
          <div className="portfolio-import-pages" role="group" aria-label="자를 사진 선택">
            {files.map((row, index) => (
              <button
                key={`${row.name}-${index}`}
                type="button"
                className={`btn${index === activeIndex ? " btn--primary" : ""}`}
                aria-pressed={index === activeIndex}
                onClick={() => setActiveIndex(index)}
              >
                {index + 1}
              </button>
            ))}
            <span className="portfolio-import-file__name">{file?.name} — 사진마다 자르기를 따로 정할 수 있습니다</span>
          </div>
        )}
        {sourceUrl && <>
          <div className="portfolio-crop-controls">
            {(["top", "right", "bottom", "left", "redactTop"] as const).map((key) => <label key={key}><span>{key === "redactTop" ? "상단 가리기" : `crop ${key}`} {crop[key]}%</span><input type="range" min="0" max={key === "redactTop" ? "50" : "45"} value={crop[key]} onChange={(event) => setCrop({ ...crop, [key]: Number(event.currentTarget.value) })} /></label>)}
          </div>
          <canvas className="portfolio-crop-preview" ref={canvasRef} aria-label="전송될 이미지 미리보기" />
          <fieldset className="portfolio-import-mode">
            <legend>인식 방식</legend>
            <label><input type="radio" name="portfolio-import-mode" checked={mode === "agent"} disabled={!agentReady} onChange={() => setMode("agent")} /> Agent CLI{agentReady ? " (따로 설치할 것 없음)" : " — 사용 불가"}</label>
            <label><input type="radio" name="portfolio-import-mode" checked={mode === "local"} disabled={localBlocked} onChange={() => setMode("local")} /> 로컬 Tesseract{localBlocked ? " — 사용 불가" : ""}</label>
            <label><input type="radio" name="portfolio-import-mode" checked={mode === "vision"} onChange={() => setMode("vision")} /> 외부 Vision</label>
          </fieldset>
          {/* 설정에서 Agent를 연결한 순간부터 사용은 허락된 것으로 본다(동의 체크박스 없음).
              다만 사진이 그 제공자에게 전달된다는 사실은 먼저 말한다 — 허락과 고지는 다른 문제다. */}
          {mode === "agent" && <p className="settings-notice"><span>위 미리보기 crop을 설정한 Agent CLI가 직접 읽습니다. 사진은 그 CLI 제공자에게 전달되며 Folio OS에는 저장하지 않습니다. 한 장에 수십 초 걸립니다.</span></p>}
          {!agentReady && preflight != null && <p className="section-subtitle">Agent CLI로 읽기 — {agentReasonText(preflight.agent)}</p>}
          {mode === "vision" && <label className="settings-notice warn"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.currentTarget.checked)} /> <span>위 미리보기 crop이 설정된 외부 AI 제공자에게 전송되며, Folio OS 요청은 저장 비활성화를 사용한다는 점을 확인했습니다.</span></label>}
          <button className="btn btn--primary" type="button" disabled={busy || (mode === "local" && localBlocked) || (mode === "agent" && !agentReady)} onClick={runPreview}>{busy ? (mode === "agent" ? `Agent CLI가 읽는 중 (수십 초)` : "인식 중") : `저장하지 않고 미리보기${files.length > 1 ? ` (${files.length}장)` : ""}`}</button>
        </>}
        {error && <p className="react-dashboard-error" role="alert">{error}</p>}
        {preview && <div className="portfolio-import-results">
          <p>{preview.engine} · Portfolio 저장 안 됨</p>
          {(preview.notices || []).map((notice) => <p className="section-subtitle" key={notice}>{notice}</p>)}
          <table><thead><tr><th>종목</th><th>수량</th><th>평균단가</th><th>판정</th><th>기존 종목</th></tr></thead><tbody>{drafts.map((row, index) => <tr key={index}><td><input value={row.ticker} onChange={(event) => updateDraft(index, "ticker", event.currentTarget.value.toUpperCase())} /></td><td><input value={row.quantity ?? ""} onChange={(event) => updateDraft(index, "quantity", event.currentTarget.value)} /></td><td><input value={row.averagePrice ?? ""} onChange={(event) => updateDraft(index, "averagePrice", event.currentTarget.value)} /></td><td><span className={`chip certainty-badge--${row.status === "confirmed" ? "confirmed" : "tentative"}`}>{row.status}</span></td><td><select value={row.action} onChange={(event) => updateDraft(index, "action", event.currentTarget.value)}><option value="skip">건너뛰기</option><option value="merge">합치기</option><option value="replace">교체</option></select></td></tr>)}</tbody></table>
          <div className="filter-actions"><button className="btn btn--primary" type="button" onClick={() => onApply(mergePositions(current, drafts))}>편집표에 적용</button><span>적용 후 Portfolio 저장 버튼을 눌러야 실제 저장됩니다.</span></div>
        </div>}
      </section>
    </div>
  );
}
