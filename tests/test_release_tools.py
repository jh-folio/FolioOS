import json
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import verify_release as verifier  # noqa: E402


def run_package(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, "scripts/package_release.py", *args],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )


def run_verifier(release_dir: Path, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, "scripts/verify_release.py", "--release-dir", str(release_dir), *args],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )


def load_manifest() -> dict:
    return json.loads((ROOT / "release-manifest.json").read_text(encoding="utf-8"))


def make_minimal_package(tmp_path: Path) -> Path:
    manifest = load_manifest()
    package = tmp_path / "FolioOS-test"
    package.mkdir()
    shutil.copy2(ROOT / "release-manifest.json", package / "release-manifest.json")
    for rel in manifest["runtimeFiles"]:
        path = package / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("placeholder\n", encoding="utf-8")
    for rel in manifest["runtimeDirectories"]:
        (package / rel).mkdir(parents=True, exist_ok=True)
    for rel in manifest["emptyDirectories"]:
        (package / rel).mkdir(parents=True, exist_ok=True)
    return package


def test_manifest_lists_only_relative_runtime_paths() -> None:
    manifest = load_manifest()
    for section in ("runtimeFiles", "runtimeDirectories", "emptyDirectories"):
        for value in manifest[section]:
            path = Path(value)
            assert not path.is_absolute()
            assert ".." not in path.parts


def test_manifest_includes_cross_platform_launchers() -> None:
    manifest = load_manifest()
    assert "start.ps1" in manifest["runtimeFiles"]
    assert "start.sh" in manifest["runtimeFiles"]


def test_package_dry_run_requires_a_safe_version() -> None:
    result = run_package("--version", "../unsafe", "--dry-run")
    assert result.returncode != 0


def test_verifier_rejects_a_forbidden_env_file(tmp_path: Path) -> None:
    package = make_minimal_package(tmp_path)
    (package / ".env").write_text("not-a-real-secret", encoding="utf-8")
    result = run_verifier(package, "--skip-gitleaks")
    assert result.returncode != 0
    assert ".env" in result.stderr


def test_gitleaks_scan_uses_utf8_output_decoding(monkeypatch, tmp_path: Path) -> None:
    calls: dict[str, object] = {}

    monkeypatch.setattr(verifier.shutil, "which", lambda name: "gitleaks")

    def fake_run(args, **kwargs):
        calls.update(kwargs)
        return subprocess.CompletedProcess(args=args, returncode=0, stdout="✓", stderr="")

    monkeypatch.setattr(verifier.subprocess, "run", fake_run)

    assert verifier.run_gitleaks_scan(tmp_path) == []
    assert calls["encoding"] == "utf-8"
    assert calls["errors"] == "replace"


def test_package_build_creates_verified_zip() -> None:
    version = "test-release-tools"
    package_dir = ROOT / "dist" / f"FolioOS-{version}"
    package_zip = package_dir.with_suffix(".zip")
    shutil.rmtree(package_dir, ignore_errors=True)
    package_zip.unlink(missing_ok=True)

    result = run_package("--version", version, "--force", "--skip-gitleaks")
    try:
        assert result.returncode == 0, result.stderr
        assert (package_dir / "release-manifest.json").is_file()
        assert package_zip.is_file()
        with zipfile.ZipFile(package_zip) as archive:
            assert "FolioOS-test-release-tools/release-manifest.json" in archive.namelist()
    finally:
        shutil.rmtree(package_dir, ignore_errors=True)
        package_zip.unlink(missing_ok=True)


def test_package_build_preserves_dotted_version_in_zip_name() -> None:
    version = "v0.1.1-smoke"
    package_dir = ROOT / "dist" / f"FolioOS-{version}"
    package_zip = ROOT / "dist" / f"FolioOS-{version}.zip"
    wrong_zip = ROOT / "dist" / "FolioOS-v0.1.zip"
    shutil.rmtree(package_dir, ignore_errors=True)
    package_zip.unlink(missing_ok=True)
    wrong_zip.unlink(missing_ok=True)

    result = run_package("--version", version, "--force", "--skip-gitleaks")
    try:
        assert result.returncode == 0, result.stderr
        assert package_zip.is_file()
        assert not wrong_zip.exists()
        with zipfile.ZipFile(package_zip) as archive:
            assert f"FolioOS-{version}/release-manifest.json" in archive.namelist()
    finally:
        shutil.rmtree(package_dir, ignore_errors=True)
        package_zip.unlink(missing_ok=True)
        wrong_zip.unlink(missing_ok=True)
