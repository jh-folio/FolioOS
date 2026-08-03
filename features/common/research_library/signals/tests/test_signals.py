from __future__ import annotations

import datetime as dt
import sqlite3
import time

import pytest

from features.common.research_library.signals.adapters.generic_rss import normalize_feed_items
from features.common.research_library.signals.schema import latency_telemetry, normalize_signal
from features.common.research_library.signals.provider_settings import load_provider_settings, save_provider_settings
from features.common.research_library.signals.service import provider_health, purge_expired, query_signals, upsert_signal
from features.common.research_library.signals.runtime import _collect_rss_provider, _load_provider_config, _safe_error_code
from features.common.research_schema.evidence import is_countable_evidence
from features.common.research_schema.source_ledger import source_ledger_from_items

NOW = dt.datetime(2026, 8, 1, 0, 0, tzinfo=dt.timezone.utc)


def row(provider="benzinga", *, title="NVDA guidance update", url="https://www.benzinga.com/a", received=NOW):
    return {
        "provider": provider,
        "title": title,
        "url": url,
        "normalized_url": url,
        "provider_published_at": NOW - dt.timedelta(seconds=10),
        "received_at": received,
        "markets": ["US"],
        "related_tickers": ["NVDA"],
        "source_status": "active",
    }


def test_lead_is_never_countable_or_written_to_source_ledger():
    lead = {"type": "news", "intakeStage": "lead", "title": "lead", "url": "https://example.com"}
    assert is_countable_evidence(lead) is False
    assert source_ledger_from_items([lead], artifact_type="topic_report") == []


def test_signal_rejects_body_raw_and_unapproved_provider():
    with pytest.raises(ValueError, match="forbidden"):
        normalize_signal({**row(), "body": "must not persist"})
    with pytest.raises(ValueError, match="not_allowed"):
        normalize_signal({**row("first_squawk")})


def test_cluster_corroboration_and_cursor_query(tmp_path):
    db = tmp_path / "research-index.sqlite3"
    first = normalize_signal(row())
    second = normalize_signal(row("kr_existing"))
    upsert_signal(db, first)
    result = upsert_signal(db, second)
    assert result["signalStatus"] == "corroborated"
    page = query_signals(db, ticker="NVDA", market="US", limit=1)
    assert page["count"] == 1 and page["nextCursor"]
    next_page = query_signals(db, ticker="NVDA", cursor=page["nextCursor"], limit=1)
    assert next_page["count"] == 1
    assert "body" not in page["items"][0] and "summary" not in page["items"][0]


def test_retention_purge_is_lead_only(tmp_path):
    db = tmp_path / "research-index.sqlite3"
    expired = normalize_signal({**row(received=NOW - dt.timedelta(days=10)), "expires_at": NOW - dt.timedelta(days=1)})
    upsert_signal(db, expired)
    with sqlite3.connect(db) as conn:
        conn.execute(
            "INSERT INTO evidence_items (id,collector,source_type,source,title,url,normalized_url,published_at_utc,collected_at_utc,query,query_source,summary,collection_status,relevance_score,search_score,related_tickers,related_themes,event_id,narrative_ids,reliability_tier,markdown_path) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            ("ev", "rss", "news", "Reuters", "evidence", "u", "u", "", "", "", "", "", "summary_only", 1, None, "[]", "[]", "", "[]", 2, "x"),
        )
        conn.commit()
    assert purge_expired(db, now=NOW) == 1
    with sqlite3.connect(db) as conn:
        assert conn.execute("SELECT count(*) FROM evidence_items WHERE id='ev'").fetchone()[0] == 1


def test_latency_rejects_clock_skew():
    signal = normalize_signal({**row(), "event_at": NOW + dt.timedelta(hours=1)})
    telemetry = latency_telemetry(signal)
    assert telemetry["originLatencySeconds"] is None
    assert telemetry["valid"] is False


def test_provider_overrides_are_optional_and_round_trip(tmp_path):
    # 기본은 "설정 없음"이며 config 기본값(공개 피드 on)을 덮지 않는다.
    assert load_provider_settings(tmp_path) == {}
    saved = save_provider_settings(tmp_path, {"benzinga": {"enabled": True}})
    assert saved == {"benzinga": {"enabled": True}}
    assert load_provider_settings(tmp_path) == saved


def test_provider_overlay_rejects_non_mapping_rows(tmp_path):
    assert save_provider_settings(tmp_path, {"benzinga": 1, "kr_existing": "on"}) == {}


def test_disabled_provider_reports_disabled_not_failure(tmp_path, monkeypatch):
    monkeypatch.setattr("features.common.research_library.signals.runtime.load_dotenv", lambda: None)
    assert _collect_rss_provider("benzinga", {"enabled": False}, data_dir=tmp_path, state={}) == 0
    row = provider_health(tmp_path)["benzinga"]
    assert row["sourceStatus"] == "disabled"
    assert row["errorCode"] == "provider_disabled"


def test_kr_fast_origin_excludes_maeil_kyungjae():
    from features.common.research_library.signals.runtime import KR_FAST_ORIGIN_SOURCES

    assert "매일경제" not in KR_FAST_ORIGIN_SOURCES
    assert KR_FAST_ORIGIN_SOURCES == {"연합인포맥스", "연합뉴스"}


def test_investing_com_is_out_of_scope():
    from features.common.research_library.signals.provider_settings import PROVIDERS
    from features.common.research_library.signals.schema import APPROVED_PROVIDERS, normalized_provider

    assert "investing" not in APPROVED_PROVIDERS
    assert "investing" not in PROVIDERS
    assert normalized_provider("investing_com") == "investing_com"


def test_signal_cursor_query_p95_is_below_150ms_for_100_rows(tmp_path):
    db = tmp_path / "research-index.sqlite3"
    for index in range(100):
        observed = NOW - dt.timedelta(seconds=index)
        upsert_signal(
            db,
            normalize_signal(
                row(
                    title=f"NVDA signal {index}",
                    url=f"https://www.benzinga.com/{index}",
                    received=observed,
                )
            ),
        )

    durations = []
    for _ in range(30):
        started = time.perf_counter()
        page = query_signals(db, ticker="NVDA", market="US", limit=100)
        durations.append((time.perf_counter() - started) * 1000)
        assert page["count"] == 100

    p95_ms = sorted(durations)[int(len(durations) * 0.95) - 1]
    assert p95_ms < 150


def test_provider_health_error_code_never_echoes_secret_or_url():
    secret = "super-secret-api-key"
    code = _safe_error_code(RuntimeError(f"Handshake status 401 for wss://example.test?apikey={secret}"))
    assert code == "provider_unauthorized"
    assert secret not in code
    assert "example.test" not in code


