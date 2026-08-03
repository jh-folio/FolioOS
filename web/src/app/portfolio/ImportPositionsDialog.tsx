import { useEffect, useRef, useState } from "react";
import type { PositionDraft } from "./HoldingsTable";

type ImportDraft = { ticker: string; name?: string; quantity: number | null; averagePrice: number | null; status: "confirmed" | "needs_review" | "unresolved"; action: "skip" | "merge" | "replace"; issues?: string[] };
type PreviewPayload = { engine?: string; drafts?: ImportDraft[]; notices?: string[]; persisted?: boolean };

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
      const oldPrice = Number(next[index].averagePrice) || 0;
      const newQuantity = oldQuantity + item.quantity;
      const weighted = item.averagePrice != null && newQuantity > 0 ? ((oldQuantity * oldPrice) + (item.quantity * item.averagePrice)) / newQuantity : oldPrice;
      next[index] = { ...next[index], quantity: newQuantity, averagePrice: weighted || "" };
    }
  }
  return next;
}

export function ImportPositionsDialog({ current, onApply, onClose }: { current: PositionDraft[]; onApply: (positions: PositionDraft[]) => void; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [crop, setCrop] = useState({ top: 0, right: 0, bottom: 0, left: 0, redactTop: 0 });
  const [mode, setMode] = useState<"local" | "vision">("local");
  const [consent, setConsent] = useState(false);
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [drafts, setDrafts] = useState<ImportDraft[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

  async function runPreview() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (mode === "vision" && !consent) { setError("외부 Vision 전송 동의가 필요합니다."); return; }
    setBusy(true); setError("");
    try {
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("이미지 변환 실패")), "image/png"));
      const response = await fetch(`/api/portfolio/import-image/preview?mode=${mode}&consent=${consent ? "true" : "false"}`, { method: "POST", headers: { "Content-Type": "image/png" }, body: blob });
      const payload = await response.json() as PreviewPayload & { detail?: string };
      if (!response.ok) throw new Error(String(payload.detail || "이미지 인식 실패"));
      setPreview(payload); setDrafts(payload.drafts || []);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "이미지를 인식하지 못했습니다."); }
    finally { setBusy(false); }
  }

  function updateDraft(index: number, field: keyof ImportDraft, value: string) {
    setDrafts((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: field === "quantity" || field === "averagePrice" ? (value === "" ? null : Number(value)) : value } as ImportDraft : row));
  }

  return (
    <div className="portfolio-import-backdrop" role="presentation">
      <section className="portfolio-import-dialog" role="dialog" aria-modal="true" aria-labelledby="portfolio-import-title">
        <div className="cockpit-panel__head"><div><span>LOCAL-FIRST IMPORT</span><h2 id="portfolio-import-title">증권사 화면에서 가져오기</h2></div><button type="button" className="filter-btn clear" onClick={onClose}>닫기</button></div>
        <p className="section-subtitle">계좌번호·총자산 등 불필요한 영역은 crop 또는 상단 가리기로 제거하세요. 원본과 OCR 원문은 저장하지 않습니다.</p>
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setFile(event.currentTarget.files?.[0] || null)} />
        {sourceUrl && <>
          <div className="portfolio-crop-controls">
            {(["top", "right", "bottom", "left", "redactTop"] as const).map((key) => <label key={key}><span>{key === "redactTop" ? "상단 가리기" : `crop ${key}`} {crop[key]}%</span><input type="range" min="0" max={key === "redactTop" ? "50" : "45"} value={crop[key]} onChange={(event) => setCrop({ ...crop, [key]: Number(event.currentTarget.value) })} /></label>)}
          </div>
          <canvas className="portfolio-crop-preview" ref={canvasRef} aria-label="전송될 이미지 미리보기" />
          <fieldset className="portfolio-import-mode"><legend>인식 방식</legend><label><input type="radio" checked={mode === "local"} onChange={() => setMode("local")} /> 로컬 Tesseract (기본)</label><label><input type="radio" checked={mode === "vision"} onChange={() => setMode("vision")} /> 외부 Vision (선택)</label></fieldset>
          {mode === "vision" && <label className="settings-notice warn"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.currentTarget.checked)} /> <span>위 미리보기 crop이 설정된 외부 AI 제공자에게 전송되며, Folio OS 요청은 저장 비활성화를 사용한다는 점을 확인했습니다.</span></label>}
          <button className="filter-btn apply" type="button" disabled={busy} onClick={runPreview}>{busy ? "인식 중" : "저장하지 않고 미리보기"}</button>
        </>}
        {error && <p className="react-dashboard-error" role="alert">{error}</p>}
        {preview && <div className="portfolio-import-results">
          <p>{preview.engine} · Portfolio 저장 안 됨</p>
          {(preview.notices || []).map((notice) => <p className="section-subtitle" key={notice}>{notice}</p>)}
          <table><thead><tr><th>종목</th><th>수량</th><th>평균단가</th><th>판정</th><th>기존 종목</th></tr></thead><tbody>{drafts.map((row, index) => <tr key={index}><td><input value={row.ticker} onChange={(event) => updateDraft(index, "ticker", event.currentTarget.value.toUpperCase())} /></td><td><input value={row.quantity ?? ""} onChange={(event) => updateDraft(index, "quantity", event.currentTarget.value)} /></td><td><input value={row.averagePrice ?? ""} onChange={(event) => updateDraft(index, "averagePrice", event.currentTarget.value)} /></td><td><span className={`certainty-badge certainty-badge--${row.status === "confirmed" ? "confirmed" : "tentative"}`}>{row.status}</span></td><td><select value={row.action} onChange={(event) => updateDraft(index, "action", event.currentTarget.value)}><option value="skip">건너뛰기</option><option value="merge">합치기</option><option value="replace">교체</option></select></td></tr>)}</tbody></table>
          <div className="filter-actions"><button className="filter-btn apply" type="button" onClick={() => onApply(mergePositions(current, drafts))}>편집표에 적용</button><span>적용 후 Portfolio 저장 버튼을 눌러야 실제 저장됩니다.</span></div>
        </div>}
      </section>
    </div>
  );
}
