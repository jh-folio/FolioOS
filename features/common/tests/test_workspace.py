"""워크스페이스 위치 결정.

기본은 **지금과 같아야 한다** — 앱 폴더. 아무것도 새로 만들지 않는다. 옮기는 것은
선택이고, 옮긴 뒤에 새 버전을 풀면 자료를 자동으로 다시 찾아야 한다. 그러지 못하면
옮긴 의미가 없다.
"""
from __future__ import annotations

import pytest

from features.common import workspace


@pytest.fixture
def app(tmp_path, monkeypatch):
    """배포 zip을 갓 푼 상태 — `data/`는 빈 폴더 껍데기만 있다."""
    root = tmp_path / "FolioOS-v0.5.1"
    for name in workspace.WORKSPACE_DIR_NAMES:
        (root / name).mkdir(parents=True)
    (root / "data" / "briefings").mkdir()
    monkeypatch.setattr(workspace, "APP_ROOT", root)
    monkeypatch.delenv("FOLIO_HOME", raising=False)
    monkeypatch.setattr(workspace.Path, "home", staticmethod(lambda: tmp_path / "home"))
    # 판정은 프로세스당 1회 캐시된다. 테스트마다 환경을 바꾸므로 앞뒤로 비운다.
    workspace.reset_cache()
    yield root
    workspace.reset_cache()


def test_a_fresh_install_uses_the_app_folder(app):
    """기본값은 바뀌지 않는다. 새 폴더도 만들지 않는다."""
    assert workspace.workspace_root() == app
    assert workspace.data_dir() == app / "data"
    assert not workspace.is_outside_app_folder()
    assert not workspace.documents_workspace().exists()


def test_an_existing_install_keeps_using_the_app_folder(app):
    (app / "data" / "portfolio.json").write_text("{}", encoding="utf-8")
    assert workspace.workspace_root() == app
    assert not workspace.is_outside_app_folder()


def test_documents_is_found_after_an_update(app, tmp_path):
    """옮긴 사용자가 새 버전을 풀었을 때 자료를 자동으로 다시 찾는다.

    새로 푼 앱 폴더의 `data/`는 비어 있으므로 2번 규칙이 걸리지 않고, 문서 폴더의
    워크스페이스가 잡혀야 한다. 이 규칙이 이 기능의 전부다.
    """
    documents = tmp_path / "home" / "Documents" / "FolioOS"
    (documents / "data").mkdir(parents=True)
    (documents / "data" / "portfolio.json").write_text("{}", encoding="utf-8")

    assert workspace.workspace_root() == documents
    assert workspace.data_dir() == documents / "data"
    assert workspace.is_outside_app_folder()


def test_the_app_folder_wins_when_both_have_content(app, tmp_path):
    """옮기기는 원본을 지우지 않는다. 옛 폴더를 직접 실행하면 그 자료를 쓴다."""
    (app / "data" / "portfolio.json").write_text("{}", encoding="utf-8")
    documents = tmp_path / "home" / "Documents" / "FolioOS"
    (documents / "data").mkdir(parents=True)
    (documents / "data" / "portfolio.json").write_text("{}", encoding="utf-8")

    assert workspace.workspace_root() == app


def test_an_empty_documents_folder_is_not_picked_up(app, tmp_path):
    """빈 폴더 껍데기를 워크스페이스로 오인하면 안 된다."""
    (tmp_path / "home" / "Documents" / "FolioOS" / "data").mkdir(parents=True)
    assert workspace.workspace_root() == app


def test_folio_home_overrides_everything(app, tmp_path, monkeypatch):
    (app / "data" / "portfolio.json").write_text("{}", encoding="utf-8")
    custom = tmp_path / "elsewhere"
    monkeypatch.setenv("FOLIO_HOME", str(custom))
    assert workspace.workspace_root() == custom
    assert workspace.is_outside_app_folder()


def test_the_decision_is_made_once_per_process(app):
    """모듈 상수 수십 곳이 import 시점에 읽으므로 매번 디렉터리를 훑으면 안 되고,
    import 도중 `data/`가 생겨도 앞뒤 모듈이 같은 답을 봐야 한다."""
    first = workspace.workspace_root()
    (app / "data" / "portfolio.json").write_text("{}", encoding="utf-8")
    assert workspace.workspace_root() is first

    workspace.reset_cache()
    assert workspace.workspace_root() == app


def test_unknown_directory_names_are_rejected(app):
    for name in workspace.WORKSPACE_DIR_NAMES:
        assert workspace.workspace_dir(name).name == name
    with pytest.raises(ValueError):
        workspace.workspace_dir("secrets")
