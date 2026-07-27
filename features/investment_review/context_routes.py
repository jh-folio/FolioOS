"""Read-only HTTP boundary for bounded per-ticker investment context."""
from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, ValidationError, field_validator

from features.investment_review.context_links import normalize_research_ticker
from features.investment_review.service import (
    InvestmentContextNotFoundError,
    InvestmentContextRuntime,
    InvestmentContextService,
)


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class TickerPath(StrictModel):
    ticker: str

    @field_validator("ticker", mode="before")
    @classmethod
    def normalize_ticker(cls, value: object) -> str:
        ticker = normalize_research_ticker(value)
        if not ticker:
            raise ValueError("invalid_ticker")
        return ticker


def response(status: int, payload: dict) -> JSONResponse:
    return JSONResponse(status_code=status, content=payload)


def validation_response(error: ValidationError) -> JSONResponse:
    fields = sorted({str(item["loc"][-1]) for item in error.errors() if item["loc"]})
    return response(422, {"error": "validation_error", "fields": fields})


class InvestmentContextBoundary:
    def __init__(self, service: InvestmentContextService) -> None:
        self.service = service

    def summary(self) -> JSONResponse:
        return response(200, self.service.summary())

    def detail(self, ticker: str) -> JSONResponse:
        try:
            identity = TickerPath.model_validate({"ticker": ticker})
            payload = self.service.detail(identity.ticker)
        except ValidationError as error:
            return validation_response(error)
        except InvestmentContextNotFoundError as error:
            return response(404, {"error": error.code})
        return response(200, payload)

    def router(self) -> APIRouter:
        router = APIRouter(prefix="/api/investment-context", tags=["investment-context"])
        router.add_api_route("/summary", self.summary, methods=["GET"])
        router.add_api_route("/{ticker}", self.detail, methods=["GET"])
        return router


def create_investment_context_router(
    data_dir: Path,
    *,
    collection_service=None,
) -> APIRouter:
    service = InvestmentContextService(
        InvestmentContextRuntime(
            dataDir=data_dir,
            clock=lambda: datetime.now(UTC),
            collectionService=collection_service,
        )
    )
    return InvestmentContextBoundary(service).router()


__all__ = [
    "InvestmentContextBoundary",
    "TickerPath",
    "create_investment_context_router",
]
