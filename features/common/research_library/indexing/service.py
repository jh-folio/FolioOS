"""Document parsing, indexing pipeline, and market-relevance classification."""
import datetime as dt
import hashlib
import json
import re
import threading
from pathlib import Path

from features.common.utils import normalize, now_iso, read_json, write_json, summarize, clean_embedded_sections
from features.common.taxonomy import normalize_tag
from features.common.company_lookup import (
    TRUSTED_SOURCES,
    company_terms,
    company_term_matches,
    find_companies,
    term_in_text,
)
from features.common.dataframe_ops import sort_records
from features.common.research_library.indexing.research_index import (
    hybrid_search,
    load_documents_from_db,
    read_manifest,
    sync_index,
    write_manifest,
)

ROOT = Path(__file__).resolve().parents[4]
DATA_DIR = ROOT / "data"
INBOX_DIR = ROOT / "research-inbox"
PDF_CACHE_DIR = DATA_DIR / "pdf-cache"
RESEARCH_DB_PATH = DATA_DIR / "research-index.sqlite3"

INDEX_LOCK = threading.Lock()

SECTOR_TERMS = {
    # TAG_ALIASES(market_memory)와 동일한 어휘 사용
    "Semiconductors": ["semiconductor", "chip", "memory", "hbm", "gpu", "ai server", "반도체", "메모리", "HBM"],
    "AI": ["artificial intelligence", "AI", "machine learning", "large language model", "인공지능", "생성형 AI"],
    "Data Centers": ["data center", "hyperscaler", "데이터센터"],
    "Battery": ["battery", "EV battery", "배터리", "2차전지", "리튬"],
    # "energy" 단독 제거 — 기술 기사의 "energy efficiency/consumption"에서 오분류 발생
    # "gas"/"oil" 단독 제거 — 복합어로만 매칭
    "Energy": ["crude oil", "oil price", "natural gas", "oil refinery", "원유", "유가", "정유", "원전"],
    "Defense": ["defense", "aerospace", "방산", "군수"],
    # "bank"/"은행" 단독 제거 — "central bank", "bank analyst" 등으로 기술주에 오분류됨
    # bond/yield/금리/채권은 IMPACT_TERMS에서 이미 처리 — Financials에서 제거
    "Financials": ["investment bank", "brokerage", "은행주", "증권사", "보험사", "금융주"],
    "Automobiles": ["automaker", "vehicle", "automotive", "자동차", "전기차", "완성차"],
}
IMPACT_TERMS = {
    "매출 성장": ["revenue", "sales", "demand", "order", "수요", "매출", "수주"],
    "마진": ["margin", "cost", "pricing", "profit", "마진", "원가", "이익"],
    "규제": ["regulation", "tariff", "sanction", "규제", "관세", "제재"],
    "금리": ["rate", "yield", "fed", "fomc", "금리", "연준", "국채"],
    "환율": ["dollar", "currency", "fx", "원달러", "환율"],
    "공급망": ["supply", "inventory", "shortage", "공급망", "재고"],
    "수급": ["volume", "foreign buying", "거래대금", "외국인", "기관", "순매수", "순매도"],
}
MARKET_TERMS = ["stock", "stocks", "shares", "market", "earnings", "revenue", "guidance", "analyst", "fed", "yield", "oil", "AI", "주식", "증시", "주가", "실적", "공시", "거래대금", "외국인", "기관", "코스피", "코스닥", "반도체", "금리", "환율", "유가"]
GENERAL_NOISE = ["sports", "celebrity", "weather", "스포츠", "연예", "날씨", "맛집", "여행"]
TEXT_EXTENSIONS = {".txt", ".md", ".html", ".htm", ".json", ".csv"}

RSS_MARKET_TERMS = [
    "주가", "증시", "코스피", "코스닥", "상장", "공시", "실적", "영업이익", "매출", "가이던스",
    "투자", "외국인", "기관", "수급", "반도체", "AI", "인공지능", "데이터센터", "배터리",
    "2차전지", "자동차", "전기차", "방산", "금리", "환율", "유가", "관세", "규제", "정책",
    "정부", "국회", "산업", "공급망", "수출", "목표주가", "밸류에이션",
]
RSS_STRONG_MARKET_TERMS = ["주가", "증시", "코스피", "코스닥", "상장", "공시", "실적", "영업이익", "가이던스", "기관", "수급", "순매수", "순매도", "반도체", "배터리", "전기차", "방산", "금리", "환율", "유가", "관세", "규제", "정책", "목표주가", "밸류에이션"]
RSS_COMPANY_HINTS = ["삼성", "하이닉스", "현대차", "기아", "LG", "SK", "네이버", "카카오", "셀트리온", "두산", "한화", "포스코", "롯데", "CJ", "HD현대", "엔비디아", "테슬라", "애플", "브로드컴", "델"]
RSS_NOISE_TERMS = ["맛집", "외식", "랍스터", "홈다이닝", "여행", "패션", "뷰티", "화장품", "액세서리", "다이소", "빵덕후", "쇼핑백", "연예", "스포츠", "날씨", "할인", "세일", "가성비", "장바구니", "프라이스", "선물세트"]


