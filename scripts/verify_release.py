#!/usr/bin/env python3
"""Verify a Folio OS release package artifact.

The verifier checks the packaged directory, not the repository checkout. It is
intentionally stricter than the packager so it can catch hand-edited artifacts.
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MANIFEST = ROOT / "release-manifest.json"
FORBIDDEN_SUFFIXES = {".sqlite", ".sqlite3", ".db", ".log"}
FORBIDDEN_KEY_SUFFIXES = {".pem", ".key"}
EXCLUDED_DIR_NAMES = {"__pycache__", ".pytest_cache", ".mypy_cache", ".ruff_cache", "node_modules"}
EXCLUDED_PARTS = {"tests"}
EXCLUDED_SUFFIXES = {".pyc", ".pyo"}


def _path_parts(rel: str) -> tuple[str, ...]:
    return Path(rel).parts


def _require_safe_relative(rel: str, section: str) -> None:
    path = Path(rel)
    if path.is_absolute() or ".." in path.parts:
        raise SystemExit(f"Unsafe path in {section}: {rel}")


def load_manifest(path: Path = DEFAULT_MANIFEST) -> dict:
    manifest = json.loads(path.read_text(encoding="utf-8"))
    for key in ("packageName", "runtimeFiles", "runtimeDirectories", "emptyDirectories", "forbiddenPaths"):
        if key not in manifest:
            raise SystemExit(f"Manifest missing required key: {key}")
    for section in ("runtimeFiles", "runtimeDirectories", "emptyDirectories", "forbiddenPaths"):
        if not isinstance(manifest[section], list):
            raise SystemExit(f"Manifest section must be a list: {section}")
        for rel in manifest[section]:
            _require_safe_relative(str(rel), section)
    return manifest


def _rel(path: Path, root: Path) -> str:
    return path.relative_to(root).as_posix()


def _is_under(path: Path, parent: Path) -> bool:
    try:
        path.relative_to(parent)
        return True
    except ValueError:
        return False


def _is_dev_or_cache_file(rel: str, path: Path) -> bool:
    parts = set(_path_parts(rel))
    return (
        bool(parts & EXCLUDED_DIR_NAMES)
        or bool(parts & EXCLUDED_PARTS)
        or path.name.endswith(".test.js")
        or path.suffix.lower() in EXCLUDED_SUFFIXES
    )


def find_missing_required_paths(release_dir: Path, manifest: dict) -> list[str]:
    issues: list[str] = []
    for rel in manifest["runtimeFiles"]:
        path = release_dir / rel
        if not path.is_file():
            issues.append(f"Missing required file: {rel}")
    for rel in manifest["runtimeDirectories"]:
        path = release_dir / rel
        if not path.is_dir():
            issues.append(f"Missing required directory: {rel}")
    for rel in manifest["emptyDirectories"]:
        path = release_dir / rel
        if not path.is_dir():
            issues.append(f"Missing empty runtime directory: {rel}")
    if not (release_dir / "release-manifest.json").is_file():
        issues.append("Missing copied release-manifest.json")
    return issues


def find_forbidden_paths(release_dir: Path, manifest: dict) -> list[str]:
    issues: list[str] = []
    forbidden = set(str(path).replace("\\", "/").strip("/") for path in manifest["forbiddenPaths"])
    forbidden_names = {Path(path).name for path in forbidden}
    empty_roots = [release_dir / rel for rel in manifest["emptyDirectories"]]

    for rel in sorted(forbidden):
        if (release_dir / rel).exists():
            issues.append(f"Forbidden path exists: {rel}")

    for path in release_dir.rglob("*"):
        rel = _rel(path, release_dir)
        parts = set(path.parts)
        rel_parts = set(_path_parts(rel))
        if rel_parts & forbidden_names:
            issues.append(f"Forbidden path component exists: {rel}")
        if _is_dev_or_cache_file(rel, path):
            issues.append(f"Development/cache path exists: {rel}")
        if path.is_file():
            suffix = path.suffix.lower()
            if path.name.lower() == ".env":
                issues.append(f"Forbidden environment file exists: {rel}")
            if suffix in FORBIDDEN_SUFFIXES:
                issues.append(f"Forbidden generated/database/log file exists: {rel}")
            if suffix in FORBIDDEN_KEY_SUFFIXES:
                issues.append(f"Potential private key file exists: {rel}")
            if any(_is_under(path, root) for root in empty_roots):
                issues.append(f"Runtime data directory must be empty: {rel}")
    return sorted(set(issues))


def find_unexpected_files(release_dir: Path, manifest: dict) -> list[str]:
    issues: list[str] = []
    allowed_files = {str(rel).replace("\\", "/") for rel in manifest["runtimeFiles"]}
    allowed_files.add("release-manifest.json")
    allowed_dirs = [release_dir / rel for rel in manifest["runtimeDirectories"]]

    for path in release_dir.rglob("*"):
        if not path.is_file():
            continue
        rel = _rel(path, release_dir)
        if rel in allowed_files:
            continue
        if any(_is_under(path, root) for root in allowed_dirs):
            continue
        issues.append(f"Unexpected file in release artifact: {rel}")
    return issues


def run_gitleaks_scan(release_dir: Path) -> list[str]:
    exe = shutil.which("gitleaks")
    if not exe:
        return ["Gitleaks is required for release verification but was not found on PATH."]
    result = subprocess.run(
        [exe, "dir", str(release_dir), "--redact"],
        cwd=ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=True,
        check=False,
    )
    if result.returncode == 0:
        return []
    detail = (result.stderr or result.stdout or "").strip()
    return [f"Gitleaks found issues in release artifact: {detail}"]


def verify_release(release_dir: Path, manifest_path: Path = DEFAULT_MANIFEST, *, run_gitleaks: bool = True) -> list[str]:
    release_dir = release_dir.resolve()
    if not release_dir.is_dir():
        return [f"Release directory does not exist: {release_dir}"]
    manifest = load_manifest(manifest_path)
    issues = find_missing_required_paths(release_dir, manifest)
    issues.extend(find_forbidden_paths(release_dir, manifest))
    issues.extend(find_unexpected_files(release_dir, manifest))
    if run_gitleaks:
        issues.extend(run_gitleaks_scan(release_dir))
    return sorted(set(issues))


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify a Folio OS release package directory.")
    parser.add_argument("--release-dir", type=Path, required=True, help="Release directory to verify.")
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST, help="Release manifest path.")
    parser.add_argument("--skip-gitleaks", action="store_true", help="Skip Gitleaks scan for tests or diagnostics.")
    args = parser.parse_args()

    issues = verify_release(args.release_dir, args.manifest, run_gitleaks=not args.skip_gitleaks)
    if issues:
        for issue in issues:
            print(issue, file=__import__("sys").stderr)
        return 1
    print(f"Verified release artifact: {args.release_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
