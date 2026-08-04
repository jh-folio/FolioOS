from __future__ import annotations

import datetime as dt
import sqlite3
import time

import pytest

from features.common.research_library.signals.adapters.generic_rss import normalize_feed_items
from features.common.research_library.signals.schema import latency_telemetry, normalize_signal
from features.common.research_library.signals.service import provider_health, purge_expired, query_signals, upsert_signal
from features.common.research_library.signals.runtime import _safe_error_code
from features.common.research_schema.evidence import is_countable_evidence
from features.common.research_schema.source_ledger import source_ledger_from_items

NOW = dt.datetime(2026, 8, 1, 0, 0, tzinfo=dt.timezone.utc)


def row(provider="kr_existing", *, title="NVDA guidance update", url="https://example.test/a", received=NOW):
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


def test_same_provider_repeats_do_not_corroborate(tmp_path):
    """교차 확인은 독립 provider가 있어야 성립한다.

    승인된 fast-origin provider가 kr_existing 하나뿐이라 lead끼리의 교차 확인은
    현재 도달할 수 없는 경로다. 같은 매체가 두 번 실었다고 확인된 것이 아니므로
    unconfirmed로 남아야 한다. 확인은 공식 자료 경로(confirm_signal)가 담당한다.
    """
    db = tmp_path / "research-index.sqlite3"
    upsert_signal(db, normalize_signal(row()))
    result = upsert_signal(db, normalize_signal(row(url="https://example.test/b")))
    assert result["signalStatus"] == "unconfirmed"


def test_cursor_query_pages_and_hides_body(tmp_path):
    db = tmp_path / "research-index.sqlite3"
    upsert_signal(db, normalize_signal(row()))
    upsert_signal(db, normalize_signal(row(url="https://example.test/b")))
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


def test_only_kr_existing_is_an_approved_fast_origin_provider():
    """승인 목록이 비면 lead 승격 경로가 조용히 늘어날 수 없다."""
    from features.common.research_library.signals.schema import APPROVED_PROVIDERS

    assert APPROVED_PROVIDERS == {"kr_existing"}


def test_collect_signals_once_needs_no_network_or_credentials(tmp_path):
    """남은 fast-origin 경로는 이미 수집된 행을 다시 읽는 것뿐이다."""
    from features.common.research_library.signals.runtime import collect_signals_once

    result = collect_signals_once(tmp_path, tmp_path / "evidence_sources.yaml")
    assert result["ok"] is True
    assert set(result["providers"]) == {"kr_existing"}


def test_kr_fast_origin_excludes_maeil_kyungjae():
    from features.common.research_library.signals.runtime import KR_FAST_ORIGIN_SOURCES

    assert "매일경제" not in KR_FAST_ORIGIN_SOURCES
    assert KR_FAST_ORIGIN_SOURCES == {"연합인포맥스", "연합뉴스"}


def test_removed_providers_are_out_of_scope():
    from features.common.research_library.signals.schema import APPROVED_PROVIDERS, normalized_provider

    for provider in ("investing", "benzinga", "financialjuice"):
        assert provider not in APPROVED_PROVIDERS
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
                    url=f"https://example.test/{index}",
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


def test_retired_provider_leads_stay_out_of_query_results(tmp_path):
    """승인 목록에서 내린 provider의 과거 lead는 DB에 남아 있어도 조회되면 안 된다.

    실제 사용자 DB에 FinancialJuice lead 228건이 남아 워치리스트에 계속 떴다.
    어댑터를 지우는 것만으로는 이미 저장된 행이 사라지지 않는다.
    """
    db = tmp_path / "research-index.sqlite3"
    upsert_signal(db, normalize_signal(row()))
    # 수집 당시에는 유효했던 provider 행을 흉내낸다(지금은 normalize_signal이 거부한다).
    with sqlite3.connect(db) as conn:
        conn.execute("UPDATE evidence_items SET source='financialjuice' WHERE intake_stage='lead'")
        conn.commit()

    page = query_signals(db, limit=50)
    assert page["count"] == 0, "내려간 provider의 lead가 조회됐습니다"


def test_provider_health_hides_retired_providers(tmp_path):
    from features.common.research_library.signals.service import provider_health, provider_health_path
    from features.common.utils import write_json

    write_json(provider_health_path(tmp_path), {
        "kr_existing": {"provider": "kr_existing", "sourceStatus": "active"},
        "financialjuice": {"provider": "financialjuice", "sourceStatus": "disabled"},
        "benzinga": {"provider": "benzinga", "sourceStatus": "disabled"},
    })
    rows = provider_health(tmp_path)
    assert set(rows) == {"kr_existing"}

