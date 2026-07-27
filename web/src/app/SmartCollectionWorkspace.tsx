import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ApiRequestError,
  deleteJson,
  getJson,
  postJson,
  putJson,
  type CollectionRef,
  type DeleteSmartCollectionRequest,
  type PreviewSmartCollectionRequest,
  type RefreshSmartCollectionRequest,
  type SmartCollection,
  type SmartCollectionChangesEnvelope,
  type SmartCollectionListEnvelope,
  type SmartCollectionMutationEnvelope,
  type SmartCollectionPreview,
  type SmartCollectionRefreshEnvelope,
  type SmartCollectionWorkspaceEnvelope,
  type UpdateSmartCollectionRequest,
} from "../api";
import {
  collectionDraft,
  collectionFields,
  EMPTY_COLLECTION_DRAFT,
  SmartCollectionEditor,
  type CollectionDraft,
} from "./SmartCollectionEditor";
import { openReactAgentDock } from "./agentContext";
import { InvestmentContextCard } from "./InvestmentContextCard";

function collectionFilterSummary(collection: SmartCollection): string {
  const filters = [
    collection.query && `query: ${collection.query}`,
    collection.market !== "ALL" && `market: ${collection.market}`,
    collection.sources.length && `sources: ${collection.sources.join(", ")}`,
    collection.tickers.length && `tickers: ${collection.tickers.join(", ")}`,
    collection.tags.length && `tags: ${collection.tags.join(", ")}`,
  ].filter(Boolean);
  return filters.join(" · ") || "필터 없음";
}

function collectionErrorCopy(error: unknown): string {
  if (!(error instanceof ApiRequestError)) return "컬렉션 요청을 완료하지 못했습니다. 연결을 확인하고 다시 시도하세요.";
  if (error.code === "validation_error") return "필터 형식을 확인하세요. 이름과 하나 이상의 검색 조건이 필요하며 각 목록은 최대 20개입니다.";
  if (error.code === "collection_store_unavailable") return "저장된 컬렉션을 읽을 수 없습니다. 저장소 상태를 확인한 뒤 다시 불러오세요.";
  if (error.code === "collection_snapshot_unavailable") return "최근 새로고침 기록을 읽을 수 없습니다. 저장 상태를 확인한 뒤 다시 시도하세요.";
  if (error.code === "collection_source_unavailable") return "현재 외부 자료 인덱스를 읽을 수 없습니다. 자료 상태를 확인한 뒤 다시 시도하세요.";
  if (error.code === "collection_not_found") return "컬렉션이 더 이상 존재하지 않습니다. 목록으로 돌아가세요.";
  return `컬렉션 요청을 완료하지 못했습니다 (${error.code || "request_failed"}).`;
}

function currentRevision(error: ApiRequestError): number | null {
  const value = error.payload?.currentRevision;
  return typeof value === "number" && Number.isInteger(value) && value >= 1 ? value : null;
}

function displayTime(value: string | null): string {
  if (!value) return "아직 새로고침하지 않음";
  const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  return match ? `${match[1]} ${match[2]} UTC` : value;
}

function reasonCopy(reason: string): string {
  const copy: Record<string, string> = {
    baseline_missing: "비교할 이전 스냅샷 없음",
    definition_changed: "필터 정의 변경",
    empty_index: "현재 일치 자료 없음",
    high_unusable_ratio: "사용 불가 자료 비율 높음",
    high_churn_ratio: "자료 교체 비율 높음",
    invalid_resolved_at: "새로고침 시각 확인 필요",
    clock_skew: "시스템 시각 불일치",
    snapshot_expired: "최근 스냅샷 만료",
    provider_generation_reset: "자료 제공자 세대 초기화",
    provider_watermark_reset: "자료 워터마크 초기화",
    result_truncated: "표시 상한 적용",
    healthy: "현재 입력 정상",
  };
  return copy[reason] || reason;
}

