from __future__ import annotations

import json
import io
import base64
import shutil
import subprocess
import sys
import uuid
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import compare_lock_bytes as lock_compare  # noqa: E402
import install_gitleaks as gitleaks_installer  # noqa: E402
import normalize_lock_lf as lock_normalizer  # noqa: E402
import verify_release as verifier  # noqa: E402


UV_VERSION = "0.11.26"
UV_HASHES = {
    "d95567e9470dc48ff03265f420c3c6973f6437f18a79d5e00b6eb4b2d9379907",
    "4dcf4e0b5b5cbdc242dcb002f1f8d99e7cf8c043609869228a9ce15e095c0b18",
    "a58a06e5a4b0035538d3ab4160ad74c716076ea7148eb3317171c6276ac020b4",
    "7b6d078d2ce83897884c2330c0676f27be4bf3d223fb2a409460f579fb5f0a98",
}
GITLEAKS_VERSION = "8.30.1"
GITLEAKS_ASSETS = {
    "windows-x64": (
        "gitleaks_8.30.1_windows_x64.zip",
        "d29144deff3a68aa93ced33dddf84b7fdc26070add4aa0f4513094c8332afc4e",
    ),
    "linux-x64": (
        "gitleaks_8.30.1_linux_x64.tar.gz",
        "551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb",
    ),
    "darwin-x64": (
        "gitleaks_8.30.1_darwin_x64.tar.gz",
        "dfe101a4db2255fc85120ac7f3d25e4342c3c20cf749f2c20a18081af1952709",
    ),
    "darwin-arm64": (
        "gitleaks_8.30.1_darwin_arm64.tar.gz",
        "b40ab0ae55c505963e365f271a8d3846efbc170aa17f2607f13df610a9aeb6a5",
    ),
}


def test_bootstrap_hash_mismatch_contract() -> None:
    lock = (ROOT / "requirements-bootstrap.lock.txt").read_text(encoding="utf-8")
    assert f"uv=={UV_VERSION}" in lock
    assert {line.split("sha256:", 1)[1].rstrip(" \\") for line in lock.splitlines() if "sha256:" in line} == UV_HASHES


def test_lock_drift_contract_is_universal_and_reproducible(tmp_path: Path) -> None:
    universal_lock = ROOT / "requirements.lock.py312.txt"
    assert universal_lock.is_file()
    raw = universal_lock.read_bytes()
    assert b"\r\n" not in raw
    header = raw.splitlines()[:2]
    assert b"--universal --python-version 3.12 --resolution highest --generate-hashes" in header[1]
    assert b"--exclude-newer 2026-07-16T00:00:00Z" in header[1]

    first = tmp_path / "requirements.lock.py312.first.txt"
    second = tmp_path / "requirements.lock.py312.second.txt"
    first.write_bytes(raw.replace(b"requirements.lock.py312.txt", first.name.encode(), 1).replace(b"\n", b"\r\n"))
    second.write_bytes(raw.replace(b"requirements.lock.py312.txt", second.name.encode(), 1))
    lock_normalizer.normalize_lock(first)
    lock_normalizer.normalize_lock(second)
    assert lock_compare.compare_lock_bytes([universal_lock, first, second])
    second.write_bytes(second.read_bytes() + b"# drift\n")
    with pytest.raises(ValueError, match="lock drift"):
        lock_compare.compare_lock_bytes([universal_lock, second])


def _tool_versions() -> dict:
    return json.loads((ROOT / "scripts/tool-versions.json").read_text(encoding="utf-8"))


def test_gitleaks_version_mismatch_contract() -> None:
    metadata = _tool_versions()
    assert metadata["gitleaks"]["version"] == GITLEAKS_VERSION
    assert set(metadata["gitleaks"]["assets"]) == set(GITLEAKS_ASSETS)


def test_checksum_mismatch_contract() -> None:
    assets = _tool_versions()["gitleaks"]["assets"]
    for target, (filename, checksum) in GITLEAKS_ASSETS.items():
        asset = assets[target]
        assert asset["filename"] == filename
        assert asset["sha256"] == checksum
        assert asset["url"] == f"https://github.com/gitleaks/gitleaks/releases/download/v{GITLEAKS_VERSION}/{filename}"


