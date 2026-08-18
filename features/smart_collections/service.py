from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from uuid import UUID, uuid4

from features.common.jcs import JsonValue, sha256_hex
from features.smart_collections.schema import (
    Collection,
    CollectionFields,
    CreateCollectionRequest,
    DeleteCollectionRequest,
    PreviewRequest,
    RefreshRequest,
    ResolveRequest,
    UpdateCollectionRequest,
)
from features.topic_report.approved_schema import ApprovedCollectionRef, CollectionDefinitionSnapshot
from features.smart_collections.store import (
    CollectionStore,
    CollectionStoreUnavailableError,
    StoreState,
)
from features.smart_collections.snapshot_store import (
    SnapshotStore,
    SnapshotStoreUnavailableError,
    resolution_snapshot,
)
from features.smart_collections.change_detection import calculate_change

# 스냅샷·변화 감지의 canonical 해석 범위. 스냅샷을 이보다 좁게 기록하면
# 이후 비교에서 그 차이가 전부 '변화'로 계산된다.
SNAPSHOT_RESOLUTION_LIMIT = 120


@dataclass(frozen=True, slots=True)
class SmartCollectionRuntime:
    dataDir: Path
    clock: Callable[[], datetime]
    uuidFactory: Callable[[], UUID] = uuid4


@dataclass(frozen=True, slots=True)
class CollectionServiceError(Exception):
    code: str
    collectionId: str | None = None
    currentRevision: int | None = None
    storeRevision: int | None = None

    def __str__(self) -> str:
        return self.code


class CollectionNotFoundError(CollectionServiceError):
    def __init__(self, collection_id: str) -> None:
        super().__init__(code="collection_not_found", collectionId=collection_id)


class CollectionConflictError(CollectionServiceError):
    pass


def utc_z(value: datetime) -> str:
    return value.astimezone(UTC).isoformat(timespec="microseconds").replace("+00:00", "Z")


def definition_snapshot(collection: CollectionFields) -> dict[str, JsonValue]:
    return {
        "query": collection.query,
        "market": collection.market,
        "sources": sorted(collection.sources),
        "tickers": sorted(collection.tickers),
        "tags": sorted(collection.tags),
    }


def definition_hash(collection: CollectionFields) -> str:
    return sha256_hex(definition_snapshot(collection))


def project_ticker_collection_links(
    collections,
    *,
    external_results=(),
    health_by_collection=None,
) -> dict[str, list[dict[str, JsonValue]]]:
    """Project read-only Collection metadata by normalized ticker.

    Saved ticker filters and externally supplied result ticker identities are
    separate match signals. This helper never resolves or rewrites a Collection.
    """
    from features.investment_review.context_links import normalize_research_ticker

    health_by_collection = health_by_collection or {}
    definitions: dict[str, dict] = {}
    matches: dict[tuple[str, str], set[str]] = {}
    for raw in collections or ():
        if not isinstance(raw, dict):
            continue
        collection_id = str(raw.get("id") or "").strip()
        name = str(raw.get("name") or "").strip()
        revision = raw.get("revision")
        if not collection_id or not name or not isinstance(revision, int) or revision < 1:
            continue
        definitions[collection_id] = raw
        for value in raw.get("tickers") or ():
            ticker = normalize_research_ticker(value)
            if ticker:
                matches.setdefault((ticker, collection_id), set()).add("saved_filter")

    for raw in external_results or ():
        if not isinstance(raw, dict):
            continue
        collection_id = str(raw.get("collectionId") or "").strip()
        if collection_id not in definitions or not str(raw.get("evidenceId") or "").strip():
            continue
        for value in raw.get("tickers") or ():
            ticker = normalize_research_ticker(value)
            if ticker:
                matches.setdefault((ticker, collection_id), set()).add("external_result")

    allowed_health = {"active", "stale", "empty", "noisy", "unknown", "unavailable"}
    output: dict[str, list[dict[str, JsonValue]]] = {}
    for (ticker, collection_id), sources in matches.items():
        definition = definitions[collection_id]
        health = str(health_by_collection.get(collection_id) or "unknown").lower()
        if health not in allowed_health:
            health = "unknown"
        output.setdefault(ticker, []).append(
            {
                "id": collection_id,
                "name": str(definition["name"])[:80],
                "revision": int(definition["revision"]),
                "health": health,
                "matchSources": [
                    source
                    for source in ("saved_filter", "external_result")
                    if source in sources
                ],
            }
        )
    for links in output.values():
        links.sort(key=lambda link: (str(link["name"]).casefold(), str(link["id"])))
    return dict(sorted(output.items()))


