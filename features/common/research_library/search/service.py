"""Document search, grouping, and company listing for news/research documents."""
from pathlib import Path

from features.common.utils import normalize, summarize
from features.common.company_lookup import company_matches_query
from features.common.dataframe_ops import aggregate_counts, sort_records, top_records
from features.daily_briefing.service import NEWS_INBOX_PREFIXES, is_news_document
from features.common.research_library.indexing.research_index import hybrid_search
from features.common.research_library.indexing.service import RESEARCH_DB_PATH


def index_from_documents(index, documents):
    return {
        "generatedAt": index.get("generatedAt", ""),
        "inbox": index.get("inbox", ""),
        "count": len(documents),
        "documents": documents,
    }


def search_documents(index, query="", company="", limit=50, scope="all", **filters):
    q = normalize(query).lower()
    company_q = normalize(company).lower()
    cap = int(limit or 50)

    if q:
        # Text query: hybrid search (FTS5 + embedding RRF) is the sole ranking path.
        scope_prefixes = NEWS_INBOX_PREFIXES if scope == "news" else ()
        hits = hybrid_search(RESEARCH_DB_PATH, q, limit=cap * 2, scope_prefixes=scope_prefixes)
        docs_by_path = {d.get("path", ""): d for d in index.get("documents", [])}
        results = []
        for hit in hits:
            doc = docs_by_path.get(hit.get("path", "")) or {}
            companies = doc.get("companies") or hit.get("metadata", {}).get("companies", [])
            if company_q and not any(
                company_matches_query(c, company_q)
                or company_q in normalize(f"{c.get('name', '')} {c.get('ticker', '')}").lower()
                for c in companies
            ):
                hay = normalize(f"{hit.get('title', '')} {doc.get('content', '')} {hit.get('snippet', '')}").lower()
                if company_q not in hay:
                    continue
            results.append({
                # Fall back to hit fields if the full doc isn't in the in-memory index yet
                "id": hit["id"],
                "path": hit["path"],
                "title": hit["title"],
                "source": hit["source"],
                "date": hit["date"],
                "type": hit["type"],
                "url": hit["url"],
                **doc,
                "score": hit["score"],
                "searchSnippet": hit.get("snippet", ""),
            })
        return results[:cap]

    # No text query: in-memory filter for browsing by company/scope
    rows = []
    for d in index.get("documents", []):
        if scope == "news" and not is_news_document(d):
            continue
        if company_q and not any(
            company_matches_query(c, company_q)
            or company_q in normalize(f"{c.get('name', '')} {c.get('ticker', '')}").lower()
            for c in d.get("companies", [])
        ):
            hay = normalize(f"{d.get('title', '')} {d.get('source', '')}").lower()
            if company_q not in hay:
                continue
        score = d.get("marketRelevance", 0) + d.get("sourceWeight", 0)
        rows.append({**d, "score": score})
    return sort_records(rows, ["score", "date"], descending=True)[:cap]


def list_companies(index):
    rows = []
    company_by_key = {}
    for d in index.get("documents", []):
        for c in d.get("companies", []):
            key = c.get("ticker") or c.get("name")
            if not key:
                continue
            company_by_key.setdefault(key, c)
            rows.append({"key": key, "date": d.get("date", "")})
    counts = aggregate_counts(rows, lambda row: row.get("key", ""), latest_field="date")
    return [{**company_by_key.get(row["key"], {}), "count": row["count"], "latest": row["latest"]} for row in counts]


def group_docs(docs):
    groups = {}
    for d in docs:
        if d.get("type") == "link":
            continue
        sector = (d.get("sectors") or ["Market"])[0]
        companies = [c.get("name", "") for c in (d.get("companies") or []) if c.get("name")]
        # 기사에 언급된 기업을 최대 2개 그룹에 동시 참여시켜 다중 기업 기사의 손실을 줄임
        keys = [f"company:{c}" for c in companies[:2]] if companies else [f"sector:{sector}"]
        doc_score = d.get("marketRelevance", 0) + d.get("sourceWeight", 0)
        for key in keys:
            company = key[len("company:"):] if key.startswith("company:") else ""
            g = groups.setdefault(key, {"sector": sector, "company": company, "docs": [], "score": 0})
            if d not in g["docs"]:
                g["docs"].append(d)
                g["score"] += doc_score
    return sort_records(groups.values(), ["score"], descending=True)


def article_narrative(docs, subject):
    snippets = [summarize(d.get("summary") or d.get("content") or d.get("title"), 2) for d in docs[:4]]
    snippets = [s for s in snippets if s]
    if not snippets:
        return f"{subject} 관련 자료는 제목과 짧은 요약 중심으로 수집되어 있습니다."
    phrases = []
    if snippets:
        phrases.append(f"수집된 기사들은 {snippets[0]}라는 내용을 중심으로 전개됩니다.")
    if len(snippets) > 1:
        phrases.append(f"다른 보도에서는 {snippets[1]}라는 흐름도 확인됩니다.")
    if len(snippets) > 2:
        phrases.append(f"추가 기사들은 {snippets[2]}라는 맥락을 보강합니다.")
    if len(snippets) > 3:
        phrases.append(f"관련 보도는 {snippets[3]}라는 세부 내용까지 연결합니다.")
    return " ".join(phrases)
