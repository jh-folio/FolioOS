from __future__ import annotations

import json
import time

from features.dashboard.routes import create_dashboard_router
from features.dashboard.schema import native_symbol, normalize_dashboard_settings
from features.dashboard.service import build_cockpit_payload, focus_symbols


def test_native_symbol_mapping_is_explicit_and_deterministic():
    assert native_symbol("NASDAQ:NVDA") == "NVDA"
    assert native_symbol("KRX:005930") == "005930.KS"
    assert native_symbol("FOREXCOM:SPXUSD") == "SPY"
    assert native_symbol("javascript:bad") == ""


def test_dashboard_market_settings_use_canonical_europe_code():
    assert normalize_dashboard_settings({"calendarMarket": "EU"})["calendarMarket"] == "EUROPE"
    assert normalize_dashboard_settings({"calendarMarket": "JP"})["calendarMarket"] == "JP"
    assert normalize_dashboard_settings({"calendarMarket": "MARS"})["calendarMarket"] == "all"


def test_absent_settings_watchlist_and_portfolio_use_safe_defaults(tmp_path):
    assert focus_symbols(tmp_path) == [
        {"symbol": "SPY", "label": "S&P 500", "source": "fallback"},
        {"symbol": "^KS11", "label": "KOSPI", "source": "fallback"},
    ]
    payload = build_cockpit_payload(tmp_path)
    assert payload["mode"] == "cockpit"
    assert payload["portfolioState"] == "empty"
    assert payload["implications"] == []
    assert payload["telemetry"]["upstreamRequests"] == 0


def test_cockpit_fixture_slo_30_runs(tmp_path):
    samples = []
    for _ in range(30):
        started = time.perf_counter()
        payload = build_cockpit_payload(tmp_path)
        samples.append((time.perf_counter() - started) * 1000)
    p95 = sorted(samples)[int(len(samples) * 0.95) - 1]
    assert p95 <= 300
    assert len(json.dumps(payload, ensure_ascii=False).encode("utf-8")) <= 150_000


def test_initial_cockpit_route_handler_p95_is_below_500ms(tmp_path):
    router = create_dashboard_router(tmp_path)
    endpoint = next(route.endpoint for route in router.routes if route.path == "/api/dashboard/cockpit")
    endpoint()  # warm local import and route machinery
    samples = []
    for _ in range(30):
        started = time.perf_counter()
        response = endpoint()
        samples.append((time.perf_counter() - started) * 1000)
        assert response["telemetry"]["upstreamRequests"] == 0
    p95 = sorted(samples)[int(len(samples) * 0.95) - 1]
    assert p95 <= 500


def test_cockpit_hides_noise_statuses_and_counts_them(tmp_path, monkeypatch):
    from features.dashboard import service

    rows = [
        {"status": "major_change", "artifactKind": "briefing", "artifactId": "2026-08-01.us", "lineageId": "briefing:us", "generatedAt": "2026-08-01T01:00:00Z", "invalidationToken": "t1"},
        {"status": "developing_signal", "artifactKind": "topic_report", "artifactId": "abc", "lineageId": "topic:abc", "generatedAt": "2026-08-01T00:50:00Z"},
        {"status": "baseline_created", "artifactKind": "briefing", "artifactId": "2026-06-10", "lineageId": "briefing:us", "generatedAt": "2026-08-01T00:40:00Z"},
        {"status": "insufficient_basis", "artifactKind": "topic_report", "artifactId": "def", "lineageId": "topic:def", "generatedAt": "2026-08-01T00:30:00Z"},
        {"status": "no_material_change", "artifactKind": "briefing", "artifactId": "2026-07-30.us", "lineageId": "briefing:us", "generatedAt": "2026-08-01T00:20:00Z"},
    ]
    monkeypatch.setattr(service, "list_change_events", lambda *_args, **_kwargs: rows)
    payload = service.build_cockpit_payload(tmp_path)
    statuses = {row["status"] for row in payload["changes"]}
    assert statuses == {"major_change", "developing_signal"}
    assert {row["status"] for row in payload["quietChanges"]} == {"baseline_created", "insufficient_basis", "no_material_change"}
    assert payload["changeCounts"] == {"majorChange": 1, "developingSignal": 1, "conflictingUncertain": 0, "quiet": 3}
    assert payload["invalidationToken"] == "t1"
