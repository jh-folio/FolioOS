from __future__ import annotations

import secrets
from datetime import UTC, datetime
from collections.abc import Callable
from pathlib import Path
from typing import assert_never
from uuid import uuid4

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from features.common.jcs import JsonValue
from features.topic_report.approval_store import (
    ApprovalStoreError,
    ApprovalStoreUnavailableError,
)
from features.topic_report.approved_request import (
    ApprovedRequestError,
    ApprovedRequestRuntime,
    ApprovedRequestService,
    EvidenceConfirmationRequiredError,
    ResolutionChangedError,
)
from features.topic_report.approved_schema import (
    ConfirmDegradedRequest,
    GenerateApprovedRequest,
    PlanRequest,
)
from features.topic_report.research_resolution import resolve_null_collection


BoundaryFailure = ValidationError | ApprovalStoreError | ApprovedRequestError


def _response(status_code: int, payload: dict[str, JsonValue]) -> JSONResponse:
    return JSONResponse(status_code=status_code, content=payload)


def _failure_response(error: BoundaryFailure) -> JSONResponse:
    match error:
        case ValidationError():
            return _response(422, {"error": "validation_error"})
        case EvidenceConfirmationRequiredError(preview=preview):
            return _response(
                409,
                {
                    "error": error.code,
                    "preview": preview.model_dump(mode="json"),
                },
            )
        case ResolutionChangedError(preview=preview):
            return _response(
                409,
                {
                    "error": error.code,
                    "preview": preview.model_dump(mode="json"),
                },
            )
        case ApprovalStoreUnavailableError():
            return _response(503, {"error": error.code})
        case ApprovalStoreError(code=code) | ApprovedRequestError(code=code):
            return _response(409, {"error": code})
        case unreachable:
            assert_never(unreachable)


class ApprovedRequestBoundary:
    def __init__(
        self,
        data_dir: Path,
        clock: Callable[[], datetime] | None = None,
    ) -> None:
        runtime_clock = clock or (lambda: datetime.now(UTC))
        self._service = ApprovedRequestService(
            ApprovedRequestRuntime(
                dataDir=data_dir,
                clock=runtime_clock,
                entropy=secrets.token_bytes,
                uuidFactory=uuid4,
                resolver=lambda approved: resolve_null_collection(data_dir, approved),
            )
        )

    def plan(self, body: dict[str, JsonValue]) -> JSONResponse:
        try:
            request = PlanRequest.model_validate(body)
            envelope = self._service.plan(request)
        except (ValidationError, ApprovalStoreError, ApprovedRequestError) as error:
            return _failure_response(error)
        return _response(200, envelope.model_dump(mode="json"))

    def confirm(self, body: dict[str, JsonValue]) -> JSONResponse:
        try:
            request = ConfirmDegradedRequest.model_validate(body)
            envelope = self._service.confirm(request)
        except (ValidationError, ApprovalStoreError, ApprovedRequestError) as error:
            return _failure_response(error)
        return _response(200, envelope.model_dump(mode="json"))

    def preflight(self, body: dict[str, JsonValue]) -> JSONResponse:
        try:
            request = GenerateApprovedRequest.model_validate(body)
            self._service.preflight(request)
        except (ValidationError, ApprovalStoreError, ApprovedRequestError) as error:
            return _failure_response(error)
        return _response(501, {"error": "topic_execution_deferred"})

    def router(self, include_preflight: bool = True) -> APIRouter:
        router = APIRouter(prefix="/api/topic-reports", tags=["topic-reports"])
        router.add_api_route("/plan", self.plan, methods=["POST"])
        router.add_api_route("/confirm-degraded", self.confirm, methods=["POST"])
        if include_preflight:
            router.add_api_route("", self.preflight, methods=["POST"])
        return router


def create_approved_request_router(
    data_dir: Path,
    include_preflight: bool = True,
) -> APIRouter:
    return ApprovedRequestBoundary(data_dir).router(include_preflight)
