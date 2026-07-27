"""HTTP boundary for deterministic note and Thesis intelligence."""
from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path

from fastapi import APIRouter, Body
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from features.investment_notes.intelligence import (
    IntelligenceConflictError,
    IntelligenceNotFoundError,
    IntelligenceRuntime,
    IntelligenceService,
)
from features.investment_notes.intelligence_schema import CheckpointState


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class NotePath(StrictModel):
    noteId: str = Field(pattern=r"^[A-Za-z0-9_-]{1,96}$")


class TickerPath(StrictModel):
    ticker: str = Field(pattern=r"^[A-Z0-9-]{1,12}$")


class CheckpointUpdate(StrictModel):
    noteId: str = Field(pattern=r"^[A-Za-z0-9_-]{1,96}$")
    checkpointId: str = Field(pattern=r"^[A-Za-z0-9:_-]{1,120}$")
    state: CheckpointState
    expectedRevision: int = Field(ge=0)


def response(status: int, payload: dict) -> JSONResponse:
    return JSONResponse(status_code=status, content=payload)


def validation_response(error: ValidationError) -> JSONResponse:
    fields = sorted({str(item["loc"][-1]) for item in error.errors() if item["loc"]})
    return response(422, {"error": "validation_error", "fields": fields})


class IntelligenceBoundary:
    def __init__(self, service: IntelligenceService) -> None:
        self.service = service

    def note(self, note_id: str) -> JSONResponse:
        try:
            identity = NotePath.model_validate({"noteId": note_id})
            payload = self.service.note(identity.noteId)
        except ValidationError as error:
            return validation_response(error)
        except IntelligenceNotFoundError as error:
            return response(404, {"error": error.code})
        except IntelligenceConflictError as error:
            return response(409, {"error": error.code})
        return response(200, payload)

    def thesis(self, ticker: str) -> JSONResponse:
        try:
            identity = TickerPath.model_validate({"ticker": str(ticker or "").upper()})
            payload = self.service.thesis(identity.ticker)
        except ValidationError as error:
            return validation_response(error)
        except IntelligenceNotFoundError as error:
            return response(404, {"error": error.code})
        return response(200, payload)

    def update_checkpoint(self, ticker: str, body: dict = Body(...)) -> JSONResponse:
        try:
            identity = TickerPath.model_validate({"ticker": str(ticker or "").upper()})
            command = CheckpointUpdate.model_validate(body)
            payload = self.service.update_checkpoint(
                identity.ticker,
                note_id=command.noteId,
                checkpoint_id=command.checkpointId,
                state=command.state,
                expected_revision=command.expectedRevision,
            )
        except ValidationError as error:
            return validation_response(error)
        except IntelligenceNotFoundError as error:
            return response(404, {"error": error.code})
        except IntelligenceConflictError as error:
            return response(409, {"error": error.code})
        return response(200, payload)

    def router(self) -> APIRouter:
        router = APIRouter(tags=["investment-intelligence"])
        router.add_api_route(
            "/api/investment-notes/{note_id}/intelligence",
            self.note,
            methods=["GET"],
        )
        router.add_api_route(
            "/api/theses/{ticker}/review",
            self.thesis,
            methods=["GET"],
        )
        router.add_api_route(
            "/api/theses/{ticker}/review/checkpoints",
            self.update_checkpoint,
            methods=["POST"],
        )
        return router


def create_intelligence_router(data_dir: Path) -> APIRouter:
    service = IntelligenceService(
        IntelligenceRuntime(dataDir=data_dir, clock=lambda: datetime.now(UTC))
    )
    return IntelligenceBoundary(service).router()


__all__ = [
    "CheckpointUpdate",
    "IntelligenceBoundary",
    "create_intelligence_router",
]

