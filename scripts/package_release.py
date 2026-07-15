"""Create a clean Folio OS user release package.

The package is driven by release-manifest.json. Only the explicit runtime
surface is copied, empty first-run data directories are created, the result is
verified, and then a cross-platform ZIP is written under dist/.
"""

from __future__ import annotations

import argparse
import re
import shutil
import zipfile
from pathlib import Path

from verify_release import load_manifest, verify_release


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUTPUT_ROOT = ROOT / "dist"
DEFAULT_MANIFEST = ROOT / "release-manifest.json"

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


def validate_version(version: str) -> str:
    version = str(version or "").strip()
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,63}", version):
        raise SystemExit("Version must contain only letters, numbers, dots, dashes, or underscores.")
    if "/" in version or "\\" in version:
        raise SystemExit("Version must not contain path separators.")
    return version


def validate_output_root(output_root: Path) -> Path:
    allowed_root = DEFAULT_OUTPUT_ROOT.resolve()
    resolved = output_root.resolve()
    try:
        resolved.relative_to(allowed_root)
    except ValueError:
        raise SystemExit("Output must be inside the repository dist/ directory.")
    return resolved


def validate_artifact_path(output: Path) -> Path:
    resolved = output.resolve()
    allowed_root = (ROOT / "dist").resolve()
    if resolved == ROOT.resolve():
        raise SystemExit("Refusing to package into the repository root.")
    try:
        resolved.relative_to(allowed_root)
    except ValueError:
        raise SystemExit("Output must be inside the repository dist/ directory.")
    return resolved


def _remove_existing(package_dir: Path, package_zip: Path, *, force: bool) -> None:
    if package_dir.exists():
        if not force:
            raise SystemExit(f"Output already exists: {package_dir}. Use --force to replace it.")
        shutil.rmtree(validate_artifact_path(package_dir))
    if package_zip.exists():
        if not force:
            raise SystemExit(f"Output already exists: {package_zip}. Use --force to replace it.")
        validate_artifact_path(package_zip).unlink()


def _copy_manifest_entries(manifest: dict, package_dir: Path, *, dry_run: bool, copied: list[str]) -> None:
    for rel in manifest["runtimeFiles"]:
        src = ROOT / rel
        if not src.is_file():
            raise SystemExit(f"Required file is missing: {rel}")
        if not dry_run:
            target = package_dir / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, target)
        copied.append(rel)

    for rel in manifest["runtimeDirectories"]:
        src = ROOT / rel
        if not src.is_dir():
            raise SystemExit(f"Required directory is missing: {rel}")
        if not dry_run:
            (package_dir / rel).mkdir(parents=True, exist_ok=True)
        copy_tree(src, package_dir / rel, dry_run=dry_run, copied=copied)

    for rel in manifest["emptyDirectories"]:
        if not dry_run:
            (package_dir / rel).mkdir(parents=True, exist_ok=True)
        copied.append(rel + "/")


def write_zip(package_dir: Path, package_zip: Path) -> None:
    with zipfile.ZipFile(package_zip, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(package_dir.rglob("*")):
            if path.is_file():
                archive.write(path, path.relative_to(package_dir.parent).as_posix())


def build_package(
    version: str,
    *,
    output_root: Path = DEFAULT_OUTPUT_ROOT,
    manifest_path: Path = DEFAULT_MANIFEST,
    dry_run: bool,
    force: bool,
    skip_gitleaks: bool,
) -> tuple[list[str], Path, Path]:
    manifest = load_manifest(manifest_path)
    safe_version = validate_version(version)
    output_root = validate_output_root(output_root)
    package_dir = output_root / f"{manifest['packageName']}-{safe_version}"
    package_zip = package_dir.parent / f"{package_dir.name}.zip"
    validate_artifact_path(package_dir)
    validate_artifact_path(package_zip)

    copied: list[str] = []

    if not dry_run:
        output_root.mkdir(parents=True, exist_ok=True)
        _remove_existing(package_dir, package_zip, force=force)
        package_dir.mkdir(parents=True, exist_ok=True)

    _copy_manifest_entries(manifest, package_dir, dry_run=dry_run, copied=copied)
    if not dry_run:
        shutil.copy2(manifest_path, package_dir / "release-manifest.json")
        copied.append("release-manifest.json")
        issues = verify_release(package_dir, manifest_path, run_gitleaks=not skip_gitleaks)
        if issues:
            for issue in issues:
                print(issue)
            raise SystemExit("Release verification failed.")
        write_zip(package_dir, package_zip)

    return copied, package_dir, package_zip


def main() -> int:
    parser = argparse.ArgumentParser(description="Package Folio OS 0.1 runtime files.")
    parser.add_argument("--version", required=True, help="Package version suffix, e.g. v0.1.0.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT_ROOT, help="Output root under dist/.")
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST, help="Release manifest path.")
    parser.add_argument("--dry-run", action="store_true", help="Print what would be packaged without writing files.")
    parser.add_argument("--force", action="store_true", help="Replace the versioned output directory and ZIP.")
    parser.add_argument("--skip-gitleaks", action="store_true", help="Skip Gitleaks scan for tests or diagnostics.")
    args = parser.parse_args()

    copied, package_dir, package_zip = build_package(
        args.version,
        output_root=args.output,
        manifest_path=args.manifest,
        dry_run=args.dry_run,
        force=args.force,
        skip_gitleaks=args.skip_gitleaks,
    )
    action = "Would package" if args.dry_run else "Packaged"
    print(f"{action} {len(copied)} paths into {package_dir}")
    if not args.dry_run:
        print(f"Wrote ZIP: {package_zip}")
    for rel in copied[:80]:
        print(f"  {rel}")
    if len(copied) > 80:
        print(f"  ... {len(copied) - 80} more")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
