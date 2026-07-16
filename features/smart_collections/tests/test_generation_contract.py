from __future__ import annotations

from dataclasses import replace

from features.common.jcs import sha256_hex
from features.smart_collections.providers import ProviderRow, generation


def index_row(provider_id: str) -> ProviderRow:
    return ProviderRow(
        provider="index",
        providerId=provider_id,
        path=f"research-inbox/articles/{provider_id}.md",
        title="AI demand",
        url=f"https://example.com/{provider_id}",
        normalizedUrl=f"https://example.com/{provider_id}",
        source="Reuters",
        markets=("us",),
        tickers=("NVDA",),
        tags=("ai",),
        publishedAt="2026-07-15T00:00:00Z",
        contentHash="content-hash",
        contentUpdatedAt="2026-07-16T00:00:00Z",
        fileMtimeNs=10,
        fileSize=20,
        snippet="AI demand expands",
    )


def test_index_generation_pin_is_stable_across_input_order() -> None:
    first = index_row("doc-a")
    second = replace(index_row("doc-b"), contentHash="content-hash-b")
    assert generation((first, second)) == generation((second, first))


def test_index_generation_uses_exact_ten_field_preimage() -> None:
    row = index_row("doc-a")
    changed_file_attributes = replace(row, fileMtimeNs=999, fileSize=777)
    expected = sha256_hex(
        [
            {
                "id": "doc-a",
                "contentHash": "content-hash",
                "contentUpdatedAt": "2026-07-16T00:00:00Z",
                "publishedAt": "2026-07-15T00:00:00Z",
                "source": "Reuters",
                "markets": ["us"],
                "tickers": ["NVDA"],
                "tags": ["ai"],
                "normalizedUrl": "https://example.com/doc-a",
                "path": "research-inbox/articles/doc-a.md",
            }
        ]
    )
    assert expected == "9272a747d09df0b9cf85e85b4a92691341f17692f58ea5a8d2aa98cf0cbe7fc7"
    assert generation((row,)) == expected
    assert generation((changed_file_attributes,)) == expected
