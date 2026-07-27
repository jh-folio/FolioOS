"""Never read real user roots; run the Stage 0.2.4 cross-feature error sweep."""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS_DIR))

from qa_stage_024_support import run_pytest_scenario


WEB_COMMAND = ("npm", "--prefix", "web", "test")
REQUIRED_STATES = {
    "no_rss_index": (
        "features/topic_report/tests/test_approved_request_http_contract.py::test_unconfirmed_zero_evidence_returns_confirmation_required",
        "features/topic_report/tests/test_evidence_pack.py::test_pack_handles_search_failure",
    ),
    "no_note_thesis": (
        "features/thesis_tracking/tests/test_review_state.py::test_missing_review_state_returns_safe_legacy_default",
        "features/investment_notes/tests/test_intelligence_schema.py::test_legacy_note_intelligence_gets_safe_defaults_only_via_adapter",
    ),
    "no_evidence_thesis_review": (
        "features/topic_report/tests/test_approved_request_service.py::test_plan_preview_has_exact_wrapper_zero_evidence_and_hypothesis_layer",
    ),
    "agent_missing_disabled": (
        "features/topic_report/tests/test_approved_generation.py::test_attempt_direct_missing_key_is_unavailable_without_transport_attempt",
        "features/agent_mode/tests/test_investment_context.py::test_runner_uses_rules_when_cli_missing_or_output_is_unsafe",
    ),
    "agent_timeout_cancel_restart": (
        "features/topic_report/tests/test_approved_generation.py::test_attempt_direct_classifies_timeout_as_engine_failure",
        "features/agent_mode/tests/test_bridge.py::test_cancel_agent_task_marks_shared_job_before_terminating_registered_process",
        "features/agent_mode/tests/test_work_log.py::test_restart_failed_and_every_job_and_proposal_state_survive_service_reload",
    ),
    "malformed_inputs": (
        "features/investment_notes/tests/test_intelligence_routes.py::test_intelligence_boundary_returns_bounded_4xx_errors",
        "features/smart_collections/tests/test_routes.py::test_query_and_body_bounds_are_422",
        "features/investment_review/tests/test_context_schema.py::test_investment_context_rejects_unknown_or_malformed_input",
        "features/investment_notes/tests/test_checkpoints.py::test_checkpoint_fields_are_controlled_and_bounded",
    ),
    "stale_collection_revision": (
        "features/smart_collections/tests/test_api.py::test_stale_revision_is_not_a_misleading_success",
    ),
    "collection_empty_noisy_stale": (
        "features/smart_collections/tests/test_change_detection.py::test_no_baseline_is_never_stale_and_empty_has_precedence",
        "features/smart_collections/tests/test_change_detection.py::test_explicit_unusable_and_churn_thresholds_trigger_noisy",
        "features/smart_collections/tests/test_change_detection.py::test_stale_and_provider_reset_have_safe_reason_codes",
    ),
    "corrupt_sidecar_recovery": (
        "features/smart_collections/tests/test_snapshot_store.py::test_interrupted_sidecar_recovers_backup_or_returns_unavailable",
    ),
    "empty_portfolio_watchlist": (
        "features/investment_review/tests/test_context_routes.py::test_empty_and_missing_sources_remain_useful_and_read_only",
        "features/investment_review/tests/test_review_summary.py::test_empty_data_produces_warning",
    ),
    "missing_market_memory": (
        "features/investment_review/tests/test_context_links.py::test_missing_sources_are_unavailable_not_inferred",
    ),
    "stale_personal_overlay": (
        "features/personal_overlay/tests/test_overlay.py::test_public_projection_normalizes_current_stale_and_legacy_revision_state",
    ),
    "dirty_source_package": (
        "tests/test_release_tools.py::test_package_rejects_dirty_tracked_runtime_before_writing",
        "tests/test_release_boundaries.py::test_audit_rejects_dirty_config_from_status_without_opening_it",
    ),
    "misleading_provider_success": (
        "features/topic_report/tests/test_approved_generation.py::test_attempt_direct_rejects_empty_or_misleading_success",
        "tests/test_release_security_contract.py::test_misleading_zero_without_report_fails_closed",
    ),
}


def _write(path: Path, payload: dict) -> None:
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def run(source_root: Path, attempt_dir: Path) -> int:
    source = source_root.resolve()
    attempt = attempt_dir.resolve()
    attempt.mkdir(parents=True, exist_ok=True)
    tests = tuple(dict.fromkeys(test for rows in REQUIRED_STATES.values() for test in rows))
    backend_dir = attempt / "backend"
    backend_code = run_pytest_scenario(
        source_root=source,
        attempt_dir=backend_dir,
        scenario="ERROR-STATE-SWEEP",
        tests=tests,
    )
    environment = dict(os.environ)
    environment["PYTHONDONTWRITEBYTECODE"] = "1"
    web_executable = shutil.which(WEB_COMMAND[0]) or WEB_COMMAND[0]
    web = subprocess.run(
        (web_executable, *WEB_COMMAND[1:]),
        cwd=source,
        env=environment,
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=True,
        timeout=180,
        check=False,
    )
    (attempt / "web.stdout.txt").write_text(web.stdout, encoding="utf-8")
    (attempt / "web.stderr.txt").write_text(web.stderr, encoding="utf-8")
    backend_cleanup = json.loads(
        (backend_dir / "cleanup-receipt.json").read_text(encoding="utf-8")
    )
    cleanup = {
        "runtimeRemoved": backend_cleanup.get("runtimeRemoved") is True,
        "serverStopped": True,
        "portsReleased": True,
        "browserClosed": True,
        "partialWritesAbsent": backend_code == 0,
    }
    passed = backend_code == 0 and web.returncode == 0 and all(cleanup.values())
    _write(attempt / "cleanup-receipt.json", cleanup)
    _write(
        attempt / "index.json",
        {
            "scenario": "cross-feature-error-state-sweep",
            "passed": passed,
            "states": {name: list(rows) for name, rows in REQUIRED_STATES.items()},
            "backendReturnCode": backend_code,
            "webReturnCode": web.returncode,
            "evidence": [
                "backend/index.json",
                "backend/cleanup-receipt.json",
                "web.stdout.txt",
                "web.stderr.txt",
                "cleanup-receipt.json",
            ],
        },
    )
    return 0 if passed else 4


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", type=Path, required=True)
    parser.add_argument("--attempt-dir", type=Path, required=True)
    args = parser.parse_args()
    return run(args.source_root, args.attempt_dir)


if __name__ == "__main__":
    raise SystemExit(main())
