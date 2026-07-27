"""Deterministic change and health calculation over bounded resolution snapshots."""
from __future__ import annotations

from datetime import UTC, datetime, timedelta

from features.smart_collections.health import (
    CollectionChangeProjection,
    CollectionHealth,
)
from features.smart_collections.schema import CollectionResolutionSnapshot


CHANGE_ID_LIMIT = 120
NOISY_MIN_CHURN = 20
NOISY_CHURN_RATIO = 0.80
NOISY_MIN_UNUSABLE = 10
NOISY_UNUSABLE_RATIO = 0.50
STALE_AFTER = timedelta(hours=24)
CLOCK_SKEW_TOLERANCE = timedelta(minutes=5)


def _utc_z(value: datetime) -> str:
    normalized = value if value.tzinfo is not None else value.replace(tzinfo=UTC)
    return normalized.astimezone(UTC).isoformat(timespec="microseconds").replace("+00:00", "Z")


def _parse_utc(value: str) -> datetime | None:
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except (TypeError, ValueError):
        return None
    if parsed.tzinfo is None:
        return None
    return parsed.astimezone(UTC)


def _comparable(
    current: CollectionResolutionSnapshot,
    previous: CollectionResolutionSnapshot | None,
) -> bool:
    return (
        previous is not None
        and previous.collectionId == current.collectionId
        and previous.definitionHash == current.definitionHash
    )


def calculate_change(
    current: CollectionResolutionSnapshot,
    previous: CollectionResolutionSnapshot | None,
    *,
    now: datetime,
) -> CollectionChangeProjection:
    observed_now = now if now.tzinfo is not None else now.replace(tzinfo=UTC)
    observed_now = observed_now.astimezone(UTC)
    comparable = _comparable(current, previous)

    if comparable and previous is not None:
        current_ids = set(current.evidenceIds)
        previous_ids = set(previous.evidenceIds)
        added_all = sorted(current_ids - previous_ids)
        removed_all = sorted(previous_ids - current_ids)
        unchanged_all = sorted(current_ids & previous_ids)
    else:
        added_all = []
        removed_all = []
        unchanged_all = []

    baseline_reasons: list[str] = []
    if not comparable:
        baseline_reasons.append("baseline_missing")
        if previous is not None and previous.definitionHash != current.definitionHash:
            baseline_reasons.append("definition_changed")

    if current.eligibleCount == 0:
        health = CollectionHealth.EMPTY
        reasons = ["empty_index", *baseline_reasons]
    elif not comparable:
        health = CollectionHealth.ACTIVE
        reasons = baseline_reasons
    else:
        reasons = []
        resolved_denominator = max(current.resolvedCount, 1)
        unusable_ratio = current.unusableCount / resolved_denominator
        changed_count = len(added_all) + len(removed_all)
        identity_union = len(set(current.evidenceIds) | set(previous.evidenceIds))
        churn_ratio = changed_count / max(identity_union, 1)

        if (
            current.unusableCount >= NOISY_MIN_UNUSABLE
            and unusable_ratio >= NOISY_UNUSABLE_RATIO
        ):
            reasons.append("high_unusable_ratio")
        if changed_count >= NOISY_MIN_CHURN and churn_ratio >= NOISY_CHURN_RATIO:
            reasons.append("high_churn_ratio")

        if reasons:
            health = CollectionHealth.NOISY
        else:
            resolved_at = _parse_utc(current.resolvedAt)
            if resolved_at is None:
                reasons.append("invalid_resolved_at")
            elif resolved_at > observed_now + CLOCK_SKEW_TOLERANCE:
                reasons.append("clock_skew")
            elif observed_now - resolved_at > STALE_AFTER:
                reasons.append("snapshot_expired")

            previous_generations = previous.providerGenerations
            current_generations = current.providerGenerations
            generation_reset = (
                previous_generations.index is not None and current_generations.index is None
            ) or (
                previous_generations.rss is not None and current_generations.rss is None
            )
            if generation_reset:
                reasons.append("provider_generation_reset")
            if previous.inputWatermark is not None and current.inputWatermark is None:
                reasons.append("provider_watermark_reset")

            health = CollectionHealth.STALE if reasons else CollectionHealth.ACTIVE

    if current.truncated:
        reasons.append("result_truncated")
    if not reasons:
        reasons.append("healthy")

    return CollectionChangeProjection(
        collectionId=current.collectionId,
        revision=current.revision,
        observedAt=_utc_z(observed_now),
        health=health,
        addedIds=tuple(added_all[:CHANGE_ID_LIMIT]),
        removedIds=tuple(removed_all[:CHANGE_ID_LIMIT]),
        unchangedIds=tuple(unchanged_all[:CHANGE_ID_LIMIT]),
        addedCount=len(added_all),
        removedCount=len(removed_all),
        unchangedCount=len(unchanged_all),
        eligibleCount=current.eligibleCount,
        resolvedCount=current.resolvedCount,
        unusableCount=current.unusableCount,
        truncated=current.truncated,
        reasonCodes=tuple(reasons),
    )


__all__ = [
    "CHANGE_ID_LIMIT",
    "CLOCK_SKEW_TOLERANCE",
    "NOISY_CHURN_RATIO",
    "NOISY_MIN_CHURN",
    "NOISY_MIN_UNUSABLE",
    "NOISY_UNUSABLE_RATIO",
    "STALE_AFTER",
    "calculate_change",
]
