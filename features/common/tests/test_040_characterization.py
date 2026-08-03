from __future__ import annotations

import sqlite3
from pathlib import Path

from features.common.research_library.rss.store import ensure_evidence_store
from features.market_memory.snapshot import ensure_snapshot_table
import features.market_widgets.service as widget_service
import features.portfolio.service as portfolio_service


def test_evidence_store_additive_migration_preserves_legacy_rows() -> None:
    with sqlite3.connect(":memory:") as conn:
        conn.execute(
            "CREATE TABLE evidence_items (id TEXT PRIMARY KEY, collector TEXT NOT NULL, source_type TEXT NOT NULL, "
            "source TEXT NOT NULL, title TEXT NOT NULL, url TEXT NOT NULL, normalized_url TEXT NOT NULL, "
            "published_at_utc TEXT NOT NULL, collected_at_utc TEXT NOT NULL, query TEXT NOT NULL, query_source TEXT NOT NULL, "
            "summary TEXT NOT NULL, collection_status TEXT NOT NULL, relevance_score REAL NOT NULL, search_score REAL, "
            "related_tickers TEXT NOT NULL, related_themes TEXT NOT NULL, event_id TEXT NOT NULL, narrative_ids TEXT NOT NULL, "
            "reliability_tier INTEGER NOT NULL, markdown_path TEXT NOT NULL)"
        )
        conn.execute(
            "INSERT INTO evidence_items VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            ("old", "rss", "news", "Reuters", "Title", "u", "u", "", "", "", "", "", "summary_only", 1, None, "[]", "[]", "", "[]", 2, "x.md"),
        )
        ensure_evidence_store(conn)
        row = conn.execute("SELECT intake_stage, signal_status, markets FROM evidence_items WHERE id='old'").fetchone()
        assert row == ("evidence", "", "[]")


def test_market_memory_snapshot_authority_table_is_payload_json() -> None:
    with sqlite3.connect(":memory:") as conn:
        conn.row_factory = sqlite3.Row
        ensure_snapshot_table(conn)
        columns = {row[1] for row in conn.execute("PRAGMA table_info(market_state_snapshots)")}
        assert {"snapshot_id", "payload_json"} <= columns


def test_missing_widget_settings_use_service_defaults(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(widget_service, "SETTINGS_PATH", tmp_path / "missing.json")
    payload = widget_service.get_market_widget_settings()
    assert [row["id"] for row in payload["dashboard"]["widgets"]] == [
        row["id"] for row in widget_service.DEFAULT_SETTINGS["dashboard"]["widgets"]
    ]
    assert payload["dashboard"]["widgets"][1]["symbol"] == "NASDAQ:NVDA"


def test_missing_portfolio_is_empty_state(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(portfolio_service, "PORTFOLIO_PATH", tmp_path / "missing.json")
    payload = portfolio_service.get_portfolio()
    assert payload["positions"] == []
    assert payload["cash"] == []
    assert payload["revision"] == 0