def rss_item_is_market_relevant(title, description, url):
    text = normalize(f"{title} {description} {url}").lower()
    if re.search(r"^\s*\[포토\]", title or ""):
        return False
    relevant = sum(1 for term in RSS_MARKET_TERMS if term.lower() in text)
    strong = sum(1 for term in RSS_STRONG_MARKET_TERMS if term.lower() in text)
    company = any(term.lower() in text for term in RSS_COMPANY_HINTS)
    noise = sum(1 for term in RSS_NOISE_TERMS if term.lower() in text)
    is_kr = any(domain in (url or "") for domain in ["hankyung.com", "mk.co.kr", "einfomax.co.kr"]) or any(src in text for src in ["한국경제", "매일경제", "연합인포맥스"]) or bool(re.search(r"[가-힣]", text))
    if is_kr and noise >= 2 and strong < 2:
        return False
    return relevant >= 1 or company or not is_kr


def find_terms(text, mapping):
    hay = normalize(text).lower()
    out = []
    for label, terms in mapping.items():
        if any(term_in_text(t, hay) for t in terms):
            out.append(label)
    return out


def source_weight(source):
    return TRUSTED_SOURCES.get(source, 5)


def infer_source(text, path):
    hay = f"{text} {path}".lower()
    for source in TRUSTED_SOURCES:
        if source.lower() in hay:
            return source
    return "User Archive"


def canonical_news_source(source, url="", title=""):
    hay = normalize(f"{url} {title}").lower()
    if "barrons.com" in hay or "barron's" in hay or "barrons" in hay:
        return "Barron's"
    if "wsj.com" in hay or "wall street journal" in hay:
        return "WSJ"
    if "marketwatch.com" in hay:
        return "MarketWatch"
    if "cnbc.com" in hay:
        return "CNBC"
    if "einfomax.co.kr" in hay:
        return "연합인포맥스"
    if "yna.co.kr" in hay:
        return "연합뉴스"
    if source == "Dow Jones":
        return "Dow Jones"
    if source == "연합뉴스":
        return "연합뉴스"
    return source


def market_relevance(text, path=""):
    hay = normalize(text).lower()
    if "research-inbox/rss" in str(path).replace("\\", "/").lower():
        title = str(text).split("\n", 1)[0][:220]
        if not rss_item_is_market_relevant(title, text, ""):
            return 0, False
    score = 0
    score += len(find_companies(text)) * 12
    score += sum(1 for t in MARKET_TERMS if term_in_text(t, hay)) * 4
    score += len(find_terms(text, SECTOR_TERMS)) * 3
    score += len(find_terms(text, IMPACT_TERMS)) * 3
    score -= sum(1 for t in GENERAL_NOISE if term_in_text(t, hay)) * 5
    if "rss" not in str(path).lower():
        return 100, True
    return score, score >= 12


def _frontmatter_value(value):
    text = str(value or "").strip()
    if not text:
        return ""
    if text == "null":
        return ""
    try:
        parsed = json.loads(text)
        if isinstance(parsed, (str, int, float)):
            return str(parsed)
        return parsed
    except Exception:
        return text.strip("\"'")


def parse_frontmatter(raw):
    m = re.match(r"^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$", raw)
    if not m:
        return {}, raw
    meta = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            key = k.strip()
            meta[key] = _frontmatter_value(v)
    aliases = {
        "collection_status": "collectionStatus",
        "source_type": "sourceType",
        "normalized_url": "normalizedUrl",
        "published_at_kst": "publishedAtKst",
        "collected_at_kst": "collectedAtKst",
        "query_source": "querySource",
        "relevance_score": "relevanceScore",
        "search_score": "searchScore",
        "reliability_tier": "reliabilityTier",
        "related_tickers": "relatedTickers",
        "related_themes": "relatedThemes",
        "markets": "markets",
        "narrative_ids": "narrativeIds",
        "event_id": "eventId",
    }
    for src, dest in aliases.items():
        if src in meta and dest not in meta:
            meta[dest] = meta[src]
    return meta, m.group(2)