class SmartCollectionService:
    def __init__(self, runtime: SmartCollectionRuntime) -> None:
        self.runtime = runtime
        self.store = CollectionStore(runtime.dataDir / "smart-collections.json")
        self.snapshots = SnapshotStore(runtime.dataDir / "smart-collection-state")

    def _find(self, state: StoreState, collection_id: str) -> Collection:
        collection = next((item for item in state.collections if item.id == collection_id), None)
        if collection is None:
            raise CollectionNotFoundError(collection_id)
        return collection

    def _check_name(self, state: StoreState, name: str, collection_id: str | None = None) -> None:
        duplicate = next(
            (
                item
                for item in state.collections
                if item.id != collection_id and item.name.casefold() == name.casefold()
            ),
            None,
        )
        if duplicate is not None:
            raise CollectionConflictError(
                code="duplicate_name",
                collectionId=collection_id,
                currentRevision=None,
                storeRevision=state.storeRevision,
            )

    def _check_revision(self, state: StoreState, collection: Collection, expected: int) -> None:
        if collection.revision != expected:
            raise CollectionConflictError(
                code="revision_conflict",
                collectionId=collection.id,
                currentRevision=collection.revision,
                storeRevision=state.storeRevision,
            )

    def list(self, limit: int, offset: int) -> dict[str, JsonValue]:
        state = self.store.load()
        ordered = sorted(state.collections, key=lambda item: (item.id, ), reverse=False)
        ordered.sort(key=lambda item: item.updatedAt, reverse=True)
        return {
            "schemaVersion": 1,
            "storeRevision": state.storeRevision,
            "recovered": state.recovered,
            "total": len(ordered),
            "items": [item.model_dump(mode="json") for item in ordered[offset : offset + limit]],
        }

    def get(self, collection_id: str) -> dict[str, JsonValue]:
        state = self.store.load()
        collection = self._find(state, collection_id)
        return {
            "storeRevision": state.storeRevision,
            "recovered": state.recovered,
            "collection": collection.model_dump(mode="json"),
        }

    def approved_ref(self, collection_id: str, expected_revision: int) -> ApprovedCollectionRef:
        state = self.store.load()
        collection = self._find(state, collection_id)
        self._check_revision(state, collection, expected_revision)
        snapshot = definition_snapshot(collection)
        return ApprovedCollectionRef(
            id=collection.id,
            revision=collection.revision,
            definitionHash=sha256_hex(snapshot),
            definitionSnapshot=CollectionDefinitionSnapshot.model_validate(snapshot),
        )

    def create(self, request: CreateCollectionRequest) -> dict[str, JsonValue]:
        with self.store.lock:
            state = self.store.load()
            self._check_name(state, request.name)
            now = utc_z(self.runtime.clock())
            collection = Collection(
                id=f"sc_{self.runtime.uuidFactory()}",
                revision=1,
                createdAt=now,
                updatedAt=now,
                **request.model_dump(),
            )
            written = self.store.write(
                StoreState(
                    storeRevision=state.storeRevision + 1,
                    updatedAt=now,
                    collections=(*state.collections, collection),
                )
            )
            return {"storeRevision": written.storeRevision, "collection": collection.model_dump(mode="json")}

    def update(self, collection_id: str, request: UpdateCollectionRequest) -> dict[str, JsonValue]:
        with self.store.lock:
            state = self.store.load()
            current = self._find(state, collection_id)
            self._check_revision(state, current, request.expectedRevision)
            self._check_name(state, request.name, collection_id)
            now = utc_z(self.runtime.clock())
            fields = request.model_dump(exclude={"expectedRevision"})
            updated = current.model_copy(update={**fields, "revision": current.revision + 1, "updatedAt": now})
            collections = tuple(updated if item.id == collection_id else item for item in state.collections)
            written = self.store.write(
                StoreState(state.storeRevision + 1, now, collections)
            )
            return {"storeRevision": written.storeRevision, "collection": updated.model_dump(mode="json")}

    def delete(self, collection_id: str, request: DeleteCollectionRequest) -> dict[str, JsonValue]:
        with self.store.lock:
            state = self.store.load()
            current = self._find(state, collection_id)
            self._check_revision(state, current, request.expectedRevision)
            now = utc_z(self.runtime.clock())
            written = self.store.write(
                StoreState(
                    state.storeRevision + 1,
                    now,
                    tuple(item for item in state.collections if item.id != collection_id),
                )
            )
            self.snapshots.delete(collection_id)
            return {"storeRevision": written.storeRevision, "deletedId": collection_id}

    def preview(self, collection_id: str, request: PreviewRequest) -> dict[str, JsonValue]:
        # 스냅샷은 항상 canonical 범위(SNAPSHOT_RESOLUTION_LIMIT)로 해석해 기록한다.
        # 요청 limit은 표시 절단일 뿐이다 — 화면 preview(limit=10) 스냅샷을 그대로 저장하면
        # workspace/changes의 120개 해석과 비교되어 자료 변화 없이 added 110건이 나온다.
        state = self.store.load()
        collection = self._find(state, collection_id)
        self._check_revision(state, collection, request.expectedRevision)
        resolved = self._current_resolution(collection)
        self.snapshots.append(resolved, definition_hash=definition_hash(collection))
        return {
            "collectionId": resolved["collectionId"],
            "revision": resolved["revision"],
            "total": resolved["total"],
            "limit": request.limit,
            "items": list(resolved["items"])[: request.limit],
        }

    def resolve(self, collection_id: str, request: ResolveRequest) -> dict[str, JsonValue]:
        state = self.store.load()
        collection = self._find(state, collection_id)
        self._check_revision(state, collection, request.expectedRevision)
        resolved = self._current_resolution(collection)
        self.snapshots.append(resolved, definition_hash=definition_hash(collection))
        if request.limit >= SNAPSHOT_RESOLUTION_LIMIT:
            return resolved
        return {**resolved, "limit": request.limit, "items": list(resolved["items"])[: request.limit]}

    def _current_resolution(
        self,
        collection: Collection,
        *,
        limit: int = SNAPSHOT_RESOLUTION_LIMIT,
    ) -> dict[str, JsonValue]:
        from features.smart_collections.resolution import ResolutionRequest, resolve_collection

        return resolve_collection(
            ResolutionRequest(self.runtime.dataDir, collection, limit, True, self.runtime.clock)
        )

    def _change_projection(
        self,
        collection: Collection,
        resolved: dict[str, JsonValue],
        previous,
    ):
        current = resolution_snapshot(resolved, definition_hash=definition_hash(collection))
        return current, calculate_change(current, previous, now=self.runtime.clock())

    @staticmethod
    def _latest_preview(snapshot) -> dict[str, JsonValue] | None:
        if snapshot is None:
            return None
        return {
            "resolvedAt": snapshot.resolvedAt,
            "providerGenerations": snapshot.providerGenerations.model_dump(mode="json"),
            "inputWatermark": snapshot.inputWatermark,
            "eligibleCount": snapshot.eligibleCount,
            "resolvedCount": snapshot.resolvedCount,
            "executionCount": snapshot.executionCount,
            "unusableCount": snapshot.unusableCount,
            "truncated": snapshot.truncated,
        }

    def _workspace_payload(
        self,
        collection: Collection,
        resolved: dict[str, JsonValue],
        previous,
    ) -> dict[str, JsonValue]:
        _, change = self._change_projection(collection, resolved, previous)
        change_payload = change.model_dump(mode="json")
        items = resolved.get("items")
        recent = items[:20] if isinstance(items, list) else []
        return {
            "collection": collection.model_dump(mode="json"),
            "latestPreview": self._latest_preview(previous),
            "health": change.health.value,
            "healthReasonCodes": list(change.reasonCodes),
            "lastRefresh": previous.resolvedAt if previous is not None else None,
            "changeCounts": {
                "added": change.addedCount,
                "removed": change.removedCount,
                "unchanged": change.unchangedCount,
            },
            "recentEvidence": recent,
            "current": {
                "observedAt": change.observedAt,
                "eligibleCount": change.eligibleCount,
                "resolvedCount": change.resolvedCount,
                "unusableCount": change.unusableCount,
                "truncated": change.truncated,
            },
        }

    def workspace(self, collection_id: str) -> dict[str, JsonValue]:
        state = self.store.load()
        collection = self._find(state, collection_id)
        history = self.snapshots.load(collection_id)
        previous = history.history[-1] if history is not None and history.history else None
        resolved = self._current_resolution(collection)
        return self._workspace_payload(collection, resolved, previous)

    def changes(self, collection_id: str) -> dict[str, JsonValue]:
        state = self.store.load()
        collection = self._find(state, collection_id)
        history = self.snapshots.load(collection_id)
        previous = history.history[-1] if history is not None and history.history else None
        resolved = self._current_resolution(collection)
        _, change = self._change_projection(collection, resolved, previous)
        items = resolved.get("items")
        current_items = items if isinstance(items, list) else []
        added = set(change.addedIds)
        return {
            "collectionId": collection.id,
            "revision": collection.revision,
            "observedAt": change.observedAt,
            "health": change.health.value,
            "reasonCodes": list(change.reasonCodes),
            "counts": {
                "added": change.addedCount,
                "removed": change.removedCount,
                "unchanged": change.unchangedCount,
                "unusable": change.unusableCount,
            },
            "addedItems": [
                item
                for item in current_items
                if isinstance(item, dict) and item.get("id") in added
            ][:120],
            "removedIds": list(change.removedIds),
            "unchangedIds": list(change.unchangedIds),
            "truncated": change.truncated,
        }

    def read_change_summary(
        self,
        collection_id: str,
        expected_revision: int,
    ) -> dict[str, JsonValue]:
        """Read one consistent change comparison without persisting a snapshot."""
        state = self.store.load()
        collection = self._find(state, collection_id)
        self._check_revision(state, collection, expected_revision)
        history = self.snapshots.load(collection_id)
        previous = history.history[-1] if history is not None and history.history else None
        resolved = self._current_resolution(collection)
        current, change = self._change_projection(collection, resolved, previous)
        items = resolved.get("items")
        return {
            "collectionId": collection.id,
            "revision": collection.revision,
            "definitionHash": definition_hash(collection),
            "currentSnapshot": current.model_dump(mode="json"),
            "previousSnapshot": previous.model_dump(mode="json") if previous is not None else None,
            "change": change.model_dump(mode="json"),
            "items": items if isinstance(items, list) else [],
        }

    def refresh(
        self,
        collection_id: str,
        request: RefreshRequest,
    ) -> dict[str, JsonValue]:
        state = self.store.load()
        collection = self._find(state, collection_id)
        self._check_revision(state, collection, request.expectedRevision)
        history = self.snapshots.load(collection_id)
        previous = history.history[-1] if history is not None and history.history else None
        resolved = self._current_resolution(collection)
        current, change = self._change_projection(collection, resolved, previous)
        self.snapshots.append(resolved, definition_hash=definition_hash(collection))
        items = resolved.get("items")
        recent = items[:20] if isinstance(items, list) else []
        return {
            "collectionId": collection.id,
            "revision": collection.revision,
            "refreshedAt": current.resolvedAt,
            "latestPreview": self._latest_preview(current),
            "change": change.model_dump(mode="json"),
            "recentEvidence": recent,
        }


__all__ = [
    "CollectionConflictError",
    "CollectionNotFoundError",
    "CollectionStoreUnavailableError",
    "SnapshotStoreUnavailableError",
    "SmartCollectionRuntime",
    "SmartCollectionService",
    "definition_hash",
    "project_ticker_collection_links",
    "definition_snapshot",
]
