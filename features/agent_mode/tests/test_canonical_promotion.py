from __future__ import annotations

import json
from pathlib import Path

import pytest

from features.common.canonical_reports import (
    CanonicalConflictError,
    CanonicalValidationError,
    ReportKind,
    WriteKind,
    prepare,
    promote_job,
    storage_hash,
)


def _company_commit_intent(prepared):
    return {
        "operationId": "op-01",
        "expectedArtifacts": [{
            "storage": "json",
            "type": "company_analysis_report",
            "id": "company-01",
            "baseHash": prepared.base_hash,
            "baseMarker": prepared.base_marker,
            "targetRevision": prepared.target_revision,
            "targetHash": prepared.target_hash,
        }],
        "terminalProjection": {"status": "done"},
    }


def test_promote_job_requires_matching_intent_and_moves_exact_stage(tmp_path: Path) -> None:
    # Given: a marker-owned prepared artifact and exact staged bytes.
    path = tmp_path / "company-analysis" / "company-01.json"
    staged = tmp_path / "job-staging" / "job-01" / "company-01.json"
    marker = {"jobId": "job-01", "operationId": "op-01"}
    prepared = prepare(
        report_kind=ReportKind.COMPANY_ANALYSIS,
        exact_path=path,
        write_kind=WriteKind.CANONICAL,
        candidate={"id": "company-01", "markdown": "# Candidate"},
        operation_id="op-01",
        job_marker=marker,
    )
    staged.parent.mkdir(parents=True, exist_ok=True)
    staged.write_bytes(prepared.serialized_bytes)
    intent = _company_commit_intent(prepared)

    # When: promotion validates the durable intent and exact stage.
    promoted = promote_job(prepared, staged, intent)

    # Then: the final report is verified, marked, and the stage was atomically consumed.
    saved = json.loads(path.read_text(encoding="utf-8"))
    assert promoted.target_hash == storage_hash(saved)
    assert saved["jobCommit"] == marker
    assert not staged.exists()


def test_promote_job_replay_succeeds_after_stage_is_consumed(tmp_path: Path) -> None:
    # Given: a successful marker-owned promotion whose stage no longer exists.
    path = tmp_path / "company-analysis" / "company-01.json"
    staged = tmp_path / "job-staging" / "job-01" / "company-01.json"
    prepared = prepare(
        report_kind=ReportKind.COMPANY_ANALYSIS,
        exact_path=path,
        write_kind=WriteKind.CANONICAL,
        candidate={"id": "company-01", "markdown": "# Candidate"},
        operation_id="op-01",
        job_marker={"jobId": "job-01", "operationId": "op-01"},
    )
    staged.parent.mkdir(parents=True, exist_ok=True)
    staged.write_bytes(prepared.serialized_bytes)
    intent = _company_commit_intent(prepared)
    promote_job(prepared, staged, intent)

    # When: crash recovery replays the same promotion after os.replace.
    replayed = promote_job(prepared, staged, intent)

    # Then: the exact committed target is accepted without requiring stage bytes.
    assert replayed == prepared
    assert not staged.exists()


def test_promote_job_rejects_target_hash_only_forged_intent(tmp_path: Path) -> None:
    # Given: valid staged bytes but an under-bound targetHash-only intent.
    path = tmp_path / "company-analysis" / "company-01.json"
    staged = tmp_path / "job-staging" / "job-01" / "company-01.json"
    prepared = prepare(
        report_kind=ReportKind.COMPANY_ANALYSIS,
        exact_path=path,
        write_kind=WriteKind.CANONICAL,
        candidate={"id": "company-01", "markdown": "# Candidate"},
        operation_id="op-01",
        job_marker={"jobId": "job-01", "operationId": "op-01"},
    )
    staged.parent.mkdir(parents=True, exist_ok=True)
    staged.write_bytes(prepared.serialized_bytes)

    # When: promotion receives an intent without exact artifact/base/owner binding.
    with pytest.raises(CanonicalConflictError) as raised:
        promote_job(prepared, staged, {"targetHash": prepared.target_hash})

    # Then: promotion is rejected and neither staged nor final bytes move.
    assert raised.value.code == "commit_intent_mismatch"
    assert staged.exists()
    assert not path.exists()


def test_prepare_rejects_job_marker_operation_mismatch(tmp_path: Path) -> None:
    # Given: a prepare operation and job marker owned by different operation ids.
    path = tmp_path / "company-analysis" / "company-01.json"

    # When: prepare attempts to bind the inconsistent owner tuple.
    with pytest.raises(CanonicalValidationError) as raised:
        prepare(
            report_kind=ReportKind.COMPANY_ANALYSIS,
            exact_path=path,
            write_kind=WriteKind.CANONICAL,
            candidate={"id": "company-01", "markdown": "# Candidate"},
            operation_id="op-A",
            job_marker={"jobId": "job-01", "operationId": "op-B"},
        )

    # Then: no artifact is prepared or written under split ownership.
    assert raised.value.code == "job_marker_operation_mismatch"
    assert not path.exists()


def test_prepare_accepts_the_normative_strict_input_object(tmp_path: Path) -> None:
    # Given: the decision-complete prepare input object with camelCase keys.
    path = tmp_path / "company-analysis" / "company-01.json"
    request = {
        "reportKind": "company_analysis",
        "exactPath": str(path),
        "writeKind": "canonical",
        "candidate": {"id": "company-01", "markdown": "# Candidate"},
        "operationId": "op-object",
        "jobMarker": None,
    }

    # When: prepare parses the boundary object.
    prepared = prepare(request)

    # Then: it produces the same typed exact-path write contract.
    assert prepared.report_kind == ReportKind.COMPANY_ANALYSIS
    assert prepared.exact_path == path.resolve(strict=False)
    assert prepared.target_revision == 1
