from datetime import UTC, datetime

from features.investment_notes.checkpoints import (
    CheckpointDueState,
    checkpoint_projection,
    normalize_checkpoint_fields,
    project_checkpoint_notes,
)


NOW = datetime(2026, 7, 27, 9, 30, tzinfo=UTC)


def test_legacy_checkpoint_defaults_to_open_with_unknown_date() -> None:
    legacy = {
        "id": "legacy-checkpoint",
        "noteType": "checkpoint",
        "title": "다음 실적 확인",
        "ticker": "NVDA",
        "body": "사용자 가설 본문",
    }

    projected = checkpoint_projection(legacy, clock=lambda: NOW)

    assert projected["checkpointState"] == "open"
    assert projected["dueDate"] == ""
    assert projected["lastCheckedDate"] == ""
    assert projected["linkedCollectionIds"] == []
    assert projected["dueState"] == "unknown"
    assert projected["layer"] == "hypothesis"
    assert projected["reuseAsEvidence"] is False


def test_due_state_is_deterministic_with_injected_clock() -> None:
    assert checkpoint_projection(
        {"noteType": "checkpoint", "checkpointState": "open", "dueDate": "2026-07-26"},
        clock=lambda: NOW,
    )["dueState"] == CheckpointDueState.OVERDUE
    assert checkpoint_projection(
        {"noteType": "checkpoint", "checkpointState": "open", "dueDate": "2026-07-27"},
        clock=lambda: NOW,
    )["dueState"] == CheckpointDueState.DUE
    assert checkpoint_projection(
        {"noteType": "checkpoint", "checkpointState": "open", "dueDate": "2026-07-28"},
        clock=lambda: NOW,
    )["dueState"] == CheckpointDueState.UPCOMING
    assert checkpoint_projection(
        {"noteType": "checkpoint", "checkpointState": "checked", "dueDate": "2026-07-20"},
        clock=lambda: NOW,
    )["dueState"] == CheckpointDueState.CHECKED
    assert checkpoint_projection(
        {"noteType": "checkpoint", "checkpointState": "invalidated", "dueDate": "2026-07-20"},
        clock=lambda: NOW,
    )["dueState"] == CheckpointDueState.INVALIDATED


def test_due_state_uses_korean_calendar_day() -> None:
    """UTC 22:00 = KST 다음날 07:00. 장 시작 전에 마감일이 하루 이르면 안 된다."""
    before_market_open = datetime(2026, 8, 14, 22, 0, tzinfo=UTC)

    assert checkpoint_projection(
        {"noteType": "checkpoint", "checkpointState": "open", "dueDate": "2026-08-15"},
        clock=lambda: before_market_open,
    )["dueState"] == CheckpointDueState.DUE
    assert checkpoint_projection(
        {"noteType": "checkpoint", "checkpointState": "open", "dueDate": "2026-08-14"},
        clock=lambda: before_market_open,
    )["dueState"] == CheckpointDueState.OVERDUE
    assert checkpoint_projection(
        {"noteType": "checkpoint", "checkpointState": "open", "dueDate": "2026-08-16"},
        clock=lambda: before_market_open,
    )["dueState"] == CheckpointDueState.UPCOMING


def test_checkpoint_fields_are_controlled_and_bounded() -> None:
    fields = normalize_checkpoint_fields(
        {
            "checkpointState": "invented",
            "dueDate": "2026-02-31",
            "lastCheckedDate": "not-a-date",
            "linkedCollectionIds": [
                "power-grid",
                "power-grid",
                "../escape",
                *[f"collection-{index}" for index in range(30)],
            ],
        }
    )

    assert fields["checkpointState"] == "open"
    assert fields["dueDate"] == ""
    assert fields["lastCheckedDate"] == ""
    assert fields["linkedCollectionIds"] == [
        "power-grid",
        *[f"collection-{index}" for index in range(19)],
    ]


def test_checkpoint_projection_is_bounded_sorted_and_body_free() -> None:
    notes = [
        {
            "id": f"cp-{index}",
            "noteType": "checkpoint",
            "title": f"Checkpoint {index}",
            "body": f"private hypothesis {index}",
            "ticker": "NVDA",
            "checkpointState": "open",
            "dueDate": f"2026-07-{20 + index:02d}",
            "linkedReports": ["NVDA:2026-07-27"],
            "linkedCollectionIds": ["ai-watch"],
        }
        for index in range(12)
    ]

    rows = project_checkpoint_notes(notes, clock=lambda: NOW, ticker="NVDA", limit=4)

    assert [row["id"] for row in rows] == ["cp-0", "cp-1", "cp-2", "cp-3"]
    assert all("body" not in row for row in rows)
    assert all(row["layer"] == "hypothesis" for row in rows)
    assert all(row["reuseAsEvidence"] is False for row in rows)
    assert all("evidenceCount" not in row for row in rows)
