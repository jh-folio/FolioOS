from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path

from fastapi import APIRouter, Body
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from features.agent_mode.collection_context import prepare_agent_context
from features.agent_mode.chat import submit_agent_chat
from features.agent_mode.companion import agent_companion_reply
from features.agent_mode.investment_context import (
    InvestmentExplanationRequest,
    default_evidence_loader,
)
from features.agent_mode.service import submit_investment_explanation
from features.investment_review.service import InvestmentContextRuntime, InvestmentContextService
from features.smart_collections.routes import failure_response
from features.smart_collections.service import CollectionServiceError, SmartCollectionService
from features.smart_collections.store import CollectionStoreUnavailableError


class AgentCompanionBoundary:
    def __init__(
        self,
        collection_service: SmartCollectionService,
        *,
        data_dir: Path | None = None,
        investment_context_service=None,
        evidence_loader=None,
    ) -> None:
        self.collection_service = collection_service
        self.investment_context_service = investment_context_service
        self.evidence_loader = evidence_loader
        if self.investment_context_service is None and data_dir is not None:
            self.investment_context_service = InvestmentContextService(
                InvestmentContextRuntime(
                    dataDir=data_dir,
                    clock=lambda: datetime.now(UTC),
                    collectionService=collection_service,
                )
            )
        if self.evidence_loader is None and data_dir is not None:
            self.evidence_loader = default_evidence_loader(data_dir)

    def companion(self, body: dict | None = Body(default=None)):
        body = body or {}
        try:
            context = prepare_agent_context(body.get("context") or {}, self.collection_service)
        except (ValidationError, CollectionServiceError, CollectionStoreUnavailableError) as error:
            return failure_response(error)
        projection = context.pop("collection", None)
        return agent_companion_reply(
            body.get("message", ""),
            context,
            body.get("options") or {},
            collection_projection=projection,
        )

    def chat(self, body: dict | None = Body(default=None)):
        body = body or {}
        try:
            context = prepare_agent_context(body.get("context") or {}, self.collection_service)
        except (ValidationError, CollectionServiceError, CollectionStoreUnavailableError) as error:
            return failure_response(error)
        return submit_agent_chat(
            body.get("message", ""),
            context,
            body.get("options") or {},
            collection_service=self.collection_service,
            prepared_context=True,
        )

    def explain_investment_context(self, body: dict | None = Body(default=None)):
        if self.investment_context_service is None or self.evidence_loader is None:
            return JSONResponse(
                status_code=503,
                content={"error": "investment_context_unavailable"},
            )
        try:
            request = InvestmentExplanationRequest.model_validate(body or {})
        except ValidationError as error:
            return failure_response(error)
        return submit_investment_explanation(
            request.tickers,
            self.investment_context_service,
            self.evidence_loader,
        )

    def router(self) -> APIRouter:
        router = APIRouter(tags=["agent"])
        router.add_api_route("/api/agent/companion", self.companion, methods=["POST"])
        router.add_api_route("/api/agent/chat", self.chat, methods=["POST"])
        router.add_api_route(
            "/api/agent/investment-context/explain",
            self.explain_investment_context,
            methods=["POST"],
        )
        return router
