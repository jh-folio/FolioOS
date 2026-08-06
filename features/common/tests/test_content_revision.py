"""화면이 목록을 다시 읽을 시점을 알려면 서버가 알려줘야 한다.

자기가 실행한 작업이 끝났을 때만 다시 읽으면, 자동화가 만든 브리핑이나 다른 탭이
수집한 RSS는 사용자가 직접 새로고침하기 전까지 화면에 없다.
"""
from __future__ import annotations

import os
from pathlib import Path

from features.common.content_revision import CONTENT_KINDS, content_revisions


def test_every_kind_is_reported_even_when_the_store_is_missing(tmp_path: Path):
    revisions = content_revisions(tmp_path)
    assert set(revisions) == set(CONTENT_KINDS)
    assert all(value == 0 for value in revisions.values())


def test_adding_a_report_moves_the_signal(tmp_path: Path):
    reports = tmp_path / "topic-reports"
    reports.mkdir()
    (reports / "a.json").write_text("{}", encoding="utf-8")
    before = content_revisions(tmp_path)["topicReport"]

    (reports / "b.json").write_text("{}", encoding="utf-8")

    assert content_revisions(tmp_path)["topicReport"] != before


def test_deleting_the_newest_report_also_moves_the_signal(tmp_path: Path):
    """자식 파일만 보면 최신 파일이 사라질 때 값이 내려가 삭제가 신호로 전달되지 않는다."""
    reports = tmp_path / "briefings"
    reports.mkdir()
    old = reports / "old.json"
    old.write_text("{}", encoding="utf-8")
    os.utime(old, (1_000_000, 1_000_000))
    newest = reports / "new.json"
    newest.write_text("{}", encoding="utf-8")
    before = content_revisions(tmp_path)["briefing"]

    newest.unlink()

    assert content_revisions(tmp_path)["briefing"] != before


def test_a_single_file_store_is_watched_too(tmp_path: Path):
    watchlist = tmp_path / "watchlist.json"
    watchlist.write_text("[]", encoding="utf-8")
    assert content_revisions(tmp_path)["watchlist"] > 0


def test_reading_does_not_open_the_files(tmp_path: Path, monkeypatch):
    """몇 초 간격으로 부르는 신호라 내용을 읽으면 안 된다."""
    reports = tmp_path / "company-analysis"
    reports.mkdir()
    (reports / "a.json").write_text("{}", encoding="utf-8")

    def forbidden(*_args, **_kwargs):
        raise AssertionError("content_revisions가 파일을 열었다")

    monkeypatch.setattr(Path, "read_text", forbidden)
    monkeypatch.setattr(Path, "read_bytes", forbidden)
    assert content_revisions(tmp_path)["companyAnalysis"] > 0
