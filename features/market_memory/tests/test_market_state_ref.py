from __future__ import annotations

import hashlib
import json
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

from features.agent_mode.market_state_context import (
    MarketStateSelection,
    attach_market_state_resolution,
    project_market_state,
    render_market_state_projection,
)
from features.market_memory.market_state_ref import (
    MarketStateRefQuery,
    capture_input_watermarks,
    resolve_market_state_ref,
    resolve_market_state_scope,
)
from features.market_memory.snapshot import build_market_state_context, save_market_state_snapshot
from features.market_memory.state_dashboard import market_state_dashboard_payload

NOW = datetime(2026, 7, 17, 12, tzinfo=timezone.utc)
NOW_TEXT = "2026-07-17T12:00:00Z"


def _seed_snapshot(path: Path, *, as_of: str = "2026-07-14T12:00:00Z", watermarks: dict | None = None) -> None:
    save_market_state_snapshot(path, {
        "id": "mss_current",
        "asOf": as_of,
        "headline": "Canary market headline",
        "oneLineSummary": "CANARY_CONTEXT_ONLY",
        "marketRegime": "mixed",
        "actionPosture": "check",
        "keyDrivers": [{"title": "Driver", "summary": "Bounded", "sourceRefs": ["src:canary"]}],
        "watchItems": ["Watch"],
        "counterEvidence": ["Counter"],
        "uncertainties": ["Uncertain"],
        "sourceRefs": [{"id": "src:canary", "title": "EVIDENCE_CANARY", "source": "Test"}],
        "confidence": 0.7,
        "inputWatermarks": watermarks or {"GLOBAL": None, "US": None, "KR": None},
        "updateAttemptRef": {
            "id": "msa_12345678-1234-4234-9234-123456789abc", "scope": "GLOBAL", "mode": "manual",
            "jobId": None, "operationId": None, "startedAt": "2026-07-14T11:59:00Z", "inputWatermark": None,
        },
    })


def _seed_index(path: Path, rows: list[tuple[str, str, str]]) -> None:
    with sqlite3.connect(path) as connection:
        connection.execute(
            "CREATE TABLE documents (doc_id TEXT,path TEXT,type TEXT,market_relevance REAL,metadata_json TEXT,content_updated_at TEXT)"
        )
        connection.executemany(
            "INSERT INTO documents VALUES (?, 'research-inbox/rss/item.md', 'article', 1, ?, ?)", rows,
        )


def _query(tmp_path: Path, scope: str = "GLOBAL", attempts: tuple[dict, ...] = ()) -> MarketStateRefQuery:
    return MarketStateRefQuery(
        market_db_path=tmp_path / "market.sqlite3",
        research_db_path=tmp_path / "research.sqlite3",
        scope=scope,
        now=NOW,
        failed_attempts=attempts,
    )


@pytest.mark.parametrize(("requested", "regions", "collection", "expected"), [
    ("US", (), None, "US"), ("KR", ("미국",), "US", "KR"), ("GLOBAL", ("한국",), "KR", "GLOBAL"),
    ("AUTO", ("usa",), None, "US"), ("AUTO", ("대한민국",), None, "KR"),
    ("AUTO", ("United States", "Korea"), None, "GLOBAL"), ("AUTO", (), "us", "US"),
    ("AUTO", (), "KR", "KR"), ("AUTO", ("Europe",), "ALL", "EUROPE"),
    ("AUTO", ("US/KR",), "UNKNOWN", "GLOBAL"),
])
def test_scope_resolves_without_data_dependent_judgment(
    requested: str, regions: tuple[str, ...], collection: str | None, expected: str,
) -> None:
    # Given request-only scope signals / When scope is resolved / Then the exact deterministic scope wins.
    assert resolve_market_state_scope(requested, regions=regions, collection_market=collection) == expected


def test_saved_snapshot_preserves_complete_reference_fields(tmp_path: Path) -> None:
    # Given a complete v1 snapshot reference / When saved / Then both reference objects survive validation and storage.
    _seed_snapshot(tmp_path / "market.sqlite3")
    with sqlite3.connect(tmp_path / "market.sqlite3") as connection:
        payload = json.loads(connection.execute("SELECT payload_json FROM market_state_snapshots").fetchone()[0])
    assert payload["inputWatermarks"] == {"GLOBAL": None, "US": None, "KR": None}
    assert payload["updateAttemptRef"]["id"] == "msa_12345678-1234-4234-9234-123456789abc"


