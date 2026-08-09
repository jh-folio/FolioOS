"""인덱스 캐시 — 첫 탭 로딩이 13.9초 걸리던 원인."""
from __future__ import annotations

import time

import features.common.research_library.indexing.service as svc


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
    monkeypatch.setattr(svc, "_read_index_from_store", lambda: calls.append(1) or {"count": 1, "documents": []})
    monkeypatch.setattr(svc, "INDEX_CACHE_TTL_SECONDS", 0.05)
    svc.invalidate_index_cache()

    svc.load_index()
    time.sleep(0.08)
    svc.load_index()

    assert len(calls) == 2
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
