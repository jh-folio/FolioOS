from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException

from .chart_service import get_chart


def create_market_data_router(data_dir: Path) -> APIRouter:
    router = APIRouter(prefix="/api/market", tags=["market-data"])

    @router.get("/chart")
    def chart(symbol: str, range: str = "3m", interval: str = "1d"):  # noqa: A002 - public API contract
        try:
            return get_chart(data_dir, symbol=symbol, range_key=range, interval=interval)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    return router
