from __future__ import annotations

import http.client
import json
import socket
import subprocess
import sys
import time
import urllib.error
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from pathlib import Path
from threading import Event
from typing import IO

from features.agent_mode import chat
from features.common.canonical_identity import ReportKind
from features.common.canonical_json import JsonValue
from features.common.canonical_reports import WriteKind, canonical_content_hash, commit_sync, prepare, storage_hash
from qa_dev_surface_support import QaFailure, free_port, remove_tree, request_json, require, stop_server


@dataclass(frozen=True, slots=True)
class ServerSpec:
    source_root: Path
    data_root: Path
    port: int


def write_json(path: Path, payload: JsonValue) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def configure_chat(data_root: Path) -> None:
    chat.DATA_DIR = data_root
    chat.PROPOSALS_DIR = data_root / "agent-proposals"
    chat.BRIEFINGS_DIR = data_root / "briefings"
    chat.ANALYSIS_DIR = data_root / "company-analysis"
    chat.TOPIC_DIR = data_root / "topic-reports"


def seed_briefing(root: Path, date: str) -> Path:
    path = root / "briefings" / f"{date}.us.json"
    write_json(path, {
        "date": date,
        "marketScope": "us",
        "markdown": "# Briefing\n\n## Evidence\n\n[source](https://example.com/source)",
        "sources": [{"url": "https://example.com/source"}],
        "personalOverlay": {"stale": False, "markdown": "private"},
    })
    return path


def seed_report(root: Path, kind: ReportKind, report_id: str) -> Path:
    folder = "company-analysis" if kind == ReportKind.COMPANY_ANALYSIS else "topic-reports"
    filename = f"{report_id}.json" if kind == ReportKind.COMPANY_ANALYSIS else f"2026-07-17_custom_{report_id}.json"
    path = root / folder / filename
    write_json(path, {
        "id": report_id,
        "markdown": "# Report\n\n## Evidence\n\n[source](https://example.com/source)",
        "sources": [{"url": "https://example.com/source"}],
        "personalOverlay": {"stale": False, "markdown": "private"},
    })
    return path


def create_proposal(kind: str, report_id: str, scope: str, path: Path, suffix: str) -> str:
    report = json.loads(path.read_text(encoding="utf-8"))
    current = str(report["markdown"])
    proposal = chat.create_revision_proposal(
        kind=kind,
        report_id=report_id,
        market_scope=scope,
        message=f"{suffix} 검증 문장을 추가",
        summary=f"{suffix} 추가",
        revised_markdown=current + f"\n\n{suffix}",
        current_markdown=current,
        adapter="qa",
        model="qa-model",
    )
    return str(proposal["id"])


def start(spec: ServerSpec, output: IO[str], fault_phase: str = "") -> subprocess.Popen[str]:
    command = [
        sys.executable,
        str(spec.source_root / "scripts" / "qa_proposal_writeback_server.py"),
        "--data-root",
        str(spec.data_root),
        "--port",
        str(spec.port),
    ]
    if fault_phase:
        command.extend(("--fault-phase", fault_phase))
    return subprocess.Popen(command, cwd=spec.source_root, stdout=output, stderr=subprocess.STDOUT, text=True)


def terminal_bodies_absent(payload: dict[str, JsonValue]) -> bool:
    fields = {"userRequest", "summary", "revisedMarkdown", "diff", "adapter", "model", "allowedSourceRefs"}
    return not fields.intersection(payload)


def wait_job(base_url: str, job_id: str) -> dict[str, JsonValue]:
    deadline = time.monotonic() + 10
    while time.monotonic() < deadline:
        result = request_json(base_url, f"/api/jobs/{job_id}", "GET")
        if result.payload.get("status") in {"done", "failed"}:
            return result.payload
        Event().wait(0.05)
    raise QaFailure("answer_job_timeout")


