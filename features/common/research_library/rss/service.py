"""RSS archive reading, filtering, feed pagination, merge export, and import."""
import datetime as dt
import os
import re
import sqlite3
import subprocess
import sys
from pathlib import Path

from features.common.utils import normalize, clean_brief_text, clean_embedded_sections, read_json
from features.common.market_calendar import infer_doc_markets
from features.common.dataframe_ops import filter_archive_records
from features.common.research_library.indexing.service import (
    RESEARCH_DB_PATH,
    canonical_news_source,
    infer_source,
    parse_rssarchive_markdown,
    rss_item_is_market_relevant,
    build_index,
)

ROOT = Path(__file__).resolve().parents[4]
RSS_INBOX_DIR = ROOT / "research-inbox" / "rss"
RSS_ARCHIVE_MODULE = "features.common.research_library.rss.rss_archive"

RSS_DATETIME_FORMATS = (
    "%Y-%m-%d %H:%M:%S",
    "%Y-%m-%d %H:%M",
    "%Y-%m-%dT%H:%M",
    "%Y-%m-%dT%H:%M:%S",
    "%Y-%m-%d %H-%M-%S",
)
RSS_FILENAME_TS_FORMAT = "%Y-%m-%d %H-%M-%S"
RSS_DISPLAY_TS_FORMAT = "%Y-%m-%d %H:%M:%S"
MAX_RSS_LIMIT = 200
RSS_CACHE_TABLE = "rss_feed_items"
RSS_CACHE_REFRESH_TTL_SECONDS = int(os.environ.get("RSS_CACHE_REFRESH_TTL_SECONDS", "30") or 30)
_RSS_CACHE_LAST_REFRESH = 0.0
_RSS_CACHE_LAST_STATS = {"files": 0, "updated": 0, "deleted": 0, "skipped": False}


def response_tail(text, lines=30):
    rows = [line for line in str(text or "").splitlines() if line.strip()]
    return "\n".join(rows[-lines:])


def parse_feed_datetime(value):
    text = str(value or "").strip()
    if not text:
        return None
    for fmt in RSS_DATETIME_FORMATS:
        try:
            return dt.datetime.strptime(text, fmt)
        except ValueError:
            continue
    return None


def parse_archive_filename(path):
    parts = path.stem.split(" - ", 2)
    ts_text = parts[0] if len(parts) > 0 else ""
    media = parts[1] if len(parts) > 1 else ""
    title = parts[2] if len(parts) > 2 else path.stem
    parsed = None
    if ts_text:
        try:
            parsed = dt.datetime.strptime(ts_text, RSS_FILENAME_TS_FORMAT)
        except ValueError:
            parsed = None
    return ts_text, parsed, media, title


def archive_item(path):
    raw = path.read_text(encoding="utf-8", errors="replace")
    meta, body = parse_rssarchive_markdown(raw)
    ts_text, parsed_ts, media, title_from_name = parse_archive_filename(path)
    timestamp = meta.get("date", "") if meta else ""
    if timestamp and len(timestamp) == 10 and parsed_ts:
        timestamp = parsed_ts.strftime(RSS_DISPLAY_TS_FORMAT)
    elif parsed_ts and not timestamp:
        timestamp = parsed_ts.strftime(RSS_DISPLAY_TS_FORMAT)
    title = (meta or {}).get("title") or title_from_name or path.stem
    description = normalize((meta or {}).get("summary") or (meta or {}).get("description") or "")
    if not description:
        description = normalize(body.replace(f"# {title}", "", 1) if body else "")
    description = clean_brief_text(description, 520)
    raw_markets = (meta or {}).get("markets")
    markets = infer_doc_markets({
        "markets": raw_markets if isinstance(raw_markets, list) else [],
        "market": ",".join(raw_markets) if isinstance(raw_markets, list) else str(raw_markets or ""),
        "title": title,
        "summary": description,
        "content": description,
        "url": (meta or {}).get("url", ""),
        "source": canonical_news_source((meta or {}).get("source") or media or infer_source(f"{title} {description}", path.name), (meta or {}).get("url", ""), title) or "User Archive",
    })
    return {
        "filename": path.name,
        "title": title,
        "timestamp": timestamp,
        "timestampSort": (parse_feed_datetime(timestamp) or parsed_ts or dt.datetime.min).isoformat(),
        "url": (meta or {}).get("url", ""),
        "normalizedUrl": (meta or {}).get("normalizedUrl", ""),
        "description": description,
        "media": canonical_news_source((meta or {}).get("source") or media or infer_source(f"{title} {description}", path.name), (meta or {}).get("url", ""), title) or "User Archive",
        "collector": (meta or {}).get("collector", ""),
        "sourceType": (meta or {}).get("sourceType", ""),
        "collectionStatus": (meta or {}).get("collectionStatus", ""),
        "reliabilityTier": (meta or {}).get("reliabilityTier", ""),
        "markets": markets,
        "market": ",".join(markets),
    }


