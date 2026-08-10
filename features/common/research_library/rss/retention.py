"""수집한 RSS 자료의 보관 기간.

RSS는 매일 300건씩 들어오고 한 건이 파일 3.5KB로 끝나지 않는다. 색인 문서 한 건과
청크 3~4개가 따라붙고, 그 청크의 임베딩이 자리를 대부분 차지한다 — 실측으로 2.5개월치
22,609건에 검색 DB가 728MB였고 그중 342MB가 임베딩이었다. 인덱스된 문서는 100%가
RSS이므로, 보관 기간이 곧 DB 크기다.

**지우는 것은 파일뿐이다.** 나머지 행은 이미 있는 경로가 걷어낸다 —
`refresh_rss_feed_cache()`가 `rss_feed_items`를, `build_index(incremental=True)`가
`documents`/`chunks`/FTS/`file_manifest`를 정리한다. 같은 일을 하는 삭제 SQL을 여기
따로 쓰면 인덱서가 바뀔 때마다 조용히 어긋난다. 어느 쪽도 손대지 않는 `evidence_items`만
여기서 정리한다.
"""
from __future__ import annotations

import datetime as dt
import os
import re
import sqlite3
from pathlib import Path

# 0은 무제한. 화면에서 고르는 값이며 임의의 숫자를 받지 않는다.
RETENTION_CHOICES = (0, 30, 60, 90, 180, 365)
# 실측 시점(2026-08)의 가장 오래된 자료가 74일 전이라 이 값으로는 아무것도 지워지지
# 않는다. 쓰던 사람이 판올림했다고 자료를 잃지 않으면서, 아카이브가 지금 크기 언저리에서
# 멈춘다. 더 줄이려면 화면에서 고르면 되고, 고르기 전에 몇 건이 지워지는지 보여 준다.
DEFAULT_RETENTION_DAYS = 90

# `2026-05-28 15-44-47 - BBC - ....md`. 실측으로 .md 22,609개 전부 이 접두를 갖는다.
_FILENAME_DATE = re.compile(r"^(\d{4})-(\d{2})-(\d{2})[ _]")


def normalize_days(value) -> int:
    try:
        days = int(value)
    except (TypeError, ValueError):
        return DEFAULT_RETENTION_DAYS
    return days if days in RETENTION_CHOICES else DEFAULT_RETENTION_DAYS


def cutoff_date(days: int, today: dt.date | None = None) -> dt.date | None:
    """이 날짜보다 오래된 것을 지운다. 무제한이면 None."""
    days = normalize_days(days)
    if days <= 0:
        return None
    return (today or dt.date.today()) - dt.timedelta(days=days)


def file_date(name: str) -> dt.date | None:
    match = _FILENAME_DATE.match(name)
    if not match:
        return None
    try:
        return dt.date(int(match.group(1)), int(match.group(2)), int(match.group(3)))
    except ValueError:
        return None


def expired_files(rss_dir: Path, cutoff: dt.date | None) -> list[Path]:
    """기간이 지난 RSS 마크다운. 날짜를 못 읽는 파일은 건드리지 않는다.

    `.state.json`은 수집기 상태이고 `.md`가 아니라 애초에 걸리지 않지만, 확장자를
    좁혀 두는 편이 나중에 다른 파일이 들어와도 안전하다.
    """
    if cutoff is None or not rss_dir.is_dir():
        return []
    rows = []
    for entry in os.scandir(rss_dir):
        if not entry.is_file() or not entry.name.lower().endswith(".md"):
            continue
        stamped = file_date(entry.name)
        if stamped is not None and stamped < cutoff:
            rows.append(Path(entry.path))
    return sorted(rows)


def preview(days: int, rss_dir: Path | None = None, today: dt.date | None = None) -> dict:
    """지금 설정으로 무엇이 얼마나 지워지는지. 지우기 전에 화면이 먼저 말한다."""
    from features.common.workspace import research_inbox_dir

    days = normalize_days(days)
    rss_dir = rss_dir or (research_inbox_dir() / "rss")
    cutoff = cutoff_date(days, today)
    files = expired_files(rss_dir, cutoff)
    total = 0
    for path in files:
        try:
            total += path.stat().st_size
        except OSError:
            continue
    return {
        "days": days,
        "cutoff": cutoff.isoformat() if cutoff else "",
        "files": len(files),
        "fileBytes": total,
        # 파일 1건당 색인이 함께 쓰는 양. 실측 728MB / 22,609건에서 파일 몫을 뺀 값이며,
        # 지워 봐야 아는 실제 회수량이 아니라 화면에 크기를 가늠해 주기 위한 추정이다.
        "estimatedIndexBytes": len(files) * 28_700,
    }