def wait_server(process: subprocess.Popen[str], base_url: str) -> None:
    deadline = time.monotonic() + 15
    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise QaFailure("server_exited_before_ready")
        try:
            if request_json(base_url, "/api/agent/proposals/000000000000", "GET").status == 404:
                return
        except urllib.error.URLError:
            Event().wait(0.05)
    raise QaFailure("server_ready_timeout")


def port_released(port: int) -> bool:
    with socket.socket() as probe:
        try:
            probe.bind(("127.0.0.1", port))
        except OSError:
            return False
    return True


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

    race_path = seed_briefing(runtime, "2026-07-17")
    restart_path = seed_briefing(runtime, "2026-07-18")
    company_path = seed_report(runtime, ReportKind.COMPANY_ANALYSIS, "company-qa")
    stale_path = seed_report(runtime, ReportKind.COMPANY_ANALYSIS, "company-stale")
    topic_path = seed_report(runtime, ReportKind.TOPIC_REPORT, "topic-alpha")
    neighbor_path = seed_report(runtime, ReportKind.TOPIC_REPORT, "topic-alpha-long")
    reject_path = seed_report(runtime, ReportKind.TOPIC_REPORT, "topic-reject")
    race_id = create_proposal("briefing", "2026-07-17", "us", race_path, "race")
    restart_id = create_proposal("briefing", "2026-07-18", "us", restart_path, "restart")
    company_id = create_proposal("company_analysis", "company-qa", "none", company_path, "company")
    stale_id = create_proposal("company_analysis", "company-stale", "none", stale_path, "stale")
    topic_id = create_proposal("topic_report", "topic-alpha", "none", topic_path, "topic")
    reject_id = create_proposal("topic_report", "topic-reject", "none", reject_path, "reject")
    stale_current = json.loads(stale_path.read_text(encoding="utf-8"))
    commit_sync(prepare(
        report_kind=ReportKind.COMPANY_ANALYSIS,
        exact_path=stale_path,
        write_kind=WriteKind.CANONICAL,
        candidate={**stale_current, "markdown": str(stale_current["markdown"]) + "\n\nexternal change"},
        operation_id="qa_external_change",
    ))

    port = free_port()
    spec = ServerSpec(source_root.resolve(), runtime, port)
    base_url = f"http://127.0.0.1:{port}"
    process: subprocess.Popen[str] | None = None
    stop_codes: list[int] = []
    result: dict[str, JsonValue] = {}
    failure = ""
    server_log = attempt / "server.log"
    try:
        with server_log.open("a", encoding="utf-8") as output:
            process = start(spec, output)
            wait_server(process, base_url)
            pending = request_json(base_url, f"/api/agent/proposals/{race_id}", "GET")
            require(pending.status == 200 and pending.payload.get("status") == "pending", "proposal_get_pending")
            with ThreadPoolExecutor(max_workers=2) as pool:
                race = list(pool.map(
                    lambda _: request_json(base_url, f"/api/agent/proposals/{race_id}", "POST", {"action": "approve"}),
                    range(2),
                ))
            require(all(item.status == 200 and item.payload.get("status") == "applied" for item in race), "race_http")
            company = request_json(base_url, f"/api/agent/proposals/{company_id}", "POST", {"action": "approve"})
            topic = request_json(base_url, f"/api/agent/proposals/{topic_id}", "POST", {"action": "approve"})
            rejected = request_json(base_url, f"/api/agent/proposals/{reject_id}", "POST", {"action": "reject"})
            stale = request_json(base_url, f"/api/agent/proposals/{stale_id}", "POST", {"action": "approve"})
            require(company.status == topic.status == rejected.status == 200, "adapter_http")
            require(stale.status == 409 and stale.payload.get("detail", {}).get("code") == "proposal_stale", "stale_http")
            answer_before = topic_path.read_bytes()
            answer = request_json(base_url, "/api/agent/chat", "POST", {
                "message": "이 보고서 핵심을 요약해줘",
                "context": {"surface": "topic_reader", "reportKind": "topic_report", "reportId": "topic-alpha"},
                "options": {"effort": "low"},
            })
            require(answer.status == 200 and isinstance(answer.payload.get("id"), str), "answer_submit")
            answer_job = wait_job(base_url, str(answer.payload["id"]))
            require(answer_job.get("status") == "done" and topic_path.read_bytes() == answer_before, "answer_mutation")
            stop_codes.append(stop_server(process))
            process = None

            process = start(spec, output, "report_written")
            wait_server(process, base_url)
            crash_observed = False
            try:
                request_json(base_url, f"/api/agent/proposals/{restart_id}", "POST", {"action": "approve"})
            except (urllib.error.URLError, http.client.RemoteDisconnected, ConnectionResetError):
                crash_observed = True
            process.wait(timeout=10)
            stop_codes.append(int(process.returncode or 0))
            require(crash_observed and process.returncode == 91, "fault_exit")
            process = None

            process = start(spec, output)
            wait_server(process, base_url)
            recovered = request_json(base_url, f"/api/agent/proposals/{restart_id}", "GET")
            require(recovered.status == 200 and recovered.payload.get("status") == "applied", "restart_recovery")
            terminal_payloads = [
                request_json(base_url, f"/api/agent/proposals/{proposal_id}", "GET").payload
                for proposal_id in (race_id, company_id, topic_id, reject_id, stale_id, restart_id)
            ]
            stop_codes.append(stop_server(process))
            process = None

        race_saved = json.loads(race_path.read_text(encoding="utf-8"))
        company_saved = json.loads(company_path.read_text(encoding="utf-8"))
        topic_saved = json.loads(topic_path.read_text(encoding="utf-8"))
        neighbor_saved = json.loads(neighbor_path.read_text(encoding="utf-8"))
        overlay_variant = {**race_saved, "personalOverlay": {"stale": False, "markdown": "changed privately"}}
        result = {
            "oneWriter": len(race_saved.get("agentRevisions", [])) == 1,
            "exactIds": "topic" in topic_saved["markdown"] and "topic" not in neighbor_saved["markdown"],
            "canonicalHashRules": (
                canonical_content_hash(overlay_variant) == canonical_content_hash(race_saved)
                and storage_hash(overlay_variant) != storage_hash(race_saved)
            ),
            "terminalBodiesStripped": all(terminal_bodies_absent(item) for item in terminal_payloads),
            "restartRecovered": json.loads(restart_path.read_text(encoding="utf-8"))["canonicalRevision"]["number"] == 2,
            "staleRejected": terminal_payloads[4].get("status") == "stale",
            "threeAdapters": all(report["canonicalRevision"]["number"] == 2 for report in (race_saved, company_saved, topic_saved)),
            "answerOnlyNoMutation": topic_path.read_bytes() == answer_before,
            "serverStopped": len(stop_codes) == 3 and all(code in {0, 91, -15, 1} for code in stop_codes),
            "cleanup": False,
        }
        require(all(value is True for key, value in result.items() if key != "cleanup"), "result_gate")
    except (QaFailure, OSError, urllib.error.URLError, http.client.RemoteDisconnected, subprocess.TimeoutExpired, json.JSONDecodeError) as error:
        failure = str(error)
    finally:
        if process is not None:
            stop_codes.append(stop_server(process))
        if runtime.exists():
            remove_tree(runtime)
        result["serverStopped"] = result.get("serverStopped", True) and process is None and port_released(port)
        result["cleanup"] = not runtime.exists()
        write_json(attempt / "result.json", result)
        write_json(attempt / "cleanup-receipt.json", {
            "serverStopped": result["serverStopped"],
            "runtimeRemoved": result["cleanup"],
            "stopCodes": stop_codes,
        })
        manifest = {**result, "passed": not failure and all(value is True for value in result.values()), "failure": failure or None}
        write_json(attempt / "manifest.json", manifest)
    return 0 if not failure and all(value is True for value in result.values()) else 4


__all__ = ["run"]
