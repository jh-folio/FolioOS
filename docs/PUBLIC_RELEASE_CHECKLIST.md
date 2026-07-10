# Folio OS Public Release Checklist

Use this checklist before changing the repository visibility to Public.

## Repository Hygiene

- [ ] `.env` is not present.
- [ ] `data/` is not present.
- [ ] `research-inbox/` is not present.
- [ ] `roadmap/` is not present.
- [ ] `README.dev.md` is not present.
- [ ] `.agents/`, `.claude/`, and `.superpowers/` are not present.
- [ ] local launcher variants such as `start-lan.ps1` and `start-lan.cmd` are not present.
- [ ] generated databases, logs, caches, and local reports are not present.

## Security

- [ ] `SECURITY.md` exists.
- [ ] `.env.example` contains placeholders only.
- [ ] Gitleaks scan passes.
- [ ] GitHub Secret scanning is enabled.
- [ ] GitHub Push protection is enabled.
- [ ] Dependabot alerts are enabled.
- [ ] Code scanning is enabled or CodeQL workflow is present.

## Documentation

- [ ] `README.md` explains local-first behavior.
- [ ] `README.md` warns against public internet exposure.
- [ ] `README.md` explains optional third-party service usage.
- [ ] `installation.md` points to the correct repository URL.
- [ ] License is present.

## Validation

- [ ] `python -m py_compile app.py` passes.
- [ ] Python tests pass.
- [ ] `py -3 scripts/public_release_audit.py` passes.
- [ ] `py -3 scripts/package_release.py --version vX.Y.Z` creates a verified ZIP under `dist/`.
- [ ] `py -3 scripts/verify_release.py --release-dir dist/FolioOS-vX.Y.Z` passes.
- [ ] Web typecheck passes.
- [ ] Web tests pass.
- [ ] Web build passes.
- [ ] GitHub Actions CI passes.

## Release

- [ ] The repository starts as Private.
- [ ] The initial public release commit contains only clean files.
- [ ] The `v0.1.0` tag points to the clean release commit.
- [ ] Repository visibility is changed to Public only after all checks pass.