def test_generation_context_captures_all_scope_watermarks_before_generation(tmp_path: Path) -> None:
    # Given relevant indexed evidence / When generation context is prepared / Then every scope watermark is fixed in context.
    _seed_index(tmp_path / "research-index.sqlite3", [
        ("us", '{"markets":["US"]}', "2026-07-14T10:00:00Z"),
        ("kr", '{"markets":["KR"]}', "2026-07-14T11:00:00Z"),
    ])
    context = build_market_state_context(
        rss_items=[], states=[], market_tape={}, macro_snapshot={}, db_path=tmp_path / "market.sqlite3",
    )
    assert context["inputWatermarks"] == {
        "GLOBAL": "2026-07-14T11:00:00Z", "US": "2026-07-14T10:00:00Z", "KR": "2026-07-14T11:00:00Z",
        "EUROPE": None, "JP": None,
    }


@pytest.mark.parametrize(("as_of", "status", "reason"), [
    ("2026-07-14T12:00:00Z", "current", "within_window"),
    ("2026-07-14T11:59:59Z", "stale", "age_exceeded"),
    ("2026-07-17T12:00:01Z", "stale", "future_as_of"),
    ("not-a-time", "stale", "invalid_as_of"),
])
def test_freshness_uses_exact_injected_utc_boundary(
    tmp_path: Path, as_of: str, status: str, reason: str,
) -> None:
    # Given deterministic asOf / When freshness resolves / Then exact 72h is current and priority is stable.
    _seed_snapshot(tmp_path / "market.sqlite3", as_of=as_of)
    ref = resolve_market_state_ref(_query(tmp_path))
    assert (ref["status"], ref["freshnessReason"]) == (status, reason)
    assert ref["resolvedAt"] == NOW_TEXT


@pytest.mark.parametrize(("as_of", "expected"), [
    ("2026-07-16T12:00:01Z", "within_window"),
    ("2026-07-16T12:00:00Z", "within_window"),
    ("2026-07-16T11:59:59Z", "new_relevant_evidence"),
])
def test_new_evidence_waits_for_24_hour_grace_period(
    tmp_path: Path, as_of: str, expected: str,
) -> None:
    # Given evidence newer than the snapshot input / When the snapshot is at the grace boundary / Then only age >24h is stale.
    watermark = "2026-07-16T11:00:00Z"
    _seed_snapshot(
        tmp_path / "market.sqlite3",
        as_of=as_of,
        watermarks={"GLOBAL": watermark, "US": watermark, "KR": watermark},
    )
    _seed_index(tmp_path / "research.sqlite3", [
        ("new", '{"markets":["GLOBAL"]}', "2026-07-17T00:00:00Z"),
    ])

    ref = resolve_market_state_ref(_query(tmp_path))

    assert (ref["status"], ref["freshnessReason"]) == (
        "current" if expected == "within_window" else "stale",
        expected,
    )


@pytest.mark.parametrize(("as_of", "watermarks", "live", "attempts", "expected"), [
    ("not-a-time", {"US": None}, "2026-07-16T00:00:00Z", ({"scope": "GLOBAL", "status": "failed", "finishedAt": NOW_TEXT},), "invalid_as_of"),
    ("2026-07-17T12:00:01Z", {"US": None}, "2026-07-16T00:00:00Z", (), "future_as_of"),
    ("2026-07-15T12:00:00Z", {"US": None}, "2026-07-16T00:00:00Z", (), "missing_input_watermark"),
    ("2026-07-14T11:59:59Z", {"GLOBAL": "2026-07-14T00:00:00Z", "US": None, "KR": None}, "2026-07-16T00:00:00Z", ({"scope": "GLOBAL", "status": "failed", "finishedAt": NOW_TEXT},), "age_exceeded"),
    ("2026-07-15T12:00:00Z", {"GLOBAL": "2026-07-15T00:00:00Z", "US": None, "KR": None}, "2026-07-16T00:00:00Z", ({"scope": "GLOBAL", "status": "failed", "finishedAt": NOW_TEXT},), "new_relevant_evidence"),
    ("2026-07-15T12:00:00Z", {"GLOBAL": "2026-07-16T00:00:00Z", "US": None, "KR": None}, "2026-07-16T00:00:00Z", ({"scope": "GLOBAL", "status": "failed", "finishedAt": NOW_TEXT},), "update_failed"),
    ("2026-07-14T12:00:00Z", {"GLOBAL": "2026-07-16T00:00:00Z", "US": None, "KR": None}, "2026-07-16T00:00:00Z", (), "within_window"),
])
def test_freshness_reason_priority_is_total_and_deterministic(
    tmp_path: Path,
    as_of: str,
    watermarks: dict,
    live: str,
    attempts: tuple[dict, ...],
    expected: str,
) -> None:
    # Given multiple simultaneous stale causes / When resolved / Then the normative priority table has one winner.
    _seed_snapshot(tmp_path / "market.sqlite3", as_of=as_of, watermarks=watermarks)
    _seed_index(tmp_path / "research.sqlite3", [("global", '{"markets":["GLOBAL"]}', live)])

    ref = resolve_market_state_ref(_query(tmp_path, attempts=attempts))

    assert ref["freshnessReason"] == expected
    assert ref["status"] == ("current" if expected == "within_window" else "stale")


