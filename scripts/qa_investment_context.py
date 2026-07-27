"""Never read real user roots; run Investment Context tests and write cleanup-receipt.json."""
from __future__ import annotations

import argparse
from pathlib import Path

from qa_stage_024_support import run_pytest_scenario


TESTS = (
    "features/investment_review/tests/test_context_links.py::test_normalizes_tickers_and_builds_deterministic_bounded_links",
    "features/investment_review/tests/test_context_links.py::test_missing_sources_are_unavailable_not_inferred",
    "features/investment_review/tests/test_context_routes.py::test_empty_and_missing_sources_remain_useful_and_read_only",
    "features/portfolio/tests/test_context_boundaries.py",
    "features/watchlist_notes/tests/test_checkpoint_context.py",
    "features/agent_mode/tests/test_investment_context.py",
)


def run(source_root: Path, attempt_dir: Path) -> int:
    return run_pytest_scenario(
        source_root=source_root,
        attempt_dir=attempt_dir,
        scenario="IC-H1",
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
