from datetime import UTC, datetime
from pathlib import Path

from features.watchlist_notes import service


NOW = datetime(2026, 7, 27, 9, 30, tzinfo=UTC)


def test_watchlist_checkpoint_context_is_ticker_scoped_and_body_free() -> None:
    payload = service.watchlist_checkpoint_context(
        watchlist=["NVDA"],
        notes=[
            {
                "id": "nvda-due",
                "noteType": "checkpoint",
                "title": "NVDA 실적 확인",
                "ticker": "NVDA",
                "body": "마진 가설 원문",
                "dueDate": "2026-07-27",
            },
            {
                "id": "msft-overdue",
                "noteType": "checkpoint",
                "title": "MSFT 확인",
                "ticker": "MSFT",
                "body": "다른 종목 가설",
                "dueDate": "2026-07-20",
            },
        ],
        clock=lambda: NOW,
    )

    assert payload["count"] == 1
    assert payload["dueCount"] == 1
    assert payload["overdueCount"] == 0
    assert payload["checkpoints"][0]["id"] == "nvda-due"
    assert "body" not in payload["checkpoints"][0]
    assert payload["checkpoints"][0]["reuseAsEvidence"] is False


def test_checkpoint_projection_does_not_rewrite_watchlist(tmp_path: Path) -> None:
    watchlist_path = tmp_path / "watchlist.json"
    original = b'[\"NVDA\"]\n'
    watchlist_path.write_bytes(original)

    payload = service.watchlist_checkpoint_context(
        watchlist=["NVDA"],
        notes=[],
        clock=lambda: NOW,
    )

    assert payload == {
        "count": 0,
        "dueCount": 0,
        "overdueCount": 0,
        "checkpoints": [],
    }
    assert watchlist_path.read_bytes() == original