def test_relevant_watermark_is_per_scope_and_strictly_later(tmp_path: Path) -> None:
    # Given US/KR/GLOBAL evidence / When each scope resolves / Then only relevant later evidence stales it.
    watermark = "2026-07-14T12:00:00Z"
    _seed_snapshot(tmp_path / "market.sqlite3", watermarks={"GLOBAL": watermark, "US": watermark, "KR": watermark})
    _seed_index(tmp_path / "research.sqlite3", [
        ("us", '{"markets":["US"]}', "2026-07-15T00:00:00Z"),
        ("kr", '{"market":"KR"}', "2026-07-14T12:00:00Z"),
        ("global", '{"markets":["GLOBAL"]}', "2026-07-14T12:00:00Z"),
        ("unknown", "{}", "2026-07-16T00:00:00Z"),
        ("invalid", '{"market":"US"}', "bad-time"),
    ])
    us = resolve_market_state_ref(_query(tmp_path, "US"))
    kr = resolve_market_state_ref(_query(tmp_path, "KR"))
    global_ref = resolve_market_state_ref(_query(tmp_path))
    assert (us["freshnessReason"], us["invalidWatermarkRows"]) == ("new_relevant_evidence", 1)
    assert (kr["freshnessReason"], kr["relevantEvidenceWatermark"]) == ("within_window", watermark)
    assert global_ref["relevantEvidenceWatermark"] == "2026-07-16T00:00:00Z"


def test_evidence_watermark_is_canonical_utc_z_for_current_stale_fallback_and_capture(tmp_path: Path) -> None:
    # Given equivalent +00:00 storage / When every public/captured watermark resolves / Then all emit canonical Z.
    raw = "2026-07-16T10:14:38+00:00"
    canonical = "2026-07-16T10:14:38Z"

    current_root = tmp_path / "current"
    current_root.mkdir()
    _seed_snapshot(
        current_root / "market.sqlite3",
        as_of="2026-07-16T12:00:00Z",
        watermarks={"GLOBAL": canonical, "US": canonical, "KR": None},
    )
    _seed_index(current_root / "research.sqlite3", [("current", '{"markets":["GLOBAL"]}', raw)])
    current = resolve_market_state_ref(_query(current_root, "US"))

    stale_root = tmp_path / "stale"
    stale_root.mkdir()
    _seed_snapshot(
        stale_root / "market.sqlite3",
        as_of="2026-07-16T11:59:59Z",
        watermarks={"GLOBAL": "2026-07-16T10:14:37Z", "US": "2026-07-16T10:14:37Z", "KR": None},
    )
    _seed_index(stale_root / "research.sqlite3", [("stale", '{"markets":["US"]}', raw)])
    stale = resolve_market_state_ref(_query(stale_root, "US"))

    fallback_root = tmp_path / "fallback"
    fallback_root.mkdir()
    with sqlite3.connect(fallback_root / "market.sqlite3") as connection:
        connection.execute("CREATE TABLE market_narrative_states (status TEXT, updated_at TEXT)")
        connection.execute("INSERT INTO market_narrative_states VALUES ('active','2026-07-16T11:00:00Z')")
    _seed_index(fallback_root / "research.sqlite3", [("fallback", '{"markets":["GLOBAL"]}', raw)])
    fallback = resolve_market_state_ref(_query(fallback_root))

    assert (current["status"], current["freshnessReason"]) == ("current", "within_window")
    assert (stale["status"], stale["freshnessReason"]) == ("stale", "new_relevant_evidence")
    assert (fallback["status"], fallback["freshnessReason"]) == ("fallback", "state_fallback")
    assert current["relevantEvidenceWatermark"] == canonical
    assert stale["relevantEvidenceWatermark"] == canonical
    assert fallback["relevantEvidenceWatermark"] == canonical
    assert capture_input_watermarks(current_root / "research.sqlite3") == {
        "GLOBAL": canonical,
        "US": canonical,
        "KR": canonical,
        "EUROPE": canonical,
        "JP": canonical,
    }