def parse_rssarchive_markdown(raw):
    front_meta, front_body = parse_frontmatter(raw)
    if front_meta:
        title = str(front_meta.get("title") or "").strip()
        summary_match = re.search(r"##\s+Summary\s*\n+([\s\S]*?)(?:\n##\s+|\Z)", front_body, re.I)
        full_match = re.search(r"##\s+Full Text\s*\n+([\s\S]*?)(?:\n##\s+|\Z)", front_body, re.I)
        summary = normalize(summary_match.group(1)) if summary_match else ""
        full_text = normalize(full_match.group(1)) if full_match else ""
        placeholder = "Full text is not saved by default"
        if placeholder.lower() in full_text.lower():
            full_text = ""
        return {
            "title": title,
            "source": canonical_news_source(front_meta.get("source", ""), front_meta.get("url", ""), title),
            "url": front_meta.get("url", ""),
            "normalizedUrl": front_meta.get("normalizedUrl", ""),
            "date": str(front_meta.get("date") or front_meta.get("publishedAtKst") or "")[:10],
            "collectionStatus": front_meta.get("collectionStatus", ""),
            "collector": front_meta.get("collector", ""),
            "sourceType": front_meta.get("sourceType", ""),
            "query": front_meta.get("query", ""),
            "querySource": front_meta.get("querySource", ""),
            "reliabilityTier": front_meta.get("reliabilityTier", ""),
            "markets": front_meta.get("markets") or [],
            "summary": summary,
        }, f"# {title}\n\n{full_text or summary or front_body}"
    fields = {}
    current = None
    for line in raw.splitlines():
        m = re.match(r"^-\s+([^:]+):\s*(.*)$", line)
        if m:
            current = m.group(1).strip()
            fields[current] = m.group(2).strip()
        elif current and line.startswith("  "):
            fields[current] += "\n" + line.strip()
    if fields.get("Title") or fields.get("URL"):
        title = fields.get("Title", "")
        # 과거 upgrade 경로가 새 포맷 body 전체를 Summary/Description 필드에
        # 밀어넣은 파일이 있어, 임베디드 섹션 마커를 정리하고 Summary 본문만 쓴다.
        summary = clean_embedded_sections(fields.get("Summary", "") or fields.get("Description", ""))
        full_text = clean_embedded_sections(fields.get("Full Text", ""))
        body = full_text or summary
        meta = {
            "title": title,
            "source": canonical_news_source(fields.get("Source", ""), fields.get("URL", ""), title),
            "url": fields.get("URL", ""),
            "date": fields.get("Timestamp (UTC+9)", "")[:10],
            "collectionStatus": fields.get("Collection Status", ""),
            "summary": summary,
        }
        return meta, f"# {title}\n\n{body}"
    return None, None


def title_from_body(body, fallback):
    for line in str(body).splitlines():
        line = line.strip()
        if line.startswith("#"):
            return line.lstrip("#").strip()[:160]
        if len(line) > 20:
            return line[:160]
    return fallback


def read_pdf(path):
    stat = path.stat()
    key = hashlib.sha256(f"{path}:{stat.st_size}:{stat.st_mtime}".encode()).hexdigest()[:16]
    cache = PDF_CACHE_DIR / f"{key}.json"
    cached = read_json(cache, None)
    if cached:
        return cached.get("text", ""), cached.get("pages", 0)
    try:
        from pypdf import PdfReader
        reader = PdfReader(str(path))
        pages = []
        for page in reader.pages:
            pages.append(page.extract_text() or "")
        text = normalize("\n".join(pages))[:900000]
        write_json(cache, {"text": text, "pages": len(reader.pages), "extractedAt": now_iso()})
        return text, len(reader.pages)
    except Exception as exc:
        write_json(cache, {"text": "", "pages": 0, "error": str(exc), "extractedAt": now_iso()})
        return "", 0


def file_type(path):
    parts = {p.lower() for p in path.parts}
    if "filings" in parts:
        return "filing"
    if "reports" in parts:
        return "report"
    if "links" in parts:
        return "link"
    return "article"


def parse_links(text):
    return sorted(set(re.findall(r"https?://[^\s)]+", str(text))))


def file_signature(path):
    stat = path.stat()
    return f"{stat.st_size}:{stat.st_mtime_ns}"


def document_content_hash(content):
    return hashlib.sha256(str(content or "").encode("utf-8", errors="replace")).hexdigest()


def should_index_file(path):
    rel = path.relative_to(ROOT).as_posix().lower()
    if rel == "research-inbox/rss/.state.json":
        return False
    return True


