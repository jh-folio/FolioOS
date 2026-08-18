"""자료를 옮긴 직후(재시작 전)에는 수집도 정리도 하지 않는다.

표지가 디스크에 쓰인 순간부터 새로 뜨는 수집 서브프로세스는 **새** 폴더를 판정하는데,
이 프로세스의 `RSS_INBOX_DIR`은 import 시점에 굳은 **옛** 폴더다. 그 창에서 수집하면
Markdown은 옛 폴더에, evidence 행은 새 DB에 갈려 들어가고 재시작 뒤에는 파일 없는
행만 남는다 — 그 기사는 색인·브리핑에서 조용히 사라진다(§6 절대 규칙 2).
"""
import pytest

from features.common import workspace
from features.common.research_library.rss import retention, service


@pytest.fixture
def just_moved():
    workspace.mark_moved_pending_restart()
    yield
    # 되돌리는 것은 원래 재시작뿐이다. 테스트에서는 reset_cache가 그 자리를 대신한다.
    workspace.reset_cache()


def _explode(*_args, **_kwargs):
    raise AssertionError("옮긴 뒤 재시작 전에는 자료를 쓰는 일을 하면 안 된다")


def test_collection_does_not_run_before_the_restart(just_moved, monkeypatch):
    monkeypatch.setattr(service.subprocess, "run", _explode)
    monkeypatch.setattr(service, "delete_expired_rss", _explode)
    monkeypatch.setattr(service, "build_index", _explode)

    result = service.import_rssarchive(run_collection=True)

    assert result["skipped"] == "workspace_moved"
    assert result["added"] == 0
    # 조용히 건너뛰면 자동 수집이 도는 줄 알고 며칠을 보낸다.
    assert "재시작" in result["output"]


def test_the_cleanup_does_not_run_before_the_restart(just_moved, monkeypatch):
    monkeypatch.setattr(service, "delete_expired_rss", _explode)
    monkeypatch.setattr(service, "reclaim_index_space", _explode)

    result = service.run_retention_now()

    assert result["skipped"] == "workspace_moved"
    assert result["retention"]["deleted"] == 0


def test_retention_refuses_to_delete_from_the_folder_it_cannot_agree_on(just_moved, tmp_path, monkeypatch):
    """`delete_expired`는 호출 시점에 새 폴더를 판정한다 — 방금 복사한 사본이다."""
    inbox = tmp_path / "research-inbox"
    rss = inbox / "rss"
    rss.mkdir(parents=True)
    ancient = rss / "2020-01-02 09-00-00 - BBC - ancient.md"
    ancient.write_text("body", encoding="utf-8")
    monkeypatch.setattr(workspace, "research_inbox_dir", lambda: inbox)

    result = retention.delete_expired(30)

    assert result["skipped"] == "workspace_moved"
    assert result["deleted"] == 0
    assert ancient.exists()


def test_an_explicit_folder_still_gets_cleaned(just_moved, tmp_path):
    """옮기기 플래그는 "어느 폴더인지 알 수 없다"는 뜻이다. 폴더를 지정해 부르면 안다."""
    rss = tmp_path / "rss"
    rss.mkdir()
    (rss / "2020-01-02 09-00-00 - BBC - ancient.md").write_text("body", encoding="utf-8")

    assert retention.delete_expired(30, rss_dir=rss)["deleted"] == 1
