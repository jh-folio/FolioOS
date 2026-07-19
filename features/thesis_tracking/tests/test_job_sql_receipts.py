from __future__ import annotations

from features.market_memory.tests.sql_receipt_test_support import (
    NOW,
    connection,
    projection,
)
from features.thesis_tracking.job_writes import (
    commit_thesis_delta,
    prepare_thesis_delta,
    recover_thesis_delta,
)


def test_thesis_delta_row_and_receipt_commit_atomically() -> None:
    # Given
    database = connection()
    delta = {
        "deltaId": "delta-1",
        "generatedAt": NOW,
        "period": "90d",
        "periodDays": 90,
        "verdict": "maintained",
        "summary": "가설은 유지된다.",
        "evidence": [],
    }
    prepared = prepare_thesis_delta(
        database,
        ticker="NVDA",
        delta=delta,
        job_id="job-1",
        operation_id="op-thesis-1",
        terminal_projection=projection("thesis_delta", "delta-1"),
        created_at=NOW,
    )
    assert database.execute("SELECT COUNT(*) FROM thesis_delta").fetchone()[0] == 0

    # When
    committed = commit_thesis_delta(database, prepared)

    # Then
    assert committed.target_hash == prepared.target_hash
    assert recover_thesis_delta(database, prepared) == prepared.terminal_projection
    assert database.execute("SELECT COUNT(*) FROM thesis_delta").fetchone()[0] == 1
    assert database.execute("SELECT COUNT(*) FROM job_operation_receipts").fetchone()[0] == 1
    assert database.execute(
        "SELECT created_at FROM thesis_delta WHERE delta_id='delta-1'"
    ).fetchone()[0] == NOW