def ensure_rss_cache(conn):
    conn.execute(
        f"""
        CREATE TABLE IF NOT EXISTS {RSS_CACHE_TABLE} (
            filename TEXT PRIMARY KEY,
            path TEXT NOT NULL,
            size INTEGER NOT NULL,
            mtime_ns INTEGER NOT NULL,
            title TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            timestamp_sort TEXT NOT NULL,
            url TEXT NOT NULL,
            description TEXT NOT NULL,
            media TEXT NOT NULL,
            normalized_url TEXT NOT NULL DEFAULT '',
            collector TEXT NOT NULL DEFAULT '',
            source_type TEXT NOT NULL DEFAULT '',
            collection_status TEXT NOT NULL DEFAULT '',
            reliability_tier TEXT NOT NULL DEFAULT '',
            markets TEXT NOT NULL DEFAULT '',
            visible INTEGER NOT NULL,
            parsed_at TEXT NOT NULL
        )
        """
    )
    existing_cols = {row[1] for row in conn.execute(f"PRAGMA table_info({RSS_CACHE_TABLE})").fetchall()}
    for col, ddl in {
        "normalized_url": "TEXT NOT NULL DEFAULT ''",
        "collector": "TEXT NOT NULL DEFAULT ''",
        "source_type": "TEXT NOT NULL DEFAULT ''",
        "collection_status": "TEXT NOT NULL DEFAULT ''",
        "reliability_tier": "TEXT NOT NULL DEFAULT ''",
        "markets": "TEXT NOT NULL DEFAULT ''",
    }.items():
        if col not in existing_cols:
            conn.execute(f"ALTER TABLE {RSS_CACHE_TABLE} ADD COLUMN {col} {ddl}")
    conn.execute(f"CREATE INDEX IF NOT EXISTS idx_rss_feed_visible_time ON {RSS_CACHE_TABLE}(visible, timestamp_sort DESC)")
    conn.execute(f"CREATE INDEX IF NOT EXISTS idx_rss_feed_source_time ON {RSS_CACHE_TABLE}(media, timestamp_sort DESC)")


def _repair_cached_media(conn):
    """Repair source labels written by older canonicalization rules."""
    cursor = conn.execute(
        f"""UPDATE {RSS_CACHE_TABLE}
            SET media = '연합뉴스'
            WHERE media IN ('', 'User Archive')
              AND (LOWER(url) LIKE '%yna.co.kr%' OR filename LIKE '% - 연합뉴스 - %')"""
    )
    return max(0, int(cursor.rowcount or 0))


_RSS_CACHE_MEDIA_REPAIRED = False


def _connect_cache():
    global _RSS_CACHE_MEDIA_REPAIRED
    RESEARCH_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    # 인덱싱/수집 작업이 같은 DB에 길게 쓰는 동안에도 피드 조회가 5초 기본
    # 타임아웃으로 실패하지 않도록 대기 시간을 늘리고 WAL을 사용한다.
    conn = sqlite3.connect(str(RESEARCH_DB_PATH), timeout=30)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA busy_timeout=30000")
        conn.execute("PRAGMA journal_mode=WAL")
    except sqlite3.OperationalError:
        pass  # 다른 프로세스가 쓰기 중이면 기본 저널 모드로 계속 진행한다.
    ensure_rss_cache(conn)
    # media 보정은 쓰기 잠금이 필요하므로 프로세스당 1회만 시도하고,
    # 잠금 충돌 시 조회 경로를 막지 않고 다음 연결에서 재시도한다.
    if not _RSS_CACHE_MEDIA_REPAIRED:
        try:
            if _repair_cached_media(conn):
                conn.commit()
            _RSS_CACHE_MEDIA_REPAIRED = True
        except sqlite3.OperationalError:
            pass
    return conn


