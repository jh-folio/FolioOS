"""Provider-aware cache/fetch runtime with bounded concurrency."""
from __future__ import annotations

import concurrent.futures
import datetime as dt
import threading
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

from .cache import SemanticCache, semantic_key


@dataclass(frozen=True)
class FetchPolicy:
    ttl_seconds: int = 900
    timeout_seconds: int = 15
    stale_while_revalidate_seconds: int = 86400
    failure_threshold: int = 3
    cooldown_seconds: int = 120


class ProviderFetchRuntime:
    def __init__(self, cache_root: Path, *, max_workers: int = 4, clock=None):
        self.clock = clock or (lambda: dt.datetime.now(dt.timezone.utc))
        self.cache = SemanticCache(cache_root, clock=self.clock)
        self.pool = concurrent.futures.ThreadPoolExecutor(max_workers=max(1, min(int(max_workers), 8)))
        self._lock = threading.Lock()
        self._failures: dict[str, int] = {}
        self._opened_at: dict[str, dt.datetime] = {}
        self._refreshing: set[str] = set()

    def _circuit_open(self, provider: str, policy: FetchPolicy) -> bool:
        with self._lock:
            opened = self._opened_at.get(provider)
        return bool(opened and (self.clock() - opened).total_seconds() < policy.cooldown_seconds)

    def _success(self, provider: str) -> None:
        with self._lock:
            self._failures[provider] = 0
            self._opened_at.pop(provider, None)

    def _failure(self, provider: str, policy: FetchPolicy) -> None:
        with self._lock:
            count = self._failures.get(provider, 0) + 1
            self._failures[provider] = count
            if count >= policy.failure_threshold:
                self._opened_at[provider] = self.clock()

    def _network_fetch(self, provider: str, key: str, fetcher: Callable[[], object], policy: FetchPolicy) -> dict:
        future = self.pool.submit(fetcher)
        try:
            value = future.result(timeout=max(1, min(int(policy.timeout_seconds), 60)))
        except Exception as exc:
            future.cancel()
            self._failure(provider, policy)
            raise RuntimeError(f"{provider}_fetch_failed") from exc
        self._success(provider)
        as_of = str(value.get("asOf") or value.get("as_of") or "") if isinstance(value, dict) else ""
        row = self.cache.write(key, value, provider=provider, as_of=as_of)
        return {"value": value, "asOf": row["asOf"], "fetchedAt": row["fetchedAt"], "status": "fresh", "provider": provider, "fallbackReason": ""}

    def _background_refresh(self, provider: str, key: str, fetcher: Callable[[], object], policy: FetchPolicy) -> None:
        with self._lock:
            if key in self._refreshing:
                return
            self._refreshing.add(key)

        def completed(future: concurrent.futures.Future) -> None:
            try:
                value = future.result()
                self._success(provider)
                as_of = str(value.get("asOf") or value.get("as_of") or "") if isinstance(value, dict) else ""
                self.cache.write(key, value, provider=provider, as_of=as_of)
            except Exception:
                self._failure(provider, policy)
            finally:
                with self._lock:
                    self._refreshing.discard(key)

        self.pool.submit(fetcher).add_done_callback(completed)

    def fetch(self, provider: str, operation: str, params: dict, fetcher: Callable[[], object], *, policy: FetchPolicy | None = None, background_refresh: bool = True) -> dict:
        policy = policy or FetchPolicy()
        key = semantic_key(provider, operation, params)
        cached = self.cache.read(key, ttl_seconds=policy.ttl_seconds)
        if cached["fresh"]:
            meta = cached["metadata"]
            return {"value": cached["value"], "asOf": meta.get("asOf"), "fetchedAt": meta.get("fetchedAt"), "status": "cached", "provider": provider, "fallbackReason": ""}
        age = cached.get("ageSeconds")
        stale_usable = cached["hit"] and age is not None and age <= policy.stale_while_revalidate_seconds
        if self._circuit_open(provider, policy):
            return {"value": cached.get("value"), "asOf": cached.get("metadata", {}).get("asOf"), "fetchedAt": cached.get("metadata", {}).get("fetchedAt"), "status": "stale" if cached["hit"] else "unavailable", "provider": provider, "fallbackReason": "circuit_open"}
        if stale_usable and background_refresh:
            self._background_refresh(provider, key, fetcher, policy)
            return {"value": cached["value"], "asOf": cached["metadata"].get("asOf"), "fetchedAt": cached["metadata"].get("fetchedAt"), "status": "stale", "provider": provider, "fallbackReason": "stale_while_revalidate"}
        try:
            return self._network_fetch(provider, key, fetcher, policy)
        except RuntimeError:
            return {"value": cached.get("value"), "asOf": cached.get("metadata", {}).get("asOf"), "fetchedAt": cached.get("metadata", {}).get("fetchedAt"), "status": "stale" if cached["hit"] else "unavailable", "provider": provider, "fallbackReason": "fetch_failed"}

    def fetch_many(self, requests: list[dict]) -> dict[str, dict]:
        selected = requests[:8]
        results: dict[str, dict] = {}
        # Orchestration workers are separate from the bounded network pool used by
        # fetch(), so N callers cannot occupy every network worker while waiting.
        with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, len(selected))) as orchestration_pool:
            futures = {
                orchestration_pool.submit(self.fetch, row["provider"], row["operation"], row.get("params") or {}, row["fetcher"], policy=row.get("policy"), background_refresh=row.get("backgroundRefresh", True)): row["provider"]
                for row in selected
            }
            for future, provider in futures.items():
                try:
                    results[provider] = future.result()
                except Exception:
                    results[provider] = {"value": None, "asOf": "", "fetchedAt": "", "status": "unavailable", "provider": provider, "fallbackReason": "runtime_failed"}
        return results
