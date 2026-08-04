from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Body

from .service import build_cockpit_payload, get_dashboard_settings, save_dashboard_settings
from .story_share import story_share_payload


def create_dashboard_router(data_dir: Path) -> APIRouter:
    router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

    @router.get("/cockpit")
    def cockpit():
        return build_cockpit_payload(data_dir)

    @router.get("/story-share")
    def story_share(market: str = "us", date: str | None = None):
        return story_share_payload(date, market)

    @router.get("/settings")
    def settings():
        return get_dashboard_settings(data_dir)

    @router.post("/settings")
    def update_settings(body: dict | None = Body(default=None)):
        return save_dashboard_settings(data_dir, body or {})

    return router