def test_noop_reindex_timestamp_does_not_change_content_watermark(tmp_path: Path) -> None:
    # Given unchanged content_updated_at / When unrelated indexing time changes / Then freshness stays current.
    watermark = "2026-07-14T12:00:00Z"
    _seed_snapshot(tmp_path / "market.sqlite3", watermarks={"GLOBAL": watermark, "US": watermark, "KR": watermark})
    _seed_index(tmp_path / "research.sqlite3", [("same", '{"markets":["GLOBAL"]}', "2026-07-14T12:00:00+00:00")])
    with sqlite3.connect(tmp_path / "research.sqlite3") as connection:
        connection.execute("ALTER TABLE documents ADD COLUMN updated_at TEXT")
        connection.execute("UPDATE documents SET updated_at='2026-07-17T11:00:00Z'")
    ref = resolve_market_state_ref(_query(tmp_path))
    assert ref["freshnessReason"] == "within_window"
    assert ref["relevantEvidenceWatermark"] == watermark
    assert capture_input_watermarks(tmp_path / "research.sqlite3")["GLOBAL"] == watermark


@pytest.mark.parametrize(("scope", "finished", "expected"), [
    ("US", "2026-07-14T12:00:01Z", "update_failed"),
    ("KR", "2026-07-14T12:00:01Z", "within_window"),
    ("GLOBAL", "2026-07-14T12:00:01Z", "update_failed"),
    ("US", "2026-07-14T12:00:00Z", "within_window"),
    ("US", "malformed", "within_window"),
])
def test_later_failed_update_stales_only_relevant_scope(
    tmp_path: Path, scope: str, finished: str, expected: str,
) -> None:
    # Given a failed attempt / When it is later and scope-relevant / Then update_failed is deterministic.
    _seed_snapshot(tmp_path / "market.sqlite3")
    attempt = ({"scope": scope, "status": "failed", "finishedAt": finished},)
    assert resolve_market_state_ref(_query(tmp_path, "US", attempt))["freshnessReason"] == expected


def test_fallback_and_empty_refs_are_auditable(tmp_path: Path) -> None:
    # Given no snapshot / When an active state exists then is removed / Then fallback and empty refs are distinct.
    market_db = tmp_path / "market.sqlite3"
    with sqlite3.connect(market_db) as connection:
        connection.execute("CREATE TABLE market_narrative_states (status TEXT, updated_at TEXT)")
        connection.execute("INSERT INTO market_narrative_states VALUES ('active','2026-07-16T00:00:00Z')")
    fallback = resolve_market_state_ref(_query(tmp_path))
    with sqlite3.connect(market_db) as connection:
        connection.execute("DELETE FROM market_narrative_states")
    empty = resolve_market_state_ref(_query(tmp_path))
    assert (fallback["status"], fallback["freshnessReason"], fallback["asOf"]) == (
        "fallback", "state_fallback", "2026-07-16T00:00:00Z",
    )
    assert (fallback["snapshotId"], fallback["inputWatermark"]) == (None, None)
    assert (empty["status"], empty["freshnessReason"], empty["sourceKind"]) == ("empty", "no_state", "none")
    assert (empty["snapshotId"], empty["asOf"], empty["inputWatermark"], empty["relevantEvidenceWatermark"]) == (
        None, None, None, None,
    )


