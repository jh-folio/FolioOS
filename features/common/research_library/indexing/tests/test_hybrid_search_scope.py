"""hybrid_search 후보 수집의 범위 제한 — CJK 보조 경로가 그 제한을 지나쳤다."""
from __future__ import annotations

import pathlib

from features.common.research_library.indexing.research_index import hybrid_search, sync_index

TITLE = "半導体株が上昇、円安が追い風"


def _build(tmp_path: pathlib.Path, doc_ids: list[str], *, prefix: str = "/inbox/rss") -> pathlib.Path:
    docs = [
        {
            "id": doc_id, "path": f"{prefix}/{doc_id}.md", "title": TITLE, "source": "Nikkei",
            "date": "2026-08-04", "type": "rss", "url": f"https://example.com/{doc_id}",
            "marketRelevance": 1.0, "content": TITLE,
        }
        for doc_id in doc_ids
    ]
    db = tmp_path / "index.sqlite3"
    sync_index(db, {"documents": docs})
    return db


def test_cjk_candidates_obey_allowed_doc_ids(tmp_path: pathlib.Path):
    """CJK LIKE 경로도 1단계 FTS와 같은 허용 문서 제한을 져야 한다.

    제한 없이 후보를 보태면 허용 밖 문서가 후보 정원(fts_pool)을 먼저 채워, 정작 허용된
    문서가 후보에 들지 못한다. 호출부의 파이썬 후처리가 유출은 막지만 이미 잃은 재현율은
    되돌려주지 못한다 — 후보 정원이 작은 테마분석 경로가 특히 취약하다.
    """
    db = _build(tmp_path, [f"other-{index}" for index in range(5)] + ["allowed"])

    hits = hybrid_search(db, "半導体", limit=10, allowed_doc_ids={"allowed"}, fts_pool=3)

    assert [hit["id"] for hit in hits] == ["allowed"]


def test_cjk_candidates_obey_the_scope_prefix(tmp_path: pathlib.Path):
    """범위 접두사도 같은 이유로 CJK 경로에 적용된다."""
    db = _build(tmp_path, ["rss-1"])
    other = tmp_path / "other.sqlite3"
    sync_index(other, {"documents": [
        {
            "id": "filing-1", "path": "/inbox/filings/filing-1.md", "title": TITLE, "source": "EDGAR",
            "date": "2026-08-04", "type": "filing", "url": "https://example.com/f", "marketRelevance": 1.0,
            "content": TITLE,
        },
    ]})

    assert hybrid_search(db, "半導体", limit=10, scope_prefixes=("/inbox/rss",))
    assert hybrid_search(other, "半導体", limit=10, scope_prefixes=("/inbox/rss",)) == []


def test_latin_and_hangul_queries_are_unchanged(tmp_path: pathlib.Path):
    """라틴·한글 질의는 CJK 경로를 타지 않는다(LIKE에 단어 경계가 없다)."""
    db = _build(tmp_path, ["ja-1"])

    assert hybrid_search(db, "円安", limit=10)
    assert hybrid_search(db, "semiconductor", limit=10) == []
