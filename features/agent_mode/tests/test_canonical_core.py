from __future__ import annotations

import json
from pathlib import Path

import pytest

from features.agent_mode import chat
from features.common.canonical_reports import (
    CanonicalConflictError,
    CanonicalIdentityError,
    ReportKind,
    WriteKind,
    canonical_content_hash,
    commit_sync,
    prepare,
    resolve_exact_report_path,
    storage_hash,
)


def _write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")


def test_pin_existing_exact_briefing_and_company_resolution(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    # Given: exact scoped/legacy briefing and company report paths.
    briefing_dir = tmp_path / "briefings"
    company_dir = tmp_path / "company-analysis"
    _write_json(briefing_dir / "2026-07-17.us.json", {"markdown": "US"})
    _write_json(briefing_dir / "2026-07-17.json", {"markdown": "legacy"})
    _write_json(company_dir / "company-01.json", {"markdown": "company"})
    monkeypatch.setattr(chat, "BRIEFINGS_DIR", briefing_dir)
    monkeypatch.setattr(chat, "ANALYSIS_DIR", company_dir)

    # When: callers resolve exact ids through the established chat seam.
    scoped = chat.resolve_artifact_path("briefing", "2026-07-17", "us")
    legacy = chat.resolve_artifact_path("briefing", "2026-07-17")
    company = chat.resolve_artifact_path("company_analysis", "company-01")

    # Then: the exact expected files are selected.
    assert scoped == briefing_dir / "2026-07-17.us.json"
    assert legacy == briefing_dir / "2026-07-17.json"
    assert company == company_dir / "company-01.json"


def test_exact_topic_resolution_rejects_substring_collision(tmp_path: Path) -> None:
    # Given: two topic files whose names share a substring but whose stored ids differ.
    data_root = tmp_path / "data"
    topic_dir = data_root / "topic-reports"
    _write_json(topic_dir / "2026-07-17_custom_xabc.json", {"id": "xabc", "markdown": "wrong"})
    expected = topic_dir / "2026-07-17_custom_abc.json"
    _write_json(expected, {"id": "abc", "markdown": "right"})

    # When: the canonical resolver receives the exact stored report id.
    actual = resolve_exact_report_path(data_root, ReportKind.TOPIC_REPORT, "abc")

    # Then: only the exact id is returned, independent of directory order.
    assert actual == expected


def test_briefing_resolver_rejects_suffix_scope_mismatch(tmp_path: Path) -> None:
    # Given: a scoped canonical briefing identity with a conflicting request scope.
    data_root = tmp_path / "data"

    # When: the resolver parses the mismatched identity and scope.
    with pytest.raises(CanonicalIdentityError) as raised:
        resolve_exact_report_path(data_root, ReportKind.BRIEFING, "2026-07-17.us", "kr")

    # Then: the stable boundary code identifies the mismatch.
    assert raised.value.code == "briefing_scope_mismatch"


def test_canonical_and_storage_hashes_have_disjoint_overlay_contract() -> None:
    # Given: one canonical report and an Overlay-only mutation.
    before = {"id": "company-01", "markdown": "# Report", "personalOverlay": {"stale": False}}
    after = {**before, "personalOverlay": {"stale": False, "markdown": "private"}}

    # When: canonical and complete-storage hashes are calculated.
    canonical_before = canonical_content_hash(before)
    canonical_after = canonical_content_hash(after)
    storage_before = storage_hash(before)
    storage_after = storage_hash(after)

    # Then: the Canonical hash is stable while the storage proof changes.
    assert canonical_after == canonical_before
    assert storage_after != storage_before


def test_prepare_commit_sync_initializes_revision_and_stales_overlay_on_change(tmp_path: Path) -> None:
    # Given: a legacy company report with immutable evidence and an active Overlay.
    path = tmp_path / "company-analysis" / "company-01.json"
    current = {
        "id": "company-01",
        "markdown": "# Old",
        "financials": {"revenue": 10},
        "sourceLedger": [{"id": "src-1"}],
        "personalOverlay": {"stale": False, "markdown": "private"},
    }
    _write_json(path, current)
    candidate = {**current, "markdown": "# Revised"}

    # When: a canonical candidate is prepared and synchronously committed.
    prepared = prepare(
        report_kind=ReportKind.COMPANY_ANALYSIS,
        exact_path=path,
        write_kind=WriteKind.CANONICAL,
        candidate=candidate,
        operation_id="op-revision",
    )
    committed = commit_sync(prepared)

    # Then: revision one is initialized atomically and immutable inputs survive.
    saved = json.loads(path.read_text(encoding="utf-8"))
    assert committed.target_revision == 1
    assert saved["canonicalRevision"]["number"] == 1
    assert saved["canonicalRevision"]["hash"] == canonical_content_hash(saved)
    assert saved["personalOverlay"]["stale"] is True
    assert saved["personalOverlay"]["staleReason"] == "canonical_revision_changed"
    assert saved["financials"] == {"revenue": 10}
    assert saved["sourceLedger"] == [{"id": "src-1"}]


def test_canonical_noop_preserves_revision_and_overlay(tmp_path: Path) -> None:
    # Given: a committed canonical report with an Overlay.
    path = tmp_path / "company-analysis" / "company-01.json"
    base = {"id": "company-01", "markdown": "# Same", "personalOverlay": {"stale": False}}
    first = commit_sync(prepare(
        report_kind=ReportKind.COMPANY_ANALYSIS,
        exact_path=path,
        write_kind=WriteKind.CANONICAL,
        candidate=base,
        operation_id="op-first",
    ))
    before = json.loads(path.read_text(encoding="utf-8"))

    # When: the same canonical candidate is committed under a new operation.
    second = commit_sync(prepare(
        report_kind=ReportKind.COMPANY_ANALYSIS,
        exact_path=path,
        write_kind=WriteKind.CANONICAL,
        candidate=before,
        operation_id="op-noop",
    ))

    # Then: the revision and Overlay remain unchanged.
    after = json.loads(path.read_text(encoding="utf-8"))
    assert first.target_revision == second.target_revision == 1
    assert second.canonical_changed is False
    assert after["personalOverlay"] == before["personalOverlay"]
    assert after["canonicalRevision"]["hash"] == before["canonicalRevision"]["hash"]


def test_overlay_write_changes_storage_only_and_preserves_revision(tmp_path: Path) -> None:
    # Given: a committed topic report with an initialized revision.
    path = tmp_path / "topic-reports" / "2026-07-17_custom_topic-01.json"
    base = {"id": "topic-01", "date": "2026-07-17", "topicKey": "custom", "markdown": "# Topic"}
    commit_sync(prepare(
        report_kind=ReportKind.TOPIC_REPORT,
        exact_path=path,
        write_kind=WriteKind.CANONICAL,
        candidate=base,
        operation_id="op-create",
    ))
    before = json.loads(path.read_text(encoding="utf-8"))

    # When: an Overlay-only candidate is prepared and committed.
    prepared = prepare(
        report_kind=ReportKind.TOPIC_REPORT,
        exact_path=path,
        write_kind=WriteKind.OVERLAY,
        candidate={"personalOverlay": {"stale": False, "markdown": "private"}},
        operation_id="op-overlay",
    )
    commit_sync(prepared)

    # Then: only storage proof changes; the canonical revision is byte-equivalent.
    after = json.loads(path.read_text(encoding="utf-8"))
    assert after["canonicalRevision"] == before["canonicalRevision"]
    assert canonical_content_hash(after) == canonical_content_hash(before)
    assert storage_hash(after) != storage_hash(before)
    assert after["personalOverlay"] == {"stale": False, "markdown": "private"}


def test_commit_sync_rejects_stale_base(tmp_path: Path) -> None:
    # Given: a prepared write whose exact base changes before promotion.
    path = tmp_path / "company-analysis" / "company-01.json"
    _write_json(path, {"id": "company-01", "markdown": "# Base"})
    prepared = prepare(
        report_kind=ReportKind.COMPANY_ANALYSIS,
        exact_path=path,
        write_kind=WriteKind.CANONICAL,
        candidate={"id": "company-01", "markdown": "# Candidate"},
        operation_id="op-stale",
    )
    _write_json(path, {"id": "company-01", "markdown": "# Concurrent"})

    # When: the stale prepared write tries to commit.
    with pytest.raises(CanonicalConflictError) as raised:
        commit_sync(prepared)

    # Then: the concurrent bytes are preserved and conflict is explicit.
    assert raised.value.code == "canonical_base_changed"
    assert json.loads(path.read_text(encoding="utf-8"))["markdown"] == "# Concurrent"


def test_repeated_prepare_is_deterministic_before_promotion(tmp_path: Path) -> None:
    # Given: one unchanged legacy base and one stable operation id.
    path = tmp_path / "company-analysis" / "company-01.json"
    current = {"id": "company-01", "markdown": "# Base", "generatedAt": "2026-07-17T00:00:00Z"}
    _write_json(path, current)
    candidate = {**current, "markdown": "# Candidate"}

    # When: interruption causes prepare to run twice before either candidate is promoted.
    first = prepare(
        report_kind=ReportKind.COMPANY_ANALYSIS,
        exact_path=path,
        write_kind=WriteKind.CANONICAL,
        candidate=candidate,
        operation_id="op-repeat",
    )
    second = prepare(
        report_kind=ReportKind.COMPANY_ANALYSIS,
        exact_path=path,
        write_kind=WriteKind.CANONICAL,
        candidate=candidate,
        operation_id="op-repeat",
    )

    # Then: both prepared bytes and every hash/revision field are identical.
    assert second.serialized_bytes == first.serialized_bytes
    assert second.target_hash == first.target_hash
    assert second.canonical_content_hash == first.canonical_content_hash
    assert second.target_revision == first.target_revision


def test_job_marker_does_not_change_storage_or_canonical_hash() -> None:
    # Given: the same logical report with two different jobCommit markers.
    base = {"id": "company-01", "markdown": "# Report"}
    first = {**base, "jobCommit": {"jobId": "job-1", "operationId": "op-1"}}
    second = {**base, "jobCommit": {"jobId": "job-2", "operationId": "op-2"}}

    # When: content and storage proofs are calculated.
    first_hashes = (canonical_content_hash(first), storage_hash(first))
    second_hashes = (canonical_content_hash(second), storage_hash(second))

    # Then: job receipt metadata changes neither logical proof.
    assert second_hashes == first_hashes
