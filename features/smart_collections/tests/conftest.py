from __future__ import annotations

from collections.abc import Callable
from datetime import UTC, datetime
from pathlib import Path
from uuid import UUID

import pytest

from features.smart_collections.service import SmartCollectionRuntime, SmartCollectionService


@pytest.fixture
def fixed_clock() -> Callable[[], datetime]:
    return lambda: datetime(2026, 7, 16, tzinfo=UTC)


@pytest.fixture
def service(tmp_path: Path, fixed_clock: Callable[[], datetime]) -> SmartCollectionService:
    return SmartCollectionService(
        SmartCollectionRuntime(
            dataDir=tmp_path,
            clock=fixed_clock,
            uuidFactory=lambda: UUID("12345678-1234-4234-9234-123456789abc"),
        )
    )


@pytest.fixture
def definition() -> dict[str, str | list[str]]:
    return {
        "name": "AI Leaders",
        "query": "AI earnings",
        "market": "US",
        "sources": ["Reuters"],
        "tickers": ["nvda"],
        "tags": ["AI"],
    }