def build_document(path):
    rel = path.relative_to(ROOT).as_posix()
    ext = path.suffix.lower()
    stat = path.stat()
    signature = file_signature(path)
    raw = ""
    meta = {}
    readable = True
    pages = 0
    if ext == ".pdf":
        body, pages = read_pdf(path)
        raw = body
    elif ext in TEXT_EXTENSIONS:
        raw = path.read_text(encoding="utf-8", errors="replace")
        meta, body = parse_frontmatter(raw)
        if not meta:
            parsed_meta, parsed_body = parse_rssarchive_markdown(raw)
            if parsed_meta:
                meta, body = parsed_meta, parsed_body
        raw = body
    else:
        raw = f"{ext} files are tracked by metadata only."
        readable = False
    body = normalize(raw)
    title = meta.get("title") or title_from_body(raw, path.stem)
    url = meta.get("url") or (parse_links(raw)[0] if parse_links(raw) else "")
    date = meta.get("date") or dt.datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d")
    source = canonical_news_source(meta.get("source") or infer_source(f"{title} {body}", rel), url, title) or "User Archive"
    companies = find_companies(f"{title} {body}")
    sectors = sorted(set(normalize_tag(t) for t in ([c["sector"] for c in companies] + find_terms(f"{title} {body}", SECTOR_TERMS))))
    impact = [normalize_tag(t) for t in find_terms(f"{title} {body}", IMPACT_TERMS)]
    score, relevant = market_relevance(f"{title} {body}", rel)
    if rel.lower().startswith("research-inbox/rss/"):
        rss_summary = meta.get("summary") or meta.get("description") or body[:700]
        if not rss_item_is_market_relevant(title, rss_summary, url):
            score, relevant = 0, False
    return {
        "id": hashlib.sha256(f"{rel}:{stat.st_mtime}:{title}".encode()).hexdigest()[:16],
        "title": title,
        "path": rel,
        "fileSignature": signature,
        "contentHash": document_content_hash(body),
        "absolutePath": str(path),
        "type": file_type(path),
        "source": source,
        "sourceWeight": source_weight(source),
        "url": url,
        "normalizedUrl": meta.get("normalizedUrl", ""),
        "collector": meta.get("collector", ""),
        "sourceType": meta.get("sourceType", ""),
        "query": meta.get("query", ""),
        "querySource": meta.get("querySource", ""),
        "reliabilityTier": meta.get("reliabilityTier", ""),
        "relatedTickers": meta.get("relatedTickers", []) or [],
        "relatedThemes": meta.get("relatedThemes", []) or [],
        "narrativeIds": meta.get("narrativeIds", []) or [],
        "eventId": meta.get("eventId", ""),
        "collectionStatus": meta.get("collectionStatus", ""),
        "date": date[:10],
        "modifiedAt": dt.datetime.fromtimestamp(stat.st_mtime, dt.timezone.utc).isoformat(),
        "readable": readable,
        "companies": companies,
        "sectors": sectors,
        "impactTags": impact,
        "links": parse_links(raw),
        "marketRelevance": score,
        "marketRelevant": relevant,
        "summary": meta.get("summary") or summarize(body, 3),
        "wordCount": len(re.findall(r"[A-Za-z0-9가-힣]+", body)),
        "content": body,
        "pages": pages,
    }


