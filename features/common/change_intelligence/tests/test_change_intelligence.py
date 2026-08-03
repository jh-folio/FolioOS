from __future__ import annotations

import json
import sqlite3

from features.common.change_intelligence.adapters.briefing import build_briefing_basis
from features.common.change_intelligence.adapters.company import build_company_basis
from features.common.change_intelligence.adapters.market_memory import build_market_memory_basis
from features.common.change_intelligence.adapters.topic import build_topic_basis
from features.common.change_intelligence.basis import normalize_basis
from features.common.change_intelligence.comparator import compare_basis
from features.common.change_intelligence.projection import project_report, repair_change_projection, upsert_change_projection
from features.common.change_intelligence.service import decorate_candidate


def source(tier=2, group="wire-a", *, lead=False):
    return {"id": group, "title": group, "url": f"https://example.com/{group}", "source": group, "reliabilityTier": tier, "independentGroup": group, "intakeStage": "lead" if lead else "evidence", "signalStatus": "unconfirmed" if lead else ""}


def basis(*, magnitude=0.8, sources=None, counter=None):
    return normalize_basis({
        "artifactKind": "topic_report", "artifactId": "r2", "lineageId": "topic:x", "asOf": "2026-08-02T00:00:00Z",
        "changeUnits": [{"id": "u", "kind": "metric", "subject": "Revenue", "currentValue": 2, "magnitude": magnitude, "horizon": "long_term"}],
        "sourceRefs": sources or [], "counterSignals": counter or [],
    })


def previous_basis():
    row = basis(magnitude=0.8, sources=[source(1)])
    row["artifactId"] = "r1"
    row["asOf"] = "2026-08-01T00:00:00Z"
    row["changeUnits"][0]["currentValue"] = 1
    return row


def test_markdown_only_artifact_is_insufficient():
    candidate = decorate_candidate("topic_report", {"id": "r", "markdown": "# only"}, data_dir=".")
    assert candidate["changeBasis"]["basisStatus"] == "insufficient"
    assert candidate["changeSummary"]["status"] == "insufficient_basis"


def test_unconfirmed_lead_never_opens_major_gate():
    current = basis(sources=[source(3, "lead", lead=True)])
    summary = compare_basis(current, previous_basis(), current_ref={"storageKind": "json_report", "id": "r2", "contentHash": "x"})
    assert summary["status"] != "major_change"
    assert summary["corroboration"]["countableSources"] == 0
    assert len(summary["signalRefs"]) == 1


def test_major_gate_accepts_tier1_or_two_independent_tier2():
    tier1 = compare_basis(basis(sources=[source(1)]), previous_basis(), current_ref={"storageKind": "json_report", "id": "r2", "contentHash": "x"})
    assert tier1["status"] == "major_change"
    tier2 = compare_basis(basis(sources=[source(2, "a"), source(2, "b")]), previous_basis(), current_ref={"storageKind": "json_report", "id": "r2", "contentHash": "x"})
    assert tier2["status"] == "major_change"


def test_reliable_counter_signal_surfaces_conflict():
    summary = compare_basis(basis(sources=[source(1)], counter=["opposing official signal"]), previous_basis(), current_ref={"storageKind": "json_report", "id": "r2", "contentHash": "x"})
    assert summary["status"] == "conflicting_uncertain"


def test_all_artifact_adapters_use_native_fields_not_markdown():
    briefing = build_briefing_basis({"date": "2026-08-01", "marketScope": "us", "marketDrivers": [{"driver": "rates", "score": 12}], "sources": [source(2)]})
    company = build_company_basis({"id": "NVDA:2026-08-01", "company": {"ticker": "NVDA"}, "sources": [source(1)], "analysisInputs": {"secFactsOk": True}}, materials={"company": {"ticker": "NVDA"}, "selectedDocs": [source(1)], "secFacts": {"rows": [{"metric": "Revenue", "annual": [{"val": 10, "end": "2026-01-01"}]}]}})
    topic = build_topic_basis({"id": "t", "researchLineageId": "x", "sourceLedger": [source(2)], "checkpoints": [{"id": "c", "title": "Demand", "status": "watch"}]})
    memory = build_market_memory_basis({"id": "m", "asOf": "2026-08-01", "horizon": "medium_term", "marketRegime": "risk_on", "confidence": 0.7, "sourceRefs": [source(2)], "keyDrivers": [{"title": "liquidity", "confidence": 0.8}], "counterEvidence": ["rates"]})
    assert all(row["changeUnits"] for row in (briefing, company, topic, memory))
    assert all("markdown" not in json.dumps(row) for row in (briefing, company, topic, memory))


def test_projection_is_idempotent_and_dual_source_repair(tmp_path):
    db = tmp_path / "market-memory.sqlite3"
    summary = compare_basis(basis(sources=[source(1)]), previous_basis(), current_ref={"storageKind": "json_report", "id": "r2", "contentHash": "x"})
    with sqlite3.connect(db) as conn:
        upsert_change_projection(conn, summary, authority_kind="json_report", authority_id="r2.json")
        upsert_change_projection(conn, summary, authority_kind="json_report", authority_id="r2.json")
        assert conn.execute("SELECT count(*) FROM change_event_index").fetchone()[0] == 1
    reports = tmp_path / "topic-reports"
    reports.mkdir()
    (reports / "r2.json").write_text(json.dumps({"id": "r2", "changeSummary": summary}), encoding="utf-8")
    repaired = repair_change_projection(tmp_path, db)
    assert repaired["repaired"] >= 1