def test_fallback_offset_timestamp_is_exposed_as_canonical_utc_z(tmp_path: Path) -> None:
    # Given a legacy/local-offset state timestamp / When fallback resolves / Then the public ref is strict UTC-Z.
    market_db = tmp_path / "market.sqlite3"
    with sqlite3.connect(market_db) as connection:
        connection.execute("CREATE TABLE market_narrative_states (status TEXT, updated_at TEXT)")
        connection.executemany(
            "INSERT INTO market_narrative_states VALUES (?, ?)",
            [
                ("active", "2026-07-22T18:42:27.346086+09:00"),
                ("watch", "2026-07-22T09:40:00Z"),
            ],
        )

    ref = resolve_market_state_ref(_query(tmp_path))

    assert ref["status"] == "fallback"
    assert ref["freshnessReason"] == "state_fallback"
    assert ref["asOf"] == "2026-07-22T09:42:27.346086Z"
    assert set(ref) == {
        "snapshotId", "sourceKind", "scope", "asOf", "status", "freshnessReason", "inputWatermark",
        "relevantEvidenceWatermark", "invalidWatermarkRows", "resolvedAt", "layer",
    }


@pytest.mark.parametrize(("watermarks", "expected_input"), [
    ({"US": None, "KR": None}, None),
    ({"GLOBAL": "malformed", "US": None, "KR": None}, None),
    ({"GLOBAL": None, "US": None, "KR": None}, None),
])
def test_malformed_or_missing_snapshot_watermark_fails_closed(
    tmp_path: Path, watermarks: dict, expected_input: str | None,
) -> None:
    # Given a malformed persisted watermark ref / When resolved / Then it is stale without raising.
    _seed_snapshot(tmp_path / "market.sqlite3", watermarks=watermarks)
    _seed_index(tmp_path / "research.sqlite3", [("new", '{"markets":["GLOBAL"]}', "2026-07-14T12:00:00Z")])
    ref = resolve_market_state_ref(_query(tmp_path))
    assert (ref["freshnessReason"], ref["inputWatermark"]) == ("missing_input_watermark", expected_input)


@pytest.mark.parametrize(("policy", "as_of", "reason", "injected"), [
    ("exclude", "2026-07-14T12:00:00Z", "policy_excluded", False),
    ("include_current", "2026-07-14T12:00:00Z", "current_injected", True),
    ("include_current", "2026-07-14T11:59:59Z", "stale_not_injected", False),
])
def test_policy_status_projection_controls_context_body(
    tmp_path: Path, policy: str, as_of: str, reason: str, injected: bool,
) -> None:
    # Given policy and status / When projected / Then only include_current+current has bounded state content.
    _seed_snapshot(tmp_path / "market.sqlite3", as_of=as_of)
    projection = project_market_state(MarketStateSelection(policy, "AUTO", ("US",), None), _query(tmp_path, "US"))
    rendered = render_market_state_projection(projection)
    assert projection.resolution["reason"] == reason
    assert projection.resolution["injected"] is injected
    assert (projection.resolution["ref"] is None) is (policy == "exclude")
    assert ("CANARY_CONTEXT_ONLY" in rendered) is injected
    assert "EVIDENCE_CANARY" not in rendered
    assert "status:" in rendered and "asOf:" in rendered and "reason:" in rendered


def test_stale_projection_renders_exact_freshness_for_agent_and_deep_research(tmp_path: Path) -> None:
    # Given an age-stale snapshot / When rendered for model context / Then the auditable cause is not collapsed.
    _seed_snapshot(tmp_path / "market.sqlite3", as_of="2026-07-14T11:59:59Z")
    projection = project_market_state(MarketStateSelection("include_current", "GLOBAL"), _query(tmp_path))

    rendered = render_market_state_projection(projection)

    assert "- status: stale" in rendered
    assert "- freshnessReason: age_exceeded" in rendered
    assert "- sourceKind: snapshot" in rendered
    assert f"- resolvedAt: {NOW_TEXT}" in rendered
    assert "## Market State Context" not in rendered


