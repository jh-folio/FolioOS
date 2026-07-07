#!/usr/bin/env python3
from __future__ import annotations

import json
import math
import re
import sqlite3
from pathlib import Path


EMBED_DIM = 384
TOKEN_RE = re.compile(r"[A-Za-z0-9가-힣]{2,}")


def normalize_space(text: str) -> str:
    return re.sub(r"\s+", " ", str(text or "")).strip()


def token_set(text: str) -> set[str]:
    return {token.lower() for token in TOKEN_RE.findall(str(text or ""))}


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


def parse_embedding(raw: str) -> list[float]:
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
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS chunks (
            chunk_id TEXT PRIMARY KEY,
            doc_id TEXT NOT NULL,
            chunk_index INTEGER NOT NULL,
            text TEXT NOT NULL,
            embedding_json TEXT NOT NULL,
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
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS file_manifest (
            path TEXT PRIMARY KEY,
            file_signature TEXT NOT NULL DEFAULT '',
            market_relevant INTEGER NOT NULL DEFAULT 0,
            doc_id TEXT NOT NULL DEFAULT '',
            modified_at TEXT NOT NULL DEFAULT ''
        )
        """
    )
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
                "reliabilityTier": doc.get("reliabilityTier", ""),
                "relatedTickers": doc.get("relatedTickers", []) or [],
                "relatedThemes": doc.get("relatedThemes", []) or [],
                "narrativeIds": doc.get("narrativeIds", []) or [],
                "eventId": doc.get("eventId", ""),
                "readable": doc.get("readable", True),
                "pages": doc.get("pages", 0),
                "modifiedAt": doc.get("modifiedAt", ""),
            }
            existing = conn.execute(
                "SELECT metadata_json FROM documents WHERE doc_id = ?",
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
                except sqlite3.OperationalError:
                    pass
            conn.execute("DELETE FROM documents WHERE path = ? AND doc_id <> ?", (str(doc.get("path", "")), doc_id))
            conn.execute(
                """
                INSERT INTO documents (
                    doc_id, path, title, source, date, type, url,
                    market_relevance, metadata_json, updated_at, content
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                    content=excluded.content
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
                ),
            )
            if reuse_chunks:
                continue
            conn.execute("DELETE FROM chunks WHERE doc_id = ?", (doc_id,))
            try:
                conn.execute("DELETE FROM chunks_fts WHERE doc_id = ?", (doc_id,))
            except sqlite3.OperationalError:
                pass
            content = str(doc.get("content") or doc.get("summary") or "")
            for idx, chunk in enumerate(chunk_text(content)):
                chunk_id = f"{doc_id}:{idx:04d}"
                conn.execute(
                    "INSERT INTO chunks (chunk_id, doc_id, chunk_index, text, embedding_json) VALUES (?, ?, ?, ?, ?)",
                    (chunk_id, doc_id, idx, chunk, json.dumps(embed_text(chunk), ensure_ascii=False)),
                )
                try:
                    conn.execute(
                        "INSERT INTO chunks_fts (chunk_id, doc_id, title, source, text) VALUES (?, ?, ?, ?, ?)",
                        (chunk_id, doc_id, str(doc.get("title", "")), str(doc.get("source", "")), chunk),
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
                except sqlite3.OperationalError:
                    pass
            conn.execute(f"DELETE FROM documents WHERE doc_id NOT IN ({placeholders})", tuple(current_ids))
    return {"documents": len(docs), "chunks": chunk_count, "dbPath": str(Path(db_path))}


def read_manifest(db_path: str | Path) -> dict:
    """Returns {path: {fileSignature, marketRelevant, id, modifiedAt}} from SQLite."""
    path = Path(db_path)
    if not path.exists():
        return {}
    conn = connect(path)
    init_db(conn)
    rows = conn.execute(
        "SELECT path, file_signature, market_relevant, doc_id, modified_at FROM file_manifest"
    ).fetchall()
    return {
        str(row["path"]): {
            "fileSignature": str(row["file_signature"]),
            "marketRelevant": bool(row["market_relevant"]),
            "id": str(row["doc_id"]),
            "modifiedAt": str(row["modified_at"]),
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
                "INSERT INTO file_manifest (path, file_signature, market_relevant, doc_id, modified_at)"
                " VALUES (?, ?, ?, ?, ?)",
                [
                    (
                        str(p),
                        str(entry.get("fileSignature", "")),
                        1 if entry.get("marketRelevant") else 0,
                        str(entry.get("id", "")),
                        str(entry.get("modifiedAt", "")),
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
            "reliabilityTier": meta.get("reliabilityTier", ""),
            "relatedTickers": meta.get("relatedTickers", []) or [],
            "relatedThemes": meta.get("relatedThemes", []) or [],
            "narrativeIds": meta.get("narrativeIds", []) or [],
            "eventId": meta.get("eventId", ""),
            "readable": meta.get("readable", True),
            "pages": meta.get("pages", 0),
            "modifiedAt": meta.get("modifiedAt", ""),
            "absolutePath": "",
        }
        doc["content"] = str(row["content"]) if "content" in col_names else ""
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
    path = Path(db_path)
    if not path.exists():
        return []
    conn = connect(path)
    init_db(conn)
    query_vec = embed_text(q)

    # Stage 1: FTS5 — collect candidate chunk_ids with their BM25 rank
    fts_query = sanitize_fts_query(q)
    fts_rank: dict[str, int] = {}  # chunk_id -> 0-based rank (lower = better)
    if fts_query:
        try:
            rows = conn.execute(
                "SELECT chunk_id FROM chunks_fts WHERE chunks_fts MATCH ? ORDER BY bm25(chunks_fts) LIMIT ?",
                (fts_query, fts_pool),
            ).fetchall()
            for rank, row in enumerate(rows):
                fts_rank[str(row["chunk_id"])] = rank
        except sqlite3.OperationalError:
            pass

    if not fts_rank:
        return []

    # Stage 2: Fetch only the FTS candidate chunks and compute embedding similarity
    scope_filter, scope_params = _scope_sql(scope_prefixes)
    placeholders = ",".join("?" for _ in fts_rank)
    chunk_rows = conn.execute(
        f"""
        SELECT c.chunk_id, c.doc_id, c.chunk_index, c.text, c.embedding_json,
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
        vec_score = cosine(query_vec, parse_embedding(str(row["embedding_json"] or "")))
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