def test_corrupt_report_queues_repair_without_touching_authority(tmp_path):
    db = tmp_path / "market-memory.sqlite3"
    report = tmp_path / "briefings" / "broken.json"
    report.parent.mkdir()
    report.write_text("{broken", encoding="utf-8")
    result = project_report(db, report)
    assert result["status"] == "repair_queued"
    assert report.read_text(encoding="utf-8") == "{broken"
    with sqlite3.connect(db) as conn:
        assert conn.execute("SELECT count(*) FROM change_projection_repair_queue").fetchone()[0] == 1


def test_corrupt_market_snapshot_is_skipped_and_preserved_during_repair(tmp_path):
    db = tmp_path / "market-memory.sqlite3"
    with sqlite3.connect(db) as conn:
        conn.execute("CREATE TABLE market_state_snapshots (snapshot_id TEXT PRIMARY KEY, payload_json TEXT)")
        conn.execute("INSERT INTO market_state_snapshots VALUES ('broken-snapshot', '{broken')")
        conn.commit()
    result = repair_change_projection(tmp_path, db)
    assert result["skipped"] == 1
    with sqlite3.connect(db) as conn:
        assert conn.execute("SELECT payload_json FROM market_state_snapshots WHERE snapshot_id='broken-snapshot'").fetchone()[0] == "{broken"


def test_short_tickers_do_not_match_unrelated_lineages():
    """부분문자열 매칭이면 F가 BRIEFING에, T가 BOTH에 걸려 무관한 이벤트가 쏟아진다."""
    from features.common.change_intelligence.projection import lineage_matches_ticker

    for lineage in ("briefing:us", "briefing:both", "market_memory:both:medium_term", "topic:retail"):
        for ticker in ("F", "T", "V", "MA", "AI"):
            assert lineage_matches_ticker(lineage, ticker) is False, (lineage, ticker)


def test_company_lineage_matches_its_own_ticker_only():
    from features.common.change_intelligence.projection import lineage_matches_ticker

    assert lineage_matches_ticker("company:NVDA", "NVDA") is True
    assert lineage_matches_ticker("company:nvda", "NVDA") is True
    assert lineage_matches_ticker("company:NVDA", "V") is False
    # 점·하이픈이 든 티커가 토큰화로 쪼개지지 않아야 한다.
    assert lineage_matches_ticker("company:BRK-B", "BRK-B") is True
    assert lineage_matches_ticker("company:005930.KS", "005930.KS") is True
    assert lineage_matches_ticker("company:BRK-B", "B") is False


def test_topic_lineage_matches_whole_token_not_substring():
    from features.common.change_intelligence.projection import lineage_matches_ticker

    assert lineage_matches_ticker("topic:NVDA-supply-chain", "NVDA") is True
    assert lineage_matches_ticker("topic:retail", "AI") is False
    assert lineage_matches_ticker("", "NVDA") is False
    assert lineage_matches_ticker("company:NVDA", "") is False


def _basis(kind, artifact_id, as_of, lineage="briefing:us"):
    return {"artifactKind": kind, "artifactId": artifact_id, "asOf": as_of, "lineageId": lineage}


def test_baseline_is_never_newer_than_the_artifact():
    """6월 보고서를 8월 보고서와 비교하면 사실상 모든 항목이 '변화'로 잡힌다."""
    from features.common.change_intelligence.baseline import _matches

    current = _basis("briefing", "2026-06-10", "2026-06-10T08:34:23+00:00")
    newer = _basis("briefing", "2026-08-01", "2026-08-01T10:19:33+00:00")
    assert _matches(current, newer) is False


def test_missing_as_of_never_selects_an_arbitrary_baseline():
    """순서를 확인할 수 없으면 비교하지 않는다(예전엔 아무 후보나 통과했다)."""
    from features.common.change_intelligence.baseline import _matches

    assert _matches(_basis("briefing", "x", None), _basis("briefing", "y", "2026-08-01T00:00:00+00:00")) is False
    assert _matches(_basis("briefing", "x", "2026-08-01T00:00:00+00:00"), _basis("briefing", "y", None)) is False


def test_stale_baseline_outside_the_comparable_window_is_rejected():
    """일일 브리핑을 몇 주 전 것과 견주면 중대한 변화 판정이 의미를 잃는다."""
    from features.common.change_intelligence.baseline import _matches

    current = _basis("briefing", "2026-08-01", "2026-08-01T00:00:00+00:00")
    assert _matches(current, _basis("briefing", "2026-07-31", "2026-07-31T00:00:00+00:00")) is True
    assert _matches(current, _basis("briefing", "2026-07-20", "2026-07-20T00:00:00+00:00")) is False
    # 기업분석은 분기 단위라 창이 넓다.
    company = _basis("company_analysis", "NVDA:2026-08-01", "2026-08-01T00:00:00+00:00", "company:NVDA")
    older = _basis("company_analysis", "NVDA:2026-05-05", "2026-05-05T00:00:00+00:00", "company:NVDA")
    assert _matches(company, older) is True
