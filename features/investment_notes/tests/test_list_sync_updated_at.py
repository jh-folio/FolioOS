"""목록 조회는 읽기 경로다 — 노트의 수정 시각을 바꾸지 않는다.

`_sync_files_to_index`가 `normalize_note`를 그대로 인덱스에 넣으면 파일 내용이
그대로인데도 `updated_at`이 조회 시각으로 덮인다. 그러면 `ORDER BY updated_at DESC`가
사실상 glob 순서(파일명순)가 되어 방금 수정한 노트가 위로 오지 않고, 상위 N만 쓰는
호출자(`linked_notes_payload`, 대시보드)가 엉뚱한 노트를 고른다.
"""
from __future__ import annotations

import json
from unittest.mock import patch

from features.investment_notes import service


def _note(note_id: str, title: str, updated_at: str) -> dict:
    return {
        "id": note_id,
        "noteType": "investment_note",
        "title": title,
        "body": title,
        "ticker": "",
        "company": "",
        "topic": "",
        "label": title,
        "tags": [],
        "linkedReports": [],
        "status": "active",
        "layer": "hypothesis",
        "sourceLayer": "user_synthesis",
        "createdAt": "2024-01-01T00:00:00",
        "updatedAt": updated_at,
    }


def _seed(notes_dir, notes):
    notes_dir.mkdir(parents=True, exist_ok=True)
    for note in notes:
        (notes_dir / f"{note['id']}.json").write_text(json.dumps(note, ensure_ascii=False), encoding="utf-8")


def test_listing_keeps_the_saved_updated_at(tmp_path):
    notes_dir = tmp_path / "notes"
    db_path = tmp_path / "market-memory.sqlite3"
    _seed(notes_dir, [_note("note-a", "A", "2026-08-01T09:00:00.000001")])

    with patch.object(service, "NOTES_DIR", notes_dir), patch.object(service, "MARKET_MEMORY_DB_PATH", db_path):
        first = service.list_notes()
        second = service.list_notes()

    assert first[0]["updatedAt"] == "2026-08-01T09:00:00.000001"
    assert second[0]["updatedAt"] == first[0]["updatedAt"]


def test_newest_note_stays_on_top_regardless_of_file_name(tmp_path):
    """파일명이 생성순과 무관한 노트(이관·legacy)가 섞여도 최신순이 유지돼야 한다."""
    notes_dir = tmp_path / "notes"
    db_path = tmp_path / "market-memory.sqlite3"
    _seed(notes_dir, [
        _note("aaa-newest", "NEWEST", "2026-08-15T10:00:00"),
        _note("zzz-oldest", "OLDEST", "2020-02-02T02:02:02"),
    ])

    with patch.object(service, "NOTES_DIR", notes_dir), patch.object(service, "MARKET_MEMORY_DB_PATH", db_path):
        rows = service.list_notes()

    assert [row["title"] for row in rows] == ["NEWEST", "OLDEST"]


def test_saving_a_note_still_moves_it_to_the_top(tmp_path):
    notes_dir = tmp_path / "notes"
    db_path = tmp_path / "market-memory.sqlite3"

    with patch.object(service, "NOTES_DIR", notes_dir), patch.object(service, "MARKET_MEMORY_DB_PATH", db_path):
        first = service.save_note({"title": "A", "body": "old"})
        service.save_note({"title": "B", "body": "b"})
        service.save_note({"id": first["id"], "title": "A", "body": "new"})

        rows = service.list_notes()

    assert [row["title"] for row in rows] == ["A", "B"]
