"""섹터를 모르는 출처로 해석된 회사에 섹터를 붙인다."""
import json

import pytest

from features.common import sector_cache


@pytest.fixture(autouse=True)
def _isolated_cache(tmp_path, monkeypatch):
    monkeypatch.setattr(sector_cache, "CACHE_PATH", tmp_path / "sector-cache.json")
    sector_cache.reset_cache_for_tests()
    yield
    sector_cache.reset_cache_for_tests()


def test_a_tokyo_listing_keeps_its_dot_but_a_share_class_does_not():
    """끝의 점이 두 가지를 뜻한다.

    `BRK.B`는 미국 클래스 구분이라 Yahoo가 `BRK-B`로 쓰고, `7203.T`는 도쿄 상장이라
    점을 그대로 둔다. 뒤엣것을 앞엣것처럼 고치면 없는 `7203-T`를 묻게 된다.
    """
    assert sector_cache.quote_symbols("BRK.B", "US") == ["BRK-B"]
    assert sector_cache.quote_symbols("7203.T", "JP") == ["7203.T"]
    assert sector_cache.quote_symbols("LRCX", "US") == ["LRCX"]
    assert sector_cache.quote_symbols("005930", "KR") == ["005930.KS", "005930.KQ"]
    assert sector_cache.quote_symbols("000660", "KQ") == ["000660.KQ", "000660.KS"]


def test_a_theme_keyword_is_never_asked_about():
    """워치리스트에는 회사가 아닌 관심 주제도 들어간다. 티커가 아니면 묻지 않는다."""
    assert sector_cache.quote_symbols("AI 반도체", "") == []
    assert sector_cache.quote_symbols("", "") == []


def test_the_sector_is_asked_once_and_then_served_from_the_cache(monkeypatch):
    calls = []
    monkeypatch.setattr(sector_cache, "_lookup", lambda t, m: calls.append(t) or "Technology")

    assert sector_cache.resolve_sectors([("LRCX", "US")]) == {"LRCX": "Technology"}
    assert sector_cache.resolve_sectors([("LRCX", "US")]) == {"LRCX": "Technology"}

    assert calls == ["LRCX"]


def test_a_failure_is_remembered_so_it_does_not_burn_the_network_every_load(monkeypatch):
    """상장폐지 종목처럼 답이 없는 항목을 매번 물으면 화면을 열 때마다 값을 치른다."""
    calls = []
    monkeypatch.setattr(sector_cache, "_lookup", lambda t, m: calls.append(t) or "")

    assert sector_cache.resolve_sectors([("GONE", "US")]) == {"GONE": ""}
    assert sector_cache.resolve_sectors([("GONE", "US")]) == {"GONE": ""}

    assert calls == ["GONE"]
    # 다만 짧게 잡는다. 일시적 실패가 90일 눌러앉으면 안 된다.
    assert sector_cache.MISS_TTL_SECONDS < sector_cache.HIT_TTL_SECONDS


def test_a_hung_lookup_is_cut_loose_and_not_written_as_no_sector(monkeypatch):
    """네트워크가 죽어 있으면 요청 하나가 오래 매달린다. 그동안 화면 전체가 기다린다.

    못 받은 것은 캐시에 적지 않는다 — 죽은 네트워크를 "이 회사는 섹터가 없다"로
    굳히면 살아난 뒤에도 계속 빈 채로 남는다.
    """
    import threading

    monkeypatch.setattr(sector_cache, "LOOKUP_DEADLINE_SECONDS", 0.2)
    release = threading.Event()
    monkeypatch.setattr(sector_cache, "_lookup", lambda t, m: release.wait(30) or "Technology")

    try:
        assert sector_cache.resolve_sectors([("LRCX", "US")]) == {}
        assert sector_cache.cached_sector("LRCX") == ""
    finally:
        release.set()


def test_the_cache_survives_a_corrupt_file(monkeypatch):
    sector_cache.CACHE_PATH.write_text("{ not json", encoding="utf-8")
    sector_cache.reset_cache_for_tests()
    monkeypatch.setattr(sector_cache, "_lookup", lambda t, m: "Industrials")

    assert sector_cache.resolve_sectors([("HWM", "US")]) == {"HWM": "Industrials"}
    assert json.loads(sector_cache.CACHE_PATH.read_text(encoding="utf-8"))["tickers"]["HWM"]["sector"] == "Industrials"


def test_one_call_never_asks_about_more_than_a_bounded_batch(monkeypatch):
    """처음 여는 큰 워치리스트가 화면을 몇 초씩 잡으면 안 된다."""
    calls = []
    monkeypatch.setattr(sector_cache, "_lookup", lambda t, m: calls.append(t) or "Technology")

    letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    entries = [(f"TIC{letters[i // 26]}{letters[i % 26]}", "US") for i in range(40)]
    sector_cache.resolve_sectors(entries)

    assert len(calls) == sector_cache.MAX_LOOKUPS_PER_CALL
