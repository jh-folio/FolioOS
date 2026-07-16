from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]
BASE_COMMIT = "73a8a3a40de51cc482ae6c28a446ffc8f0492410"
DEFAULT_NAMES = (
    "company_aliases.json",
    "company_master.json",
    "evidence_sources.yaml",
    "kospi200_constituents.json",
    "rss_feeds.yaml",
    "sp500_constituents.json",
)
sys.path.insert(0, str(ROOT / "scripts"))
import public_release_audit as release_audit  # noqa: E402


def _git(root: Path, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        cwd=root,
        text=True,
        encoding="utf-8",
        capture_output=True,
        check=False,
    )


@pytest.fixture
def audit_repo(tmp_path: Path) -> Path:
    root = tmp_path / "source"
    root.mkdir()
    (root / "features").mkdir()
    (root / "defaults" / "config").mkdir(parents=True)
    (root / "config").mkdir()
    (root / "data").mkdir()
    (root / "research-inbox").mkdir()
    (root / ".gitignore").write_text("/config/\n/data/\n/research-inbox/\n", encoding="utf-8")
    manifest = {
        "packageName": "FolioOS",
        "runtimeFiles": ["VERSION"],
        "runtimeDirectories": ["features", "defaults"],
        "emptyDirectories": ["data", "research-inbox"],
        "forbiddenPaths": ["config", ".env"],
    }
    (root / "release-manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
    (root / "VERSION").write_text("0.2.0\n", encoding="utf-8")
    (root / "features" / "runtime.py").write_text("VALUE = 1\n", encoding="utf-8")
    assert _git(root, "init").returncode == 0
    assert _git(root, "config", "user.email", "test@example.invalid").returncode == 0
    assert _git(root, "config", "user.name", "Release Test").returncode == 0
    assert _git(root, "add", ".").returncode == 0
    assert _git(root, "commit", "-m", "fixture").returncode == 0
    (root / "config" / "sentinel.json").write_bytes(b"private-config")
    (root / "data" / "sentinel.json").write_bytes(b"private-data")
    (root / "research-inbox" / "sentinel.md").write_bytes(b"private-research")
    return root


def _audit(root: Path) -> list[str]:
    audit = getattr(release_audit, "audit_repository", None)
    assert callable(audit), "metadata-only release audit contract is missing"
    return audit(root)


def test_defaults_are_exact_reviewed_git_blobs() -> None:
    for name in DEFAULT_NAMES:
        result = subprocess.run(
            ["git", "cat-file", "blob", f"{BASE_COMMIT}:config/{name}"],
            cwd=ROOT,
            capture_output=True,
            check=False,
        )
        assert result.returncode == 0
        assert (ROOT / "defaults" / "config" / name).read_bytes() == result.stdout


def test_audit_refuses_to_read_user_roots(
    audit_repo: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    protected = {"config", "data", "research-inbox"}
    original_read_bytes = Path.read_bytes
    original_read_text = Path.read_text

    def guard_bytes(path: Path) -> bytes:
        if path.is_relative_to(audit_repo) and path.relative_to(audit_repo).parts[0] in protected:
            raise AssertionError(f"protected root opened: {path}")
        return original_read_bytes(path)

    def guard_text(
        path: Path, encoding: str | None = None, errors: str | None = None
    ) -> str:
        if path.is_relative_to(audit_repo) and path.relative_to(audit_repo).parts[0] in protected:
            raise AssertionError(f"protected root opened: {path}")
        return original_read_text(path, encoding=encoding, errors=errors)

    monkeypatch.setattr(Path, "read_bytes", guard_bytes)
    monkeypatch.setattr(Path, "read_text", guard_text)

    issues = _audit(audit_repo)

    assert issues == ["Local config status is release-forbidden: config/"]
    assert all("private-config" not in issue for issue in issues)


def test_audit_rejects_untracked_runtime_canary(audit_repo: Path) -> None:
    (audit_repo / "features" / "runtime-canary.txt").write_text("canary", encoding="utf-8")

    issues = _audit(audit_repo)

    assert any("runtime-canary.txt" in issue for issue in issues)


def test_audit_rejects_dirty_config_from_status_without_opening_it(audit_repo: Path) -> None:
    tracked = audit_repo / "config" / "tracked.json"
    tracked.write_text("base", encoding="utf-8")
    assert _git(audit_repo, "add", "-f", "config/tracked.json").returncode == 0
    assert _git(audit_repo, "commit", "-m", "tracked config fixture").returncode == 0
    tracked.write_text("dirty-private-value", encoding="utf-8")

    issues = _audit(audit_repo)

    assert any("config/tracked.json" in issue for issue in issues)


def test_manifest_keeps_both_config_roots_forbidden_from_the_same_package() -> None:
    manifest = json.loads((ROOT / "release-manifest.json").read_text(encoding="utf-8"))

    assert "defaults" in manifest["runtimeDirectories"]
    assert "config" not in manifest["runtimeDirectories"]
    assert "config" in manifest["forbiddenPaths"]
