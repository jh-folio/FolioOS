"""기본 Deep Research 경로의 색인 지문은 본문을 읽지 않는다."""
from __future__ import annotations

import re
import sqlite3
from datetime import UTC, datetime
from pathlib import Path
from uuid import UUID

import pytest

from features.common.research_library.indexing.research_index import sync_index
from features.topic_report import research_resolution
from features.topic_report.approved_request import ApprovedRequestRuntime, ApprovedRequestService
from features.topic_report.approved_schema import ApprovedRequest, PlanRequest
from features.topic_report.research_resolution import resolve_null_collection
from features.topic_report.resolution_schema import ProviderGenerations, ResolutionSnapshotV1


NOW = datetime(2026, 7, 16, 3, 4, 5, tzinfo=UTC)


def empty_resolution() -> ResolutionSnapshotV1:
    return ResolutionSnapshotV1(
        schemaVersion=1,
        collectionId=None,
        collectionRevision=None,
        collectionDefinitionHash=None,
        eligibleTotal=None,
        candidateCap=None,
        truncated=False,
        resolvedCandidateIds=[],
        executionUniverseIds=[],
        unusableCandidates=[],
        selectedEvidenceIds=[],
        providerGenerations=ProviderGenerations(indexGeneration=None, rssGeneration=None),
        inputWatermark=None,
    )


@pytest.fixture
def approved(tmp_path: Path) -> ApprovedRequest:
    runtime = ApprovedRequestRuntime(
        dataDir=tmp_path,
        clock=lambda: NOW,
        entropy=lambda size: bytes(range(size)),
        uuidFactory=lambda: UUID("12345678-1234-4567-9234-567812345678"),
        resolver=lambda _approved: empty_resolution(),
    )
    return ApprovedRequestService(runtime).plan(
        PlanRequest(question="AI 전력 수요와 전력기기 기업", plannerEngine="rules")
    ).approvedRequest


def document(content_hash: str, content: str) -> dict[str, str | int]:
    return {
        "id": "doc-1",
        "path": "research-inbox/articles/doc-1.md",
        "title": "AI power demand",
        "source": "Reuters",
        "date": "2026-07-15",
        "type": "article",
        "url": "https://example.com/doc-1",
        "marketRelevance": 10,
        "contentHash": content_hash,
        "content": content,
    }


def sync(data_dir: Path, generated_at: str, content_hash: str, content: str) -> None:
    sync_index(
        data_dir / "research-index.sqlite3",
        {"generatedAt": generated_at, "documents": [document(content_hash, content)]},
    )


def test_missing_index_returns_empty_snapshot(tmp_path: Path, approved: ApprovedRequest) -> None:
    assert resolve_null_collection(tmp_path, approved).providerGenerations.indexGeneration is None


def test_generation_tracks_stored_hash_not_document_body(
    tmp_path: Path, approved: ApprovedRequest
) -> None:
    """본문 문자열이 아니라 인덱서가 판정한 변화가 지문을 움직인다."""
    sync(tmp_path, "2026-07-16T00:00:00Z", "h1", "first body")
    first = resolve_null_collection(tmp_path, approved)
    assert first.providerGenerations.indexGeneration is not None

    # 같은 contentHash면 인덱서가 변화로 보지 않는다 → 지문도 그대로다.
    sync(tmp_path, "2026-07-17T00:00:00Z", "h1", "first body rewritten by a later fetch")
    assert resolve_null_collection(tmp_path, approved) == first

    # 자료가 실제로 바뀌면 지문이 바뀐다.
    sync(tmp_path, "2026-07-18T00:00:00Z", "h2", "second body")
    changed = resolve_null_collection(tmp_path, approved)
    assert changed.providerGenerations.indexGeneration != first.providerGenerations.indexGeneration
    assert changed.inputWatermark != first.inputWatermark


def test_generation_query_never_reads_content_or_metadata(
    tmp_path: Path, approved: ApprovedRequest, monkeypatch: pytest.MonkeyPatch
) -> None:
    """색인 규모에 비례하는 본문/metadata 원문을 메모리로 올리지 않는다."""
    sync(tmp_path, "2026-07-16T00:00:00Z", "h1", "body " * 200)
    statements: list[str] = []
    real_connect = sqlite3.connect

    class Recording(sqlite3.Connection):
        def execute(self, sql: str, parameters=(), /):  # type: ignore[override]
            statements.append(sql)
            return super().execute(sql, parameters)

    monkeypatch.setattr(
        research_resolution.sqlite3,
        "connect",
        lambda *args, **kwargs: real_connect(*args, factory=Recording, **kwargs),
    )
    assert resolve_null_collection(tmp_path, approved).providerGenerations.indexGeneration
    assert statements
    for sql in statements:
        assert "metadata_json" not in sql
        assert re.search(r"\bcontent\b", sql) is None
