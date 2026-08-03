"""Parallel cached facade for FRED/BOK macro providers."""
from __future__ import annotations

from pathlib import Path
from typing import Callable

from .fetch_runtime import FetchPolicy, ProviderFetchRuntime


def fetch_macro_data_cached(*, cache_root: Path, fred_series: list[str], bok_series: list[str], fred_fetcher: Callable[[], dict] | None, bok_fetcher: Callable[[], dict] | None, runtime: ProviderFetchRuntime | None = None) -> dict:
    runtime = runtime or ProviderFetchRuntime(cache_root, max_workers=4)
    requests = []
    if fred_fetcher is not None:
        requests.append({"provider": "fred", "operation": "series_observations", "params": {"series": sorted(fred_series)}, "fetcher": fred_fetcher, "policy": FetchPolicy(ttl_seconds=3600, timeout_seconds=18, stale_while_revalidate_seconds=7 * 86400)})
    if bok_fetcher is not None:
        requests.append({"provider": "bok", "operation": "series_observations", "params": {"series": sorted(bok_series)}, "fetcher": bok_fetcher, "policy": FetchPolicy(ttl_seconds=3600, timeout_seconds=18, stale_while_revalidate_seconds=7 * 86400)})
    results = runtime.fetch_many(requests)

    def decorated(provider: str) -> dict:
        row = results.get(provider) or {"value": {"ok": False, "reason": "skipped", "series": {}}, "status": "unavailable", "provider": provider, "fallbackReason": "no_key"}
        value = row.get("value") if isinstance(row.get("value"), dict) else {"ok": False, "series": {}}
        return {**value, "asOf": row.get("asOf") or "", "fetchedAt": row.get("fetchedAt") or "", "status": row.get("status") or "unavailable", "provider": provider, "fallbackReason": row.get("fallbackReason") or ""}

    fred_payload = decorated("fred")
    bok_payload = decorated("bok")
    return {"ok": bool(fred_payload.get("ok") or bok_payload.get("ok")), "fred": fred_payload, "bok": bok_payload}
