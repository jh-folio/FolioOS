"""Server-owned Smart Collection projection for Agent explanation context."""
from __future__ import annotations

from features.agent_mode.companion import normalize_agent_context
from features.smart_collections.schema import ResolveRequest
from features.smart_collections.service import SmartCollectionService


COLLECTION_CONTEXT_LAYER = "saved_filter_metadata_not_evidence"


def resolve_collection_projection(
    context: dict,
    collection_service: SmartCollectionService | None,
) -> dict | None:
    collection_id = context.get("collectionId")
    if collection_id is None:
        return None
    if collection_service is None:
        from features.smart_collections.store import CollectionStoreUnavailableError

        raise CollectionStoreUnavailableError("agent_collection_service_unavailable")
    revision = context["collectionRevision"]
    approved_ref = collection_service.approved_ref(collection_id, revision)
    # Resolve performs the authoritative optimistic revision check immediately
    # before deriving match metadata. No frontend definition or rows are accepted.
    resolved = collection_service.resolve(
        collection_id,
        ResolveRequest(expectedRevision=revision, limit=120),
    )
    return {
        "collectionId": resolved["collectionId"],
        "revision": resolved["revision"],
        "definitionHash": approved_ref.definitionHash,
        "eligibleTotal": resolved["total"],
        "resolvedCandidateIds": resolved["resolvedCandidateIds"],
        "executionUniverseIds": resolved["executionUniverseIds"],
        "unusableCount": len(resolved["unusableCandidates"]),
        "truncated": resolved["truncated"],
        "providerGenerations": {
            "indexGeneration": resolved["indexGeneration"],
            "rssGeneration": resolved["rssGeneration"],
        },
        "inputWatermark": resolved["inputWatermark"],
        "layer": COLLECTION_CONTEXT_LAYER,
    }


def prepare_agent_context(raw: dict | None, collection_service: SmartCollectionService | None) -> dict:
    normalized = normalize_agent_context(raw)
    projection = resolve_collection_projection(normalized, collection_service)
    if projection is not None:
        normalized["collection"] = projection
    return normalized


def render_collection_projection(context: dict) -> str:
    projection = context.get("collection")
    if not isinstance(projection, dict):
        return ""
    generations = projection["providerGenerations"]
    return "\n".join([
        "서버가 조회한 Smart Collection (저장된 외부자료 필터 metadata이며 evidence가 아님):",
        f"- collectionId: {projection['collectionId']}",
        f"- revision: {projection['revision']}",
        f"- definitionHash: {projection['definitionHash']}",
        f"- eligibleTotal: {projection['eligibleTotal']}",
        f"- resolvedCandidateIds: {projection['resolvedCandidateIds']}",
        f"- executionUniverseIds: {projection['executionUniverseIds']}",
        f"- unusableCount: {projection['unusableCount']}",
        f"- truncated: {projection['truncated']}",
        f"- indexGeneration: {generations['indexGeneration']}",
        f"- rssGeneration: {generations['rssGeneration']}",
        f"- inputWatermark: {projection['inputWatermark']}",
    ])