def build_index(incremental=True, progress=None):
    with INDEX_LOCK:
        if incremental:
            existing_manifest = read_manifest(RESEARCH_DB_PATH)
            existing_docs = {
                doc["path"]: doc
                for doc in load_documents_from_db(RESEARCH_DB_PATH)
                if doc.get("path")
            }
        else:
            existing_manifest = {}
            existing_docs = {}
        file_manifest = {}
        docs = []
        scanned = 0
        reused = 0
        rebuilt = 0
        skipped = 0
        removed = 0
        seen_paths = set()
        files = [path for path in INBOX_DIR.rglob("*") if path.is_file() and should_index_file(path)]
        total_files = len(files)
        if progress:
            progress(f"자료 폴더를 스캔했습니다. 파일 {total_files}개를 확인합니다.", progress=5)
        for path in files:
            scanned += 1
            if progress and (scanned == 1 or scanned % 50 == 0 or scanned == total_files):
                pct = 5 + int((scanned / max(total_files, 1)) * 65)
                progress(f"인덱싱 중: {scanned}/{total_files} 파일 확인", progress=min(pct, 70))
            rel = path.relative_to(ROOT).as_posix()
            seen_paths.add(rel)
            if not path.is_file():
                continue
            previous = existing_docs.get(rel)
            previous_manifest = existing_manifest.get(rel, {}) if isinstance(existing_manifest.get(rel, {}), dict) else {}
            try:
                signature = file_signature(path)
            except Exception:
                continue
            if incremental and previous_manifest.get("fileSignature") == signature:
                if previous_manifest.get("marketRelevant") and previous:
                    docs.append(previous)
                    reused += 1
                else:
                    skipped += 1
                file_manifest[rel] = previous_manifest
                continue
            doc = build_document(path)
            rebuilt += 1
            file_manifest[rel] = {
                "fileSignature": doc.get("fileSignature", signature),
                "marketRelevant": bool(doc.get("marketRelevant")),
                "id": doc.get("id", ""),
                "modifiedAt": doc.get("modifiedAt", ""),
            }
            if doc["marketRelevant"]:
                docs.append(doc)
        if existing_docs:
            removed = len(set(existing_docs) - seen_paths)
        docs = sort_records(docs, ["date", "sourceWeight", "marketRelevance"], descending=True)
        index = {
            "generatedAt": now_iso(),
            "inbox": str(INBOX_DIR),
            "count": len(docs),
            "documents": docs,
            "fileManifest": file_manifest,
            "incremental": {
                "enabled": bool(incremental),
                "scanned": scanned,
                "reused": reused,
                "rebuilt": rebuilt,
                "skippedIrrelevant": skipped,
                "removed": removed,
            },
        }
        if progress:
            progress("SQLite/FTS 검색 인덱스를 동기화하는 중입니다.", progress=82)
        try:
            index["sqlite"] = sync_index(RESEARCH_DB_PATH, index)
        except Exception as exc:
            index["sqlite"] = {"error": str(exc), "dbPath": str(RESEARCH_DB_PATH)}
        try:
            write_manifest(RESEARCH_DB_PATH, file_manifest)
        except Exception as exc:
            index.setdefault("sqlite", {})["manifestError"] = str(exc)
        # Write slim status JSON — no documents or fileManifest
        write_json(DATA_DIR / "index.json", {
            "generatedAt": index["generatedAt"],
            "inbox": str(INBOX_DIR),
            "count": index["count"],
            "incremental": index["incremental"],
            "sqlite": index.get("sqlite", {}),
        })
        if progress:
            progress(f"인덱싱 완료: 문서 {len(docs)}건, 재사용 {reused}건, 재처리 {rebuilt}건", progress=98)
        return index


def list_indexed_documents(company: str = "", limit: int = 50, offset: int = 0):
    """Return paginated document list with company tags for the index status UI."""
    import json as _json
    import sqlite3

    if not RESEARCH_DB_PATH.exists():
        return {"total": 0, "documents": [], "generatedAt": ""}

    conn = sqlite3.connect(str(RESEARCH_DB_PATH))
    try:
        status = read_json(DATA_DIR / "index.json", {})
        generated_at = status.get("generatedAt", "")

        q_lower = company.strip().lower()
        rows = conn.execute(
            "SELECT path, title, date, metadata_json FROM documents WHERE metadata_json IS NOT NULL ORDER BY date DESC, path"
        ).fetchall()

        results = []
        for path, title, date, meta_json in rows:
            try:
                meta = _json.loads(meta_json)
            except Exception:
                continue
            companies = meta.get("companies") or []
            if q_lower:
                match = any(
                    q_lower in (c.get("ticker") or "").lower()
                    or q_lower in (c.get("name") or "").lower()
                    for c in companies
                )
                if not match:
                    continue
            results.append({
                "path": path,
                "title": title or path.rsplit("/", 1)[-1],
                "date": date or "",
                "companies": [
                    {"ticker": c.get("ticker", ""), "name": c.get("name", ""), "cik": c.get("cik", "")}
                    for c in companies
                ],
            })

        total = len(results)
        page = results[offset: offset + limit]
        return {"total": total, "documents": page, "generatedAt": generated_at}
    finally:
        conn.close()


def load_index():
    # Try SQLite first; fall back to legacy JSON during first migration run
    if RESEARCH_DB_PATH.exists():
        docs = load_documents_from_db(RESEARCH_DB_PATH)
        if docs and any(d.get("content") for d in docs[:10]):
            status = read_json(DATA_DIR / "index.json", {})
            return {
                "generatedAt": status.get("generatedAt", ""),
                "inbox": str(INBOX_DIR),
                "count": len(docs),
                "documents": docs,
                "incremental": status.get("incremental", {}),
                "sqlite": status.get("sqlite", {}),
            }
    # Legacy JSON fallback (pre-migration or SQLite not yet populated)
    idx = read_json(DATA_DIR / "index.json", None)
    if idx and idx.get("documents"):
        return idx
    return build_index()
