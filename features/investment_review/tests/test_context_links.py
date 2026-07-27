from __future__ import annotations

from copy import deepcopy

from features.investment_review.context_links import (
    build_ticker_research_contexts,
    normalize_research_ticker,
)
from features.smart_collections.service import project_ticker_collection_links


def _inputs() -> dict:
    return {
        "positions": [
            {"ticker": "pwr", "name": "Quanta", "quantity": 4, "avgPrice": 120},
            {"ticker": "005930.KS", "name": "Samsung", "quantity": 7},
            {"ticker": "nvda", "quantity": 2},
        ],
        "watchlist": [
            {"ticker": "NVDA", "note": "private watch note"},
            {"ticker": "005930", "memo": "private memo"},
        ],
        "regime_states": [
            {
                "id": "reg_power",
                "stateLabel": "AI 전력 수요",
                "momentum": "strengthening",
                "linkedCompanies": ["PWR", "NVDA"],
            },
            {
                "id": "reg_memory",
                "stateLabel": "메모리 사이클",
                "momentum": "turning",
                "linkedCompanies": ["005930.KQ"],
            },
        ],
        "thesis_deltas": [
            {"ticker": "NVDA", "verdict": "maintained", "generatedAt": "2026-07-20T00:00:00Z"},
            {"ticker": "nvda", "verdict": "strengthened", "generatedAt": "2026-07-27T00:00:00Z"},
        ],
        "due_checkpoints": [
            {
                "id": "chk_nvda",
                "ticker": "NVDA",
                "checkpoint": "다음 가이던스 확인",
                "dueAt": "2026-07-28T00:00:00Z",
            },
            {
                "id": "chk_pwr",
                "ticker": "PWR",
                "label": "수주잔고 확인",
                "dueAt": "2026-07-29T00:00:00Z",
            },
        ],
        "reports": [
            {
                "id": "NVDA:2026-07-27",
                "title": "NVIDIA 기업 분석",
                "type": "analysis",
                "generatedAt": "2026-07-27T02:00:00Z",
                "company": {"ticker": "NVDA"},
            },
            {
                "id": "power-grid",
                "title": "AI 전력망",
                "type": "topic",
                "generatedAt": "2026-07-26T02:00:00Z",
                "tickers": ["PWR", "NVDA"],
            },
        ],
        "collections": [
            {
                "id": "sc_power",
                "name": "전력 인프라",
                "revision": 3,
                "tickers": ["PWR"],
            }
        ],
        "collection_results": [
            {
                "collectionId": "sc_power",
                "evidenceId": "index:doc-1",
                "tickers": ["NVDA"],
            }
        ],
        "collection_health": {"sc_power": "active"},
        "observed_at": "2026-07-27T03:00:00Z",
    }


def test_normalizes_tickers_and_builds_deterministic_bounded_links() -> None:
    inputs = _inputs()
    first = build_ticker_research_contexts(**inputs)
    second = build_ticker_research_contexts(
        **{
            **inputs,
            "positions": list(reversed(inputs["positions"])),
            "watchlist": list(reversed(inputs["watchlist"])),
            "reports": list(reversed(inputs["reports"])),
        }
    )

    assert first == second
    assert [row.ticker for row in first] == ["005930", "NVDA", "PWR"]
    assert normalize_research_ticker(" 005930.KS ") == "005930"
    assert normalize_research_ticker("$brk.b") == "BRK-B"

    by_ticker = {row.ticker: row for row in first}
    nvda = by_ticker["NVDA"]
    assert nvda.source.value == "both"
    assert nvda.stance.value == "positive"
    assert nvda.latestThesisVerdict == "strengthened"
    assert [driver.label for driver in nvda.marketDrivers] == ["AI 전력 수요"]
    assert [checkpoint.label for checkpoint in nvda.dueCheckpoints] == ["다음 가이던스 확인"]
    assert [report.id for report in nvda.linkedReports] == ["NVDA:2026-07-27", "power-grid"]
    assert [collection.id for collection in nvda.collections] == ["sc_power"]
    assert nvda.collections[0].name == "전력 인프라"
    assert nvda.collections[0].revision == 3
    assert nvda.collections[0].health == "active"
    assert nvda.collections[0].matchSources == ("external_result",)

    samsung = by_ticker["005930"]
    assert samsung.source.value == "both"
    assert samsung.stance.value == "watch"
    assert samsung.latestThesisVerdict == "unknown"


def test_missing_sources_are_unavailable_not_inferred() -> None:
    contexts = build_ticker_research_contexts(
        positions=[{"ticker": "AAPL"}],
        watchlist=[],
        regime_states=None,
        thesis_deltas=None,
        due_checkpoints=None,
        reports=None,
        collections=None,
        collection_results=None,
        collection_health=None,
        observed_at="2026-07-27T03:00:00Z",
    )

    assert len(contexts) == 1
    context = contexts[0]
    assert context.ticker == "AAPL"
    assert context.stance.value == "unknown"
    assert context.latestThesisVerdict == "unknown"
    assert context.marketDrivers == ()
    assert context.linkedReports == ()
    assert context.collections == ()
    assert set(context.reasonCodes) == {
        "market_memory_unavailable",
        "thesis_unavailable",
        "checkpoints_unavailable",
        "reports_unavailable",
        "collections_unavailable",
    }


def test_collection_projection_matches_saved_filters_and_external_results_without_mutation() -> None:
    inputs = _inputs()
    collections = deepcopy(inputs["collections"])
    results = deepcopy(inputs["collection_results"])
    original_collections = deepcopy(collections)
    original_results = deepcopy(results)

    links = project_ticker_collection_links(
        collections,
        external_results=results,
        health_by_collection=inputs["collection_health"],
    )

    assert [link["id"] for link in links["PWR"]] == ["sc_power"]
    assert links["PWR"][0]["matchSources"] == ["saved_filter"]
    assert links["NVDA"][0]["matchSources"] == ["external_result"]
    assert collections == original_collections
    assert results == original_results


def test_market_driver_without_safe_id_gets_a_stable_public_identity() -> None:
    contexts = build_ticker_research_contexts(
        positions=[{"ticker": "PWR"}],
        watchlist=[],
        regime_states=[{
            "stateLabel": "AI 전력 수요",
            "momentum": "strengthening",
            "linkedCompanies": ["PWR"],
        }],
        thesis_deltas=[],
        due_checkpoints=[],
        reports=[],
        collections=[],
        collection_results=[],
        collection_health={},
        observed_at="2026-07-27T03:00:00Z",
    )
    assert contexts[0].marketDrivers[0].stateId.startswith("reg_")
    assert contexts[0].marketDrivers[0].label == "AI 전력 수요"
