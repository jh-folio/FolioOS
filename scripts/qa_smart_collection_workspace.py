"""Never read real user roots; run Collection tests and write cleanup-receipt.json."""
from __future__ import annotations

import argparse
from pathlib import Path

from qa_stage_024_support import run_pytest_scenario


TESTS = (
    "features/smart_collections/tests/test_snapshot_store.py",
    "features/smart_collections/tests/test_change_detection.py",
    "features/smart_collections/tests/test_workspace_api.py",
    "features/smart_collections/tests/test_api.py::test_stale_revision_is_not_a_misleading_success",
    "features/agent_mode/tests/test_collection_context.py::test_change_summary_context_is_bounded_layered_and_read_only",
)


def run(source_root: Path, attempt_dir: Path) -> int:
    return run_pytest_scenario(
        source_root=source_root,
        attempt_dir=attempt_dir,
        scenario="SC-H2",
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
