import datetime as dt
import json
import sqlite3
from unittest.mock import patch

from features.common.research_library.indexing import service as indexing_service
from features.investment_notes import service as notes_service
from features.pixel_office.schema import OBJECT_ORDER
from features.pixel_office.service import (
    _read_index_summary,
    _read_note_summary_rows,
    pixel_office_payload,
)


def _loaders(**overrides):
    values = {
        "index": {"count": 0, "generatedAt": ""},
        "market": {"drivers": [], "freshness": {}},
        "topic_reports": [],
        "briefings": [],
        "analysis_reports": [],
        "notes": [],
        "portfolio": {"positions": [], "cash": []},
        "watchlist": [],
        "jobs": [],
    }
    values.update(overrides)
    return {name: (lambda value=value: value) for name, value in values.items()}


def _objects(payload):
    return {row["id"]: row for row in payload["objects"]}


def test_clean_workspace_returns_every_explicit_object_state():
    payload = pixel_office_payload(loaders=_loaders())
    objects = _objects(payload)

    assert list(objects) == list(OBJECT_ORDER)
    assert all(row["state"] in {"empty", "ready"} for row in objects.values())
    assert payload["agent"]["attentionCount"] == 0


def test_source_failure_is_isolated_to_its_objects():
    loaders = _loaders(index={"count": 4, "generatedAt": "2026-07-28T09:00:00+09:00"})

    def broken_market():
        raise RuntimeError("database path and private details")

    loaders["market"] = broken_market
    payload = pixel_office_payload(loaders=loaders)
    objects = _objects(payload)

    assert objects["market_board"]["state"] == "error"
    assert objects["news_desk"]["state"] == "ready"
    assert "database path" not in json.dumps(payload, ensure_ascii=False)


def test_response_redacts_job_note_and_portfolio_details():
    payload = pixel_office_payload(
        loaders=_loaders(
            notes=[{
                "id": "note-1",
                "title": "Private thesis",
                "summary": "secret note body",
                "updatedAt": "2026-07-28T09:00:00+09:00",
            }],
            portfolio={
                "positions": [{"ticker": "SECRET", "quantity": 99, "averageCost": 123.45}],
                "cash": [{"currency": "USD", "amount": 100000}],
            },
            jobs=[{
                "id": "job-1",
                "kind": "agent_bridge",
                "status": "failed",
                "traceback": "private stack",
                "error": "secret token",
                "result": {"markdown": "private report"},
                "createdAt": "2026-07-28T09:00:00+09:00",
            }],
        )
    )
    encoded = json.dumps(payload, ensure_ascii=False)

    assert "secret note body" not in encoded
    assert "SECRET" not in encoded
    assert "private stack" not in encoded
    assert "secret token" not in encoded
    assert payload["agent"] == {
        "attentionCount": 1,
        "latestJobId": "job-1",
        "latestJobStatus": "failed",
    }


def test_active_jobs_drive_related_busy_states_and_old_news_is_stale():
    payload = pixel_office_payload(
        loaders=_loaders(
            index={"count": 12, "generatedAt": "2026-07-20T09:00:00+00:00"},
            topic_reports=[{"id": "topic", "generatedAt": "2026-07-27T09:00:00+00:00"}],
            jobs=[
                {
                    "id": "job-2",
                    "kind": "topic_report",
                    "status": "running",
                    "createdAt": "2026-07-28T09:00:00+00:00",
                },
                {
                    "id": "job-3",
                    "kind": "rss_archive",
                    "status": "running",
                    "createdAt": "2026-07-28T09:00:00+00:00",
                },
            ],
        ),
        current_time=dt.datetime(2026, 7, 28, 12, 0, tzinfo=dt.timezone.utc),
    )
    objects = _objects(payload)

    assert objects["news_desk"]["state"] == "busy"
    assert objects["news_desk"]["stale"] is True
    assert objects["research_desk"]["state"] == "busy"
    assert objects["agent_seat"]["state"] == "busy"


def test_job_source_failure_marks_only_agent_seat_as_error():
    loaders = _loaders(index={"count": 1, "generatedAt": "2026-07-28T09:00:00+00:00"})

    def broken_jobs():
        raise RuntimeError("private job persistence error")

    loaders["jobs"] = broken_jobs
    payload = pixel_office_payload(loaders=loaders)
    objects = _objects(payload)

    assert objects["agent_seat"]["state"] == "error"
    assert objects["news_desk"]["state"] == "ready"
    assert payload["agent"]["latestJobId"] == ""


def test_default_index_summary_reads_sqlite_without_building(tmp_path):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    db_path = data_dir / "research-index.sqlite3"
    with sqlite3.connect(db_path) as conn:
        conn.execute("CREATE TABLE documents (id TEXT PRIMARY KEY)")
        conn.executemany("INSERT INTO documents(id) VALUES (?)", [("a",), ("b",)])
    (data_dir / "index.json").write_text(
        '{"count": 99, "generatedAt": "2026-07-28T09:00:00+09:00"}',
        encoding="utf-8",
    )

    with (
        patch.object(indexing_service, "DATA_DIR", data_dir),
        patch.object(indexing_service, "RESEARCH_DB_PATH", db_path),
    ):
        summary = _read_index_summary()

    assert summary == {
        "count": 2,
        "generatedAt": "2026-07-28T09:00:00+09:00",
    }


def test_default_note_summary_never_reads_note_body(tmp_path):
    notes_dir = tmp_path / "notes"
    notes_dir.mkdir()
    db_path = tmp_path / "market-memory.sqlite3"
    with sqlite3.connect(db_path) as conn:
        conn.execute(
            """
            CREATE TABLE native_note_index (
                note_id TEXT,
                updated_at TEXT,
                reuse_as_evidence INTEGER
            )
            """
        )
        conn.execute(
            "INSERT INTO native_note_index VALUES (?, ?, ?)",
            ("note-1", "2026-07-28T09:00:00+09:00", 0),
        )
    (notes_dir / "note-1.json").write_text(
        '{"id":"note-1","body":"must never be read"}',
        encoding="utf-8",
    )

    with (
        patch.object(notes_service, "MARKET_MEMORY_DB_PATH", db_path),
        patch.object(notes_service, "NOTES_DIR", notes_dir),
    ):
        rows = _read_note_summary_rows()

    assert rows == [{"id": "note-1", "updatedAt": "2026-07-28T09:00:00+09:00"}]
