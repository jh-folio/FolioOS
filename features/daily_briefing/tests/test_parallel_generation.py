"""Task 3.1b — markets generate concurrently, and one slow market cannot block the rest.

Sequential generation made four markets cost four times the baseline, and a
single provider stall held the other three hostage.
"""
from __future__ import annotations

import threading
import time

import pytest

from features.daily_briefing.builder import (
    MARKET_GENERATION_TIMEOUT_SECONDS,
    generate_scope_results,
)

MARKETS = ["us", "kr", "europe", "jp"]


def test_markets_run_concurrently_rather_than_one_after_another():
    """Four 0.3s markets finish in about 0.3s, not 1.2s."""
    def build(scope):
        time.sleep(0.3)
        return {"scope": scope}

    started = time.monotonic()
    results, warnings = generate_scope_results(MARKETS, build)
    elapsed = time.monotonic() - started

    assert sorted(results) == sorted(MARKETS)
    assert warnings == []
    assert elapsed < 0.9, f"markets appear to be sequential ({elapsed:.2f}s)"


def test_each_market_gets_its_own_thread():
    seen = set()

    def build(scope):
        seen.add(threading.current_thread().name)
        time.sleep(0.05)
        return {"scope": scope}

    generate_scope_results(MARKETS, build)
    assert len(seen) > 1


def test_a_stalled_market_does_not_hold_the_others():
    def build(scope):
        if scope == "europe":
            time.sleep(30)
        return {"scope": scope}

    started = time.monotonic()
    results, warnings = generate_scope_results(MARKETS, build, timeout=0.5)
    elapsed = time.monotonic() - started

    assert sorted(results) == ["jp", "kr", "us"]
    assert any("europe" in text for text in warnings)
    # 멈춘 스레드를 기다리면 타임아웃으로 아낀 시간을 그대로 되돌려준다.
    assert elapsed < 5, f"the pool waited for the straggler ({elapsed:.2f}s)"


def test_a_failing_market_is_named_and_the_rest_survive():
    def build(scope):
        if scope == "jp":
            raise RuntimeError("provider down")
        return {"scope": scope}

    results, warnings = generate_scope_results(["us", "kr", "jp"], build)
    assert sorted(results) == ["kr", "us"]
    assert any("jp" in text and "RuntimeError" in text for text in warnings)


def test_a_single_market_skips_the_pool_entirely():
    """One market has nothing to overlap; a pool would only add latency."""
    def build(scope):
        assert threading.current_thread() is threading.main_thread()
        return {"scope": scope}

    results, warnings = generate_scope_results(["europe"], build)
    assert results == {"europe": {"scope": "europe"}}
    assert warnings == []


def test_no_markets_returns_nothing_rather_than_failing():
    results, warnings = generate_scope_results([], lambda scope: {})
    assert results == {} and warnings == []


def test_results_keep_their_own_market_and_do_not_cross():
    """Threads share the document pool, so a crossed result would be silent."""
    def build(scope):
        time.sleep(0.05)
        return {"scope": scope, "markdown": f"# {scope} body"}

    results, _ = generate_scope_results(MARKETS, build)
    for scope in MARKETS:
        assert results[scope]["scope"] == scope
        assert f"# {scope} body" == results[scope]["markdown"]


def test_the_default_timeout_is_generous_enough_for_an_llm_call():
    # 시장당 LLM 호출이라 짧게 잡으면 정상 생성을 잘라낸다.
    assert MARKET_GENERATION_TIMEOUT_SECONDS >= 600


@pytest.mark.parametrize("failing", [["us"], ["us", "kr"], MARKETS])
def test_partial_coverage_is_reported_for_every_failure_shape(failing):
    def build(scope):
        if scope in failing:
            raise RuntimeError("down")
        return {"scope": scope}

    results, warnings = generate_scope_results(MARKETS, build)
    assert sorted(results) == sorted(set(MARKETS) - set(failing))
    assert len(warnings) == len(failing)
