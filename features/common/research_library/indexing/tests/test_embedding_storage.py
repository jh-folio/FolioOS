"""임베딩 저장 형식 — float32 + zlib blob.

JSON 텍스트로 저장하면 값 하나가 20여 글자다. 실측으로 청크 42,471개의 임베딩이 342MB로
검색 DB 728MB의 절반에 가까웠고, 변환 후 VACUUM까지 하면 380MB가 됐다.
"""
from __future__ import annotations

import json
import sqlite3

from features.common.research_library.indexing.research_index import (
    EMBED_DIM,
    connect,
    cosine,
    embed_text,
    encode_embedding,
    init_db,
    migrate_embeddings,
    parse_embedding,
)


def test_a_vector_survives_the_round_trip():
    vec = embed_text("반도체 공급망과 데이터센터 전력")

    restored = parse_embedding(encode_embedding(vec))

    assert len(restored) == EMBED_DIM
    # float32로 줄인 만큼만 어긋난다. 실측 최대 성분 오차 1.4e-08.
    assert max(abs(a - b) for a, b in zip(vec, restored)) < 1e-6
    assert abs(cosine(vec, vec) - cosine(vec, restored)) < 1e-6


def test_the_old_json_rows_are_still_readable():
    """판올림한 DB에는 아직 JSON 행이 남아 있다. 변환이 도는 동안에도 검색이 되어야 한다."""
    vec = embed_text("Federal Reserve rate decision")

    assert parse_embedding(json.dumps(vec)) == vec


def test_a_broken_value_never_raises():
    """검색 한 번이 저장 오류 하나로 통째로 죽으면 안 된다."""
    assert parse_embedding(b"not a zlib stream") == [0.0] * EMBED_DIM
    assert parse_embedding("{not json") == [0.0] * EMBED_DIM
    assert parse_embedding("") == [0.0] * EMBED_DIM


def test_the_blob_is_much_smaller_than_the_text():
    vec = embed_text("엔비디아 실적과 AI 데이터센터 수요, 금리와 환율까지 " * 5)

    blob = len(encode_embedding(vec))
    text = len(json.dumps(vec, ensure_ascii=False))

    # 실측 표본 2,000개에서 14.85배. 벡터 하나로도 확실히 작아야 한다.
    assert text / blob > 5, f"{text} -> {blob}"


def test_migration_converts_old_rows_and_can_be_resumed(tmp_path):
    db = tmp_path / "research-index.sqlite3"
    conn = connect(db)
    init_db(conn)
    vectors = {}
    with conn:
        conn.execute(
            "INSERT INTO documents (doc_id, path, title, source, date, type, url, market_relevance, metadata_json, updated_at)"
            " VALUES ('d1', 'p', 't', 's', '2026-08-10', 'news', '', 1, '{}', '2026-08-10')"
        )
        for idx in range(7):
            vec = embed_text(f"chunk number {idx} about the market")
            vectors[f"c{idx}"] = vec
            conn.execute(
                "INSERT INTO chunks (chunk_id, doc_id, chunk_index, text, embedding) VALUES (?, 'd1', ?, ?, ?)",
                (f"c{idx}", idx, f"text {idx}", json.dumps(vec, ensure_ascii=False)),
            )
    conn.close()

    # 예산을 주면 그만큼만 바꾸고 남은 수를 알려 준다 — 중간에 꺼져도 이어서 한다.
    first = migrate_embeddings(db, batch=2, budget=4)
    assert first["converted"] == 4
    assert first["remaining"] == 3
    assert first["done"] is False

    rest = migrate_embeddings(db, batch=2)
    assert rest["converted"] == 3
    assert rest["done"] is True

    # 다시 불러도 할 일이 없다.
    assert migrate_embeddings(db)["converted"] == 0

    conn = sqlite3.connect(db)
    conn.row_factory = sqlite3.Row
    rows = conn.execute("SELECT chunk_id, embedding, typeof(embedding) AS kind FROM chunks").fetchall()
    conn.close()
    assert {row["kind"] for row in rows} == {"blob"}
    for row in rows:
        restored = parse_embedding(row["embedding"])
        assert max(abs(a - b) for a, b in zip(vectors[row["chunk_id"]], restored)) < 1e-6


def test_an_old_database_gets_the_column_renamed(tmp_path):
    """`embedding_json`이던 칸을 그대로 쓴다. 728MB DB에서도 이름 변경은 즉시다."""
    db = tmp_path / "legacy.sqlite3"
    conn = sqlite3.connect(db)
    conn.execute(
        "CREATE TABLE chunks (chunk_id TEXT PRIMARY KEY, doc_id TEXT NOT NULL, chunk_index INTEGER NOT NULL,"
        " text TEXT NOT NULL, embedding_json TEXT NOT NULL, UNIQUE(doc_id, chunk_index))"
    )
    conn.execute(
        "INSERT INTO chunks VALUES ('c0', 'd1', 0, 'text', ?)",
        (json.dumps(embed_text("legacy row")),),
    )
    conn.commit()
    conn.close()

    conn = connect(db)
    init_db(conn)
    conn.commit()
    columns = {str(row[1]) for row in conn.execute("PRAGMA table_info(chunks)")}
    conn.close()

    assert "embedding" in columns and "embedding_json" not in columns
    assert migrate_embeddings(db)["converted"] == 1
