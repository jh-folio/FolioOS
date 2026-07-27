from __future__ import annotations

import pytest
from pydantic import ValidationError

from features.investment_review.context_schema import (
    InvestmentContext,
    InvestmentStance,
)


def valid_payload() -> dict:
    return {
        "ticker": "NVDA",
        "stance": "watch",
        "observedAt": "2026-07-27T01:02:03Z",
        "reasonCodes": ["position_concentrated"],
        "evidence": [
            {
                "evidenceId": "doc_123",
                "source": "SEC",
                "title": "10-Q",
            }
        ],
        "hypothesis": {
            "noteIds": ["note-20260727-abcd1234"],
            "thesisTicker": "NVDA",
        },
        "portfolio": {
            "held": True,
            "weightPct": 12.5,
            "quantity": 4.0,
        },
        "watchlist": {
            "watched": True,
            "listIds": ["primary"],
        },
    }


def test_controlled_investment_stance_values_are_exposed() -> None:
    assert {item.value for item in InvestmentStance} == {
        "positive",
        "watch",
        "negative",
        "neutral",
        "unknown",
    }


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("stance", "buy"),
        ("ticker", "NVDA!"),
        ("observedAt", "2026-07-27"),
    ],
)
def test_investment_context_rejects_unknown_or_malformed_input(field: str, value: str) -> None:
    payload = valid_payload()
    payload[field] = value
    with pytest.raises(ValidationError):
        InvestmentContext.model_validate(payload)


def test_investment_context_keeps_evidence_hypothesis_and_portfolio_separate() -> None:
    parsed = InvestmentContext.model_validate(valid_payload())
    assert parsed.evidence[0].evidenceId == "doc_123"
    assert parsed.hypothesis.noteIds == ("note-20260727-abcd1234",)
    assert parsed.portfolio.held is True
    assert not hasattr(parsed.portfolio, "evidenceId")
    assert not hasattr(parsed.hypothesis, "weightPct")


def test_investment_context_bounds_personal_and_source_lists() -> None:
    payload = valid_payload()
    payload["hypothesis"]["noteIds"] = [f"note-{index}" for index in range(51)]
    with pytest.raises(ValidationError):
        InvestmentContext.model_validate(payload)

    payload = valid_payload()
    payload["evidence"] = [
        {"evidenceId": f"doc_{index}", "source": "SEC", "title": "10-Q"}
        for index in range(51)
    ]
    with pytest.raises(ValidationError):
        InvestmentContext.model_validate(payload)


def test_legacy_investment_context_gets_unknown_without_invented_timestamp() -> None:
    with pytest.raises(ValidationError):
        InvestmentContext.model_validate({"ticker": "NVDA"})

    normalized = InvestmentContext.from_legacy({"ticker": "NVDA"})
    assert normalized.stance is InvestmentStance.UNKNOWN
    assert normalized.observedAt is None
    assert normalized.evidence == ()
    assert normalized.hypothesis.noteIds == ()
    assert normalized.portfolio.held is False
    assert normalized.watchlist.watched is False
