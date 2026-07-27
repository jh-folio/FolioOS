#!/usr/bin/env python3
"""Normalize generated lock files to UTF-8 with LF line endings."""

from __future__ import annotations

import argparse
import os
import re
import tempfile
from pathlib import Path


def normalize_lock(path: Path) -> None:
    raw = path.read_bytes()
    text = raw.decode("utf-8").replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(
        r"(?m)^(#\s+.*--output-file\s+)\S+(\s+requirements\.txt\s*)$",
        r"\1requirements.lock.py312.txt\2",
        text,
        count=1,
    )
    if not text.endswith("\n"):
        text += "\n"
    normalized = text.encode("utf-8")
    if raw == normalized:
        return
    with tempfile.NamedTemporaryFile(dir=path.parent, prefix=f".{path.name}.", delete=False) as handle:
        temporary = Path(handle.name)
        handle.write(normalized)
        handle.flush()
        os.fsync(handle.fileno())
    os.replace(temporary, path)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("paths", nargs="+", type=Path)
    args = parser.parse_args()
    for path in args.paths:
        normalize_lock(path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