def test_checksum_mismatch_is_rejected_before_extraction(monkeypatch, tmp_path: Path) -> None:
    class Response(io.BytesIO):
        def geturl(self) -> str:
            return "https://release-assets.githubusercontent.com/fixture"

        def __enter__(self):
            return self

        def __exit__(self, *args):
            self.close()

    monkeypatch.setattr(
        gitleaks_installer,
        "load_asset",
        lambda version: {"url": "https://github.com/fixture", "filename": "fixture.zip", "sha256": "0" * 64},
    )
    monkeypatch.setattr(gitleaks_installer.urllib.request, "urlopen", lambda *args, **kwargs: Response(b"bad archive"))
    with pytest.raises(RuntimeError, match="checksum mismatch"):
        gitleaks_installer.install_gitleaks(GITLEAKS_VERSION, tmp_path / "install")


def test_interrupted_install_cleans_partial_executable(monkeypatch, tmp_path: Path) -> None:
    source = tmp_path / "verified-source"
    source.write_bytes(b"verified")
    destination = tmp_path / "install" / "gitleaks"

    def interrupted_copy(source_path, target_path):
        Path(target_path).write_bytes(b"partial")
        raise OSError("interrupted")

    monkeypatch.setattr(gitleaks_installer.shutil, "copy2", interrupted_copy)
    with pytest.raises(OSError, match="interrupted"):
        gitleaks_installer.install_verified_executable(source, destination)
    assert not destination.exists()
    assert not (destination.parent / ".gitleaks.tmp").exists()


def _report_path(args: list[str]) -> Path:
    return Path(next(value.split("=", 1)[1] for value in args if value.startswith("--report-path=")))


def test_gitleaks_redaction_missing_contract(monkeypatch, tmp_path: Path) -> None:
    calls: list[list[str]] = []
    monkeypatch.setattr(verifier.shutil, "which", lambda name: "gitleaks")

    def fake_run(args, **kwargs):
        calls.append(args)
        if "version" in args:
            return subprocess.CompletedProcess(args=args, returncode=0, stdout=GITLEAKS_VERSION + "\n", stderr="")
        _report_path(args).write_text("[]\n", encoding="utf-8")
        return subprocess.CompletedProcess(args=args, returncode=0, stdout="", stderr="")

    monkeypatch.setattr(verifier.subprocess, "run", fake_run)
    assert verifier.run_gitleaks_scan(tmp_path) == []
    assert len(calls) == 2
    assert all("--redact=100" in args for args in calls)
    assert "--report-format=json" in calls[1]


def test_gitleaks_redaction_leak_contract(monkeypatch, tmp_path: Path) -> None:
    seeded_secret = "SYNTHETIC_" + "LEAK_" + "VALUE_1234567890"
    monkeypatch.setattr(verifier.shutil, "which", lambda name: "gitleaks")

    def fake_run(args, **kwargs):
        if "version" in args:
            return subprocess.CompletedProcess(args=args, returncode=0, stdout=GITLEAKS_VERSION + "\n", stderr="")
        _report_path(args).write_text(json.dumps([{"RuleID": "fixture", "Secret": seeded_secret}]), encoding="utf-8")
        return subprocess.CompletedProcess(args=args, returncode=1, stdout=seeded_secret, stderr="")

    monkeypatch.setattr(verifier.subprocess, "run", fake_run)
    issues = verifier.run_gitleaks_scan(tmp_path)
    assert issues == ["Gitleaks report failed redaction validation; release verification failed closed."]
    if any(seeded_secret in issue for issue in issues):
        raise AssertionError("scanner output was not sanitized before entering evidence")


def test_gitleaks_scanner_streams_are_never_captured(monkeypatch, tmp_path: Path) -> None:
    calls: list[dict[str, object]] = []
    monkeypatch.setattr(verifier.shutil, "which", lambda name: "gitleaks")

    def fake_run(args, **kwargs):
        if "version" in args:
            return subprocess.CompletedProcess(args=args, returncode=0, stdout=GITLEAKS_VERSION + "\n", stderr="")
        calls.append(kwargs)
        _report_path(args).write_text(
            json.dumps([{"RuleID": "fixture", "Secret": "REDACTED", "Match": "fixture=REDACTED"}]),
            encoding="utf-8",
        )
        return subprocess.CompletedProcess(args=args, returncode=1, stdout="raw-secret-stream", stderr="raw-secret-stream")

    monkeypatch.setattr(verifier.subprocess, "run", fake_run)
    assert verifier.run_gitleaks_scan(tmp_path) == ["Gitleaks found 1 potential secret(s) in the release artifact."]
    assert calls[0]["stdout"] is subprocess.DEVNULL
    assert calls[0]["stderr"] is subprocess.DEVNULL
    assert "capture_output" not in calls[0]


