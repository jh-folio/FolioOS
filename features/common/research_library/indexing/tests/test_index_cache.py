"""인덱스 캐시 — 첫 탭 로딩이 13.9초 걸리던 원인."""
from __future__ import annotations

import threading
import time

import features.common.research_library.indexing.service as svc


def _wait_until(predicate, timeout: float = 3.0) -> None:
    """배경 갱신이 끝나기를 기다린다. 스레드라 sleep 상수로 못 박지 않는다."""
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if predicate():
            return
        time.sleep(0.01)
    raise AssertionError("배경 갱신이 시간 안에 끝나지 않았다")


def test_the_index_is_read_once_and_reused(monkeypatch):
    """호출자가 14곳인데 캐시가 없어 매번 문서 13,030건을 다시 읽었다.

    앱을 켜고 대시보드를 처음 열면 인덱스 로드 5.9초 + 시장별 집계 6.8초로
    13.9초가 걸렸다.
    """
    calls = []
    monkeypatch.setattr(svc, "_read_index_from_store", lambda: calls.append(1) or {"count": 1, "documents": []})
    svc.invalidate_index_cache()

    svc.load_index()
    svc.load_index()
    svc.load_index()

    assert calls == [1]
    svc.invalidate_index_cache()


def test_rebuilding_the_index_drops_the_cache(monkeypatch):
    """`build_index()`가 문서를 바꾸면 다음 읽기는 새 값이어야 한다."""
    seq = iter([{"count": 1, "documents": []}, {"count": 2, "documents": []}])
    monkeypatch.setattr(svc, "_read_index_from_store", lambda: next(seq))
    svc.invalidate_index_cache()

    assert svc.load_index()["count"] == 1
    svc.invalidate_index_cache()
    assert svc.load_index()["count"] == 2
    svc.invalidate_index_cache()


def test_the_cache_expires_on_its_own(monkeypatch):
    """외부에서 DB를 바꾸는 경우를 위한 안전망. 정확성은 명시적 무효화가 맡는다.

    유효성을 DB에서 읽어 판정하는 방식은 두 번 시도해 보고 버렸다 — 파일 mtime은
    같은 파일 안의 RSS 캐시가 계속 바꾸고, `documents.MAX(updated_at)`은 색인이
    바뀌지 않아도 26초 만에 움직였다.
    """
    calls = []
    monkeypatch.setattr(svc, "_read_index_from_store", lambda: calls.append(1) or {"count": len(calls), "documents": []})
    monkeypatch.setattr(svc, "INDEX_CACHE_TTL_SECONDS", 0.05)
    svc.invalidate_index_cache()

    svc.load_index()
    time.sleep(0.08)
    svc.load_index()
    _wait_until(lambda: len(calls) == 2)

    assert svc.load_index()["count"] == 2
    svc.invalidate_index_cache()


def test_an_expired_cache_never_makes_the_caller_wait(monkeypatch):
    """만료됐다고 요청을 붙잡아 두면 5분마다 한 번씩 화면이 멈춘다.

    워치리스트에 종목을 추가하면 9.3초가 걸렸고 그중 6.2초가 이 재로딩이었다.
    문서를 쓰는 곳은 `build_index()` 하나뿐이고 그 경로가 캐시를 직접 버리므로,
    낡은 값을 잠깐 더 쓰면서 뒤에서 갈아 끼우는 편이 맞다.
    """
    released = threading.Event()

    def slow_read():
        released.wait(2.0)
        return {"count": 2, "documents": []}

    svc.invalidate_index_cache()
    monkeypatch.setattr(svc, "_read_index_from_store", lambda: {"count": 1, "documents": []})
    assert svc.load_index()["count"] == 1

    monkeypatch.setattr(svc, "INDEX_CACHE_TTL_SECONDS", 0.0)
    monkeypatch.setattr(svc, "_read_index_from_store", slow_read)

    started = time.monotonic()
    stale = svc.load_index()
    elapsed = time.monotonic() - started

    assert stale["count"] == 1, "만료되면 옛 값을 그대로 준다"
    assert elapsed < 0.5, f"기다리지 않아야 하는데 {elapsed:.2f}초 걸렸다"

    released.set()
    _wait_until(lambda: svc.load_index()["count"] == 2)
    svc.invalidate_index_cache()


def test_a_failed_background_refresh_keeps_the_old_value(monkeypatch):
    """갱신이 실패해도 화면은 계속 답을 받아야 한다."""
    svc.invalidate_index_cache()
    monkeypatch.setattr(svc, "_read_index_from_store", lambda: {"count": 1, "documents": []})
    assert svc.load_index()["count"] == 1

    monkeypatch.setattr(svc, "INDEX_CACHE_TTL_SECONDS", 0.0)

    def boom():
        raise RuntimeError("index unreadable")

    monkeypatch.setattr(svc, "_read_index_from_store", boom)

    assert svc.load_index()["count"] == 1
    time.sleep(0.2)
    assert svc.load_index()["count"] == 1
    svc.invalidate_index_cache()


def test_warming_never_breaks_startup(monkeypatch):
    """예열은 편의다. 실패해도 서버가 뜨는 것을 막지 않는다."""
    def boom():
        raise RuntimeError("index unreadable")

    monkeypatch.setattr(svc, "_read_index_from_store", boom)
    svc.invalidate_index_cache()

    svc.warm_index_cache()  # 예외가 새어 나오면 안 된다
    time.sleep(0.3)
    svc.invalidate_index_cache()


def test_paths_hang_off_the_workspace_not_the_app_folder(tmp_path, monkeypatch):
    """자료를 문서 폴더로 옮기면 색인이 `ValueError`로 죽고 있었다.

    `INBOX_DIR`은 `FOLIO_HOME`을 따라가는데 상대 경로만 앱 폴더를 봤다. 자료 폴더가
    앱 폴더 밖이면 `path.relative_to(ROOT)`가 예외를 던져 인덱싱 전체가 멈춘다 —
    옮기기가 성공해도 앱을 못 쓴다는 뜻이다.
    """
    moved = tmp_path / "Documents" / "FolioOS"
    article = moved / "research-inbox" / "rss" / "2026-08-09 09-00-00 - BBC - x.md"
    article.parent.mkdir(parents=True)
    article.write_text("body", encoding="utf-8")
    monkeypatch.setattr(svc, "workspace_root", lambda: moved)

    assert svc.workspace_relative(article).as_posix() == "research-inbox/rss/2026-08-09 09-00-00 - BBC - x.md"
    assert svc.should_index_file(article) is True


def test_the_collector_state_file_is_still_skipped_after_a_move(tmp_path, monkeypatch):
    moved = tmp_path / "FolioOS"
    state = moved / "research-inbox" / "rss" / ".state.json"
    state.parent.mkdir(parents=True)
    state.write_text("{}", encoding="utf-8")
    monkeypatch.setattr(svc, "workspace_root", lambda: moved)

    assert svc.should_index_file(state) is False
