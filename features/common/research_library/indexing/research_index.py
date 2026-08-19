#!/usr/bin/env python3
from __future__ import annotations

import json
import math
import re
import sqlite3
from pathlib import Path


from features.common.text.tokenize import (
    TOKEN_RE as _shared_token_re,
    has_cjk,
    token_set as _shared_token_set,
)

EMBED_DIM = 384
MANIFEST_METADATA_VERSION = 2
# 토큰화는 features/common/text/tokenize.py가 소유한다. 일본어는 CJK 클래스를
# 따로 두고, 유럽어는 라틴 악센트만 폴딩한다(한글/가나는 훼손하지 않는다).
TOKEN_RE = _shared_token_re


def normalize_space(text: str) -> str:
    return re.sub(r"\s+", " ", str(text or "")).strip()


def token_set(text: str) -> set[str]:
    return _shared_token_set(text)


def char_ngrams(text: str, min_n: int = 2, max_n: int = 4) -> list[str]:
    normalized = normalize_space(text).lower()
    chars = list(normalized)
    out: list[str] = []
    for n in range(min_n, max_n + 1):
        if len(chars) < n:
            continue
        for idx in range(0, len(chars) - n + 1):
            token = "".join(chars[idx : idx + n])
            if token.strip():
                out.append(token)
    return out


def stable_hash_index(token: str, dim: int) -> tuple[int, float]:
    import hashlib

    digest = hashlib.blake2b(token.encode("utf-8"), digest_size=8).digest()
    value = int.from_bytes(digest, "big", signed=False)
    return value % dim, -1.0 if (value & 1) else 1.0


def embed_text(text: str, dim: int = EMBED_DIM) -> list[float]:
    vec = [0.0] * dim
    for token in char_ngrams(text):
        idx, sign = stable_hash_index(token, dim)
        vec[idx] += sign
    norm = math.sqrt(sum(value * value for value in vec))
    if norm <= 0:
        return vec
    return [value / norm for value in vec]


def encode_embedding(vec: list[float]) -> bytes:
    """임베딩을 float32 + zlib blob으로 담는다.

    JSON 텍스트로 저장하면 값 하나가 `-0.05922199384805114,` 같은 20여 글자가 된다.
    실측으로 청크 42,471개의 `embedding_json`이 342MB였고 검색 DB 728MB의 절반에 가까웠다.
    같은 표본에서 이 형식은 **14.85배 작고 디코드가 9배 빠르다**(후보 120개 기준 13.0ms → 1.4ms).

    float32로 줄여도 성분 오차가 최대 1.4e-08이다. 코사인 값은 RRF에서 **순위로만** 쓰이므로
    이 정도 오차로는 순서가 바뀌지 않는다(실제 질의로 확인한다).
    """
    import struct
    import zlib

    values = list(vec or [])[:EMBED_DIM]
    if len(values) < EMBED_DIM:
        values.extend([0.0] * (EMBED_DIM - len(values)))
    return zlib.compress(struct.pack(f"<{EMBED_DIM}f", *values), 6)


def _decode_blob(raw: bytes) -> list[float]:
    import struct
    import zlib

    try:
        return list(struct.unpack(f"<{EMBED_DIM}f", zlib.decompress(raw)))
    except Exception:
        return [0.0] * EMBED_DIM


def parse_embedding(raw) -> list[float]:
    """저장된 임베딩을 읽는다. blob과 옛 JSON 텍스트를 모두 받는다.

    판올림한 사용자의 DB에는 아직 JSON 행이 남아 있다. 변환은 배경에서 도므로
    그동안에도 검색이 그대로 동작해야 한다.
    """
    if isinstance(raw, (bytes, bytearray, memoryview)):
        return _decode_blob(bytes(raw))
    try:
        payload = json.loads(raw)
    except Exception:
        return [0.0] * EMBED_DIM
    if not isinstance(payload, list):
        return [0.0] * EMBED_DIM
    values = []
    for item in payload[:EMBED_DIM]:
        try:
            values.append(float(item))
        except Exception:
            values.append(0.0)
    if len(values) < EMBED_DIM:
        values.extend([0.0] * (EMBED_DIM - len(values)))
    return values


