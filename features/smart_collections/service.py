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
    ResolveRequest,
    UpdateCollectionRequest,
)
from features.topic_report.approved_schema import ApprovedCollectionRef, CollectionDefinitionSnapshot
from features.smart_collections.store import (
    CollectionStore,
    CollectionStoreUnavailableError,
    StoreState,
)


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


class SmartCollectionService:
    def __init__(self, runtime: SmartCollectionRuntime) -> None:
        self.runtime = runtime
        self.store = CollectionStore(runtime.dataDir / "smart-collections.json")

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
            return {"storeRevision": written.storeRevision, "deletedId": collection_id}

    def preview(self, collection_id: str, request: PreviewRequest) -> dict[str, JsonValue]:
        from features.smart_collections.resolution import ResolutionRequest, resolve_collection

        state = self.store.load()
        collection = self._find(state, collection_id)
        self._check_revision(state, collection, request.expectedRevision)
        return resolve_collection(
            ResolutionRequest(self.runtime.dataDir, collection, request.limit, False, self.runtime.clock)
        )

    def resolve(self, collection_id: str, request: ResolveRequest) -> dict[str, JsonValue]:
        from features.smart_collections.resolution import ResolutionRequest, resolve_collection

        state = self.store.load()
        collection = self._find(state, collection_id)
        self._check_revision(state, collection, request.expectedRevision)
        return resolve_collection(
            ResolutionRequest(self.runtime.dataDir, collection, request.limit, True, self.runtime.clock)
        )


__all__ = [
    "CollectionConflictError",
    "CollectionNotFoundError",
    "CollectionStoreUnavailableError",
    "SmartCollectionRuntime",
    "SmartCollectionService",
    "definition_hash",
    "definition_snapshot",
]
