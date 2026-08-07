from __future__ import annotations

import secrets
import os
from concurrent.futures import Executor
from datetime import UTC, datetime
from collections.abc import Callable
from pathlib import Path
from typing import assert_never
from uuid import uuid4

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from features.common.jcs import JsonValue
from features.common.shared_jobs_store import JobsStoreUnavailableError
from features.market_memory.attempt_store import AttemptStoreUnavailableError
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
    RevisePlanRequest,
)
from features.topic_report.plan_edits import PlanEditError
from features.topic_report.approved_generation import ApprovedGenerationInput
from features.topic_report.approved_jobs import ApprovedTopicJobs
from features.topic_report.approved_research import prepare_approved_research, prepare_market_state
from features.topic_report.approval_submission import SubmissionError
from features.agent_mode.bridge import ADAPTERS, bridge_status
from features.smart_collections.routes import create_smart_collection_service
from features.smart_collections.service import CollectionServiceError, SmartCollectionService


BoundaryFailure = ValidationError | ApprovalStoreError | ApprovedRequestError | CollectionServiceError


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
        case CollectionServiceError(code=code):
            return _response(409, {"error": code})
        case unreachable:
            assert_never(unreachable)


class ApprovedRequestBoundary:
    def __init__(
        self,
        data_dir: Path,
        clock: Callable[[], datetime] | None = None,
        collection_service: SmartCollectionService | None = None,
        executor: Executor | None = None,
    ) -> None:
        runtime_clock = clock or (lambda: datetime.now(UTC))
        collections = collection_service or create_smart_collection_service(data_dir)
        self._clock = runtime_clock
        self._service = ApprovedRequestService(
            ApprovedRequestRuntime(
                dataDir=data_dir,
                clock=runtime_clock,
                entropy=secrets.token_bytes,
                uuidFactory=uuid4,
                resolver=lambda approved: prepare_approved_research(data_dir, collections, approved),
                collectionResolver=collections.approved_ref,
            )
        )
        self._jobs = ApprovedTopicJobs(
            data_dir,
            self._service.approval_store,
            clock=runtime_clock,
            executor=executor,
        )

    @staticmethod
    def _adapter(request: GenerateApprovedRequest) -> str:
        execution = request.execution
        if execution.mode == "direct":
            return "auto"
        if execution.adapter != "auto":
            return execution.adapter
        status = bridge_status(refresh=True)
        selected = str(status.get("selectedAdapter") or "").strip().lower()
        if selected in ADAPTERS:
            return selected
        preferred = str(os.environ.get("AGENT_CLI_PROVIDER") or "").strip().lower()
        return preferred if preferred in ADAPTERS else "codex"

    def plan(self, body: dict[str, JsonValue]) -> JSONResponse:
        try:
            request = PlanRequest.model_validate(body)
            envelope = self._service.plan(request)
        except (ValidationError, ApprovalStoreError, ApprovedRequestError, CollectionServiceError) as error:
            return _failure_response(error)
        return _response(200, envelope.model_dump(mode="json"))

    def revise(self, body: dict[str, JsonValue]) -> JSONResponse:
        try:
            request = RevisePlanRequest.model_validate(body)
            envelope = self._service.revise(request)
        except PlanEditError as error:
            return _response(400, {"error": str(error)})
        except (ValidationError, ApprovalStoreError, ApprovedRequestError, CollectionServiceError) as error:
            return _failure_response(error)
        return _response(200, envelope.model_dump(mode="json"))

    def confirm(self, body: dict[str, JsonValue]) -> JSONResponse:
        try:
            request = ConfirmDegradedRequest.model_validate(body)
            envelope = self._service.confirm(request)
        except (ValidationError, ApprovalStoreError, ApprovedRequestError, CollectionServiceError) as error:
            return _failure_response(error)
        return _response(200, envelope.model_dump(mode="json"))

    def preflight(self, body: dict[str, JsonValue]) -> JSONResponse:
        try:
            request = GenerateApprovedRequest.model_validate(body)
            preflight = self._service.preflight(request)
            if preflight.replayJobId is not None:
                replay = self._jobs.store.get(preflight.replayJobId)
                if replay is None:
                    raise JobsStoreUnavailableError
                return _response(202, {"job": self._jobs.compatibility(replay)})
            if preflight.preview is None or preflight.preparedResearch is None:
                raise JobsStoreUnavailableError
            adapter = self._adapter(request)
            market_state = prepare_market_state(
                self._jobs.data_dir,
                request.approvedRequest,
                self._clock,
            )
            job = self._jobs.queued_job(
                requested_mode=request.execution.mode,
                adapter=adapter,
                confirmed_zero=preflight.preview.zeroEvidence.required,
            )
            command = ApprovedGenerationInput(
                approved=request.approvedRequest,
                approvalId=request.approval.id,
                requestedMode=request.execution.mode,
                adapter=adapter,
                preview=preflight.preview,
                research=preflight.preparedResearch,
                marketState=market_state,
            )
            submitted = self._jobs.submit(
                proof=self._service.approval_proof(request),
                job=job,
                command=command,
            )
        except (ValidationError, ApprovalStoreError, ApprovedRequestError, CollectionServiceError) as error:
            return _failure_response(error)
        except (AttemptStoreUnavailableError, JobsStoreUnavailableError, SubmissionError, OSError, ValueError):
            return _response(503, {"error": "topic_execution_unavailable"})
        return _response(202, {"job": self._jobs.compatibility(submitted.job)})

    def router(self, include_preflight: bool = True) -> APIRouter:
        router = APIRouter(prefix="/api/topic-reports", tags=["topic-reports"])
        router.add_api_route("/plan", self.plan, methods=["POST"])
        router.add_api_route("/plan/revise", self.revise, methods=["POST"])
        router.add_api_route("/confirm-degraded", self.confirm, methods=["POST"])
        if include_preflight:
            router.add_api_route("", self.preflight, methods=["POST"])
        return router


def create_approved_request_router(
    data_dir: Path,
    include_preflight: bool = True,
) -> APIRouter:
    return ApprovedRequestBoundary(data_dir).router(include_preflight)
