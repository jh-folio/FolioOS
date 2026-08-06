"""저장소별 마지막 변경 시각.

화면이 목록을 언제 다시 읽어야 하는지 알려면 무언가 알려줘야 한다. 지금까지는
자기가 실행한 작업이 끝났을 때만 다시 읽어서, 자동화가 만든 브리핑이나 다른 탭이
수집한 RSS는 사용자가 직접 새로고침하기 전까지 화면에 없었다.

파일 mtime만 본다 — 내용을 읽지 않으므로 몇 초 간격으로 불러도 부담이 없다.
"""
from __future__ import annotations

from pathlib import Path

# 화면이 구독하는 이름 → 그 내용이 저장되는 위치.
# 이름은 화면 쪽 계약이므로 바꾸면 구독자도 함께 바꿔야 한다.
CONTENT_KINDS: dict[str, tuple[str, ...]] = {
    "briefing": ("briefings",),
    "companyAnalysis": ("company-analysis",),
    "topicReport": ("topic-reports",),
    "marketMemory": ("market-memory.sqlite3",),
    "rss": ("research-index.sqlite3",),
    "note": ("investment-notes",),
    "portfolio": ("portfolio.json",),
    "watchlist": ("watchlist.json",),
}


def _latest_mtime_ns(path: Path) -> int:
    """디렉터리면 자신과 바로 아래 파일 중 가장 최근, 파일이면 그 자신.

    디렉터리 자신의 mtime을 함께 본다. 자식 파일만 보면 가장 최근 파일이 삭제됐을 때
    값이 오히려 내려가고, 그러면 "삭제됐다"는 사실이 신호로 전달되지 않는다.
    """
    try:
        if path.is_dir():
            newest = path.stat().st_mtime_ns
            for child in path.iterdir():
                try:
                    if child.is_file():
                        newest = max(newest, child.stat().st_mtime_ns)
                except OSError:
                    continue
            return newest
        return path.stat().st_mtime_ns
    except OSError:
        return 0


def content_revisions(data_dir: Path) -> dict[str, int]:
    """`{종류: 마지막 변경 시각}`. 없는 저장소는 0."""
    root = Path(data_dir)
    revisions: dict[str, int] = {}
    for kind, names in CONTENT_KINDS.items():
        newest = 0
        for name in names:
            newest = max(newest, _latest_mtime_ns(root / name))
        revisions[kind] = newest
    return revisions
