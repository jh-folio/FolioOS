#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "pydantic>=2",
# ]
# ///

# ─── How to run ───
# 1. Install uv (if not installed):
#      curl -LsSf https://astral.sh/uv/install.sh | sh
# 2. Run directly (no venv, no pip install needed):
#      uv run qa_job_json_producers.py --source-root <root> --attempt-dir <dir>
# 3. Or make executable and run:
#      chmod +x qa_job_json_producers.py && ./qa_job_json_producers.py --source-root <root> --attempt-dir <dir>
# ──────────────────

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
from pathlib import Path
from typing import TypedDict

SOURCE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SOURCE_ROOT))

from features.common.job_json_qa_adapters import producer_adapters
from features.common.job_json_qa_core import (
    briefing_matrix,
    has_runtime_residue,
    invalid_and_stale,
    restart_boundaries,
)


type PeerHashes = dict[str, str]


class Results(TypedDict):
    briefing_matrix: bool
    cleanup: bool
    deterministic_order: bool
    invalid_metadata: bool
    passed: bool
    producer_adapters: bool
    restart_boundaries: bool
    runtime_residue_zero: bool
    saved_target_reread: bool
    sqlite_peers_unchanged: bool
    stale_target_preserved: bool


class QaSourceRootError(Exception):
    __slots__ = ()


def _peer_hashes(source_root: Path) -> PeerHashes:
    paths = sorted((source_root / "features" / "market_memory").glob("*.py"))
    paths.extend(sorted((source_root / "features" / "thesis_tracking").glob("*.py")))
    return {
        path.relative_to(source_root).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest()
        for path in paths
    }


def _blank_results() -> Results:
    return {
        "briefing_matrix": False,
        "cleanup": False,
        "deterministic_order": False,
        "invalid_metadata": False,
        "passed": False,
        "producer_adapters": False,
        "restart_boundaries": False,
        "runtime_residue_zero": False,
        "saved_target_reread": False,
        "sqlite_peers_unchanged": False,
        "stale_target_preserved": False,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", type=Path, required=True)
    parser.add_argument("--attempt-dir", type=Path, required=True)
    args = parser.parse_args()
    source_root = args.source_root.resolve()
    attempt_dir = args.attempt_dir.resolve()
    attempt_dir.mkdir(parents=True, exist_ok=True)
    runtime = attempt_dir / ".runtime"
    if runtime.exists():
        shutil.rmtree(runtime)
    before_peers = _peer_hashes(source_root)
    results = _blank_results()
    try:
        if source_root != SOURCE_ROOT:
            raise QaSourceRootError()
        runtime.mkdir(parents=True)
        results["restart_boundaries"] = restart_boundaries(runtime)
        briefing, deterministic, reread = briefing_matrix(runtime)
        results["briefing_matrix"] = briefing
        results["deterministic_order"] = deterministic
        results["saved_target_reread"] = reread
        results["producer_adapters"] = producer_adapters(runtime)
        invalid, stale = invalid_and_stale(runtime)
        results["invalid_metadata"] = invalid
        results["stale_target_preserved"] = stale
        results["runtime_residue_zero"] = not has_runtime_residue(runtime)
        results["sqlite_peers_unchanged"] = before_peers == _peer_hashes(source_root)
    finally:
        if runtime.exists():
            shutil.rmtree(runtime)
        results["cleanup"] = not runtime.exists()
        results["passed"] = all(value for key, value in results.items() if key != "passed")
        (attempt_dir / "result.json").write_text(
            json.dumps(results, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
        )
    return 0 if results["passed"] else 4


if __name__ == "__main__":
    raise SystemExit(main())
