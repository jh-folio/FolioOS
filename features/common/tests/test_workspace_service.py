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
