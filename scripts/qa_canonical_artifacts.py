#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///

# ─── How to run ───
# 1. Install uv (if not installed):
#      curl -LsSf https://astral.sh/uv/install.sh | sh
# 2. Run directly (no venv, no pip install needed):
#      uv run scripts/qa_canonical_artifacts.py --source-root PATH --attempt-dir PATH
# 3. Or make executable and run:
#      chmod +x scripts/qa_canonical_artifacts.py && ./scripts/qa_canonical_artifacts.py
# ──────────────────

from __future__ import annotations

import json
import sys
from collections.abc import Mapping
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import TypeAlias

JsonScalar: TypeAlias = str | int | float | bool | None
JsonValue: TypeAlias = JsonScalar | list["JsonValue"] | dict[str, "JsonValue"]


def _argument(name: str) -> str:
    try:
        index = sys.argv.index(name)
        return sys.argv[index + 1]
    except (ValueError, IndexError) as exc:
        msg = f"missing required argument: {name}"
        raise RuntimeError(msg) from exc


def _write_json(path: Path, value: Mapping[str, JsonValue]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False), encoding="utf-8")


def main() -> int:
    source_root = Path(_argument("--source-root")).resolve(strict=True)
    attempt_dir = Path(_argument("--attempt-dir")).resolve(strict=False)
    attempt_dir.mkdir(parents=True, exist_ok=True)
    sys.path.insert(0, str(source_root))

    from features.common.canonical_reports import (
        CanonicalConflictError,
        CanonicalValidationError,
        ReportKind,
        WriteKind,
        canonical_content_hash,
        prepare,
        promote_job,
        resolve_exact_report_path,
        storage_hash,
    )
    from features.common.canonical_revisions import build_revision_candidate

    fixture_path: Path | None = None
    exact_collision_rejected = False
    canonical_hash_stable = False
    storage_hash_changed = False
    adapters_validated = False
    promotion_replay_idempotent = False
    forged_intent_rejected = False
    marker_mismatch_rejected = False
    typed_source_kind_preserved = False
    with TemporaryDirectory(prefix="canonical-core-", dir=attempt_dir) as temporary:
        fixture_path = Path(temporary)
        data_root = fixture_path / "data"
        topic_dir = data_root / "topic-reports"
        _write_json(topic_dir / "2026-07-17_custom_xabc.json", {"id": "xabc", "markdown": "wrong"})
        expected = topic_dir / "2026-07-17_custom_abc.json"
        _write_json(expected, {"id": "abc", "markdown": "right"})
        exact_collision_rejected = (
            resolve_exact_report_path(data_root, ReportKind.TOPIC_REPORT, "abc") == expected
        )

        before = {"id": "company-01", "markdown": "# Report", "personalOverlay": {"stale": False}}
        after = {**before, "personalOverlay": {"stale": False, "markdown": "private"}}
        canonical_hash_stable = canonical_content_hash(before) == canonical_content_hash(after)
        storage_hash_changed = storage_hash(before) != storage_hash(after)

        adapter_inputs = (
            (ReportKind.BRIEFING, {"date": "2026-07-17", "marketScope": "us"}),
            (ReportKind.COMPANY_ANALYSIS, {"id": "company-01"}),
            (ReportKind.TOPIC_REPORT, {"id": "topic-01"}),
        )
        candidates = []
        for report_kind, identity in adapter_inputs:
            current = {
                **identity,
                "markdown": "# Report\n\n## Evidence\nhttps://example.test/source\n\n## Risks\nRisk",
                "sourceLedger": [{"url": "https://example.test/source"}],
                "personalOverlay": {"stale": False},
            }
            candidates.append(build_revision_candidate(
                report_kind,
                current,
                "# Report\n\n## Evidence\nhttps://example.test/source\n\n## Risks\nUpdated risk",
            ))
        adapters_validated = len(candidates) == 3 and all("quality" in row.candidate for row in candidates)

        company_path = data_root / "company-analysis" / "company-01.json"
        staged_path = data_root / "job-staging" / "job-qa" / "company-01.json"
        prepared = prepare(
            report_kind=ReportKind.COMPANY_ANALYSIS,
            exact_path=company_path,
            write_kind=WriteKind.CANONICAL,
            candidate={"id": "company-01", "markdown": "# Candidate"},
            operation_id="op-qa",
            job_marker={"jobId": "job-qa", "operationId": "op-qa"},
        )
        staged_path.parent.mkdir(parents=True, exist_ok=True)
        staged_path.write_bytes(prepared.serialized_bytes)
        intent = {
            "operationId": "op-qa",
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
        promote_job(prepared, staged_path, intent)
        promotion_replay_idempotent = promote_job(prepared, staged_path, intent) == prepared

        forged_path = data_root / "company-analysis" / "company-02.json"
        forged_stage = data_root / "job-staging" / "job-forged" / "company-02.json"
        forged = prepare(
            report_kind=ReportKind.COMPANY_ANALYSIS,
            exact_path=forged_path,
            write_kind=WriteKind.CANONICAL,
            candidate={"id": "company-02", "markdown": "# Candidate"},
            operation_id="op-forged",
            job_marker={"jobId": "job-forged", "operationId": "op-forged"},
        )
        forged_stage.parent.mkdir(parents=True, exist_ok=True)
        forged_stage.write_bytes(forged.serialized_bytes)
        try:
            promote_job(forged, forged_stage, {"targetHash": forged.target_hash})
        except CanonicalConflictError as exc:
            forged_intent_rejected = exc.code == "commit_intent_mismatch" and not forged_path.exists()

        try:
            prepare(
                report_kind=ReportKind.COMPANY_ANALYSIS,
                exact_path=data_root / "company-analysis" / "company-03.json",
                write_kind=WriteKind.CANONICAL,
                candidate={"id": "company-03", "markdown": "# Candidate"},
                operation_id="op-A",
                job_marker={"jobId": "job-03", "operationId": "op-B"},
            )
        except CanonicalValidationError as exc:
            marker_mismatch_rejected = exc.code == "job_marker_operation_mismatch"

        try:
            build_revision_candidate(
                ReportKind.TOPIC_REPORT,
                {"id": "topic-02", "markdown": "# Topic\n\n## Evidence\nExisting"},
                "# Topic\n\n## Evidence\nhttps://attacker.invalid/canary",
                allowed_source_refs=(
                    {"kind": "source_id", "value": "https://attacker.invalid/canary"},
                ),
            )
        except CanonicalValidationError as exc:
            typed_source_kind_preserved = exc.code == "source_validation_failed"

    cleanup = fixture_path is not None and not fixture_path.exists()
    result = {
        "exactCollisionRejected": exact_collision_rejected,
        "canonicalHashStableAcrossOverlay": canonical_hash_stable,
        "storageHashChangedAcrossOverlay": storage_hash_changed,
        "threeAdaptersValidated": adapters_validated,
        "promotionReplayIdempotent": promotion_replay_idempotent,
        "forgedIntentRejected": forged_intent_rejected,
        "markerMismatchRejected": marker_mismatch_rejected,
        "typedSourceKindPreserved": typed_source_kind_preserved,
        "cleanup": cleanup,
    }
    (attempt_dir / "result.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    passed = all(result.values())
    print(json.dumps({"status": "PASS" if passed else "FAIL", **result}, ensure_ascii=False))
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
