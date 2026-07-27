from __future__ import annotations

import json
import urllib.error
from pathlib import Path

from features.common.jcs import JsonValue
from qa_smart_collection_fixtures import definition, seed_count, seed_explicit_index, seed_unindexed_rss
from qa_dev_surface_support import (
    QaFailure,
    ServerConfig,
    free_port,
    request_json,
    remove_tree,
    require,
    start_server,
    stop_server,
    wait_ready,
)


def write_json(path: Path, payload: JsonValue) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def run(source_root: Path, attempt_dir: Path) -> int:
    attempt = attempt_dir.resolve()
    attempt.mkdir(parents=True, exist_ok=True)
    runtime = attempt / ".runtime"
    runtime.mkdir()
    clock_file = runtime / "clock.txt"
    clock_file.write_text("2026-07-16T00:00:00Z", encoding="utf-8")
    db = runtime / "research-index.sqlite3"
    seed_count(db, 241)
    server = ServerConfig(
        sourceRoot=source_root.resolve(),
        scriptPath=(source_root / "scripts" / "qa_dev_surface.py").resolve(),
        dataDir=runtime,
        clockFile=clock_file,
        port=free_port(),
    )
    base_url = f"http://127.0.0.1:{server.port}"
    log_path = attempt / "server.log"
    process = None
    epochs: list[JsonValue] = []
    checks: list[JsonValue] = []
    passed = False
    failure = ""
    try:
        with log_path.open("a", encoding="utf-8") as output:
            process = start_server(server, output)
            wait_ready(process, base_url)
            created = request_json(base_url, "/api/smart-collections", "POST", definition())
            require(created.status == 201, "create_status")
            collection = created.payload["collection"]
            require(isinstance(collection, dict), "create_shape")
            collection_id = str(collection["id"])
            fetched = request_json(base_url, f"/api/smart-collections/{collection_id}", "GET")
            require(fetched.status == 200, "get_status")
            preview = request_json(
                base_url,
                f"/api/smart-collections/{collection_id}/preview",
                "POST",
                {"expectedRevision": 1, "limit": 50},
            )
            require(preview.status == 200 and preview.payload["total"] == 241, "preview_total")
            stale = request_json(
                base_url,
                f"/api/smart-collections/{collection_id}",
                "PUT",
                {**definition(), "expectedRevision": 2},
            )
            require(stale.status == 409 and stale.payload["error"] == "revision_conflict", "stale")
            updated = request_json(
                base_url,
                f"/api/smart-collections/{collection_id}",
                "PUT",
                {**definition(), "name": "US evidence updated", "expectedRevision": 1},
            )
            require(updated.status == 200, "update_status")
            for total in (241, 500, 501):
                seed_count(db, total)
                resolved = request_json(
                    base_url,
                    f"/api/smart-collections/{collection_id}/resolve",
                    "POST",
                    {"expectedRevision": 2, "limit": 120},
                )
                require(
                    resolved.status == 200
                    and resolved.payload["total"] == total
                    and len(resolved.payload["resolvedCandidateIds"]) == 120
                    and resolved.payload["truncated"] is True,
                    f"cardinality_{total}",
                )
                checks.append({"step": f"cardinality_{total}", "total": total})
            seed_unindexed_rss(db)
            rss_before = request_json(
                base_url,
                f"/api/smart-collections/{collection_id}/resolve",
                "POST",
                {"expectedRevision": 2, "limit": 120},
            )
            require(len(rss_before.payload["unusableCandidates"]) == 1, "rss_unindexed")
            seed_explicit_index(db)
            filtered = {**definition(), "name": "US evidence updated", "query": "alpha", "sources": ["Reuters"]}
            current = request_json(
                base_url,
                f"/api/smart-collections/{collection_id}",
                "PUT",
                {**filtered, "expectedRevision": 2},
            )
            require(current.status == 200, "filtered_update")
            rss_after = request_json(
                base_url,
                f"/api/smart-collections/{collection_id}/resolve",
                "POST",
                {"expectedRevision": 3, "limit": 120},
            )
            require(
                rss_after.payload["total"] == 1
                and rss_after.payload["executionUniverseIds"] == ["doc-9000"]
                and rss_after.payload["unusableCandidates"] == [],
                "rss_indexed_exactly_once",
            )
            epochs.append({"epoch": 1, "pid": process.pid, "exitCode": stop_server(process)})
            process = start_server(server, output)
            wait_ready(process, base_url)
            restarted = request_json(base_url, f"/api/smart-collections/{collection_id}", "GET")
            require(restarted.status == 200 and restarted.payload["collection"]["revision"] == 3, "restart_get")
            deleted = request_json(
                base_url,
                f"/api/smart-collections/{collection_id}",
                "DELETE",
                {"expectedRevision": 3},
            )
            require(deleted.status == 200 and deleted.payload["storeRevision"] == 4, "delete")
            primary = runtime / "smart-collections.json"
            backup = runtime / "smart-collections.json.bak"
            primary.write_text("{broken", encoding="utf-8")
            backup.write_text("{also-broken", encoding="utf-8")
            before = (primary.read_bytes(), backup.read_bytes())
            corrupt = request_json(base_url, "/api/smart-collections", "GET")
            require(corrupt.status == 503 and corrupt.payload == {"error": "collection_store_unavailable"}, "corrupt_503")
            require((primary.read_bytes(), backup.read_bytes()) == before, "corrupt_no_overwrite")
            epochs.append({"epoch": 2, "pid": process.pid, "exitCode": stop_server(process)})
            process = None
        checks.extend(
            [
                {"step": "rss_unindexed", "rssGeneration": rss_before.payload["rssGeneration"]},
                {"step": "rss_indexed", "universe": rss_after.payload["executionUniverseIds"]},
                {"step": "restart_delete_corruption", "status": corrupt.status},
            ]
        )
        passed = True
    except (QaFailure, OSError, urllib.error.URLError, json.JSONDecodeError) as error:
        failure = str(error)
    finally:
        if process is not None:
            stop_server(process)
        if runtime.exists():
            remove_tree(runtime)
        write_json(attempt / "http-summary.json", checks)
        write_json(attempt / "restart-receipt.json", epochs)
        write_json(attempt / "cleanup-receipt.json", {"serverStopped": True, "runtimeRemoved": not runtime.exists()})
        write_json(
            attempt / "index.json",
            {
                "scenario": "smart-collections",
                "passed": passed,
                "failure": failure or None,
                "evidence": ["http-summary.json", "restart-receipt.json", "server.log", "cleanup-receipt.json"],
            },
        )
    return 0 if passed else 4
