"""Thin Portfolio API router."""
from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Body, HTTPException, Query

from .service import (
    PortfolioRevisionConflict,
    delete_portfolio_backtest,
    delete_portfolio_preset,
    get_portfolio,
    get_portfolio_backtest,
    list_portfolio_backtests,
    list_portfolio_presets,
    portfolio_analytics,
    portfolio_summary,
    preset_from_current_portfolio,
    resolve_portfolio_ticker,
    run_portfolio_backtest,
    run_portfolio_backtest_comparison,
    save_portfolio,
    save_portfolio_backtest_result,
    save_portfolio_preset,
    search_portfolio_tickers,
)


def create_portfolio_router(data_dir: Path) -> APIRouter:
    router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])

    @router.get("")
    def read_portfolio():
        return get_portfolio(data_dir)

    @router.post("")
    def write_portfolio(body: dict | None = Body(default=None)):
        try:
            return save_portfolio(body or {}, data_dir=data_dir)
        except PortfolioRevisionConflict as exc:
            raise HTTPException(status_code=409, detail={"code": "portfolio_revision_conflict", "latest": exc.latest}) from exc

    @router.get("/summary")
    def summary():
        return portfolio_summary()

    @router.get("/resolve")
    def resolve(ticker: str = "", market: str = ""):
        return resolve_portfolio_ticker(ticker, market)

    @router.get("/suggest")
    def suggest(q: str = "", limit: int = Query(default=8, ge=1, le=30)):
        return search_portfolio_tickers(q, limit)

    @router.get("/analytics")
    def analytics(presetId: str = ""):  # noqa: N803 - 쿼리 파라미터는 화면과 같은 표기를 쓴다
        return portfolio_analytics(presetId)

    @router.get("/presets")
    def presets():
        return list_portfolio_presets()

    @router.post("/presets")
    def save_preset(body: dict | None = Body(default=None)):
        return save_portfolio_preset(body or {})

    @router.post("/presets/from-current")
    def preset_from_current(body: dict | None = Body(default=None)):
        return preset_from_current_portfolio((body or {}).get("name") or "현재 포트폴리오 목표 비중")

    @router.delete("/presets/{preset_id}")
    def delete_preset(preset_id: str):
        result = delete_portfolio_preset(preset_id)
        if not result.get("deleted"):
            raise HTTPException(status_code=404, detail="Portfolio preset not found")
        return result

    @router.get("/backtests")
    def backtests():
        return list_portfolio_backtests()

    @router.post("/backtests")
    def run_backtest(body: dict | None = Body(default=None)):
        return run_portfolio_backtest(body or {}, save_result=False)

    @router.post("/backtests/compare")
    def compare_backtests(body: dict | None = Body(default=None)):
        return run_portfolio_backtest_comparison(body or {})

    @router.post("/backtests/save")
    def save_backtest(body: dict | None = Body(default=None)):
        return save_portfolio_backtest_result(body or {})

    @router.get("/backtests/{backtest_id}")
    def read_backtest(backtest_id: str):
        result = get_portfolio_backtest(backtest_id)
        if not result:
            raise HTTPException(status_code=404, detail="Portfolio backtest not found")
        return result

    @router.delete("/backtests/{backtest_id}")
    def delete_backtest(backtest_id: str):
        result = delete_portfolio_backtest(backtest_id)
        if not result.get("deleted"):
            raise HTTPException(status_code=404, detail="Portfolio backtest not found")
        return result

    return router
