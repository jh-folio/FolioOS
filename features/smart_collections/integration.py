from __future__ import annotations

from features.smart_collections.schema import ResolveRequest
from features.smart_collections.service import CollectionConflictError, SmartCollectionService, definition_hash
from features.topic_report.approved_schema import ApprovedRequest
from features.topic_report.research_resolution import resolve_null_collection
from features.topic_report.resolution_schema import (
    ProviderGenerations,
    ResolutionSnapshotV1,
    UnusableCandidate,
)


def resolve_approved_collection(
    service: SmartCollectionService,
    approved: ApprovedRequest,
) -> ResolutionSnapshotV1:
    reference = approved.collectionRef
    if reference is None:
        return resolve_null_collection(service.runtime.dataDir, approved)
    current = service.get(reference.id)["collection"]
    if not isinstance(current, dict):
        raise CollectionConflictError(code="revision_conflict", collectionId=reference.id)
    from features.smart_collections.schema import Collection

    collection = Collection.model_validate(current)
    if collection.revision != reference.revision or definition_hash(collection) != reference.definitionHash:
        raise CollectionConflictError(
            code="revision_conflict",
            collectionId=reference.id,
            currentRevision=collection.revision,
            storeRevision=None,
        )
    resolved = service.resolve(
        reference.id,
        ResolveRequest(expectedRevision=reference.revision, limit=120),
    )
    unusable_raw = resolved["unusableCandidates"]
    unusable = (
        [UnusableCandidate.model_validate(item) for item in unusable_raw]
        if isinstance(unusable_raw, list)
        else []
    )
    universe_raw = resolved["executionUniverseIds"]
    universe = [str(item) for item in universe_raw] if isinstance(universe_raw, list) else []
    candidates_raw = resolved["resolvedCandidateIds"]
    candidates = [str(item) for item in candidates_raw] if isinstance(candidates_raw, list) else []
    return ResolutionSnapshotV1(
        schemaVersion=1,
        collectionId=reference.id,
        collectionRevision=reference.revision,
        collectionDefinitionHash=reference.definitionHash,
        eligibleTotal=int(resolved["total"]),
        candidateCap=120,
        truncated=bool(resolved["truncated"]),
        resolvedCandidateIds=candidates,
        executionUniverseIds=universe,
        unusableCandidates=unusable,
        selectedEvidenceIds=[],
        providerGenerations=ProviderGenerations(
            indexGeneration=str(resolved["indexGeneration"]) if resolved["indexGeneration"] else None,
            rssGeneration=str(resolved["rssGeneration"]) if resolved["rssGeneration"] else None,
        ),
        inputWatermark=str(resolved["inputWatermark"]) if resolved["inputWatermark"] else None,
    )