def _archive_item_for_cache(path):
    item = archive_item(path)
    visible = rss_item_is_market_relevant(item["title"], item["description"], item["url"])
    return item, visible


def _row_to_item(row):
    return {
        "filename": row["filename"],
        "title": row["title"],
        "timestamp": row["timestamp"],
        "timestampSort": row["timestamp_sort"],
        "url": row["url"],
        "normalizedUrl": row["normalized_url"],
        # 캐시는 파일 mtime 기준 증분 갱신이라, 과거에 오염된 설명이 남아 있을 수 있어
        # 읽는 시점에 임베디드 섹션 마커를 정리한다.
        "description": clean_brief_text(clean_embedded_sections(row["description"]), 520),
        "media": row["media"],
        "collector": row["collector"],
        "sourceType": row["source_type"],
        "collectionStatus": row["collection_status"],
        "reliabilityTier": row["reliability_tier"],
        "markets": [token for token in str(row["markets"] or "").split(",") if token],
        "market": row["markets"],
    }


def _rss_row_dedupe_key(row):
    normalized_url = str(row["normalized_url"] or "").strip().lower()
    url = str(row["url"] or "").strip().lower()
    if normalized_url:
        return f"url:{normalized_url}"
    if url:
        return f"url:{url}"
    title = " ".join(str(row["title"] or "").strip().lower().split())
    media = " ".join(str(row["media"] or "").strip().lower().split())
    description = " ".join(str(row["description"] or "").strip().lower().split())[:180]
    return f"text:{media}:{title}:{description}"


def _dedupe_rss_rows(rows):
    seen = set()
    deduped = []
    for row in rows:
        key = _rss_row_dedupe_key(row)
        if key in seen:
            continue
        seen.add(key)
        deduped.append(row)
    return deduped


def _cache_table_exists():
    if not RESEARCH_DB_PATH.exists():
        return False
    try:
        with sqlite3.connect(str(RESEARCH_DB_PATH), timeout=30) as conn:
            row = conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
                (RSS_CACHE_TABLE,),
            ).fetchone()
            return bool(row)
    except Exception:
        return False


