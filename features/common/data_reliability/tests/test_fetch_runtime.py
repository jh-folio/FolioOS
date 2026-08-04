from __future__ import annotations

import datetime as dt
import time

from features.common.data_reliability.fetch_runtime import FetchPolicy, ProviderFetchRuntime
from features.common.data_reliability.macro_fetch import fetch_macro_data_cached


def test_fresh_cache_hit_never_calls_network(tmp_path):
    now = dt.datetime(2026, 8, 1, tzinfo=dt.timezone.utc)
    runtime = ProviderFetchRuntime(tmp_path, clock=lambda: now)
    calls = []

    first = runtime.fetch("fred", "series", {"id": "CPI"}, lambda: calls.append("network") or {"ok": True})
    second = runtime.fetch("fred", "series", {"id": "CPI"}, lambda: calls.append("unexpected") or {})
    assert first["status"] == "fresh"
    assert second["status"] == "cached"
    assert calls == ["network"]


def test_last_known_good_survives_fetch_failure(tmp_path):
    clock = [dt.datetime(2026, 8, 1, tzinfo=dt.timezone.utc)]
    runtime = ProviderFetchRuntime(tmp_path, clock=lambda: clock[0])
    policy = FetchPolicy(ttl_seconds=1, stale_while_revalidate_seconds=0)
    runtime.fetch("bok", "series", {}, lambda: {"ok": True, "series": {"A": 1}}, policy=policy)
    clock[0] += dt.timedelta(seconds=2)
    row = runtime.fetch("bok", "series", {}, lambda: (_ for _ in ()).throw(RuntimeError("down")), policy=policy, background_refresh=False)
    assert row["status"] == "stale"
    assert row["value"]["series"]["A"] == 1
    assert row["fallbackReason"] == "fetch_failed"


def test_macro_providers_are_fetched_in_bounded_parallel(tmp_path):
    def slow(provider):
        time.sleep(0.08)
        return {"ok": True, "series": {provider: {"latest": 1}}}

    started = time.perf_counter()
    result = fetch_macro_data_cached(
        cache_root=tmp_path,
        fred_series=["A"],
        bok_series=["B"],
        fred_fetcher=lambda: slow("fred"),
        bok_fetcher=lambda: slow("bok"),
    )
    elapsed = time.perf_counter() - started
    assert result["ok"] is True
    assert elapsed < 0.15
    for provider in ("fred", "bok"):
        assert {"asOf", "fetchedAt", "status", "provider", "fallbackReason"} <= result[provider].keys()


def test_fetch_many_does_not_deadlock_when_requests_equal_network_workers(tmp_path):
    runtime = ProviderFetchRuntime(tmp_path, max_workers=2)
    requests = [
        {"provider": f"provider-{index}", "operation": "series", "params": {"id": index}, "fetcher": lambda index=index: {"ok": True, "index": index}}
        for index in range(4)
    ]
    started = time.perf_counter()
    result = runtime.fetch_many(requests)
    assert time.perf_counter() - started < 1
    assert len(result) == 4
    assert all(row["status"] == "fresh" for row in result.values())
