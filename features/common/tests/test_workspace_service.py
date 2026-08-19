"""자료 옮기기.

지킬 것은 둘이다. **원본을 지우지 않는다**, 그리고 **검증하기 전에는 표지를 쓰지
않는다**. 913MB를 옮기다 실패했을 때 사용자에게 남는 것이 반쪽 사본 하나뿐이면 안
된다.
"""
from __future__ import annotations

import json

import pytest

from features.common import workspace
from features.common import workspace_service as service


@pytest.fixture
def moved(tmp_path, monkeypatch):
    """앱 폴더에 자료가 있고, 문서 폴더는 비어 있는 보통 상태."""
    app = tmp_path / "FolioOS-v0.5.1"
    for name in workspace.WORKSPACE_DIR_NAMES:
        (app / name).mkdir(parents=True)
    (app / "data" / "portfolio.json").write_text('{"holdings": []}', encoding="utf-8")
    (app / "data" / "briefings").mkdir()
    (app / "data" / "briefings" / "2026-08-08.json").write_text("{}", encoding="utf-8")
    (app / "research-inbox" / "articles").mkdir()
    (app / "research-inbox" / "articles" / "note.md").write_text("# 메모", encoding="utf-8")

    documents = tmp_path / "home" / "Documents"
    documents.mkdir(parents=True)

    monkeypatch.setattr(workspace, "APP_ROOT", app)
    monkeypatch.setattr(service, "APP_ROOT", app)
    monkeypatch.setattr(workspace, "documents_root", lambda: documents)
    monkeypatch.delenv("FOLIO_HOME", raising=False)
    monkeypatch.delenv("OneDrive", raising=False)
    workspace.reset_cache()
    yield app
    workspace.reset_cache()


def test_moving_to_documents_copies_everything_and_keeps_the_original(moved, tmp_path):
    result = service.move_workspace("documents")

    target = tmp_path / "home" / "Documents" / "FolioOS"
    assert result["restartRequired"] is True
    assert (target / "data" / "portfolio.json").read_text(encoding="utf-8") == '{"holdings": []}'
    assert (target / "data" / "briefings" / "2026-08-08.json").exists()
    assert (target / "research-inbox" / "articles" / "note.md").exists()

    # 원본은 그대로. 지운 자료는 되돌릴 수 없다.
    assert (moved / "data" / "portfolio.json").exists()
    assert (moved / "research-inbox" / "articles" / "note.md").exists()


def test_the_marker_makes_the_next_start_use_the_new_location(moved, tmp_path):
    """표지가 없으면 옮겨도 아무 일이 없다 — 원본을 남기므로 앱 폴더 규칙이 먼저 걸린다."""
    service.move_workspace("documents")
    workspace.reset_cache()

    target = tmp_path / "home" / "Documents" / "FolioOS"
    assert workspace.workspace_root() == target
    assert workspace.data_dir() == target / "data"
    assert workspace.is_outside_app_folder()

    marker = json.loads((moved / workspace.MARKER_NAME).read_text(encoding="utf-8"))
    assert marker["workspace"] == str(target)


def test_moving_pauses_the_writing_jobs_until_the_restart(moved):
    """표지를 쓴 순간부터 이 프로세스는 두 워크스페이스를 동시에 본다.

    모듈 상수 수십 곳은 import 시점의 옛 폴더를 들고 있고, 새로 뜨는 수집
    서브프로세스와 호출 시점에 판정하는 경로는 새 폴더를 본다. 그 사이에 수집·정리를
    돌리면 새 자료가 두 폴더로 갈린다.
    """
    assert workspace.moved_pending_restart() is False

    result = service.move_workspace("documents")

    assert result["collectionPausedUntilRestart"] is True
    assert result["restartRequired"] is True
    assert workspace.moved_pending_restart() is True


