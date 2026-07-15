# Release Packaging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify a cross-platform Folio OS runtime ZIP from an explicit allowlist.

**Architecture:** `release-manifest.json` declares runtime files, directories, empty user-data directories, and forbidden paths. `scripts/package_release.py` reads that manifest, builds a versioned directory under `dist/`, verifies it through `scripts/verify_release.py`, then writes a ZIP. The existing public-tree audit remains separate from artifact verification.

**Tech Stack:** Python 3 standard library, JSON, pathlib, shutil, zipfile, pytest, Gitleaks CLI, GitHub Actions.

## Global Constraints

- The release package must never copy `.env`, `.git`, `data/` contents, `research-inbox/` contents, `roadmap/`, local agent settings, caches, or databases.
- `data/` and `research-inbox/` may exist only as empty first-run directory trees in the package.
- The builder must support the existing Windows and macOS/Linux launchers.
- Gitleaks is required for a real package verification; a skip flag is restricted to structural automated tests and explicit local diagnostics.
- Output remains beneath ignored `dist/`; `--force` may remove only a validated child of that directory.

---

### Task 1: Define the manifest contract and failing tests

**Files:**
- Create: `release-manifest.json`
- Create: `tests/test_release_tools.py`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: repository root and the existing package runtime surface.
- Produces: JSON fields `packageName`, `runtimeFiles`, `runtimeDirectories`, `emptyDirectories`, and `forbiddenPaths`.

- [ ] **Step 1: Write failing tests for the future manifest and package command**

```python
def test_manifest_lists_only_relative_runtime_paths() -> None:
    manifest = json.loads((ROOT / "release-manifest.json").read_text(encoding="utf-8"))
    for section in ("runtimeFiles", "runtimeDirectories", "emptyDirectories"):
        for value in manifest[section]:
            assert not Path(value).is_absolute()
            assert ".." not in Path(value).parts


def test_package_dry_run_requires_a_safe_version() -> None:
    result = run_package("--version", "../unsafe", "--dry-run")
    assert result.returncode != 0
```

- [ ] **Step 2: Run the focused tests to verify they fail because release files do not exist**

Run: `py -3 -m pytest tests/test_release_tools.py -q`

Expected: failure reporting missing `release-manifest.json` or unsupported package CLI.

- [ ] **Step 3: Add the manifest with the existing runtime allowlist**

```json
{
  "packageName": "FolioOS",
  "runtimeFiles": [".env.example", "app.py", "LICENSE", "README.md", "README.ko.md", "installation.md", "requirements.txt", "start.ps1", "start.sh", "start-archive.cmd", "THIRD_PARTY_NOTICES.md"],
  "runtimeDirectories": ["features", "public", "config"],
  "emptyDirectories": ["data", "research-inbox/articles", "research-inbox/rss", "research-inbox/reports", "research-inbox/filings", "research-inbox/links", "research-inbox/market-data"],
  "forbiddenPaths": [".env", ".git", "roadmap", ".agents", ".claude", ".codex", ".superpowers", "node_modules"]
}
```

- [ ] **Step 4: Extend CI test discovery to include release-tool tests**

```yaml
- name: Run tests
  run: python -m pytest features tests -q
```

- [ ] **Step 5: Run the manifest-only test and confirm it passes before package implementation**

Run: `py -3 -m pytest tests/test_release_tools.py::test_manifest_lists_only_relative_runtime_paths -q`

Expected: `1 passed`.

### Task 2: Add package artifact verification

**Files:**
- Create: `scripts/verify_release.py`
- Modify: `tests/test_release_tools.py`

**Interfaces:**
- Consumes: `verify_release.py --release-dir PATH [--manifest PATH] [--skip-gitleaks]`.
- Produces: exit status 0 only when the artifact matches the allowlist and contains no forbidden paths.

- [ ] **Step 1: Write failing verifier tests**

```python
def test_verifier_rejects_a_forbidden_env_file(tmp_path: Path) -> None:
    package = make_minimal_package(tmp_path)
    (package / ".env").write_text("not-a-real-secret", encoding="utf-8")
    result = run_verifier(package, "--skip-gitleaks")
    assert result.returncode != 0
    assert ".env" in result.stderr
```

- [ ] **Step 2: Run the verifier test to verify it fails because the command is absent**

Run: `py -3 -m pytest tests/test_release_tools.py::test_verifier_rejects_a_forbidden_env_file -q`

Expected: failure reporting that `scripts/verify_release.py` does not exist.

- [ ] **Step 3: Implement manifest loading and artifact checks**

```python
def verify_release(release_dir: Path, manifest_path: Path, *, run_gitleaks: bool) -> list[str]:
    manifest = load_manifest(manifest_path)
    issues = find_missing_required_paths(release_dir, manifest)
    issues.extend(find_forbidden_paths(release_dir, manifest))
    issues.extend(find_unexpected_files(release_dir, manifest))
    if run_gitleaks:
        issues.extend(run_gitleaks_scan(release_dir))
    return issues
```

`find_unexpected_files` accepts files below declared runtime directories and
empty directories, plus the copied `release-manifest.json`; all other files
are reported. `find_forbidden_paths` rejects forbidden directory names, `.env`,
database suffixes, and nonempty files below `data/` or `research-inbox/`.

- [ ] **Step 4: Run verifier tests to verify they pass**

Run: `py -3 -m pytest tests/test_release_tools.py -q`

Expected: the manifest and forbidden-file tests pass; package command tests may still fail until Task 3.

### Task 3: Make the package builder manifest-driven and produce a ZIP

