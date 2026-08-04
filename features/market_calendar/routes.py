from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Body, Query

from .service import list_events, refresh_calendar


def create_market_calendar_router(data_dir: Path) -> APIRouter:
    router = APIRouter(prefix="/api/market-calendar", tags=["market-calendar"])
    db_path = Path(data_dir) / "market-memory.sqlite3"

    @router.get("")
    def events(start: str = "", end: str = "", market: str = "", kind: list[str] = Query(default=[]), ticker: list[str] = Query(default=[]), limit: int = Query(default=200, ge=1, le=500)):
        return list_events(db_path, start=start, end=end, market=market, kinds=kind, tickers=ticker, limit=limit)

    @router.post("/refresh")
    def refresh(body: dict | None = Body(default=None)):
        return refresh_calendar(data_dir, include_estimates=(body or {}).get("includeEstimates") is not False)

    return router