def delete_expired(days: int, rss_dir: Path | None = None, today: dt.date | None = None) -> dict:
    """기간이 지난 파일을 지운다. 행 정리는 부르는 쪽의 재색인이 맡는다."""
    from features.common.workspace import research_inbox_dir

    days = normalize_days(days)
    rss_dir = rss_dir or (research_inbox_dir() / "rss")
    resolved_root = rss_dir.resolve()
    deleted = 0
    freed = 0
    failed = 0
    for path in expired_files(rss_dir, cutoff_date(days, today)):
        # RSS 폴더 밖은 어떤 이유로도 지우지 않는다(§6 절대 규칙 2).
        try:
            if path.resolve().parent != resolved_root:
                continue
            size = path.stat().st_size
            path.unlink()
        except OSError:
            failed += 1
            continue
        deleted += 1
        freed += size
    return {"days": days, "deleted": deleted, "freedBytes": freed, "failed": failed}


def prune_orphan_evidence(db_path: Path | None = None, rss_dir: Path | None = None) -> int:
    """파일이 사라진 evidence 행을 지운다.

    인덱서도 피드 캐시도 이 표는 건드리지 않는다. 남겨 두면 source ledger가 없는
    파일을 근거로 인용한다. `markdown_path`는 역슬래시로 저장돼 있고 `documents.path`는
    슬래시라, 경로 문자열이 아니라 파일명으로 맞춘다.

    **대소문자는 무시한다.** Windows 파일 시스템이 구분하지 않으므로, 매체가 제목의
    대문자만 바꿔도(`Lost its` -> `Lost Its`) 저장된 이름과 디스크의 이름이 갈린다.
    구분해서 비교하면 파일이 멀쩡히 있는 근거를 고아로 보고 지운다.
    """
    from features.common.workspace import data_dir, research_inbox_dir

    db_path = db_path or (data_dir() / "research-index.sqlite3")
    rss_dir = rss_dir or (research_inbox_dir() / "rss")
    if not Path(db_path).exists():
        return 0
    alive = {entry.name.casefold() for entry in os.scandir(rss_dir) if entry.is_file()} if rss_dir.is_dir() else set()
    conn = sqlite3.connect(db_path, timeout=30)
    try:
        rows = conn.execute(
            "SELECT id, markdown_path FROM evidence_items WHERE markdown_path IS NOT NULL AND markdown_path <> ''"
        ).fetchall()
        gone = [
            (row[0],)
            for row in rows
            if str(row[1]).replace("\\", "/").rsplit("/", 1)[-1].casefold() not in alive
        ]
        if gone:
            with conn:
                conn.executemany("DELETE FROM evidence_items WHERE id = ?", gone)
        return len(gone)
    except sqlite3.OperationalError:
        return 0
    finally:
        conn.close()


def reclaimable_bytes(db_path: Path | None = None) -> int:
    """VACUUM으로 돌려받을 수 있는 크기. 지운 행이 비운 페이지다.

    파일 크기는 행을 지운다고 줄지 않는다. 빈 페이지는 다음 수집이 재사용하므로 파일이
    더 자라지 않게는 하지만, 사용자가 보는 것은 디스크 용량이다. 얼마나 돌려받는지
    미리 말할 수 있어야 29초를 기다릴지 정할 수 있다.
    """
    from features.common.workspace import data_dir

    path = Path(db_path or (data_dir() / "research-index.sqlite3"))
    if not path.exists():
        return 0
    try:
        conn = sqlite3.connect(f"file:{path}?mode=ro", uri=True, timeout=5)
    except sqlite3.Error:
        return 0
    try:
        free = conn.execute("PRAGMA freelist_count").fetchone()[0] or 0
        page = conn.execute("PRAGMA page_size").fetchone()[0] or 0
        return int(free) * int(page)
    except sqlite3.Error:
        return 0
    finally:
        conn.close()


def reclaim_index_space(db_path: Path | None = None) -> dict:
    """VACUUM. 행을 지워도 SQLite 파일은 저절로 줄지 않는다.

    사용자가 보는 것은 행 수가 아니라 디스크 용량이므로, 정리했다고 말하려면 이걸
    해야 한다. 전체를 다시 쓰므로 일시적으로 파일 크기만큼 여유 공간이 필요하고,
    실패하면 그 사실을 그대로 돌려준다 — 공간이 없어서 못 줄인 것을 줄였다고 하면 안 된다.
    """
    from features.common.workspace import data_dir

    path = Path(db_path or (data_dir() / "research-index.sqlite3"))
    if not path.exists():
        return {"ok": False, "beforeBytes": 0, "afterBytes": 0, "reason": "no_index"}
    before = path.stat().st_size
    conn = sqlite3.connect(path, timeout=60, isolation_level=None)
    try:
        conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")
        conn.execute("VACUUM")
    except sqlite3.Error as exc:
        return {"ok": False, "beforeBytes": before, "afterBytes": before, "reason": type(exc).__name__}
    finally:
        conn.close()
    return {"ok": True, "beforeBytes": before, "afterBytes": path.stat().st_size, "reason": ""}
