"""Create a clean Folio OS user release package.

This script intentionally packages only the runtime surface needed by a normal
0.1 user. It excludes source-development folders, tests, caches, and local user
data. Run it from the repository root after building the React bundle.
"""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUTPUT = ROOT / "dist" / "FolioOS-0.1"

TOP_LEVEL_FILES = [
    ".env.example",
    "app.py",
    "LICENSE",
    "README.md",
    "README.ko.md",
    "installation.md",
    "requirements.txt",
    "start.ps1",
    "start.sh",
    "start-archive.cmd",
    "THIRD_PARTY_NOTICES.md",
]

TOP_LEVEL_DIRS = [
    "features",
    "public",
    "config",
]

EMPTY_RUNTIME_DIRS = [
    "data",
    "data/briefings",
    "data/company-analysis",
    "data/topic-reports",
    "data/investment-notes",
    "data/notes",
    "data/logs",
    "research-inbox",
    "research-inbox/articles",
    "research-inbox/rss",
    "research-inbox/reports",
    "research-inbox/filings",
    "research-inbox/links",
    "research-inbox/market-data",
]

EXCLUDED_DIR_NAMES = {
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    "node_modules",
}

EXCLUDED_PARTS = {
    "tests",
}

EXCLUDED_SUFFIXES = {
    ".pyc",
    ".pyo",
}


def _relative(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def should_skip(path: Path) -> bool:
    rel = path.relative_to(ROOT)
    parts = set(rel.parts)
    if path.name in EXCLUDED_DIR_NAMES:
        return True
    if parts & EXCLUDED_PARTS:
        return True
    if path.name.endswith(".test.js"):
        return True
    if path.suffix.lower() in EXCLUDED_SUFFIXES:
        return True
    return False


def copy_tree(src: Path, dst: Path, *, dry_run: bool, copied: list[str]) -> None:
    for item in src.rglob("*"):
        if should_skip(item):
            continue
        rel = item.relative_to(src)
        target = dst / rel
        if item.is_dir():
            if not dry_run:
                target.mkdir(parents=True, exist_ok=True)
            continue
        if not dry_run:
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(item, target)
        copied.append(_relative(item))


def validate_output_path(output: Path) -> Path:
    resolved = output.resolve()
    allowed_root = (ROOT / "dist").resolve()
    if resolved == ROOT.resolve():
        raise SystemExit("Refusing to package into the repository root.")
    try:
        resolved.relative_to(allowed_root)
    except ValueError:
        raise SystemExit("Output must be inside the repository dist/ directory.")
    return resolved


def build_package(output: Path, *, dry_run: bool, force: bool) -> list[str]:
    output = validate_output_path(output)
    copied: list[str] = []

    if output.exists():
        if dry_run:
            pass
        elif force:
            shutil.rmtree(output)
        else:
            raise SystemExit(f"Output already exists: {output}. Use --force to replace it.")

    if not dry_run:
        output.mkdir(parents=True, exist_ok=True)

    for rel in TOP_LEVEL_FILES:
        src = ROOT / rel
        if not src.exists():
            raise SystemExit(f"Required file is missing: {rel}")
        if not dry_run:
            target = output / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, target)
        copied.append(rel)

    for rel in TOP_LEVEL_DIRS:
        src = ROOT / rel
        if not src.exists():
            raise SystemExit(f"Required directory is missing: {rel}")
        if not dry_run:
            (output / rel).mkdir(parents=True, exist_ok=True)
        copy_tree(src, output / rel, dry_run=dry_run, copied=copied)

    for rel in EMPTY_RUNTIME_DIRS:
        if not dry_run:
            (output / rel).mkdir(parents=True, exist_ok=True)
        copied.append(rel + "/")

    return copied


def main() -> int:
    parser = argparse.ArgumentParser(description="Package Folio OS 0.1 runtime files.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Output directory under dist/.")
    parser.add_argument("--dry-run", action="store_true", help="Print what would be packaged without writing files.")
    parser.add_argument("--force", action="store_true", help="Replace the output directory if it already exists.")
    args = parser.parse_args()

    copied = build_package(args.output, dry_run=args.dry_run, force=args.force)
    action = "Would package" if args.dry_run else "Packaged"
    print(f"{action} {len(copied)} paths into {args.output}")
    for rel in copied[:80]:
        print(f"  {rel}")
    if len(copied) > 80:
        print(f"  ... {len(copied) - 80} more")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
