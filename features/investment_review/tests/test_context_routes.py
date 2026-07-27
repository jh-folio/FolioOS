from __future__ import annotations

import json
import re
from datetime import UTC, datetime
from pathlib import Path

from fastapi import FastAPI
from starlette.responses import Response

from features.investment_review.context_routes import InvestmentContextBoundary
from features.investment_review.service import (
    InvestmentContextRuntime,
    InvestmentContextService,
)
from features.market_memory.tests.live_http import LiveHttpClient


NOW = datetime(2026, 7, 27, 12, 0, tzinfo=UTC)


def payload(response: Response) -> dict:
    parsed = json.loads(response.body)
    assert isinstance(parsed, dict)
    return parsed


def fixture_inputs(count: int = 12) -> dict:
    tickers = [f"T{i:02d}" for i in range(count)]
    return {
        "positions": [
            {"ticker": ticker, "quantity": index + 1, "avgPrice": 100 + index}
            for index, ticker in enumerate(tickers)
        ],
        "watchlist": [{"ticker": "T00", "noteBody": "private"}] if tickers else [],
        "regime_states": [
            {
                "id": f"reg_{ticker}",
                "stateLabel": f"{ticker} driver",
                "momentum": "fading",
                "linkedCompanies": [ticker],
            }
            for ticker in tickers
        ],
        "thesis_deltas": [],
        "due_checkpoints": [],
        "reports": [],
        "collections": [],
        "collection_results": [],
        "collection_health": {},
    }


def service(tmp_path: Path, *, count: int = 12):
    calls = {"inputs": 0}
    watermark = {"value": "fixture-v1"}

    def load_inputs() -> dict:
        calls["inputs"] += 1
        return fixture_inputs(count)

    runtime = InvestmentContextRuntime(
        dataDir=tmp_path,
        clock=lambda: NOW,
        inputLoader=load_inputs,
        watermarkLoader=lambda: {"fixture": watermark["value"]},
    )
    return InvestmentContextService(runtime), calls, watermark


def test_summary_is_bounded_and_cache_is_keyed_by_source_watermarks(tmp_path: Path) -> None:
    context_service, calls, watermark = service(tmp_path)
    api = InvestmentContextBoundary(context_service)

    first = payload(api.summary())
    second = payload(api.summary())
    detail = payload(api.detail("T00"))

    assert first == second
    assert first["counts"] == {
        "total": 12,
        "portfolio": 11,
        "watchlist": 0,
        "both": 1,
        "positive": 0,
        "watch": 12,
        "negative": 0,
        "neutral": 0,
        "unknown": 0,
    }
    assert len(first["watchContexts"]) == 10
    assert [row["ticker"] for row in first["watchContexts"]] == [f"T{i:02d}" for i in range(10)]
    assert detail["ticker"] == "T00"
    assert calls["inputs"] == 1

    watermark["value"] = "fixture-v2"
    api.summary()
    assert calls["inputs"] == 2


def test_detail_returns_only_exact_public_projection_and_safe_4xx(tmp_path: Path) -> None:
    context_service, _calls, _watermark = service(tmp_path, count=2)
    api = InvestmentContextBoundary(context_service)

    response = api.detail("t00")
    body = payload(response)
    encoded = json.dumps(body, ensure_ascii=False)

    assert response.status_code == 200
    assert body["ticker"] == "T00"
    assert "T01" not in encoded
    for forbidden in ("quantity", "avgPrice", "noteBody", "buy", "sell", "매수", "매도"):
        assert forbidden not in encoded

    assert api.detail("../private").status_code == 422
    assert payload(api.detail("../private")) == {
        "error": "validation_error",
        "fields": ["ticker"],
    }
    missing = api.detail("AAPL")
    assert missing.status_code == 404
    assert payload(missing) == {"error": "investment_context_not_found"}


def test_empty_and_missing_sources_remain_useful_and_read_only(tmp_path: Path) -> None:
    portfolio = tmp_path / "portfolio.json"
    watchlist = tmp_path / "watchlist.json"
    portfolio.write_text(
        '{"positions":[{"ticker":"005930.KS","quantity":3,"averagePrice":70000}],"cash":[]}',
        encoding="utf-8",
    )
    watchlist.write_text(
        '[{"ticker":"005930","noteBody":"private hypothesis"}]',
        encoding="utf-8",
    )
    before = {
        path: (path.read_bytes(), path.stat().st_mtime_ns)
        for path in (portfolio, watchlist)
    }
    context_service = InvestmentContextService(
        InvestmentContextRuntime(dataDir=tmp_path, clock=lambda: NOW)
    )
    api = InvestmentContextBoundary(context_service)

    app = FastAPI()
    app.include_router(api.router())
    with LiveHttpClient(app) as client:
        summary_response = client.get("/api/investment-context/summary")
        detail_response = client.get("/api/investment-context/005930.KQ")
    summary = summary_response.json()
    detail = detail_response.json()

    assert (summary_response.status_code, detail_response.status_code) == (200, 200)
    assert summary["counts"]["total"] == 1
    assert summary["counts"]["unknown"] == 1
    assert detail["ticker"] == "005930"
    assert detail["source"] == "both"
    assert detail["stance"] == "unknown"
    assert set(detail["reasonCodes"]) >= {
        "market_memory_unavailable",
        "thesis_unavailable",
        "checkpoints_unavailable",
    }
    assert not (tmp_path / "investment-context-cache.json").exists()
    assert {
        path: (path.read_bytes(), path.stat().st_mtime_ns)
        for path in (portfolio, watchlist)
    } == before

    empty_service, _calls, _watermark = service(tmp_path / "empty", count=0)
    empty = payload(InvestmentContextBoundary(empty_service).summary())
    assert empty["counts"]["total"] == 0
    assert empty["watchContexts"] == []


def test_router_is_get_only_and_live_http_preserves_detail_isolation(tmp_path: Path) -> None:
    context_service, _calls, _watermark = service(tmp_path, count=2)
    api = InvestmentContextBoundary(context_service)
    routes = {
        (route.path, tuple(sorted(route.methods or ())))
        for route in api.router().routes
    }
    assert routes == {
        ("/api/investment-context/summary", ("GET",)),
        ("/api/investment-context/{ticker}", ("GET",)),
    }

    app = FastAPI()
    app.include_router(api.router())
    with LiveHttpClient(app) as client:
        summary = client.get("/api/investment-context/summary")
        detail = client.get("/api/investment-context/T00")
        missing = client.get("/api/investment-context/AAPL")

    assert summary.status_code == 200
    assert detail.status_code == 200
    assert detail.json()["ticker"] == "T00"
    assert "T01" not in json.dumps(detail.json())
    assert missing.status_code == 404


def test_app_includes_context_router_without_migrating_legacy_wrappers() -> None:
    source = Path(__file__).resolve().parents[3].joinpath("app.py").read_text(encoding="utf-8")
    assert "create_investment_context_router" in source
    assert re.search(
        r"fastapi_app\.include_router\(\s*create_investment_context_router\(\s*DATA_DIR,\s*"
        r"collection_service=SMART_COLLECTION_SERVICE",
        source,
    )
    assert '@fastapi_app.get("/api/investment-review")' in source
    assert '@fastapi_app.post("/api/investment-review/generate")' in source