def refresh_rss_feed_cache(progress=None, force=False):
    """Incrementally sync RSS Markdown metadata into research-index.sqlite3.

    The feed UI needs only metadata and a short description. Reading every
    Markdown file on each page request gets slow as the archive grows, so this
    cache reparses only new/changed files and lets feed pagination run in SQL.
    """
    global _RSS_CACHE_LAST_REFRESH, _RSS_CACHE_LAST_STATS
    now_ts = dt.datetime.now().timestamp()
    if (
        not force
        and _RSS_CACHE_LAST_REFRESH
        and now_ts - _RSS_CACHE_LAST_REFRESH < RSS_CACHE_REFRESH_TTL_SECONDS
        and _cache_table_exists()
    ):
        return {**_RSS_CACHE_LAST_STATS, "skipped": True}

    if not RSS_INBOX_DIR.exists():
        _RSS_CACHE_LAST_REFRESH = now_ts
        _RSS_CACHE_LAST_STATS = {"files": 0, "updated": 0, "deleted": 0, "skipped": False}
        return {"files": 0, "updated": 0, "deleted": 0}

    files = [p for p in RSS_INBOX_DIR.iterdir() if p.is_file() and p.suffix.lower() == ".md"]
    by_name = {p.name: p for p in files}
    now = dt.datetime.now().isoformat(timespec="seconds")
    updated = 0
    deleted = 0
    with _connect_cache() as conn:
        existing = {
            row["filename"]: row
            for row in conn.execute(f"SELECT filename, size, mtime_ns FROM {RSS_CACHE_TABLE}")
        }
        missing = set(existing) - set(by_name)
        for filename in missing:
            conn.execute(f"DELETE FROM {RSS_CACHE_TABLE} WHERE filename = ?", (filename,))
            deleted += 1
        for idx, path in enumerate(files, 1):
            stat = path.stat()
            previous = existing.get(path.name)
            if previous and int(previous["size"]) == stat.st_size and int(previous["mtime_ns"]) == stat.st_mtime_ns:
                continue
            try:
                item, visible = _archive_item_for_cache(path)
            except Exception:
                ts_text, parsed_ts, media, title_from_name = parse_archive_filename(path)
                timestamp = parsed_ts.strftime(RSS_DISPLAY_TS_FORMAT) if parsed_ts else ts_text
                item = {
                    "filename": path.name,
                    "title": title_from_name or path.stem,
                    "timestamp": timestamp,
                    "timestampSort": (parsed_ts or dt.datetime.min).isoformat(),
                    "url": "",
                    "description": "",
                    "media": canonical_news_source(media, "", title_from_name) or media or "User Archive",
                }
                visible = False
            conn.execute(
                f"""
                INSERT INTO {RSS_CACHE_TABLE}
                    (filename, path, size, mtime_ns, title, timestamp, timestamp_sort, url, description, media,
                     normalized_url, collector, source_type, collection_status, reliability_tier, markets, visible, parsed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(filename) DO UPDATE SET
                    path=excluded.path,
                    size=excluded.size,
                    mtime_ns=excluded.mtime_ns,
                    title=excluded.title,
                    timestamp=excluded.timestamp,
                    timestamp_sort=excluded.timestamp_sort,
                    url=excluded.url,
                    description=excluded.description,
                    media=excluded.media,
                    normalized_url=excluded.normalized_url,
                    collector=excluded.collector,
                    source_type=excluded.source_type,
                    collection_status=excluded.collection_status,
                    reliability_tier=excluded.reliability_tier,
                    markets=excluded.markets,
                    visible=excluded.visible,
                    parsed_at=excluded.parsed_at
                """,
                (
                    path.name,
                    str(path),
                    stat.st_size,
                    stat.st_mtime_ns,
                    item.get("title", ""),
                    item.get("timestamp", ""),
                    item.get("timestampSort", ""),
                    item.get("url", ""),
                    item.get("description", ""),
                    item.get("media", ""),
                    item.get("normalizedUrl", ""),
                    item.get("collector", ""),
                    item.get("sourceType", ""),
                    item.get("collectionStatus", ""),
                    str(item.get("reliabilityTier", "")),
                    ",".join(item.get("markets") or []),
                    1 if visible else 0,
                    now,
                ),
            )
            updated += 1
            # 대량 변경(예: 아카이브 일괄 수리) 시 쓰기 잠금을 오래 붙잡지 않도록
            # 주기적으로 커밋해 다른 요청이 끼어들 수 있게 한다.
            if updated % 200 == 0:
                conn.commit()
            if progress and updated % 250 == 0:
                progress(f"RSS 피드 캐시 갱신 중입니다. {idx}/{len(files)}개 확인", progress=70)
        conn.commit()
    _RSS_CACHE_LAST_REFRESH = now_ts
    _RSS_CACHE_LAST_STATS = {"files": len(files), "updated": updated, "deleted": deleted, "skipped": False}
    return dict(_RSS_CACHE_LAST_STATS)


def rss_archive_file_visible(path):
    item = archive_item(path)
    return rss_item_is_market_relevant(item["title"], item["description"], item["url"])


def list_archive_files():
    if not RSS_INBOX_DIR.exists():
        return []
    files = [p for p in RSS_INBOX_DIR.iterdir() if p.is_file() and p.suffix.lower() == ".md"]
    files.sort(key=lambda p: parse_archive_filename(p)[1] or dt.datetime.min, reverse=True)
    return files


def normalize_feed_range(qs):
    start_value = qs.get("start", [""])[0].strip()
    end_value = qs.get("end", [""])[0].strip()
    start_dt = parse_feed_datetime(start_value)
    end_dt = parse_feed_datetime(end_value)
    if end_dt and re.match(r"^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}$", end_value):
        end_dt = end_dt + dt.timedelta(seconds=59)
    return start_value, end_value, start_dt, end_dt


