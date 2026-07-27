from __future__ import annotations

from copy import deepcopy

import pytest
from pydantic import ValidationError

from features.topic_report.approved_schema import PlanRequest


def test_plan_request_normalizes_scope_and_tickers_without_losing_hypothesis_text() -> None:
    # Given: equivalent ticker spellings and private hypothesis text.
    raw = {
        "question": "  미국 AI 투자 사이클  ",
        "userContext": "  내 가설은 공급이 부족하다는 것이다.  ",
        "deepResearch": True,
        "customTickers": {" nvda ": " NVIDIA "},
        "marketStatePolicy": "include_current",
        "marketStateScope": "AUTO",
        "collectionRef": None,
    }

    # When: the request crosses the typed boundary.
    request = PlanRequest.model_validate(raw)

    # Then: identifiers are canonical and user context remains hypothesis text.
    assert request.question == "미국 AI 투자 사이클"
    assert request.userContext == "내 가설은 공급이 부족하다는 것이다."
    assert request.customTickers == {"NVDA": "NVIDIA"}


@pytest.mark.parametrize(
    "mutation",
    [
        {"unknown": True},
        {"question": "x" * 501},
        {"customTickers": {f"T{i}": str(i) for i in range(15)}},
        {"collectionRef": {"id": "sc_not-a-uuid", "revision": 1}},
        {"collectionRef": {"id": "sc_123", "revision": 1, "extra": True}},
    ],
)
def test_plan_request_rejects_unknown_or_out_of_contract_input(mutation: dict[str, object]) -> None:
    # Given: a valid minimal request with one adversarial mutation.
    raw: dict[str, object] = {"question": "AI 전력 수요"}
    raw.update(deepcopy(mutation))

    # When/Then: parsing fails at the boundary.
    with pytest.raises(ValidationError):
        PlanRequest.model_validate(raw)


def test_plan_request_rejects_ticker_collision_after_normalization() -> None:
    # Given: two wire keys that normalize to one ticker.
    raw = {"question": "GPU", "customTickers": {"nvda": "NVIDIA", " NVDA ": "다른 이름"}}

    # When/Then: the collision is rejected instead of silently overwritten.
    with pytest.raises(ValidationError):
        PlanRequest.model_validate(raw)