# 한 번에 바꿀 행 수. 42,471개를 한 트랜잭션으로 밀면 그동안 DB가 잠겨 검색이 멈춘다.
EMBEDDING_MIGRATION_BATCH = 500


def migrate_embeddings(db_path: str | Path, batch: int = EMBEDDING_MIGRATION_BATCH, budget: int = 0) -> dict:
    """옛 JSON 임베딩을 blob으로 바꾼다. 재개 가능하고, 중간에 멈춰도 안전하다.

    한 batch가 곧 한 트랜잭션이다. 전부를 한 번에 밀면 42,471개를 쓰는 동안 DB가 잠겨
    검색이 멈추므로, 조금씩 바꾸고 사이를 열어 준다. 남은 것은 다음 호출이 이어서 한다 —
    `typeof(embedding) = 'text'`로 고르므로 이미 바꾼 행은 다시 걸리지 않는다.

    `budget`이 0보다 크면 그만큼만 바꾸고 남은 수를 돌려준다.
    """
    path = Path(db_path)
    if not path.exists():
        return {"converted": 0, "remaining": 0, "done": True}
    conn = connect(path)
    try:
        try:
            remaining = conn.execute(
                "SELECT COUNT(*) FROM chunks WHERE typeof(embedding) = 'text'"
            ).fetchone()[0]
        except sqlite3.OperationalError:
            return {"converted": 0, "remaining": 0, "done": True}
        converted = 0
        while remaining:
            if budget and converted >= budget:
                break
            rows = conn.execute(
                "SELECT chunk_id, embedding FROM chunks WHERE typeof(embedding) = 'text' LIMIT ?",
                (batch,),
            ).fetchall()
            if not rows:
                break
            payload = [(encode_embedding(parse_embedding(row["embedding"])), row["chunk_id"]) for row in rows]
            with conn:
                conn.executemany("UPDATE chunks SET embedding = ? WHERE chunk_id = ?", payload)
            converted += len(rows)
            remaining -= len(rows)
        return {"converted": converted, "remaining": remaining, "done": remaining <= 0}
    finally:
        conn.close()


def cosine(a: list[float], b: list[float]) -> float:
    if not a or not b:
        return 0.0
    size = min(len(a), len(b))
    return sum(a[idx] * b[idx] for idx in range(size))


