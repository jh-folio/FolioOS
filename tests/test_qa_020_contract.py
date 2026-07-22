from __future__ import annotations

import importlib.util
import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]
QA_020 = ROOT / "scripts" / "qa_020.py"
SUPERVISOR = ROOT / "scripts" / "qa_server_supervisor.py"
FAULT_PROXY = ROOT / "scripts" / "qa_fault_proxy.py"

PRE_EXPOSURE = [
    "DR-H1",
    "PLAN-F1",
    "GEN-F1",
    "GEN-F2",
    "RP-H1",
    "AG-H1",
    "WB-H1",
    "WB-F1",
    "WL-H1",
    "COL-H1",
    "COL-F1",
    "MS-H1",
    "CTX-F1",
    "REL-H1",
]
POST_EXPOSURE = ["DOC-H1"]
FULL = [*PRE_EXPOSURE, *POST_EXPOSURE]


def _run(script: Path, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(script), *args],
        cwd=ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=True,
        timeout=10,
        check=False,
    )


def _load_qa_020():
    assert QA_020.is_file(), "TODO14_MISSING_QA_020"
    spec = importlib.util.spec_from_file_location("qa_020_contract_target", QA_020)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _load_script(path: Path, name: str):
    assert path.is_file()
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _manifest(tmp_path: Path) -> tuple[Path, dict]:
    run_root = tmp_path / "attempt" / "task-16"
    run_root.mkdir(parents=True)
    marker = run_root / ".folio-qa-owned"
    marker.write_text(
        json.dumps({"attemptId": "attempt-contract", "state": "prepared"}),
        encoding="utf-8",
    )
    def server(number: int) -> dict:
        started = f"2099-07-22T00:00:0{number}Z"
        body = {
            "supervisorPid": 111,
            "supervisorCreateTime": "supervisor-create",
            "childPid": 200 + number,
            "childCreateTime": f"child-create-{number}",
            "restartCount": number,
            "port": 49152,
            "startedAt": started,
            "commandHash": "e" * 64,
            "state": "ready",
        }
        body["epochId"] = hashlib.sha256(
            "\0".join(
                map(
                    str,
                    (
                        body["supervisorPid"],
                        body["supervisorCreateTime"],
                        body["childPid"],
                        body["childCreateTime"],
                        body["restartCount"],
                        body["startedAt"],
                    ),
                )
            ).encode("utf-8")
        ).hexdigest()
        return body

    epoch_history = [server(number) for number in range(4)]
    health_expected = {
        "status": "ok",
        "version": "0.2.0",
        "commit": "b" * 40,
        "workspaceIdentity": "c" * 64,
    }
    restart_receipts = []
    for number in range(1, 4):
        old, new = epoch_history[number - 1], epoch_history[number]
        observed = {**health_expected, "pid": new["childPid"]}
        restart_receipts.append(
            {
                "oldEpochId": old["epochId"],
                "newEpochId": new["epochId"],
                "oldChild": {"pid": old["childPid"], "createTime": old["childCreateTime"]},
                "newChild": {"pid": new["childPid"], "createTime": new["childCreateTime"]},
                "triggeredAt": f"2099-07-22T00:00:0{number * 2 - 1}Z",
                "readyAt": f"2099-07-22T00:00:0{number * 2}Z",
                "healthHash": hashlib.sha256(
                    json.dumps(observed, sort_keys=True, separators=(",", ":")).encode("utf-8")
                ).hexdigest(),
            }
        )

    payload = {
        "schemaVersion": 1,
        "attemptId": "attempt-contract",
        "createdAt": "2099-07-22T00:00:00Z",
        "routeExposure": "hidden",
        "runRoot": str(run_root.resolve()),
        "ownershipMarker": str(marker.resolve()),
        "artifact": {
            "path": str((tmp_path / "FolioOS-v0.2.0.zip").resolve()),
            "sha256": "a" * 64,
        },
        "build": {"version": "0.2.0", "commit": "b" * 40},
        "extractRoot": str((run_root / "packages" / "preExposure").resolve()),
        "workspaceIdentity": "c" * 64,
        "port": 49152,
        "baseUrl": "http://127.0.0.1:49152",
        "healthExpected": health_expected,
        "scenarioSet": "preExposure",
        "scenarioSets": {
            "preExposure": PRE_EXPOSURE,
            "postExposure": POST_EXPOSURE,
            "full": FULL,
        },
        "selectedScenarioIds": PRE_EXPOSURE,
        "restartScenarios": ["DR-H1", "WB-H1", "WL-H1"],
        "phases": [
            *[
                {
                    "phaseId": f"{scenario}:pre",
                    "scenario": scenario,
                    "action": "pre_restart",
                    "expectedEpochId": epoch_history[0]["epochId"],
                }
                for scenario in PRE_EXPOSURE
            ],
            *[
                {
                    "phaseId": f"{scenario}:post",
                    "scenario": scenario,
                    "action": "post_restart",
                    "expectedEpochId": epoch_history[index + 1]["epochId"],
                }
                for index, scenario in enumerate(["DR-H1", "WB-H1", "WL-H1"])
            ],
        ],
        "fixtures": {
            "reportId": "2026-07-22:qa-contract:fixture",
            "externalCanary": "EXTERNAL_EVIDENCE_CANARY",
            "hypothesisCanary": "HYPOTHESIS_ONLY_CANARY",
            "marketCanary": "MARKET_CONTEXT_CANARY",
            "privateCanaries": ["PROMPT_INJECTION_CANARY", "PRIVATE_CONTEXT_CANARY"],
        },
        "urls": {
            "health": "http://127.0.0.1:49152/api/health",
            "deepResearch": "http://127.0.0.1:49152/#/deep-research",
            "report": "http://127.0.0.1:49152/#/deep-research/2026-07-22%3Aqa-contract%3Afixture",
        },
        "selectors": {
            "question": "[data-qa=dr-question]",
            "preview": "[data-qa=dr-preview]",
            "plan": "[data-qa=dr-plan]",
            "continue": "[data-qa=dr-continue]",
            "report": "[data-qa=dr-report]",
        },
        "requiredEvidencePaths": [
            path
            for scenario in PRE_EXPOSURE
            for path in (
                [
                    f"{scenario}/{viewport}/{name}"
                    for viewport in ("1440", "768", "390")
                    for name in (
                        "screenshot.png", "screenshot.json", "console.json", "network.json",
                        "dom.json", "api-before.json", "api-after.json", "result.json",
                    )
                ]
                if scenario in {"DR-H1", "RP-H1", "REL-H1"}
                else [f"{scenario}/result.json"]
            ) + ([f"{scenario}/post-restart-result.json"] if scenario in {"DR-H1", "WB-H1", "WL-H1"} else [])
        ],
        "epochHistory": epoch_history,
        "restartReceipts": restart_receipts,
    }
    path = run_root / "fixture-manifest.json"
    for relative in payload["requiredEvidencePaths"]:
        evidence_path = run_root / relative
        evidence_path.parent.mkdir(parents=True, exist_ok=True)
        parts = Path(relative).parts
        scenario = parts[0]
        viewport = parts[1] if len(parts) == 3 else None
        if evidence_path.suffix == ".png":
            evidence_path.write_bytes(b"contract-png")
            continue
        body = {
            "artifactSha256": "a" * 64,
            "buildCommit": "b" * 40,
            "capturedAt": "2099-07-22T00:00:00.500000Z",
            "baseUrl": "http://127.0.0.1:49152",
            "viewport": viewport,
            "scenario": scenario,
            "phaseId": f"{scenario}:pre",
            "serverEpochId": epoch_history[0]["epochId"],
            "childPid": epoch_history[0]["childPid"],
            "childCreateTime": epoch_history[0]["childCreateTime"],
            "restartCount": 0,
        }
        if evidence_path.name == "post-restart-result.json":
            restart_number = ["DR-H1", "WB-H1", "WL-H1"].index(scenario) + 1
            epoch = epoch_history[restart_number]
            body.update(
                {
                    "capturedAt": f"2099-07-22T00:00:0{restart_number * 2}.500000Z",
                    "phaseId": f"{scenario}:post",
                    "serverEpochId": epoch["epochId"],
                    "childPid": epoch["childPid"],
                    "childCreateTime": epoch["childCreateTime"],
                    "restartCount": restart_number,
                }
            )
        if evidence_path.name == "screenshot.json":
            body["pngSha256"] = hashlib.sha256(b"contract-png").hexdigest()
        if evidence_path.name in {"result.json", "post-restart-result.json"}:
            body.update(
                {
                    "passed": True,
                    "cancellation": "not_applicable",
                    "privateCanariesAbsent": True,
                }
            )
        evidence_path.write_text(json.dumps(body), encoding="utf-8")
    path.write_text(json.dumps(payload), encoding="utf-8")
    return path, payload


