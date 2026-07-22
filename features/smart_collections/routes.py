from __future__ import annotations

import re
from datetime import UTC, datetime
from pathlib import Path
from typing import assert_never

from fastapi import APIRouter, Body, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from features.common.jcs import JsonValue
from features.smart_collections.providers import CollectionSourceUnavailableError
from features.smart_collections.schema import (
    CreateCollectionRequest,
    DeleteCollectionRequest,
    ListQuery,
    PreviewRequest,
    ResolveRequest,
    UpdateCollectionRequest,
)
from features.smart_collections.service import (
    CollectionConflictError,
    CollectionNotFoundError,
    CollectionServiceError,
    CollectionStoreUnavailableError,
    SmartCollectionRuntime,
    SmartCollectionService,
)


CollectionFailure = (
    ValidationError
    | CollectionServiceError
    | CollectionStoreUnavailableError
    | CollectionSourceUnavailableError
)
COLLECTION_FAILURES = (
    ValidationError,
    CollectionServiceError,
    CollectionStoreUnavailableError,
    CollectionSourceUnavailableError,
)
CANONICAL_QUERY_INTEGER = re.compile(r"(?:0|[1-9][0-9]*)\Z")


def response(status: int, payload: dict[str, JsonValue]) -> JSONResponse:
    return JSONResponse(status_code=status, content=payload)


def validation_fields(error: ValidationError) -> list[JsonValue]:
    return sorted({str(item["loc"][-1]) for item in error.errors() if item["loc"]})


def failure_response(error: CollectionFailure) -> JSONResponse:
    match error:
        case ValidationError():
            return response(422, {"error": "validation_error", "fields": validation_fields(error)})
        case CollectionNotFoundError(collectionId=collection_id):
            return response(404, {"error": "collection_not_found", "id": collection_id})
        case CollectionConflictError(
            code=code,
            collectionId=collection_id,
            currentRevision=current_revision,
            storeRevision=store_revision,
        ):
            return response(
                409,
                {
                    "error": code,
                    "id": collection_id,
                    "currentRevision": current_revision,
                    "storeRevision": store_revision,
                },
            )
        case CollectionStoreUnavailableError():
            return response(503, {"error": "collection_store_unavailable"})
        case CollectionSourceUnavailableError():
            return response(503, {"error": "collection_source_unavailable"})
        case CollectionServiceError(code=code):
            return response(409, {"error": code})
        case unreachable:
            assert_never(unreachable)


def list_query_payload(request: Request) -> dict[str, JsonValue]:
    """Coerce only canonical URL decimal integers at the HTTP query boundary.

    ListQuery remains strict so JSON and direct schema callers cannot gain string
    coercion. Non-canonical values stay strings and fail normal Pydantic validation.
    """
    payload: dict[str, JsonValue] = dict(request.query_params)
    for field in ("limit", "offset"):
        value = payload.get(field)
        if isinstance(value, str) and CANONICAL_QUERY_INTEGER.fullmatch(value):
            payload[field] = int(value)
    return payload


class SmartCollectionBoundary:
    def __init__(self, service: SmartCollectionService) -> None:
        self.service = service

    def list(self, request: Request) -> JSONResponse:
        try:
            query = ListQuery.model_validate(list_query_payload(request))
            payload = self.service.list(query.limit, query.offset)
        except (ValidationError, CollectionStoreUnavailableError) as error:
            return failure_response(error)
        return response(200, payload)

    def create(self, body: dict[str, JsonValue] = Body(...)) -> JSONResponse:
        try:
            payload = self.service.create(CreateCollectionRequest.model_validate(body))
        except (ValidationError, CollectionServiceError, CollectionStoreUnavailableError) as error:
            return failure_response(error)
        return response(201, payload)

    def get(self, collection_id: str) -> JSONResponse:
        try:
            payload = self.service.get(collection_id)
        except (CollectionServiceError, CollectionStoreUnavailableError) as error:
            return failure_response(error)
        return response(200, payload)

    def update(self, collection_id: str, body: dict[str, JsonValue] = Body(...)) -> JSONResponse:
        try:
            payload = self.service.update(collection_id, UpdateCollectionRequest.model_validate(body))
        except (ValidationError, CollectionServiceError, CollectionStoreUnavailableError) as error:
            return failure_response(error)
        return response(200, payload)

    def delete(self, collection_id: str, body: dict[str, JsonValue] = Body(...)) -> JSONResponse:
        try:
            payload = self.service.delete(collection_id, DeleteCollectionRequest.model_validate(body))
        except (ValidationError, CollectionServiceError, CollectionStoreUnavailableError) as error:
            return failure_response(error)
        return response(200, payload)

    def preview(self, collection_id: str, body: dict[str, JsonValue] = Body(...)) -> JSONResponse:
        try:
            payload = self.service.preview(collection_id, PreviewRequest.model_validate(body))
        except COLLECTION_FAILURES as error:
            return failure_response(error)
        return response(200, payload)

    def resolve(self, collection_id: str, body: dict[str, JsonValue] = Body(...)) -> JSONResponse:
        try:
            payload = self.service.resolve(collection_id, ResolveRequest.model_validate(body))
        except COLLECTION_FAILURES as error:
            return failure_response(error)
        return response(200, payload)

    def router(self) -> APIRouter:
        router = APIRouter(prefix="/api/smart-collections", tags=["smart-collections"])
        router.add_api_route("", self.list, methods=["GET"])
        router.add_api_route("", self.create, methods=["POST"])
        router.add_api_route("/{collection_id}", self.get, methods=["GET"])
        router.add_api_route("/{collection_id}", self.update, methods=["PUT"])
        router.add_api_route("/{collection_id}", self.delete, methods=["DELETE"])
        router.add_api_route("/{collection_id}/preview", self.preview, methods=["POST"])
        router.add_api_route("/{collection_id}/resolve", self.resolve, methods=["POST"])
        return router


def create_smart_collection_service(data_dir: Path) -> SmartCollectionService:
    return SmartCollectionService(
        SmartCollectionRuntime(dataDir=data_dir, clock=lambda: datetime.now(UTC))
    )


def create_smart_collection_router(data_dir: Path) -> APIRouter:
    return SmartCollectionBoundary(create_smart_collection_service(data_dir)).router()
