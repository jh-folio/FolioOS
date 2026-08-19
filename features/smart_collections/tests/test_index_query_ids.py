"""허용 문서 ID가 아무리 많아도 SQL 변수 한도에 걸리지 않는다."""
from __future__ import annotations

import sqlite3
from pathlib import Path

import pytest

from features.common.research_library.indexing.research_index import sync_index
from features.smart_collections import providers
from features.smart_collections.providers import index_query_ids


def document(doc_id: str, content: str) -> dict[str, str | int]:
    return {
        "id": doc_id,
        "path": f"research-inbox/articles/{doc_id}.md",
        "title": doc_id,
        "source": "Reuters",
        "date": "2026-07-15",
        "type": "article",
        "url": f"https://example.com/{doc_id}",
        "marketRelevance": 10,
        "contentHash": f"hash-{doc_id}",
        "content": content,
    }


@pytest.fixture
def index_dir(tmp_path: Path) -> Path:
    sync_index(
        tmp_path / "research-index.sqlite3",
        {
            "generatedAt": "2026-07-16T00:00:00Z",
            "documents": [
                document("hit-a", "alpha earnings report"),
                document("hit-b", "alpha guidance"),
                document("miss", "beta only"),
            ],
        },
    )
    return tmp_path


def test_matches_are_intersected_with_allowed_ids(index_dir: Path) -> None:
    assert index_query_ids(index_dir, "alpha", {"hit-a", "miss"}) == {"hit-a"}
    assert index_query_ids(index_dir, "alpha", {"hit-a", "hit-b"}) == {"hit-a", "hit-b"}
    assert index_query_ids(index_dir, "gamma", {"hit-a", "hit-b"}) == set()


def test_allowed_ids_beyond_sqlite_variable_limit(index_dir: Path) -> None:
    """SQLITE_MAX_VARIABLE_NUMBER(32766)를 넘는 허용 집합도 그대로 해석된다.

    검색어만 지정한 컬렉션은 색인의 모든 article 문서를 허용 집합으로 갖는다.
    예전 구현은 그 ID를 전부 `IN (?)`에 바인딩해 `too many SQL variables`가 났고,
    `CollectionSourceUnavailableError`로 둔갑해 컬렉션이 영영 열리지 않았다.
    """
    allowed = {"hit-a", "hit-b"} | {f"filler-{number}" for number in range(40_000)}
    assert index_query_ids(index_dir, "alpha", allowed) == {"hit-a", "hit-b"}


def test_bound_parameter_count_does_not_grow_with_allowed_ids(
    index_dir: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """바인딩 파라미터는 검색식 하나뿐이어야 한다(구버전 한도 999에서도 안전)."""
    bound: list[int] = []
    real_connect = sqlite3.connect

    class Recording(sqlite3.Connection):
        def execute(self, sql: str, parameters=(), /):  # type: ignore[override]
            bound.append(len(parameters))
            return super().execute(sql, parameters)

    monkeypatch.setattr(
        providers.sqlite3,
        "connect",
        lambda *args, **kwargs: real_connect(*args, factory=Recording, **kwargs),
    )
    allowed = {"hit-a", "hit-b"} | {f"filler-{number}" for number in range(2_000)}
    assert index_query_ids(index_dir, "alpha", allowed) == {"hit-a", "hit-b"}
    assert bound and max(bound) == 1