def _write_manifest(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload), encoding="utf-8")


def _mutate_bundle(path: Path, payload: dict, mutation: str) -> None:
    run_root = Path(payload["runRoot"])
    if mutation == "hidden_doc":
        payload["selectedScenarioIds"] = [*PRE_EXPOSURE, "DOC-H1"]
    elif mutation == "incomplete_set":
        payload["selectedScenarioIds"] = PRE_EXPOSURE[:-1]
    elif mutation == "stale_bundle":
        payload["createdAt"] = "2020-01-01T00:00:00Z"
    elif mutation == "copied_epoch":
        post_phase = next(phase for phase in payload["phases"] if phase["action"] == "post_restart")
        post_phase["expectedEpochId"] = payload["epochHistory"][0]["epochId"]
    elif mutation == "reordered_epoch":
        payload["restartReceipts"] = [
            {"number": 2, "oldEpochId": "epoch-2", "newEpochId": "epoch-3"},
            {"number": 1, "oldEpochId": "epoch-1", "newEpochId": "epoch-2"},
        ]
    elif mutation == "png_mismatch":
        png = run_root / "DR-H1" / "1440" / "screenshot.png"
        png.parent.mkdir(exist_ok=True)
        png.write_bytes(b"not-the-sidecar-hash")
        sidecar = png.with_suffix(".json")
        sidecar.write_text(
            json.dumps({"pngSha256": hashlib.sha256(b"other-bytes").hexdigest()}),
            encoding="utf-8",
        )
    elif mutation == "private_canary":
        result = run_root / "CTX-F1" / "result.json"
        result.write_text(result.read_text(encoding="utf-8") + "PRIVATE_CONTEXT_CANARY", encoding="utf-8")
    elif mutation == "cancellation":
        result = run_root / "AG-H1" / "result.json"
        body = json.loads(result.read_text(encoding="utf-8"))
        body.pop("cancellation")
        result.write_text(json.dumps(body), encoding="utf-8")
    elif mutation == "unowned_root":
        Path(payload["ownershipMarker"]).unlink()
    elif mutation == "wrong_health":
        payload["healthObserved"] = {
            **payload["healthExpected"],
            "pid": 4444,
            "commit": "d" * 40,
        }
    elif mutation == "extra_health":
        payload["healthObserved"] = {
            **payload["healthExpected"],
            "pid": payload["epochHistory"][-1]["childPid"],
            "misleading": "ok",
        }
    elif mutation == "missing_post_coverage":
        for relative in payload["requiredEvidencePaths"]:
            if relative.endswith(".json"):
                evidence = run_root / relative
                body = json.loads(evidence.read_text(encoding="utf-8"))
                body["phaseId"] = f"{body['scenario']}:pre"
                body["serverEpochId"] = payload["epochHistory"][0]["epochId"]
                body["childPid"] = payload["epochHistory"][0]["childPid"]
                body["childCreateTime"] = payload["epochHistory"][0]["childCreateTime"]
                body["restartCount"] = 0
                body["capturedAt"] = "2099-07-22T00:00:00.500000Z"
                evidence.write_text(json.dumps(body), encoding="utf-8")
    else:  # pragma: no cover - protects the fixture itself
        raise AssertionError(mutation)
    _write_manifest(path, payload)