def archive_media(path):
    item = archive_item(path)
    media = item.get("media", "")
    return "" if media == "User Archive" and "연합뉴스" in path.stem else media


def _normalize_market_filter(value):
    token = str(value or "").strip().upper()
    return token if token in {"US", "KR", "GLOBAL", "UNKNOWN"} else ""


def _cache_where(start_dt=None, end_dt=None, source="", market=""):
    clauses = ["visible = 1"]
    params = []
    if start_dt:
        clauses.append("timestamp_sort >= ?")
        params.append(start_dt.isoformat())
    if end_dt:
        clauses.append("timestamp_sort <= ?")
        params.append(end_dt.isoformat())
    if source:
        clauses.append("media = ?")
        params.append(str(source).strip())
    market = _normalize_market_filter(market)
    if market:
        clauses.append("(markets = ? OR markets LIKE ? OR markets LIKE ? OR markets LIKE ?)")
        params.extend([market, f"{market},%", f"%,{market},%", f"%,{market}"])
    return " AND ".join(clauses), params


def rss_cache_files(start_dt=None, end_dt=None, source="", market="", limit=None, offset=0):
    refresh_rss_feed_cache()
    where, params = _cache_where(start_dt, end_dt, source, market)
    sql = f"SELECT filename FROM {RSS_CACHE_TABLE} WHERE {where} ORDER BY timestamp_sort DESC, filename DESC"
    if limit is not None:
        sql += " LIMIT ? OFFSET ?"
        params = [*params, int(limit), int(offset)]
    with _connect_cache() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [RSS_INBOX_DIR / row["filename"] for row in rows]


def filter_archive_files(files, start_dt=None, end_dt=None, source=""):
    # Kept for older callers/tests. The feed API uses rss_cache_files().
    source = str(source or "").strip()
    records = []
    for idx, path in enumerate(files):
        entry_dt = parse_archive_filename(path)[1]
        records.append({
            "_idx": idx,
            "path": path,
            "timestampSort": entry_dt.isoformat() if entry_dt else "",
            "source": archive_media(path),
        })
    filtered = filter_archive_records(
        records,
        start_iso=start_dt.isoformat() if start_dt else "",
        end_iso=end_dt.isoformat() if end_dt else "",
        source=source,
    )
    return [row["path"] for row in filtered]


def rss_available_sources(files):
    refresh_rss_feed_cache()
    with _connect_cache() as conn:
        rows = conn.execute(
            f"SELECT DISTINCT media FROM {RSS_CACHE_TABLE} WHERE visible = 1 AND media != '' ORDER BY media"
        ).fetchall()
    return [row["media"] for row in rows]


def rss_feed_payload(qs):
    offset = max(0, int(qs.get("offset", [0])[0] or 0))
    limit = int(qs.get("limit", [50])[0] or 50)
    limit = min(max(limit, 1), MAX_RSS_LIMIT)
    _, _, start_dt, end_dt = normalize_feed_range(qs)
    source = qs.get("source", [""])[0].strip()
    market = _normalize_market_filter(qs.get("market", [""])[0])
    cache_stats = refresh_rss_feed_cache()
    where, params = _cache_where(start_dt, end_dt, source, market)
    with _connect_cache() as conn:
        rows = conn.execute(
            f"""
            SELECT filename, title, timestamp, timestamp_sort, url, normalized_url, description, media,
                   collector, source_type, collection_status, reliability_tier, markets
            FROM {RSS_CACHE_TABLE}
            WHERE {where}
            ORDER BY timestamp_sort DESC, filename DESC
            """,
            params,
        ).fetchall()
        source_rows = conn.execute(
            f"SELECT DISTINCT media FROM {RSS_CACHE_TABLE} WHERE visible = 1 AND media != '' ORDER BY media"
        ).fetchall()
    deduped_rows = _dedupe_rss_rows(rows)
    total = len(deduped_rows)
    page_rows = deduped_rows[offset:offset + limit]
    return {
        "items": [_row_to_item(row) for row in page_rows],
        "offset": offset,
        "limit": limit,
        "total": total,
        "sources": [row["media"] for row in source_rows],
        "source": source,
        "market": market,
        "markets": ["US", "KR", "GLOBAL", "UNKNOWN"],
        "has_more": offset + limit < total,
        "cache": cache_stats,
    }


