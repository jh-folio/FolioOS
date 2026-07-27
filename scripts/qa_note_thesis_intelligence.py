"""Never read real user roots; run Note/Thesis tests and write cleanup-receipt.json."""
from __future__ import annotations

import argparse
from pathlib import Path

from qa_stage_024_support import run_pytest_scenario


TESTS = (
    "features/investment_notes/tests/test_service.py::test_save_note_preserves_user_thoughts_and_agent_interaction_log",
    "features/investment_notes/tests/test_intelligence_routes.py::test_thesis_review_and_checkpoint_update_are_revision_safe",
    "features/thesis_tracking/tests/test_thesis_model.py::test_delta_fallback_classifies_challenging_evidence",
    "features/thesis_tracking/tests/test_review_state.py::test_completed_delta_updates_review_state_and_preserves_checked_checkpoint",
    "features/thesis_tracking/tests/test_sql_job_service.py::test_thesis_restart_recovery_marks_complete_receipt_done",
    "features/agent_mode/tests/test_canonical_core.py::test_job_marker_does_not_change_storage_or_canonical_hash",
)


def run(source_root: Path, attempt_dir: Path) -> int:
    return run_pytest_scenario(
        source_root=source_root,
        attempt_dir=attempt_dir,
        scenario="NT-H1",
        tests=TESTS,
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", type=Path, required=True)
    parser.add_argument("--attempt-dir", type=Path, required=True)
    args = parser.parse_args()
    return run(args.source_root, args.attempt_dir)


if __name__ == "__main__":
    raise SystemExit(main())
