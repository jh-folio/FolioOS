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
    # NOW 기준으로 묻는다. 조회가 보존 기간을 적용하므로 실제 시계로 물으면 이
    # 고정 시각 lead는 이미 만료다.
    page = query_signals(db, ticker="NVDA", market="US", limit=1, now=NOW)
    assert page["count"] == 1 and page["nextCursor"]
    next_page = query_signals(db, ticker="NVDA", cursor=page["nextCursor"], limit=1, now=NOW)
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


def test_the_rss_collection_enforces_the_retention_window(tmp_path):
    """purge를 부르는 곳이 없어 보존 기간(3/14/30일)이 한 번도 집행되지 않았다.

    0.5에서 signals 자동화 kind를 없애며 `collect_signals_once`가 호출부를 잃었고,
    RSS 수집과 함께 도는 것은 승격뿐이었다. lead 행은 `markdown_path`가 비어 있어
    `prune_orphan_evidence`도 걷어내지 못하므로 무기한 쌓인다.
    """
    from features.common.research_library.rss.store import save_evidence_item
    from features.common.research_library.signals.runtime import promote_kr_rss_leads

    db = tmp_path / "research-index.sqlite3"
    stale = normalize_signal({
        **row(received=NOW - dt.timedelta(days=200)),
        "expires_at": NOW - dt.timedelta(days=190),
    })
    upsert_signal(db, stale)
    fresh = dt.datetime.now(dt.timezone.utc).isoformat()
    save_evidence_item(db, {
        "id": "yna-1",
        "collector": "rss",
        "source_type": "news",
        "source": "연합뉴스",
        "title": "속보 헤드라인",
        "url": "https://yna.test/1",
        "normalized_url": "https://yna.test/1",
        "published_at_utc": fresh,
        "collected_at_utc": fresh,
        "related_tickers": [],
        "reliability_tier": 2,
    }, "research-inbox/rss/2026-08-15 09-00-00 - 연합뉴스 - 속보.md")

    assert promote_kr_rss_leads(tmp_path) == 1

    with sqlite3.connect(db) as conn:
        leads = [r[0] for r in conn.execute("SELECT id FROM evidence_items WHERE intake_stage='lead'")]
        kept = conn.execute("SELECT count(*) FROM evidence_items WHERE id='yna-1'").fetchone()[0]
    assert stale.id not in leads, "만료된 lead가 남았습니다"
    assert "sig_kr_yna-1" in leads
    assert kept == 1, "승격 대상 evidence 행은 건드리지 않는다"


def test_a_lead_with_tickers_keeps_the_fourteen_day_window(tmp_path):
    """보존 기간은 `normalize_signal`이 정한다 — 승격이 그 인자를 넘겨야 한다.

    `upsert_signal(..., watchlist_related=True)`만 넘기면 소용이 없다. 이미 만들어진
    FastOriginSignal 입력에서는 그 인자를 버리므로, 워치리스트 종목이 붙은 lead도
    일반 lead와 같은 3일 만에 사라졌다.
    """
    from features.common.research_library.rss.store import save_evidence_item
    from features.common.research_library.signals.runtime import promote_kr_rss_leads
    from features.common.research_library.signals.schema import parse_time

    db = tmp_path / "research-index.sqlite3"
    fresh_dt = dt.datetime.now(dt.timezone.utc)
    fresh = fresh_dt.isoformat()
    for suffix, tickers in (("tagged", ["005930.KS"]), ("plain", [])):
        save_evidence_item(db, {
            "id": f"yna-{suffix}",
            "collector": "rss",
            "source_type": "news",
            "source": "연합인포맥스",
            "title": f"속보 헤드라인 {suffix}",
            "url": f"https://einfomax.test/{suffix}",
            "normalized_url": f"https://einfomax.test/{suffix}",
            "published_at_utc": fresh,
            "collected_at_utc": fresh,
            "related_tickers": tickers,
            "reliability_tier": 2,
        }, f"research-inbox/rss/2026-08-15 09-00-00 - 연합인포맥스 - {suffix}.md")

    assert promote_kr_rss_leads(tmp_path) == 2

    with sqlite3.connect(db) as conn:
        expiry = dict(conn.execute(
            "SELECT id, expires_at_utc FROM evidence_items WHERE intake_stage='lead'"
        ).fetchall())
    # 14일 기준은 "티커가 붙었는가"다. 워치리스트·포트폴리오 보유 여부는 보지 않는다.
    assert parse_time(expiry["sig_kr_yna-tagged"]) - fresh_dt == dt.timedelta(days=14), "티커가 연결된 lead는 14일을 유지한다"
    assert parse_time(expiry["sig_kr_yna-plain"]) - fresh_dt == dt.timedelta(days=3), "일반 lead의 3일 기본값은 그대로다"


def test_the_manual_collection_button_enforces_the_lead_window_too(monkeypatch):
    """승격·purge는 automation kind rss에서만 돌고 있었다.

    RSS 자동 수집을 끄고 `RSS 수집` 버튼만 쓰는 구성에서는 보존 계약이 한 번도
    집행되지 않는다 — lead 행은 `markdown_path`가 비어 있어 `prune_orphan_evidence`도
    걷어내지 못하므로 무기한 쌓인다. 수집 경로가 하나이므로 승격도 거기에 둔다.
    """
    from features.common.research_library.rss import service
    from features.common.research_library.signals import runtime

    called: list = []
    monkeypatch.setattr(runtime, "promote_kr_rss_leads", lambda data_dir, **_kw: called.append(data_dir) or 0)
    monkeypatch.setattr(service, "delete_expired_rss", lambda *_a, **_k: {"deleted": 0})
    monkeypatch.setattr(service, "refresh_rss_feed_cache", lambda **_k: {})
    monkeypatch.setattr(service, "build_index", lambda **_k: {})

    service.import_rssarchive(run_collection=False)

    assert called, "수동 수집 경로가 lead 승격·purge를 부르지 않았다"


def test_a_failing_promotion_never_fails_the_collection(monkeypatch):
    """lead는 evidence 이전 단계다. 승격이 넘어져도 수집 결과를 버리지 않는다."""
    from features.common.research_library.rss import service
    from features.common.research_library.signals import runtime

    def _boom(*_a, **_k):
        raise RuntimeError("db locked")

    monkeypatch.setattr(runtime, "promote_kr_rss_leads", _boom)
    monkeypatch.setattr(service, "delete_expired_rss", lambda *_a, **_k: {"deleted": 0})
    monkeypatch.setattr(service, "refresh_rss_feed_cache", lambda **_k: {})
    monkeypatch.setattr(service, "build_index", lambda **_k: {})

    assert "added" in service.import_rssarchive(run_collection=False)


def test_an_expired_lead_never_reaches_a_conversation(tmp_path):
    """purge는 RSS 수집이 돌 때만 돈다. 그 사이 조회는 만료 lead를 돌려주면 안 된다 —
    상담 context가 수개월 전 headline을 최신 신호로 싣는다."""
    db = tmp_path / "research-index.sqlite3"
    upsert_signal(db, normalize_signal({
        **row(received=NOW - dt.timedelta(days=40), url="https://example.test/old"),
        "expires_at": NOW - dt.timedelta(days=30),
    }))
    upsert_signal(db, normalize_signal(row(url="https://example.test/fresh")))

    page = query_signals(db, ticker="NVDA", limit=50, now=NOW)

    assert [item["url"] for item in page["items"]] == ["https://example.test/fresh"]


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
        page = query_signals(db, ticker="NVDA", market="US", limit=100, now=NOW)
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