def rss_merge_payload(qs):
    start_value, end_value, start_dt, end_dt = normalize_feed_range(qs)
    source = qs.get("source", [""])[0].strip()
    market = _normalize_market_filter(qs.get("market", [""])[0])
    files = rss_cache_files(start_dt, end_dt, source, market)
    if start_dt and end_dt:
        filename = f"archive-{start_dt:%Y%m%d-%H%M}_to_{end_dt:%Y%m%d-%H%M}.md"
        range_label = f"{start_value.replace('T', ' ')} to {end_value.replace('T', ' ')}"
    elif start_dt:
        filename = f"archive-from-{start_dt:%Y%m%d-%H%M}.md"
        range_label = f"From {start_value.replace('T', ' ')}"
    elif end_dt:
        filename = f"archive-until-{end_dt:%Y%m%d-%H%M}.md"
        range_label = f"Up to {end_value.replace('T', ' ')}"
    else:
        filename = "archive-all.md"
        range_label = "All time"
    chunks = [
        "# Archive Export",
        f"- Generated: {dt.datetime.now().strftime(RSS_DISPLAY_TS_FORMAT)}",
        f"- Range: {range_label}",
        f"- Items: {len(files)}",
        "",
    ]
    body = []
    for path in files:
        text = path.read_text(encoding="utf-8", errors="replace").strip()
        if text:
            body.append(text)
    return filename, "\n".join(chunks) + "\n" + "\n\n---\n\n".join(body) + "\n"


def rss_save_full_text_enabled():
    """앱 트리거 수집이 기사 전문을 저장할지 여부 (설정 탭 자동화 > RSS 수집).

    automation 모듈은 이 모듈을 import하므로 순환을 피해 설정 파일을 직접 읽는다.
    """
    settings = read_json(ROOT / "data" / "automation-settings.json", {})
    rss_cfg = settings.get("rss") if isinstance(settings, dict) else {}
    if not isinstance(rss_cfg, dict):
        rss_cfg = {}
    return bool(rss_cfg.get("saveFullText", True))


def import_rssarchive(run_collection=True, progress=None):
    output = []
    before = len(list(RSS_INBOX_DIR.glob("*.md")))
    if progress:
        progress(f"RSS 수집 준비 중입니다. 기존 RSS 파일 {before}개", progress=5)
    if run_collection:
        try:
            if progress:
                progress("RSS 피드를 수집하는 중입니다.", progress=12)
            _cf = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
            command = [sys.executable, "-m", RSS_ARCHIVE_MODULE, "--archive-dir", str(RSS_INBOX_DIR), "--collectors", "rss"]
            if rss_save_full_text_enabled():
                command.append("--save-full-text")
            proc = subprocess.run(
                command,
                cwd=str(ROOT), text=True, encoding="utf-8", errors="replace",
                capture_output=True, timeout=300,
                creationflags=_cf,
            )
            if proc.stdout.strip():
                output.append(proc.stdout.strip())
            if proc.stderr.strip():
                output.append(proc.stderr.strip())
        except Exception as exc:
            output.append(f"RSS collection failed: {exc}")
    after = len(list(RSS_INBOX_DIR.glob("*.md")))
    output.append(f"RSS collection finished. Added {max(after - before, 0)}, total {after}.")
    output.append(f"RSS folder: {RSS_INBOX_DIR}")
    if progress:
        progress(f"RSS 수집 완료: 신규 {max(after - before, 0)}개, 총 {after}개. 피드 캐시를 갱신합니다.", progress=62)
    cache = refresh_rss_feed_cache(progress=progress, force=True)
    if progress:
        progress(f"RSS 피드 캐시 갱신 완료: 변경 {cache.get('updated', 0)}개, 삭제 {cache.get('deleted', 0)}개. 인덱스를 갱신합니다.", progress=68)
    index = build_index(incremental=True, progress=progress)
    return {
        "output": "\n".join(output),
        "added": max(after - before, 0),
        "total": after,
        "cache": cache,
        "index": {"count": index.get("count", 0), "generatedAt": index.get("generatedAt", ""), "incremental": index.get("incremental", {})},
    }
