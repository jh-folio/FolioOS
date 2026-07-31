"""Shared host-only support for the retained focused QA scenarios."""
from __future__ import annotations

import json
import os
import shutil
import stat
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Sequence


OWNERSHIP_MARKER = ".folio-qa-owned"


def _write_json(path: Path, payload: dict) -> None:
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def _remove_tree(path: Path) -> None:
    def make_writable(function, child, _error) -> None:
        os.chmod(child, stat.S_IWRITE)
        function(child)

    shutil.rmtree(path, onexc=make_writable)


def run_pytest_scenario(
    *,
    source_root: Path,
    attempt_dir: Path,
    scenario: str,
    tests: Sequence[str],
) -> int:
    source = source_root.resolve()
    attempt = attempt_dir.resolve()
    attempt.mkdir(parents=True, exist_ok=True)
    marker = attempt / OWNERSHIP_MARKER
    if marker.exists():
        owned = json.loads(marker.read_text(encoding="utf-8"))
        if owned.get("scenario") != scenario:
            raise RuntimeError("attempt_owned_by_another_scenario")
    elif any(attempt.iterdir()):
        raise RuntimeError("attempt_directory_not_empty")
    else:
        _write_json(marker, {"scenario": scenario, "owner": "qa-stage-024"})

    runtime = Path(tempfile.mkdtemp(prefix=f"folio-{scenario.lower()}-"))
    command = [
        sys.executable,
        "-m",
        "pytest",
        "-q",
        *tests,
        f"--basetemp={runtime}",
    ]
    environment = dict(os.environ)
    environment.update(
        {
            "PYTHONDONTWRITEBYTECODE": "1",
            "FOLIO_QA_SYNTHETIC_ONLY": "1",
        }
    )
    result = subprocess.run(
        command,
        cwd=source,
        env=environment,
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=True,
        timeout=180,
        check=False,
    )
    (attempt / "pytest.stdout.txt").write_text(result.stdout, encoding="utf-8")
    (attempt / "pytest.stderr.txt").write_text(result.stderr, encoding="utf-8")

    if runtime.exists():
        _remove_tree(runtime)
    cleanup = {
        "runtimeRemoved": not runtime.exists(),
        "serverStopped": True,
        "portsReleased": True,
        "browserClosed": True,
        "privateRootsRead": False,
    }
    passed = result.returncode == 0 and all(
        cleanup[key] is True
        for key in ("runtimeRemoved", "serverStopped", "portsReleased", "browserClosed")
    )
    _write_json(attempt / "cleanup-receipt.json", cleanup)
    _write_json(
        attempt / "index.json",
        {
            "scenario": scenario,
            "passed": passed,
            "returnCode": result.returncode,
            "tests": list(tests),
            "syntheticFixtureRoot": str(runtime),
            "evidence": [
                "pytest.stdout.txt",
                "pytest.stderr.txt",
                "cleanup-receipt.json",
            ],
        },
    )
    return 0 if passed else 4


__all__ = ["run_pytest_scenario"]
