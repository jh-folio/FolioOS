import type {
  SmartCollection,
  SmartCollectionFields,
  SmartCollectionMarket,
} from "../api";

export type CollectionDraft = {
  name: string;
  query: string;
  market: SmartCollectionMarket;
  sources: string;
  tickers: string;
  tags: string;
};

export const EMPTY_COLLECTION_DRAFT: CollectionDraft = {
  name: "",
  query: "",
  market: "ALL",
  sources: "",
  tickers: "",
  tags: "",
};

function tokens(value: string, upper = false): string[] {
  const normalized = value
    .split(",")
    .map((item) => item.normalize("NFKC").trim())
    .filter(Boolean)
    .map((item) => upper ? item.toUpperCase() : item.toLowerCase());
  return Array.from(new Set(normalized)).sort();
}

export function collectionFields(draft: CollectionDraft): SmartCollectionFields {
  return {
    name: draft.name.normalize("NFKC").trim(),
    query: draft.query.normalize("NFKC").trim(),
    market: draft.market,
    sources: tokens(draft.sources),
    tickers: tokens(draft.tickers, true),
    tags: tokens(draft.tags),
  };
}

export function collectionDraft(collection: SmartCollection): CollectionDraft {
  return {
    name: collection.name,
    query: collection.query,
    market: collection.market,
    sources: collection.sources.join(", "),
    tickers: collection.tickers.join(", "),
    tags: collection.tags.join(", "),
  };
}

export function SmartCollectionEditor({
  mode,
  revision,
  draft,
  busy,
  onChange,
  onCancel,
  onSave,
}: {
  readonly mode: "create" | "edit";
  readonly revision: number | null;
  readonly draft: CollectionDraft;
  readonly busy: boolean;
  readonly onChange: <K extends keyof CollectionDraft>(field: K, value: CollectionDraft[K]) => void;
  readonly onCancel: () => void;
  readonly onSave: () => void;
}) {
  return (
    <div className="topicrpt-collection-editor">
      <div className="topicrpt-collection-subhead">
        <strong>{mode === "create" ? "새 검색 규칙" : "검색 규칙 편집"}</strong>
        <span>{revision ? `revision ${revision}` : "새 정의"}</span>
      </div>
      <div className="topicrpt-collection-form-grid">
        <label className="field"><span>이름</span><input data-qa="collection-name" value={draft.name} maxLength={80} onChange={(event) => onChange("name", event.currentTarget.value)} /></label>
        <label className="field topicrpt-collection-query"><span>검색어</span><textarea data-qa="collection-query" value={draft.query} maxLength={500} rows={2} onChange={(event) => onChange("query", event.currentTarget.value)} /></label>
        <label className="field"><span>시장</span><select data-qa="collection-market" value={draft.market} onChange={(event) => onChange("market", event.currentTarget.value as SmartCollectionMarket)}><option value="ALL">전체</option><option value="US">미국</option><option value="KR">한국</option><option value="GLOBAL">글로벌</option><option value="UNKNOWN">미분류</option></select></label>
        <label className="field"><span>출처 · 쉼표 구분</span><input data-qa="collection-sources" value={draft.sources} onChange={(event) => onChange("sources", event.currentTarget.value)} /></label>
        <label className="field"><span>티커 · 쉼표 구분</span><input data-qa="collection-tickers" value={draft.tickers} onChange={(event) => onChange("tickers", event.currentTarget.value)} /></label>
        <label className="field"><span>태그 · 쉼표 구분</span><input data-qa="collection-tags" value={draft.tags} onChange={(event) => onChange("tags", event.currentTarget.value)} /></label>
      </div>
      <div className="topicrpt-collections-actions">
        <button className="filter-btn clear" type="button" data-qa="collection-cancel" disabled={busy} onClick={onCancel}>취소</button>
        <button className="filter-btn apply" type="button" data-qa="collection-save" disabled={busy} onClick={onSave}>{busy ? "저장 중" : mode === "create" ? "컬렉션 저장" : "변경 저장"}</button>
      </div>
    </div>
  );
}