def test_the_cleanup_does_not_reach_the_copy_that_was_just_made(moved, tmp_path):
    """정리는 호출 시점에 폴더를 판정해 방금 복사한 사본을 지운다 — 옮긴 자료가 준다."""
    from features.common.research_library.rss import retention

    rss = moved / "research-inbox" / "rss"
    rss.mkdir(parents=True, exist_ok=True)
    (rss / "2020-01-02 09-00-00 - BBC - ancient.md").write_text("body", encoding="utf-8")

    service.move_workspace("documents")
    copied = (
        tmp_path / "home" / "Documents" / "FolioOS" / "research-inbox" / "rss"
        / "2020-01-02 09-00-00 - BBC - ancient.md"
    )
    assert copied.exists()

    result = retention.delete_expired(30)

    assert result["skipped"] == "workspace_moved"
    assert copied.exists(), "방금 옮긴 사본에서 파일이 사라졌습니다"


def test_a_marker_pointing_nowhere_is_ignored(moved):
    """사용자가 옮긴 폴더를 지웠을 수 있다. 없는 경로로 시작하면 저장이 전부 실패한다."""
    (moved / workspace.MARKER_NAME).write_text(
        json.dumps({"workspace": str(moved / "사라진폴더")}), encoding="utf-8"
    )
    workspace.reset_cache()
    assert workspace.workspace_root() == moved


def test_moving_back_to_the_app_folder_clears_the_marker(moved):
    service.move_workspace("documents")
    workspace.reset_cache()

    service.move_workspace("app", merge=True)
    workspace.reset_cache()

    assert not (moved / workspace.MARKER_NAME).exists()
    assert workspace.workspace_root() == moved


def test_a_destination_with_files_needs_an_explicit_merge(moved, tmp_path):
    """합치면 그쪽에만 있던 파일이 남는다 — 지운 보고서가 되살아난다. 조용히 하지 않는다."""
    target = tmp_path / "home" / "Documents" / "FolioOS"
    (target / "data").mkdir(parents=True)
    (target / "data" / "old.json").write_text("{}", encoding="utf-8")

    with pytest.raises(service.WorkspaceMoveError, match="이미 자료"):
        service.move_workspace("documents")

    service.move_workspace("documents", merge=True)
    assert (target / "data" / "old.json").exists()
    assert (target / "data" / "portfolio.json").exists()


def test_a_bad_copy_does_not_leave_a_marker_behind(moved, monkeypatch):
    """검증에 실패하면 표지를 쓰지 않는다. 앱은 계속 원본을 쓴다."""
    monkeypatch.setattr(service, "_verify", lambda source, target: ["data/portfolio.json"])

    with pytest.raises(service.WorkspaceMoveError, match="원본은 그대로"):
        service.move_workspace("documents")

    assert not (moved / workspace.MARKER_NAME).exists()
    workspace.reset_cache()
    assert workspace.workspace_root() == moved


def test_a_full_disk_stops_before_copying_anything(moved, monkeypatch, tmp_path):
    import shutil as shutil_module

    monkeypatch.setattr(
        service.shutil, "disk_usage", lambda path: shutil_module._ntuple_diskusage(0, 0, 1)
    )
    with pytest.raises(service.WorkspaceMoveError, match="공간이 부족"):
        service.move_workspace("documents")

    assert not (tmp_path / "home" / "Documents" / "FolioOS" / "data" / "portfolio.json").exists()


def test_the_same_place_and_nested_places_are_refused(moved, monkeypatch):
    with pytest.raises(service.WorkspaceMoveError, match="이미 그 위치"):
        service.move_workspace("app")

    monkeypatch.setattr(workspace, "documents_root", lambda: moved / "data")
    with pytest.raises(service.WorkspaceMoveError):
        service.move_workspace("documents")


def test_the_payload_tells_the_screen_where_things_are(moved, tmp_path):
    payload = service.workspace_payload()
    assert payload["path"] == str(moved)
    assert payload["outsideAppFolder"] is False
    assert payload["canMoveToDocuments"] is True
    assert payload["canMoveToAppFolder"] is False
    assert payload["fileCount"] == 3
    assert payload["totalBytes"] > 0
    assert payload["documentsPath"] == str(tmp_path / "home" / "Documents" / "FolioOS")


