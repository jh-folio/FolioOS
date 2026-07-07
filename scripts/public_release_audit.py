#!/usr/bin/env python3
"""Lightweight public release audit for Folio OS.

This script checks for files and folders that should not be included in the
public release tree. It does not replace a real secret scanner such as Gitleaks.
"""

from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

FORBIDDEN_PATHS = [
    ".env",
    "README.dev.md",
    "data",
    "research-inbox",
    "roadmap",
    ".agents",
    ".claude",
    ".superpowers",
    "start-lan.ps1",
    "start-lan.cmd",
]

FORBIDDEN_SUFFIXES = [
    ".sqlite",
    ".sqlite3",
    ".db",
    ".log",
]

SUSPICIOUS_FILENAMES = [
    "credentials",
    "token",
    "secret",
    "private",
]

ALLOWED_SUSPICIOUS = {
    "SECURITY.md",
    "docs/PUBLIC_RELEASE_CHECKLIST.md",
    "scripts/public_release_audit.py",
}


def main() -> int:
    issues: list[str] = []

    for rel in FORBIDDEN_PATHS:
        path = ROOT / rel
        if path.exists():
            issues.append(f"Forbidden path exists: {rel}")

    for path in ROOT.rglob("*"):
        if ".git" in path.parts:
            continue
        if path.is_dir():
            continue

        rel = path.relative_to(ROOT).as_posix()
        lower_name = path.name.lower()

        if path.suffix.lower() in FORBIDDEN_SUFFIXES:
            issues.append(f"Forbidden generated/database/log file: {rel}")

        if lower_name == ".env":
            issues.append(f"Environment file found: {rel}")

        if lower_name.endswith(".pem") or lower_name.endswith(".key"):
            issues.append(f"Potential private key file found: {rel}")

        for marker in SUSPICIOUS_FILENAMES:
            if marker in lower_name and rel not in ALLOWED_SUSPICIOUS:
                issues.append(f"Suspicious filename: {rel}")
                break

    if issues:
        print("Public release audit found issues:\n")
        for issue in issues:
            print(f"- {issue}")
        print("\nFix these issues before making the repository public.")
        return 1

    print("No issues found by this lightweight audit.")
    print("Still run Gitleaks before public release.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
