from __future__ import annotations

import json

from features.investment_review.context_links import build_ticker_research_contexts


def test_default_ticker_context_never_leaks_private_portfolio_or_note_fields() -> None:
    contexts = build_ticker_research_contexts(
        positions=[
            {
                "ticker": "005930.KS",
                "quantity": 12,
                "price": 89100,
                "avgPrice": 70000,
                "costBasis": 840000,
                "weightPct": 32.5,
                "portfolioTotal": 3_000_000,
            }
        ],
        watchlist=[
            {
                "ticker": "005930",
                "noteBody": "절대 외부 컨텍스트로 보내지 않을 비공개 메모",
                "memo": "private memo",
            }
        ],
        regime_states=[],
        thesis_deltas=[],
        due_checkpoints=[],
        reports=[],
        collections=[],
        collection_results=[],
        collection_health={},
        observed_at="2026-07-27T03:00:00Z",
    )

    payload = [context.model_dump(mode="json") for context in contexts]
    encoded = json.dumps(payload, ensure_ascii=False)
    assert payload[0]["ticker"] == "005930"
    assert payload[0]["source"] == "both"
    for forbidden in (
        "quantity",
        "price",
        "avgPrice",
        "costBasis",
        "weightPct",
        "portfolioTotal",
        "noteBody",
        "memo",
        "비공개 메모",
    ):
        assert forbidden not in encoded

