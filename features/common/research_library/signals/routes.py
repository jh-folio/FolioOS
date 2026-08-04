from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Query

from .service import default_db_path, provider_health, query_signals


def create_signal_router(data_dir: Path) -> APIRouter:
    router = APIRouter(prefix="/api/signals", tags=["signals"])

    @router.get("")
    def list_signals(
        ticker: str = "",
        market: str = "",
        status: str = "",
        provider: str = "",
        cursor: str = "",
        limit: int = Query(default=50, ge=1, le=100),
    ):
        return query_signals(
            default_db_path(data_dir), ticker=ticker, market=market, status=status,
            provider=provider, cursor=cursor, limit=limit,
        )

    @router.get("/providers")
    def providers():
        return {"providers": list(provider_health(data_dir).values())}

    return router
