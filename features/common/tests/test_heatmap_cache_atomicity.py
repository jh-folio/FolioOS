"""히트맵 last-good 캐시는 부가물이다 — 저장 실패로 스냅샷을 버리면 안 된다.

Windows에서 백신·색인기가 캐시 파일을 잠깐 잡으면 `os.replace()`가 거부된다.
예전에는 재시도도 예외 처리도 없어서, 시세를 이미 다 받아 rows까지 만든 뒤에
캐시 저장 하나 때문에 그 시장 히트맵이 통째로 비었다.
"""
from __future__ import annotations

import gzip
import json
import os
from pathlib import Path

from features.common.market_data.market_universe import (
    build_kospi_heatmap_snapshot,
    load_last_good_snapshot,
    save_last_good_snapshot,
)

PAYLOAD = {"market": "KR", "rows": [{"ticker": "005930", "close": 1.0}], "asOf": "2026-08-14"}

CONSTITUENTS = [
    {"ticker": "005930", "providerSymbol": "005930.KS", "name": "삼성전자", "marketCap": 4.0e11},
]


def _prices(_symbols, date):
    return {"005930.KS": {"close": 70000.0, "previousClose": 69000.0, "asOf": date, "provider": "yfinance"}}


def test_a_transient_denial_does_not_lose_the_cache(tmp_path: Path, monkeypatch) -> None:
    target = tmp_path / "kospi-heatmap-last-good.json.gz"
    real_replace = os.replace
    calls = {"n": 0}

    def flaky(src, dst):
        calls["n"] += 1
        if calls["n"] < 3:
            raise PermissionError(32, "The process cannot access the file")
        return real_replace(src, dst)

    monkeypatch.setattr(os, "replace", flaky)
    monkeypatch.setattr("features.common.atomic_replace.time.sleep", lambda _seconds: None)

    assert save_last_good_snapshot(target, PAYLOAD) is True
    assert load_last_good_snapshot(target) == PAYLOAD
    assert calls["n"] == 3, "재시도 없이 한 번에 포기하면 안 된다"


def test_a_permanent_denial_is_reported_not_raised(tmp_path: Path, monkeypatch) -> None:
    target = tmp_path / "kospi-heatmap-last-good.json.gz"

    monkeypatch.setattr(os, "replace", lambda _src, _dst: (_ for _ in ()).throw(PermissionError(5, "denied")))
    monkeypatch.setattr("features.common.atomic_replace.time.sleep", lambda _seconds: None)

    assert save_last_good_snapshot(target, PAYLOAD) is False
    assert not target.exists()
    assert list(tmp_path.iterdir()) == [], "잔여 임시 파일이 남았다"


def test_a_cache_write_failure_does_not_empty_the_heatmap(tmp_path: Path, monkeypatch) -> None:
    """시세를 이미 받아 둔 스냅샷이 캐시 저장 실패로 사라지면 안 된다."""
    monkeypatch.setattr(os, "replace", lambda _src, _dst: (_ for _ in ()).throw(PermissionError(5, "denied")))
    monkeypatch.setattr("features.common.atomic_replace.time.sleep", lambda _seconds: None)

    snapshot = build_kospi_heatmap_snapshot(
        "2026-08-14",
        cache_dir=tmp_path,
        fallback_constituents=CONSTITUENTS,
        fallback_price_fetcher=_prices,
    )

    assert snapshot["rows"], "캐시 저장 실패가 rows를 버렸다"
    assert snapshot["freshness"] != "unavailable"


def test_the_saved_file_is_still_gzipped_json(tmp_path: Path) -> None:
    target = tmp_path / "nested" / "kospi-heatmap-last-good.json.gz"
    assert save_last_good_snapshot(target, PAYLOAD) is True
    with gzip.open(target, "rt", encoding="utf-8") as stream:
        assert json.load(stream) == PAYLOAD