export function SmartCollectionsPanel({
  selectedRef,
  onSelectedRef,
  onBusyChange,
  onOpenDetail,
  disabled,
}: {
  readonly selectedRef: CollectionRef | null;
  readonly onSelectedRef: (ref: CollectionRef | null) => void;
  readonly onBusyChange: (busy: boolean) => void;
  readonly onOpenDetail: (collectionId: string) => void;
  readonly disabled: boolean;
}) {
  const [collections, setCollections] = useState<readonly SmartCollection[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingList, setLoadingList] = useState(true);
  const [editorMode, setEditorMode] = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState("");
  const [editingRevision, setEditingRevision] = useState<number | null>(null);
  const [draft, setDraft] = useState<CollectionDraft>(EMPTY_COLLECTION_DRAFT);
  const [preview, setPreview] = useState<SmartCollectionPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState<{ code: string; currentRevision: number | null } | null>(null);
  const listSequence = useRef(0);
  const previewSequence = useRef(0);
  const listController = useRef<AbortController | null>(null);
  const previewController = useRef<AbortController | null>(null);

  function updateDraftField<K extends keyof CollectionDraft>(field: K, value: CollectionDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  const selectedCollection = useMemo(
    () => selectedRef ? collections.find((item) => item.id === selectedRef.id && item.revision === selectedRef.revision) || null : null,
    [collections, selectedRef],
  );

  useEffect(() => {
    onBusyChange(loadingList || previewLoading || busy);
  }, [busy, loadingList, onBusyChange, previewLoading]);

  const loadCollections = useCallback(async (rebaseDraft = false) => {
    listController.current?.abort();
    const controller = new AbortController();
    listController.current = controller;
    const sequence = listSequence.current + 1;
    listSequence.current = sequence;
    setLoadingList(true);
    setError("");
    try {
      const payload = await getJson<SmartCollectionListEnvelope>("/api/smart-collections?limit=100&offset=0", { signal: controller.signal });
      if (controller.signal.aborted || sequence !== listSequence.current) return;
      setCollections(payload.items);
      setTotal(payload.total);
      if (selectedRef) {
        const latest = payload.items.find((item) => item.id === selectedRef.id);
        if (!latest || latest.revision !== selectedRef.revision) {
          onSelectedRef(null);
          setPreview(null);
          if (latest) setConflict({ code: "revision_conflict", currentRevision: latest.revision });
        }
      }
      if (rebaseDraft && editingId) {
        const latest = payload.items.find((item) => item.id === editingId);
        if (latest) {
          setEditingRevision(latest.revision);
          setConflict(null);
        }
      }
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") return;
      if (sequence !== listSequence.current) return;
      setError(collectionErrorCopy(requestError));
    } finally {
      if (!controller.signal.aborted && sequence === listSequence.current) setLoadingList(false);
    }
  }, [editingId, onSelectedRef, selectedRef]);

  const previewCollection = useCallback(async (collection: SmartCollection) => {
    previewController.current?.abort();
    const controller = new AbortController();
    previewController.current = controller;
    const sequence = previewSequence.current + 1;
    previewSequence.current = sequence;
    setPreviewLoading(true);
    setPreview(null);
    onSelectedRef(null);
    setError("");
    setConflict(null);
    const body: PreviewSmartCollectionRequest = { expectedRevision: collection.revision, limit: 10 };
    try {
      const payload = await postJson<SmartCollectionPreview>(`/api/smart-collections/${encodeURIComponent(collection.id)}/preview`, body, { signal: controller.signal });
      if (controller.signal.aborted || sequence !== previewSequence.current) return;
      setPreview(payload);
      onSelectedRef({ id: collection.id, revision: collection.revision });
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") return;
      if (sequence !== previewSequence.current) return;
      if (requestError instanceof ApiRequestError && requestError.status === 409 && (requestError.code === "revision_conflict" || requestError.code === "duplicate_name")) {
        setConflict({ code: requestError.code, currentRevision: currentRevision(requestError) });
        onSelectedRef(null);
      } else {
        setError(collectionErrorCopy(requestError));
      }
    } finally {
      if (!controller.signal.aborted && sequence === previewSequence.current) setPreviewLoading(false);
    }
  }, [onSelectedRef]);

  useEffect(() => {
    void loadCollections();
    return () => {
      listController.current?.abort();
      previewController.current?.abort();
    };
  }, []);

  const beginCreate = () => {
    setEditorMode("create");
    setEditingId("");
    setEditingRevision(null);
    setDraft(EMPTY_COLLECTION_DRAFT);
    setConflict(null);
    setError("");
  };

  const beginEdit = () => {
    if (!selectedCollection) return;
    setEditorMode("edit");
    setEditingId(selectedCollection.id);
    setEditingRevision(selectedCollection.revision);
    setDraft(collectionDraft(selectedCollection));
    setConflict(null);
    setError("");
  };

  const saveCollection = async () => {
    const fields = collectionFields(draft);
    if (!fields.name || (!fields.query && fields.market === "ALL" && !fields.sources.length && !fields.tickers.length && !fields.tags.length) || fields.sources.length > 20 || fields.tickers.length > 20 || fields.tags.length > 20) {
      setError("이름과 하나 이상의 검색 조건을 입력하세요. 쉼표 목록은 각각 최대 20개입니다.");
      return;
    }
    setBusy(true);
    setError("");
    setConflict(null);
    try {
      let payload: SmartCollectionMutationEnvelope;
      if (editorMode === "edit" && editingId && editingRevision) {
        const body: UpdateSmartCollectionRequest = { ...fields, expectedRevision: editingRevision };
        payload = await putJson<SmartCollectionMutationEnvelope>(`/api/smart-collections/${encodeURIComponent(editingId)}`, body);
      } else {
        payload = await postJson<SmartCollectionMutationEnvelope>("/api/smart-collections", fields);
      }
      setCollections((current) => [payload.collection, ...current.filter((item) => item.id !== payload.collection.id)]);
      setTotal((current) => editorMode === "create" ? current + 1 : current);
      setEditorMode(null);
      setEditingId("");
      setEditingRevision(null);
      await previewCollection(payload.collection);
    } catch (requestError) {
      if (requestError instanceof ApiRequestError && requestError.status === 409 && (requestError.code === "revision_conflict" || requestError.code === "duplicate_name")) {
        setConflict({ code: requestError.code, currentRevision: currentRevision(requestError) });
        if (requestError.code === "revision_conflict") onSelectedRef(null);
      } else {
        setError(collectionErrorCopy(requestError));
      }
    } finally {
      setBusy(false);
    }
  };

  const deleteCollection = async () => {
    if (!selectedCollection || !window.confirm(`“${selectedCollection.name}” 컬렉션을 삭제할까요?`)) return;
    setBusy(true);
    setError("");
    setConflict(null);
    const body: DeleteSmartCollectionRequest = { expectedRevision: selectedCollection.revision };
    try {
      await deleteJson<{ readonly storeRevision: number; readonly deletedId: string }>(`/api/smart-collections/${encodeURIComponent(selectedCollection.id)}`, body);
      setCollections((current) => current.filter((item) => item.id !== selectedCollection.id));
      setTotal((current) => Math.max(0, current - 1));
      setPreview(null);
      onSelectedRef(null);
    } catch (requestError) {
      if (requestError instanceof ApiRequestError && requestError.status === 409 && (requestError.code === "revision_conflict" || requestError.code === "duplicate_name")) {
        setConflict({ code: requestError.code, currentRevision: currentRevision(requestError) });
        onSelectedRef(null);
      } else {
        setError(collectionErrorCopy(requestError));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="topicrpt-collections-panel" data-qa="collection-panel" aria-labelledby="collection-heading">
      <div className="topicrpt-collections-head">
        <div>
          <span className="section-kicker">SMART COLLECTIONS</span>
          <h3 id="collection-heading">외부 근거 필터</h3>
          <p>저장된 검색 규칙이며 근거 자체나 사용자 가설이 아닙니다. 서버가 계획 시점에 일치 자료를 다시 확인합니다.</p>
        </div>
        <div className="topicrpt-collections-actions">
          <button className="filter-btn clear" type="button" data-qa="collection-reload" disabled={loadingList || busy || disabled} onClick={() => void loadCollections()}>{loadingList ? "불러오는 중" : "다시 불러오기"}</button>
          <button className="filter-btn apply" type="button" data-qa="collection-new" disabled={busy || disabled} onClick={beginCreate}>새 컬렉션</button>
        </div>
      </div>

      {error && <div className="react-dashboard-error topicrpt-collection-alert" data-qa="collection-error" role="alert"><strong>컬렉션을 확인하세요</strong><span>{error}</span></div>}
      {conflict && (
        <div className="react-dashboard-warning topicrpt-collection-alert" data-qa="collection-conflict" role="alert">
          <strong>{conflict.code === "duplicate_name" ? "같은 이름이 이미 있습니다" : "다른 탭에서 정의가 변경되었습니다"}</strong>
          <span>{conflict.currentRevision ? `현재 revision ${conflict.currentRevision}. ` : ""}입력 내용은 유지했습니다. 최신 revision을 불러온 뒤 다시 저장하세요.</span>
          {conflict.code === "duplicate_name"
            ? <button className="filter-btn clear" type="button" onClick={() => setConflict(null)}>이름 수정</button>
            : <button className="filter-btn clear" type="button" onClick={() => void loadCollections(true)}>최신 revision 불러오기</button>}
        </div>
      )}

      <div className="topicrpt-collections-grid">
        <div className="topicrpt-collection-browser">
          <div className="topicrpt-collection-subhead"><strong>저장된 규칙</strong><span>{total}개</span></div>
          <div className="topicrpt-collection-list" data-qa="collection-list" aria-busy={loadingList}>
            {!loadingList && !error && !collections.length && <div className="topicrpt-collection-empty" data-qa="collection-empty" data-empty-kind="list" role="status">저장된 외부 근거 필터가 없습니다. 새 컬렉션을 만들어 반복할 검색 범위를 저장하세요.</div>}
            {collections.map((collection) => {
              const isSelected = selectedRef?.id === collection.id && selectedRef.revision === collection.revision;
              return (
                <button className={`topicrpt-collection-item${isSelected ? " is-selected" : ""}`} type="button" data-qa="collection-item" data-collection-id={collection.id} data-revision={collection.revision} aria-pressed={isSelected} disabled={busy || disabled} onClick={() => void previewCollection(collection)} key={collection.id}>
                  <span><strong>{collection.name}</strong><small>revision {collection.revision}</small></span>
                  <small>{collectionFilterSummary(collection)}</small>
                </button>
              );
            })}
          </div>
          {total > collections.length && <p className="topicrpt-collection-disclosure">처음 {collections.length}개를 표시합니다. 전체 {total}개 중 나머지는 API 페이지에서 확인할 수 있습니다.</p>}
          {selectedCollection && (
            <div className="topicrpt-collections-actions topicrpt-selection-actions">
              <button className="filter-btn apply" type="button" data-qa="collection-open-workspace" disabled={busy || disabled} onClick={() => onOpenDetail(selectedCollection.id)}>상세 워크스페이스</button>
              <button className="filter-btn clear" type="button" data-qa="collection-edit" disabled={busy || disabled} onClick={beginEdit}>선택 규칙 편집</button>
              <button className="filter-btn clear" type="button" data-qa="collection-delete" disabled={busy || disabled} onClick={() => void deleteCollection()}>삭제</button>
              <button className="filter-btn clear" type="button" data-qa="collection-clear-selection" onClick={() => { previewController.current?.abort(); setPreview(null); onSelectedRef(null); }}>선택 해제</button>
            </div>
          )}
        </div>

        <section className="topicrpt-collection-results" data-qa="collection-results" aria-busy={previewLoading} aria-live="polite">
          <div className="topicrpt-collection-subhead"><strong>Live match</strong><span>{previewLoading ? "확인 중" : preview ? `${preview.total}건` : "규칙 선택 전"}</span></div>
          {preview && preview.total === 0 && <div className="topicrpt-collection-empty" data-qa="collection-empty" data-empty-kind="matches" role="status">현재 일치 자료가 0건입니다. 계획은 근거 부족 확인을 거쳐야 하며, 이 컬렉션 자체가 근거로 사용되지는 않습니다.</div>}
          {preview && preview.items.length > 0 && (
            <ul className="topicrpt-collection-samples">
              {preview.items.map((item) => (
                <li key={item.id}>
                  <span><strong>{item.title || "제목 없음"}</strong><em className={item.usability === "indexed" ? "is-indexed" : "is-unindexed"}>{item.usability === "indexed" ? "사용 가능" : "인덱싱 필요"}</em></span>
                  <small>{[item.source, item.publishedAt].filter(Boolean).join(" · ") || "출처 정보 없음"}</small>
                  {item.snippet && <p>{item.snippet}</p>}
                </li>
              ))}
            </ul>
          )}
          {!preview && !previewLoading && <p className="topicrpt-empty-value">규칙을 선택하면 서버가 현재 자료의 개수와 표본을 확인합니다.</p>}
          {preview && preview.total > preview.items.length && <p className="topicrpt-collection-disclosure">상위 {preview.items.length}건만 미리 표시합니다. 계획 실행 시 서버가 전체 범위를 다시 해석합니다.</p>}
        </section>
      </div>

      {editorMode && (
        <SmartCollectionEditor
          mode={editorMode}
          revision={editingRevision}
          draft={draft}
          busy={busy}
          onChange={updateDraftField}
          onCancel={() => { setEditorMode(null); setConflict(null); setError(""); }}
          onSave={() => void saveCollection()}
        />
      )}
    </section>
  );
}

type WorkspaceFailure = "source" | "deleted" | "other" | null;

export function SmartCollectionWorkspace({
  collectionId,
  onBack,
  onStartResearch,
}: {
  readonly collectionId: string;
  readonly onBack: () => void;
  readonly onStartResearch: (ref: CollectionRef) => void;
}) {
  const [workspace, setWorkspace] = useState<SmartCollectionWorkspaceEnvelope | null>(null);
  const [changes, setChanges] = useState<SmartCollectionChangesEnvelope | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failure, setFailure] = useState<WorkspaceFailure>(null);
  const [message, setMessage] = useState("");
  const controllerRef = useRef<AbortController | null>(null);

  const loadWorkspace = useCallback(async (
    { preserveMessage = false }: { readonly preserveMessage?: boolean } = {},
  ) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setFailure(null);
    if (!preserveMessage) setMessage("");
    try {
      const encoded = encodeURIComponent(collectionId);
      const [nextWorkspace, nextChanges] = await Promise.all([
        getJson<SmartCollectionWorkspaceEnvelope>(`/api/smart-collections/${encoded}/workspace`, { signal: controller.signal }),
        getJson<SmartCollectionChangesEnvelope>(`/api/smart-collections/${encoded}/changes`, { signal: controller.signal }),
      ]);
      if (controller.signal.aborted) return;
      setWorkspace(nextWorkspace);
      setChanges(nextChanges);
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") return;
      if (requestError instanceof ApiRequestError && requestError.code === "collection_not_found") {
        setFailure("deleted");
      } else if (requestError instanceof ApiRequestError && requestError.code === "collection_source_unavailable") {
        setFailure("source");
      } else {
        setFailure("other");
      }
      setMessage(collectionErrorCopy(requestError));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [collectionId]);

  useEffect(() => {
    void loadWorkspace();
    return () => controllerRef.current?.abort();
  }, [loadWorkspace]);

  const refresh = async () => {
    if (!workspace) return;
    setRefreshing(true);
    setMessage("");
    const body: RefreshSmartCollectionRequest = { expectedRevision: workspace.collection.revision };
    try {
      await postJson<SmartCollectionRefreshEnvelope>(`/api/smart-collections/${encodeURIComponent(collectionId)}/refresh`, body);
      await loadWorkspace();
    } catch (requestError) {
      if (requestError instanceof ApiRequestError && requestError.status === 409) {
        setMessage("다른 탭에서 정의가 변경되었습니다. 최신 revision을 다시 불러왔습니다.");
        await loadWorkspace({ preserveMessage: true });
      } else if (requestError instanceof ApiRequestError && requestError.code === "collection_not_found") {
        setFailure("deleted");
        setMessage(collectionErrorCopy(requestError));
      } else if (requestError instanceof ApiRequestError && requestError.code === "collection_source_unavailable") {
        setFailure("source");
        setMessage(collectionErrorCopy(requestError));
      } else {
        setMessage(collectionErrorCopy(requestError));
      }
    } finally {
      setRefreshing(false);
    }
  };

  const askWhatChanged = () => {
    if (!workspace) return;
    openReactAgentDock({
      surface: "smart_collection_workspace",
      viewId: "topicrpt",
      collectionId: workspace.collection.id,
      collectionRevision: workspace.collection.revision,
      message: "이 Smart Collection의 현재 스냅샷과 이전 스냅샷을 비교해 무엇이 바뀌었는지 설명해줘. 추가·제외된 외부 근거와 불확실성을 함께 정리해줘.",
      autoSubmit: true,
    });
  };

  if (loading && !workspace) {
    return <section className="topicrpt-collection-workspace" data-qa="collection-workspace" aria-busy="true"><p className="react-dashboard-warning">컬렉션과 현재 외부 자료를 확인하는 중입니다.</p></section>;
  }

  if (failure === "deleted") {
    return (
      <section className="topicrpt-collection-workspace" data-qa="collection-workspace">
        <button className="filter-btn clear" type="button" data-qa="collection-workspace-back" onClick={onBack}>딥 리서치로 돌아가기</button>
        <div className="react-dashboard-warning" data-qa="collection-workspace-deleted" role="status"><strong>이 컬렉션은 삭제되었습니다</strong><p>열려 있던 주소는 유지되지만 더 이상 새로고침하거나 리서치 범위로 사용할 수 없습니다.</p></div>
      </section>
    );
  }

  if (failure === "source") {
    return (
      <section className="topicrpt-collection-workspace" data-qa="collection-workspace">
        <button className="filter-btn clear" type="button" data-qa="collection-workspace-back" onClick={onBack}>딥 리서치로 돌아가기</button>
        <div className="react-dashboard-error" data-qa="collection-workspace-source-unavailable" role="alert"><strong>현재 외부 자료를 읽을 수 없습니다</strong><p>{message}</p><button className="filter-btn clear" type="button" onClick={() => void loadWorkspace()}>다시 확인</button></div>
      </section>
    );
  }

  if (!workspace) {
    return (
      <section className="topicrpt-collection-workspace" data-qa="collection-workspace">
        <button className="filter-btn clear" type="button" data-qa="collection-workspace-back" onClick={onBack}>딥 리서치로 돌아가기</button>
        <div className="react-dashboard-error" role="alert"><strong>컬렉션을 열지 못했습니다</strong><p>{message}</p><button className="filter-btn clear" type="button" onClick={() => void loadWorkspace()}>다시 확인</button></div>
      </section>
    );
  }

  const health = workspace.health;
  return (
    <section className="topicrpt-collection-workspace" data-qa="collection-workspace" data-health={health}>
      <div className="topicrpt-collection-workspace-head">
        <button className="filter-btn clear" type="button" data-qa="collection-workspace-back" onClick={onBack}>← 딥 리서치</button>
        <div className="topicrpt-collections-actions">
          <button className="filter-btn clear" type="button" data-qa="collection-workspace-refresh" disabled={refreshing} onClick={() => void refresh()}>{refreshing ? "새로고침 중" : "현재 자료 새로고침"}</button>
          <button className="filter-btn clear" type="button" data-qa="collection-workspace-ask-change" onClick={askWhatChanged}>Agent에게 변화 묻기</button>
          <button className="filter-btn apply" type="button" data-qa="collection-workspace-start" onClick={() => onStartResearch({ id: workspace.collection.id, revision: workspace.collection.revision })}>이 범위로 리서치 시작</button>
        </div>
      </div>

      <header className="topicrpt-collection-workspace-title">
        <p className="section-kicker">SAVED FILTER · SOURCE-GROUNDED INTAKE</p>
        <h1>{workspace.collection.name}</h1>
        <p>저장된 검색 규칙이며 외부 근거 자체가 아닙니다. 새 리서치를 시작하면 서버가 이 ID와 revision으로 자료를 다시 확인합니다.</p>
        <small>{collectionFilterSummary(workspace.collection)} · revision {workspace.collection.revision}</small>
      </header>

      {message && <p className="react-dashboard-warning" role="status">{message}</p>}
      {health === "empty" && <div className="topicrpt-collection-empty" data-qa="collection-workspace-empty" role="status">현재 일치하는 외부 자료가 없습니다. 범위를 조정하거나 자료 인덱스를 갱신하세요.</div>}
      {health === "stale" && <div className="react-dashboard-warning" data-qa="collection-workspace-stale" role="status">최근 입력 상태가 오래되었거나 제공자 상태를 다시 확인해야 합니다.</div>}
      {health === "noisy" && <div className="react-dashboard-warning" data-qa="collection-workspace-noisy" role="status">자료 교체 또는 사용 불가 비율이 높습니다. 변경 내역을 확인한 뒤 리서치를 시작하세요.</div>}

      <div className="topicrpt-collection-health-rail" data-qa="collection-workspace-health">
        <div><span>상태</span><strong>{health}</strong><small>{workspace.healthReasonCodes.map(reasonCopy).join(" · ")}</small></div>
        <div><span>마지막 새로고침</span><strong>{displayTime(workspace.lastRefresh)}</strong><small>{workspace.current.truncated ? "표시 상한 적용" : "현재 범위 확인"}</small></div>
        <div><span>변경</span><strong>+{workspace.changeCounts.added} / −{workspace.changeCounts.removed}</strong><small>유지 {workspace.changeCounts.unchanged}건</small></div>
        <div><span>현재 자료</span><strong>{workspace.current.resolvedCount}건</strong><small>사용 제외 {workspace.current.unusableCount}건</small></div>
      </div>

      <InvestmentContextCard mode="collection" collectionId={workspace.collection.id} />

      <div className="topicrpt-collection-workspace-grid">
        <section className="topicrpt-collection-results" data-qa="collection-workspace-evidence" aria-labelledby="collection-current-evidence">
          <div className="topicrpt-collection-subhead"><strong id="collection-current-evidence">현재 외부 자료</strong><span>{workspace.current.eligibleCount}건 일치</span></div>
          {workspace.recentEvidence.length ? (
            <ul className="topicrpt-collection-samples">
              {workspace.recentEvidence.map((item) => (
                <li key={item.id}>
                  <span><strong>{item.title || "제목 없음"}</strong><em className={item.usability === "indexed" ? "is-indexed" : "is-unindexed"}>{item.usability === "indexed" ? "사용 가능" : "인덱싱 필요"}</em></span>
                  <small>{[item.source, item.publishedAt].filter(Boolean).join(" · ") || "출처 정보 없음"}</small>
                  {item.snippet && <p>{item.snippet}</p>}
                  {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer">원문 열기</a>}
                </li>
              ))}
            </ul>
          ) : <p className="topicrpt-empty-value">표시할 현재 외부 자료가 없습니다.</p>}
        </section>

        <aside className="topicrpt-collection-change-ledger" aria-labelledby="collection-change-heading">
          <div className="topicrpt-collection-subhead"><strong id="collection-change-heading">스냅샷 변경</strong><span>{changes?.observedAt ? displayTime(changes.observedAt) : "확인 전"}</span></div>
          <dl>
            <div><dt>추가</dt><dd>{changes?.counts.added ?? workspace.changeCounts.added}</dd></div>
            <div><dt>제외</dt><dd>{changes?.counts.removed ?? workspace.changeCounts.removed}</dd></div>
            <div><dt>유지</dt><dd>{changes?.counts.unchanged ?? workspace.changeCounts.unchanged}</dd></div>
            <div><dt>사용 불가</dt><dd>{changes?.counts.unusable ?? workspace.current.unusableCount}</dd></div>
          </dl>
          {changes?.removedIds.length ? <details><summary>제외된 identity {changes.removedIds.length}건</summary><ul>{changes.removedIds.map((id) => <li key={id}>{id}</li>)}</ul></details> : null}
          <p>Collection 정의는 저장된 필터 메타데이터입니다. 위 자료 카드만 현재 외부 evidence 후보입니다.</p>
        </aside>
      </div>
    </section>
  );
}