def connect(db_path: str | Path) -> sqlite3.Connection:
    path = Path(db_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    # 여러 프로세스(서버/백그라운드 인덱싱)가 같은 DB를 공유하므로 기본 5초 대신
    # 충분한 잠금 대기 시간을 준다.
    conn = sqlite3.connect(path, timeout=30)
    conn.row_factory = sqlite3.Row
    return conn


def _delete_cjk_rows(conn: sqlite3.Connection, doc_id: str) -> None:
    """Keep the CJK auxiliary index in step with chunks_fts deletions."""
    try:
        conn.execute("DELETE FROM chunks_cjk WHERE doc_id = ?", (doc_id,))
    except sqlite3.OperationalError:
        pass


def init_db(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS documents (
            doc_id TEXT PRIMARY KEY,
            path TEXT NOT NULL UNIQUE,
            title TEXT NOT NULL,
            source TEXT NOT NULL,
            date TEXT NOT NULL,
            type TEXT NOT NULL,
            url TEXT NOT NULL,
            market_relevance REAL NOT NULL DEFAULT 0,
            metadata_json TEXT NOT NULL DEFAULT '{}',
            updated_at TEXT NOT NULL
        )
        """
    )
    # Migration: add content column if missing
    try:
        conn.execute("ALTER TABLE documents ADD COLUMN content TEXT NOT NULL DEFAULT ''")
    except sqlite3.OperationalError:
        pass
    document_columns = {str(row[1]) for row in conn.execute("PRAGMA table_info(documents)")}
    if "content_updated_at" not in document_columns:
        conn.execute("ALTER TABLE documents ADD COLUMN content_updated_at TEXT")
    conn.execute(
        "UPDATE documents SET content_updated_at = updated_at "
        "WHERE content_updated_at IS NULL OR content_updated_at = ''"
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS chunks (
            chunk_id TEXT PRIMARY KEY,
            doc_id TEXT NOT NULL,
            chunk_index INTEGER NOT NULL,
            text TEXT NOT NULL,
            -- float32 + zlib blob. 이름이 `embedding_json`이던 시절의 JSON 텍스트도
            -- 변환 전까지 같은 칸에 남아 있으며 `parse_embedding()`이 둘 다 읽는다.
            embedding BLOB NOT NULL,
            FOREIGN KEY(doc_id) REFERENCES documents(doc_id) ON DELETE CASCADE,
            UNIQUE(doc_id, chunk_index)
        )
        """
    )
    try:
        conn.execute(
            """
            CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts
            USING fts5(chunk_id UNINDEXED, doc_id UNINDEXED, title, source, text)
            """
        )
    except sqlite3.OperationalError:
        pass
    # CJK 보조 인덱스. `unicode61`은 띄어쓰기가 없는 일본어를 절 단위 한 토큰으로
    # 잡아 `半導体` 같은 부분어를 못 찾는다(실측 0/5). trigram 토크나이저는 이를
    # 해결하지만 **3자 미만 질의를 전혀 매칭하지 못해** 한국어 2자 금융어(환율·유가·
    # 금리)와 `AI`가 통째로 죽는다. 그래서 기존 인덱스를 그대로 두고 이 테이블을
    # 따로 둔 뒤, 질의에 가나·한자가 있을 때만 LIKE 경로로 후보를 보탠다.
    # trigram의 실제 가치는 MATCH가 아니라 LIKE 최적화이며, 그 경로는 1~2자까지 잡는다.
    # 색인 대상은 CJK를 포함한 chunk뿐이라 한국어/라틴 코퍼스에는 비용이 없다.
    try:
        conn.execute(
            """
            CREATE VIRTUAL TABLE IF NOT EXISTS chunks_cjk
            USING fts5(chunk_id UNINDEXED, doc_id UNINDEXED, text, tokenize='trigram')
            """
        )
    except sqlite3.OperationalError:
        pass
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS file_manifest (
            path TEXT PRIMARY KEY,
            file_signature TEXT NOT NULL DEFAULT '',
            market_relevant INTEGER NOT NULL DEFAULT 0,
            doc_id TEXT NOT NULL DEFAULT '',
            modified_at TEXT NOT NULL DEFAULT '',
            metadata_version INTEGER NOT NULL DEFAULT 1
        )
        """
    )
    # 이름을 바꾼다(3.25+ 메타데이터 전용, 728MB DB에서도 즉시). 칸 안의 옛 JSON 텍스트는
    # 그대로 남고 `parse_embedding()`이 계속 읽는다. 실제 변환은 배경에서 batch로 돈다.
    chunk_columns = {str(row[1]) for row in conn.execute("PRAGMA table_info(chunks)")}
    if "embedding" not in chunk_columns and "embedding_json" in chunk_columns:
        try:
            conn.execute("ALTER TABLE chunks RENAME COLUMN embedding_json TO embedding")
        except sqlite3.OperationalError:
            pass
    manifest_columns = {str(row[1]) for row in conn.execute("PRAGMA table_info(file_manifest)")}
    if "metadata_version" not in manifest_columns:
        conn.execute("ALTER TABLE file_manifest ADD COLUMN metadata_version INTEGER NOT NULL DEFAULT 1")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_documents_date ON documents(date DESC)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_chunks_doc_id ON chunks(doc_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_file_manifest_path ON file_manifest(path)")
    conn.commit()


def chunk_text(text: str, target_chars: int = 1200, overlap_chars: int = 180) -> list[str]:
    text = normalize_space(text)
    if not text:
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = min(len(text), start + target_chars)
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(text):
            break
        start = max(start + 1, end - overlap_chars)
    return chunks


def sync_index(db_path: str | Path, index: dict) -> dict:
    conn = connect(db_path)
    init_db(conn)
    docs = index.get("documents", []) or []
    current_ids = set()
    chunk_count = 0
    with conn:
        for doc in docs:
            doc_id = str(doc.get("id") or doc.get("path") or "")
            if not doc_id:
                continue
            current_ids.add(doc_id)
            metadata = {
                "companies": doc.get("companies", []),
                "sectors": doc.get("sectors", []),
                "impactTags": doc.get("impactTags", []),
                "summary": doc.get("summary", ""),
                "wordCount": doc.get("wordCount", 0),
                "contentHash": doc.get("contentHash", ""),
                "fileSignature": doc.get("fileSignature", ""),
                "sourceWeight": doc.get("sourceWeight", 5),
                "links": doc.get("links", []),
                "collectionStatus": doc.get("collectionStatus", ""),
                "collector": doc.get("collector", ""),
                "sourceType": doc.get("sourceType", ""),
                "normalizedUrl": doc.get("normalizedUrl", ""),
                "query": doc.get("query", ""),
                "querySource": doc.get("querySource", ""),
                "language": doc.get("language", ""),
                "country": doc.get("country", ""),
                "reliabilityTier": doc.get("reliabilityTier", ""),
                "relatedTickers": doc.get("relatedTickers", []) or [],
                "relatedThemes": doc.get("relatedThemes", []) or [],
                "markets": doc.get("markets", []) or [],
                "narrativeIds": doc.get("narrativeIds", []) or [],
                "eventId": doc.get("eventId", ""),
                "readable": doc.get("readable", True),
                "pages": doc.get("pages", 0),
                "modifiedAt": doc.get("modifiedAt", ""),
            }
            existing = conn.execute(
                "SELECT metadata_json, content_updated_at FROM documents WHERE doc_id = ?",
                (doc_id,),
            ).fetchone()
            existing_hash = ""
            if existing:
                try:
                    existing_hash = json.loads(str(existing["metadata_json"] or "{}")).get("contentHash", "")
                except Exception:
                    existing_hash = ""
            chunks_exist = conn.execute(
                "SELECT 1 FROM chunks WHERE doc_id = ? LIMIT 1",
                (doc_id,),
            ).fetchone()
            reuse_chunks = bool(existing_hash and existing_hash == doc.get("contentHash") and chunks_exist)
            content_updated_at = (
                str(existing["content_updated_at"])
                if existing is not None and existing_hash == doc.get("contentHash")
                else str(index.get("generatedAt", ""))
            )
            stale_ids = [
                str(row["doc_id"])
                for row in conn.execute(
                    "SELECT doc_id FROM documents WHERE path = ? AND doc_id <> ?",
                    (str(doc.get("path", "")), doc_id),
                ).fetchall()
            ]
            for stale_id in stale_ids:
                conn.execute("DELETE FROM chunks WHERE doc_id = ?", (stale_id,))
                try:
                    conn.execute("DELETE FROM chunks_fts WHERE doc_id = ?", (stale_id,))
                    _delete_cjk_rows(conn, stale_id)
                except sqlite3.OperationalError:
                    pass
            conn.execute("DELETE FROM documents WHERE path = ? AND doc_id <> ?", (str(doc.get("path", "")), doc_id))
            conn.execute(
                """
                INSERT INTO documents (
                    doc_id, path, title, source, date, type, url,
                    market_relevance, metadata_json, updated_at, content, content_updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(doc_id) DO UPDATE SET
                    path=excluded.path,
                    title=excluded.title,
                    source=excluded.source,
                    date=excluded.date,
                    type=excluded.type,
                    url=excluded.url,
                    market_relevance=excluded.market_relevance,
                    metadata_json=excluded.metadata_json,
                    updated_at=excluded.updated_at,
                    content=excluded.content,
                    content_updated_at=excluded.content_updated_at
                """,
                (
                    doc_id,
                    str(doc.get("path", "")),
                    str(doc.get("title", "")),
                    str(doc.get("source", "")),
                    str(doc.get("date", "")),
                    str(doc.get("type", "")),
                    str(doc.get("url", "")),
                    float(doc.get("marketRelevance", 0) or 0),
                    json.dumps(metadata, ensure_ascii=False),
                    str(index.get("generatedAt", "")),
                    str(doc.get("content") or ""),
                    content_updated_at,
                ),
            )
            if reuse_chunks:
                continue
            conn.execute("DELETE FROM chunks WHERE doc_id = ?", (doc_id,))
            try:
                conn.execute("DELETE FROM chunks_fts WHERE doc_id = ?", (doc_id,))
                _delete_cjk_rows(conn, doc_id)
            except sqlite3.OperationalError:
                pass
            content = str(doc.get("content") or doc.get("summary") or "")
            for idx, chunk in enumerate(chunk_text(content)):
                chunk_id = f"{doc_id}:{idx:04d}"
                conn.execute(
                    "INSERT INTO chunks (chunk_id, doc_id, chunk_index, text, embedding) VALUES (?, ?, ?, ?, ?)",
                    (chunk_id, doc_id, idx, chunk, encode_embedding(embed_text(chunk))),
                )
                try:
                    conn.execute(
                        "INSERT INTO chunks_fts (chunk_id, doc_id, title, source, text) VALUES (?, ?, ?, ?, ?)",
                        (chunk_id, doc_id, str(doc.get("title", "")), str(doc.get("source", "")), chunk),
                    )
                except sqlite3.OperationalError:
                    pass
                if has_cjk(chunk) or has_cjk(str(doc.get("title", ""))):
                    try:
                        conn.execute(
                            "INSERT INTO chunks_cjk (chunk_id, doc_id, text) VALUES (?, ?, ?)",
                            (chunk_id, doc_id, f"{doc.get('title', '')} {chunk}"),
                        )
                    except sqlite3.OperationalError:
                        pass
                chunk_count += 1
        if current_ids:
            placeholders = ",".join("?" for _ in current_ids)
            stale_ids = [
                str(row["doc_id"])
                for row in conn.execute(
                    f"SELECT doc_id FROM documents WHERE doc_id NOT IN ({placeholders})",
                    tuple(current_ids),
                ).fetchall()
            ]
            for stale_id in stale_ids:
                conn.execute("DELETE FROM chunks WHERE doc_id = ?", (stale_id,))
                try:
                    conn.execute("DELETE FROM chunks_fts WHERE doc_id = ?", (stale_id,))
                    _delete_cjk_rows(conn, stale_id)
                except sqlite3.OperationalError:
                    pass
            conn.execute(f"DELETE FROM documents WHERE doc_id NOT IN ({placeholders})", tuple(current_ids))
    # 인덱싱 job이 끝나도 핸들이 남으면 Windows에서 DB 파일이 잠긴 채로 유지된다.
    conn.close()
    return {"documents": len(docs), "chunks": chunk_count, "dbPath": str(Path(db_path))}


def read_manifest(db_path: str | Path) -> dict:
    """Returns {path: {fileSignature, marketRelevant, id, modifiedAt}} from SQLite."""
    path = Path(db_path)
    if not path.exists():
        return {}
    conn = connect(path)
    init_db(conn)
    rows = conn.execute(
        "SELECT path, file_signature, market_relevant, doc_id, modified_at, metadata_version FROM file_manifest"
    ).fetchall()
    return {
        str(row["path"]): {
            "fileSignature": str(row["file_signature"]),
            "marketRelevant": bool(row["market_relevant"]),
            "id": str(row["doc_id"]),
            "modifiedAt": str(row["modified_at"]),
            "metadataVersion": int(row["metadata_version"] or 1),
        }
        for row in rows
    }


def write_manifest(db_path: str | Path, manifest_dict: dict) -> None:
    """Replaces the file_manifest table with the given dict."""
    conn = connect(db_path)
    init_db(conn)
    with conn:
        conn.execute("DELETE FROM file_manifest")
        if manifest_dict:
            conn.executemany(
                "INSERT INTO file_manifest (path, file_signature, market_relevant, doc_id, modified_at, metadata_version)"
                " VALUES (?, ?, ?, ?, ?, ?)",
                [
                    (
                        str(p),
                        str(entry.get("fileSignature", "")),
                        1 if entry.get("marketRelevant") else 0,
                        str(entry.get("id", "")),
                        str(entry.get("modifiedAt", "")),
                        int(entry.get("metadataVersion") or MANIFEST_METADATA_VERSION),
                    )
                    for p, entry in manifest_dict.items()
                ],
            )


def load_documents_from_db(db_path: str | Path) -> list[dict]:
    """Reconstruct the market-relevant document list from the SQLite documents table."""
    path = Path(db_path)
    if not path.exists():
        return []
    conn = connect(path)
    init_db(conn)
    rows = conn.execute(
        "SELECT * FROM documents ORDER BY date DESC, market_relevance DESC"
    ).fetchall()
    docs = []
    col_names = {desc[0] for desc in conn.execute("PRAGMA table_info(documents)").fetchall()}
    for row in rows:
        meta: dict = {}
        try:
            meta = json.loads(str(row["metadata_json"] or "{}"))
        except Exception:
            pass
        doc: dict = {
            "id": str(row["doc_id"]),
            "path": str(row["path"]),
            "title": str(row["title"]),
            "source": str(row["source"]),
            "date": str(row["date"]),
            "type": str(row["type"]),
            "url": str(row["url"]),
            "marketRelevance": float(row["market_relevance"] or 0),
            "marketRelevant": True,
            "companies": meta.get("companies", []),
            "sectors": meta.get("sectors", []),
            "impactTags": meta.get("impactTags", []),
            "summary": meta.get("summary", ""),
            "wordCount": meta.get("wordCount", 0),
            "contentHash": meta.get("contentHash", ""),
            "fileSignature": meta.get("fileSignature", ""),
            "sourceWeight": meta.get("sourceWeight", 5),
            "links": meta.get("links", []),
            "collectionStatus": meta.get("collectionStatus", ""),
            "collector": meta.get("collector", ""),
            "sourceType": meta.get("sourceType", ""),
            "normalizedUrl": meta.get("normalizedUrl", ""),
            "query": meta.get("query", ""),
            "querySource": meta.get("querySource", ""),
            "language": meta.get("language", ""),
            "country": meta.get("country", ""),
            "reliabilityTier": meta.get("reliabilityTier", ""),
            "relatedTickers": meta.get("relatedTickers", []) or [],
            "relatedThemes": meta.get("relatedThemes", []) or [],
            "markets": meta.get("markets", []) or [],
            "narrativeIds": meta.get("narrativeIds", []) or [],
            "eventId": meta.get("eventId", ""),
            "readable": meta.get("readable", True),
            "pages": meta.get("pages", 0),
            "modifiedAt": meta.get("modifiedAt", ""),
            "absolutePath": "",
        }
        doc["content"] = str(row["content"]) if "content" in col_names else ""
        doc["contentUpdatedAt"] = (
            str(row["content_updated_at"])
            if "content_updated_at" in col_names
            else str(row["updated_at"])
        )
        docs.append(doc)
    return docs


def sanitize_fts_query(q: str) -> str:
    """Build a safe FTS5 MATCH expression: quoted tokens joined with OR for maximum recall."""
    tokens = TOKEN_RE.findall(q)
    if not tokens:
        return ""
    if len(tokens) == 1:
        return f'"{tokens[0]}"'
    return " OR ".join(f'"{t}"' for t in tokens)


def _scope_sql(scope_prefixes: tuple[str, ...]) -> tuple[str, list]:
    """Returns (AND-clause sql, params) for path-prefix scope filtering."""
    if not scope_prefixes:
        return "", []
    clauses = ["d.path LIKE ?" for _ in scope_prefixes]
    return "AND (" + " OR ".join(clauses) + ")", [f"{p}%" for p in scope_prefixes]


def hybrid_search(
    db_path: str | Path,
    query: str,
    limit: int = 20,
    scope_prefixes: tuple[str, ...] = (),
    fts_pool: int = 120,
    allowed_doc_ids: set[str] | None = None,
) -> list[dict]:
    """
    Two-stage hybrid search: FTS5 candidate retrieval → embedding re-ranking.

    Stage 1: FTS5 BM25 returns up to fts_pool candidate chunks (fast index scan).
    Stage 2: Cosine similarity scored on those candidates only (no full-table scan).
    Scores are merged with RRF (Reciprocal Rank Fusion, k=60).
    Returns one deduplicated result per document (best-scoring chunk as snippet).
    """
    q = normalize_space(query)
    if not q:
        return []
    if allowed_doc_ids is not None and not allowed_doc_ids:
        return []
    path = Path(db_path)
    if not path.exists():
        return []
    conn = connect(path)
    try:
        init_db(conn)
        query_vec = embed_text(q)

        # Stage 1: FTS5 — collect candidate chunk_ids with their BM25 rank
        fts_query = sanitize_fts_query(q)
        fts_rank: dict[str, int] = {}  # chunk_id -> 0-based rank (lower = better)
        scope_filter, scope_params = _scope_sql(scope_prefixes)
        allowed_filter = ""
        allowed_params: tuple[str, ...] = ()
        if allowed_doc_ids is not None:
            allowed_placeholders = ",".join("?" for _ in allowed_doc_ids)
            allowed_filter = f"AND d.doc_id IN ({allowed_placeholders})"
            allowed_params = tuple(sorted(allowed_doc_ids))
        if fts_query:
            try:
                rows = conn.execute(
                    f"""
                    SELECT chunks_fts.chunk_id
                    FROM chunks_fts
                    JOIN chunks c ON c.chunk_id = chunks_fts.chunk_id
                    JOIN documents d ON d.doc_id = c.doc_id
                    WHERE chunks_fts MATCH ? {scope_filter} {allowed_filter}
                    ORDER BY bm25(chunks_fts)
                    LIMIT ?
                    """,
                    (fts_query, *scope_params, *allowed_params, min(120, fts_pool)),
                ).fetchall()
                for rank, row in enumerate(rows):
                    fts_rank[str(row["chunk_id"])] = rank
            except sqlite3.OperationalError:
                pass

        # CJK 질의는 위 unicode61 경로가 부분어를 놓친다(`半導体` 실측 0건). trigram
        # 인덱스에 LIKE로 물어 후보를 보탠다. 라틴·한글 질의는 이 경로를 타지 않는데,
        # LIKE는 단어 경계를 모르기 때문이다 — `AI`가 `capital`·`chain`에 걸려
        # 오탐이 늘어난다(실측 2건 기대에 6건). 기존 결과가 바뀌지 않는 이유이기도 하다.
        # 이 경로도 1단계 FTS와 같은 범위·허용 문서 제한을 진다. 제한 없이 후보를 보태면
        # 허용 밖 문서가 후보 정원(fts_pool)을 먹어 정작 허용된 문서가 밀려난다 —
        # 호출부의 파이썬 후처리가 유출은 막지만 재현율은 되돌려주지 못한다.
        if has_cjk(q):
            for term in sorted({t for t in TOKEN_RE.findall(q) if has_cjk(t)} or {q}, key=len, reverse=True)[:4]:
                try:
                    rows = conn.execute(
                        f"""
                        SELECT chunks_cjk.chunk_id
                        FROM chunks_cjk
                        JOIN chunks c ON c.chunk_id = chunks_cjk.chunk_id
                        JOIN documents d ON d.doc_id = c.doc_id
                        WHERE chunks_cjk.text LIKE ? ESCAPE '\\' {scope_filter} {allowed_filter}
                        LIMIT ?
                        """,
                        (
                            f"%{term.replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_')}%",
                            *scope_params,
                            *allowed_params,
                            min(120, fts_pool),
                        ),
                    ).fetchall()
                except sqlite3.OperationalError:
                    break
                for row in rows:
                    # 이미 FTS가 찾은 chunk는 그 순위를 유지하고, 새 후보만 뒤에 붙인다.
                    fts_rank.setdefault(str(row["chunk_id"]), len(fts_rank))

        if not fts_rank:
            return []

        # Stage 2: Fetch only the FTS candidate chunks and compute embedding similarity
        scope_filter, scope_params = _scope_sql(scope_prefixes)
        placeholders = ",".join("?" for _ in fts_rank)
        chunk_rows = conn.execute(
            f"""
            SELECT c.chunk_id, c.doc_id, c.chunk_index, c.text, c.embedding,
                   d.path, d.title, d.source, d.date, d.type, d.url,
                   d.market_relevance, d.metadata_json
            FROM chunks c
            JOIN documents d ON d.doc_id = c.doc_id
            WHERE c.chunk_id IN ({placeholders}) {scope_filter}
            """,
            tuple(fts_rank.keys()) + tuple(scope_params),
        ).fetchall()

        if not chunk_rows:
            return []

        # Compute cosine similarity for each candidate, collect for vector ranking
        vec_scored: list[tuple[float, str, object]] = []
        for row in chunk_rows:
            vec_score = cosine(query_vec, parse_embedding(row["embedding"]))
            vec_scored.append((vec_score, str(row["chunk_id"]), row))
        vec_scored.sort(key=lambda x: x[0], reverse=True)
        vec_rank: dict[str, int] = {cid: i for i, (_, cid, _) in enumerate(vec_scored)}

        # RRF merge + token-overlap tie-breaker; deduplicate to one result per doc
        K = 60
        q_tokens = token_set(q)
        doc_best: dict[str, dict] = {}

        for vec_score, chunk_id, row in vec_scored:
            doc_id = str(row["doc_id"])
            rrf = 1.0 / (K + fts_rank.get(chunk_id, fts_pool)) + 1.0 / (K + vec_rank.get(chunk_id, len(vec_scored)))
            text = str(row["text"] or "")
            title = str(row["title"] or "")
            overlap = len(q_tokens & token_set(f"{title} {text}")) / max(1, len(q_tokens))
            score = rrf + 0.002 * overlap  # overlap is a tiebreaker only

            if doc_id not in doc_best or score > doc_best[doc_id]["score"]:
                try:
                    metadata = json.loads(str(row["metadata_json"] or "{}"))
                except Exception:
                    metadata = {}
                doc_best[doc_id] = {
                    "id": doc_id,
                    "chunkId": chunk_id,
                    "chunkIndex": int(row["chunk_index"]),
                    "path": str(row["path"]),
                    "title": title,
                    "source": str(row["source"]),
                    "date": str(row["date"]),
                    "type": str(row["type"]),
                    "url": str(row["url"]),
                    "score": score,
                    "snippet": text[:700],
                    "metadata": metadata,
                }

        results = sorted(doc_best.values(), key=lambda x: x["score"], reverse=True)
        return results[:limit]
    finally:
        # 서버가 검색마다 이 함수를 호출한다. 닫지 않으면 SQLite 핸들이 쌓이고,
        # Windows에서는 인덱스 파일이 잠긴 채로 남는다.
        conn.close()
