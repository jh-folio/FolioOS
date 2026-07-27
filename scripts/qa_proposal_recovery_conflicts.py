from __future__ import annotations

import argparse
import http.client
import json
import subprocess
import sys
import urllib.error
from pathlib import Path
from collections.abc import Callable
from typing import IO

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features.agent_mode import chat
from features.common.canonical_identity import ReportKind
from features.common.canonical_json import JsonValue
from features.common.canonical_reports import WriteKind, commit_sync, prepare
from qa_dev_surface_support import QaFailure, free_port, remove_tree, request_json, require, stop_server
from qa_proposal_writeback import (
    ServerSpec,
    configure_chat,
    create_proposal,
    port_released,
    seed_briefing,
    start,
    terminal_bodies_absent,
    wait_server,
)


class InjectedCrash(Exception):
    pass


def write_json(path: Path, payload: JsonValue) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def crash_at(target: str) -> Callable[[str], None]:
    def hook(phase: str) -> None:
        if phase == target:
            raise InjectedCrash

    return hook


def advance(path: Path, operation_id: str) -> None:
    current = json.loads(path.read_text(encoding="utf-8"))
    commit_sync(prepare(
        report_kind=ReportKind.BRIEFING,
        exact_path=path,
        write_kind=WriteKind.CANONICAL,
        candidate={**current, "markdown": str(current["markdown"]) + "\n\nexternal"},
        operation_id=operation_id,
    ))


def seed_interrupted(runtime: Path) -> tuple[dict[str, str], Path, bytes]:
    stale_path = seed_briefing(runtime, "2026-07-20")
    stale_id = create_proposal("briefing", "2026-07-20", "us", stale_path, "stale")
    chat.PROPOSAL_PHASE_HOOK = crash_at("prepared")
    try:
        chat.apply_proposal(stale_id)
    except InjectedCrash:
        advance(stale_path, "qa_external_stale")

    conflict_path = seed_briefing(runtime, "2026-07-21")
    conflict_id = create_proposal("briefing", "2026-07-21", "us", conflict_path, "conflict")
    chat.PROPOSAL_PHASE_HOOK = crash_at("report_written")
    try:
        chat.apply_proposal(conflict_id)
    except InjectedCrash:
        advance(conflict_path, "qa_external_conflict")

    healthy_path = seed_briefing(runtime, "2026-07-22")
    healthy_id = create_proposal("briefing", "2026-07-22", "us", healthy_path, "healthy")
    chat.PROPOSAL_PHASE_HOOK = crash_at("prepared")
    interrupted = False
    try:
        chat.apply_proposal(healthy_id)
    except InjectedCrash:
        interrupted = True
    require(interrupted, "healthy_prepared_interruption")
    chat.PROPOSAL_PHASE_HOOK = lambda _phase: None

    unrelated_path = seed_briefing(runtime, "2026-07-23")
    unrelated_bytes = unrelated_path.read_bytes()
    return {"stale": stale_id, "conflict": conflict_id, "healthy": healthy_id}, unrelated_path, unrelated_bytes


def read_projection(base_url: str, proposal_id: str) -> dict[str, JsonValue]:
    response = request_json(base_url, f"/api/agent/proposals/{proposal_id}", "GET")
    require(response.status == 200, f"projection_status_{proposal_id}")
    require(terminal_bodies_absent(response.payload), f"terminal_body_{proposal_id}")
    return response.payload


def malformed_statuses(base_url: str) -> list[dict[str, JsonValue]]:
    results: list[dict[str, JsonValue]] = []
    for encoded in ("not-hex", "..%5Coutside", "C:%5Ctemp%5Cproposal"):
        response = request_json(base_url, f"/api/agent/proposals/{encoded}", "GET")
        detail = response.payload.get("detail")
        code = detail.get("code") if isinstance(detail, dict) else None
        results.append({"input": encoded, "status": response.status, "code": code})
    return results


