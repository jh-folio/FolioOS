from __future__ import annotations

import re
import unicodedata
from typing import Literal, Self

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from features.common.markets import MarketCode, normalize_market_code


COLLECTION_ID_PATTERN = re.compile(
    r"sc_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}"
)


class CollectionValidationError(ValueError):
    pass


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True, strict=True)


def normalized_text(value: str) -> str:
    return unicodedata.normalize("NFKC", value).strip()


def normalized_values(values: list[str], *, upper: bool = False) -> list[str]:
    normalized = [normalized_text(value) for value in values]
    normalized = [value.upper() if upper else value.casefold() for value in normalized if value]
    return sorted(set(normalized))


class CollectionFields(StrictModel):
    name: str = Field(min_length=1, max_length=80)
    query: str = Field(max_length=500)
    market: Literal["ALL", "US", "KR", "EUROPE", "JP", "GLOBAL", "UNKNOWN"]
    sources: list[str] = Field(max_length=20)
    tickers: list[str] = Field(max_length=20)
    tags: list[str] = Field(max_length=20)

    @field_validator("name", "query", mode="before")
    @classmethod
    def normalize_strings(cls, value: str) -> str:
        if not isinstance(value, str):
            raise CollectionValidationError("string_required")
        return normalized_text(value)

    @field_validator("market", mode="before")
    @classmethod
    def normalize_market(cls, value: str) -> str:
        if not isinstance(value, str):
            raise CollectionValidationError("string_required")
        if normalized_text(value).upper() == "ALL":
            return "ALL"
        market = normalize_market_code(value)
        return market.value if market is not MarketCode.UNKNOWN else "UNKNOWN"

    @field_validator("sources", "tags", mode="before")
    @classmethod
    def normalize_casefold_values(cls, value: list[str]) -> list[str]:
        if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
            raise CollectionValidationError("string_list_required")
        return normalized_values(value)

    @field_validator("tickers", mode="before")
    @classmethod
    def normalize_ticker_values(cls, value: list[str]) -> list[str]:
        if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
            raise CollectionValidationError("string_list_required")
        return normalized_values(value, upper=True)

    @field_validator("sources")
    @classmethod
    def validate_sources(cls, value: list[str]) -> list[str]:
        if any(not 1 <= len(item) <= 80 for item in value):
            raise CollectionValidationError("invalid_source")
        return value

    @field_validator("tickers")
    @classmethod
    def validate_tickers(cls, value: list[str]) -> list[str]:
        if any(not 1 <= len(item) <= 20 for item in value):
            raise CollectionValidationError("invalid_ticker")
        return value

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, value: list[str]) -> list[str]:
        if any(not 1 <= len(item) <= 40 for item in value):
            raise CollectionValidationError("invalid_tag")
        return value

    @model_validator(mode="after")
    def validate_filter(self) -> Self:
        if not self.query and self.market == "ALL" and not (self.sources or self.tickers or self.tags):
            raise CollectionValidationError("collection_filter_required")
        return self


class CreateCollectionRequest(CollectionFields):
    pass


class UpdateCollectionRequest(CollectionFields):
    expectedRevision: int = Field(ge=1)


class DeleteCollectionRequest(StrictModel):
    expectedRevision: int = Field(ge=1)


class PreviewRequest(StrictModel):
    expectedRevision: int = Field(ge=1)
    limit: int = Field(ge=1, le=50)


class ResolveRequest(StrictModel):
    expectedRevision: int = Field(ge=1)
    limit: int = Field(ge=1, le=120)


class RefreshRequest(StrictModel):
    expectedRevision: int = Field(ge=1)


class ListQuery(StrictModel):
    limit: int = Field(default=100, ge=1, le=100)
    offset: int = Field(default=0, ge=0, le=10000)


class Collection(CollectionFields):
    id: str = Field(pattern=COLLECTION_ID_PATTERN.pattern)
    revision: int = Field(ge=1)
    createdAt: str
    updatedAt: str


class CollectionStoreFile(StrictModel):
    schemaVersion: Literal[1]
    storeRevision: int = Field(ge=1)
    updatedAt: str
    collections: list[Collection]


class ProviderId(StrictModel):
    provider: Literal["index", "rss"]
    id: str


class PreviewItem(StrictModel):
    id: str
    providerIds: list[ProviderId]
    title: str
    url: str
    source: str
    markets: list[str]
    tickers: list[str]
    tags: list[str]
    publishedAt: str
    score: float
    snippet: str
    usability: Literal["indexed", "unindexed_rss"]


class UnusableCandidate(StrictModel):
    candidateId: str
    reason: Literal["unindexed_rss"]


class CollectionPreview(StrictModel):
    collectionId: str
    revision: int
    total: int
    limit: int
    items: list[PreviewItem]


class CollectionResolve(CollectionPreview):
    resolvedAt: str
    indexGeneration: str | None
    rssGeneration: str | None
    inputWatermark: str | None
    resolvedCandidateIds: list[str]
    executionUniverseIds: list[str]
    unusableCandidates: list[UnusableCandidate]
    truncated: bool


class SnapshotProviderGenerations(StrictModel):
    index: str | None
    rss: str | None


class CollectionResolutionSnapshot(StrictModel):
    collectionId: str = Field(pattern=COLLECTION_ID_PATTERN.pattern)
    revision: int = Field(ge=1)
    definitionHash: str = Field(min_length=1, max_length=128)
    resolvedAt: str = Field(min_length=1, max_length=64)
    providerGenerations: SnapshotProviderGenerations
    inputWatermark: str | None = Field(default=None, max_length=256)
    evidenceIds: list[str] = Field(max_length=120)
    eligibleCount: int = Field(ge=0)
    resolvedCount: int = Field(ge=0)
    executionCount: int = Field(ge=0)
    unusableCount: int = Field(ge=0)
    truncated: bool


class CollectionSnapshotFile(StrictModel):
    schemaVersion: Literal[1]
    collectionId: str = Field(pattern=COLLECTION_ID_PATTERN.pattern)
    history: list[CollectionResolutionSnapshot] = Field(max_length=8)