def test_folio_home_blocks_moving_instead_of_lying(moved, monkeypatch, tmp_path):
    """표지를 써도 다음 시작에서 환경변수가 이긴다. "옮겼으니 재시작하세요"라고
    말해놓고 재시작하면 그대로인 것은 거짓말이다."""
    monkeypatch.setenv("FOLIO_HOME", str(tmp_path / "elsewhere"))

    payload = service.workspace_payload()
    assert payload["envPinned"] is True
    assert payload["canMoveToDocuments"] is False
    assert payload["canMoveToAppFolder"] is False

    with pytest.raises(service.WorkspaceMoveError, match="FOLIO_HOME"):
        service.move_workspace("documents")


def test_onedrive_destinations_are_flagged(moved, tmp_path, monkeypatch):
    """동기화 폴더의 700MB SQLite는 저장할 때마다 업로드가 돌고 충돌 사본을 만든다."""
    onedrive = tmp_path / "home" / "OneDrive"
    monkeypatch.setattr(workspace, "documents_root", lambda: onedrive / "Documents")
    monkeypatch.setenv("OneDrive", str(onedrive))
    assert service.workspace_payload()["documentsIsOneDrive"] is True


def test_a_live_sqlite_wal_does_not_fail_the_move(moved, tmp_path):
    """옮기기가 **항상** 실패하던 원인.

    서버가 도는 동안 WAL은 쉬지 않고 커진다(실측 120초에 117MB → 469MB). 1GB 복사는
    몇 분이 걸리는데, 복사가 끝난 뒤 원본을 다시 재던 검증이 그 사이 달라진 WAL을 보고
    "복사한 자료가 원본과 다릅니다"를 냈다. 파일이 실제로 상한 적은 없다.
    """
    import sqlite3

    db = moved / "data" / "research-index.sqlite3"
    conn = sqlite3.connect(str(db))
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("CREATE TABLE t(a TEXT)")
    conn.executemany("INSERT INTO t VALUES(?)", [("y" * 200,) for _ in range(2000)])
    conn.commit()
    assert (moved / "data" / "research-index.sqlite3-wal").exists()

    result = service.move_workspace("documents")

    target = tmp_path / "home" / "Documents" / "FolioOS"
    # 곁다리는 따라가지 않는다. SQLite가 목적지에서 다시 만든다.
    assert not (target / "data" / "research-index.sqlite3-wal").exists()
    assert not (target / "data" / "research-index.sqlite3-shm").exists()
    assert result["checkpointFailed"] == []
    conn.close()

    # 본체 파일만으로 자료가 온전하다 — WAL을 접어 넣었기 때문이다.
    moved_db = sqlite3.connect(str(target / "data" / "research-index.sqlite3"))
    assert moved_db.execute("select count(*) from t").fetchone()[0] == 2000
    moved_db.close()


def test_the_size_estimate_counts_the_wal_it_will_fold_in(moved):
    """공간 검사는 넉넉히 잡는 쪽이 안전하다.

    WAL을 빼고 세면 체크포인트 뒤 본체로 옮겨 갈 바이트가 빠져 필요한 공간을
    과소평가한다 — 실측에서 1.8MB WAL을 빼자 총량이 1.88MB에서 9KB로 떨어졌다.
    """
    import sqlite3

    conn = sqlite3.connect(str(moved / "data" / "research-index.sqlite3"))
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("CREATE TABLE t(a TEXT)")
    conn.executemany("INSERT INTO t VALUES(?)", [("y" * 200,) for _ in range(2000)])
    conn.commit()
    wal = (moved / "data" / "research-index.sqlite3-wal").stat().st_size
    assert wal > 100_000

    _, total = service._usage(moved)
    assert total > wal
    conn.close()
