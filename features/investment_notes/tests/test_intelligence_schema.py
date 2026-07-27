from __future__ import annotations

import pytest
from pydantic import ValidationError

from features.investment_notes.intelligence_schema import (
    CheckpointState,
    Freshness,
    HypothesisCheckpoint,
    HypothesisIntelligence,
)


def valid_payload() -> dict:
    return {
        "noteId": "note-20260727-abcd1234",
        "ticker": "NVDA",
        "freshness": "due",
        "observedAt": "2026-07-27T01:02:03Z",
        "reasonCodes": ["review_due"],
        "checkpoints": [
            {
                "id": "cp_next_earnings",
                "label": "다음 실적 확인",
                "state": "open",
                "dueAt": "2026-08-20T00:00:00Z",
                "reasonCode": "scheduled_review",
                "evidenceRefs": [
                    {
                        "evidenceId": "doc_123",
                        "source": "SEC",
                        "title": "10-Q",
                    }
                ],
            }
        ],
    }


def test_controlled_note_intelligence_values_are_exposed() -> None:
    assert {item.value for item in Freshness} == {"fresh", "due", "stale", "unknown"}
    assert {item.value for item in CheckpointState} == {
        "open",
        "due",
        "checked",
        "invalidated",
    }


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("freshness", "recent"),
        ("noteId", "../private-note"),
        ("ticker", "NVDA!"),
        ("observedAt", "2026-07-27"),
    ],
)
def test_note_intelligence_rejects_unknown_or_malformed_input(field: str, value: str) -> None:
    payload = valid_payload()
    payload[field] = value
    with pytest.raises(ValidationError):
        HypothesisIntelligence.model_validate(payload)


def test_note_intelligence_bounds_lists_and_checkpoint_text() -> None:
    payload = valid_payload()
    payload["reasonCodes"] = [f"reason_{index}" for index in range(13)]
    with pytest.raises(ValidationError):
        HypothesisIntelligence.model_validate(payload)

    checkpoint = valid_payload()["checkpoints"][0]
    checkpoint["label"] = "x" * 241
    with pytest.raises(ValidationError):
        HypothesisCheckpoint.model_validate(checkpoint)


def test_legacy_note_intelligence_gets_safe_defaults_only_via_adapter() -> None:
    with pytest.raises(ValidationError):
        HypothesisIntelligence.model_validate({"noteId": "legacy-note"})

    normalized = HypothesisIntelligence.from_legacy({"noteId": "legacy-note"})
    assert normalized.freshness is Freshness.UNKNOWN
    assert normalized.observedAt is None
    assert normalized.checkpoints == ()
    assert normalized.layer == "hypothesis"
    assert normalized.reuseAsEvidence is False

