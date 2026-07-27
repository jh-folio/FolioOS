from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path
from unittest.mock import patch

from starlette.responses import Response

from features.investment_notes import service as note_service
from features.investment_notes.intelligence import IntelligenceRuntime, IntelligenceService
from features.investment_notes.intelligence_routes import IntelligenceBoundary
from features.thesis_tracking import model as thesis_model
from features.thesis_tracking import store as thesis_store


NOW = datetime(2026, 7, 27, 12, 0, tzinfo=UTC)


def payload(response: Response) -> dict:
    parsed = json.loads(response.body)
    assert isinstance(parsed, dict)
    return parsed


def boundary(tmp_path: Path) -> tuple[IntelligenceBoundary, str]:
    notes_dir = tmp_path / "investment-notes"
    database = tmp_path / "market-memory.sqlite3"
    with patch.object(note_service, "NOTES_DIR", notes_dir), patch.object(
        note_service,
        "MARKET_MEMORY_DB_PATH",
        database,
    ):
        note = note_service.save_note(
            {
                "id": "note-review",
                "title": "NVDA review",
                "body": "private hypothesis body",
                "ticker": "NVDA",
                "linkedReports": ["NVDA:2026-07-27"],
            }
        )
    connection = thesis_store.connect(database)
    try:
        thesis_store.upsert_thesis(
            connection,
            thesis_model.Thesis(
                ticker="NVDA",
                company="NVIDIA",
                review_cycle="weekly",
                last_reviewed_at="2026-07-25",
                next_checkpoints=["다음 실적 확인"],
            ),
        )
    finally:
        connection.close()
    service = IntelligenceService(
        IntelligenceRuntime(dataDir=tmp_path, clock=lambda: NOW)
    )
    return IntelligenceBoundary(service), note["id"]


def test_note_intelligence_is_rules_only_and_excludes_private_body(tmp_path: Path) -> None:
    api, note_id = boundary(tmp_path)
    canonical = tmp_path / "briefings" / "2026-07-27.json"
    canonical.parent.mkdir()
    canonical.write_bytes(b'{"markdown":"canonical"}')
    before = canonical.read_bytes()

    response = api.note(note_id)
    body = payload(response)

    assert response.status_code == 200
    assert body["note"] == {
        "id": note_id,
        "ticker": "NVDA",
        "title": "NVDA review",
        "linkedReports": ["NVDA:2026-07-27"],
    }
    assert "body" not in json.dumps(body)
    assert body["layer"] == "hypothesis"
    assert body["reuseAsEvidence"] is False
    assert body["reviewState"]["revision"] == 0
    assert body["latestDelta"] is None
    assert body["marketStateRef"]["status"] == "empty"
    assert body["checkpointCounts"] == {
        "open": 1,
        "due": 0,
        "checked": 0,
        "invalidated": 0,
    }
    assert canonical.read_bytes() == before


def test_thesis_review_and_checkpoint_update_are_revision_safe(tmp_path: Path) -> None:
    api, note_id = boundary(tmp_path)
    review = payload(api.thesis("NVDA"))
    checkpoint_id = review["reviewState"]["checkpoints"][0]["id"]

    updated_response = api.update_checkpoint(
        "NVDA",
        {
            "noteId": note_id,
            "checkpointId": checkpoint_id,
            "state": "checked",
            "expectedRevision": 0,
        },
    )
    updated = payload(updated_response)

    assert updated_response.status_code == 200
    assert updated["reviewState"]["revision"] == 1
    assert updated["reviewState"]["checkpoints"][0]["state"] == "checked"
    assert updated["checkpointCounts"]["checked"] == 1

    stale = api.update_checkpoint(
        "NVDA",
        {
            "noteId": note_id,
            "checkpointId": checkpoint_id,
            "state": "invalidated",
            "expectedRevision": 0,
        },
    )
    assert stale.status_code == 409
    assert payload(stale)["error"] == "review_state_revision_conflict"


def test_intelligence_boundary_returns_bounded_4xx_errors(tmp_path: Path) -> None:
    api, note_id = boundary(tmp_path)
    assert api.note("../private").status_code == 422
    assert api.thesis("NVDA!").status_code == 422
    missing = api.note("note-missing")
    assert missing.status_code == 404
    assert payload(missing) == {"error": "note_not_found"}

    bad_update = api.update_checkpoint(
        "NVDA",
        {
            "noteId": note_id,
            "checkpointId": "not-present",
            "state": "checked",
            "expectedRevision": 0,
            "extra": True,
        },
    )
    assert bad_update.status_code == 422
    assert payload(bad_update)["error"] == "validation_error"


def test_router_exposes_only_the_three_planned_routes(tmp_path: Path) -> None:
    api, _ = boundary(tmp_path)
    routes = {
        (route.path, tuple(sorted(route.methods or ())))
        for route in api.router().routes
    }
    assert routes == {
        (
            "/api/investment-notes/{note_id}/intelligence",
            ("GET",),
        ),
        (
            "/api/theses/{ticker}/review",
            ("GET",),
        ),
        (
            "/api/theses/{ticker}/review/checkpoints",
            ("POST",),
        ),
    }
