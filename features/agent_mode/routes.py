from __future__ import annotations

from fastapi import APIRouter, Body
from pydantic import ValidationError

from features.agent_mode.collection_context import prepare_agent_context
from features.agent_mode.chat import submit_agent_chat
from features.agent_mode.companion import agent_companion_reply
from features.smart_collections.routes import failure_response
from features.smart_collections.service import CollectionServiceError, SmartCollectionService
from features.smart_collections.store import CollectionStoreUnavailableError


class AgentCompanionBoundary:
    def __init__(self, collection_service: SmartCollectionService) -> None:
        self.collection_service = collection_service

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
        )

    def router(self) -> APIRouter:
        router = APIRouter(tags=["agent"])
        router.add_api_route("/api/agent/companion", self.companion, methods=["POST"])
        router.add_api_route("/api/agent/chat", self.chat, methods=["POST"])
        return router
