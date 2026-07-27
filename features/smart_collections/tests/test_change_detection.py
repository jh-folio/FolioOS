from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest

from features.smart_collections.change_detection import (
    NOISY_MIN_CHURN,
    NOISY_MIN_UNUSABLE,
    STALE_AFTER,
    calculate_change,
)
from features.smart_collections.health import CollectionHealth
from features.smart_collections.schema import (
    CollectionResolutionSnapshot,
    SnapshotProviderGenerations,
)


COLLECTION_ID = "sc_12345678-1234-4234-9234-123456789abc"
NOW = datetime(2026, 7, 27, 12, tzinfo=UTC)


def snapshot(
    *,
    evidence_ids: list[str],
    resolved_at: str = "2026-07-27T11:00:00.000000Z",
    eligible_count: int | None = None,
    unusable_count: int = 0,
    truncated: bool = False,
    definition_hash: str = "definition-a",
    index_generation: str | None = "index-2",
    rss_generation: str | None = "rss-2",
    watermark: str | None = "watermark-2",
) -> CollectionResolutionSnapshot:
    return CollectionResolutionSnapshot(
        collectionId=COLLECTION_ID,
        revision=2,
        definitionHash=definition_hash,
        resolvedAt=resolved_at,
        providerGenerations=SnapshotProviderGenerations(
            index=index_generation,
            rss=rss_generation,
        ),
        inputWatermark=watermark,
        evidenceIds=evidence_ids,
        eligibleCount=len(evidence_ids) if eligible_count is None else eligible_count,
        resolvedCount=len(evidence_ids),
        executionCount=max(0, len(evidence_ids) - unusable_count),
        unusableCount=unusable_count,
        truncated=truncated,
    )


def test_stable_identity_change_is_bounded_and_deterministic() -> None:
    previous = snapshot(evidence_ids=["ev_a", "ev_b", "ev_c"])
    current = snapshot(evidence_ids=["ev_b", "ev_c", "ev_d"])

    first = calculate_change(current, previous, now=NOW)
    second = calculate_change(current, previous, now=NOW)

    assert first == second
    assert first.addedIds == ("ev_d",)
    assert first.removedIds == ("ev_a",)
    assert first.unchangedIds == ("ev_b", "ev_c")
    assert first.addedCount == first.removedCount == 1
    assert first.unchangedCount == 2
    assert first.health is CollectionHealth.ACTIVE
    assert first.reasonCodes == ("healthy",)


def test_no_baseline_is_never_stale_and_empty_has_precedence() -> None:
    active = calculate_change(
        snapshot(evidence_ids=["ev_a"], resolved_at="broken"),
        None,
        now=NOW,
    )
    assert active.health is CollectionHealth.ACTIVE
    assert active.reasonCodes == ("baseline_missing",)

    empty = calculate_change(
        snapshot(evidence_ids=[], eligible_count=0, resolved_at="broken"),
        None,
        now=NOW,
    )
    assert empty.health is CollectionHealth.EMPTY
    assert empty.reasonCodes == ("empty_index", "baseline_missing")


def test_large_result_alone_is_not_noisy() -> None:
    ids = [f"ev_{index:03d}" for index in range(120)]
    result = calculate_change(
        snapshot(evidence_ids=ids, eligible_count=10_000, truncated=True),
        snapshot(evidence_ids=ids, eligible_count=10_000, truncated=True),
        now=NOW,
    )
    assert result.health is CollectionHealth.ACTIVE
    assert "result_truncated" in result.reasonCodes


def test_explicit_unusable_and_churn_thresholds_trigger_noisy() -> None:
    unusable_ids = [f"ev_{index:03d}" for index in range(NOISY_MIN_UNUSABLE * 2)]
    unusable = calculate_change(
        snapshot(
            evidence_ids=unusable_ids,
            unusable_count=NOISY_MIN_UNUSABLE,
        ),
        snapshot(evidence_ids=unusable_ids),
        now=NOW,
    )
    assert unusable.health is CollectionHealth.NOISY
    assert "high_unusable_ratio" in unusable.reasonCodes

    prior = [f"old_{index:03d}" for index in range(NOISY_MIN_CHURN)]
    current = [f"new_{index:03d}" for index in range(NOISY_MIN_CHURN)]
    churn = calculate_change(
        snapshot(evidence_ids=current),
        snapshot(evidence_ids=prior),
        now=NOW,
    )
    assert churn.health is CollectionHealth.NOISY
    assert "high_churn_ratio" in churn.reasonCodes


@pytest.mark.parametrize(
    ("current", "reason"),
    [
        (
            snapshot(
                evidence_ids=["ev_a"],
                resolved_at=(NOW - STALE_AFTER - timedelta(seconds=1))
                .isoformat()
                .replace("+00:00", "Z"),
            ),
            "snapshot_expired",
        ),
        (snapshot(evidence_ids=["ev_a"], resolved_at="malformed"), "invalid_resolved_at"),
        (
            snapshot(
                evidence_ids=["ev_a"],
                resolved_at=(NOW + timedelta(minutes=6)).isoformat().replace("+00:00", "Z"),
            ),
            "clock_skew",
        ),
        (
            snapshot(
                evidence_ids=["ev_a"],
                index_generation=None,
                rss_generation=None,
                watermark=None,
            ),
            "provider_generation_reset",
        ),
    ],
)
def test_stale_and_provider_reset_have_safe_reason_codes(
    current: CollectionResolutionSnapshot,
    reason: str,
) -> None:
    previous = snapshot(evidence_ids=["ev_a"])
    result = calculate_change(current, previous, now=NOW)
    assert result.health is CollectionHealth.STALE
    assert reason in result.reasonCodes


def test_definition_change_discards_incomparable_baseline() -> None:
    current = snapshot(evidence_ids=["new"], definition_hash="definition-b")
    previous = snapshot(evidence_ids=["old"], definition_hash="definition-a")
    result = calculate_change(current, previous, now=NOW)
    assert result.health is CollectionHealth.ACTIVE
    assert result.addedIds == ()
    assert result.removedIds == ()
    assert result.reasonCodes == ("baseline_missing", "definition_changed")
