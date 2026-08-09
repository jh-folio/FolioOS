"""보관 기간 정리가 실제로 색인까지 걷어내는가.

이 모듈의 설계 주장은 "파일만 지우면 나머지 행은 이미 있는 경로가 따라 지운다"이다.
주장이 맞는지는 실제로 색인을 만들어 보고 지워 봐야 안다 — 단위 테스트가 전부 통과해도
`documents`나 FTS에 유령이 남으면 검색이 없는 파일을 물어온다.
"""
from __future__ import annotations

import datetime as dt
import importlib
import sqlite3
import subprocess
import sys
import textwrap
from pathlib import Path

ROOT = Path(__file__).resolve().parents[5]

# 워크스페이스 위치는 프로세스당 1회 캐시되므로(§10 자료 위치) 같은 프로세스에서
# 바꿔치기할 수 없다. 별도 프로세스에 FOLIO_HOME을 주고 돌린다.
SCRIPT = textwrap.dedent(
    """
    import json, os, sqlite3, sys
    sys.path.insert(0, sys.argv[1])
    from features.common.research_library.indexing.service import build_index
    from features.common.research_library.rss.retention import delete_expired, prune_orphan_evidence

    db = os.path.join(os.environ["FOLIO_HOME"], "data", "research-index.sqlite3")
    build_index(incremental=False)

    def counts():
        conn = sqlite3.connect(db)
        try:
            out = {}
            for table in ("documents", "chunks", "chunks_fts", "file_manifest"):
                try:
                    out[table] = conn.execute(f'SELECT COUNT(*) FROM "{table}"').fetchone()[0]
                except sqlite3.OperationalError:
                    out[table] = -1
            return out
        finally:
            conn.close()

    before = counts()
    removed = delete_expired(int(sys.argv[2]), today=None)
    build_index(incremental=True)
    after = counts()
    print(json.dumps({"before": before, "after": after, "removed": removed}))
    """
).strip()


def write_article(rss_dir: Path, stamp: dt.date, slug: str) -> None:
    (rss_dir / f"{stamp.isoformat()} 09-00-00 - BBC - {slug}.md").write_text(
        "\n".join([
            "---",
            "collector: rss",
            "source_type: news",
            f"title: {slug}",
            "markets: [US]",
            "---",
            "",
            "## Summary",
            "",
            f"The Federal Reserve and the stock market moved on {slug}. " * 40,
        ]),
        encoding="utf-8",
    )


def test_deleting_the_file_takes_its_index_rows_with_it(tmp_path):
    home = tmp_path / "workspace"
    rss = home / "research-inbox" / "rss"
    rss.mkdir(parents=True)
    (home / "data").mkdir(parents=True)

    today = dt.date.today()
    write_article(rss, today - dt.timedelta(days=400), "ancient-news")
    write_article(rss, today - dt.timedelta(days=1), "fresh-news")

    script = tmp_path / "run.py"
    script.write_text(SCRIPT, encoding="utf-8")
    proc = subprocess.run(
        [sys.executable, str(script), str(ROOT), "90"],
        capture_output=True, text=True, encoding="utf-8", errors="replace",
        env={**dict(__import__("os").environ), "FOLIO_HOME": str(home), "PYTHONIOENCODING": "utf-8"},
        cwd=str(ROOT), timeout=600,
    )
    assert proc.returncode == 0, proc.stderr[-2000:]

    payload = None
    for line in reversed(proc.stdout.strip().splitlines()):
        if line.startswith("{"):
            payload = __import__("json").loads(line)
            break
    assert payload, proc.stdout[-2000:]

    before, after, removed = payload["before"], payload["after"], payload["removed"]
    assert removed["deleted"] == 1, "오래된 기사 하나만 지워야 한다"
    assert before["documents"] == 2 and after["documents"] == 1
    # 유령이 남으면 검색이 없는 파일을 물어온다.
    assert after["chunks"] < before["chunks"], "청크가 따라 지워져야 한다"
    assert after["chunks_fts"] < before["chunks_fts"], "FTS 색인이 따라 지워져야 한다"
    assert after["file_manifest"] == 1
    assert (rss / f"{(today - dt.timedelta(days=1)).isoformat()} 09-00-00 - BBC - fresh-news.md").exists()
