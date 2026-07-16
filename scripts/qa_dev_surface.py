from __future__ import annotations

import argparse
import json
import shutil
import sys
import urllib.error
from copy import deepcopy
from dataclasses import dataclass
from pathlib import Path
from typing import assert_never

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features.common.jcs import JsonValue, sha256_hex
from qa_dev_surface_support import (
    HttpResult,
    QaFailure,
    ServerConfig,
    execution,
    free_port,
    plan,
    post,
    require,
    serve,
    start_server,
    stop_server,
    wait_ready,
)
from qa_smart_collections import run as run_smart_collections


@dataclass(frozen=True, slots=True)
class RunConfig:
    scenario: str
    sourceRoot: Path
    attemptDir: Path


def write_json(path: Path, payload: JsonValue) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def run_scenario(config: RunConfig) -> int:
    if config.scenario == "smart-collections":
        return run_smart_collections(config.sourceRoot, config.attemptDir)
    attempt = config.attemptDir.resolve()
    attempt.mkdir(parents=True, exist_ok=True)
    runtime = attempt / ".runtime"
    if runtime.exists():
        raise QaFailure("runtime_already_exists")
    runtime.mkdir()
    clock_file = runtime / "clock.txt"
    clock_file.write_text("2026-07-16T00:00:00Z", encoding="utf-8")
    server_log = attempt / "server.log"
    epochs: list[dict[str, JsonValue]] = []
    checks: list[dict[str, JsonValue]] = []
    process = None
    passed = False
    failure = ""
    try:
        server = ServerConfig(
            sourceRoot=config.sourceRoot.resolve(),
            scriptPath=(config.sourceRoot / "scripts" / "qa_dev_surface.py").resolve(),
            dataDir=runtime,
            clockFile=clock_file,
            port=free_port(),
        )
        base_url = f"http://127.0.0.1:{server.port}"
        with server_log.open("a", encoding="utf-8") as output:
            process = start_server(server, output)
            wait_ready(process, base_url)
            first = plan(base_url, "PRIVATE_QUESTION_CANARY")
            require(first.status == 200, "plan_status")
            require(set(first.payload) == {"approvedRequest", "approval", "preview"}, "plan_shape")
            tampered = execution(first.payload)
            approved = tampered["approvedRequest"]
            require(isinstance(approved, dict), "approved_shape")
            approved["question"] = "REHASHED_TAMPER"
            approved["planHash"] = sha256_hex(
                {key: value for key, value in approved.items() if key != "planHash"}
            )
            tamper = post(base_url, "/api/topic-reports", tampered)
            require(tamper == HttpResult(409, {"error": "approval_mismatch"}), "tamper_contract")

            second = plan(base_url, "PRIVATE_DEGRADED_CANARY")
            require(second.status == 200, "degraded_plan_status")
            preview = second.payload.get("preview")
            require(isinstance(preview, dict), "preview_shape")
            zero = preview.get("zeroEvidence")
            require(isinstance(zero, dict) and zero.get("reasonCode") == "no_index", "zero_shape")
            approved_second = second.payload.get("approvedRequest")
            approval_second = second.payload.get("approval")
            require(isinstance(approved_second, dict), "approved_second_shape")
            require(isinstance(approval_second, dict), "approval_second_shape")
            old_execution = execution(second.payload)
            confirm = post(
                base_url,
                "/api/topic-reports/confirm-degraded",
                {
                    "approvedRequest": approved_second,
                    "approval": {
                        "id": approval_second.get("id"),
                        "token": approval_second.get("token"),
                    },
                    "reasonCode": zero.get("reasonCode"),
                    "resolutionFingerprint": zero.get("resolutionFingerprint"),
                    "confirmed": True,
                },
            )
            require(confirm.status == 200 and set(confirm.payload) == set(first.payload), "confirm_shape")
            replacement_execution = execution(confirm.payload)
            bad_token = deepcopy(replacement_execution)
            bad_approval = bad_token.get("approval")
            require(isinstance(bad_approval, dict), "bad_approval_shape")
            token = str(bad_approval.get("token"))
            bad_approval["token"] = ("A" if token[0] != "A" else "B") + token[1:]
            bad = post(base_url, "/api/topic-reports", bad_token)
            require(bad == HttpResult(409, {"error": "approval_mismatch"}), "bad_token_contract")

            expiring = plan(base_url, "PRIVATE_EXPIRY_CANARY")
            expiry_approval = expiring.payload.get("approval")
            require(isinstance(expiry_approval, dict), "expiry_approval_shape")
            clock_file.write_text(str(expiry_approval.get("expiresAt")), encoding="utf-8")
            expired = post(base_url, "/api/topic-reports", execution(expiring.payload))
            require(expired == HttpResult(409, {"error": "approval_expired"}), "expiry_equality")
            clock_file.write_text("2026-07-16T00:00:00Z", encoding="utf-8")
            epochs.append({"epoch": 1, "pid": process.pid, "exitCode": stop_server(process)})
            process = None

            process = start_server(server, output)
            wait_ready(process, base_url)
            old = post(base_url, "/api/topic-reports", old_execution)
            replacement = post(base_url, "/api/topic-reports", replacement_execution)
            require(old == HttpResult(409, {"error": "approval_superseded"}), "old_token_restart")
            require(
                replacement == HttpResult(501, {"error": "topic_execution_deferred"}),
                "replacement_restart",
            )
            epochs.append({"epoch": 2, "pid": process.pid, "exitCode": stop_server(process)})
            process = None

        ledger_text = (runtime / "topic-plan-approvals.json").read_text(encoding="utf-8")
        ledger = json.loads(ledger_text)
        approvals = ledger.get("approvals", [])
        statuses = sorted(str(item.get("status")) for item in approvals if isinstance(item, dict))
        require("PRIVATE_" not in ledger_text and "REHASHED_TAMPER" not in ledger_text, "ledger_private")
        require(not (runtime / "jobs.json").exists(), "unexpected_job_store")
        require(not (runtime / "topic-reports").exists(), "unexpected_report_store")
        checks = [
            {"step": "plan", "status": first.status, "keys": sorted(first.payload)},
            {"step": "tamper", "status": tamper.status, "error": tamper.payload.get("error")},
            {"step": "confirm", "status": confirm.status, "keys": sorted(confirm.payload)},
            {"step": "bad_token", "status": bad.status, "error": bad.payload.get("error")},
            {"step": "expiry_equality", "status": expired.status, "error": expired.payload.get("error")},
            {"step": "old_after_restart", "status": old.status, "error": old.payload.get("error")},
            {
                "step": "replacement_after_restart",
                "status": replacement.status,
                "error": replacement.payload.get("error"),
            },
        ]
        write_json(attempt / "http-summary.json", checks)
        write_json(
            attempt / "ledger-inventory.json",
            {
                "topLevelFields": sorted(ledger),
                "entryFields": sorted(approvals[0]) if approvals else [],
                "statuses": statuses,
                "privateCanariesAbsent": True,
                "plaintextTokensAbsent": True,
            },
        )
        write_json(attempt / "restart-receipt.json", epochs)
        passed = True
    except (QaFailure, OSError, urllib.error.URLError, json.JSONDecodeError) as error:
        failure = str(error)
    finally:
        if process is not None:
            stop_server(process)
        if runtime.exists():
            shutil.rmtree(runtime)
        write_json(
            attempt / "cleanup-receipt.json",
            {"serverStopped": True, "runtimeRemoved": not runtime.exists()},
        )
        write_json(
            attempt / "index.json",
            {
                "scenario": "approved-request",
                "passed": passed,
                "failure": failure or None,
                "checks": checks,
                "evidence": [
                    "http-summary.json",
                    "ledger-inventory.json",
                    "restart-receipt.json",
                    "server.log",
                    "cleanup-receipt.json",
                ],
            },
        )
    return 0 if passed else 4


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser(prog="qa_dev_surface.py")
    commands = result.add_subparsers(dest="command", required=True)
    run = commands.add_parser("run")
    run.add_argument("--scenario", choices=["approved-request", "smart-collections"], required=True)
    run.add_argument("--source-root", type=Path, required=True)
    run.add_argument("--attempt-dir", type=Path, required=True)
    server = commands.add_parser("serve")
    server.add_argument("--data-dir", type=Path, required=True)
    server.add_argument("--clock-file", type=Path, required=True)
    server.add_argument("--port", type=int, required=True)
    return result


def main() -> int:
    args = parser().parse_args()
    match args.command:
        case "run":
            return run_scenario(RunConfig(args.scenario, args.source_root, args.attempt_dir))
        case "serve":
            return serve(args.data_dir, args.clock_file, args.port)
        case unreachable:
            assert_never(unreachable)


if __name__ == "__main__":
    raise SystemExit(main())