def test_prepare_help_exposes_manifest_only_contract() -> None:
    result = _run(QA_020, "prepare", "--help")

    assert result.returncode == 0, "TODO14_PREPARE_HELP_MISSING\n" + result.stderr
    for flag in ("--artifact", "--attempt-dir", "--scenario-set", "--manifest-only"):
        assert flag in result.stdout


def test_lifecycle_help_exposes_fail_closed_commands() -> None:
    result = _run(QA_020, "--help")

    assert result.returncode == 0, "TODO14_LIFECYCLE_CLI_MISSING\n" + result.stderr
    for command in (
        "prepare",
        "start",
        "restart",
        "stop",
        "cleanup",
        "verify-evidence",
        "proxy-start",
        "proxy-stop",
    ):
        assert command in result.stdout


def test_exact_named_scenario_sets_are_public_contract() -> None:
    module = _load_qa_020()

    assert module.SCENARIO_SETS == {
        "preExposure": PRE_EXPOSURE,
        "postExposure": POST_EXPOSURE,
        "full": FULL,
    }


def test_workspace_identity_golden_vector_uses_normative_nul_formula(tmp_path: Path) -> None:
    module = _load_qa_020()
    extract_root = (tmp_path / "packages" / "preExposure" / "FolioOS").resolve()
    expected = hashlib.sha256(
        f"attempt-golden\0{'a' * 64}\0{extract_root}".encode("utf-8")
    ).hexdigest()

    assert module._workspace_identity("attempt-golden", "a" * 64, extract_root) == expected


