from __future__ import annotations

import pytest
from pydantic import ValidationError

from features.smart_collections.health import CollectionHealth, CollectionHealthProjection


def valid_payload() -> dict:
    return {
        "collectionId": "sc_12345678-1234-4234-9234-123456789abc",
        "revision": 2,
        "health": "stale",
        "observedAt": "2026-07-27T01:02:03Z",
        "itemCount": 12,
        "addedIds": ["doc_1"],
        "removedIds": ["doc_2"],
        "unchangedIds": ["doc_3"],
        "reasonCodes": ["source_watermark_changed"],
    }


def test_controlled_collection_health_values_are_exposed() -> None:
    assert {item.value for item in CollectionHealth} == {
        "active",
        "stale",
        "empty",
        "noisy",
    }


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("health", "healthy"),
        ("collectionId", "collection-1"),
        ("observedAt", "yesterday"),
    ],
)
def test_collection_health_rejects_unknown_or_malformed_input(field: str, value: str) -> None:
    payload = valid_payload()
    payload[field] = value
    with pytest.raises(ValidationError):
        CollectionHealthProjection.model_validate(payload)


def test_collection_health_bounds_ids_and_reasons() -> None:
    payload = valid_payload()
    payload["addedIds"] = [f"doc_{index}" for index in range(121)]
    with pytest.raises(ValidationError):
        CollectionHealthProjection.model_validate(payload)

    payload = valid_payload()
    payload["reasonCodes"] = ["x" * 81]
    with pytest.raises(ValidationError):
        CollectionHealthProjection.model_validate(payload)


def test_legacy_collection_health_derives_safe_default_without_timestamp() -> None:
    with pytest.raises(ValidationError):
        CollectionHealthProjection.model_validate(
            {
                "collectionId": valid_payload()["collectionId"],
                "revision": 1,
            }
        )

    empty = CollectionHealthProjection.from_legacy(
        {
            "collectionId": valid_payload()["collectionId"],
            "revision": 1,
            "itemCount": 0,
        }
    )
    assert empty.health is CollectionHealth.EMPTY
    assert empty.observedAt is None
    assert empty.addedIds == ()