**Files:**
- Modify: `scripts/package_release.py`
- Modify: `tests/test_release_tools.py`

**Interfaces:**
- Consumes: `package_release.py --version VERSION [--output PATH] [--dry-run] [--force] [--skip-gitleaks]`.
- Produces: `dist/FolioOS-VERSION/` and `dist/FolioOS-VERSION.zip` after successful verification.

- [ ] **Step 1: Write a failing end-to-end build test**

```python
def test_package_build_creates_verified_zip() -> None:
    version = "test-release-tools"
    result = run_package("--version", version, "--force", "--skip-gitleaks")
    assert result.returncode == 0, result.stderr
    assert (ROOT / "dist" / f"FolioOS-{version}" / "release-manifest.json").is_file()
    assert (ROOT / "dist" / f"FolioOS-{version}.zip").is_file()
```

- [ ] **Step 2: Run the end-to-end test and verify it fails for the missing versioned package behavior**

Run: `py -3 -m pytest tests/test_release_tools.py::test_package_build_creates_verified_zip -q`

Expected: failure because the current package command has no `--version` option.

- [ ] **Step 3: Replace hard-coded runtime lists with manifest-driven copying**

```python
parser.add_argument("--version", required=True)
parser.add_argument("--skip-gitleaks", action="store_true")
package_dir = output_root / f"{manifest['packageName']}-{validate_version(args.version)}"
copy_manifest_entries(ROOT, package_dir, manifest, dry_run=args.dry_run)
copy2(ROOT / "release-manifest.json", package_dir / "release-manifest.json")
verify_package(package_dir, skip_gitleaks=args.skip_gitleaks)
write_zip(package_dir, package_dir.with_suffix(".zip"))
```

The builder must retain its existing output-root validation and make `--force`
delete only the computed package directory and ZIP beneath `dist/`.

- [ ] **Step 4: Run the focused build test and confirm it passes**

Run: `py -3 -m pytest tests/test_release_tools.py::test_package_build_creates_verified_zip -q`

Expected: `1 passed`.

- [ ] **Step 5: Run a real Gitleaks-backed package build**

Run: `py -3 scripts/package_release.py --version release-check --force`

Expected: package directory and ZIP created after a zero-finding Gitleaks scan.

### Task 4: Wire release checks into CI and user documentation

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `docs/PUBLIC_RELEASE_CHECKLIST.md`
- Modify: `tests/test_release_tools.py`

**Interfaces:**
- Consumes: clean repository checkout in CI.
- Produces: CI failure for a public-tree audit failure, invalid manifest, or invalid package dry-run.

- [ ] **Step 1: Write failing tests for documented manifest coverage**

```python
def test_manifest_includes_cross_platform_launchers() -> None:
    manifest = json.loads((ROOT / "release-manifest.json").read_text(encoding="utf-8"))
    assert "start.ps1" in manifest["runtimeFiles"]
    assert "start.sh" in manifest["runtimeFiles"]
```

- [ ] **Step 2: Run the focused test and confirm it passes from the manifest created in Task 1**

Run: `py -3 -m pytest tests/test_release_tools.py::test_manifest_includes_cross_platform_launchers -q`

Expected: `1 passed`.

- [ ] **Step 3: Add CI release-tool validation steps after Python compilation**

```yaml
- name: Audit public release tree
  run: python scripts/public_release_audit.py

- name: Validate release package manifest
  run: python scripts/package_release.py --version ci --dry-run
```

- [ ] **Step 4: Add release checklist commands**

```markdown
- [ ] `py -3 scripts/package_release.py --version vX.Y.Z` creates a verified ZIP under `dist/`.
- [ ] `py -3 scripts/verify_release.py --release-dir dist/FolioOS-vX.Y.Z` passes.
```

- [ ] **Step 5: Run the complete targeted verification set**

Run: `py -3 -m pytest tests/test_release_tools.py -q`

Run: `py -3 scripts/public_release_audit.py`

Run: `py -3 scripts/package_release.py --version release-check --force`

Expected: all commands exit 0; the final command reports a verified directory and ZIP with no Gitleaks findings.

### Task 5: Final review and commit

**Files:**
- Verify: `release-manifest.json`
- Verify: `scripts/package_release.py`
- Verify: `scripts/verify_release.py`
- Verify: `tests/test_release_tools.py`
- Verify: `.github/workflows/ci.yml`
- Verify: `docs/PUBLIC_RELEASE_CHECKLIST.md`

- [ ] **Step 1: Inspect the final diff and package artifact file list**

Run: `git diff --check`

Run: `py -3 scripts/package_release.py --version release-check --force`

Run: `py -3 scripts/verify_release.py --release-dir dist/FolioOS-release-check`

Expected: no whitespace errors, no forbidden package paths, and a successful Gitleaks scan.

- [ ] **Step 2: Remove only the generated `dist/FolioOS-release-check/` directory and ZIP**

Run: `Remove-Item -LiteralPath dist/FolioOS-release-check -Recurse -Force`

Run: `Remove-Item -LiteralPath dist/FolioOS-release-check.zip -Force`

Expected: tracked repository files remain unchanged; `dist/` stays ignored.

- [ ] **Step 3: Commit the release tooling change**

```bash
git add release-manifest.json scripts/package_release.py scripts/verify_release.py tests/test_release_tools.py .github/workflows/ci.yml docs/PUBLIC_RELEASE_CHECKLIST.md docs/superpowers/specs/2026-07-10-release-packaging-design.md docs/superpowers/plans/2026-07-10-release-packaging.md
git commit -m "feat: add verified release packaging"
```