def test_server_epoch_golden_vector_uses_process_identity_and_started_at() -> None:
    module = _load_script(SUPERVISOR, "qa_server_supervisor_golden")
    expected = hashlib.sha256(
        "\0".join(
            ["101", "create-supervisor", "202", "create-child", "3", "2026-07-22T00:00:00Z"]
        ).encode("utf-8")
    ).hexdigest()

    assert module.compute_epoch_id(
        101,
        "create-supervisor",
        202,
        "create-child",
        3,
        "2026-07-22T00:00:00Z",
    ) == expected


@pytest.mark.parametrize(
    ("mutation", "expected_exit", "error_code"),
    [
        ("hidden_doc", 4, "DOC_H1_HIDDEN_PRE_EXPOSURE"),
        ("incomplete_set", 4, "SELECTED_SCENARIO_SET_INCOMPLETE"),
        ("stale_bundle", 4, "STALE_BUNDLE"),
        ("copied_epoch", 4, "EVIDENCE_EPOCH_MISMATCH"),
        ("reordered_epoch", 4, "RESTART_RECEIPT_ORDER_INVALID"),
        ("png_mismatch", 4, "PNG_SHA256_MISMATCH"),
        ("private_canary", 4, "PRIVATE_CANARY_EXPOSED"),
        ("cancellation", 4, "CANCELLATION_CONTRACT_MISSING"),
        ("unowned_root", 2, "UNOWNED_RUN_ROOT"),
        ("wrong_health", 3, "HEALTH_IDENTITY_MISMATCH"),
        ("extra_health", 3, "HEALTH_IDENTITY_SHAPE_MISMATCH"),
        ("missing_post_coverage", 4, "EVIDENCE_PHASE_COVERAGE_MISSING"),
    ],
)
def test_verify_evidence_rejects_adversarial_bundle(
    tmp_path: Path, mutation: str, expected_exit: int, error_code: str
) -> None:
    manifest, payload = _manifest(tmp_path)
    try:
        _mutate_bundle(manifest, payload, mutation)
        result = _run(
            QA_020,
            "verify-evidence",
            "--manifest",
            str(manifest),
            "--scenario-set",
            "preExposure",
        )
    finally:
        shutil.rmtree(tmp_path / "attempt", ignore_errors=True)

    assert result.returncode == expected_exit, (
        f"TODO14_{error_code}: expected assertion exit {expected_exit}; "
        f"stdout={result.stdout!r} stderr={result.stderr!r}"
    )
    assert error_code in result.stderr


def test_supervisor_and_fault_proxy_are_host_only_cli_tools() -> None:
    for script, required in (
        (SUPERVISOR, ("--manifest", "--readiness-timeout")),
        (FAULT_PROXY, ("--manifest", "--fault")),
    ):
        result = _run(script, "--help")
        assert result.returncode == 0, f"TODO14_MISSING_HOST_TOOL:{script.name}\n{result.stderr}"
        assert all(flag in result.stdout for flag in required)

    release = json.loads((ROOT / "release-manifest.json").read_text(encoding="utf-8"))
    packaged = set(release["runtimeFiles"])
    assert not packaged.intersection(
        {"scripts/qa_020.py", "scripts/qa_server_supervisor.py", "scripts/qa_fault_proxy.py"}
    )