def test_stale_gitleaks_version_fails_closed(monkeypatch, tmp_path: Path) -> None:
    monkeypatch.setattr(verifier.shutil, "which", lambda name: "gitleaks")
    monkeypatch.setattr(
        verifier.subprocess,
        "run",
        lambda args, **kwargs: subprocess.CompletedProcess(args=args, returncode=0, stdout="8.29.0\n", stderr=""),
    )
    assert verifier.run_gitleaks_scan(tmp_path) == ["Gitleaks 8.30.1 is required for release verification."]


def test_scanner_timeout_fails_closed_without_output(monkeypatch, tmp_path: Path) -> None:
    monkeypatch.setattr(verifier.shutil, "which", lambda name: "gitleaks")

    def fake_run(args, **kwargs):
        if "version" in args:
            return subprocess.CompletedProcess(args=args, returncode=0, stdout=GITLEAKS_VERSION + "\n", stderr="")
        raise subprocess.TimeoutExpired(args, kwargs["timeout"], output="private", stderr="private")

    monkeypatch.setattr(verifier.subprocess, "run", fake_run)
    issues = verifier.run_gitleaks_scan(tmp_path)
    assert issues == ["Gitleaks artifact scan timed out; release verification failed closed."]
    assert all("private" not in issue for issue in issues)


def test_misleading_zero_without_report_fails_closed(monkeypatch, tmp_path: Path) -> None:
    monkeypatch.setattr(verifier.shutil, "which", lambda name: "gitleaks")

    def fake_run(args, **kwargs):
        stdout = GITLEAKS_VERSION + "\n" if "version" in args else ""
        return subprocess.CompletedProcess(args=args, returncode=0, stdout=stdout, stderr="")

    monkeypatch.setattr(verifier.subprocess, "run", fake_run)
    issues = verifier.run_gitleaks_scan(tmp_path)
    assert issues == ["Gitleaks did not produce a valid sanitized JSON report; release verification failed closed."]


@pytest.mark.skipif(shutil.which("gitleaks") is None, reason="Gitleaks is not installed")
def test_real_disposable_git_tree_artifact_fixture_is_fully_redacted(tmp_path: Path) -> None:
    secret = "SYNTHETIC-SECRET-" + uuid.uuid4().hex.upper()
    config = tmp_path / ".gitleaks.toml"
    config.write_text(
        "[[rules]]\n"
        'id = "synthetic-fixture"\n'
        'description = "Synthetic fixture token"\n'
        "regex = '''SYNTHETIC-SECRET-[A-F0-9]{32}'''\n"
        "secretGroup = 0\n",
        encoding="utf-8",
    )
    repository = tmp_path / "repository"
    source_tree = tmp_path / "source-tree"
    artifact_tree = tmp_path / "extracted-artifact"
    for root in (repository, source_tree, artifact_tree):
        root.mkdir()
        (root / "fixture.txt").write_text(f"fixture={secret}\n", encoding="utf-8")
    for args in (
        ["init", "-q"],
        ["config", "user.email", "fixture@example.invalid"],
        ["config", "user.name", "Synthetic Fixture"],
        ["add", "fixture.txt"],
        ["commit", "-q", "-m", "fixture"],
    ):
        assert subprocess.run(["git", "-C", str(repository), *args], capture_output=True, check=False).returncode == 0

    invocations = [
        ("git", repository),
        ("dir", source_tree),
        ("dir", artifact_tree),
    ]
    captured: list[bytes] = []
    actionable = 0
    for index, (mode, target) in enumerate(invocations):
        report = tmp_path / f"report-{index}.json"
        command = [
            shutil.which("gitleaks") or "gitleaks",
            mode,
            "--redact=100",
            f"--config={config}",
            "--report-format=json",
            f"--report-path={report}",
            str(target),
        ]
        result = subprocess.run(command, capture_output=True, check=False)
        assert result.returncode == 1
        report_bytes = report.read_bytes()
        captured.extend((result.stdout, result.stderr, report_bytes))
        findings = json.loads(report_bytes)
        actionable += len(findings)
        if not findings or not findings[0].get("RuleID"):
            raise AssertionError("redacted finding metadata was not actionable")
        if not verifier._gitleaks_report_is_redacted(findings):
            raise AssertionError("real Gitleaks report did not satisfy structural redaction validation")

    needles = (
        secret.encode(),
        secret.encode("utf-16-le"),
        secret.encode("utf-16-be"),
        base64.b64encode(secret.encode()),
        secret.encode().hex().encode(),
        secret.encode().hex().upper().encode(),
    )
    if any(needle in content for needle in needles for content in captured):
        raise AssertionError("synthetic fixture bytes leaked from a redacted scanner invocation")
    assert actionable == 3