@pytest.mark.parametrize(("kind", "status", "reason"), [
    ("fallback", "fallback", "fallback_not_injected"),
    ("empty", "empty", "empty_not_injected"),
])
def test_noncurrent_projection_renders_warning_metadata_without_state_body(
    tmp_path: Path, kind: str, status: str, reason: str,
) -> None:
    # Given no current snapshot / When projected / Then warning metadata renders without the context body.
    if kind == "fallback":
        with sqlite3.connect(tmp_path / "market.sqlite3") as connection:
            connection.execute("CREATE TABLE market_narrative_states (status TEXT, updated_at TEXT)")
            connection.execute("INSERT INTO market_narrative_states VALUES ('watch','2026-07-16T00:00:00Z')")
    projection = project_market_state(MarketStateSelection("include_current", "GLOBAL"), _query(tmp_path))
    rendered = render_market_state_projection(projection)
    assert projection.resolution["ref"]["status"] == status
    assert projection.resolution["reason"] == reason
    assert "## Market State Context" not in rendered
    assert f"status: {status}" in rendered and f"reason: {reason}" in rendered


def test_resolution_attachment_cannot_promote_context_into_evidence(tmp_path: Path) -> None:
    # Given evidence ledgers with canaries / When resolution is attached / Then their exact bytes and counts do not change.
    _seed_snapshot(tmp_path / "market.sqlite3")
    projection = project_market_state(MarketStateSelection("include_current", "GLOBAL"), _query(tmp_path))
    artifact = {"evidenceItems": [{"id": "e1", "text": "RAW_CANARY"}], "sourceLedger": [{"id": "s1"}], "coverage": {"total": 1}}
    before = {key: hashlib.sha256(json.dumps(artifact[key], sort_keys=True).encode()).hexdigest() for key in artifact}
    attached = attach_market_state_resolution(artifact, projection.resolution)
    after = {key: hashlib.sha256(json.dumps(attached[key], sort_keys=True).encode()).hexdigest() for key in artifact}
    assert after == before
    assert attached["marketStateResolution"]["ref"]["layer"] == "source-grounded"
    assert set(attached["marketStateResolution"]["ref"]) == {
        "snapshotId", "sourceKind", "scope", "asOf", "status", "freshnessReason", "inputWatermark",
        "relevantEvidenceWatermark", "invalidWatermarkRows", "resolvedAt", "layer",
    }


def test_dashboard_projects_the_normative_full_reference(tmp_path: Path) -> None:
    # Given a current snapshot / When the dashboard is built / Then the normative reference is exposed unchanged.
    _seed_snapshot(tmp_path / "market.sqlite3")
    payload = market_state_dashboard_payload(tmp_path / "market.sqlite3", ref_query=_query(tmp_path))
    assert (payload["marketStateRef"]["status"], payload["marketStateRef"]["freshnessReason"]) == (
        "current", "within_window",
    )
    assert payload["marketStateRef"]["asOf"] == "2026-07-14T12:00:00Z"


def test_dashboard_freshness_is_derived_from_the_normative_stale_ref(tmp_path: Path) -> None:
    # Given no newer Market Memory row but a snapshot older than 72h / When projected / Then freshness cannot disagree.
    _seed_snapshot(tmp_path / "market.sqlite3", as_of="2026-07-14T11:59:59Z")

    payload = market_state_dashboard_payload(tmp_path / "market.sqlite3", ref_query=_query(tmp_path))

    assert payload["marketStateRef"]["freshnessReason"] == "age_exceeded"
    assert {key: payload["freshness"][key] for key in (
        "status", "reason", "asOf", "sourceKind", "resolvedAt", "stale",
    )} == {
        "status": "stale",
        "reason": "age_exceeded",
        "asOf": "2026-07-14T11:59:59Z",
        "sourceKind": "snapshot",
        "resolvedAt": NOW_TEXT,
        "stale": True,
    }


@pytest.mark.parametrize(("policy", "scope"), [("bad", "AUTO"), ("exclude", "MARS")])
def test_malformed_policy_or_scope_is_rejected(tmp_path: Path, policy: str, scope: str) -> None:
    # Given malformed enums / When projected / Then the boundary rejects instead of guessing.
    with pytest.raises(ValueError):
        project_market_state(MarketStateSelection(policy, scope), _query(tmp_path))


def test_eu_boundary_alias_normalizes_to_europe() -> None:
    assert resolve_market_state_scope("EU") == "EUROPE"
    assert resolve_market_state_scope("AUTO", collection_market="EU") == "EUROPE"
