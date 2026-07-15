# Release Packaging Design

## Goal

Produce a portable ZIP release for Folio OS that contains only the runtime
surface needed by end users, and fail the release process when the package
contains unexpected or sensitive paths.

## Context

The repository already has `scripts/package_release.py`, which assembles a
runtime folder under `dist/`, and `scripts/public_release_audit.py`, which
checks the repository tree for public-release exclusions. The project supports
Windows through `start.ps1` and macOS/Linux through `start.sh`.

## Considered Approaches

1. Add Windows-only PowerShell build scripts. This would duplicate the existing
   Python packager and would not naturally serve macOS/Linux users.
2. Keep the current hard-coded Python lists. This has the smallest diff, but
   makes the release allowlist hard to review independently from implementation.
3. Extend the existing Python packager with a versioned JSON manifest, package
   verification, and ZIP creation. This is the chosen approach because it is
   cross-platform, preserves local workflow, and makes the distributable
   surface reviewable as data.

## Components

### Release Manifest

Add `release-manifest.json` at the repository root. It defines a package name,
the exact top-level files and directories copied to a release, and empty
runtime data directories created for first-run use. It also records forbidden
path names used by package verification.

The manifest is an allowlist. Adding a new runtime file requires an intentional
manifest change. The package must include the manifest itself so that an
artifact can be verified independently of the source checkout.

### Package Builder

Extend `scripts/package_release.py` rather than adding a second builder.

- Accept a required release version.
- Validate that the version is safe for a directory and ZIP filename.
- Read and validate relative manifest paths before copying.
- Build `dist/FolioOS-<version>/` from the allowlist.
- Create required empty `data/` and `research-inbox/` subdirectories without
  copying user content.
- Run package verification before creating `dist/FolioOS-<version>.zip`.
- Refuse to overwrite existing output unless the existing scoped `--force`
  option is explicitly supplied.

The release archive contains the top-level package directory so a user can
extract it without scattering files into an arbitrary folder.

### Package Verifier

Add `scripts/verify_release.py` with one responsibility: validate a built
release directory.

It checks that required manifest entries exist, every copied file is covered by
the allowlist, and forbidden paths such as `.env`, `.git`, `roadmap/`,
`.claude/`, `data/*.sqlite3`, and `research-inbox/` content are absent. It then
runs Gitleaks in redacted directory-scan mode. Missing Gitleaks is an error for
a real release verification.

`scripts/public_release_audit.py` remains the repository-tree guard; it is not
repurposed as an artifact verifier.

### CI and Documentation

CI will run the public-tree audit, the release builder in dry-run mode, and
release-tool tests. The public release checklist will reference the package
build and verification commands. The normal GitHub source repository remains
the contributor source distribution; the ZIP is the end-user runtime package.

## Failure Handling

- Missing manifest entries, invalid manifest paths, absent required files, and
  unexpected package files fail the command with a nonzero status.
- Existing output fails by default to prevent accidental replacement.
- Gitleaks findings or an unavailable Gitleaks executable fail verification.
- The builder never reads or copies `.env`, `data/`, `research-inbox/`, Git
  metadata, local agent settings, caches, or roadmap files.

## Testing

Add focused Python tests for manifest parsing, forbidden-path rejection, and a
real package build into a temporary `dist/` child. The test verifies the output
folder and ZIP contain the expected runtime shape and no forbidden paths. CI
will include these tests with the existing Python test command.

## Non-Goals

- Producing a native executable or installer.
- Replacing the existing source repository with a binary distribution.
- Copying private settings, personal research data, or old Git history.