def observe_startup(
    spec: ServerSpec,
    output: IO[str],
    proposal_ids: dict[str, str],
) -> tuple[subprocess.Popen[str], dict[str, JsonValue]]:
    process = start(spec, output)
    base_url = f"http://127.0.0.1:{spec.port}"
    wait_server(process, base_url)
    projections = {name: read_projection(base_url, proposal_id) for name, proposal_id in proposal_ids.items()}
    malformed = malformed_statuses(base_url)
    require(all(item["status"] == 422 and item["code"] == "proposal_id_invalid" for item in malformed), "malformed_contract")
    return process, {"ready": True, "projections": projections, "malformed": malformed}


def run(source_root: Path, attempt_dir: Path) -> int:
    attempt = attempt_dir.resolve()
    attempt.mkdir(parents=True, exist_ok=True)
    runtime = attempt / ".runtime"
    if runtime.exists():
        raise QaFailure("runtime_already_exists")
    runtime.mkdir()
    for folder in ("briefings", "company-analysis", "topic-reports"):
        (runtime / folder).mkdir()
    configure_chat(runtime)
    proposal_ids, unrelated_path, unrelated_bytes = seed_interrupted(runtime)
    port = free_port()
    spec = ServerSpec(source_root.resolve(), runtime, port)
    process: subprocess.Popen[str] | None = None
    stop_codes: list[int] = []
    observations: list[dict[str, JsonValue]] = []
    failure = ""
    server_log = attempt / "restart-server.log"
    try:
        with server_log.open("a", encoding="utf-8") as output:
            process, first = observe_startup(spec, output, proposal_ids)
            observations.append(first)
            stop_codes.append(stop_server(process))
            process = None
            require(not list((runtime / "agent-proposals").glob("*.apply.json")), "first_journal_cleanup")

            process, second = observe_startup(spec, output, proposal_ids)
            observations.append(second)
            stop_codes.append(stop_server(process))
            process = None
            require(not list((runtime / "agent-proposals").glob("*.apply.json")), "second_journal_cleanup")
            require(unrelated_path.read_bytes() == unrelated_bytes, "unrelated_report_changed")

        statuses = [
            {name: projection["status"] for name, projection in observation["projections"].items()}
            for observation in observations
        ]
        require(statuses == [
            {"stale": "stale", "conflict": "conflict", "healthy": "applied"},
            {"stale": "stale", "conflict": "conflict", "healthy": "applied"},
        ], "restart_statuses")
    except (
        QaFailure,
        OSError,
        urllib.error.URLError,
        http.client.RemoteDisconnected,
        subprocess.TimeoutExpired,
        json.JSONDecodeError,
    ) as error:
        failure = str(error)
    finally:
        if process is not None:
            stop_codes.append(stop_server(process))
            process = None
        port_free = port_released(port)
        journal_count = len(list((runtime / "agent-proposals").glob("*.apply.json"))) if runtime.exists() else 0
        if runtime.exists():
            remove_tree(runtime)
        cleanup = {
            "serverStopped": process is None,
            "portReleased": port_free,
            "runtimeRemoved": not runtime.exists(),
            "journalCountBeforeCleanup": journal_count,
            "stopCodes": stop_codes,
        }
        passed = not failure and len(observations) == 2 and all(cleanup[key] is True for key in ("serverStopped", "portReleased", "runtimeRemoved"))
        write_json(attempt / "restart-conflict.json", {
            "passed": passed,
            "failure": failure or None,
            "startups": observations,
            "cleanup": cleanup,
        })
        write_json(attempt / "cleanup-receipt.json", cleanup)
    return 0 if passed else 4


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", type=Path, required=True)
    parser.add_argument("--attempt-dir", type=Path, required=True)
    args = parser.parse_args()
    return run(args.source_root, args.attempt_dir)


if __name__ == "__main__":
    raise SystemExit(main())
