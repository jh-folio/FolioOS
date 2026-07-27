#!/usr/bin/env python3
"""Fail unless all supplied lock files are byte-identical."""

from __future__ import annotations

import argparse
import hashlib
from pathlib import Path


def compare_lock_bytes(paths: list[Path]) -> str:
    if len(paths) < 2:
        raise ValueError("at least two lock files are required")
    expected = paths[0].read_bytes()
    for path in paths[1:]:
        if path.read_bytes() != expected:
            raise ValueError("lock drift detected")
    return hashlib.sha256(expected).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("paths", nargs="+", type=Path)
    args = parser.parse_args()
    try:
        digest = compare_lock_bytes(args.paths)
    except (OSError, ValueError) as exc:
        parser.error(str(exc))
    print(f"Lock byte comparison passed: files={len(args.paths)} sha256={digest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
