#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
from pathlib import Path
from typing import Final


ROOT: Final = Path(__file__).resolve().parents[1]
FORBIDDEN_SUFFIXES: Final = frozenset({".sqlite", ".sqlite3", ".db", ".log", ".pem", ".key"})
USER_ROOTS: Final = ("config/", "data/", "research-inbox/")


def _git(root: Path, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        cwd=root,
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=True,
        check=False,
    )


def _tracked_paths(root: Path) -> tuple[list[str], list[str]]:
    result = _git(root, "ls-files", "-z")
    if result.returncode != 0:
        return [], ["Unable to enumerate tracked release inputs."]
    return [path for path in result.stdout.split("\0") if path], []


def _status_paths(root: Path) -> tuple[list[tuple[str, str]], list[str]]:
    result = _git(root, "status", "--porcelain=v1", "-z", "--ignored=matching", "--untracked-files=all")
    if result.returncode != 0:
        return [], ["Unable to enumerate release status metadata."]
    records = [record for record in result.stdout.split("\0") if record]
    entries: list[tuple[str, str]] = []
    index = 0
    while index < len(records):
        record = records[index]
        status = record[:2]
        entries.append((status, record[3:]))
        index += 2 if status[0] in {"R", "C"} else 1
    return entries, []


def audit_repository(root: Path = ROOT) -> list[str]:
    manifest = json.loads((root / "release-manifest.json").read_text(encoding="utf-8"))
    runtime_directories = tuple(f"{str(path).strip('/\\')}/" for path in manifest["runtimeDirectories"])
    runtime_files = frozenset(str(path).replace("\\", "/") for path in manifest["runtimeFiles"])
    tracked, issues = _tracked_paths(root)
    statuses, status_issues = _status_paths(root)
    issues.extend(status_issues)

    for path in tracked:
        normalized = path.replace("\\", "/")
        if Path(normalized).suffix.lower() in FORBIDDEN_SUFFIXES:
            issues.append(f"Forbidden tracked input: {normalized}")
        if normalized.startswith(("data/", "research-inbox/")) or normalized == ".env":
            issues.append(f"Private tracked input: {normalized}")

    for status, path in statuses:
        normalized = path.replace("\\", "/")
        if normalized == "config" or normalized.startswith("config/"):
            issues.append(f"Local config status is release-forbidden: {normalized}")
        is_runtime = normalized in runtime_files or normalized.startswith(runtime_directories)
        if status == "??" and is_runtime and "canary" in Path(normalized).name.casefold():
            issues.append(f"Untracked runtime canary: {normalized}")

    return sorted(set(issues))


def main() -> int:
    issues = audit_repository()
    if issues:
        print("Public release audit found issues:")
        for issue in issues:
            print(f"- {issue}")
        return 1
    print("No issues found in tracked/package input metadata.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
